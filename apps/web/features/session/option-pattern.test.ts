import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/content/schema";
import { optionPattern, startsWithLinker, trapWarningFor } from "./option-pattern";

type Q = Pick<Question, "type" | "options" | "stem_chunks" | "answer">;
const opt = (key: "A" | "B" | "C" | "D" | "E", text: string, traps: Question["options"][number]["traps"] = []) =>
  ({ key, text, text_tr: "-", traps, explanation: "-" });
const q = (texts: string[], stemConj: boolean, type: Question["type"] = "cumle_tamamlama"): Q => ({
  type,
  answer: "A",
  options: texts.map((t, i) => opt("ABCDE"[i] as "A", t)),
  stem_chunks: stemConj ? [{ en: "Although", tr: "-", tag: "conj" }, { en: "----", tr: "", tag: "blank" }] : [{ en: "----", tr: "", tag: "blank" }, { en: "x", tr: "-" }],
});

describe("startsWithLinker", () => {
  it("bağlaç ve bağlantı sözcüklerini tanır, büyük/küçük harf fark etmez", () => {
    for (const t of ["although it rained", "Because King", "even though", "for example, lying", "However, lying", "whether the", "as long as", "so it searched", "so they are", "in other words, the", "even so, architecture", "thanks to being", "for it is", "as it is", "as many books are"])
      expect(startsWithLinker(t)).toBe(true);
  });
  it("sıradan cümle başlarını bağlaç saymaz", () => {
    for (const t of ["the workers were", "it remained closed", "so many people use it", "so much of", "There is", "Asian markets", "some researchers", "as many as 40", "for centuries, ice"])
      expect(startsWithLinker(t)).toBe(false);
  });
});

describe("optionPattern", () => {
  it("şıkların hepsi bağlaçlıysa: anlam ilişkisi adımları, 'bağlaç tek başına seçtirmez' yönergesi", () => {
    const p = optionPattern(q(["because a", "when b", "if c", "while d", "although e"], false))!;
    expect(p.kind).toBe("all_linked");
    expect(p.directive).toMatch(/hepsi bağlaçla başlıyor/);
    expect(p.steps.some((s) => /ilişkiyi yaz/.test(s))).toBe(true);
    expect(p.steps.some((s) => /iki yan cümle/.test(s))).toBe(false);
  });
  it("hepsi bağlaçlı ve kökte de bağlaç varsa iki yan cümle uyarısı eklenir", () => {
    const p = optionPattern(q(["because a", "when b", "if c", "while d", "although e"], true))!;
    expect(p.steps[0]).toMatch(/iki yan cümle/);
  });
  it("bağlaç kökteyse ve şıklarda yoksa: bağlacın yönünden ana cümleyi tahmin et", () => {
    const p = optionPattern(q(["the workers", "it remained", "the city", "it had been", "so many people"], true))!;
    expect(p.kind).toBe("given_linked");
    expect(p.steps.some((s) => /tahmin/.test(s))).toBe(true);
  });
  it("karışık şıklarda önce yapıyla eleme", () => {
    const p = optionPattern(q(["it is", "the first", "whether the", "its applications", "the number"], true))!;
    expect(p.kind).toBe("mixed");
    expect(p.directive).toMatch(/yapı/);
  });
  it("kalıp yoksa ya da tip cümle tamamlama değilse null", () => {
    expect(optionPattern(q(["the a", "the b", "the c", "the d", "the e"], false))).toBeNull();
    expect(optionPattern(q(["because a", "when b", "if c", "while d", "although e"], false, "dilbilgisi"))).toBeNull();
  });
});

describe("trapWarningFor", () => {
  const top = { code: "T3" as const, name: "Bağlaç yönü", catch: "-" };
  const withTraps = (traps: Record<string, Question["options"][number]["traps"]>): Pick<Question, "answer" | "options"> => ({
    answer: "A",
    options: (["A", "B", "C", "D", "E"] as const).map((k) => opt(k, "x", traps[k] ?? [])),
  });
  it("en sık tuzak bu sorunun yanlış şıklarından birindeyse uyarı döner", () => {
    expect(trapWarningFor(withTraps({ C: ["T3"] }), top)).toBe(top);
  });
  it("tuzak soruda yoksa, yalnızca doğru şıkta etiketliyse ya da en sık tuzak yoksa uyarı yok", () => {
    expect(trapWarningFor(withTraps({ C: ["T2"] }), top)).toBeNull();
    expect(trapWarningFor(withTraps({ A: ["T3"] }), top)).toBeNull();
    expect(trapWarningFor(withTraps({ C: ["T3"] }), null)).toBeNull();
  });
});
