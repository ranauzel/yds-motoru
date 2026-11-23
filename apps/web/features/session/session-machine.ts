// Pratik oturumunun akışı: saf reducer + yan etki hesabı. React'ten ve sunucudan bağımsız, testli.
// Davranış referansı: pipeline/build_practice.py (pratik.html). Tasarım: docs/superpowers/specs/2026-11-22-pratik-ekrani-design.md
import type { Question, TrapCode } from "@/lib/content/schema";

export const BREAK_AFTER = 4;   // blok boyutu: mola + kelime ısınması her 4 soruda bir
export const WARM_MAX = 8;      // bir blok ısınmasında en fazla kaç yeni kelime (oturum ~25 dk'yı aşmasın)
/** Oturum başındaki kelime tekrarı bölümünün blok numarası (warmItems/warmDone içinde). */
export const REVIEW_BLOCK = -1;

export type OptionKey = "A" | "B" | "C" | "D" | "E";
export type Tool = "gloss" | "words" | "hint";
export type AnswerRecord = { choice: OptionKey; sure: boolean; glossUsed: boolean; hintUsed: boolean; wordsUsed: boolean };

/** Sunucudan gelen oturum durumu. */
export type Snapshot = {
  sessionId: string;
  questions: Question[];                       // question_ids sırasıyla
  position: number;
  breakSeen: boolean;
  warmDone: number[];
  warmAnswers: Record<string, boolean>;
  answers: Record<string, AnswerRecord>;       // anahtar: question id
  knownWords: string[];                        // oturum açılışında "bilinen" kelimeler
  reviewVocab: Question["vocab"];              // bugünün tekrar kelimeleri (sırasıyla, anlamlarıyla)
  weekDays: number;                            // bu hafta oturumu bitirilmiş gün sayısı (affedici seri)
  newLeft: number;                             // havuzda kalan yeni soru sayısı
  meaningPool: string[];                       // görünür bütün kelime anlamları (az kelimeli tekrarda da 3 yanlış şık için)
};

export type WarmItem = { word: string; tr: string; context?: string; choices: string[] };

export type Screen =
  | { kind: "warmup"; block: number; idx: number }
  | { kind: "warmupDone"; block: number }
  | { kind: "question" }
  | { kind: "break" }
  | { kind: "summary" }
  | { kind: "review"; i: number };

export type Ui = {
  sel: OptionKey | null;
  gloss: boolean; words: boolean; hint: boolean;
  used: Record<Tool, boolean>;                 // cevaptan önce açıldı mı
  warmPick: number | null;                     // ısınmada seçilen şıkkın indeksi
};

export type State = Snapshot & {
  warmItems: Record<number, WarmItem[]>;
  screen: Screen;
  ui: Ui;
  questionStartedAt: number;
};

export type Action =
  | { type: "select"; key: OptionKey }
  | { type: "toggle"; tool: Tool }
  | { type: "submit"; sure: boolean; now: number }
  | { type: "next"; now: number }
  | { type: "warmPick"; choiceIndex: number }
  | { type: "warmNext" }
  | { type: "warmSkip"; now?: number }
  | { type: "warmEnd"; now: number }
  | { type: "breakContinue"; now: number }
  | { type: "startReview" }
  | { type: "reviewMove"; delta: 1 | -1 };

export type Effect =
  | { kind: "recordAnswer"; questionId: string; answer: AnswerRecord; durationMs: number }
  | { kind: "advance"; position: number }
  | { kind: "recordWarmup"; word: string; correct: boolean }
  | { kind: "markWarmDone"; block: number }
  | { kind: "markBreakSeen" };

const freshUi = (): Ui => ({
  sel: null, gloss: false, words: false, hint: false,
  used: { gloss: false, words: false, hint: false }, warmPick: null,
});

/**
 * Bloğun ısınma kelimeleri: tekil, `warmup: true`; bilinenler hariç (bu oturumda cevaplananlar kalır).
 * Bugünün tekrar kelimeleri hiç alınmaz: onlar oturum başındaki kelime tekrarında zaten soruluyor.
 */
