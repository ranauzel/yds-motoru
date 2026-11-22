// content/ klasöründeki JSON dosyalarının şeması. Bozuk içerik uygulamaya hiç girmez.
import { z } from "zod";

export const TRAP_CODES = [
  "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12", "T13", "T14", "T15",
] as const;
export const TrapCode = z.enum(TRAP_CODES);
export type TrapCode = z.infer<typeof TrapCode>;

export const TRAP_NAMES: Record<TrapCode, string> = {
  T1: "Kelime tekrarı", T2: "Zaman uyumsuzluğu", T3: "Bağlaç yönü", T4: "Kapsam kayması",
  T5: "Gerçek ama alakasız", T6: "Zamir uyumsuzluğu", T7: "Neden-sonuç ters", T8: "Özne kayması",
  T9: "Olumsuzluk", T10: "Konu doğru, odak yanlış", T11: "Yapısal uyumsuzluk", T12: "Eşdizim / edat",
  T13: "Görüş sahibi karışıklığı", T14: "Aşırı dar / geniş", T15: "Benzer görünen kelime",
};

export const QUESTION_TYPES = [
  "kelime", "dilbilgisi", "cloze", "cumle_tamamlama", "ceviri", "okuma",
  "diyalog", "yakin_anlam", "paragraf_tamamlama", "anlami_bozan",
] as const;

/** Sorunun ana konusu (çoğunlukla bağlacın işlevi). Konuya göre çalışma ve istatistik için sabit liste. */
export const TOPICS = [
  "kosul", "zitlik", "neden_sonuc", "ek", "zaman", "amac", "karsilastirma", "iliskili_yapi",
] as const;
export const TOPIC_NAMES: Record<(typeof TOPICS)[number], string> = {
  kosul: "Koşul", zitlik: "Zıtlık", neden_sonuc: "Neden-sonuç", ek: "Ekleme", zaman: "Zaman",
  amac: "Amaç", karsilastirma: "Karşılaştırma", iliskili_yapi: "İlişkili yapı / gönderge",
};

export const OptionKey = z.enum(["A", "B", "C", "D", "E"]);

export const Option = z.object({
  key: OptionKey,
  text: z.string().min(1),
  text_tr: z.string().min(1),
  traps: z.array(TrapCode),
  explanation: z.string().min(1),
});

export const StemChunk = z.object({
  en: z.string().min(1),
  tr: z.string(),
  tag: z.enum(["conj", "ref", "blank"]).optional(),
  label: z.string().optional(),
  sign: z.string().optional(),
});

export const Vocab = z.object({
  word: z.string().min(1),
  tr: z.string().min(1),
  note: z.string().optional(),
  warmup: z.boolean().optional(),
  context: z.string().optional(),
});

export const Question = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1).max(80),
  type: z.enum(QUESTION_TYPES),
  topic: z.enum(TOPICS),
  sub_topic: z.string(),
  difficulty: z.number().int().min(1).max(3),
  stem: z.string().min(1),
  stem_tr: z.string().min(1),
  stem_chunks: z.array(StemChunk).min(1),
  summary: z.string().min(1),
  answer: OptionKey,
  options: z.array(Option).length(5),
  solution_steps: z.array(z.string()).min(1),
  golden_rule: z.string().min(1),
  structure: z.string(),
  vocab: z.array(Vocab),
  review: z.object({ status: z.enum(["draft", "reviewed"]), blind_solve_match: z.boolean() }),
}).superRefine((q, ctx) => {
  const keys = q.options.map((o) => o.key).join("");
  if (keys !== "ABCDE") ctx.addIssue({ code: "custom", message: `şıklar A–E sırasında değil: ${keys}` });
  for (const o of q.options) {
    if (o.key === q.answer && o.traps.length)
      ctx.addIssue({ code: "custom", message: `${o.key}: doğru şıkta tuzak kodu olmamalı` });
    if (o.key !== q.answer && !o.traps.length)
      ctx.addIssue({ code: "custom", message: `${o.key}: yanlış şıkta en az bir tuzak kodu olmalı` });
  }
  const norm = (s: string) => s.replace(/\s+/g, "");
  if (norm(q.stem_chunks.map((c) => c.en).join(" ")) !== norm(q.stem))
    ctx.addIssue({ code: "custom", message: "stem_chunks soru metniyle birebir eşleşmiyor" });
});
export type Question = z.infer<typeof Question>;

export const QuestionFile = z.object({
  schema_version: z.string(),
  exam: z.object({ id: z.string(), name: z.string(), date: z.string() }),
  questions: z.array(Question).min(1),
});
export type QuestionFile = z.infer<typeof QuestionFile>;
