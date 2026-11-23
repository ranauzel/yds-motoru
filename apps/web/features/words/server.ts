// Kelimeler sayfası verisi: görünür sorulardaki kelimeler + kullanıcının kelime kayıtları.
import { and, eq } from "drizzle-orm";
import { getAllQuestions } from "@/lib/content/repo";
import { db, schema } from "@/lib/db";
import { vocabByWord } from "@/features/session/rules";
import { classifyWords, type WordRow, type WordStatus } from "./stats";

const { reviewItems } = schema;

export type WordCounts = Record<WordStatus, number>;

export async function wordsPageData(userId: string, now: Date): Promise<{ rows: WordRow[]; counts: WordCounts; now: string }> {
  const [questions, reviews] = await Promise.all([
    getAllQuestions(userId),
    db.select({ itemId: reviewItems.itemId, dueAt: reviewItems.dueAt, priority: reviewItems.priority, reps: reviewItems.reps })
      .from(reviewItems).where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, "word"))),
  ]);
  const rows = classifyWords(vocabByWord(questions), reviews);
  const counts: WordCounts = { learned: 0, reviewing: 0, new: 0 };
  for (const w of rows) counts[w.status]++;
  return { rows, counts, now: now.toISOString() };
}
