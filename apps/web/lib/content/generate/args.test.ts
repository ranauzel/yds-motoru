import { describe, expect, it } from "vitest";
import { parseGenerateArgs } from "./args";

describe("parseGenerateArgs", () => {
  it("pdf, anahtar, sınav, ad ve tarih okunur", () => {
    expect(parseGenerateArgs(["a.pdf", "--anahtar", "k.txt", "--sinav", "2021-yds-1", "--ad", "2021 YDS/1", "--tarih", "2021-04-04"]))
      .toEqual({ pdf: "a.pdf", key: "k.txt", examId: "2021-yds-1", name: "2021 YDS/1", date: "2021-04-04" });
  });

  it("pdf, --anahtar, --sinav ya da --tarih eksikse kullanım satırıyla hata", () => {
    expect(() => parseGenerateArgs(["--anahtar", "k.txt", "--sinav", "x", "--tarih", "2021-04-04"])).toThrow(/content:generate/);
    expect(() => parseGenerateArgs(["a.pdf", "--sinav", "x", "--tarih", "2021-04-04"])).toThrow(/--anahtar/);
    expect(() => parseGenerateArgs(["a.pdf", "--anahtar", "k.txt", "--sinav", "x"])).toThrow(/--tarih/);
  });

  it("geçersiz sınav kimliği ve tarih reddedilir", () => {
    expect(() => parseGenerateArgs(["a.pdf", "--anahtar", "k", "--sinav", "../x", "--tarih", "2021-04-04"])).toThrow();
    expect(() => parseGenerateArgs(["a.pdf", "--anahtar", "k", "--sinav", "x", "--tarih", "4 Nisan"])).toThrow();
  });

  it("değeri olmayan bayrak hata verir", () => {
    expect(() => parseGenerateArgs(["a.pdf", "--anahtar", "--sinav", "x", "--tarih", "2021-04-04"])).toThrow(/--anahtar/);
  });
});
