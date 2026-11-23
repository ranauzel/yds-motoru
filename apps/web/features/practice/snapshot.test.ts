import { describe, expect, it } from "vitest";
import type { Question, TrapCode } from "@/lib/content/schema";
import { initState, reduce, REVIEW_BLOCK } from "@/features/session/session-machine";
import { fellIdsFor, parsePracticeParams, trapPracticeSnapshot, wordPracticeSnapshot } from "./snapshot";

const q = (id: string, trapsByKey: Record<string, TrapCode[]> = {}, vocab: Question["vocab"] = []): Question =>
  ({
    id, number: 1, answer: "A", vocab,
    options: ["A", "B", "C", "D", "E"].map((key) => ({ key, text: key, text_tr: key, explanation: "x", traps: trapsByKey[key] ?? [] })),
  }) as unknown as Question;

describe("parsePracticeParams", () => {
  it("kelime: sekme doğrulanır, yoksa tekrarda", () => {
    expect(parsePracticeParams({ tur: "kelime", sekme: "new" })).toEqual({ tur: "kelime", sekme: "new" });
    expect(parsePracticeParams({ tur: "kelime" })).toEqual({ tur: "kelime", sekme: "reviewing" });
    expect(parsePracticeParams({ tur: "kelime", sekme: "hepsi" })).toBeNull();
  });
  it("tuzak: kod TRAP_CODES içinde olmalı", () => {
    expect(parsePracticeParams({ tur: "tuzak", kod: "T3" })).toEqual({ tur: "tuzak", kod: "T3" });
    for (const kod of ["T99", undefined, ["T3", "T4"]]) expect(parsePracticeParams({ tur: "tuzak", kod })).toBeNull();
  });
  it("bilinmeyen ya da eksik tür reddedilir", () => {
    expect(parsePracticeParams({})).toBeNull();
    expect(parsePracticeParams({ tur: "soru" })).toBeNull();
    expect(parsePracticeParams({ tur: ["kelime", "tuzak"] })).toBeNull();
  });
});

describe("fellIdsFor", () => {
  it("yalnızca bu koda sahip şıkkı yanlış seçilen sorular", () => {
    const byId = new Map([["a", q("a", { B: ["T3"] })], ["b", q("b", { B: ["T6"] })]]);
    const at = (questionId: string, choice: string, correct: boolean) => ({ questionId, choice, correct, createdAt: new Date() });
    expect([...fellIdsFor("T3", [at("a", "B", false), at("b", "B", false), at("a", "A", true), at("gizli", "B", false)], byId)]).toEqual(["a"]);
  });
});

describe("pratik snapshot'ları", () => {
  const v = (word: string) => ({ word, tr: `${word}-tr`, warmup: true });

  it("kelime: sorusuz, yalnızca tekrar bölümü, sonra özet; boşsa null", () => {
    expect(wordPracticeSnapshot([], ["x"])).toBeNull();
    const snap = wordPracticeSnapshot([v("a"), v("b")], ["a-tr", "b-tr", "c-tr", "d-tr"])!;
    expect(snap).toMatchObject({ sessionId: "pratik", questions: [], position: 0, breakSeen: true, answers: {}, weekDays: 0, newLeft: 0, topTrap: null, tip: null });
    let s = initState(snap, () => 0.5, 0);
    expect(s.screen).toEqual({ kind: "warmup", block: REVIEW_BLOCK, idx: 0 });
    s = reduce(s, { type: "warmSkip", now: 1 });
    expect(s.screen).toEqual({ kind: "summary" });
  });

  it("tuzak: ısınma ve mola yok, doğrudan soru; boşsa null", () => {
    expect(trapPracticeSnapshot([])).toBeNull();
    const qs = ["1", "2", "3", "4", "5"].map((id) => q(id, {}, [v(`w${id}`)]));
    const snap = trapPracticeSnapshot(qs)!;
    expect(snap).toMatchObject({ sessionId: "pratik", reviewVocab: [], breakSeen: true, warmDone: [0, 4] });
    let s = initState(snap, () => 0.5, 0);
    expect(s.screen).toEqual({ kind: "question" });
    for (let i = 0; i < 5; i++) {
      s = reduce(s, { type: "select", key: "B" });
      s = reduce(s, { type: "submit", sure: true, now: 1 });
      s = reduce(s, { type: "next", now: 2 });
      expect(s.screen.kind).toBe(i < 4 ? "question" : "summary");
    }
  });
});
