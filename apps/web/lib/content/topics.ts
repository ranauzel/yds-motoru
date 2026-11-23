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
  kelime: [
    {
      code: "esdizim", name: "Eşdizim / edat kalıbı",
      signal: "Boşluğun hemen yanında bir edat ya da kalıp isim var (___ on, make a ___).",
      steps: [
        "Boşluğun önündeki ve arkasındaki kelimeyi oku.",
        "Hangi şık bu edatla ya da isimle kalıp kurar? (depend on, comply with)",
        "Kalıp kurmayanları anlamına bakmadan ele.",
      ],
      traps: ["T12", "T15"],
    },
    {
      code: "baglam_yonu", name: "Bağlamdan yön",
      signal: "Cümlede but, although, and, as well as, because gibi yön bildiren bir kelime var.",
      steps: [
        "Yön kelimesini bul.",
        "Boşluk karşı taraftakiyle zıt mı, benzer mi olmalı? Yaz.",
        "Şıkların olumlu/olumsuz anlamını karşılaştır.",
        "Ters yöndeki şıkları ele.",
      ],
      traps: ["T3", "T9"],
    },
    {
      code: "phrasal_verb", name: "Phrasal verb",
      signal: "Şıklar aynı fiil + farklı edat (carry out / carry on) ya da farklı fiil + aynı edat.",
      steps: [
        "Cümlenin Türkçe anlamını boşluksuz kur.",
        "Gerekli anlamı tek kelimeyle yaz (\"yürütmek\").",
        "Anlamı eşleştir; emin değilsen nesneye bak (carry out + research).",
      ],
      traps: ["T12", "T15"],
    },
    {
      code: "benzer_kelime", name: "Benzer görünen kelime",
      signal: "Şıklarda yazılışı benzeyen çiftler var (adopt/adapt, affect/effect).",
      steps: [
        "Benzer çifti fark et.",
        "Her birinin Türkçesini yaz.",
        "Cümleye Türkçe yerleştir.",
      ],
      traps: ["T15"],
    },
    {
      code: "anlam", name: "Anlam ve ton",
      signal: "Belirgin bir kalıp ya da yön ipucu yok; soru düz anlam bilgisini ölçüyor.",
      steps: [
        "Cümlenin tonunu belirle (olumlu/olumsuz, bilimsel/gündelik).",
        "Ters tondaki şıkları ele.",
        "Kalanları Türkçe yerleştir.",
        "Anlamı en kesin olanı seç.",
      ],
      traps: ["T5", "T15"],
    },
  ],
  dilbilgisi: [
    {
      code: "tense", name: "Tense",
      signal: "Şıklar aynı fiilin farklı zamanları.",
      steps: [
        "Zaman ifadesini bul: since/for → present perfect; by the time + past → past perfect; ago/in 1990 → past simple; by + gelecek → future perfect.",
        "İfade yoksa cümledeki diğer fiilin zamanına uy.",
        "Uymayanları ele.",
      ],
      traps: ["T2"],
    },
    {
      code: "modal", name: "Modal",
      signal: "Şıklar must / might / should / could (+ have V3).",
      steps: [
        "Kesinlik mi, olasılık mı, gereklilik mi, tavsiye mi? Belirle.",
        "Geçmişe dairse modal + have V3.",
        "must have (kesin çıkarım), might have (olasılık), should have (yapılmalıydı) farkına bak.",
      ],
      traps: ["T4", "T2"],
    },
    {
      code: "edilgen", name: "Edilgen yapı",
      signal: "Şıklarda be + V3 ile etken biçim karışık.",
      steps: [
        "Özne eylemi yapan mı, eylemden etkilenen mi?",
        "Etkilenen ise edilgen.",
        "Sonra zamanı tense kuralıyla seç.",
      ],
      traps: ["T8", "T2"],
    },
    {
      code: "kosul", name: "If ve koşul",
      signal: "Cümlede if, unless, provided that ya da devrik had + özne var.",
      steps: [
        "Tipi belirle: gerçek (present → will), hayali şimdi (past → would), hayali geçmiş (had V3 → would have V3).",
        "İki tarafın zaman uyumunu kontrol et.",
        "Devrik yapıyı (Had I known…) if'li yapı olarak oku.",
      ],
      traps: ["T2", "T9"],
    },
    {
      code: "relative", name: "Relative clause",
      signal: "Şıklar who / which / whose / where / that ya da edat + which.",
      steps: [
        "Boşluktan önceki isim insan mı, şey mi, yer mi?",
        "Boşluktan sonra özne yoksa who/which/that; iyelikse whose; yer ise where ya da edat + which.",
        "Virgülden sonra that gelmez.",
      ],
      traps: ["T11"],
    },
    {
      code: "noun_clause", name: "Noun clause",
      signal: "Boşluk bir fiilin nesnesi ya da cümlenin öznesi; şıklar what / whether / that / how.",
      steps: [
        "Boşluktan sonraki cümlede eksik öğe varsa what.",
        "Eksik yoksa: evet/hayır anlamında whether, bilgi bildiriyorsa that.",
        "Soru düzeni değil, düz cümle düzeni olmalı.",
      ],
      traps: ["T11"],
    },
    {
      code: "gerund_inf", name: "Gerund / infinitive",
      signal: "Şıklar to V / V-ing / to have V3 / being V3.",
      steps: [
        "Önündeki fiil ya da edat neyi ister? (avoid + V-ing, manage + to V, edat + V-ing)",
        "Etken mi edilgen mi?",
        "Önceki zaman mı? (having V3 / to have V3)",
      ],
      traps: ["T12", "T11"],
    },
    {
      code: "edat", name: "Edat",
      signal: "Şıklar edat (in / on / at / by / with / for) ya da edat öbeği.",
      steps: [
        "Edatın bağlandığı kelimeye bak: sıfat, fiil ya da isim kalıbı (responsible for, in terms of).",
        "Zaman/yer edatıysa ölçeğe bak: in yıl/ay, on gün, at saat.",
      ],
      traps: ["T12"],
    },
    {
      code: "baglac", name: "Bağlaç",
      signal: "Şıklar bağlaç ya da bağlaç işlevli edat (although / despite / because / because of).",
      steps: [
        "İki tarafın ilişkisini yaz: zıt / neden / sonuç / koşul / zaman.",
        "Yapıya bak: tam cümle → although/because; isim öbeği → despite/because of.",
        "İkisine de uyan şıkkı seç.",
      ],
      traps: ["T3", "T11"],
    },
    {
      code: "karsilastirma", name: "Karşılaştırma ve niceleyici",
      signal: "Şıklar more / most / as…as / the…the ya da few / a few / little / much / each.",
      steps: [
        "Karşılaştırma iki şey mi (-er/more), grup mu (-est/most)?",
        "as … as ve the more…, the more… kalıbını tamamla.",
        "Niceleyicide sayılabilirlik (few/little) ve anlam (few = az, a few = birkaç) kontrolü yap.",
      ],
      traps: ["T4", "T9"],
    },
  ],
  // Diğer tipler, soruları çıkarılırken docs/KONU-HARITASI.md'den eklenir.
  cloze: [], ceviri: [], okuma: [], diyalog: [], yakin_anlam: [],
  paragraf_tamamlama: [], anlami_bozan: [],
};

export function topicDef(type: QuestionType, code: string): TopicDef | undefined {
  return TOPIC_MAP[type].find((t) => t.code === code);
}

/** Konu kimliği (tip, konu): aynı kod farklı tiplerde tekrar edebilir. */
export const topicKey = (type: QuestionType, code: string) => `${type}:${code}`;
