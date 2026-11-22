import { describe, expect, it } from "vitest";
import { parseImportArgs, visibleTo } from "./import-args";

describe("parseImportArgs", () => {
  it("klasör ve --sahip okunur", () => {
    expect(parseImportArgs(["../x", "--sahip", "a@b.co"])).toEqual({ dir: "../x", owner: "a@b.co" });
    expect(parseImportArgs(["--sahip", "a@b.co"])).toEqual({ dir: undefined, owner: "a@b.co" });
    expect(parseImportArgs([])).toEqual({ dir: undefined, owner: undefined });
  });

  it("--sahip değeri yoksa hata", () => {
    expect(() => parseImportArgs(["--sahip"])).toThrow(/--sahip/);
  });
});

describe("visibleTo", () => {
  it("kendi sorusu olan kullanıcı yalnızca kendi sorularını görür", () => {
    expect(visibleTo(true)).toBe("own");
  });
  it("hiç sorusu olmayan kullanıcı (misafir) herkese açık örnekleri görür", () => {
    expect(visibleTo(false)).toBe("public");
  });
});
