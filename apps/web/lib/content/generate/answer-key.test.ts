import { describe, expect, it } from "vitest";
import { parseAnswerKey } from "./answer-key";

describe("parseAnswerKey", () => {
  it("satırları numara → şık olarak okur", () => {
    expect(parseAnswerKey("27: C\n28: a\n")).toEqual(new Map([[27, "C"], [28, "A"]]));
  });

  it("CRLF, boş satır ve fazla boşluk sorun değil", () => {
    expect(parseAnswerKey("\r\n 27 :  B \r\n\r\n29:E")).toEqual(new Map([[27, "B"], [29, "E"]]));
  });

  it("A–E dışındaki şık satırıyla birlikte hata verir", () => {
    expect(() => parseAnswerKey("27: F")).toThrow(/27: F/);
  });

  it("tekrar eden numara hata verir", () => {
    expect(() => parseAnswerKey("27: A\n27: B")).toThrow(/27/);
  });

  it("1–80 dışındaki numara ya da biçimsiz satır hata verir", () => {
    expect(() => parseAnswerKey("81: A")).toThrow();
    expect(() => parseAnswerKey("0: A")).toThrow();
    expect(() => parseAnswerKey("yirmi yedi: A")).toThrow();
  });
});
