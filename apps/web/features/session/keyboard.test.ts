import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/content/schema";
import { keyToAction } from "./keyboard";
import { initState, reduce, type Snapshot, type State } from "./session-machine";

const q = (n: number, vocab: Question["vocab"] = []) => ({
  id: `q${n}`, number: n, answer: "C", golden_rule: "", vocab,
  options: (["A", "B", "C", "D", "E"] as const).map((key) => ({ key, traps: key === "C" ? [] : ["T1"] })),
}) as unknown as Question;

const snap = (over: Partial<Snapshot> = {}): Snapshot => ({
  sessionId: "s", questions: Array.from({ length: 8 }, (_, i) => q(i + 1, i === 0 ? [{ word: "w", tr: "w-tr", warmup: true }, { word: "x", tr: "x-tr" }, { word: "y", tr: "y-tr" }, { word: "z", tr: "z-tr" }] : [])),
  position: 0, breakSeen: false, warmDone: [0], warmAnswers: {}, answers: {}, knownWords: [], reviewVocab: [], weekDays: 0, newLeft: 0, meaningPool: [], topTrap: null, tip: null, ...over,
});
const K = (key: string, mods: Partial<{ shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean; inSummary: boolean }> = {}) =>
  ({ key, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, inSummary: false, ...mods });
const NOW = 50;
const at = (over: Partial<Snapshot> = {}): State => initState(snap(over), () => 0.3, 0);
const answered = (): State => {
  let s = at();
  s = reduce(s, { type: "select", key: "C" });
  return reduce(s, { type: "submit", sure: true, now: 1 });
};

describe("keyToAction", () => {
  it("A selects option", () => expect(keyToAction(K("a"), at(), NOW)).toEqual({ type: "select", key: "A" }));
  it("Enter submits sure", () => {
    const s = reduce(at(), { type: "select", key: "B" });
    expect(keyToAction(K("Enter"), s, NOW)).toEqual({ type: "submit", sure: true, now: NOW });
  });
  it("Shift+Enter submits unsure", () => {
    const s = reduce(at(), { type: "select", key: "B" });
    expect(keyToAction(K("Enter", { shiftKey: true }), s, NOW)).toEqual({ type: "submit", sure: false, now: NOW });
  });
  it("Enter without a selection does nothing", () => expect(keyToAction(K("Enter"), at(), NOW)).toBeNull());
  it("Enter after answer goes next", () => expect(keyToAction(K("Enter"), answered(), NOW)).toEqual({ type: "next", now: NOW }));
  it("ArrowRight after answer goes next", () => expect(keyToAction(K("ArrowRight"), answered(), NOW)).toEqual({ type: "next", now: NOW }));
  it("letters do nothing after answer", () => expect(keyToAction(K("a"), answered(), NOW)).toBeNull());
  it("T toggles gloss", () => expect(keyToAction(K("t"), at(), NOW)).toEqual({ type: "toggle", tool: "gloss" }));
  it("K toggles words and I toggles hint", () => {
    expect(keyToAction(K("k"), at(), NOW)).toEqual({ type: "toggle", tool: "words" });
    expect(keyToAction(K("i"), at(), NOW)).toEqual({ type: "toggle", tool: "hint" });
  });
  it("ctrl+A ignored", () => expect(keyToAction(K("a", { ctrlKey: true }), at(), NOW)).toBeNull());
  it("keys inside a summary element are ignored", () => expect(keyToAction(K("Enter", { inSummary: true }), answered(), NOW)).toBeNull());
  it("warmup: B picks index 1, Enter goes next", () => {
    const s = at({ warmDone: [] });
    expect(keyToAction(K("b"), s, NOW)).toEqual({ type: "warmPick", choiceIndex: 1 });
    expect(keyToAction(K("e"), s, NOW)).toBeNull();
    const picked = reduce(s, { type: "warmPick", choiceIndex: 1 });
    expect(keyToAction(K("Enter"), picked, NOW)).toEqual({ type: "warmNext" });
  });
  it("warmupDone: Enter ends warmup", () => {
    const s = at({ warmDone: [], warmAnswers: { w: true } });
    expect(keyToAction(K("Enter"), s, NOW)).toEqual({ type: "warmEnd", now: NOW });
  });
  it("break: Enter continues", () => {
    expect(keyToAction(K("Enter"), at({ position: 4, warmDone: [0, 4] }), NOW)).toEqual({ type: "breakContinue", now: NOW });
  });
  it("review: arrows move", () => {
    const s = reduce(at({ position: 8 }), { type: "startReview" });
    expect(keyToAction(K("ArrowRight"), s, NOW)).toEqual({ type: "reviewMove", delta: 1 });
    expect(keyToAction(K("ArrowLeft"), s, NOW)).toEqual({ type: "reviewMove", delta: -1 });
  });
});

describe("keyToAction: konu tarif kartı", () => {
  const withIntro = (): State => {
    const qs = snap().questions.map((x) => ({ ...x, type: "cumle_tamamlama", topic: "zitlik" }) as Question);
    return initState(snap({ questions: qs, seenTopics: [] }), () => 0.3, 0);
  };
  it("kart açıkken Enter kartı geçer, şık tuşları çalışmaz", () => {
    expect(keyToAction(K("Enter"), withIntro(), NOW)).toEqual({ type: "dismissIntro", now: NOW });
    expect(keyToAction(K("a"), withIntro(), NOW)).toBeNull();
  });
});
