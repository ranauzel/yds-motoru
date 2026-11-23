// Cevap sonrası kutlama kararı (spec §5.5). Ses/patlama/bildirim dışarıdan verilir (fx), böylece testlenebilir.
// Gerçek fx: ./fx.ts (zzfx, canvas-confetti, sonner).
export type FxSound = "correct" | "wrong" | "streak";
export type Fx = { play: (k: FxSound) => void; burst: (big: boolean) => void; toast: (msg: string) => void };

export const STREAK = 3;
export const STREAK_MSG = "3 doğru üst üste — ritmi yakaladın";

/** Yanlışta yalnızca yumuşak ses; doğruda tını + (hareket açıksa) emoji patlaması, 3. doğruda bildirim. */
export function celebrate(
  kind: "correct" | "wrong",
  opts: { streak: number; sound: boolean; reducedMotion: boolean; fx: Fx },
): void {
  const { streak, sound, reducedMotion, fx } = opts;
  if (kind === "wrong") {
    if (sound) fx.play("wrong");
    return;
  }
  if (sound) fx.play(streak >= STREAK ? "streak" : "correct");
  if (!reducedMotion) fx.burst(streak >= STREAK);
  if (streak === STREAK) fx.toast(STREAK_MSG);
}
