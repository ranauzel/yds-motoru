// Oturum verisi için sunucu tarafı sorgular. Sadece sunucu bileşenleri ve server action'lar kullanır.
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { getAllQuestions, getQuestionsByIds } from "@/lib/content/repo";
import { db, schema } from "@/lib/db";
import { newReviewState, review, type Grade } from "@/lib/domain/sm2";
import { dayEnd, todayKey, weekDaysDone } from "./day";
import {
  DAILY_QUESTIONS, DAILY_REVIEW_WORDS, MAX_DUE_QUESTIONS, pickDailyQuestions, pickReviewWords, vocabByWord, type ReviewRow,
} from "./rules";
import type { AnswerRecord, OptionKey, Snapshot } from "./session-machine";

export { applyAdvance, WARMUP_GRADE } from "./rules";

const { practiceSessions, attempts, reviewItems } = schema;
export type PracticeSessionRow = typeof practiceSessions.$inferSelect;

export async function getOwnedSession(userId: string, id: string): Promise<PracticeSessionRow | null> {
  const [row] = await db.select().from(practiceSessions)
    .where(and(eq(practiceSessions.id, id), eq(practiceSessions.userId, userId))).limit(1);
  return row ?? null;
}

/** Kullanıcının verilen günün (İstanbul, "YYYY-MM-DD") oturumu. Günde en fazla bir tane olur. */
export async function getTodaySession(userId: string, day: string): Promise<PracticeSessionRow | null> {
  const [row] = await db.select().from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), eq(practiceSessions.day, day))).limit(1);
  return row ?? null;
}

async function reviewRows(userId: string, kind: "word" | "question"): Promise<ReviewRow[]> {
  return db.select({ itemId: reviewItems.itemId, dueAt: reviewItems.dueAt, priority: reviewItems.priority, reps: reviewItems.reps })
    .from(reviewItems).where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, kind)));
}

/** Bugünün içeriği: zamanı gelen + yeni sorular ve zamanı gelen kelimeler (spec §5.3–5.4). Satır oluşturmaz. */
export async function planToday(userId: string, now: Date): Promise<{ questionIds: string[]; reviewWords: string[] }> {
  const [questions, questionReviews, wordReviews] = await Promise.all([
    getAllQuestions(userId), reviewRows(userId, "question"), reviewRows(userId, "word"),
  ]);
  const dueBefore = dayEnd(now);
  return {
    questionIds: pickDailyQuestions({
      questionIds: questions.map((q) => q.id), reviews: questionReviews, dueBefore, size: DAILY_QUESTIONS, maxDue: MAX_DUE_QUESTIONS,
    }),
    reviewWords: pickReviewWords({
      reviews: wordReviews, known: new Set(vocabByWord(questions).keys()), dueBefore, size: DAILY_REVIEW_WORDS,
    }),
  };
}

/** Bu hafta oturumu bitirilmiş gün sayısı (affedici seri). */
export async function weekDaysFor(userId: string, now: Date): Promise<number> {
  const rows = await db.select({ day: practiceSessions.day }).from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), isNotNull(practiceSessions.finishedAt), isNotNull(practiceSessions.day)));
  return weekDaysDone(rows.map((r) => r.day!), todayKey(now));
}

export async function loadSnapshot(userId: string, id: string): Promise<
  { ok: true; snapshot: Snapshot } | { ok: false; reason: "not_found" | "content_changed" }
> {
  const row = await getOwnedSession(userId, id);
  if (!row) return { ok: false, reason: "not_found" };

  const byId = await getQuestionsByIds(userId, row.questionIds);
  const questions = row.questionIds.map((qid) => byId.get(qid));
  if (questions.some((q) => !q)) return { ok: false, reason: "content_changed" };

  const [rows, known, allQuestions, reviewedQuestions, weekDays] = await Promise.all([
    db.select().from(attempts).where(and(eq(attempts.sessionId, id), eq(attempts.userId, userId))),
    db.select({ itemId: reviewItems.itemId }).from(reviewItems)
      .where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, "word"), gte(reviewItems.reps, 2))), // sm2.isKnown
    getAllQuestions(userId),
    reviewRows(userId, "question"),
    weekDaysFor(userId, new Date()),
  ]);

  const answers: Record<string, AnswerRecord> = {};
  for (const r of rows)
    answers[r.questionId] = {
      choice: r.choice as OptionKey, sure: r.sure,
      glossUsed: r.glossUsed, hintUsed: r.hintUsed, wordsUsed: r.wordsUsed,
    };

  const vocab = vocabByWord(allQuestions);
  const reviewed = new Set(reviewedQuestions.map((r) => r.itemId));
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
      reviewVocab: row.reviewWords.flatMap((w) => vocab.get(w) ?? []),
      weekDays,
      newLeft: allQuestions.filter((q) => !reviewed.has(q.id)).length,
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
