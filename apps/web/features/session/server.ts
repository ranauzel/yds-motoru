// Oturum verisi için sunucu tarafı sorgular. Sadece sunucu bileşenleri ve server action'lar kullanır.
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { getQuestionsByIds } from "@/lib/content/repo";
import { db, schema } from "@/lib/db";
import { newReviewState, review, type Grade } from "@/lib/domain/sm2";
import type { AnswerRecord, OptionKey, Snapshot } from "./session-machine";

export { applyAdvance, pickSessionQuestions, WARMUP_GRADE } from "./rules";

const { practiceSessions, attempts, reviewItems } = schema;
export type PracticeSessionRow = typeof practiceSessions.$inferSelect;

export async function getOwnedSession(userId: string, id: string): Promise<PracticeSessionRow | null> {
  const [row] = await db.select().from(practiceSessions)
    .where(and(eq(practiceSessions.id, id), eq(practiceSessions.userId, userId))).limit(1);
  return row ?? null;
}

export async function latestUnfinishedSession(userId: string): Promise<{ id: string; position: number; total: number } | null> {
  const [row] = await db.select().from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), isNull(practiceSessions.finishedAt)))
    .orderBy(desc(practiceSessions.createdAt)).limit(1);
  return row ? { id: row.id, position: row.position, total: row.questionIds.length } : null;
}

export async function loadSnapshot(userId: string, id: string): Promise<
  { ok: true; snapshot: Snapshot } | { ok: false; reason: "not_found" | "content_changed" }
> {
  const row = await getOwnedSession(userId, id);
  if (!row) return { ok: false, reason: "not_found" };

  const byId = await getQuestionsByIds(row.questionIds);
  const questions = row.questionIds.map((qid) => byId.get(qid));
  if (questions.some((q) => !q)) return { ok: false, reason: "content_changed" };

  const [rows, known] = await Promise.all([
    db.select().from(attempts).where(and(eq(attempts.sessionId, id), eq(attempts.userId, userId))),
    db.select({ itemId: reviewItems.itemId }).from(reviewItems)
      .where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, "word"), gte(reviewItems.reps, 2))), // sm2.isKnown
  ]);

  const answers: Record<string, AnswerRecord> = {};
  for (const r of rows)
    answers[r.questionId] = {
      choice: r.choice as OptionKey, sure: r.sure,
      glossUsed: r.glossUsed, hintUsed: r.hintUsed, wordsUsed: r.wordsUsed,
    };

  return {
    ok: true,
    snapshot: {
      sessionId: row.id,
      questions: questions as NonNullable<(typeof questions)[number]>[],
      position: row.position,
      breakSeen: row.breakSeen,
      warmDone: row.warmDone,
      warmAnswers: row.warmAnswers,
      answers,
      knownWords: known.map((k) => k.itemId),
    },
  };
}

/** review_items satırını SM-2 ile günceller; yoksa yeni durumdan başlatır. */
export async function upsertReview(userId: string, kind: "word" | "question", itemId: string, grade: Grade, now: Date): Promise<void> {
  const [row] = await db.select().from(reviewItems)
    .where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, kind), eq(reviewItems.itemId, itemId))).limit(1);
  const next = review(row ?? newReviewState(now), grade, now);
  const values = { ...next, lastReviewedAt: now };
  await db.insert(reviewItems).values({ userId, kind, itemId, ...values })
    .onConflictDoUpdate({ target: [reviewItems.userId, reviewItems.kind, reviewItems.itemId], set: values });
}
