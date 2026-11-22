// Soru hattının talimatları: tip tablosu (numara aralığı, dosya adı, talimat) ve kör çözüm talimatı.
// Tuzak kataloğu ve strateji kartı docs/TASARIM.md §4 ve §5.4'ten birebir alınmıştır; orada değişirse burada da güncelle.
import type { z } from "zod";
import { TOPICS, type OptionKey, type Question } from "../schema";

type Answers = Map<number, z.infer<typeof OptionKey>>;

const TRAP_CATALOG = `| Kod | Tuzak | Nasıl çalışır | Nasıl yakalanır |
|---|---|---|---|
| **T1** | Kelime tekrarı | Metindeki kelime şıkta aynen geçer, tanıdık geldiği için seçilir ama söylenen şey farklıdır | Kelimeye değil iddiaya bak: "Metin bunu *söylüyor mu*?" |
| **T2** | Zaman uyumsuzluğu | Anlam uygun ama tense yan cümleyle/metinle uyuşmaz | Önce verilen kısmın zamanını belirle, uyumsuzları anlamına bakmadan ele |
| **T3** | Bağlaç yönü | Zıtlık beklenirken paralel ya da sonuç bildiren şık (veya tersi) | Bağlacı bul, yönü yaz (zıt / neden / sonuç / ek), şıkkın yönünü karşılaştır |
| **T4** | Kapsam kayması | *some→all, may→will, often→always, many→most* | Niceleyici ve modal kelimelerin altını çiz, birebir karşılaştır |
| **T5** | Gerçek ama alakasız | Dünyada doğru bir bilgi ama soruyla/metinle bağı yok | "Bunu metinden mi biliyorum, genel kültürden mi?" |
| **T6** | Zamir uyumsuzluğu | *they/it/this/such* yanlış şeyi gösterir, tekil-çoğul uyumsuz | Her zamirin neyi gösterdiğini bul |
| **T7** | Neden-sonuç ters | Sebep ile sonucun yeri değiştirilmiş | "Hangisi önce oldu, hangisi diğerine yol açtı?" |
| **T8** | Özne kayması | Cümlenin öznesi başka bir şeye dönmüş (özellikle çeviride) | Önce ana özne + ana yüklemi bul, şıklarda karşılaştır |
| **T9** | Olumsuzluk | *hardly, no longer, not only, few (vs a few), unless* anlamı tersine çevirir | Olumsuzluk sözcüklerini işaretle |
| **T10** | Konu doğru, odak yanlış | Aynı konudan bahseder ama paragrafın akışından sapar | Konuya değil, paragrafın *söylediği şeye* bak |
| **T11** | Yapısal uyumsuzluk | Anlam doğru ama yapı yanlış: *despite* + cümle, iki bağlaç, bağlaçsız iki cümle | Bağlacın ardından ne geldiğini kontrol et (isim öbeği mi, cümle mi?) |
| **T12** | Eşdizim / edat | Anlamca yakın ama kalıp olarak birlikte kullanılmayan kelime/edat | Kalıbı ezberle: *depend on, responsible for, make a decision* |
| **T13** | Görüş sahibi karışıklığı | Metindeki bir kişinin görüşü yazarınki gibi sunulur | "Bunu kim söylüyor?" |
| **T14** | Aşırı dar / aşırı geniş | Ana fikir sorusunda tek detay ya da metnin ötesine geçen genelleme | Şık, paragrafın *tamamını* kapsıyor mu ve *sadece* onu mu? |
| **T15** | Benzer görünen kelime | *adopt/adapt, affect/effect, economic/economical* | Yazılışa değil anlama bak |

**Altın kural:** Şıklar arasındaki *farklar*, sorunun neyi test ettiğini gösterir. Önce şıkları birbiriyle karşılaştır, farklı olan noktaları bul.`;

const CARD_CUMLE_TAMAMLAMA = `### Cümle tamamlama
**Adımlar**
1. Şıklara bakmadan verilen kısımdaki **bağlacı** bul ve yönünü belirle.
2. **Yapı kontrolü (T11):** Verilen kısımda bağlaç varsa şık bağımsız cümle olmalı. Verilen kısım bağımsız cümleyse şık bağlaçla başlamalı.
3. **Tense uyumu (T2):** Uyumsuz şıkları anlamına bakmadan ele.
4. **Zamir kontrolü (T6):** Şıktaki *it/they/this* neyi gösteriyor?
5. Kalan şıklarda anlam yönünü karşılaştır (T3).

**Sık tuzaklar:** T3, T2, T11, T6, T5
⚠️ **Dikkat:** En sık çeldirici, mantıklı görünen ama bağlacın yönünü desteklemeyen şıktır.`;

