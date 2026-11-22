import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/content/schema";
import { applyAdvance, pickSessionQuestions, WARMUP_GRADE } from "./rules";

describe("rules", () => {
  it("pickSessionQuestions keeps content order", () => {
    const qs = [27, 28, 29].map((n) => ({ id: `q${n}` }) as Question);
    expect(pickSessionQuestions(qs)).toEqual(["q27", "q28", "q29"]);
  });

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
