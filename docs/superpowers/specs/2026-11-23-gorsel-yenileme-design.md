# Görsel yenileme, pano, Kelimeler ve Tuzaklarım — tasarım

> 2026-11-23 · Temel: [günlük oturum tasarımı](2026-11-23-gunluk-oturum-design.md) (mantık aynen kalır), [TASARIM.md](../../TASARIM.md) §4 tuzak kataloğu, §8 motivasyon, [ARAYUZ.md](../../ARAYUZ.md) K1–K10
> Seçilen görsel yön: **B · Odak Panosu** (taslak: `.superpowers/brainstorm/536-1795427525/content/yeni-tasarim-yonleri.html`)

## 1. Amaç ve neden

Kullanıcının geri bildirimi: mevcut görünüm işlevsel ama etkileyici ve yenilikçi değil. Kullanıcıyı her gün geri getirecek bir tasarım isteniyor.

İstenenler:
- **Görünüm:** Uygulama her zaman açık temada olmalı. Canlı ve modern bir pano olmalı.
- **Tek akıştan çıkmak:** Durumu yalnızca oturum akışında görmek yerine, istendiğinde kelimelere ve tuzaklara ayrıca girilebilmeli.
- **Kutlama:** Doğru cevapta ses ve alkış/emoji kutlaması olmalı.
- **Öğrenme ipuçları:** Öğrenmeyi artıran uyarılar olmalı.
- **Kilitli günler:** Her günün görünür ve kilitli olduğu bir ilerleme olmalı.
- **Sınav tarihi:** Tarihi kullanıcı kendisi girmeli.

Sınav mart–nisan 2027'de. Hedef her gün geri gelmek ve bunalmamak.

## 2. Hedefler / hedef olmayanlar / anti-hedefler

**Hedefler (kullanıcının kararları)**
- **Tema:** Her zaman açık tema. Bütün ekranlar Odak Panosu'nun görsel diline geçer.
- **Kütüphaneler:** Hazır kütüphaneler kullanılır (§5.1).
- **Ana sayfa = pano** (§5.3):
  - günün görevi
  - sınava kalan gün sayısı (tarihi kullanıcı girer)
  - haftalık hedef
  - son 4 haftanın ısı haritası (gelecek günler kilitli)
  - "Biliyor muydun?" ipucu kartı
  - Kelimeler ve Tuzaklarım kartları
- **Kutlama:** Doğru cevapta ses ve emoji kutlaması olur. Ses açılıp kapatılabilir.
- **Kelimeler sayfası ve Tuzaklarım sayfası,** ikisinde de serbest çalışma (§5.5–5.7).
- **Serbest çalışmanın takvimle ilişkisi:**
  - **Kelime cevapları** tekrar takvimini (SM-2) günceller.
  - **Soru cevapları** takvimi **güncellemez.** Bu, kullanıcının kararı.

**Hedef olmayanlar (bu işte yok)**
- Tahmini puan (yol haritası 4. adım).
- Şık eleme (üstünü çizme) verisi ve "tuzak yakalama oranı". Eleme verisi olmadan anlamlı bir oran hesaplanamaz, bu yüzden Tuzaklarım sayfası yalnızca sayı ve son tarih gösterir. *Benim kararım.*
- Yeni soru tipleri, üretilmiş alıştırmalar (boşluk doldurma, çeviri), XP veya yıldız puanı, rozetler, liderlik tablosu.
- Günlük oturumun mantığında değişiklik: seçim, tek oturum ve gün sınırı aynen kalır.

**Anti-hedefler (çalışsa bile başarısızlık sayılır)**
- Serbest çalışmanın günlük oturumu, haftalık hedefi ya da soru tekrar takvimini değiştirmesi.
- Kutlamanın çalışmayı bölmesi. Kutlama kısa olmalı, 1,5 saniyeyi geçmemeli ve kullanıcının bir sonraki eylemini engellememeli.
- Ses ya da hareketin kullanıcının tercihine rağmen çalması:
  - Ses kapalıysa ses çalmaz.
  - "Hareketi azalt" ayarı açıksa konfeti ve uçuşan emojiler oynamaz.
- Kırmızı ya da ceza dili. Yanlış cevap turuncu renkle ve tuzağın adıyla gösterilir (ARAYUZ K6, korunur).

## 3. Kısıtlar

