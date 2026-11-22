import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/content/schema";
import {
  effectsFor, initState, isSnapshotAhead, reduce, summarize, warmVocab,
  type Action, type Snapshot, type State,
} from "./session-machine";

type Vocab = Question["vocab"][number];

function makeQuestion(n: number, opts: { vocab?: Vocab[]; answer?: "A" | "B" | "C" | "D" | "E" } = {}): Question {
  const answer = opts.answer ?? "C";
  return {
    id: `q${n}`, number: n, type: "cumle_tamamlama", sub_topic: "", difficulty: 1,
    stem: `Stem ${n} ----.`, stem_tr: `Kök ${n}`, stem_chunks: [{ en: `Stem ${n} ----.`, tr: `Kök ${n}` }],
    summary: `Özet ${n}`, answer,
    options: (["A", "B", "C", "D", "E"] as const).map((key) => ({
      key, text: `opt ${key}`, text_tr: `şık ${key}`,
      traps: key === answer ? [] : key === "A" ? ["T3", "T6"] : ["T6"],
      explanation: `açıklama ${key}`,
    })),
    solution_steps: [`ipucu ${n}`, "adım 2"], golden_rule: `kural ${n}`, structure: "",
    vocab: opts.vocab ?? [],
    review: { status: "reviewed", blind_solve_match: true },
  } as Question;
}

const w = (word: string, warmup = true): Vocab => ({ word, tr: `${word}-tr`, warmup, context: `ctx ${word}` });

/** 10 soru; blok 0'da w1,w2 (+ isınma dışı x1), blok 4'te w5, blok 8'de kelime yok. */
function questions(): Question[] {
  return Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const vocab = n === 1 ? [w("w1"), w("x1", false)] : n === 2 ? [w("w2"), w("w1")] : n === 5 ? [w("w5")] : [];
    return makeQuestion(n, { vocab });
  });
}

function snap(over: Partial<Snapshot> = {}): Snapshot {
  return {
    sessionId: "s1", questions: questions(), position: 0, breakSeen: false, warmDone: [],
    warmAnswers: {}, answers: {}, knownWords: [], ...over,
  };
}

const rng = () => 0.42;
const T0 = 1_000;

function run(state: State, ...actions: Action[]) {
  let s = state;
  const effects = [];
  for (const a of actions) {
    const next = reduce(s, a);
    effects.push(...effectsFor(s, a, next));
    s = next;
  }
  return { state: s, effects };
}

/** Isınmayı atlayıp ilk soruya geçer. */
const atQuestion = (over: Partial<Snapshot> = {}) => run(initState(snap(over), rng, T0), { type: "warmSkip" }).state;

describe("warmup", () => {
  it("starts with warmup at block 0 when unknown warmup words exist", () => {
    expect(initState(snap(), rng, T0).screen).toEqual({ kind: "warmup", block: 0, idx: 0 });
  });

  it("collects unique warmup words of the block only", () => {
    expect(warmVocab(snap(), 0).map((v) => v.word)).toEqual(["w1", "w2"]);
    expect(warmVocab(snap(), 4).map((v) => v.word)).toEqual(["w5"]);
  });

  it("known words are excluded from warmup", () => {
    expect(warmVocab(snap({ knownWords: ["w1"] }), 0).map((v) => v.word)).toEqual(["w2"]);
  });

  it("a word answered in this session stays in the block even if it became known", () => {
    expect(warmVocab(snap({ knownWords: ["w1"], warmAnswers: { w1: true } }), 0).map((v) => v.word)).toEqual(["w1", "w2"]);
  });

  it("builds 4 choices including the right translation", () => {
    const s = initState(snap(), rng, T0);
    const item = s.warmItems[0][0];
    expect(item.choices).toHaveLength(4);
    expect(item.choices).toContain("w1-tr");
    expect(new Set(item.choices).size).toBe(4);
  });

  it("resume mid-warmup continues at first unanswered word", () => {
    const s = initState(snap({ warmAnswers: { w1: true } }), rng, T0);
    expect(s.screen).toEqual({ kind: "warmup", block: 0, idx: 1 });
  });

  it("all words answered but block not closed resumes at warmupDone", () => {
    const s = initState(snap({ warmAnswers: { w1: true, w2: false } }), rng, T0);
    expect(s.screen).toEqual({ kind: "warmupDone", block: 0 });
  });

  it("records a warmup answer once", () => {
    const s0 = initState(snap(), rng, T0);
    const right = s0.warmItems[0][0].choices.indexOf("w1-tr");
    const { state, effects } = run(s0, { type: "warmPick", choiceIndex: right }, { type: "warmPick", choiceIndex: (right + 1) % 4 });
    expect(state.warmAnswers).toEqual({ w1: true });
    expect(effects).toEqual([{ kind: "recordWarmup", word: "w1", correct: true }]);
  });

  it("finishing warmup marks block done and opens the question", () => {
    const s0 = initState(snap(), rng, T0);
    const { state, effects } = run(s0,
      { type: "warmPick", choiceIndex: 0 }, { type: "warmNext" },
      { type: "warmPick", choiceIndex: 0 }, { type: "warmNext" },
      { type: "warmEnd", now: 5_000 });
    expect(state.screen).toEqual({ kind: "question" });
    expect(state.warmDone).toEqual([0]);
    expect(state.questionStartedAt).toBe(5_000);
    expect(effects.filter((e) => e.kind === "markWarmDone")).toEqual([{ kind: "markWarmDone", block: 0 }]);
  });

  it("skips warmup when the block has no words to warm", () => {
    expect(initState(snap({ position: 8 }), rng, T0).screen).toEqual({ kind: "question" });
  });
});

