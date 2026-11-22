# Pratik ekranı — tasarım

> 2026-11-22 · Kapsam: "Seçenek 1" (pratik.html akışının Next'e taşınması + sunucuya kayıt)
> Temel: [TASARIM.md](../../TASARIM.md), [ARAYUZ.md](../../ARAYUZ.md), mevcut akış: `pipeline/build_practice.py` (üretilen `*.pratik.html`)

## 1. Amaç ve neden

"Bugün" sayfasındaki **Başla** düğmesi, soruların tek tek çözüldüğü odak modunda bir ekran açar. Akış, kullanıcının yerelde zaten denediği `pratik.html` ile aynıdır; fark, her cevabın veritabanına yazılması ve oturumun cihazdan bağımsız kaldığı yerden devam etmesidir (ARAYUZ K9). Bu kayıtlar, sonraki adımların (SM-2 tekrar, ilerleme ekranı, uyarlamalı seçim) ham verisidir.

Kullanıcı tek kişi, temel seviyede eksikleri olan ve çabuk bunalan biri. En büyük risk bunalıp bırakmak (ARAYUZ §1).

## 2. Hedefler / hedef olmayanlar / anti-hedefler

**Hedefler**
- pratik.html'deki akışın davranış olarak birebir karşılığı: kelime ısınması → soru → geri bildirim → (4 soruda bir) mola → sonuç özeti.
- Her cevap `attempts`'e yazılır; doğruluk sunucuda içerikten hesaplanır.
- Yarım kalan oturum, ana sayfada "Oturumuna devam et (3/10)" olarak görünür ve kaldığı sorudan açılır.
- Isınma kelimeleri ve yanlış sorular `review_items`'a işlenir (SM-2 verisi birikmeye başlar).

**Hedef olmayanlar (bu adımda yok)**
- Şık eleme (üstünü çizme), kelime işaretleme, aşamalar (göster/rehberli/hatırlatmalı), "neden eledin" adımı, koç paneli.
- Tekrar zamanı gelen soruların oturuma çekilmesi, Elo ile soru seçimi, ilerleme ekranı.
- Alt sekme çubuğu / `(tabs)` düzeni. TanStack Query, shadcn/ui gibi yeni bağımlılıklar.

**Anti-hedefler (çalışsa bile başarısızlık sayılır)**
- Cevaptan sonra geri bildirimin sunucuyu beklemesi (her soruda bekleme hissi).
- Kırmızı / ceza dili; yanlış cevap tuzak adıyla ve amber renkle gösterilir (ARAYUZ K6).
- Kayıt hatası yüzünden akışın durması ya da cevabın sessizce kaybolması.

## 3. Kısıtlar

- Next.js 16, `cacheComponents: true`: istek verisi (oturum) okuyan her şey `<Suspense>` içinde. Değişiklik öncesi `node_modules/next/dist/docs/` okunur (AGENTS.md).
- İçerik `content/` JSON'larından `loadQuestions()` ile okunur; veritabanında soru yok. Soru kimliği: `q.id` (örn. `2021-yds-1-q28`).
- Oturum doğrulaması `requireUser()` ile; `proxy.ts` yalnızca çerez varlığına bakar.
- Stil: mevcut Tailwind belirteçleri (`globals.css`: `ok`, `warn`, `conj`, `ref`, `accent`…). İngilizce metin serif 18–19px, Türkçe açıklamalar küçük ve `muted` (K7). Mobil öncelikli, dokunma alanı ≥ 48px, ana düğmeler altta sabit (K8).
- ÖSYM içeriği: sayfa yalnızca giriş yapmış kullanıcıya sunulur.

## 4. Yaklaşımlar

| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| **A (seçilen)** | Akış tarayıcıda tek client bileşeninde (`useReducer` durum makinesi); sorular sunucuda yüklenip prop olarak verilir; her cevap server action ile kaydedilir | Geçişler anında; pratik.html davranışı korunur; reducer saf olduğu için test edilebilir | Yeni tablo + migration gerekir |
| B | Her adım ayrı sayfa (`/oturum/[id]/[n]`), durum sunucuda | Basit veri akışı | Her tıklamada bekleme; çeviri/ipucu aç-kapa hantal; "sürtünmeyi azalt" ilkesine ters |
| — | pratik.html'i iframe ile gömmek | Hiç kod yok | Veritabanına bağlanmaz, iki kopya kod — elendi |

Kullanıcı A'yı seçti.

## 5. Tasarım

### 5.1 Rotalar ve giriş noktası
- `/` (Bugün): yarım kalmış oturum varsa birincil düğme **"Oturumuna devam et (n/N)"**, yoksa **"Başla"**. Bu kart oturum okuduğu için `<Suspense>` içinde.
- **Başla** bir server action'dır: yeni `practice_sessions` satırı oluşturur ve `/oturum/[id]`'ye yönlendirir. Devam düğmesi doğrudan o adrese gider.
- `/oturum/[id]`: odak modu (sekme/menü yok; üstte ince ilerleme çubuğu + çıkış ✕). Sunucu bileşeni oturumu ve o oturuma ait `attempts` satırlarını okur, oturum başka kullanıcınınsa `notFound()`. Soruları ve başlangıç durumunu client bileşenine verir.
- ✕ çıkış → `/` (durum zaten kayıtlı, onay sorulmaz).

### 5.2 Veri modeli (migration)
Yeni tablo `practice_sessions`:

| Sütun | Tür | Not |
|---|---|---|
| `id` | text PK | rastgele (crypto.randomUUID) |
| `user_id` | text FK → user, cascade | |
| `question_ids` | jsonb (string[]) | oturumdaki soruların sırası, oluşturulurken sabitlenir |
| `position` | integer | şu anki soru indeksi (0…N; N = bitti) |
| `break_seen` | boolean | mola gösterildi mi |
| `warm_done` | jsonb (number[]) | ısınması yapılmış blok başlangıç indeksleri |
| `warm_answers` | jsonb (Record<kelime, boolean>) | bu oturumda ısınmada cevaplanan kelimeler ve doğru mu. Yarıda bırakılan ısınma kaldığı kelimeden devam eder; aynı kelime bir oturumda ikinci kez notlanmaz |
| `created_at`, `updated_at`, `finished_at` (nullable) | timestamptz | `finished_at` doluysa oturum bitti |

`attempts` tablosuna nullable `session_id` (FK → practice_sessions, cascade) eklenir; `(session_id, question_id)` üzerinde benzersiz indeks (aynı soru bir oturumda bir kez cevaplanır, tekrar gönderim yok sayılır).

"Yarım kalan oturum" = kullanıcının `finished_at IS NULL` olan en yeni oturumu. Yeni oturum başlatılırsa eski yarım oturum olduğu gibi kalır (silinmez), sadece artık "en yeni" değildir.

### 5.3 Oturumun içeriği
Bu adımda oturum = `loadQuestions()`'un döndürdüğü tüm sorular, içerik sırasıyla (şu an 10 cümle tamamlama sorusu). Seçim mantığı tek bir fonksiyonda (`pickSessionQuestions`) durur ki ileride tekrar/Elo seçimi oraya girsin.

### 5.4 Akış (durum makinesi)
pratik.html'deki sabitler korunur: `BREAK_AFTER = 4`, `WARM_MAX = 30`, bilinen kelime = SM-2 `isKnown` (üst üste 2 doğru; `review_items.reps >= 2`).

```
 blok başı (i % 4 == 0) ve ısınma yapılmadı ──▶ warmup ──▶ warmupDone ──┐
                                                                         ▼
                        ┌──────────── answering ──(Eminim/Emin değilim)──▶ feedback
                        │                                                   │ Sonraki
                        └─── break (i == 4, bir kez) ◀──────────────────────┤
                                                                            ▼
                                                                  i == N ──▶ summary ──▶ review (gözden geçir)
```

| Durum | Görünen | Kaydedilen (server action) |
|---|---|---|
| `warmup` | Bloğun (sonraki 4 soru) `warmup: true` kelimeleri; oturum başında bilinen (`isKnown`) kelimeler hariç. Kelime listesi oturum açılışında sunucuda bilinen kelime kümesine göre hesaplanır; bu oturumda zaten cevaplanmış kelimeler (`warm_answers`) atlanır, skor onlardan yeniden hesaplanır. Kelime + bağlam cümlesi + 4 Türkçe şık (diğer sorulardaki kelimelerin anlamlarından karıştırılmış; karıştırma reducer dışında yapılır). "Isınmayı atla". | `recordWarmup`: kelime `warm_answers`'ta yoksa ekler ve `review_items(kind=word)` kaydını SM-2 ile günceller (doğru → not 4, yanlış → not 1); varsa hiçbir şey yapmaz (yeniden deneme / yeniden açılış güvenli) |
| `warmupDone` | "x / n kelimeyi bildin" + "Sorulara geç" | `warm_done`'a blok indeksi eklenir |
| `answering` | Direktif satırı, soru kökü (bağlaç/gönderge vurgulu), araç çipleri: **Parça parça çeviri**, **Kelimeler**, **İpucu** (`solution_steps[0]`), 5 şık, altta **Emin değilim / Eminim** (şık seçilmeden pasif) | — (araç kullanımı ve süre client'ta tutulur) |
| `feedback` | Doğru/yanlış başlığı (yanlışsa "B şıkkı bir tuzaktı" + tuzak çipleri + açıklama + doğru cevap), şıkların Türkçesi ve tuzak çipleri, Altın kural, açılır: Adım adım çözüm + Yapı, Şıklar neden yanlış, Kelimeler. Eminim+yanlışsa "tekrar listesinde önce gelecek" notu. **Sonraki soru →** | `recordAnswer` → `attempts` satırı: choice, correct (sunucuda hesaplanır), sure, gloss/hint/words kullanıldı mı, süre (soru ekranı açılışından cevaba), session_id. `position` burada **ilerlemez**. **Sonraki soru** `advance(sessionId, yeniPozisyon)` çağırır: `position = max(position, yeniPozisyon)` (tekrar gönderim güvenli); yeni pozisyon N ise `finished_at` da doldurulur. Yanlışsa `review_items(kind=question)` SM-2 `gradeAnswer(correct, sure)` ile güncellenir (priority dahil); doğruysa da güncellenir |
| `break` | "4 soru bitti · x/4 doğru · sayfayı kapatabilirsin" + **Devam et** | `break_seen = true` |
| `summary` | Doğru sayısı, düşülen tuzaklar (en sık olan vurgulu), yanlış soruların altın kuralları, "eminim deyip yanlış" sayısı, "çeviriyi x/N soruda açtın". **Soruları gözden geçir** / **Yeni oturum** | — (`finished_at`, son sorudaki "Sonuçları gör" ile `advance` tarafından doldurulur) |
| `review` | Soruları sırayla geri bildirim görünümünde gezme (yeni kayıt yok) | — |

"Baştan başla" yerine **Yeni oturum**: yeni `practice_sessions` satırı oluşturur (geçmiş korunur).

Parça parça çeviri cevaptan sonra da açılabilir ama `gloss_used` yalnızca cevaptan önce açıldıysa işaretlenir (pratik.html ile aynı). Kelimeler ve İpucu cevaptan sonra gizlenir.

### 5.5 Kayıt ve hata davranışı
- Geri bildirim **anında** gösterilir; kayıt arka planda yapılır (iyimser güncelleme). Doğruluk client'ta da içerikten bilinir, sunucu kendi hesabını yazar.
- Kayıt başarısız olursa altta küçük, nazik bir satır: "Kaydedilemedi, tekrar deneniyor…" ve otomatik yeniden deneme (bekleyen kayıtlar sırayla gönderilir). Akış durmaz. Sayfa kapanırsa en fazla gönderilemeyen son cevap kaybolur.
- Server action'lar `requireUser()` ile başlar ve oturumun o kullanıcıya ait olduğunu doğrular; soru kimliğinin o oturumun `question_ids`'inde olduğunu kontrol eder.
- Sayfa yeniden açıldığında başlangıç durumu sunucudan kurulur: `position`, `break_seen`, `warm_done`, `warm_answers` ve oturumun `attempts` satırları. `position`'daki soru cevaplanmışsa (Sonraki'ye basılmadan kapatılmış) onun geri bildirimi görünür; değilse soru ekranı. `position == N` olan (bitmiş) oturum açılırsa özet görünür.
- Ana sayfadaki "n/N" = `position` (geçilen soru sayısı) / `question_ids` uzunluğu. Son soru cevaplanıp "Sonuçları gör"e basılmadan bırakılan oturum yarım sayılır; açılınca son sorunun geri bildirimi gelir.
- İki cihazda aynı anda açık oturum için koruma yok; `max(position)` ve benzersiz indeksler veri bozulmasını önler, ekranlar yenilenince eşitlenir.

### 5.6 Klavye (masaüstü, pratik.html ile aynı)
`A–E` şık seç · `Enter` Eminim · `Shift+Enter` Emin değilim · cevaptan sonra `Enter`/`→` sonraki · `T` çeviri · `K` kelimeler · `I` ipucu · ısınmada `A–D` + `Enter`. Ctrl/Alt/Meta basılıyken ve form alanlarında devre dışı.

### 5.7 Kod yerleşimi (ARAYUZ §5.1 ile uyumlu)
```
app/page.tsx                     Başla / Devam kartı (Suspense içinde)
app/oturum/[id]/page.tsx         sunucu: oturum + attempts + sorular → <PracticeSession>
features/session/
  session-machine.ts             saf reducer + durum tipleri + seçiciler (warmItems, özet hesapları)
  session-machine.test.ts
  actions.ts                     "use server": startSession, recordAnswer, advance, recordWarmup, markWarmDone, markBreakSeen
  components/                    PracticeSession, Warmup, QuestionView, Stem, OptionList, Feedback, BreakView, Summary, AnswerBar
lib/db/schema.ts                 practice_sessions + attempts.session_id
```
`vitest.config.mts` `include`'u `features/**/*.test.ts`'i kapsayacak şekilde genişletilir.

### 5.8 Doğrulama
- Reducer için birim testleri: blok başı ısınma, bilinen kelimenin ısınmadan düşmesi, mola tek kez ve 4. sorudan sonra, son sorudan sonra özet, yeniden açılışta sunucu durumundan doğru ekranın kurulması, gloss bayrağının yalnızca cevaptan önce işaretlenmesi.
- Özet hesapları (tuzak sayımı, eminim-yanlış) için birim testi.
- `pnpm typecheck`, `pnpm test`, `pnpm build` temiz.
- Elle: telefonda (dar ekran) ve masaüstünde tam bir oturum; ortada sekmeyi kapatıp başka cihazdan devam.

## 6. Kararlar kimin

**Kullanıcının kararları:** kapsam = Seçenek 1 (pratik.html akışı + kayıt); yaklaşım A.

**Benim kararlarım (düzeltilebilir):**
- Rota `/oturum/[id]`, Başla'nın server action olması, ✕'in onaysız çıkması.
- `practice_sessions` tablosu ve `attempts.session_id`; yeni oturum eskisini silmez.
- Oturum = tüm sorular, içerik sırasıyla.
- Isınma kelimeleri ve sorular için `review_items`'a SM-2 yazımı (pratik.html'deki localStorage "known" sayacının yerini alır; `sm2.ts`'teki `isKnown` zaten bunun için var). Isınma notları: doğru 4, yanlış 1.
- Hint ve Kelimeler kullanımı da `attempts`'e yazılır (sütunlar zaten var; pratik.html sadece çeviriyi sayıyordu).
- İyimser kayıt + otomatik yeniden deneme; tüm kayıt action'ları tekrar gönderime dayanıklı.
- Isınma cevapları oturum başına `warm_answers`'ta tutulur: yarıda kalan ısınma kaldığı yerden sürer, aynı kelime bir oturumda iki kez notlanmaz (yoksa bir doğru cevap kelimeyi "bilinen" yapıp kalıcı olarak ısınmadan düşürebilirdi).
- `position` cevapta değil **Sonraki soru**'da ilerler (pratik.html ile aynı); kapatıp açınca cevaplanmış sorunun geri bildirimi görünür.
- Özet aynı sayfada gösterilir; ARAYUZ'daki ayrı `/oturum/[id]/ozet` rotası bu adımda yok.
- "Baştan başla" → "Yeni oturum".

**Uygulayıcıya bırakılanlar:** bileşenlerin iç bölünmesi, Tailwind sınıfları, yeniden deneme zamanlaması, migration adı, test dosyası düzeni.
