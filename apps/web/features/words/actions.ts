"use server";
// Serbest kelime çalışması: cevabı SM-2'ye yazar, günlük oturumu bozmaz (spec §5.6).
import { and, eq } from "drizzle-orm";
import { getAllQuestions } from "@/lib/content/repo";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dayEnd, todayKey } from "@/features/session/day";
import { vocabByWord, WARMUP_GRADE } from "@/features/session/rules";
import type { ActionResult } from "@/features/session/actions";
import { getTodaySession, upsertReview } from "@/features/session/server";
import { WordPracticeInput } from "./inputs";
import { shouldRecordWordPractice } from "./stats";

const { reviewItems } = schema;
const OK: ActionResult = { ok: true };
const INVALID: ActionResult = { ok: false, error: "invalid" };

export async function recordWordPractice(word: string, correct: boolean): Promise<ActionResult> {
  const input = WordPracticeInput.safeParse({ word, correct });
  if (!input.success) return INVALID;
  const user = await requireUser();
  const now = new Date();

  const [questions, today] = await Promise.all([getAllQuestions(user.id), getTodaySession(user.id, todayKey(now))]);
  if (!vocabByWord(questions).has(input.data.word)) return INVALID;
  if (today?.reviewWords.includes(input.data.word)) return INVALID; // bugünün oturumunda sorulacak

  const [review] = await db.select({ itemId: reviewItems.itemId, dueAt: reviewItems.dueAt, priority: reviewItems.priority, reps: reviewItems.reps })
    .from(reviewItems)
    .where(and(eq(reviewItems.userId, user.id), eq(reviewItems.kind, "word"), eq(reviewItems.itemId, input.data.word))).limit(1);
  if (shouldRecordWordPractice({ review: review ?? null, correct: input.data.correct, dueBefore: dayEnd(now) }))
    await upsertReview(user.id, "word", input.data.word, input.data.correct ? WARMUP_GRADE.correct : WARMUP_GRADE.wrong, now);
  return OK;
}
