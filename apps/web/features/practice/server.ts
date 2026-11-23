// Serbest çalışma verisi. Yalnızca okur: practice_sessions, attempts ve review_items'a yazmaz (spec §5.6–5.8).
import { getAllQuestions, getAllVocab } from "@/lib/content/repo";
import { attemptRows, reviewRows } from "@/features/progress/server";
import { dayEnd, todayKey } from "@/features/session/day";
import { vocabByWord } from "@/features/session/rules";
import { getTodaySession } from "@/features/session/server";
import type { Snapshot } from "@/features/session/session-machine";
import { pickTrapPractice } from "@/features/traps/stats";
import { classifyWords, pickWordPractice, todayExcludedWords } from "@/features/words/stats";
import {
  fellIdsFor, trapPracticeSnapshot, TRAP_PRACTICE_SIZE, wordPracticeSnapshot, WORD_PRACTICE_SIZE, type PracticeParams,
} from "./snapshot";

/** Seçilecek bir şey yoksa null. */
export async function practiceSnapshot(userId: string, params: PracticeParams, now: Date): Promise<Snapshot | null> {
  if (params.tur === "kelime") {
    const [questions, reviews, today] = await Promise.all([
      getAllVocab(userId),
      reviewRows(userId, "word"),
      getTodaySession(userId, todayKey(now)),
    ]);
    const vocab = vocabByWord(questions);
    const words = pickWordPractice({
      words: classifyWords(vocab, reviews), status: params.sekme,
      excluded: todayExcludedWords(questions, today), dueBefore: dayEnd(now), size: WORD_PRACTICE_SIZE,
    });
    return wordPracticeSnapshot(words.flatMap((w) => vocab.get(w) ?? []), [...new Set([...vocab.values()].map((v) => v.tr))]);
  }

  const [questions, rows] = await Promise.all([getAllQuestions(userId), attemptRows(userId)]);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ids = pickTrapPractice({ code: params.kod, questions, fellIds: fellIdsFor(params.kod, rows, byId), size: TRAP_PRACTICE_SIZE });
  return trapPracticeSnapshot(ids.flatMap((id) => byId.get(id) ?? []));
}
