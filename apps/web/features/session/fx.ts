"use client";
// Kutlamanın gerçek yan etkileri: zzfx (ses), canvas-confetti (emoji patlaması), sonner (bildirim).
// zzfx yüklenirken AudioContext kurar, bu yüzden kütüphaneler ilk kullanımda (bir tıklama/tuş anında) yüklenir.
import { toast } from "sonner";
import type { Fx, FxSound } from "./celebrate";

// zzfx parametreleri: hacim, rastgelelik, frekans, atak, sürdürme, bırakma, dalga, eğri, kayma, Δkayma, perde sıçraması, sıçrama anı.
const SOUNDS: Record<FxSound, number[]> = {
  correct: [0.5, 0, 784, 0.01, 0.04, 0.16, 0, 1.6, 0, 0, 392, 0.05],   // parlak tını, yukarı sıçrar
  streak: [0.6, 0, 659, 0.01, 0.1, 0.32, 0, 1.6, 0, 0, 330, 0.07],     // daha uzun tını
  wrong: [0.35, 0, 196, 0, 0.01, 0.05, 0, 1, -5],                       // yumuşak, kısa "tık"
};

const EMOJIS = ["👏", "🎉", "✨"];
const TICKS = 70; // ~60 fps'te ≈ 1,2 sn

export const realFx: Fx = {
  play(k) {
    import("zzfx").then(({ zzfx }) => zzfx(...SOUNDS[k])).catch(() => {});
  },
  burst(big) {
    import("canvas-confetti").then(({ default: confetti }) => {
      const scalar = big ? 2.2 : 1.8;
      confetti({
        shapes: EMOJIS.map((text) => confetti.shapeFromText({ text, scalar })),
        scalar,
        particleCount: big ? 36 : 14,
        spread: big ? 90 : 60,
        startVelocity: big ? 48 : 38,
        angle: 90,
        gravity: 1.3,
        ticks: TICKS,
        origin: { x: 0.5, y: 1 },
        flat: true,
        disableForReducedMotion: true,
      });
    }).catch(() => {});
  },
  toast(msg) {
    toast(msg);
  },
};
