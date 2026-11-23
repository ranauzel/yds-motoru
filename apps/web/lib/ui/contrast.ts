import { PALETTE } from "./palette";

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x kontrast oranı (1–21). Girdiler #rrggbb. */
export function contrastRatio(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const P = PALETTE;
const WHITE = "#ffffff";

/** (ad, yazı, zemin) — hepsi en az 4.5:1 olmalı. */
export const TEXT_PAIRS: [string, string, string][] = [
  ["text/bg", P.text, P.bg],
  ["text/surface", P.text, P.surface],
  ["muted/bg", P.muted, P.bg],
  ["muted/surface", P.muted, P.surface],
  ["accent/surface", P.accent, P.surface],
  ["beyaz/accent", WHITE, P.accent],
  ["accent/accentSoft", P.accent, P.accentSoft],
  ["ok/okSoft", P.ok, P.okSoft],
  ["warn/warnSoft", P.warn, P.warnSoft],
  ["beyaz/heroFrom", WHITE, P.heroFrom],
  ["beyaz/heroTo", WHITE, P.heroTo],
];