/** Biçim örneği: content/ornek'teki ornek-q1 (hattın yazdığı id/type/answer/review alanları olmadan). */
const EXAMPLE = `{
  "number": 1,
  "topic": "zitlik",
  "sub_topic": "Zıtlık bağlacı (although)",
  "difficulty": 1,
  "stem": "Although the new bridge was finished ahead of schedule, ----.",
  "stem_tr": "Yeni köprü planlanandan önce bitirilmiş olsa da, ----.",
  "stem_chunks": [
    { "en": "Although", "tr": "-se de", "tag": "conj", "label": "zıtlık", "sign": "↔" },
    { "en": "the new bridge was finished ahead of schedule,", "tr": "yeni köprü planlanandan önce bitirildi" },
    { "en": "----.", "tr": "----", "tag": "blank" }
  ],
  "summary": "Although'dan sonra beklenenin tersi gelmeli: erken bitti ama yine de bir sorun var.",
  "options": [
    { "key": "A", "text": "the workers were praised for their speed", "text_tr": "işçiler hızları için övüldü", "traps": ["T3"], "explanation": "Erken bitmenin doğal sonucu; zıtlık yok." },
    { "key": "B", "text": "it remained closed to traffic for another month", "text_tr": "bir ay daha trafiğe kapalı kaldı", "traps": [], "explanation": "Erken bitti ama yine de açılmadı: beklenenin tersi, zıtlık doğru." },
    { "key": "C", "text": "the city will build another bridge next year", "text_tr": "şehir gelecek yıl bir köprü daha yapacak", "traps": ["T5"], "explanation": "Konuyla ilgili ama ilk cümleyle zıtlık kurmuyor." },
    { "key": "D", "text": "it had been completed on time", "text_tr": "zamanında tamamlanmıştı", "traps": ["T1"], "explanation": "İlk cümleyi tekrar ediyor." },
    { "key": "E", "text": "so many people use it every day", "text_tr": "o yüzden pek çok kişi onu her gün kullanıyor", "traps": ["T11"], "explanation": "\\"so\\" ile başlıyor; ana cümle olarak yapı bozuk." }
  ],
  "solution_steps": [
    "Bağlacı bul: Although → zıtlık.",
    "İlk yarı olumlu: köprü erken bitti.",
    "Boşluğa beklenmeyen, olumsuz bir sonuç gelmeli: B."
  ],
  "golden_rule": "Although gördüğünde boşluğa ilk yarıdan beklenenin tersini koy.",
  "structure": "[Although + yan cümle], [ana cümle].",
  "vocab": [
    { "word": "ahead of schedule", "tr": "planlanandan önce", "warmup": true, "context": "finished ahead of schedule" }
  ]
}`;

const answerLines = (answers: Answers) => [...answers].map(([n, k]) => `${n}: ${k}`).join("\n");

function cumleTamamlamaPrompt(answers: Answers): string {
  return `Sen YDS (Yabancı Dil Sınavı) hazırlık içeriği hazırlayan bir İngilizce öğretmenisin. Ekteki PDF bir ÖSYM YDS sınav kitapçığıdır.

GÖREV: Yalnızca aşağıdaki cümle tamamlama sorularını PDF'ten çıkar ve analiz et. Doğru cevaplar ÖSYM cevap anahtarından alınmıştır; bunları değiştirme ve sorgulama, açıklamalarını bu cevaplara göre yaz.

Sorular ve doğru cevapları ("numara: şık"):
${answerLines(answers)}

KURALLAR
- "stem" ve şıkların "text" alanları PDF'teki metinle birebir aynı olmalı (boşluk "----" olarak yazılır). Hiçbir kelimeyi değiştirme.
- "stem_chunks": soru kökünü anlamlı parçalara böl; parçaların "en" alanları boşlukla birleştirilince "stem" metnini birebir vermeli. Bağlacı tag "conj" (label: işlevi, sign: ↔ zıtlık, → neden-sonuç, + ek vb.), gönderge/zamiri tag "ref", boşluğu tag "blank" ile işaretle.
- "options": tam olarak A, B, C, D, E sırasıyla beş şık. Doğru şıkta "traps" boş dizi; her yanlış şıkta aşağıdaki katalogdan en az bir tuzak kodu.
- "topic" şunlardan biri: ${TOPICS.join(", ")}.
- "difficulty": 1 (kolay) – 3 (zor).
- "solution_steps": strateji kartındaki adımlara göre 2–5 kısa adım. "golden_rule": tek cümlelik, akılda kalıcı kural.
- "vocab": öğrencinin bilmeyebileceği kelime ve kalıplar; soruyu anlamak için gerekenler "warmup": true, "context" alanı sorudaki kısa kullanım.
- Bütün açıklamalar Türkçe, kısa ve sade.

TUZAK KATALOĞU
${TRAP_CATALOG}

STRATEJİ KARTI
${CARD_CUMLE_TAMAMLAMA}

BİÇİM ÖRNEĞİ (bir soru)
${EXAMPLE}`;
}

export type Generator = {
  /** Sınavda bu tipin soru numarası aralığı (TASARIM §5 tablosu). */
  range: [number, number];
  /** content/sorular/<sinav>/ altındaki dosya adı. */
  fileName: string;
  analysisPrompt(answers: Answers): string;
};

/** Analizörü olan tipler. Yeni tip = yeni satır (+ o tipin şeması). */
export const GENERATORS: Partial<Record<Question["type"], Generator>> = {
  cumle_tamamlama: { range: [27, 36], fileName: "cumle-tamamlama.json", analysisPrompt: cumleTamamlamaPrompt },
};

/** Kör çözüm: model soruyu cevabı, tuzak kodlarını ve açıklamaları görmeden çözer. */
export function blindSolvePrompt(questions: { number: number; stem: string; options: { key: string; text: string }[] }[]): string {
  const body = questions
    .map((q) => [`${q.number}. ${q.stem}`, ...q.options.map((o) => `${o.key}) ${o.text}`)].join("\n"))
    .join("\n\n");
  return `Aşağıdaki YDS sorularını çöz. Her soru için yalnızca doğru şıkkın harfini ver.\n\n${body}`;
}