- **Altyapı:** Next.js 16 (`cacheComponents`; istek verisi `<Suspense>` içinde), React 19.3, Tailwind 4.3. Yazmadan önce `apps/web/node_modules/next/dist/docs/` okunur (AGENTS.md).
- **Mevcut mantık korunur:**
  - Durum makinesi saf kalır.
  - Server action girdileri zod ile doğrulanır.
  - Kaldığın yerden devam etme ve kayıt kuyruğu çalışmaya devam eder.
  - Mevcut 141 test geçmeye devam eder.
- **Erişilebilirlik:**
  - Metin kontrastı en az 4.5:1 (renk paleti bu ölçüte göre seçilir).
  - Dokunma alanı en az 48px (K8).
  - Klavye kısayolları korunur (K10).
  - Görünür odak halkası olur.
  - Simgelerde `aria-label` bulunur.
- **Dokümanlar bu kararlarla güncellenir:**
  - TASARIM §8'deki "XP ve rozet yok" maddesi: rozet ve XP yine yok, ama ses, emoji kutlaması ve kilitli günler kullanıcının kararıyla eklenir.
  - ARAYUZ §6'daki "Animasyon: sadece CSS geçişleri" satırı: yeni hali "motion ve canvas-confetti; `prefers-reduced-motion`'a saygı" olur.

## 4. Yaklaşımlar

| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| A · Sınava Yolculuk | Oyunsu, ana sayfada kilitli günlük yol | En güçlü "geri gel" hissi | Duolingo'ya çok yakın; masaüstünde zayıf |
| **B · Odak Panosu** | Modern pano: görev halkası, ısı haritası, kartlar | Bütün durum tek bakışta; masaüstünde geniş panoya açılır | Yol hissi ısı haritasında daha soyut |
| C · Atölye Defteri | Editoryal, hafta şeridi ve defterler | Karakterli, yetişkin | Kutlama ve canlılık daha zayıf |

**Seçilen: B** (kullanıcının seçimi).

**Yapım:** Kullanıcı hazır kütüphanelerin kullanılmasını istedi. Kendi yazacağımız CSS ve küçük bileşenlerle yapmak alternatifti, ancak kullanıcının kararıyla elendi.

## 5. Tasarım

### 5.1 Kütüphaneler

Hepsinin React 19 ile uyumu npm'de kontrol edildi (2026-11-23).

| İş | Kütüphane | Sürüm |
|---|---|---|
| Bileşenler: Card, Dialog, Switch, Progress, Tabs, Tooltip, Button | **shadcn/ui** (CLI `shadcn`, Radix tabanlı, Tailwind 4) | 4.23 / radix-ui 1.8 |
| Sınav tarihi seçici | **react-day-picker** (shadcn Calendar) | 10.0 |
| Geçişler ve mikro animasyonlar | **motion** | 14.14 |
| Doğru cevapta emoji ve konfeti | **canvas-confetti** (`shapeFromText` ile emoji) | 1.9 |
| Ses efektleri (sesler kodla üretilir, dosya yok) | **zzfx** | 1.4 |
| Simgeler | **lucide-react** | 1.78 |
| Isı haritası | **react-activity-calendar** | 3.2 |
| Küçük bildirimler | **sonner** | 2.0 |

