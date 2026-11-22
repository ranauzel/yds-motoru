import { describe, expect, it } from "vitest";
import { gradeAnswer, isKnown, MIN_EASE, newReviewState, review } from "./sm2";

const now = new Date("2026-11-18T09:00:00Z");
const days = (d: Date) => Math.round((d.getTime() - now.getTime()) / 86_400_000);

describe("SM-2", () => {
  it("doğru cevaplarda aralık 1 → 6 → ease ile büyür", () => {
    let s = newReviewState(now);
    s = review(s, 5, now);
    expect(s.intervalDays).toBe(1);
    s = review(s, 5, now);
    expect(s.intervalDays).toBe(6);
    s = review(s, 5, now);
    expect(s.intervalDays).toBe(Math.round(6 * s.ease));
    expect(s.reps).toBe(3);
    expect(days(s.dueAt)).toBe(s.intervalDays);
  });

  it("yanlış cevap tekrar sayısını sıfırlar, unutmayı artırır, yarına planlar", () => {
    let s = review(review(newReviewState(now), 5, now), 5, now);
    s = review(s, 1, now);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.intervalDays).toBe(1);
    expect(days(s.dueAt)).toBe(1);
  });

  it("ease 1.3'ün altına düşmez", () => {
    let s = newReviewState(now);
    for (let i = 0; i < 20; i++) s = review(s, 0, now);
    expect(s.ease).toBe(MIN_EASE);
  });

  it("emin olup yanlış yapılan öğe öncelikli olur, doğru bilinince öncelik kalkar", () => {
    let s = review(newReviewState(now), gradeAnswer(false, true), now);
    expect(s.priority).toBe(true);
    s = review(s, gradeAnswer(true, true), now);
    expect(s.priority).toBe(false);
  });

  it("cevap → not eşlemesi", () => {
    expect(gradeAnswer(false, true)).toBe(0);
    expect(gradeAnswer(false, false)).toBe(1);
    expect(gradeAnswer(true, false)).toBe(3);
    expect(gradeAnswer(true, true)).toBe(5);
  });

  it("iki doğrudan sonra kelime biliniyor sayılır", () => {
    let s = newReviewState(now);
    expect(isKnown(s)).toBe(false);
    s = review(s, 5, now);
    expect(isKnown(s)).toBe(false);
    s = review(s, 5, now);
    expect(isKnown(s)).toBe(true);
  });
});
