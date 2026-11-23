import { describe, expect, it } from "vitest";
import { WordPracticeInput } from "./inputs";

describe("WordPracticeInput", () => {
  it("geçerli kelime ve boolean kabul edilir", () => {
    expect(WordPracticeInput.safeParse({ word: "abandon", correct: false }).success).toBe(true);
    expect(WordPracticeInput.safeParse({ word: "a".repeat(100), correct: true }).success).toBe(true);
  });

  it("boş, 100 karakterden uzun ve metin olmayan kelime reddedilir", () => {
    for (const word of ["", "a".repeat(101), 5, null, undefined, ["a"]])
      expect(WordPracticeInput.safeParse({ word, correct: true }).success).toBe(false);
  });

  it("correct boolean olmalı", () => {
    for (const correct of ["true", 1, null, undefined])
      expect(WordPracticeInput.safeParse({ word: "abandon", correct }).success).toBe(false);
  });
});
