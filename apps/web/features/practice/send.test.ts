import { describe, expect, it, vi } from "vitest";
import { practiceSend } from "./send";

describe("practiceSend", () => {
  it("yalnızca kelime cevabı iletilir; soru cevabı, ilerleme, ısınma bitişi, mola hiçbir şey yazmaz", async () => {
    const recordWord = vi.fn(async () => ({ ok: true as const }));
    await practiceSend({ kind: "recordWarmup", word: "w", correct: false }, recordWord);
    for (const e of [
      { kind: "recordAnswer", questionId: "q", answer: { choice: "A", sure: true, glossUsed: false, hintUsed: false, wordsUsed: false }, durationMs: 1 },
      { kind: "advance", position: 1 }, { kind: "markWarmDone", block: -1 }, { kind: "markBreakSeen" },
    ] as const) expect(await practiceSend(e, recordWord)).toBeUndefined();
    expect(recordWord).toHaveBeenCalledTimes(1);
    expect(recordWord).toHaveBeenCalledWith("w", false);
  });
});
