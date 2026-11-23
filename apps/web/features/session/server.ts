// Oturum verisi için sunucu tarafı sorgular. Sadece sunucu bileşenleri ve server action'lar kullanır.
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { getAllQuestions, getQuestionsByIds } from "@/lib/content/repo";
import { topicKey } from "@/lib/content/topics";
import { TRAP_NAMES } from "@/lib/content/schema";
import { TRAP_GUIDE } from "@/lib/content/traps";
import { db, schema } from "@/lib/db";
import { newReviewState, type ReviewState } from "@/lib/domain/sm2";
import { tipOfDay } from "@/features/dashboard/stats";
import { attemptRows, reviewRows } from "@/features/progress/server";
import { trapStats } from "@/features/traps/stats";
import { dayEnd, todayKey, weekDaysDone } from "./day";
import {
  canRecreate, DAILY_QUESTIONS, DAILY_REVIEW_WORDS, MAX_DUE_QUESTIONS, pickDailyQuestions, pickReviewWords, retiredQuestions, vocabByWord,
  wrongTopicKeys,
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

/** Bugünün içeriği: zamanı gelen + yeni sorular ve zamanı gelen kelimeler (spec §5.3–5.4). Satır oluşturmaz. */
export async function planToday(userId: string, now: Date): Promise<{ questionIds: string[]; reviewWords: string[]; dueCount: number }> {
  const [questions, questionReviews, wordReviews, userAttempts] = await Promise.all([
    getAllQuestions(userId), reviewRows(userId, "question"), reviewRows(userId, "word"), attemptRows(userId),
  ]);
  const dueBefore = dayEnd(now);
  // Emekli sorular gelmez; yanlış yapılan konulardan yeni sorular öne alınır (spec §5).
  const topicOf = new Map(questions.map((q) => [q.id, topicKey(q.type, q.topic)]));
  const questionIds = pickDailyQuestions({
    questionIds: questions.map((q) => q.id), reviews: questionReviews, dueBefore, size: DAILY_QUESTIONS, maxDue: MAX_DUE_QUESTIONS,
    retired: retiredQuestions(userAttempts),
    boost: { topicKey: topicOf, keys: wrongTopicKeys(userAttempts, topicOf) },
  });
  const reviewed = new Set(questionReviews.map((r) => r.itemId));
  return {
    questionIds,
    dueCount: questionIds.filter((id) => reviewed.has(id)).length,
    reviewWords: pickReviewWords({
      reviews: wordReviews, known: new Set(vocabByWord(questions).keys()), dueBefore, size: DAILY_REVIEW_WORDS,
    }),
  };
}

/** Oturumu bitirilmiş günler ("YYYY-MM-DD"). Haftalık hedef (affedici seri) bunlardan hesaplanır. */
export async function finishedDays(userId: string): Promise<string[]> {
  const rows = await db.select({ day: practiceSessions.day }).from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), isNotNull(practiceSessions.finishedAt), isNotNull(practiceSessions.day)));
  return rows.map((r) => r.day!);
}

export async function loadSnapshot(userId: string, id: string): Promise<
  { ok: true; snapshot: Snapshot } | { ok: false; reason: "not_found" } | { ok: false; reason: "content_changed"; recreatable: boolean }
> {
  const row = await getOwnedSession(userId, id);
  if (!row) return { ok: false, reason: "not_found" };

  const byId = await getQuestionsByIds(userId, row.questionIds);
  const questions = row.questionIds.map((qid) => byId.get(qid));
  if (questions.some((q) => !q)) return { ok: false, reason: "content_changed", recreatable: canRecreate(row, todayKey(new Date())) };

  const [rows, known, allQuestions, reviewedQuestions, doneDays, userAttempts] = await Promise.all([
    db.select().from(attempts).where(and(eq(attempts.sessionId, id), eq(attempts.userId, userId))),
    db.select({ itemId: reviewItems.itemId }).from(reviewItems)
      .where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, "word"), gte(reviewItems.reps, 2))), // sm2.isKnown
    getAllQuestions(userId),
    reviewRows(userId, "question"),
    finishedDays(userId),
    // Tuzak uyarısı ve günün ipucu için kullanıcının bütün cevapları (pano ile aynı kaynak).
    attemptRows(userId),
  ]);

  const answers: Record<string, AnswerRecord> = {};
  for (const r of rows)
    answers[r.questionId] = {
      choice: r.choice as OptionKey, sure: r.sure,
      glossUsed: r.glossUsed, hintUsed: r.hintUsed, wordsUsed: r.wordsUsed,
    };

  const vocab = vocabByWord(allQuestions);
  const reviewed = new Set(reviewedQuestions.map((r) => r.itemId));
  const top = trapStats(userAttempts, new Map(allQuestions.map((q) => [q.id, q])))[0];
  const wrongIds = new Set(userAttempts.filter((a) => !a.correct).map((a) => a.questionId));
  // Konuya ilk giriş kartı için: günlük oturumda cevap verilmiş konular (spec §4.3).
  const allById = new Map(allQuestions.map((q) => [q.id, q]));
  const seenTopics = [...new Set(userAttempts.flatMap((a) => {
    const q = a.sessionId ? allById.get(a.questionId) : undefined;
    return q ? [topicKey(q.type, q.topic)] : [];
  }))];
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
      // Özet yalnızca oturum bitince görünür: bu oturumun günü bitmiş sayılır (henüz yazılmamış olsa da).
      weekDays: weekDaysDone(row.day ? [...doneDays, row.day] : doneDays, todayKey(new Date())),
      newLeft: allQuestions.filter((q) => !reviewed.has(q.id)).length,
      meaningPool: [...new Set([...vocab.values()].map((v) => v.tr))],
      topTrap: top ? { code: top.code, name: TRAP_NAMES[top.code], catch: TRAP_GUIDE[top.code].catch } : null,
      tip: tipOfDay({
        wrongRules: [...new Set(allQuestions.filter((q) => wrongIds.has(q.id)).map((q) => q.golden_rule))],
        allRules: [...new Set(allQuestions.map((q) => q.golden_rule))],
        today: todayKey(new Date()),
      }),
      seenTopics,
    },
  };
}

/** review_items satırını verilen adımla (SM-2 ya da soru kuralı) günceller; yoksa yeni durumdan başlatır. */
export async function upsertReview(
  userId: string, kind: "word" | "question", itemId: string, step: (s: ReviewState) => ReviewState, now: Date,
): Promise<void> {
  const [row] = await db.select().from(reviewItems)
    .where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, kind), eq(reviewItems.itemId, itemId))).limit(1);
  const next = step(row ?? newReviewState(now));
  const values = { ...next, lastReviewedAt: now };
  await db.insert(reviewItems).values({ userId, kind, itemId, ...values })
    .onConflictDoUpdate({ target: [reviewItems.userId, reviewItems.kind, reviewItems.itemId], set: values });
}

/** Bir oturumda doğru cevaplanan soru sayısı (ana sayfadaki "bugün tamam" özeti için). */
export async function correctCount(userId: string, sessionId: string): Promise<number> {
  const rows = await db.select({ correct: attempts.correct }).from(attempts)
    .where(and(eq(attempts.sessionId, sessionId), eq(attempts.userId, userId)));
  return rows.filter((r) => r.correct).length;
}