describe("answering", () => {
  it("submit without selection does nothing", () => {
    const s = atQuestion();
    const { state, effects } = run(s, { type: "submit", sure: true, now: 2_000 });
    expect(state).toBe(s);
    expect(effects).toEqual([]);
  });

  it("submit records the answer with tool usage and duration", () => {
    const s = atQuestion();
    const { state, effects } = run(s,
      { type: "toggle", tool: "hint" }, { type: "select", key: "B" }, { type: "submit", sure: false, now: s.questionStartedAt + 7_000 });
    const answer = { choice: "B", sure: false, glossUsed: false, hintUsed: true, wordsUsed: false };
    expect(state.answers.q1).toEqual(answer);
    expect(effects).toEqual([{ kind: "recordAnswer", questionId: "q1", answer, durationMs: 7_000 }]);
  });

  it("submit twice records once", () => {
    const s = atQuestion();
    const { effects } = run(s,
      { type: "select", key: "C" }, { type: "submit", sure: true, now: 2_000 }, { type: "submit", sure: false, now: 2_100 });
    expect(effects.filter((e) => e.kind === "recordAnswer")).toHaveLength(1);
  });

  it("gloss opened after answer does not mark glossUsed", () => {
    const s = atQuestion();
    const { state } = run(s, { type: "select", key: "C" }, { type: "submit", sure: true, now: 2_000 }, { type: "toggle", tool: "gloss" });
    expect(state.ui.gloss).toBe(true);
    expect(state.answers.q1.glossUsed).toBe(false);
  });

  it("gloss opened before answer marks glossUsed even if closed again", () => {
    const s = atQuestion();
    const { state } = run(s,
      { type: "toggle", tool: "gloss" }, { type: "toggle", tool: "gloss" }, { type: "select", key: "C" }, { type: "submit", sure: true, now: 2_000 });
    expect(state.answers.q1.glossUsed).toBe(true);
  });

  it("words and hint cannot be toggled after the answer", () => {
    const s = atQuestion();
    const { state } = run(s, { type: "select", key: "C" }, { type: "submit", sure: true, now: 2_000 }, { type: "toggle", tool: "hint" });
    expect(state.ui.hint).toBe(false);
  });

  it("next before answering does nothing", () => {
    const s = atQuestion();
    expect(run(s, { type: "next", now: 3_000 }).state).toBe(s);
  });
});

