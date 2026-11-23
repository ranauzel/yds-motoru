import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Question } from "./schema";
import { TOPIC_MAP, topicDef, topicKey } from "./topics";

// Repodaki örnek sorulardan biri: şemaya uyan gerçek bir soru.
const sample = JSON.parse(readFileSync(path.resolve(__dirname, "../../../../content/ornek/sorular/ornek/cumle-tamamlama.json"), "utf8")).questions[0];

describe("konu haritası", () => {
  it("cümle tamamlamanın 8 konusu var, kodlar benzersiz, her tarif 3–4 adım", () => {
    const list = TOPIC_MAP.cumle_tamamlama;
    expect(list.map((t) => t.code)).toEqual(["kosul", "zitlik", "neden_sonuc", "ek", "zaman", "amac", "karsilastirma", "iliskili_yapi"]);
    for (const t of list) {
      expect(t.steps.length).toBeGreaterThanOrEqual(3);
      expect(t.steps.length).toBeLessThanOrEqual(4);
      expect(t.name && t.signal).toBeTruthy();
      expect(t.traps.length).toBeGreaterThan(0);
    }
  });

  it("topicDef bilinmeyen konuda undefined, topicKey tip:konu", () => {
    expect(topicDef("cumle_tamamlama", "zitlik")?.name).toBe("Zıtlık");
    expect(topicDef("cumle_tamamlama", "yok")).toBeUndefined();
    expect(topicDef("okuma", "zitlik")).toBeUndefined();
    expect(topicKey("cumle_tamamlama", "zitlik")).toBe("cumle_tamamlama:zitlik");
  });
});

describe("şema: tipe göre konu", () => {
  it("örnek soru geçer", () => {
    expect(Question.safeParse(sample).success).toBe(true);
  });

  it("listede olmayan konu reddedilir", () => {
    const r = Question.safeParse({ ...sample, topic: "yok" });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("yok");
  });

  it("haritası olmayan tipte soru reddedilir, hata mesajı tipi söyler", () => {
    const r = Question.safeParse({ ...sample, type: "okuma" });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("okuma");
  });
});
