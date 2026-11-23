// Serbest çalışma: adres parametreleri ve durum makinesine verilecek Snapshot (saf, testli; spec §5.8).
import { z } from "zod";
import { TrapCode, type Question } from "@/lib/content/schema";
import { BREAK_AFTER, type Snapshot } from "@/features/session/session-machine";
import type { AttemptRow } from "@/features/traps/stats";

export const WORD_PRACTICE_SIZE = 10;
export const TRAP_PRACTICE_SIZE = 5;

const PracticeParams = z.discriminatedUnion("tur", [
  z.object({ tur: z.literal("kelime"), sekme: z.enum(["learned", "reviewing", "new"]).default("reviewing") }),
  z.object({ tur: z.literal("tuzak"), kod: TrapCode }),
]);
export type PracticeParams = z.infer<typeof PracticeParams>;

/** `/calis?tur=kelime&sekme=…` ya da `/calis?tur=tuzak&kod=T3`; geçersizse null. */
export function parsePracticeParams(sp: Record<string, string | string[] | undefined>): PracticeParams | null {
  const r = PracticeParams.safeParse(sp);
  return r.success ? r.data : null;
}

/** Kullanıcının bu tuzağa düştüğü sorular: yanlış seçtiği şıkta bu kod var. */
export function fellIdsFor(code: TrapCode, attempts: AttemptRow[], byId: Map<string, Question>): Set<string> {
  const out = new Set<string>();
  for (const a of attempts) {
    if (a.correct) continue;
    if (byId.get(a.questionId)?.options.find((o) => o.key === a.choice)?.traps.includes(code)) out.add(a.questionId);
  }
  return out;
}

/** Ortak alanlar: kaldığı yerden devam yok, mola yok, haftalık hedef ve havuz bilgisi yok. */
const base = (): Omit<Snapshot, "questions" | "reviewVocab" | "warmDone" | "meaningPool"> => ({
  sessionId: "pratik", position: 0, breakSeen: true, warmAnswers: {}, answers: {}, knownWords: [],
  weekDays: 0, newLeft: 0, topTrap: null, tip: null,
});

/** Kelime çalışması: yalnızca kelime tekrarı bölümü, ardından özet. */
export function wordPracticeSnapshot(vocab: Question["vocab"], meaningPool: string[]): Snapshot | null {
  if (!vocab.length) return null;
  return { ...base(), questions: [], reviewVocab: vocab, warmDone: [], meaningPool };
}

/** Tuzak çalışması: sorular, her blok ısınması baştan bitmiş sayılır. */
export function trapPracticeSnapshot(questions: Question[]): Snapshot | null {
  if (!questions.length) return null;
  const warmDone: number[] = [];
  for (let b = 0; b < questions.length; b += BREAK_AFTER) warmDone.push(b);
  return { ...base(), questions, reviewVocab: [], warmDone, meaningPool: [] };
}
