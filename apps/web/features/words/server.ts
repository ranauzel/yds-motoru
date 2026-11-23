// Kelimeler sayfası verisi: görünür sorulardaki kelimeler + kullanıcının kelime kayıtları.
import { getAllQuestions } from "@/lib/content/repo";
import { reviewRows } from "@/features/progress/server";
import { vocabByWord } from "@/features/session/rules";
import { classifyWords, type WordRow, type WordStatus } from "./stats";

export type WordCounts = Record<WordStatus, number>;

export async function wordsPageData(userId: string, now: Date): Promise<{ rows: WordRow[]; counts: WordCounts; now: string }> {
  const [questions, reviews] = await Promise.all([
    getAllQuestions(userId),
    reviewRows(userId, "word"),
  ]);
  const rows = classifyWords(vocabByWord(questions), reviews);
  const counts: WordCounts = { learned: 0, reviewing: 0, new: 0 };
  for (const w of rows) counts[w.status]++;
  return { rows, counts, now: now.toISOString() };
}
