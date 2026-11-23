// Tuzaklarım sayfası verisi: kullanıcının yanlış cevaplarından düştüğü tuzaklar.
import { eq } from "drizzle-orm";
import { getAllQuestions } from "@/lib/content/repo";
import type { TrapCode } from "@/lib/content/schema";
import { db, schema } from "@/lib/db";
import { trapStats, untouchedCodes, type TrapStat } from "./stats";

const { attempts } = schema;

export async function trapsPageData(userId: string): Promise<{ stats: TrapStat[]; untouched: TrapCode[] }> {
  const [questions, rows] = await Promise.all([
    getAllQuestions(userId),
    db.select({ questionId: attempts.questionId, choice: attempts.choice, correct: attempts.correct, createdAt: attempts.createdAt })
      .from(attempts).where(eq(attempts.userId, userId)),
  ]);
  const stats = trapStats(rows, new Map(questions.map((q) => [q.id, q])));
  return { stats, untouched: untouchedCodes(stats) };
}
