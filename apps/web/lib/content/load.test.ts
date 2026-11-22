import { existsSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isExampleDir, loadQuestions, resolveContentDir } from "./load";
import { TOPICS } from "./schema";

const ROOT = path.resolve(__dirname, "..", "..", "..", "..", "content");
// Repodaki örnek içerik her zaman; gerçek sorular (content/sorular) varsa onlar da doğrulanır.
const DIRS = [path.join(ROOT, "ornek"), ...(existsSync(path.join(ROOT, "sorular")) ? [ROOT] : [])];

describe.each(DIRS)("içerik: %s", (dir) => {
  it("bütün soru dosyaları şemaya uyar", async () => {
    expect((await loadQuestions(dir)).length).toBeGreaterThan(0);
  });

  it("soru id'leri benzersiz", async () => {
    const ids = (await loadQuestions(dir)).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("her sorunun listeden bir konu etiketi var", async () => {
    for (const q of await loadQuestions(dir)) expect(TOPICS).toContain(q.topic);
  });
});

describe("içerik klasörü seçimi", () => {
  it("sorular klasörü yoksa örnek içeriğe düşer", () => {
    const root = mkdtempSync(path.join(tmpdir(), "yds-"));
    expect(resolveContentDir(root)).toBe(path.join(root, "ornek"));
    mkdirSync(path.join(root, "sorular"));
    expect(resolveContentDir(root)).toBe(root);
  });

  it("yalnızca içerik kökündeki ornek klasörü örnek sayılır", () => {
    const root = path.resolve("/icerik");
    expect(isExampleDir(path.join(root, "ornek"), root)).toBe(true);
    expect(isExampleDir(path.join(root, "ornek", "."), root)).toBe(true);
    expect(isExampleDir(path.resolve("/baska/ornek"), root)).toBe(false);
    expect(isExampleDir(root, root)).toBe(false);
  });
});
