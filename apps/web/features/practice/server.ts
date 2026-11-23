// Serbest çalışma verisi. Yalnızca okur: practice_sessions, attempts ve review_items'a yazmaz (spec §5.6–5.8).
import { and, eq } from "drizzle-orm";
import { getAllQuestions } from "@/lib/content/repo";
import { db, schema } from "@/lib/db";
import { dayEnd, todayKey } from "@/features/session/day";
import { vocabByWord } from "@/features/session/rules";
import { getTodaySession } from "@/features/session/server";
import type { Snapshot } from "@/features/session/session-machine";
import { pickTrapPractice } from "@/features/traps/stats";
import { classifyWords, pickWordPractice } from "@/features/words/stats";
import {
  fellIdsFor, trapPracticeSnapshot, TRAP_PRACTICE_SIZE, wordPracticeSnapshot, WORD_PRACTICE_SIZE, type PracticeParams,
} from "./snapshot";

const { attempts, reviewItems } = schema;

/** Seçilecek bir şey yoksa null. */
export async function practiceSnapshot(userId: string, params: PracticeParams, now: Date): Promise<Snapshot | null> {
  const questions = await getAllQuestions(userId);

  if (params.tur === "kelime") {
    const [reviews, today] = await Promise.all([
      db.select({ itemId: reviewItems.itemId, dueAt: reviewItems.dueAt, priority: reviewItems.priority, reps: reviewItems.reps })
        .from(reviewItems).where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, "word"))),
      getTodaySession(userId, todayKey(now)),
    ]);
    const vocab = vocabByWord(questions);
    const words = pickWordPractice({
      words: classifyWords(vocab, reviews), status: params.sekme,
      excluded: new Set(today?.reviewWords ?? []), dueBefore: dayEnd(now), size: WORD_PRACTICE_SIZE,
    });
    return wordPracticeSnapshot(words.flatMap((w) => vocab.get(w) ?? []), [...new Set([...vocab.values()].map((v) => v.tr))]);
  }

  const rows = await db.select({ questionId: attempts.questionId, choice: attempts.choice, correct: attempts.correct, createdAt: attempts.createdAt })
    .from(attempts).where(eq(attempts.userId, userId));
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ids = pickTrapPractice({ code: params.kod, questions, fellIds: fellIdsFor(params.kod, rows, byId), size: TRAP_PRACTICE_SIZE });
  return trapPracticeSnapshot(ids.flatMap((id) => byId.get(id) ?? []));
}
