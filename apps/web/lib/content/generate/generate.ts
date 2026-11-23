// Soru hattının çekirdeği: PDF + cevap anahtarı → analiz çağrısı → şema doğrulaması → kör çözüm çağrısı.
// Dosya okumaz/yazmaz; komut (scripts/generate-content.ts) ve ileride web sürümü bunu çağırır.
import { z } from "zod";
import { OptionKey, Question, QuestionBase } from "../schema";
import type { ModelClient } from "./client";
import { blindSolvePrompt, GENERATORS } from "./prompts";

export type ReviewItem = { number: number; reason: "eksik" | "sema" | "kor_cozum"; detail: string; data?: unknown };
export type GenerateResult = { ready: Question[]; review: ReviewItem[]; skipped: number[] };

/** Modelin doldurduğu alanlar: id, type, answer ve review'u hat yazar. */
const ModelQuestion = QuestionBase.omit({ id: true, type: true, answer: true, review: true });
const AnalysisOutput = z.object({ questions: z.array(ModelQuestion) });
const AnalysisShape = z.object({ questions: z.array(z.unknown()) });
const BlindOutput = z.object({ answers: z.array(z.object({ number: z.number().int().min(1).max(80), choice: OptionKey })) });

/** Gemini'nin responseJsonSchema'sı JSON Schema'nın bir alt kümesini destekler: "$schema" meta anahtarı gönderilmez. */
function modelSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _meta, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  void _meta;
  return rest;
}

const ANALYSIS_SCHEMA = modelSchema(AnalysisOutput);
const BLIND_SCHEMA = modelSchema(BlindOutput);

const numberOf = (item: unknown): number | undefined =>
  typeof item === "object" && item !== null && typeof (item as { number?: unknown }).number === "number"
    ? (item as { number: number }).number
    : undefined;

export async function generateQuestions(opts: {
  pdf: Uint8Array;
  answers: Map<number, z.infer<typeof OptionKey>>;
  type: Question["type"];
  examId: string;
  client: ModelClient;
}): Promise<GenerateResult> {
  const { pdf, answers, type, examId, client } = opts;
  const gen = GENERATORS[type];
  if (!gen) throw new Error(`Bu soru tipi için analizör yok: ${type}`);

  const [from, to] = gen.range;
  const requested = new Map<number, z.infer<typeof OptionKey>>();
  const skipped: number[] = [];
  for (let n = from; n <= to; n++) {
    const a = answers.get(n);
    if (a) requested.set(n, a);
    else skipped.push(n);
  }
  if (!requested.size) return { ready: [], review: [], skipped };

  // 1) Analiz: PDF + istenen numaralar ve doğru cevaplar.
  const raw = AnalysisShape.safeParse(await client.generateJson({ prompt: gen.analysisPrompt(requested), pdf, schema: ANALYSIS_SCHEMA }));
  if (!raw.success) throw new Error(`Model beklenmeyen bir yapı döndürdü (analiz): ${raw.error.message}`);

  const byNumber = new Map<number, unknown>();
  for (const item of raw.data.questions) {
    const n = numberOf(item);
    if (n !== undefined && requested.has(n) && !byNumber.has(n)) byNumber.set(n, item); // istenmeyen ve ikinci kopya yok sayılır
  }

  const review: ReviewItem[] = [];
  const valid: Question[] = [];
  for (const [n, answer] of requested) {
    const item = byNumber.get(n);
    if (item === undefined) {
      review.push({ number: n, reason: "eksik", detail: "Model bu soruyu döndürmedi." });
      continue;
    }
    // Hattın alanları en sonda: modelin id/type/answer/review değerlerini ezer.
    const merged = { ...(item as object), id: `${examId}-q${n}`, number: n, type, answer, review: { status: "draft", blind_solve_match: true } };
    const parsed = Question.safeParse(merged);
    if (parsed.success) valid.push(parsed.data);
    else review.push({ number: n, reason: "sema", detail: parsed.error.message, data: merged });
  }

  // 2) Kör çözüm: PDF'siz, cevapsız, tuzak kodsuz.
  const ready: Question[] = [];
  if (valid.length) {
    const blindRaw = BlindOutput.safeParse(await client.generateJson({
      prompt: blindSolvePrompt(valid.map((q) => ({ number: q.number, stem: q.stem, options: q.options.map((o) => ({ key: o.key, text: o.text })) }))),
      schema: BLIND_SCHEMA,
    }));
    if (!blindRaw.success) throw new Error(`Model beklenmeyen bir yapı döndürdü (kör çözüm): ${blindRaw.error.message}`);
    const picks = new Map(blindRaw.data.answers.map((a) => [a.number, a.choice]));
    for (const q of valid) {
      const pick = picks.get(q.number);
      if (pick === q.answer) ready.push(q);
      else review.push({ number: q.number, reason: "kor_cozum", detail: `Model ${pick ?? "cevap vermedi"} seçti, doğru cevap ${q.answer}.`, data: q });
    }
  }

  ready.sort((a, b) => a.number - b.number);
  review.sort((a, b) => a.number - b.number);
  return { ready, review, skipped };
}
