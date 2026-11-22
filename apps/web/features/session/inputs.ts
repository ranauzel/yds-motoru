// Server action girdilerinin şemaları. Server action'lar herkese açık uçlardır: istemci ne gönderirse
// gönderebilir, bu yüzden her girdi veritabanına gitmeden doğrulanır. Geçersiz girdi kalıcı ret ("invalid")
// olarak döner; kayıt kuyruğu bunu yeniden denemez.
import { z } from "zod";
import { OptionKey } from "@/lib/content/schema";

export const SessionIdInput = z.uuid();
const Count = z.number().int().nonnegative();

export const AdvanceInput = z.object({ sessionId: SessionIdInput, position: Count });

export const WarmDoneInput = z.object({ sessionId: SessionIdInput, block: Count });

export const WarmupInput = z.object({
  sessionId: SessionIdInput,
  word: z.string().min(1).max(100),
  correct: z.boolean(),
});

/** Süre yalnızca istatistik içindir: geçersizse cevap reddedilmez, süre boş kaydedilir. */
const DurationMs = z.number().transform((v) => Math.max(0, Math.round(v))).nullable().catch(null);

export const AnswerInput = z.object({
  sessionId: SessionIdInput,
  questionId: z.string().min(1).max(100),
  answer: z.object({
    choice: OptionKey,
    sure: z.boolean(),
    glossUsed: z.boolean(),
    hintUsed: z.boolean(),
    wordsUsed: z.boolean(),
  }),
  durationMs: DurationMs,
});
