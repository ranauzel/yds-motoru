import { describe, expect, it } from "vitest";
import { TRAP_CODES } from "./schema";
import { TRAP_GUIDE } from "./traps";

describe("TRAP_GUIDE", () => {
  it("bütün tuzak kodları var ve metinler boş değil", () => {
    for (const code of TRAP_CODES) {
      expect(TRAP_GUIDE[code].how.trim()).not.toBe("");
      expect(TRAP_GUIDE[code].catch.trim()).not.toBe("");
    }
    expect(Object.keys(TRAP_GUIDE).sort()).toEqual([...TRAP_CODES].sort());
  });
});
