// Soruya özel yol gösterme: şıkların kalıbına göre yönerge ve adımlar; soruya özel tuzak uyarısı.
// Saf fonksiyonlar. İçeriğe yeni alan eklemez, şık metinlerinden ve kök etiketlerinden çıkarır (spec: soruya-ozel-ipucu).
import type { Question } from "@/lib/content/schema";
import type { Snapshot } from "./session-machine";

// Yan cümle bağlaçları ve bağlantı sözcükleri. "so" aşağıda ayrı: "so it…" (bu yüzden) bağlaç, "so many…" değil.
const LINKERS = [
  "although", "though", "even though", "even if", "while", "whilst", "whereas", "because", "since", "so that",
  "if", "unless", "provided that", "providing that", "as long as", "once", "when", "whenever", "before", "after", "until",
  "whether", "despite", "in spite of", "however", "therefore", "thus", "hence", "but", "yet", "and", "or", "nor",
  "now that", "in case", "in order", "only if", "no matter", "by the time", "as soon as", "as if", "as though",
  "rather than", "not only", "given that", "for example", "for instance", "moreover", "furthermore",
  "nevertheless", "nonetheless", "consequently", "otherwise", "instead", "similarly", "likewise", "in addition",
  "as a result", "on the other hand", "in contrast", "on the contrary", "in fact", "indeed", "just as",
  "in other words", "even so", "thanks to", "due to", "because of",
];
// Çok anlamlılar: "so/as" nicelik bildirirken (so many, as many as) ve "for" edat iken (for centuries) bağlaç değil.
const AMBIGUOUS = [
  "so(?!\\s+(?:many|much|few|little|far|long)\\b)",
  "as(?!\\s+(?:many|much|few|little|far)\\s+as\\b)",
  "for(?=\\s+(?:it|they|he|she|we|this|these|those)\\b)",
];
const LINKER_RE = new RegExp(`^(?:${[...LINKERS.map((w) => w.replace(/ /g, "\\s+")), ...AMBIGUOUS].join("|")})\\b`, "i");

export function startsWithLinker(text: string): boolean {
  return LINKER_RE.test(text.trim());
}

export type OptionPattern = { kind: "all_linked" | "given_linked" | "mixed"; directive: string; steps: string[] };

/** Cümle tamamlamada şıkların kalıbı. Kalıp yoksa ya da başka tipse null (sabit yönerge kalır). */
export function optionPattern(q: Pick<Question, "type" | "options" | "stem_chunks">): OptionPattern | null {
  if (q.type !== "cumle_tamamlama") return null;
  const linked = q.options.filter((o) => startsWithLinker(o.text)).length;
  const stemConj = q.stem_chunks.some((c) => c.tag === "conj");

  if (linked === q.options.length)
    return {
      kind: "all_linked",
      directive: "Şıkların hepsi bağlaçla başlıyor: bağlaç tek başına seçtirmez, anlam ilişkisine bak.",
      steps: [
        ...(stemConj ? ["Verilen kısımda da bağlaç var: şıktaki bağlaçla iki yan cümle kalıyorsa ana cümle eksiktir, o şıkkı ele."] : []),
        "Verilen kısmı Türkçe tek cümleyle özetle.",
        "Her şıkta bağlacın kurduğu ilişkiyi yaz: zıtlık, neden, sonuç, koşul, zaman, ekleme.",
        "Şıkkın içeriği verilen kısımla bu ilişkiyi gerçekten kuruyor mu? Kurmuyorsa ele (although → beklenmedik bir durum gerekir).",
        "Birden fazla şık kalırsa zaman uyumuna ve zamirlerin neyi gösterdiğine bak.",
      ],
    };

  if (linked === 0 && stemConj)
    return {
      kind: "given_linked",
      directive: "Bağlaç verilen kısımda, şıklarda yok: şık ana cümleyi kurmalı ve bağlacın yönüne uymalı.",
      steps: [
        "Verilen kısımdaki bağlacın yönünü yaz (zıtlık / neden / koşul / zaman…).",
        "Bu yöne göre ana cümlede ne beklendiğini tahmin et: although → beklenmedik sonuç, because → sonuç, if → koşula bağlı sonuç.",
        "Tahminine anlamca en yakın şıkkı seç; konusu verilen kısımdan kopuk olanları ele.",
        "Kalanlarda zaman uyumuna bak.",
      ],
    };

  if (linked > 0)
    return {
      kind: "mixed",
      directive: "Şıkların bir kısmı bağlaçla başlıyor: önce cümle yapısıyla ele, sonra anlama bak.",
      steps: [
        stemConj
          ? "Verilen kısım bağlaçla başlıyor: bağlaçla başlayan şık ikinci bir yan cümle kurar ve ana cümle eksik kalır; bunları ele."
          : "Verilen kısım tam bir cümleyse şık onu bir bağlaçla ya da bağlantı sözcüğüyle sürdürmeli; yapısı bozuk kalanları ele.",
        "Kalan şıklarda anlam ilişkisini ve zaman uyumunu kontrol et.",
      ],
    };

  return null;
}

/** En sık düşülen tuzak bu sorunun yanlış şıklarından birinde etiketliyse uyarı; değilse null. */
export function trapWarningFor(
  q: Pick<Question, "answer" | "options">,
  top: Snapshot["topTrap"],
): Snapshot["topTrap"] {
  if (!top) return null;
  return q.options.some((o) => o.key !== q.answer && o.traps.includes(top.code)) ? top : null;
}
