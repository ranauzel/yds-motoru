// Tuzaklarım sayfası verisi: kullanıcının yanlış cevaplarından düştüğü tuzaklar.
import { getAllQuestions } from "@/lib/content/repo";
import type { TrapCode } from "@/lib/content/schema";
import { attemptRows } from "@/features/progress/server";
import { trapStats, untouchedCodes, type TrapStat } from "./stats";

export async function trapsPageData(userId: string): Promise<{ stats: TrapStat[]; untouched: TrapCode[] }> {
  const [questions, rows] = await Promise.all([
    getAllQuestions(userId),
    attemptRows(userId),
  ]);
  const stats = trapStats(rows, new Map(questions.map((q) => [q.id, q])));
  return { stats, untouched: untouchedCodes(stats) };
}
