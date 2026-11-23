import { describe, expect, it } from "vitest";
import type { ReviewRow } from "@/features/session/rules";
import type { Question } from "@/lib/content/schema";
import { classifyWords, dueLabel, todayExcludedWords, pickWordPractice, shouldRecordWordPractice, type WordRow, type WordStatus } from "./stats";

const dueBefore = new Date("2026-11-23T21:00:00Z");
const r = (itemId: string, dueAt: string, reps = 1, priority = false): ReviewRow => ({ itemId, dueAt: new Date(dueAt), reps, priority });
const W = (word: string, status: WordStatus, dueAt: string | null): WordRow => ({ word, tr: word, status, dueAt: dueAt ? new Date(dueAt) : null });

describe("classifyWords", () => {
  it("sınıflandırma: reps>=2 öğrenildi, kayıtlı<2 tekrarda, kayıtsız yeni; görünmeyen kayıt yok sayılır", () => {
    const vocab = new Map([["a", { word: "a", tr: "A" }], ["b", { word: "b", tr: "B" }], ["c", { word: "c", tr: "C" }]]);
    const rows = classifyWords(vocab, [r("a", "2026-12-01T00:00:00Z", 2), r("b", "2026-11-24T00:00:00Z", 1), r("gizli", "2026-11-20T00:00:00Z", 0)]);
    expect(rows.map((w) => [w.word, w.status])).toEqual([["a", "learned"], ["b", "reviewing"], ["c", "new"]]);
  });
});

describe("pickWordPractice", () => {
  it("serbest çalışma bugün zamanı gelenleri ve bugünün oturumundakileri almaz", () => {
    const words = [W("x", "reviewing", "2026-11-23T10:00:00Z"), W("y", "reviewing", "2026-11-26T00:00:00Z"), W("z", "reviewing", "2026-11-25T00:00:00Z"), W("o", "reviewing", "2026-11-27T00:00:00Z")];
    expect(pickWordPractice({ words, status: "reviewing", excluded: new Set(["o"]), dueBefore, size: 10 })).toEqual(["z", "y"]);
  });
});

describe("shouldRecordWordPractice", () => {
  it("yazma kuralı: yeni her zaman, bugün zamanı gelen asla, zamanı gelmemişte yalnızca yanlış", () => {
    expect(shouldRecordWordPractice({ review: null, correct: true, dueBefore })).toBe(true);
    expect(shouldRecordWordPractice({ review: r("w", "2026-11-23T10:00:00Z"), correct: false, dueBefore })).toBe(false);
    expect(shouldRecordWordPractice({ review: r("w", "2026-11-30T00:00:00Z"), correct: true, dueBefore })).toBe(false);
    expect(shouldRecordWordPractice({ review: r("w", "2026-11-30T00:00:00Z"), correct: false, dueBefore })).toBe(true);
  });
});

describe("dueLabel", () => {
  const now = new Date("2026-11-23T10:00:00Z"); // İstanbul'da 23 Kasım 13:00
  it("İstanbul gününe göre göreli metin", () => {
    expect(dueLabel(new Date("2026-11-23T20:30:00Z"), now)).toBe("bugün"); // 23:30 İstanbul
    expect(dueLabel(new Date("2026-11-23T21:00:00Z"), now)).toBe("yarın"); // 00:00 İstanbul, 24'ü
    expect(dueLabel(new Date("2026-11-26T05:00:00Z"), now)).toBe("3 gün sonra");
    expect(dueLabel(new Date("2026-11-20T05:00:00Z"), now)).toBe("bugün"); // geçmiş de bugün
  });
});

describe("todayExcludedWords", () => {
  const q = (id: string, vocab: Question["vocab"]) => ({ id, vocab }) as Question;
  const questions = [
    q("q1", [{ word: "a", tr: "A", warmup: true }, { word: "b", tr: "B" }]),
    q("q2", [{ word: "c", tr: "C", warmup: true }]),
    q("q3", [{ word: "d", tr: "D", warmup: true }]),
  ];
  it("bugünün oturumu yoksa hiçbir şey hariç değil", () => {
    expect(todayExcludedWords(questions, null).size).toBe(0);
  });
  it("tekrar kelimeleri ve bugünün sorularındaki ısınma kelimeleri hariç; ısınmasız ve başka sorudaki kelimeler değil", () => {
    const ex = todayExcludedWords(questions, { questionIds: ["q1", "q2"], reviewWords: ["r"] });
    expect([...ex].sort()).toEqual(["a", "c", "r"]);
  });
});