describe("navigation", () => {
  const answerAndNext = (now: number): Action[] => [{ type: "select", key: "C" }, { type: "submit", sure: true, now }, { type: "next", now }];

  it("next after 4th question shows break once", () => {
    const s = atQuestion({ position: 3, warmDone: [0] });
    const { state, effects } = run(s, ...answerAndNext(4_000));
    expect(state.position).toBe(4);
    expect(state.screen).toEqual({ kind: "break" });
    expect(state.breakSeen).toBe(true);
    expect(effects).toContainEqual({ kind: "advance", position: 4 });
    expect(effects).toContainEqual({ kind: "markBreakSeen" });
    const after = run(state, { type: "breakContinue", now: 5_000 }).state;
    expect(after.screen).toEqual({ kind: "warmup", block: 4, idx: 0 });
  });

  it("next inside a block goes straight to the next question", () => {
    const s = atQuestion();
    const { state, effects } = run(s, ...answerAndNext(4_000));
    expect(state.position).toBe(1);
    expect(state.screen).toEqual({ kind: "question" });
    expect(state.ui.sel).toBeNull();
    expect(state.questionStartedAt).toBe(4_000);
    expect(effects).toContainEqual({ kind: "advance", position: 1 });
  });

  it("next after last question shows summary and advances to N", () => {
    const s = atQuestion({ position: 9, breakSeen: true, warmDone: [0, 4, 8] });
    const { state, effects } = run(s, ...answerAndNext(9_000));
    expect(state.screen).toEqual({ kind: "summary" });
    expect(effects).toContainEqual({ kind: "advance", position: 10 });
  });

  it("resume on answered-but-not-advanced question shows feedback", () => {
    const answers = { q2: { choice: "A" as const, sure: true, glossUsed: false, hintUsed: false, wordsUsed: false } };
    const s = initState(snap({ position: 1, warmDone: [0], answers }), rng, T0);
    expect(s.screen).toEqual({ kind: "question" });
    expect(s.answers.q2.choice).toBe("A");
  });

  it("resume at position 4 before the break shows the break", () => {
    expect(initState(snap({ position: 4, warmDone: [0] }), rng, T0).screen).toEqual({ kind: "break" });
  });

  it("resume with position N shows summary", () => {
    expect(initState(snap({ position: 10 }), rng, T0).screen).toEqual({ kind: "summary" });
  });

  it("review walks answered questions without effects", () => {
    const s = initState(snap({ position: 10 }), rng, T0);
    const { state, effects } = run(s, { type: "startReview" }, { type: "reviewMove", delta: 1 }, { type: "reviewMove", delta: -1 }, { type: "reviewMove", delta: -1 });
    expect(state.screen).toEqual({ kind: "review", i: 0 });
    expect(effects).toEqual([]);
  });
});

describe("summarize", () => {
  it("counts traps of chosen wrong options, most frequent first, and sureWrong", () => {
    const a = (choice: "A" | "B" | "C", sure: boolean, glossUsed = false) => ({ choice, sure, glossUsed, hintUsed: false, wordsUsed: false });
    const r = summarize({
      questions: questions(),
      answers: { q1: a("A", true, true), q2: a("B", false), q3: a("C", true), q4: a("A", false) },
    });
    expect(r.right).toBe(1);
    expect(r.total).toBe(4);
    expect(r.traps).toEqual([["T6", 3], ["T3", 2]]);
    expect(r.wrongRules.map((x) => x.number)).toEqual([1, 2, 4]);
    expect(r.sureWrong).toBe(1);
    expect(r.glossCount).toBe(1);
  });
});

describe("isSnapshotAhead", () => {
  const a = { choice: "C" as const, sure: true, glossUsed: false, hintUsed: false, wordsUsed: false };

  it("is false for the snapshot the state was built from", () => {
    const s0 = snap({ position: 2, warmDone: [0], answers: { q1: a, q2: a } });
    expect(isSnapshotAhead(s0, initState(s0, rng, T0))).toBe(false);
  });

  it("is true when another device moved further", () => {
    const local = initState(snap({ position: 2, warmDone: [0], answers: { q1: a, q2: a } }), rng, T0);
    expect(isSnapshotAhead(snap({ position: 7, warmDone: [0, 4], breakSeen: true }), local)).toBe(true);
  });

  it("is true when the server has an answer or warmup word the local state lacks", () => {
    const local = initState(snap({ position: 1, warmDone: [0] }), rng, T0);
    expect(isSnapshotAhead(snap({ position: 1, warmDone: [0], answers: { q2: a } }), local)).toBe(true);
    const warm = initState(snap(), rng, T0);
    expect(isSnapshotAhead(snap({ warmAnswers: { w1: true } }), warm)).toBe(true);
  });

  it("is false when the local state is ahead of a stale snapshot", () => {
    const s0 = snap({ position: 1, warmDone: [0] });
    const local = run(initState(s0, rng, T0), { type: "select", key: "C" }, { type: "submit", sure: true, now: 2 }, { type: "next", now: 3 }).state;
    expect(isSnapshotAhead(s0, local)).toBe(false);
  });
});
