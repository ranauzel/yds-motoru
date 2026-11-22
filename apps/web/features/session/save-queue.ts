// Sıralı, yeniden denemeli kayıt kuyruğu. Geri bildirim sunucuyu beklemez; kayıtlar arka planda sırayla gider.
import type { Effect } from "./session-machine";

export type QueueStatus = "idle" | "saving" | "retrying";
type SendResult = { ok: boolean; error?: string } | void;

const DEFAULT_DELAYS = [1000, 2000, 5000, 10000];

export function createSaveQueue(
  send: (e: Effect) => Promise<SendResult>,
  opts: { retryDelaysMs?: number[]; onStatus?: (s: QueueStatus) => void; sleep?: (ms: number) => Promise<void>; timeoutMs?: number } = {},
) {
  const delays = opts.retryDelaysMs ?? DEFAULT_DELAYS;
  const timeoutMs = opts.timeoutMs ?? 15000;  // takılı kalan istek (ör. ağ değişimi) kuyruğu sonsuza dek durdurmasın
  const withTimeout = (p: Promise<SendResult>) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const t = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error("timeout")), timeoutMs); });
    return Promise.race([p, t]).finally(() => clearTimeout(timer));
  };
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const queue: Effect[] = [];
  let running = false;
  let status: QueueStatus = "idle";
  const setStatus = (s: QueueStatus) => { if (s !== status) { status = s; opts.onStatus?.(s); } };

  async function run() {
    running = true;
    let failures = 0;
    setStatus("saving");
    while (queue.length) {
      try {
        await withTimeout(send(queue[0]));   // ok: false = kalıcı ret (ör. oturum yok): yeniden denenmez, atılır
        queue.shift();
        failures = 0;
      } catch {
        setStatus("retrying");
        await sleep(delays[Math.min(failures, delays.length - 1)]);
        failures++;
        setStatus("saving");
      }
    }
    running = false;
    setStatus("idle");
  }

  return {
    push(effects: Effect[]) {
      if (!effects.length) return;
      queue.push(...effects);
      if (!running) void run();
    },
    pending: () => queue.length,
  };
}
