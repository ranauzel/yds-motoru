# Günlük oturum — tasarım

> 2026-11-23 · Yol haritası 2. adım ([YOL-HARITASI.md](../../YOL-HARITASI.md)) · Temel: [TASARIM.md](../../TASARIM.md) §6 oturum akışı, §7 tekrar havuzu; mevcut pratik ekranı spec'i [2026-11-22-pratik-ekrani-design.md](2026-11-22-pratik-ekrani-design.md)

## 1. Amaç ve neden

Kullanıcının havuzunda 90 cümle tamamlama sorusu var ve bu sayı artacak. Şu an `pickSessionQuestions` bütün soruları içerik sırasıyla döndürüyor, bu yüzden bir oturum 90 soru uzunluğunda oluyor. Ayrıca istendiği kadar "Yeni oturum" açılabiliyor.

Sınav mart–nisan 2027'de. Hedef her gün aynı ölçüde ve düzenli çalışmak. TASARIM'daki en büyük risk "bunalıp bırakmak". Bu yüzden her gün tek, sınırlı ve karışık içerikli bir oturum olmalı:
- zamanı gelen kelimelerin tekrarı
- zamanı gelen sorular
- yeni sorular
- günün özeti

**Kullanıcı:** Proje sahibi. Misafir (demo) hesapları da aynı mantıkla çalışır, ama yalnızca 10 örnek soruyu görürler.

## 2. Hedefler / hedef olmayanlar / anti-hedefler

