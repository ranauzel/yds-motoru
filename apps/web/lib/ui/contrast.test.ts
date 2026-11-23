import { describe, expect, it } from "vitest";
import { contrastRatio, TEXT_PAIRS } from "./contrast";

describe("kontrast", () => {
  it("WCAG örnekleri: siyah/beyaz 21, aynı renk 1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#6d4aff", "#6d4aff")).toBeCloseTo(1, 5);
  });
  it.each(TEXT_PAIRS)("%s en az 4.5:1", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
