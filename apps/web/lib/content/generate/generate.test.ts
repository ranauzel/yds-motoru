import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { loadQuestions } from "../load";
import { parseAnswerKey } from "./answer-key";
import type { JsonRequest, ModelClient } from "./client";
import { generateQuestions } from "./generate";

const ORNEK = path.resolve(__dirname, "..", "..", "..", "..", "..", "content", "ornek");

// Modelin döndüreceği öğe: gerçek bir örnek sorudan hattın yazdığı alanlar çıkarılmış hali (ornek-q1, cevabı B).
let item27: Record<string, unknown> & { stem: string; options: { key: string; traps: string[] }[] };
beforeAll(async () => {
  const q = (await loadQuestions(ORNEK)).find((x) => x.id === "ornek-q1")!;
  const rest: Record<string, unknown> = { ...q };
  for (const k of ["id", "type", "answer", "review"]) delete rest[k];
  item27 = { ...rest, number: 27 } as unknown as typeof item27;
});

let calls: JsonRequest[] = [];

function fakeClient(analysis: unknown, blind: unknown): ModelClient {
  return {
    async generateJson(req) {
      calls.push(req);
      return req.pdf ? analysis : blind;
    },
  };
}

function runRaw(o: { analysisRaw: unknown; blind?: unknown[]; answers: string }) {
  calls = [];
  return generateQuestions({
    pdf: new Uint8Array([1]),
    answers: parseAnswerKey(o.answers),
    type: "cumle_tamamlama",
    examId: "2021-yds-1",
    client: fakeClient(o.analysisRaw, { answers: o.blind ?? [] }),
  });
}

const run = (o: { analysis: unknown[]; blind: unknown[]; answers: string }) =>
  runRaw({ analysisRaw: { questions: o.analysis }, blind: o.blind, answers: o.answers });

describe("generateQuestions", () => {
  it("geçen soru hattın alanlarıyla ve draft olarak döner", async () => {
    const r = await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
    expect(r.ready).toHaveLength(1);
    expect(r.ready[0]).toMatchObject({
      id: "2021-yds-1-q27", number: 27, type: "cumle_tamamlama", answer: "B",
      review: { status: "draft", blind_solve_match: true },
    });
    expect(r.review).toEqual([]);
  });

  it("modelin answer alanı yok sayılır, cevap anahtardan gelir", async () => {
    const r = await run({ analysis: [{ ...item27, answer: "A" }], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
    expect(r.ready[0].answer).toBe("B");
  });

  it("anahtarda olmayan numara atlanır ve modelden istenmez", async () => {
    const r = await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
    expect(r.skipped).toEqual([28, 29, 30, 31, 32, 33, 34, 35, 36]);
    expect(calls[0].prompt).toMatch(/27: B/);
    expect(calls[0].prompt).not.toMatch(/\b28:/);
  });

  it("model istenen numarayı döndürmezse eksik olarak incelemeye düşer", async () => {
    const r = await run({ analysis: [], blind: [], answers: "27: B" });
    expect(r.review).toEqual([expect.objectContaining({ number: 27, reason: "eksik" })]);
    expect(r.ready).toEqual([]);
  });

  it("istenmeyen numara ve ikinci kopya yok sayılır", async () => {
    const r = await run({
      analysis: [item27, { ...item27, stem: "x" }, { ...item27, number: 5 }],
      blind: [{ number: 27, choice: "B" }], answers: "27: B",
    });
    expect(r.ready.map((q) => q.stem)).toEqual([item27.stem]);
    expect(r.review).toEqual([]);
  });

  it("şemadan geçmeyen soru (doğru şıkta tuzak kodu) incelemeye düşer ve kör çözüme gitmez", async () => {
    const bad = { ...item27, options: item27.options.map((o) => (o.key === "B" ? { ...o, traps: ["T1"] } : o)) };
    const r = await run({ analysis: [bad], blind: [], answers: "27: B" });
    expect(r.review[0]).toMatchObject({ number: 27, reason: "sema" });
    expect(calls).toHaveLength(1);
  });

  it("kör çözüm uyuşmazsa ya da numara cevapsız kalırsa incelemeye düşer", async () => {
    const wrong = await run({ analysis: [item27], blind: [{ number: 27, choice: "D" }], answers: "27: B" });
    expect(wrong.review[0]).toMatchObject({ number: 27, reason: "kor_cozum" });
    expect(wrong.ready).toEqual([]);
    const missing = await run({ analysis: [item27], blind: [], answers: "27: B" });
    expect(missing.review[0]).toMatchObject({ number: 27, reason: "kor_cozum" });
  });

  it("kör çözüme PDF, cevap ve tuzak kodları gönderilmez", async () => {
    await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
    expect(calls[1].pdf).toBeUndefined();
    expect(calls[1].prompt).not.toMatch(/T\d{1,2}\b/);
    expect(calls[1].prompt).toContain(item27.stem);
  });

  it("modele giden şemalarda $schema anahtarı yok, soru numarası 1–80 ile sınırlı", async () => {
    await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
    for (const c of calls) expect(c.schema).not.toHaveProperty("$schema");
    const num = (calls[1].schema as { properties: { answers: { items: { properties: { number: { minimum: number; maximum: number } } } } } })
      .properties.answers.items.properties.number;
    expect([num.minimum, num.maximum]).toEqual([1, 80]);
  });

  it("analiz şemasında topic, tipin konu kodlarıyla sınırlı (enum)", async () => {
    await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
    const topic = (calls[0].schema as { properties: { questions: { items: { properties: { topic: { enum?: string[] } } } } } })
      .properties.questions.items.properties.topic;
    expect(topic.enum).toEqual(["kosul", "zitlik", "neden_sonuc", "ek", "zaman", "amac", "karsilastirma", "iliskili_yapi"]);
  });

  it("model beklenmeyen yapı dönerse fırlatır", async () => {
    await expect(runRaw({ analysisRaw: { foo: 1 }, answers: "27: B" })).rejects.toThrow();
  });
});
