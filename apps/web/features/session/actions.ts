"use server";
// Pratik oturumu server action'ları. Hepsi oturum sahibini doğrular ve tekrar gönderime dayanıklıdır.
import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { loadQuestions } from "@/lib/content/load";
import { db, schema } from "@/lib/db";
import { gradeAnswer } from "@/lib/domain/sm2";
import { requireUser } from "@/lib/session";
import type { AnswerRecord } from "./session-machine";
import { applyAdvance, getOwnedSession, pickSessionQuestions, upsertReview, WARMUP_GRADE } from "./server";

const { practiceSessions, attempts } = schema;
const OPTION_KEYS = ["A", "B", "C", "D", "E"];

/** Kalıcı hatalar sonuç olarak döner (production'da fırlatılan hata mesajları istemciye ulaşmaz); kuyruk bunları yeniden denemez. */
export type ActionResult = { ok: true } | { ok: false; error: "not_found" | "invalid" };
const OK: ActionResult = { ok: true };
const NOT_FOUND: ActionResult = { ok: false, error: "not_found" };

async function owned(sessionId: string) {
  const user = await requireUser();
  const row = typeof sessionId === "string" ? await getOwnedSession(user.id, sessionId) : null;
  return row ? { user, row } : null;
}

const byId = (id: string) => eq(practiceSessions.id, id);

export async function startSession(): Promise<void> {
  const user = await requireUser();
  const id = crypto.randomUUID();
  await db.insert(practiceSessions).values({
    id, userId: user.id, questionIds: pickSessionQuestions(await loadQuestions()),
  });
  redirect(`/oturum/${id}`);
}

export async function recordAnswer(sessionId: string, questionId: string, a: AnswerRecord, durationMs: number): Promise<ActionResult> {
  const o = await owned(sessionId);
  if (!o || !o.row.questionIds.includes(questionId)) return NOT_FOUND;
  const { user } = o;
  if (!OPTION_KEYS.includes(a?.choice)) return { ok: false, error: "invalid" };
  const q = (await loadQuestions()).find((x) => x.id === questionId);
  if (!q) return NOT_FOUND;

  const correct = a.choice === q.answer;
  const inserted = await db.insert(attempts).values({
    userId: user.id, sessionId, questionId, choice: a.choice, correct, sure: !!a.sure,
    glossUsed: !!a.glossUsed, hintUsed: !!a.hintUsed, wordsUsed: !!a.wordsUsed,
    durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : null,
  }).onConflictDoNothing({ target: [attempts.sessionId, attempts.questionId] }).returning({ id: attempts.id });

  if (inserted.length) await upsertReview(user.id, "question", questionId, gradeAnswer(correct, !!a.sure), new Date());
  return OK;
}

export async function advance(sessionId: string, position: number): Promise<ActionResult> {
  const o = await owned(sessionId);
  if (!o) return NOT_FOUND;
  const { row } = o;
  const next = applyAdvance(row.position, Math.trunc(position), row.questionIds.length);
  await db.update(practiceSessions).set({
    position: next.position,
    finishedAt: next.finished ? (row.finishedAt ?? new Date()) : row.finishedAt,
    updatedAt: new Date(),
  }).where(byId(sessionId));
  return OK;
}

export async function recordWarmup(sessionId: string, word: string, correct: boolean): Promise<ActionResult> {
  const o = await owned(sessionId);
  if (!o) return NOT_FOUND;
  if (typeof word !== "string" || !word) return { ok: false, error: "invalid" };
  const { user } = o;
  // Kelime bu oturumda daha önce notlandıysa hiçbir şey yapma (tek UPDATE, yarış güvenli).
  const updated = await db.update(practiceSessions).set({
    warmAnswers: sql`${practiceSessions.warmAnswers} || jsonb_build_object(${word}::text, ${!!correct}::boolean)`,
    updatedAt: new Date(),
  }).where(and(byId(sessionId), sql`not (${practiceSessions.warmAnswers} ? ${word}::text)`))
    .returning({ id: practiceSessions.id });

  if (updated.length)
    await upsertReview(user.id, "word", word, correct ? WARMUP_GRADE.correct : WARMUP_GRADE.wrong, new Date());
  return OK;
}

export async function markWarmDone(sessionId: string, block: number): Promise<ActionResult> {
  if (!(await owned(sessionId))) return NOT_FOUND;
  const b = Math.trunc(block);
  await db.update(practiceSessions).set({
    warmDone: sql`${practiceSessions.warmDone} || jsonb_build_array(${b}::int)`,
    updatedAt: new Date(),
  }).where(and(byId(sessionId), sql`not (${practiceSessions.warmDone} @> jsonb_build_array(${b}::int))`));
  return OK;
}

export async function markBreakSeen(sessionId: string): Promise<ActionResult> {
  if (!(await owned(sessionId))) return NOT_FOUND;
  await db.update(practiceSessions).set({ breakSeen: true, updatedAt: new Date() }).where(byId(sessionId));
  return OK;
}
