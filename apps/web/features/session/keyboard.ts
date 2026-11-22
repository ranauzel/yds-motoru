// Masaüstü klavye kısayolları (pratik.html ile aynı): tuş → reducer eylemi.
import type { Action, OptionKey, State } from "./session-machine";

export type KeyInput = { key: string; shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean; inSummary: boolean };

const TOOL_KEYS = { T: "gloss", K: "words", I: "hint" } as const;

export function keyToAction(k: KeyInput, s: State, now: number): Action | null {
  if (k.ctrlKey || k.altKey || k.metaKey || k.inSummary) return null;
  const letter = k.key.length === 1 ? k.key.toUpperCase() : "";
  const scr = s.screen;

  switch (scr.kind) {
    case "break":
      return k.key === "Enter" ? { type: "breakContinue", now } : null;
    case "warmupDone":
      return k.key === "Enter" ? { type: "warmEnd", now } : null;
    case "warmup": {
      const item = s.warmItems[scr.block]?.[scr.idx];
      const picked = !!item && item.word in s.warmAnswers;
      if (picked) return k.key === "Enter" ? { type: "warmNext" } : null;
      const idx = "ABCD".indexOf(letter);
      return letter && idx >= 0 && idx < (item?.choices.length ?? 0) ? { type: "warmPick", choiceIndex: idx } : null;
    }
    case "review":
      if (k.key === "ArrowRight" || k.key === "Enter") return { type: "reviewMove", delta: 1 };
      if (k.key === "ArrowLeft") return { type: "reviewMove", delta: -1 };
      return letter === "T" ? { type: "toggle", tool: "gloss" } : null;
    case "question": {
      const q = s.questions[s.position];
      if (q && s.answers[q.id]) {
        if (k.key === "Enter" || k.key === "ArrowRight") return { type: "next", now };
        return letter === "T" ? { type: "toggle", tool: "gloss" } : null;
      }
      if (letter && "ABCDE".includes(letter)) return { type: "select", key: letter as OptionKey };
      if (k.key === "Enter") return s.ui.sel ? { type: "submit", sure: !k.shiftKey, now } : null;
      if (letter in TOOL_KEYS) return { type: "toggle", tool: TOOL_KEYS[letter as keyof typeof TOOL_KEYS] };
      return null;
    }
    default:
      return null;
  }
}
