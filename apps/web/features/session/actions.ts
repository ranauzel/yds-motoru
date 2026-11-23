"use server";
// Pratik oturumu server action'ları. Hepsi girdiyi doğrular (bkz. inputs.ts), oturum sahibini doğrular
// ve tekrar gönderime dayanıklıdır.
import { and, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getQuestion } from "@/lib/content/repo";
import { db, schema } from "@/lib/db";
import { review } from "@/lib/domain/sm2";
import { requireUser } from "@/lib/session";
import { AdvanceInput, AnswerInput, SessionIdInput, WarmDoneInput, WarmupInput } from "./inputs";
import { todayKey } from "./day";
import { REVIEW_BLOCK, type AnswerRecord } from "./session-machine";
import { questionReview } from "./rules";
import { applyAdvance, getOwnedSession, getTodaySession, planToday, upsertReview, WARMUP_GRADE } from "./server";

const { practiceSessions, attempts } = schema;

/** Kalıcı hatalar sonuç olarak döner (production'da fırlatılan hata mesajları istemciye ulaşmaz); kuyruk bunları yeniden denemez. */
export type ActionResult = { ok: true } | { ok: false; error: "not_found" | "invalid" };
const OK: ActionResult = { ok: true };
const NOT_FOUND: ActionResult = { ok: false, error: "not_found" };
const INVALID: ActionResult = { ok: false, error: "invalid" };

/** Doğrulanmış oturum kimliği için: oturum bu kullanıcıya aitse satırı döner. */
async function owned(sessionId: string) {
  const user = await requireUser();
  const row = await getOwnedSession(user.id, sessionId);
  return row ? { user, row } : null;
}

const byId = (id: string) => eq(practiceSessions.id, id);

/**
 * Bugünün oturumunu açar: varsa ona gider; yoksa içeriği bir kez seçip kaydeder. Günde tek oturum veritabanının
 * benzersiz indeksiyle garanti: aynı anda iki istek gelirse ikincisi çakışır ve var olan satıra yönlenir.
 */
export async function openTodaySession(): Promise<void> {
  const user = await requireUser();
  const now = new Date();
  const day = todayKey(now);
  const existing = await getTodaySession(user.id, day);
  if (existing) redirect(`/oturum/${existing.id}`);

  const plan = await planToday(user.id, now);
  if (!plan.questionIds.length && !plan.reviewWords.length) redirect("/"); // bugün iş yok (ya da hiç soru yok)
  await db.insert(practiceSessions)
    .values({ id: crypto.randomUUID(), userId: user.id, day, questionIds: plan.questionIds, reviewWords: plan.reviewWords })
    .onConflictDoNothing({ target: [practiceSessions.userId, practiceSessions.day] });
  const row = await getTodaySession(user.id, day);
  redirect(row ? `/oturum/${row.id}` : "/");
}

/**
 * İçerik değişip bugünün oturumu açılamaz hale gelirse: o satırı silip yeniden açar (SM-2 kayıtları kalır).
 * Yalnızca verilen oturum ve yalnızca bugünün bitmemiş oturumuysa silinir (canRecreate ile aynı kural).
 */
export async function recreateTodaySession(sessionId: string): Promise<void> {
  if (!SessionIdInput.safeParse(sessionId).success) redirect("/");
  const user = await requireUser();
  await db.delete(practiceSessions).where(and(
    byId(sessionId), eq(practiceSessions.userId, user.id),
    eq(practiceSessions.day, todayKey(new Date())), isNull(practiceSessions.finishedAt),
  ));
  await openTodaySession();
}

export async function recordAnswer(sessionId: string, questionId: string, answer: AnswerRecord, durationMs: number): Promise<ActionResult> {
  const input = AnswerInput.safeParse({ sessionId, questionId, answer, durationMs });
  if (!input.success) return INVALID;
  const { answer: a, durationMs: ms } = input.data;

  const session = await owned(sessionId);
  if (!session || !session.row.questionIds.includes(questionId)) return NOT_FOUND;
  const { user } = session;
  const q = await getQuestion(user.id, questionId);
  if (!q) return NOT_FOUND;

  const correct = a.choice === q.answer;
  const inserted = await db.insert(attempts).values({
    userId: user.id, sessionId, questionId, choice: a.choice, correct, sure: a.sure,
    glossUsed: a.glossUsed, hintUsed: a.hintUsed, wordsUsed: a.wordsUsed, durationMs: ms,
  }).onConflictDoNothing({ target: [attempts.sessionId, attempts.questionId] }).returning({ id: attempts.id });

  if (inserted.length) {
    const now = new Date();
    await upsertReview(user.id, "question", questionId, (s) => questionReview(s, { correct, ...a }, now), now);
  }
  return OK;
}

export async function advance(sessionId: string, position: number): Promise<ActionResult> {
  const input = AdvanceInput.safeParse({ sessionId, position });
  if (!input.success) return INVALID;

  const session = await owned(sessionId);
  if (!session) return NOT_FOUND;
  const { row } = session;
  const next = applyAdvance(row.position, input.data.position, row.questionIds.length);
  await db.update(practiceSessions).set({
    position: next.position,
    finishedAt: next.finished ? (row.finishedAt ?? new Date()) : row.finishedAt,
    updatedAt: new Date(),
  }).where(byId(sessionId));
  return OK;
}

export async function recordWarmup(sessionId: string, word: string, correct: boolean): Promise<ActionResult> {
  const input = WarmupInput.safeParse({ sessionId, word, correct });
  if (!input.success) return INVALID;

  const session = await owned(sessionId);
  if (!session) return NOT_FOUND;
  // Kelime bu oturumda daha önce notlandıysa hiçbir şey yapma (tek UPDATE, yarış güvenli).
  const updated = await db.update(practiceSessions).set({
    warmAnswers: sql`${practiceSessions.warmAnswers} || jsonb_build_object(${word}::text, ${correct}::boolean)`,
    updatedAt: new Date(),
  }).where(and(byId(sessionId), sql`not (${practiceSessions.warmAnswers} ? ${word}::text)`))
    .returning({ id: practiceSessions.id });

  if (updated.length) {
    const now = new Date();
    const grade = correct ? WARMUP_GRADE.correct : WARMUP_GRADE.wrong;
    await upsertReview(session.user.id, "word", word, (s) => review(s, grade, now), now);
  }
  return OK;
}

export async function markWarmDone(sessionId: string, block: number): Promise<ActionResult> {
  const input = WarmDoneInput.safeParse({ sessionId, block });
  if (!input.success) return INVALID;

  const session = await owned(sessionId);
  if (!session) return NOT_FOUND;
  // Sadece kelime olan oturumda (soru yok) son bölüm kelime tekrarıdır: bitince oturum da biter (bir kez yazılır).
  const finishes = block === REVIEW_BLOCK && session.row.questionIds.length === 0;
  await db.update(practiceSessions).set({
    warmDone: sql`${practiceSessions.warmDone} || jsonb_build_array(${block}::int)`,
    updatedAt: new Date(),
    ...(finishes ? { finishedAt: sql`coalesce(${practiceSessions.finishedAt}, now())` } : {}),
  }).where(and(byId(sessionId), sql`not (${practiceSessions.warmDone} @> jsonb_build_array(${block}::int))`));
  return OK;
}

export async function markBreakSeen(sessionId: string): Promise<ActionResult> {
  if (!SessionIdInput.safeParse(sessionId).success) return INVALID;

  if (!(await owned(sessionId))) return NOT_FOUND;
  await db.update(practiceSessions).set({ breakSeen: true, updatedAt: new Date() }).where(byId(sessionId));
  return OK;
}