export function warmVocab(s: Pick<Snapshot, "questions" | "knownWords" | "warmAnswers" | "reviewVocab">, block: number): Question["vocab"] {
  const known = new Set(s.knownWords);
  const seen = new Set<string>(s.reviewVocab.map((v) => v.word));
  const out: Question["vocab"] = [];
  for (const q of s.questions.slice(block, block + BREAK_AFTER))
    for (const v of q.vocab) {
      if (!v.warmup || seen.has(v.word)) continue;
      if (known.has(v.word) && !(v.word in s.warmAnswers)) continue;
      seen.add(v.word);
      out.push(v);
    }
  return out.slice(0, WARM_MAX);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Her blok başı için ısınma öğeleri; şıklar doğru anlam + diğer kelimelerin anlamlarından 3 tane. */
export function buildWarmItems(s: Snapshot, rng: () => number): Record<number, WarmItem[]> {
  const allTr = [...new Set([...s.questions.flatMap((q) => q.vocab.map((v) => v.tr)), ...s.reviewVocab.map((v) => v.tr), ...s.meaningPool])];
  const toItem = (v: Question["vocab"][number]): WarmItem => ({
    word: v.word, tr: v.tr, context: v.context,
    choices: shuffle([v.tr, ...shuffle(allTr.filter((t) => t !== v.tr), rng).slice(0, 3)], rng),
  });
  const out: Record<number, WarmItem[]> = {};
  if (s.reviewVocab.length) out[REVIEW_BLOCK] = s.reviewVocab.map(toItem);
  for (let block = 0; block < s.questions.length; block += BREAK_AFTER)
    out[block] = warmVocab(s, block).map(toItem);
  return out;
}

/** Bir ısınma bloğunun ekranı: ilk cevaplanmamış kelime, hepsi cevaplandıysa bitiş ekranı. */
function warmScreen(items: WarmItem[], warmAnswers: Record<string, boolean>, block: number): Screen {
  const idx = items.findIndex((it) => !(it.word in warmAnswers));
  return idx === -1 ? { kind: "warmupDone", block } : { kind: "warmup", block, idx };
}

/** Verilen pozisyonda hangi ekranın açılacağı (mola kontrolü dahil). */
function screenAt(s: Pick<State, "questions" | "position" | "breakSeen" | "warmDone" | "warmAnswers" | "warmItems">): Screen {
  const n = s.questions.length;
  // Oturum başındaki kelime tekrarı, bitene kadar her şeyden önce gelir (soru olmasa bile).
  const review = s.warmItems[REVIEW_BLOCK] ?? [];
  if (review.length && !s.warmDone.includes(REVIEW_BLOCK)) return warmScreen(review, s.warmAnswers, REVIEW_BLOCK);
  if (s.position >= n) return { kind: "summary" };
  if (s.position === BREAK_AFTER && !s.breakSeen) return { kind: "break" };
  if (s.position % BREAK_AFTER === 0 && !s.warmDone.includes(s.position)) {
    const items = s.warmItems[s.position] ?? [];
    if (items.length) return warmScreen(items, s.warmAnswers, s.position);
  }
  return { kind: "question" };
}

export function initState(s: Snapshot, rng: () => number, now: number): State {
  const base = { ...s, warmItems: buildWarmItems(s, rng), ui: freshUi(), questionStartedAt: now };
  return { ...base, screen: screenAt(base) };
}

const currentQuestion = (s: State): Question | undefined => s.questions[s.position];

function isAnswered(s: State): boolean {
  const q = currentQuestion(s);
  return !!q && !!s.answers[q.id];
}

export function reduce(s: State, a: Action): State {
  const scr = s.screen;
  switch (a.type) {
    case "select": {
      if (scr.kind !== "question" || isAnswered(s)) return s;
      return { ...s, ui: { ...s.ui, sel: a.key } };
    }
    case "toggle": {
      if (scr.kind !== "question" && scr.kind !== "review") return s;
      const answered = scr.kind === "review" || isAnswered(s);
      if (a.tool !== "gloss" && answered) return s;
      const on = !s.ui[a.tool];
      const used = on && !answered ? { ...s.ui.used, [a.tool]: true } : s.ui.used;
      return { ...s, ui: { ...s.ui, [a.tool]: on, used } };
    }
    case "submit": {
      const q = currentQuestion(s);
      if (scr.kind !== "question" || !q || !s.ui.sel || s.answers[q.id]) return s;
      const answer: AnswerRecord = {
        choice: s.ui.sel, sure: a.sure,
        glossUsed: s.ui.used.gloss, hintUsed: s.ui.used.hint, wordsUsed: s.ui.used.words,
      };
      return { ...s, answers: { ...s.answers, [q.id]: answer }, ui: { ...s.ui, words: false, hint: false } };
    }
    case "next": {
      if (scr.kind !== "question" || !isAnswered(s)) return s;
      const position = s.position + 1;
      const entersBreak = position === BREAK_AFTER && !s.breakSeen && position < s.questions.length;
      const moved = { ...s, position, ui: freshUi(), questionStartedAt: a.now };
      if (entersBreak) return { ...moved, breakSeen: true, screen: { kind: "break" } };
      return { ...moved, screen: screenAt(moved) };
    }
    case "breakContinue": {
      if (scr.kind !== "break") return s;
      const cont = { ...s, breakSeen: true, questionStartedAt: a.now };
      return { ...cont, screen: screenAt(cont) };
    }
    case "warmPick": {
      if (scr.kind !== "warmup") return s;
      const item = s.warmItems[scr.block]?.[scr.idx];
      if (!item || item.word in s.warmAnswers) return s;
      const correct = item.choices[a.choiceIndex] === item.tr;
      return { ...s, warmAnswers: { ...s.warmAnswers, [item.word]: correct }, ui: { ...s.ui, warmPick: a.choiceIndex } };
    }
    case "warmNext": {
      if (scr.kind !== "warmup") return s;
      const items = s.warmItems[scr.block] ?? [];
      if (!(items[scr.idx]?.word in s.warmAnswers)) return s;
      const idx = items.findIndex((it, i) => i > scr.idx && !(it.word in s.warmAnswers));
      const screen: Screen = idx === -1 ? { kind: "warmupDone", block: scr.block } : { kind: "warmup", block: scr.block, idx };
      return { ...s, screen, ui: { ...s.ui, warmPick: null } };
    }
    case "warmSkip":
    case "warmEnd": {
      if (scr.kind !== "warmup" && scr.kind !== "warmupDone") return s;
      const warmDone = s.warmDone.includes(scr.block) ? s.warmDone : [...s.warmDone, scr.block];
      // Sıradaki ekran durumdan hesaplanır: tekrardan sonra blok 0 ısınması, soru ya da (soru yoksa) özet.
      const ended = { ...s, warmDone, ui: freshUi(), questionStartedAt: a.now ?? s.questionStartedAt };
      return { ...ended, screen: screenAt(ended) };
    }
    case "startReview": {
      if (scr.kind !== "summary" || !s.questions.length) return s;
      return { ...s, screen: { kind: "review", i: 0 }, ui: freshUi() };
    }
    case "reviewMove": {
      if (scr.kind !== "review") return s;
      const i = scr.i + a.delta;
      if (i >= s.questions.length) return { ...s, screen: { kind: "summary" }, ui: freshUi() };
      return { ...s, screen: { kind: "review", i: Math.max(0, i) }, ui: freshUi() };
    }
  }
}

export function effectsFor(prev: State, a: Action, next: State): Effect[] {
  if (prev === next) return [];
  switch (a.type) {
    case "submit": {
      const q = prev.questions[prev.position];
      return [{ kind: "recordAnswer", questionId: q.id, answer: next.answers[q.id], durationMs: Math.max(0, a.now - prev.questionStartedAt) }];
    }
    case "next": {
      const out: Effect[] = [{ kind: "advance", position: next.position }];
      if (next.breakSeen && !prev.breakSeen) out.push({ kind: "markBreakSeen" });
      return out;
    }
    case "breakContinue":
      return prev.breakSeen ? [] : [{ kind: "markBreakSeen" }];
    case "warmPick": {
      const word = Object.keys(next.warmAnswers).find((k) => !(k in prev.warmAnswers));
      return word ? [{ kind: "recordWarmup", word, correct: next.warmAnswers[word] }] : [];
    }
    case "warmSkip":
    case "warmEnd": {
      const block = next.warmDone.find((b) => !prev.warmDone.includes(b));
      return block === undefined ? [] : [{ kind: "markWarmDone", block }];
    }
    default:
      return [];
  }
}

/**
 * Sunucudan gelen durum yerel durumda olmayan bir ilerleme içeriyor mu? (başka cihazda devam edilmiş)
 * Next sayfaları gizleyip durumunu koruduğu için yeniden açılışta yeni snapshot buna göre benimsenir.
 */
export function isSnapshotAhead(snap: Snapshot, s: State): boolean {
  return snap.position > s.position
    || (snap.breakSeen && !s.breakSeen)
    || snap.warmDone.some((b) => !s.warmDone.includes(b))
    || Object.keys(snap.answers).some((k) => !s.answers[k])
    || Object.keys(snap.warmAnswers).some((k) => !(k in s.warmAnswers));
}

export function summarize(s: Pick<State, "questions" | "answers" | "reviewVocab" | "warmAnswers">) {
  const done = s.questions.filter((q) => s.answers[q.id]);
  const wrong = done.filter((q) => s.answers[q.id].choice !== q.answer);
  const count = new Map<TrapCode, number>();
  for (const q of wrong) {
    const opt = q.options.find((o) => o.key === s.answers[q.id].choice);
    for (const t of opt?.traps ?? []) count.set(t, (count.get(t) ?? 0) + 1);
  }
  return {
    right: done.length - wrong.length,
    total: done.length,
    traps: [...count.entries()].sort((x, y) => y[1] - x[1]) as [TrapCode, number][],
    wrongRules: wrong.map((q) => ({ number: q.number, rule: q.golden_rule })),
    sureWrong: wrong.filter((q) => s.answers[q.id].sure).length,
    glossCount: done.filter((q) => s.answers[q.id].glossUsed).length,
    reviewTotal: s.reviewVocab.length,
    reviewKnown: s.reviewVocab.filter((v) => s.warmAnswers[v.word] === true).length,
  };
}