**Hedefler (kullanıcının kararları)**
- Her gün otomatik olarak tek bir oturum açılır. Aynı gün içinde ikinci bir oturum açılmaz.
- Oturumda şunlar bulunur: kelime tekrarı, sorular ve kapanışta günlük ilerleme.
- Sorular üç kaynaktan gelir:
  - yanlış yapılanlar ve "emin değilim" denenler (sık gelir)
  - doğru yapılanlar (seyrek gelir, SM-2'nin uzayan aralıklarıyla)
  - yeni sorular
- Oturum gün içinde yarıda kesilip kaldığı yerden devam edilebilir. Bu bugün de çalışıyor, korunacak.

**Hedef olmayanlar (bu işte yok)**
- Üretilmiş alıştırmalar: boşluk doldurma, çeviri, yapı alıştırmaları (yol haritası 2. madde: alıştırma paneli).
- Elo ile zorluk ayarlı seçim (TASARIM Faz 4), okuma ve diğer soru tipleri, süreli deneme, puan getirisi önerisi.
- Oturum büyüklüğünün kullanıcı tarafından ayarlanabilmesi.
- Yeni bir veritabanı tablosu ya da bölümlü oturum modeli. Bu, değerlendirilip seçilmeyen C yaklaşımı (§4).

**Anti-hedefler (çalışsa bile başarısızlık sayılır)**
- Bir gün atlanınca ertesi gün aşırı uzun bir oturum açılması. Oturum her gün aynı büyüklükte açılır.
- Aynı gün iki oturum açılması. Buna "Başla"ya çift dokunma ya da iki sekme de dahil.
- Gün içinde yeniden açılan oturumun farklı içerik göstermesi. İçerik oturum açılırken bir kez seçilir ve kaydedilir.
- Mevcut akışın bozulması: bekleme olmadan geri bildirim, kayıt kuyruğu, başka cihazdan devam etme.

## 3. Kısıtlar

- **Mevcut yapı korunur:**
  - Next.js 16 (`cacheComponents`; istek verisi `<Suspense>` içinde okunur), Drizzle ve Postgres (Neon), mevcut zod girdi doğrulaması (`features/session/inputs.ts`).
  - Durum makinesi saf kalır: `session-machine.ts` dosyasında React ve veritabanı yok.
  - Seçim mantığı saf bir fonksiyondur ve testlidir (`rules.ts`).
- **Gün sınırı Türkiye saatine göre** (`Europe/Istanbul`): gece 00:00'da yeni gün başlar. Sunucu UTC'de çalıştığı için gün anahtarı açıkça bu saat dilimiyle hesaplanır.
- **Görünürlük kuralı değişmez:** Kullanıcı yalnızca `getAllQuestions(userId)` fonksiyonunun döndürdüğü soruları görür. Kendi sorusu varsa kendi sorularını, yoksa herkese açık örnekleri.
- **Şema değişikliği migration ile yapılır.** Vercel derlemesi migration'ları kendisi uygular (`vercel.json`).

## 4. Yaklaşımlar

| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| **A** | Mevcut oturumu genişletmek: `practice_sessions` tablosuna gün kolonu eklenir, seçim fonksiyonu yazılır, akışın başına kelime tekrarı bölümü eklenir | Durum makinesi, kayıt kuyruğu ve devam etme kodu olduğu gibi kullanılır; iş orta büyüklükte | Alıştırma paneli gelince durum makinesine yeni bölüm türleri eklenmesi gerekir |
| B | Kelime ve soru için ayrı ekranlar | En basit yol | "Tek oturum" yerine iki ayrı iş olur; kelime kısmı kolayca atlanır |
| C | Yeni tablo ile bölümlü günlük oturum modeli | Gelecekteki bölümler hazır bir yuvaya oturur | Çalışan ve testli oturum kodunun büyük kısmı yeniden yazılır; sınava 4–5 ay varken en riskli yol |

**Seçilen yol: A (kullanıcının kararı).** Tek oturum isteğini en az riskle karşılıyor. C'nin esnekliğine ise ancak alıştırma paneli geldiğinde ihtiyaç olacak.

## 5. Tasarım

### 5.1 Büyüklük (benim kararım; kodda tek yerde sabit)

| Sabit | Değer | Not |
|---|---|---|
| `DAILY_QUESTIONS` | 10 | TASARIM §6: yaklaşık 12 dakika soru |
| `MAX_DUE_QUESTIONS` | 6 | Zamanı gelen sorular en fazla 6 olur; kalan yer yeni sorulara ayrılır. Yeni soru yetmezse boşluk zamanı gelenlerle doldurulur |
| `DAILY_REVIEW_WORDS` | 15 | Kelime tekrarı bölümü |
| `WARM_MAX` | 30 → **8** | Blok başındaki yeni kelime ısınması. Kelime tekrarıyla birlikte oturum ~25 dakikayı aşmasın diye düşürülür |

### 5.2 Günün oturumu

- **Yeni kolon:** `practice_sessions.day`, tipi `date`, boş bırakılabilir. Bu kolondan önceki oturumlarda boş kalır.
- **Benzersizlik:** `(user_id, day)` için benzersiz bir indeks eklenir. Böylece günde tek oturum kuralını veritabanı garanti eder.
- **Gün anahtarı ve gün sonu:** İki saf fonksiyon yazılır:
  - `todayKey(now: Date): string`: `Europe/Istanbul` saat dilimine göre `YYYY-MM-DD` döndürür.
  - `dayEnd(now: Date): Date`: İstanbul'da ertesi günün 00:00 anını döndürür.
- **"Zamanı gelen" güne göre ölçülür, saate göre değil.** Bir kayıt `dueAt < dayEnd(now)` koşulunu sağlıyorsa bugün zamanı gelmiş sayılır. *Benim kararım. Sebep: SM-2 `dueAt` değerini cevap anına gün ekleyerek hesaplıyor. Saatle karşılaştırılsaydı, dün 21:00'de yanlış yapılan soru bugün sabah açılan oturuma girmez ve bir gün daha kayardı.*
- **Oturum açma:** `startSession` server action'ının yerini `openTodaySession` alır.
  1. Bugünün oturumu varsa doğrudan ona yönlendirir.
  2. Yoksa içeriği seçer (§5.3, §5.4) ve satırı `onConflictDoNothing` ile ekler.
  3. Çakışma olursa, yani aynı anda başka bir istek oturumu zaten açtıysa, var olan satırı okuyup ona yönlendirir. Bu, "Başla'ya çift dokunma iki oturum açar" hatasını da kapatır.
- **Seçilecek bir şey yoksa:** Hem soru seçimi hem kelime seçimi boş dönerse (hiç soru aktarılmamış olabilir ya da bugün iş olmayabilir) satır oluşturulmaz ve ana sayfaya yönlendirilir.
- **Sadece kelime olan oturum:** 0 soru ve en az 1 kelime seçilirse oturum yine açılır ve yalnızca kelime tekrarından oluşur. *Benim kararım. Sebep: 90 soru günde 10 yeni soruyla yaklaşık 9 günde tükenir. Ondan sonra zamanı gelen soru olmayan ama zamanı gelen kelime olan günler sık yaşanacak.*
- **Bitiş tanımı:** Oturum, son bölümü bittiğinde biter ve `finishedAt` yazılır. Son bölüm normalde son sorudur. Soru yoksa son bölüm kelime tekrarıdır.
  - Bugün `finishedAt` yalnızca `advance` ile, pozisyon soru sayısına ulaşınca yazılıyor.
  - 0 soruluk oturumda kelime bölümünün bitişi (`markWarmDone` ile tekrar işareti) de `finishedAt` yazmalı.
  - Hangi yan etki ve action ile yazılacağı yapana kalır. Şart şu: tekrar gönderilse de güvenli olmalı, yani `finishedAt` bir kez yazılmalı.
- **Durum makinesi:** Soru sayısı 0 iken kelime tekrarı bölümü özetten önce gösterilmeli. Şu an `screenAt` fonksiyonu `position >= n` olunca doğrudan özete geçiyor.
- **İlerleme göstergesi:** "Devam et (3/10)" sayacı soruları sayar. Sadece kelime olan oturumda "Devam et (kelime tekrarı)" yazar.

### 5.3 Soru seçimi

Saf bir fonksiyondur ve `rules.ts` içinde, testli olarak yazılır:

```
pickDailyQuestions({ questionIds, reviews, dueBefore, size, maxDue }): string[]
```

- `questionIds`: görünür soruların kimlikleri, içerik sırasıyla (sınav ve soru numarasına göre).
- `reviews`: bu kullanıcının `kind = "question"` olan `review_items` satırları: `{ itemId, dueAt, priority, reps }`.

**Kurallar:**
1. **Zamanı gelenler:** `review` satırı olan, `dueAt < dueBefore` koşulunu sağlayan (`dueBefore = dayEnd(now)`, bkz. §5.2) ve görünür sorular arasında bulunan sorular. Şu sırayla dizilir:
   1. `priority` (eminim deyip yanlış yapılanlar) önce gelir.
   2. Sonra `reps` küçük olanlar gelir. `reps = 0`, sorunun yanlış yapıldığı anlamına gelir.
   3. Sonra `dueAt` eski olanlar gelir.
   
   Doğru ve emin yapılan sorular SM-2'de uzun aralık aldığı için zaten seyrek gelir. "Emin değilim" denen doğru sorular daha düşük not (3) aldıkları için daha kısa aralıklarla gelir.
2. **Yeni sorular:** `review` satırı olmayan görünür sorular, içerik sırasıyla.
3. **Oturumun kurulması:** Önce en fazla `maxDue` kadar zamanı gelen soru alınır, sonra yeni sorularla `size` sayısına tamamlanır. Yeni soru yetmezse kalan yer zamanı gelenlerle doldurulur.
4. **Taşınan sorular:** Seçilemeyen zamanı gelen sorular sonraki günlere kalır. Bir şey yapmaya gerek yok, `dueAt` geçmiş olduğu için ertesi gün yine aday olurlar.
5. **Sıralama:** Oturum içinde sorular karıştırılmaz. Önce zamanı gelenler, sonra yeniler gelir. *Benim kararım. Sebep: önce eskileri hatırlamak, yeni kelime ve soru yükü gelmeden tekrar yapmak.*
6. **Az soru:** Toplam aday `size` sayısından azsa oturum daha kısa olur. Örneğin misafirin yeni sorusu ve zamanı gelen sorusu kalmadıysa bu sayı 0 olabilir. O durumda bkz. §5.6.

### 5.4 Kelime tekrarı

Saf bir fonksiyondur (`rules.ts`):

```
pickReviewWords({ reviews, vocabByWord, dueBefore, size }): string[]
```

- `reviews`: `kind = "word"` olan `review_items` satırları.
- `vocabByWord`: görünür sorulardaki `vocab` girdilerinden kelimeye göre bir harita.

**Kurallar:**
- Aday kelimeler: `dueAt < dueBefore` koşulunu sağlayan ve `vocabByWord` içinde bulunan kelimeler. Anlamı bilinmeyen kelime sorulamaz, bu yüzden haritada olmayanlar atlanır.
- Sıralama: önce `priority`, sonra `reps` küçük olanlar, sonra `dueAt` eski olanlar. En fazla `size` kadar kelime alınır.
- Seçilen kelimeler oturum satırına kaydedilir. Bunun için yeni bir kolon eklenir: `review_words`, tipi `jsonb string[]`, varsayılanı `[]`.

**Ekran ve akış:**
- Oturumun başında, ilk sorudan önce bir **kelime tekrarı** bölümü olur. Mevcut ısınma ekranı ve etkileşimi kullanılır: çoktan seçmeli, doğru anlam ve diğer kelimelerin anlamlarından 3 şık, "Devam", "Atla".
- Başlık "Kelime tekrarı" olur. Bloklardaki "Kelime ısınması" ise yeni kelimeler içindir.
- Cevaplar mevcut `warmAnswers` ve `recordWarmup` yolundan kaydedilir. SM-2 notları da ısınmadakiyle aynıdır (`WARMUP_GRADE`). Yani kayıt, yeniden deneme ve devam etme için ek bir sunucu kodu gerekmez.
- Bölümün bittiği bilgisi mevcut `warmDone` alanında özel bir işaretle tutulur. İşaretin değeri yapana kalır, örneğin `-1`.
- **Çift sorulmama:** Kelime tekrarında sorulan bir kelime, aynı oturumun blok ısınmalarında tekrar sorulmaz. Mevcut `warmVocab` fonksiyonu bu oturumda cevaplanmış kelimeleri zaten listede tutuyor. Bu davranış, tekrar kelimelerini dışarıda bırakacak şekilde düzenlenir.
- `review_words` boşsa bölüm hiç gösterilmez. İlk günlerde durum bu olacak.

### 5.5 Günün özeti (kapanış)

Mevcut özet ekranına şunlar eklenir:
- **Kelime:** tekrar edilen kelime sayısı ve kaçının bilindiği (`warmAnswers` içinden).
- **Seri:** üst üste kaç gün oturumun bitirildiği. Bitmiş (`finishedAt` dolu) oturumların `day` değerlerinden sunucuda hesaplanır ve oturum yüklenirken Snapshot'a eklenir. Bugün dahildir.
  - Çalışılacak hiçbir şey olmadığı için oturum açılmayan günler seriyi kırar. *Benim kararım. Sebep: kelimeler SM-2 ile sürekli geri geldiği için bu çok nadir olur. Geçmişteki boş günleri bilmek için ayrıca kayıt tutmak gerekirdi, buna değmez.*
- **Havuz:** "Havuzda X yeni soru kaldı."

Son iki bilgi sunucuda hesaplanıp Snapshot'a eklenir, böylece durum makinesi saf kalır.

### 5.6 Ana sayfa

"Bugünün oturumu" kartı dört durumdan birini gösterir:
1. **Bugünün oturumu henüz yok:** kartta "Bugün: N kelime, M soru" yazar ve bir **Başla** düğmesi bulunur. Sayılar seçim fonksiyonları çalıştırılarak hesaplanır, ama satır **oluşturulmaz**.
2. **Oturum sürüyor:** "Devam et (3/10)" düğmesi görünür.
3. **Oturum bitti:** "Bugünün oturumu tamam" mesajı, kısa bir özet (doğru sayısı ve seri) ve "Yarın yeni oturum açılacak" bilgisi görünür. Oturumu gözden geçirmek için bir bağlantı da bulunur.
4. **Bugün çalışılacak bir şey yok** (seçim 0 kelime ve 0 soru döndürdü): "Bugün için tekrar ya da yeni soru yok" mesajı görünür.

**Kaldırılanlar:**
- Ana sayfadaki "Yeni oturum başlat" bağlantısı.
- Özet ekranındaki "Yeni oturum" düğmesi.
- `latestUnfinishedSession`: yerini "bugünün oturumu" alır. `day` değeri boş olan eski bitmemiş oturumlar ana sayfada artık görünmez, ama URL'leriyle açılmaya devam eder.

**İçerik değişince (`content_changed`):** Bugünün oturumundaki bir soru silinmişse oturum sayfası bir "Bugünün oturumunu yeniden oluştur" düğmesi gösterir. Bu düğme bugünün satırını silip `openTodaySession` fonksiyonunu yeniden çalıştırır. *Benim kararım. Sebep: günde tek oturum kuralı yüzünden kullanıcı aksi halde o gün çalışamazdı.* Satır silinince, oturuma bağlı `attempts` kayıtları cascade ile silinir. SM-2 kayıtları (`review_items`) ise korunur.

## 6. Testler

Saf fonksiyonlar için birim testleri:
- **`todayKey` ve `dayEnd`:**
  - UTC 21:30 → İstanbul'da ertesi gün olur (UTC+3).
  - UTC 20:59 → aynı gün kalır.
  - `dayEnd`, İstanbul'da ertesi günün 00:00 anını döndürür.
- **Zamanı gelme ölçütü:** dün 21:00'de yanlış yapılan (yani `dueAt` bugün 21:00 olan) bir soru, bugün 08:00'de açılan oturumda aday olur.
- **Sadece kelime olan oturum:**
  - 0 soru ve N kelime ile durum makinesi önce kelime tekrarını, sonra özeti gösterir.
  - Kelime bölümü bitince "oturum bitti" yan etkisi üretilir.
- **`pickDailyQuestions`:**
  - sıralama: priority > reps > dueAt
  - zamanı gelenlerin `maxDue` ile sınırlanması
  - yeni soru yetmediğinde boşluğun zamanı gelenlerle doldurulması
  - görünür olmayan `review` satırlarının yok sayılması
  - `dueAt` değeri gelecekte olanların alınmaması
  - toplamın `size` sayısından az olması
  - hiç aday olmaması
- **`pickReviewWords`:**
  - aynı sıralama
  - `vocabByWord` içinde olmayan kelimenin atlanması
  - `size` sınırı
- **Durum makinesi:**
  - kelime tekrarı bölümü ilk ekran olarak gelir
  - "Atla" bölümü bitirir ve yan etkisi doğrudur (`markWarmDone`)
  - bölüm boşken doğrudan soru ekranına geçilir
  - tekrar kelimeleri blok ısınmasında yeniden sorulmaz
  - kaldığı yerden devam edildiğinde doğru ekran açılır
- **Seri hesabı:** ardışık günler, atlanmış bir gün, bugünün oturumu bitmemişken.

Veritabanına bağlı kısımlar (`openTodaySession`, çakışma durumu) için otomatik test yok, çünkü projede veritabanı testi altyapısı yok. Bu kısımlar elle denenir: iki sekmeden aynı anda "Başla"ya basılır, gün değişimi sistem saati ya da bir test parametresi ile denenir.

## 7. Yapana bırakılanlar

- Kelime tekrarı bölümünün durum makinesinde nasıl temsil edileceği: yeni bir ekran türü mü olacak, yoksa ısınma ekranı özel bir blok numarasıyla mı yeniden kullanılacak. Şartlar şunlar: §5.4'teki davranış, ve mevcut `warmDone` ile `warmAnswers` alanlarıyla devam edebilme.
- Ana sayfadaki sayıların, 1. durumda satır oluşturmadan nasıl hesaplanacağı. Seçim fonksiyonları ana sayfada da çağrılabilir.
- Migration'ın ayrıntıları (Drizzle `db:generate`).
- Metinlerin son hali. Mevcut ton korunur: kısa, Türkçe, cezalandırıcı olmayan bir dil.
