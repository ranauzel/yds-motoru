import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadQuestionFiles } from "./load";
import { toQuestionRows } from "./rows";

const EXAMPLE = path.resolve(__dirname, "..", "..", "..", "..", "content", "ornek");

describe("toQuestionRows", () => {
  it("her soruyu sınav bilgisiyle bir satıra çevirir, tüm soruyu data'da saklar", async () => {
    const files = await loadQuestionFiles(EXAMPLE);
    const rows = toQuestionRows(files);
    expect(rows).toHaveLength(10);
    const r = rows[0];
    expect(r).toMatchObject({
      id: "ornek-q1", examId: "ornek", examName: "Örnek sorular (ÖSYM sorusu değildir)",
      examDate: "2026-01-01", number: 1, type: "cumle_tamamlama", topic: "zitlik", status: "reviewed",
    });
    expect(r.data).toEqual(files[0].questions[0]);
    expect(r.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("aynı içerik aynı hash'i, değişen içerik farklı hash'i verir", async () => {
    const files = await loadQuestionFiles(EXAMPLE);
    const a = toQuestionRows(files)[0].hash;
    const changed = structuredClone(files);
    changed[0].questions[0].golden_rule += " (değişti)";
    expect(toQuestionRows(files)[0].hash).toBe(a);
    expect(toQuestionRows(changed)[0].hash).not.toBe(a);
  });

  it("dosyalar arasında tekrar eden soru id'sini reddeder", async () => {
    const files = await loadQuestionFiles(EXAMPLE);
    expect(() => toQuestionRows([...files, ...files])).toThrow(/ornek-q1/);
  });
});
