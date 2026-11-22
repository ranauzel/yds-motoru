import { describe, expect, it } from "vitest";
import { createSaveQueue, type QueueStatus } from "./save-queue";
import type { Effect } from "./session-machine";

const e1: Effect = { kind: "advance", position: 1 };
const e2: Effect = { kind: "advance", position: 2 };
const e3: Effect = { kind: "markBreakSeen" };

/** Kuyruk boşalana kadar mikro görevleri işletir. */
async function drain(q: { pending(): number }) {
  for (let i = 0; i < 100 && q.pending(); i++) await new Promise((r) => setTimeout(r, 0));
}

describe("save queue", () => {
  it("sends effects in order", async () => {
    const sent: Effect[] = [];
    const q = createSaveQueue(async (e) => { sent.push(e); return { ok: true }; }, { sleep: async () => {} });
    q.push([e1, e2]);
    q.push([e3]);
    await drain(q);
    expect(sent).toEqual([e1, e2, e3]);
  });

  it("retries a failed effect before sending later ones", async () => {
    const log: string[] = [];
    let failed = false;
    const delays: number[] = [];
    const q = createSaveQueue(async (e) => {
      const name = e === e1 ? "e1" : "e2";
      if (e === e1 && !failed) { failed = true; log.push("e1:fail"); throw new Error("network"); }
      log.push(`${name}:ok`);
      return { ok: true };
    }, { sleep: async (ms) => { delays.push(ms); } });
    q.push([e1, e2]);
    await drain(q);
    expect(log).toEqual(["e1:fail", "e1:ok", "e2:ok"]);
    expect(delays).toEqual([1000]);
  });

  it("backs off with the default delays and repeats the last one", async () => {
    let n = 0;
    const delays: number[] = [];
    const q = createSaveQueue(async () => { if (n++ < 6) throw new Error("x"); return { ok: true }; },
      { sleep: async (ms) => { delays.push(ms); } });
    q.push([e1]);
    await drain(q);
    expect(delays).toEqual([1000, 2000, 5000, 10000, 10000, 10000]);
  });

  it("reports retrying then idle", async () => {
    const statuses: QueueStatus[] = [];
    let failed = false;
    const q = createSaveQueue(async () => { if (!failed) { failed = true; throw new Error("x"); } return { ok: true }; },
      { sleep: async () => {}, onStatus: (s) => statuses.push(s) });
    q.push([e1]);
    await drain(q);
    expect(statuses).toEqual(["saving", "retrying", "saving", "idle"]);
  });

  it("drops an effect the server permanently rejects", async () => {
    const sent: Effect[] = [];
    const q = createSaveQueue(async (e) => { sent.push(e); return e === e1 ? { ok: false, error: "not_found" } : { ok: true }; },
      { sleep: async () => { throw new Error("should not retry"); } });
    q.push([e1, e2]);
    await drain(q);
    expect(sent).toEqual([e1, e2]);
    expect(q.pending()).toBe(0);
  });

  it("ignores an empty push", () => {
    const statuses: QueueStatus[] = [];
    const q = createSaveQueue(async () => ({ ok: true }), { onStatus: (s) => statuses.push(s) });
    q.push([]);
    expect(statuses).toEqual([]);
  });
});

describe("save queue timeout", () => {
  it("retries a request that never answers", async () => {
    let calls = 0;
    const q = createSaveQueue(() => { calls++; return calls === 1 ? new Promise(() => {}) : Promise.resolve({ ok: true }); },
      { timeoutMs: 5, sleep: async () => {} });
    q.push([e1]);
    for (let i = 0; i < 50 && q.pending(); i++) await new Promise((r) => setTimeout(r, 5));
    expect(calls).toBe(2);
    expect(q.pending()).toBe(0);
  });
});
