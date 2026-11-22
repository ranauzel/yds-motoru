import { describe, expect, it } from "vitest";
import { AdvanceInput, AnswerInput, WarmDoneInput, WarmupInput, SessionIdInput } from "./inputs";

const SID = "6f1c2b8e-3d4a-4f5b-9c6d-7e8f9a0b1c2d";
const ANSWER = { choice: "B", sure: true, glossUsed: false, hintUsed: true, wordsUsed: false };

describe("oturum kimliği", () => {
  it("UUID kabul edilir, başka her şey reddedilir", () => {
    expect(SessionIdInput.safeParse(SID).success).toBe(true);
    for (const bad of ["", "abc", 42, null, undefined, { id: SID }])
      expect(SessionIdInput.safeParse(bad).success).toBe(false);
  });
});

describe("advance", () => {
  it("negatif olmayan tam sayı pozisyon kabul edilir", () => {
    expect(AdvanceInput.parse({ sessionId: SID, position: 0 }).position).toBe(0);
    expect(AdvanceInput.parse({ sessionId: SID, position: 7 }).position).toBe(7);
  });

  it("NaN, sonsuz, kesirli, negatif ve sayı olmayan pozisyon reddedilir", () => {
    for (const position of [NaN, Infinity, 1.5, -1, "3", null])
      expect(AdvanceInput.safeParse({ sessionId: SID, position }).success).toBe(false);
  });
});

describe("markWarmDone", () => {
  it("NaN ve negatif blok reddedilir", () => {
    expect(WarmDoneInput.parse({ sessionId: SID, block: 4 }).block).toBe(4);
    for (const block of [NaN, -4, 2.5, "4"])
      expect(WarmDoneInput.safeParse({ sessionId: SID, block }).success).toBe(false);
  });
});

describe("recordWarmup", () => {
  it("boş, çok uzun ya da metin olmayan kelime reddedilir", () => {
    expect(WarmupInput.parse({ sessionId: SID, word: "although", correct: true }).word).toBe("although");
    for (const word of ["", "x".repeat(101), 5, null])
      expect(WarmupInput.safeParse({ sessionId: SID, word, correct: true }).success).toBe(false);
  });

  it("doğru/yanlış bilgisi boolean olmalı", () => {
    expect(WarmupInput.safeParse({ sessionId: SID, word: "w", correct: "true" }).success).toBe(false);
  });
});

describe("recordAnswer", () => {
  const input = (over: Record<string, unknown>) => ({ sessionId: SID, questionId: "ornek-q1", answer: ANSWER, durationMs: 1200, ...over });

  it("geçerli cevap aynen geçer", () => {
    expect(AnswerInput.parse(input({}))).toEqual({ sessionId: SID, questionId: "ornek-q1", answer: ANSWER, durationMs: 1200 });
  });

  it("A–E dışındaki şık reddedilir", () => {
    for (const choice of ["F", "a", "", null])
      expect(AnswerInput.safeParse(input({ answer: { ...ANSWER, choice } })).success).toBe(false);
  });

  it("eksik ya da boolean olmayan bayraklar reddedilir", () => {
    expect(AnswerInput.safeParse(input({ answer: { choice: "A" } })).success).toBe(false);
    expect(AnswerInput.safeParse(input({ answer: { ...ANSWER, sure: 1 } })).success).toBe(false);
  });

  it("boş soru kimliği reddedilir", () => {
    expect(AnswerInput.safeParse(input({ questionId: "" })).success).toBe(false);
  });

  it("süre yuvarlanır; negatif sıfıra çekilir; geçersiz süre cevabı düşürmez, boş kaydedilir", () => {
    expect(AnswerInput.parse(input({ durationMs: 1234.6 })).durationMs).toBe(1235);
    expect(AnswerInput.parse(input({ durationMs: -50 })).durationMs).toBe(0);
    expect(AnswerInput.parse(input({ durationMs: NaN })).durationMs).toBeNull();
    expect(AnswerInput.parse(input({ durationMs: "x" })).durationMs).toBeNull();
  });
});
