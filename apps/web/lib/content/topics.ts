// Konu haritası: her soru tipinin konuları ve her konunun tarifi. Tek kaynak; içerik şeması, soru hattı istemi
// ve arayüz buradan okur. Metinler docs/KONU-HARITASI.md'den (kullanıcı onaylı) alınır; önce orada değiştirilir.
// Bir tipin listesi boşsa o tipten soru içe aktarılamaz (haritası yazılmadan soru girmesin; spec §4.3).
import type { QuestionType, TrapCode } from "./schema";

export type TopicDef = {
  code: string;
  name: string;
  /** Soruda bu konuyu gösteren işaret (1 satır). */
  signal: string;
  /** Tarif: 3–4 adım. */
  steps: string[];
  traps: TrapCode[];
};

export const TOPIC_MAP: Record<QuestionType, readonly TopicDef[]> = {
  cumle_tamamlama: [
    {
      code: "kosul", name: "Koşul",
      signal: "if, unless, provided that, as long as; ya da verilen kısımda will/must ile gelecek bir sonuç var.",
      steps: [
        "Verilen kısım bağımsızsa şık bağlaçla başlamalı.",
        "Koşul sonucu gerçekten tetiklemeli: koşul–sonuç mantıklı mı?",
        "unless = if … not: olumlu bir genel yargıya istisna getirir.",
        "Zaman uyumu: if + present → will, if + past → would.",
      ],
      traps: ["T2", "T3", "T11"],
    },
    {
      code: "zitlik", name: "Zıtlık",
      signal: "although, even though, while, whereas, despite, however, yet.",
      steps: [
        "Bağlaçtan sonraki bilgi, diğer taraftaki eylemi beklenmedik kılmalı.",
        "Eylemi destekleyen bilgi zıtlık kurmaz: ele.",
        "Ana cümlede beklenmedik bir neden varsa, yan cümlede beklenen nedenin eksikliğini ara.",
        "Yapı: despite + isim öbeği, although + cümle.",
      ],
      traps: ["T3", "T5", "T11"],
    },
    {
      code: "neden_sonuc", name: "Neden-sonuç",
      signal: "because, since, as, so, therefore, so … that, such … that, as a result.",
      steps: [
        "Bağlaç neden mi sonuç mu getiriyor? Yaz (since → neden, so → sonuç).",
        "Şıktaki bilgi gerçekten o rolde mi? İki neden bağlaçlı şık varsa biri aslında sonuçtur.",
        "Yönü kontrol et: kim kime ihtiyaç duyuyor, ne neye yol açıyor?",
      ],
      traps: ["T7", "T3"],
    },
    {
      code: "ek", name: "Ekleme",
      signal: "in addition to, besides, as well as, moreover, not only … but also, for example.",
      steps: [
        "Ekleme aynı yönde devam ister: olumsuza olumsuz, olumluya olumlu.",
        "Verilen kısımda bir alan geçiyorsa (physical), doğru şık çoğunlukla eşini içerir (psychological).",
        "for example geliyorsa şık genel iddianın somut örneği olmalı.",
      ],
      traps: ["T3", "T5"],
    },
    {
      code: "zaman", name: "Zaman",
      signal: "when, while, as soon as, until, before, after, by the time, once; ya da After/Before + -ing.",
      steps: [
        "Zaman ilişkisini yaz: önce / sonra / aynı anda / bitiş noktası.",
        "Zamanları uyumlu kur: by the time + past → past perfect; until + present (perfect).",
        "After/Before + -ing: gizli özne ana cümlenin öznesiyle aynı olmalı.",
        "Süre bildiren eylem varsa (protect, wait) bitiş noktasını until ile ara.",
      ],
      traps: ["T2", "T6", "T8"],
    },
    {
      code: "amac", name: "Amaç",
      signal: "so that, in order to, so as to, başta To + fiil, for the purpose of.",
      steps: [
        "Boşlukta amaca yönelik bilinçli bir eylem olmalı.",
        "Yalnızca durum ya da sonuç bildiren şıkları ele.",
        "Amacı olumsuzlukla bozan ya da ters yöne götüren şıkları ele.",
        "so that + can/could/will zaman uyumunu kontrol et.",
      ],
      traps: ["T3", "T5"],
    },
    {
      code: "karsilastirma", name: "Karşılaştırma",
      signal: "more/less … than, as … as, the … the, compared to, unlike, similar to.",
      steps: [
        "Neyin neyle karşılaştırıldığını bul: iki taraf aynı türden olmalı (that of Y).",
        "Karşılaştırmanın yönünü kontrol et: more mi less mi?",
        "the more …, the more … kalıbında iki taraf aynı yapıda olmalı.",
      ],
      traps: ["T4", "T11"],
    },
    {
      code: "iliskili_yapi", name: "İlişkili yapı / gönderge",
      signal: "both … and, either … or, neither … nor, not only … but also, such/so … that; ya da şıkta it/they/this.",
      steps: [
        "Çift bağlacın eşini bul: either → or, neither → nor.",
        "Çift bağlacın iki tarafı aynı yapıda olmalı (isim–isim, fiil–fiil).",
        "Şıktaki zamir neyi gösteriyor? Tekil/çoğul ve anlam uyumunu kontrol et.",
      ],
      traps: ["T6", "T11"],
    },
  ],
  // Diğer tipler, soruları çıkarılırken docs/KONU-HARITASI.md'den eklenir.
  kelime: [], dilbilgisi: [], cloze: [], ceviri: [], okuma: [], diyalog: [], yakin_anlam: [],
  paragraf_tamamlama: [], anlami_bozan: [],
};

export function topicDef(type: QuestionType, code: string): TopicDef | undefined {
  return TOPIC_MAP[type].find((t) => t.code === code);
}

/** Konu kimliği (tip, konu): aynı kod farklı tiplerde tekrar edebilir. */
export const topicKey = (type: QuestionType, code: string) => `${type}:${code}`;
