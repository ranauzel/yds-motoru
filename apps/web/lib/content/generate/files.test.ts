import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { archiveExisting } from "./files";

describe("archiveExisting", () => {
  it("var olan dosyayı zaman damgalı adla kenara alır ve yeni yolu döner", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "yds-"));
    const file = path.join(dir, "inceleme.json");
    writeFileSync(file, "eski");
    const moved = await archiveExisting(file, new Date("2026-11-23T10:15:30Z"));
    expect(moved).toBe(path.join(dir, "inceleme.2026-11-23T10-15-30.json"));
    expect(existsSync(file)).toBe(false);
    expect(readFileSync(moved!, "utf8")).toBe("eski");
  });

  it("dosya yoksa hiçbir şey yapmaz ve null döner", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "yds-"));
    expect(await archiveExisting(path.join(dir, "inceleme.json"), new Date())).toBeNull();
  });
});