shadcn bileşenleri `apps/web/components/ui/` altına kopyalanır (shadcn'in standart yolu). Mevcut `features/session/components/ui.tsx` içindeki `Button`, `BottomBar` ve `ProgressBar` bu bileşenlerle değiştirilir ya da onları sarar.

### 5.2 Görsel dil

- **Tema:**
  - Yalnızca açık tema. `globals.css` içindeki `prefers-color-scheme: dark` bloğu kaldırılır.
  - Belirteçler Odak Panosu paletine geçer: zemin `#f7f5ff`, yüzey beyaz, vurgu mor `#6d4aff`, kahraman kartta mor→pembe (`#6d4aff`→`#ff6aa2`) renk geçişi.
  - Doğru/yanlış renkleri korunur: doğru yeşil, yanlış turuncu. Küçük metinde kontrastı 4.5:1'e çıkaracak şekilde koyulaştırılır (mevcut `ok` ve `warn` tonları 3.8:1).
- **Yazı tipi:** Geist (sans) korunur. İngilizce metin serif kalır (K7).
- **Kartlar:** Yuvarlatılmış köşeler (20px), yumuşak gölge. Simgeler lucide, kartlarda emoji yok.
- **Düzen:**
  - Mobil öncelikli.
  - `lg` ve üstünde pano 4 sütunlu bir ızgaraya açılır.
  - Oturum ekranı ortada 680px kalır (odak modu, K3).

### 5.3 Pano (ana sayfa)

Mevcut dört durum (başla / devam / tamam / iş yok) **"günün görevi" kahraman kartının içinde** korunur, mantıkları aynı kalır.

Kartlar:

1. **Günün görevi (kahraman kart, iki sütun genişliğinde):**
   - **İlerleme halkası:** bugünün oturumunun tamamlanma yüzdesi. Hesap: (cevaplanan soru + tekrarı biten kelime) / toplam. Başlamamışsa %0, bitmişse onay işareti.
   - **Durum metni:**
     - Başlamamış: "15 kelime · 10 soru · ~25 dk".
     - Bitmiş: "Bugün tamam".
   - **Tek ana eylem (K1):** "Başla", "Devam et (3/10)" ya da bitmişse "Gözden geçir".
   - **İş yoksa:** "Bugün için tekrar ya da yeni soru yok".
2. **Sınava kalan gün:**
   - Tarih girilmişse: "Sınava 118 gün" ve tarihi düzenleme simgesi.
   - Tarih girilmemişse: "Sınav tarihini ekle" kartı. Dokununca tarih seçici penceresi açılır (§5.4).
3. **Haftalık hedef:** 🔥 yerine lucide `Flame` simgesi, "Bu hafta 4/5 gün". Affedici: kaçırılan gün sıfırlamaz.
4. **Gün takvimi (ısı haritası, iki sütun genişliğinde):**
   - **Pencere** *(kullanıcının kararı)*: 4 geçmiş hafta + bu hafta + 4 gelecek hafta. Pazartesi'den başlayan takvim haftaları, sütun = hafta, satır = gün.
   - Gelecek günler kilit simgesiyle soluk gösterilir.
   - Sınav tarihi bu pencereye giriyorsa o günde sınav bayrağı (lucide `GraduationCap`) görünür.
   - Her gün bir kare.
   - **Seviye:**
     - 0: oturum yok
     - 1: başladı ama bitmedi
     - 2: bitti
     - 3: bitti ve soruların en az %80'i doğru
     - Yalnızca kelime olan günde 3. seviye için kelimelerin en az %80'i bilinmiş olmalı.
   - Kilitli gelecek günler, "her günün kilitli yolu" isteğinin karşılığı.
   - Bir kareye dokunulunca/gelinince o günün özeti gösterilir (Tooltip).
5. **Kelimeler kartı:** "42 öğrenildi · 15 tekrarda". Dokununca Kelimeler sayfası açılır.
6. **Tuzaklarım kartı:** "En sık: Bağlaç yönü (T3)". Dokununca Tuzaklarım sayfası açılır. Hiç yanlış yoksa "Henüz tuzağa düşmedin".
7. **Biliyor muydun? (ipucu, iki sütun genişliğinde):**
   - Günün ipucu: kullanıcının yanlış yaptığı sorulardan birinin `golden_rule` alanı.
   - Yanlış yoksa, gösterilen sorulardan birinin altın kuralı.
   - Gün boyunca aynı ipucu gösterilir. Seçim gün anahtarına göre belirlenir.

**Üst bar:** selamlama, ses açma/kapama anahtarı (lucide `Volume2` / `VolumeX`), çıkış.

### 5.4 Sınav tarihi

- **Yeni kolon:** `user.exam_date` (`date`, boş bırakılabilir). Migration ile eklenir.
- **İlk açılış:**
  - Tarih boşsa panoda bir kez "Sınavın ne zaman?" penceresi açılır (shadcn Dialog + Calendar).
  - "Sonra" denirse pencere bu tarayıcıda bir daha kendiliğinden açılmaz. Bilgi `localStorage`'da tutulur.
  - Kart üzerinden her zaman eklenebilir.
- **Server action:** `setExamDate(date: string | null)`. Girdi zod ile doğrulanır. Tarih bugünden önce olamaz, `null` tarihi siler.
- **Geri sayım:** `examDate − todayKey` farkı gün olarak hesaplanır (İstanbul).
- **Sınav günü geçtiyse:** "Sınav günü geçti — yeni tarih ekle".

### 5.5 Kutlama ve öğrenme uyarıları (oturum içi)

- **Doğru cevap** (soru ya da kelime):
  - zzfx ile kısa ve parlak bir tını çalar.
  - canvas-confetti ile `shapeFromText` kullanılarak 👏 🎉 ✨ emojileri ekranın altından kısa bir patlamayla çıkar (≤ 1,2 sn).
- **Üst üste 3 doğru:** Daha büyük bir patlama ve sonner bildirimi: "3 doğru üst üste — ritmi yakaladın".
- **Yanlış cevap:**
  - Yumuşak ve kısa bir "tık" sesi.
  - Emoji yok.
  - Mevcut turuncu tuzak geri bildirimi korunur.
- **Ses tercihi:** Ses açık/kapalı tercihi `localStorage`'da tutulur, varsayılan açık. Ses kapalıysa hiçbir ses çalmaz.
- **Hareket tercihi:** `prefers-reduced-motion: reduce` açıksa konfeti ve emoji oynamaz, ses (açıksa) ve metin kalır. motion geçişleri de bu tercihe uyar (`useReducedMotion`).
- **Öğrenme uyarısı:**
  - Her soru ekranında, kullanıcının **en sık düştüğü tuzak** varsa, sorunun üstünde ince bir uyarı gösterilir: "⚠️ Dikkat: en sık **Bağlaç yönü (T3)** tuzağına düşüyorsun".
  - Uyarıdaki ipucu, TASARIM §4 kataloğundaki "nasıl yakalanır" sütunundan gelir.
  - Bilgi oturum açılırken Snapshot'a eklenir: `topTrap: { code, name, howTo } | null`.
- **Mola ekranı:** Bir "Biliyor muydun?" kartı gösterilir (ipucu kaynağı §5.3'teki ile aynı).

### 5.6 Kelimeler sayfası (`/kelimeler`)

- **Kaynak:** Görünür sorulardaki `vocab` girdileri (`vocabByWord`) ile kullanıcının `review_items` kayıtları (kelime türü).
- **Kelimelerin durumu:**
  - **Öğrenildi:** `reps >= 2` (sm2.isKnown ile aynı).
  - **Tekrarda:** kaydı var ama `reps < 2`.
  - **Yeni:** kaydı yok.
- **Sayfa düzeni:**
  - **Üstte üç sayı:** öğrenildi, tekrarda, yeni.
  - **Sekmeler (shadcn Tabs):** Tekrarda / Öğrenildi / Yeni.
  - **Liste:** kelime (serif), anlamı, bağlamı. "Tekrarda" sekmesinde bir sonraki tekrar tarihi de gösterilir ("yarın", "3 gün sonra").
  - **Arama kutusu.**
- **"Kelime çalış" (serif çalışma):**
  - **Günlük oturumu bozmaz** *(benim kararım; kullanıcının iki kuralını, "kelimeler SM-2'yi günceller" ve "serbest çalışma günlük oturumu değiştirmez", birlikte korur)*:
    - Bugün zamanı gelmiş kelimeler (`dueAt < dayEnd(now)`) ve bugünün oturumunun `review_words` listesindeki kelimeler serbest çalışmaya **alınmaz**. Bunlar günlük oturumda sorulur, böylece aynı gün iki kez notlanmazlar.
    - **Zamanı gelmemiş bir kelimede** yalnızca **yanlış** cevap SM-2'ye yazılır. Erken bir doğru cevap aralığı gereksiz büyütürdü, yanlış ise kelimeyi doğru biçimde öne çeker. Yeni (kaydı olmayan) kelimede her cevap yazılır.
    - Bu kurallar seçim fonksiyonunda **ve** `recordWordPractice` doğrulamasında uygulanır.
  - Seçili sekmeden bu kurala uyan 10 kelime alınır.
  - Mevcut ısınma ekranıyla çoktan seçmeli sorulur, şıklar §5.3'teki gibi bütün anlam havuzundan.
  - Cevaplar, yeni bir server action `recordWordPractice(word, correct)` ile yukarıdaki kurala göre SM-2'ye yazılır. Notlar ısınmadakiyle aynıdır (`WARMUP_GRADE`). Girdi zod ile doğrulanır. Kelime görünür sorulardaki kelimelerden biri olmalı.
  - `practice_sessions` tablosuna satır yazılmaz. Haftalık hedefe ve günlük oturuma etkisi yoktur.

### 5.7 Tuzaklarım sayfası (`/tuzaklar`)

- **Kaynak:** Kullanıcının `attempts` kayıtları. Yalnızca günlük oturumlardan gelir, serbest çalışma yazılmaz. Bu kayıtlar görünür sorularla birleştirilir: yanlış seçilen şıkkın `traps` kodları sayılır.
- **Liste:**
  - Tuzak kodları en sık olandan başlayarak sıralanır.
  - Her satırda kod ve ad, kaç kez düşüldüğü, son düşülen tarih ve TASARIM §4 katalogdaki "nasıl çalışır / nasıl yakalanır" metni bulunur.
  - Katalog metni koda taşınır: `lib/content/traps.ts`, `TRAP_GUIDE: Record<TrapCode, { how: string; catch: string }>`.
- **Hiç düşülmemiş tuzaklar:** Altta soluk bir "Henüz düşmediklerin" listesi gösterilir.
- **"Bu tuzağı çalış" (serif çalışma):**
  - Yanlış şıklarından biri bu tuzak koduna sahip görünür sorulardan 5 tanesi gelir. Önce kullanıcının bu tuzağa düştüğü sorular, sonra diğerleri.
  - Mevcut soru ekranı ve geri bildirimle çözülür.
  - **Hiçbir şey kaydedilmez:** `attempts`, `review_items` ve `practice_sessions` tablolarına yazılmaz. Tuzak istatistiği ve soru takvimi değişmez.
  - Sonda kısa bir özet gösterilir.

### 5.8 Serbest çalışma akışı

- **Rota:** `/calis?tur=kelime&sekme=…` ya da `/calis?tur=tuzak&kod=T3`.
- **Durum makinesi:** Mevcut durum makinesi yeniden kullanılır.
  - Kelime çalışması = sadece `REVIEW_BLOCK` bölümünden oluşan bir Snapshot.
  - Tuzak çalışması = sorulardan oluşan, ısınması olmayan bir Snapshot.
- **Kayıt:** Yan etkiler kayıt kuyruğuna gitmez. Serbest çalışma için ayrı bir `send` kullanılır: yalnızca kelime cevaplarını `recordWordPractice` fonksiyonuna iletir, diğer bütün yan etkileri yok sayar.
- **Kaldığı yerden devam yok.** Sayfa kapanırsa çalışma biter. Kelime cevapları zaten anında kaydedilmiştir.

## 6. Testler

- **Saf fonksiyonlar (birim testi):**
  - kelime durum sınıflandırması (`öğrenildi / tekrarda / yeni`)
  - serbest kelime çalışması seçimi (bugün zamanı gelenler ve bugünün oturumundakiler hariç) ve yazma kuralı (zamanı gelmemişte yalnızca yanlış)
  - tuzak istatistiği (yanlış şıkların kodlarını sayma, sıralama, görünmeyen soruları yok sayma)
  - ısı haritası seviyesi (0–3, sadece kelime olan gün) ve pencere (4 geçmiş + bu hafta + 4 gelecek hafta, Pazartesi başlangıçlı, gelecek günler kilitli, sınav günü işareti)
  - günün ipucunun seçimi (aynı gün aynı ipucu, yanlış yoksa diğer kaynak)
  - sınava kalan gün sayısı (İstanbul günü, geçmiş tarih)
  - serbest çalışma soru seçimi (önce düşülenler, sonra diğerleri, en fazla 5)
  - en sık tuzak (`topTrap`)
- **Server action girdileri:**
  - `setExamDate`: geçmiş tarih reddedilir, `null` kabul edilir.
  - `recordWordPractice`: görünmeyen kelime reddedilir.
- **Serbest çalışmanın send fonksiyonu:** yalnızca `recordWarmup` yan etkisini `recordWordPractice` fonksiyonuna iletir, `advance`, `markWarmDone` ve `recordAnswer` hiçbir şey yazmaz.
- **Elle ve tarayıcıyla (test hesabı):**
  - pano: tarih yok / var / geçmiş durumları
  - doğru cevapta ses ve kutlama
  - "hareketi azalt" ayarı açıkken kutlamanın oynamaması
  - Kelimeler ve Tuzaklarım sayfaları, serbest çalışma
  - telefon, masaüstü ve tablet genişliğinde ekran görüntüleri
  - `ui-ux-pro-max` kontrol listesi (kontrast ölçümü dahil)

## 7. Yapana bırakılanlar

- **Bileşenler:** shadcn bileşenlerinin hangilerinin ekleneceği ve mevcut `ui.tsx` bileşenlerinin nasıl taşınacağı.
- **Animasyon ve ses ayrıntıları:** zzfx ses parametreleri, konfeti ayarları, motion geçiş süreleri. Sınırlar: mikro geçişler 150–300 ms, kutlama ≤ 1,2 sn.
- **Isı haritası:** Isı haritasının görünümü. Kilitli gelecek günler, kütüphane desteklemiyorsa üstüne bir katmanla gösterilebilir.
- **Metinler:** Metinlerin son hali (kısa, Türkçe, cezalandırıcı olmayan bir dil).
- **Dokümanlar:** TASARIM §8 ve ARAYUZ §6 güncellemelerinin ifadesi.
