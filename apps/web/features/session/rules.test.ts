import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/content/schema";
import { newReviewState } from "@/lib/domain/sm2";
import {
  applyAdvance, canRecreate, CHECK_DAYS, pickDailyQuestions, pickReviewWords, questionReview, retiredQuestions, vocabByWord,
  WARMUP_GRADE, wrongTopicKeys, type DailyAttempt, type ReviewRow,
} from "./rules";

const D = (s: string) => new Date(s);
const dueBefore = D("2026-11-23T21:00:00Z"); // İstanbul 24 Kasım 00:00
const r = (itemId: string, dueAt: string, reps = 1, priority = false): ReviewRow => ({ itemId, dueAt: D(dueAt), reps, priority });

describe("pickDailyQuestions", () => {
  it("zamanı gelenler priority > reps > dueAt sırasıyla, sonra yeniler içerik sırasıyla", () => {
    const ids = ["a", "b", "c", "d", "n1", "n2"];
    const reviews = [r("a", "2026-11-20T00:00:00Z", 3), r("b", "2026-11-22T00:00:00Z", 0), r("c", "2026-11-23T10:00:00Z", 0, true), r("d", "2026-11-21T00:00:00Z", 0)];
    expect(pickDailyQuestions({ questionIds: ids, reviews, dueBefore, size: 10, maxDue: 6, retired: new Set() })).toEqual(["c", "d", "b", "a", "n1", "n2"]);
  });

  it("gün içinde daha sonra zamanı gelen de bugün sayılır; yarın gelen sayılmaz", () => {
    const reviews = [r("a", "2026-11-23T18:00:00Z"), r("b", "2026-11-23T21:00:00Z")];
    expect(pickDailyQuestions({ questionIds: ["a", "b"], reviews, dueBefore, size: 10, maxDue: 6, retired: new Set() })).toEqual(["a"]);
  });

  it("zamanı gelenler maxDue ile sınırlı, kalan yer yenilerle dolar", () => {
    const due = ["d1", "d2", "d3"].map((id) => r(id, "2026-11-20T00:00:00Z"));
    expect(pickDailyQuestions({ questionIds: ["d1", "d2", "d3", "n1", "n2", "n3"], reviews: due, dueBefore, size: 4, maxDue: 2, retired: new Set() }))
      .toEqual(["d1", "d2", "n1", "n2"]);
  });

  it("yeni soru yetmezse boşluk zamanı gelenlerle dolar", () => {
    const due = ["d1", "d2", "d3"].map((id) => r(id, "2026-11-20T00:00:00Z"));
    expect(pickDailyQuestions({ questionIds: ["d1", "d2", "d3", "n1"], reviews: due, dueBefore, size: 4, maxDue: 2, retired: new Set() }))
      .toEqual(["d1", "d2", "d3", "n1"]);
  });

  it("görünmeyen soruların review kaydı yok sayılır; aday yoksa boş", () => {
    expect(pickDailyQuestions({ questionIds: ["a"], reviews: [r("gizli", "2026-11-20T00:00:00Z"), r("a", "2026-11-30T00:00:00Z")], dueBefore, size: 10, maxDue: 6, retired: new Set() }))
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

describe("canRecreate", () => {
  it("yalnızca bugünün bitmemiş oturumu yeniden oluşturulabilir", () => {
    expect(canRecreate({ day: "2026-11-23", finishedAt: null }, "2026-11-23")).toBe(true);
    expect(canRecreate({ day: "2026-11-22", finishedAt: null }, "2026-11-23")).toBe(false); // geçmiş gün
    expect(canRecreate({ day: "2026-11-23", finishedAt: new Date() }, "2026-11-23")).toBe(false); // bitmiş
    expect(canRecreate({ day: null, finishedAt: null }, "2026-11-23")).toBe(false); // eski oturum
  });
});

const DAY = 24 * 60 * 60 * 1000;
let tick = 0;
const att = (questionId: string, o: Partial<DailyAttempt> = {}): DailyAttempt => ({
  sessionId: "s", questionId, correct: true, sure: true, glossUsed: false, hintUsed: false,
  createdAt: new Date(Date.UTC(2026, 10, 1) + ++tick * 1000), ...o,
});

describe("retiredQuestions", () => {
  it("son günlük cevap temiz doğruysa emekli", () => {
    expect(retiredQuestions([att("q1")])).toEqual(new Set(["q1"]));
  });
  it("doğru ama emin değil → emekli değil", () => {
    expect(retiredQuestions([att("q1", { sure: false })])).toEqual(new Set());
  });
  it("ipucu ya da çeviri açıldıysa temiz sayılmaz", () => {
    expect(retiredQuestions([att("q1", { hintUsed: true })])).toEqual(new Set());
    expect(retiredQuestions([att("q1", { glossUsed: true })])).toEqual(new Set());
  });
  it("emin değil doğru, sonra yine doğru → emekli", () => {
    expect(retiredQuestions([att("q1", { sure: false }), att("q1", { sure: false })])).toEqual(new Set(["q1"]));
  });
  it("yanlış, sonra emin değil doğru → emekli değil", () => {
    expect(retiredQuestions([att("q1", { correct: false }), att("q1", { sure: false })])).toEqual(new Set());
  });
  it("temiz doğru, sonra yanlış → emekli değil (sıra createdAt'e göre)", () => {
    const first = att("q1");
    const second = att("q1", { correct: false });
    expect(retiredQuestions([second, first])).toEqual(new Set());
  });
  it("sessionId null kayıtlar sayılmaz", () => {
    expect(retiredQuestions([att("q1", { sessionId: null })])).toEqual(new Set());
  });
});

describe("questionReview", () => {
  const now = new Date("2026-11-23T10:00:00Z");
  it("doğru + emin değil → 7 gün sonra", () => {
    const s = questionReview(newReviewState(now), { correct: true, sure: false, glossUsed: false, hintUsed: false }, now);
    expect(CHECK_DAYS).toBe(7);
    expect(s.dueAt.getTime()).toBe(now.getTime() + 7 * DAY);
  });
  it("yanlış → SM-2 (1 gün), eminse öncelikli", () => {
    const s = questionReview(newReviewState(now), { correct: false, sure: true, glossUsed: false, hintUsed: false }, now);
    expect(s.dueAt.getTime()).toBe(now.getTime() + DAY);
    expect(s.priority).toBe(true);
  });
});

describe("pickDailyQuestions: emeklilik ve konu önceliği", () => {
  it("emekli soru zamanı gelse de seçilmez, yeni olsa da seçilmez", () => {
    const due = ["d1", "d2"].map((id) => r(id, "2026-11-20T00:00:00Z"));
    expect(pickDailyQuestions({ questionIds: ["d1", "d2", "n1", "n2"], reviews: due, dueBefore, size: 10, maxDue: 6, retired: new Set(["d1", "n1"]) }))
      .toEqual(["d2", "n2"]);
  });
  it("yanlış yapılan konudan yeni sorular öne alınır", () => {
    const topicKey = new Map([["n1", "cumle_tamamlama:kosul"], ["n2", "cumle_tamamlama:kosul"], ["n3", "cumle_tamamlama:zitlik"]]);
    expect(pickDailyQuestions({
      questionIds: ["n1", "n2", "n3"], reviews: [], dueBefore, size: 10, maxDue: 6, retired: new Set(),
      boost: { topicKey, keys: new Set(["cumle_tamamlama:zitlik"]) },
    })).toEqual(["n3", "n1", "n2"]);
  });
});

describe("wrongTopicKeys", () => {
  it("son günlük cevabı yanlış olan soruların konuları", () => {
    const topicKey = new Map([["q1", "t:a"], ["q2", "t:b"]]);
    expect(wrongTopicKeys([att("q1", { correct: false }), att("q2", { correct: false }), att("q2")], topicKey)).toEqual(new Set(["t:a"]));
  });
});
