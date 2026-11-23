import { describe, expect, it } from "vitest";
import type { Question, TrapCode } from "@/lib/content/schema";
import { pickTrapPractice, trapStats } from "./stats";

/** Şemaya uygun küçük soru; doğru şıkta tuzak yok, belirtilmeyen yanlış şıklarda da yok. */
const q = (id: string, answer: string, trapsByKey: Record<string, TrapCode[]>): Question =>
  ({
    id,
    answer,
    options: ["A", "B", "C", "D", "E"].map((key) => ({
      key, text: key, text_tr: key, explanation: "x",
      traps: key === answer ? [] : (trapsByKey[key] ?? []),
    })),
  }) as unknown as Question;

describe("trapStats", () => {
  it("yanlış seçilen şıkların kodları sayılır, doğrular ve görünmeyenler sayılmaz, sıralı", () => {
    const qs = new Map([["q1", q("q1", "A", { B: ["T3"], C: ["T3", "T6"] })], ["q2", q("q2", "A", { B: ["T6"] })]]);
    const at = (questionId: string, choice: string, correct: boolean, iso: string) => ({ questionId, choice, correct, createdAt: new Date(iso) });
    const s = trapStats([at("q1", "C", false, "2026-11-20"), at("q1", "B", false, "2026-11-21"), at("q2", "B", false, "2026-11-22"), at("q1", "A", true, "2026-11-23"), at("gizli", "B", false, "2026-11-23")], qs);
    expect(s.map((x) => [x.code, x.count])).toEqual([["T6", 2], ["T3", 2]]); // eşit sayıda son tarih (T6: 22 Kasım) önce
  });
  it("hiç yanlış yoksa boş", () => { expect(trapStats([], new Map())).toEqual([]); });
});

describe("pickTrapPractice", () => {
  it("tuzak çalışması: önce düşülenler, sonra diğerleri, size ile sınırlı", () => {
    const list = [q("a", "A", { B: ["T3"] }), q("b", "A", { B: ["T6"] }), q("c", "A", { C: ["T3"] }), q("d", "A", { D: ["T3"] })];
    expect(pickTrapPractice({ code: "T3", questions: list, fellIds: new Set(["d"]), size: 2 })).toEqual(["d", "a"]);
  });
});
