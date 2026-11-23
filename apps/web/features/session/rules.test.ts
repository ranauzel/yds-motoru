import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/content/schema";
import { applyAdvance, pickDailyQuestions, pickReviewWords, vocabByWord, WARMUP_GRADE, type ReviewRow } from "./rules";

const D = (s: string) => new Date(s);
const dueBefore = D("2026-11-23T21:00:00Z"); // İstanbul 24 Kasım 00:00
const r = (itemId: string, dueAt: string, reps = 1, priority = false): ReviewRow => ({ itemId, dueAt: D(dueAt), reps, priority });

describe("pickDailyQuestions", () => {
  it("zamanı gelenler priority > reps > dueAt sırasıyla, sonra yeniler içerik sırasıyla", () => {
    const ids = ["a", "b", "c", "d", "n1", "n2"];
    const reviews = [r("a", "2026-11-20T00:00:00Z", 3), r("b", "2026-11-22T00:00:00Z", 0), r("c", "2026-11-23T10:00:00Z", 0, true), r("d", "2026-11-21T00:00:00Z", 0)];
    expect(pickDailyQuestions({ questionIds: ids, reviews, dueBefore, size: 10, maxDue: 6 })).toEqual(["c", "d", "b", "a", "n1", "n2"]);
  });

  it("gün içinde daha sonra zamanı gelen de bugün sayılır; yarın gelen sayılmaz", () => {
    const reviews = [r("a", "2026-11-23T18:00:00Z"), r("b", "2026-11-23T21:00:00Z")];
    expect(pickDailyQuestions({ questionIds: ["a", "b"], reviews, dueBefore, size: 10, maxDue: 6 })).toEqual(["a"]);
  });

  it("zamanı gelenler maxDue ile sınırlı, kalan yer yenilerle dolar", () => {
    const due = ["d1", "d2", "d3"].map((id) => r(id, "2026-11-20T00:00:00Z"));
    expect(pickDailyQuestions({ questionIds: ["d1", "d2", "d3", "n1", "n2", "n3"], reviews: due, dueBefore, size: 4, maxDue: 2 }))
      .toEqual(["d1", "d2", "n1", "n2"]);
  });

  it("yeni soru yetmezse boşluk zamanı gelenlerle dolar", () => {
    const due = ["d1", "d2", "d3"].map((id) => r(id, "2026-11-20T00:00:00Z"));
    expect(pickDailyQuestions({ questionIds: ["d1", "d2", "d3", "n1"], reviews: due, dueBefore, size: 4, maxDue: 2 }))
      .toEqual(["d1", "d2", "d3", "n1"]);
  });

  it("görünmeyen soruların review kaydı yok sayılır; aday yoksa boş", () => {
    expect(pickDailyQuestions({ questionIds: ["a"], reviews: [r("gizli", "2026-11-20T00:00:00Z"), r("a", "2026-11-30T00:00:00Z")], dueBefore, size: 10, maxDue: 6 }))
      .toEqual([]);
  });
});

describe("pickReviewWords", () => {
  it("kelimeler aynı sırayla, bilinmeyen kelime atlanır, size ile sınırlı", () => {
    const reviews = [r("x", "2026-11-20T00:00:00Z", 2), r("y", "2026-11-22T00:00:00Z", 0), r("bilinmeyen", "2026-11-20T00:00:00Z", 0), r("z", "2026-11-21T00:00:00Z", 0)];
    expect(pickReviewWords({ reviews, known: new Set(["x", "y", "z"]), dueBefore, size: 2 })).toEqual(["z", "y"]);
  });
});

describe("vocabByWord", () => {
  it("kelime ilk görüldüğü sorudaki girdiyle tutulur", () => {
    const qs = [
      { vocab: [{ word: "w", tr: "ilk" }] },
      { vocab: [{ word: "w", tr: "ikinci" }, { word: "v", tr: "v-tr" }] },
    ] as unknown as Question[];
    const m = vocabByWord(qs);
    expect(m.get("w")?.tr).toBe("ilk");
    expect([...m.keys()]).toEqual(["w", "v"]);
  });
});

describe("rules", () => {
  it("applyAdvance never moves backwards", () => {
    expect(applyAdvance(5, 3, 10)).toEqual({ position: 5, finished: false });
  });

  it("applyAdvance finishes at total and never goes past it", () => {
    expect(applyAdvance(9, 10, 10)).toEqual({ position: 10, finished: true });
    expect(applyAdvance(10, 11, 10)).toEqual({ position: 10, finished: true });
  });

  it("warmup grades are 4 for right and 1 for wrong", () => {
    expect(WARMUP_GRADE).toEqual({ correct: 4, wrong: 1 });
  });
});
