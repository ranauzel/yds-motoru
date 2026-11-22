import { describe, expect, it } from "vitest";
import { parseImportArgs } from "./import-args";

describe("parseImportArgs", () => {
  it("klasör ve --sahip okunur", () => {
    expect(parseImportArgs(["../x", "--sahip", "a@b.co"])).toEqual({ dir: "../x", owner: "a@b.co" });
    expect(parseImportArgs(["--sahip", "a@b.co"])).toEqual({ dir: undefined, owner: "a@b.co" });
    expect(parseImportArgs([])).toEqual({ dir: undefined, owner: undefined });
  });

  it("--sahip değeri yoksa hata", () => {
    expect(() => parseImportArgs(["--sahip"])).toThrow(/--sahip/);
  });

  it("e-posta küçük harfe çevrilir (hesaplar küçük harfle kayıtlı)", () => {
    expect(parseImportArgs(["--sahip", " Ben@Ornek.COM "]).owner).toBe("ben@ornek.com");
  });
});
