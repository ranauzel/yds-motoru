// Serbest çalışmanın kayıt fonksiyonu: yalnızca kelime cevabı yazılır, diğer yan etkiler yok sayılır (spec §5.8).
import type { ActionResult } from "@/features/session/actions";
import type { Effect } from "@/features/session/session-machine";

export async function practiceSend(
  e: Effect,
  recordWord: (word: string, correct: boolean) => Promise<ActionResult>,
): Promise<ActionResult | void> {
  if (e.kind === "recordWarmup") return recordWord(e.word, e.correct);
}
