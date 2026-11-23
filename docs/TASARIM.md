# YDS Strateji Motoru — Tasarım Dokümanı

> Sürüm 0.1 · 2026-11-18 · Kişisel kullanım
> Bu doküman iki işe yarar: (1) motorun neyi, neden öyle yaptığını tanımlar; (2) uygulama hazır olmadan da çalışma rehberi olarak kullanılabilir (Bölüm 4 ve 5).

---

## İçindekiler
1. Amaç ve temel fikir
2. Öğrenme bilimi ilkeleri
3. Öğrenme yolu (4 aşama)
4. Tuzak kataloğu
5. Soru tipi strateji kartları
6. Oturum akışı
7. Uyarlama ve ustalık modeli
8. Motivasyon katmanı
9. Kavramsal veri modeli
10. Yol haritası
11. Teknik altyapı için açık sorular
12. Dil gelişimi modülü (kelime, yapı, okuma)

---

## 1. Amaç ve temel fikir

**Sorun:** Kelime, gramer ve soru mantığında aynı anda eksik olunca soru çözmek bunaltıcı hale geliyor. Anlaşılmayan soruyu çözmeye çalışmak sıkıntı yaratıyor, sıkıntı da çalışmayı bıraktırıyor.

**Temel fikir:** YDS'de soru tipi sayısı sınırlıdır ve ÖSYM çeldiricileri tekrar eden kalıplarla kurar. Motorun kalbi bir soru bankası değil, **strateji kartları + tuzak kataloğudur**. Her soru bu ikisiyle etiketlenir. Amaç, her soru tipinde "önce şuna bak, şu tuzağa dikkat et" refleksini kazandırmaktır.

**Tasarım ilkeleri:**
- Önce anlamak, sonra çözmek. Her soru katman katman açılabilir: kelime → yapı → soru mantığı.
- Az ama tam anlaşılmış soru, çok ama anlaşılmamış sorudan iyidir.
- Zorluk, başarı oranını yaklaşık %80–85'te tutacak şekilde otomatik ayarlanır.
- Kararı sistem verir: uygulamayı açınca tek bir "Başla" düğmesi olur.

---

## 2. Öğrenme bilimi ilkeleri

| # | İlke | Kaynak | Motordaki karşılığı |
|---|---|---|---|
| 1 | **Çözülmüş örnek → desteğin azaltılması** (worked example & fading) | Sweller; Renkl | Her soru tipi 4 aşamada öğretilir (Bölüm 3) |
| 2 | **Hatırlama pratiği** (retrieval practice) | Roediger & Karpicke, 2006 | Strateji kartları okutulmaz, sorulur: "Bu tipte ilk adım neydi?" |
| 3 | **Aralıklı tekrar** (spacing) | Ebbinghaus; Cepeda vd., 2006 | Kartlar, tuzaklar, kelimeler ve yanlış sorular SM-2 ile geri gelir |
| 4 | **Karışık çalışma** (interleaving) | Rohrer & Taylor, 2007 | Öğrenilen tipler karışık sorulur, böylece "bu hangi tip/tuzak?" ayırt etme becerisi gelişir |
| 5 | **%85 kuralı** | Wilson vd., 2019 | Uyarlamalı zorluk, hedef başarı ≈ %80–85 |
| 6 | **Kendine açıklama** (self-explanation) | Chi vd., 1989 | Elediğin şık için sebep seçersin (tuzak kodu) |
| 7 | **Hiperdüzeltme** (hypercorrection) | Butterfield & Metcalfe, 2001 | Güven puanı. "Eminim" deyip yanlış yapılan sorular tekrar havuzunda öncelik alır |

Not: "Görsel/işitsel öğrenen" gibi öğrenme stilleri teorisinin bilimsel desteği yoktur, tasarımda kullanılmaz.

---

## 3. Öğrenme yolu (her soru tipi için 4 aşama)

| Aşama | Ne olur | Geçiş koşulu |
|---|---|---|
| **1. Göster** | Strateji kartı + 2–3 tam çözülmüş örnek. Her adım açıklanır, her şıkkın tuzağı gösterilir. | Örnekleri inceleyip kartın adımlarını hatırlama sorusunu doğru cevaplamak |
| **2. Rehberli** | Soru adım adım çözülür: "Bağlacı işaretle" → "Hangi yön?" → "Hangi şıklar elenir, neden?" | Son 8 soruda adımların ≥ %75'i doğru |
| **3. Hatırlatmalı** | Sadece kısa direktif + ⚠️ tuzak uyarısı görünür, çözüm sende | Son 10 soruda ≥ %80 başarı |
| **4. Bağımsız + karışık** | Uyarı yok, diğer tiplerle karışık, ileride süreli | Kalıcıdır, aralıklı tekrarla sürdürülür |

- Üst üste 3 hata yapılırsa bir önceki aşamaya inilir. Bu bir ceza değil, destek.
- Her aşamada soru **katmanlı açılabilir**:
  1. **Kelime:** zor kelimeler + Türkçesi (otomatik olarak kelime tekrar havuzuna eklenir)
  2. **Yapı:** cümle iskeleti (örn. "*Although* [X], [Y] → X ile Y zıt")
  3. **Mantık:** her şıkkın Türkçesi, doğru şıkkın gerekçesi, yanlışların tuzak kodları

---

## 4. Tuzak kataloğu

ÖSYM'nin yanlış şıkları kurarken kullandığı kalıplar. Her yanlış şık bir ya da birkaç kodla etiketlenir.

| Kod | Tuzak | Nasıl çalışır | Nasıl yakalanır |
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

**Altın kural:** Şıklar arasındaki *farklar*, sorunun neyi test ettiğini gösterir. Önce şıkları birbiriyle karşılaştır, farklı olan noktaları bul.

---

## 5. Soru tipi strateji kartları

> YDS: 80 soru, 180 dakika. Aşağıdaki dağılım son yılların tipik dağılımıdır. Sınav öncesi güncel ÖSYM kılavuzuyla doğrulanmalı.

| Soru no | Tip | Adet |
|---|---|---|
| 1–6 | Kelime | 6 |
| 7–16 | Dilbilgisi | 10 |
| 17–26 | Cloze test | 10 |
| 27–36 | Cümle tamamlama | 10 |
| 37–42 | Çeviri (İng→Tr, Tr→İng) | 6 |
| 43–62 | Okuma parçaları | 20 |
| 63–67 | Diyalog tamamlama | 5 |
| 68–71 | Yakın anlamlı cümle | 4 |
| 72–75 | Paragraf tamamlama | 4 |
| 76–80 | Anlamı bozan cümle | 5 |

---

### 5.1 Kelime
**Adımlar**
1. Boşluğun hemen önüne ve arkasına bak. Eşdizim (collocation) veya edat ipucu var mı? (*___ on* → depend / rely)
2. Cümlede yön ipucu ara: *but, although* zıt anlamı, *and, as well as* benzer anlamı gösterir.
3. Cümlenin tonunu belirle (olumlu/olumsuz). Ters tondaki şıkları ele.
4. Kalan şıkları cümleye yerleştirip Türkçe düşün.

**Sık tuzaklar:** T12, T15, ton uyumsuzluğu
⚠️ **Dikkat:** İki şık da "anlamlı" görünüyorsa, fark genellikle eşdizimdedir.

---

### 5.2 Dilbilgisi
**Adımlar**
1. Şıkları karşılaştır: hepsi farklı tense mi, farklı edat mı, farklı bağlaç mı? Konuyu belirle.
2. **Tense ise:** zaman ifadelerini bul.
   - *since / for / so far / recently* → present perfect
   - *by the time* + past → past perfect
   - *ago / in 1990 / last year* → past simple
   - *by* + gelecek zaman → future perfect
3. **Bağlaç ise:** yön (T3) + yapı (T11). *Although/while* + cümle, *despite/in spite of* + isim öbeği.
4. **İki boşluk varsa:** emin olduğun boşlukla başla, uymayanları ele, sonra diğerine bak.
5. **If cümlesi ise:** tipi belirle (gerçek / hayali şimdi / hayali geçmiş).

**Sık tuzaklar:** T2, T11, T12, T3
⚠️ **Dikkat:** Anlam olarak "olur" demek yetmez, yapının da uyması gerekir.

---

### 5.3 Cloze test
**Adımlar**
1. Önce paragrafın tamamını hızlıca oku. Konu ne, genel tense ne? (Bilimsel metin çoğunlukla present simple, tarihsel metin past.)
2. Her boşlukta **sadece o cümleye değil, önceki cümleye de** bak.
3. Bağlaç boşluklarında önceki cümle ile boşluklu cümle arasındaki ilişkiyi belirle (zıt / ek / sonuç / örnek).
4. Sonra kelime ve dilbilgisi kartlarını uygula.

**Sık tuzaklar:** T2, T3, T12
⚠️ **Dikkat:** Boşluklu cümleye tek başına uyan şık, paragrafın akışına uymayabilir.

---

### 5.4 Cümle tamamlama
**Adımlar**
1. Şıklara bakmadan verilen kısımdaki **bağlacı** bul ve yönünü belirle.
2. **Yapı kontrolü (T11):** Verilen kısımda bağlaç varsa şık bağımsız cümle olmalı. Verilen kısım bağımsız cümleyse şık bağlaçla başlamalı.
3. **Tense uyumu (T2):** Uyumsuz şıkları anlamına bakmadan ele.
4. **Zamir kontrolü (T6):** Şıktaki *it/they/this* neyi gösteriyor?
5. Kalan şıklarda anlam yönünü karşılaştır (T3).

**Sık tuzaklar:** T3, T2, T11, T6, T5
⚠️ **Dikkat:** En sık çeldirici, mantıklı görünen ama bağlacın yönünü desteklemeyen şıktır.

---

### 5.5 Çeviri
**Adımlar**
1. Verilen cümlenin **ana öznesini ve ana yüklemini** bul. Türkçede yüklem sondadır.
2. Uzun cümleyi parçalara böl: ana cümle / yan cümle / ekler.
3. Şıkları birbiriyle karşılaştır. Farklı olan noktalar test edilen yerlerdir.
4. Sırayla kontrol et: özne (T8) → zaman/modal → kapsam (T4) → olumsuzluk (T9) → hangi kısım ana cümle?
5. En çok unsuru doğru aktaran şıkkı seç. Birebir kelime eşleşmesi aramak gerekmez.

**Sık tuzaklar:** T8, T4, T9, ana cümle ile yan cümlenin yer değiştirmesi, etken/edilgen değişimi
⚠️ **Dikkat:** En "akıcı" Türkçe şık her zaman doğru değildir. Anlam unsurlarının eksiksiz olmasına bak.

---

### 5.6 Okuma parçaları
**Adımlar**
1. Önce **soruları** oku (soru köklerini). Ne aradığını bilerek oku.
2. Paragrafın ilk ve son cümlesine özellikle dikkat et. Ana fikir genelde buradadır.
3. Soru tipini belirle: ana fikir / detay / çıkarım / kelime anlamı / yazarın tutumu / başlık.
4. Cevabı metinde **bul ve işaretle**. Şıkkı metinle karşılaştır, hafızadan cevaplama.
5. Ana fikir sorusunda çok dar ve çok geniş şıkları ele (T14).

**Sık tuzaklar:** T1, T14, T5, T13, T4
⚠️ **Dikkat:** Metindeki kelimeleri aynen tekrar eden şık genellikle tuzaktır. Doğru cevap çoğunlukla aynı fikri farklı kelimelerle (paraphrase) söyler.

---

### 5.7 Diyalog tamamlama
**Adımlar**
1. Boşluktan **sonraki** repliği oku. Boşluk ona cevap veriyor ya da onu tetikliyor olmalı.
2. Boşluk soruysa: sonraki replik evet/hayır mı, bilgi mi veriyor? Soru tipi buna uymalı.
3. Konuşmacıların tutumunu belirle: katılıyor mu, itiraz mı ediyor?

**Sık tuzaklar:** T10, T3
⚠️ **Dikkat:** Konusu doğru ama sonraki repliğe bağlanmayan şık en sık çeldiricidir.

---

### 5.8 Yakın anlamlı cümle
**Adımlar**
1. Verilen cümlenin unsurlarını çıkar: ana fikir, zaman, modal, kapsam, karşılaştırma yönü, neden-sonuç, olumsuzluk.
2. Her şıkta bu unsurları tek tek kontrol et.
3. Tek bir unsuru bile değişmişse şıkkı ele.

**Sık tuzaklar:** T4, T7, T9, karşılaştırmanın ters çevrilmesi (*more than ↔ less than*)
⚠️ **Dikkat:** Farklı kelimeler kullanan şık doğru olabilir. Aynı kelimeleri kullanan şık ise bir unsuru değiştirmiş olabilir.

---

### 5.9 Paragraf tamamlama
**Adımlar**
1. Boşluğun **öncesindeki ve sonrasındaki** cümleyi oku.
2. Boşluktan sonra zamir veya *this/such/these* varsa, boşluktaki cümle bunların gösterdiği şeyi içermeli (T6).
3. Sonraki cümle *however / therefore / for example* ile başlıyorsa, boşluk ona uygun ilişkiyi kurmalı.
4. Boşluk sondaysa sonuç veya özet cümlesi ara.

**Sık tuzaklar:** T10, T6, T3
⚠️ **Dikkat:** Paragrafın konusuyla ilgili her cümle uymaz. Öncesine ve sonrasına bağlanmalı.

---

### 5.10 Anlamı bozan cümle
**Adımlar**
1. İlk cümleden paragrafın **konusunu ve odağını** belirle. İlk cümle nadiren cevaptır.
2. Her cümleyi bir öncekine bağla. Zamir ve bağlaç zinciri kopuyor mu?
3. Şüpheli cümleyi çıkarıp oku: paragraf daha akıcı hale geliyorsa cevap odur.

**Sık tuzaklar:** T10, T1
⚠️ **Dikkat:** Cevap çoğu zaman konuyla ilgili ve aynı anahtar kelimeyi içeren ama odaktan sapan cümledir.

---

## 6. Oturum akışı (~25 dk)

| Bölüm | Süre | İçerik |
|---|---|---|
| Isınma | 3 dk | 3 hatırlama sorusu: strateji kartı adımları, tuzak tanıma |
| Kelime + yapı | 7 dk | Vakti gelen kelime alıştırmaları (merdiven, Bölüm 12.2) + 1 yapı alıştırması |
| Soru | 12 dk | Tekrar zamanı gelen yanlışlar + aktif soru tipinde sıradaki aşama (Bölüm 3) |
| Kapanış | 3 dk | Özet: öğrenilen kelimeler, yakalanan/kaçırılan tuzaklar, ilerleme |
| *İsteğe bağlı* | 5–10 dk | Günün okuma metni (Bölüm 12.4) |

**Her soruda etkileşim:**
1. (Aşamaya göre) direktif + tuzak uyarısı
2. Cevap + güven seçimi: *Eminim / Emin değilim / Tahmin*
3. Kendine açıklama: elediğin en az bir şık için tuzak kodu seç
4. Geri bildirim: doğru gerekçe + her yanlış şıkkın tuzak kodu
5. İsteğe bağlı: katmanlı açma (kelime / yapı / mantık), koça soru sorma

### 6.1 Koça soru sor

**Neden çekirdekte?** Pilot sırasında gerçek ihtiyaç ortaya çıktı: soruyu okurken "Bu *-sa da* nereden geldi?", "*while* başta olunca anlam değişir mi?" gibi takip soruları doğuyor. Önceden üretilmiş açıklamalar bunları karşılayamaz. Cevapsız kalan merak, anlamamaya ve oradan bunalmaya dönüşür.

**Nasıl çalışır?**
- Her soru ekranında ve geri bildirimde "Koça sor" düğmesi olur. Alttan bir sohbet paneli açılır.
- Hazır öneri çipleri: "Bu cümleyi parça parça çevir", "Bu bağlaç ne demek?", "Neden B olmuyor?", "Bana benzer bir örnek ver".
- Sorulan şey bir kelime ya da cümle parçasıysa, onu metinde seçip "Koça sor" demek yeterli.

**Koçun bağlamı (her istekte gönderilir):** soru ve şıklar, doğru cevap, kullanıcının seçtiği şık, şıkların tuzak kodları ve açıklamaları, ilgili strateji kartı, tuzak kataloğu, kullanıcının yaklaşık seviyesi ve en zayıf tuzak kodları.

**Koçun kuralları:**
- Türkçe, kısa (çoğunlukla 3–8 satır), sade dil. Gerekirse küçük tablo ya da parça parça çeviri.
- Önce doğrudan cevap, sonra en fazla bir "bunu da bil" notu. Ders anlatmaya kaymaz.
- Uygun olduğunda tuzak kodu ve strateji adımıyla bağlantı kurar ("Bu tam olarak T3").
- Emin olmadığı dilbilgisi konusunda kesin konuşmaz, istisnayı belirtir. Bir kural "her zaman" değil "genellikle" geçerliyse bunu söyler.
- İçerik dosyasındaki açıklamayla çelişirse bunu belirtir. Bu durum içerik hatası olarak işaretlenir.

**Öğrenmeye geri bağlama:**
- Her sohbet ilgili soruyla birlikte saklanır.
- Sohbetten çıkan önemli bilgi tek tıkla tekrar kartına dönüşür. Örneğin "*while*: zaman mı zıtlık mı? Test: yerine *although* koy."
- Aynı soruda sık sorulan sorular birikir. Yerelde inceleme sırasında bunlar sorunun kalıcı açıklamasına eklenebilir. Pilotta Q28'in altın kuralı bu şekilde düzeltildi.

**Maliyet kontrolü:** sabit kısım (katalog, strateji kartı, kurallar) prompt önbelleğine alınır. Günlük mesaj sınırı ayarlardan değiştirilebilir. Yanıtlar akış (streaming) olarak gösterilir.

---

## 7. Uyarlama ve ustalık modeli

**Takip edilen göstergeler**
- **Soru tipi × aşama:** her tip için hangi aşamada olunduğu
- **Soru tipi başarı puanı:** Elo benzeri bir puan, her cevaptan sonra güncellenir
- **Tuzak yakalama oranı:** her tuzak kodu için doğru eleme yüzdesi
- **Kalibrasyon:** "Eminim" denilen soruların gerçek doğruluk oranı

**Soru seçimi**
- Beklenen başarı olasılığı ≈ %80–85 olan sorular seçilir (Elo: kullanıcı puanı ile soru puanı arasındaki farktan hesaplanır).
- En zayıf tuzak kodlarını içeren sorulara ek ağırlık verilir.
- Aşama 4'teki tipler karışık sırayla gelir.

**Tekrar havuzu (SM-2) öğeleri:** strateji kartları, tuzak kartları, kelimeler, yanlış yapılan sorular. Güvenle yapılan hatalar önceliklidir.

---

## 8. Motivasyon katmanı

Amaç bunalmayı azaltmak, baskı yaratmak değil.
- **Tek görev:** Uygulama açılınca "Bugünün oturumu: ~25 dk" ve tek bir *Başla* düğmesi.
- **Görünür ilerleme:** oturum sonu özeti, haftalık karşılaştırma, soru tipi × aşama haritası, tuzak bazında gelişim.
- **Tahmini YDS puanı:** tip bazlı başarıdan kaba bir tahmin (tip ağırlıklarıyla).
- **Affedici seri (isteğe bağlı):** haftada 5 gün hedefi. 1 gün kaçırınca seri sıfırlanmaz.
- **Kısa turlar:** 4–5 soruluk bloklar, aralarda kısa nefes.
- XP ve rozet yok. Ses, emoji kutlaması ve kilitli günler ise kullanıcının kararıyla eklendi (bkz. görsel yenileme tasarımı).

---

## 9. Kavramsal veri modeli

Teknik şema değil, varlıklar ve ilişkiler:

- **Passage (Metin):** okuma, cloze, paragraf tamamlama ve anlamı bozan cümle soruları için ortak metin
- **Question (Soru):** tip, kaynak (yıl/dönem/no), metin bağlantısı (isteğe bağlı), kök, doğru şık, zorluk puanı, strateji kartı bağlantısı
- **Option (Şık):** harf, metin, Türkçesi, doğru mu, **tuzak kodları[]**, açıklama
- **Layers (Katmanlar):** soru başına kelime listesi, yapı açıklaması, mantık açıklaması (önceden üretilip saklanır)
- **StrategyCard:** soru tipi, adımlar, uyarılar, hatırlama soruları
- **Trap:** kod, ad, açıklama, yakalama ipucu
- **Word:** kelime (lemma), anlam, kelime ailesi, eşdizimler, eş anlamlılar, AWL bayrağı, akılda tutma ipucu, kaynak soru(lar), merdiven basamağı
- **WordExercise:** kelime, basamak, alıştırma tipi, içerik (önceden üretilir)
- **StructureCard:** dilbilgisi kalıbı (örn. *although ↔ despite*), açıklama, dönüşüm alıştırmaları, kaynak soru(lar)
- **ReadingText:** üretilmiş okuma metni, hedef kelimeler, kavrama soruları, tarih
- **Attempt (Deneme):** soru, seçilen şık, doğru mu, güven, kendine açıklama kodları, süre, aşama, tarih
- **ReviewItem:** öğe türü (kart / tuzak / kelime / soru) + SM-2 alanları (aralık, kolaylık katsayısı, sonraki tarih)
- **Progress:** soru tipi × aşama, Elo puanı, tuzak bazlı yakalama oranları

---

## 10. Yol haritası

| Faz | Kapsam | Çıktı |
|---|---|---|
| **0** | Bu doküman. Kartlar ve tuzak kataloğuyla elle çalışmaya başla. | Uygulamasız kullanılabilir rehber |
| **1** | Veri hattı: çıkmış soru PDF'i → yapılandırılmış soru + şık tuzak kodları + katmanlar. Tek tip ile başla (cümle tamamlama). Göz kontrolü ile doğrulama. | ~50–100 etiketli soru |
| **2** | Çekirdek döngü: aşama 1–3, katmanlı açma, güven + kendine açıklama, geri bildirim, **koça soru sorma** (Bölüm 6.1) | Çalışan ilk prototip |
| **3** | Tekrar havuzu (SM-2) + oturum akışı + kapanış özeti | Günlük kullanılabilir sürüm |
| **4** | Elo ile uyarlamalı seçim, aşama 4 (karışık), ilerleme ekranı | Uyarlamalı motor |
| **5** | Diğer soru tipleri, süreli deneme modu | Tam kapsam |
| **6** | (İsteğe bağlı) Sentetik soru üretimi + çift doğrulama | Havuz genişletme |

---

## 11. Teknik altyapı için açık sorular

1. **Arayüz:** Streamlit (hızlı, Python) mı, web uygulaması (Next.js) mı? Telefondan kullanım gerekli mi?
2. **Veri tabanı:** SQLite (tek dosya, yerel) mi, bulut (Supabase/Postgres) mi?
3. **LLM kullanımı:** Sadece veri hazırlığında mı (önceden üret, sakla), yoksa canlı koç sohbetinde de mi? Hangi model, aylık bütçe?
4. **PDF → veri hattı:** ÖSYM PDF'lerinden metin çıkarma, soru/şık ayrıştırma, cevap anahtarı eşleştirme, tuzak etiketleme ve doğrulama nasıl yapılacak?
5. **Uyarlama algoritması:** Elo yeterli mi, ileride IRT gerekir mi?
6. **Barındırma:** Sadece bilgisayarda yerel mi, yoksa her yerden erişim mi?

---

## 12. Dil gelişimi modülü (kelime, yapı, okuma)

Strateji ve tuzak bilgisi puanı hızlı artırır, ama YDS'de yüksek puanın tavanını **kelime bilgisi ve uzun cümleleri çözebilme** belirler. Bu modül, her sorudan dil malzemesi "hasat eder" ve onu farklı alıştırmalarla tekrar tekrar karşına çıkarır.

### 12.1 Döngü: sorudan dile, dilden yeniden soruya

```
  Soru çözülür
      │  hasat: kelimeler, eşdizimler, yapı kalıbı
      ▼
  Kelime merdiveni + yapı alıştırmaları   (aralıklı tekrar)
      │
      ▼
  Günün okuma metni: aynı kelimeler yeni bağlamda
      │
      ▼
  Yeni sorularda aynı kelime/yapı → tanıma artık refleks
```

**Dayanaklar:**
- Bir kelimenin kalıcı öğrenilmesi için farklı bağlamlarda çok sayıda karşılaşma gerekir (Nation; genelde 10+ karşılaşma). Tek bir flash kart yetmez.
- Tanıma (gördüğünde anlama) ile hatırlama (Türkçesinden İngilizcesini bulma) farklı becerilerdir. Alıştırmalar kolaydan zora sıralanır.
- Kelimeler tek başına değil, **kalıp (chunk)** olarak öğrenilir: *play a role in*, *contribute to*, *be attributed to* (Lewis, sözcüksel yaklaşım).
- Bir metni yardımsız anlamak için kelimelerin yaklaşık **%98'ini** bilmek gerekir (Hu & Nation, 2000). Okuma metinleri bu orana göre ayarlanır.

### 12.2 Kelime merdiveni (her kelime için 7 basamak)

| Basamak | Alıştırma | Örnek | YDS'deki karşılığı |
|---|---|---|---|
| 1. Tanıma | İngilizce → Türkçe, çoktan seçmeli | *mitigate* → azaltmak / artırmak / ertelemek / gizlemek | Kelime soruları |
| 2. Bağlamda tanıma | Orijinal soru cümlesinde anlamı seç | "...measures to **mitigate** the effects..." | Okuma |
| 3. Boşluk doldurma (yeni cümle) | Daha önce görmediğin bir cümlede doğru kelimeyi seç | "Trees can ---- the impact of floods." | Kelime + cloze |
| 4. Eşdizim | Kelimenin kalıbını tamamla | *---- a role in* → play / make / do | T12 tuzağı |
| 5. Kelime ailesi | Doğru biçim | *mitigate / mitigation / mitigating* | Dilbilgisi, cloze |
| 6. Eş anlam / paraphrase | Aynı anlamı veren ifadeyi seç | *mitigate* ≈ *alleviate, lessen* | Yakın anlam, okuma (T1'e karşı panzehir) |
| 7. Hatırlama | Türkçe → İngilizce yaz (ilk harf ipucuyla) | azaltmak → m_______ | Çeviri |

- Doğru cevap bir sonraki basamağa çıkarır. Yanlış cevap bir basamak indirir ve tekrar aralığını kısaltır.
- Basamak 3 ve 6 en değerli olanlar: YDS'de kelime hiçbir zaman ezberlediğin cümlede çıkmaz. Okuma parçalarında ise doğru cevap genellikle **eş anlamlı bir ifadeyle** yazılır.
- Zor kelimeler için isteğe bağlı **çağrışım ipucu**. Öncelik sırası:
  1. **Türkçedeki alıntı kelime** (en güçlü ve güvenilir yol): *collapse* → kolaps, *distort* → distorsiyon, *detect* → dedektif, *cooperate* → kooperatif.
  2. **Kök/ek bağlantısı:** *accessible* → access + -ible, *comprehensive* → comprehend.
  3. **Anahtar kelime yöntemi** (Atkinson), sadece iki koşul birlikte sağlanıyorsa: (a) Türkçe anahtar kelime İngilizce kelimeye *sesçe* gerçekten benziyor, (b) anlamla *etkileşen* somut bir görüntü kuruluyor. Rastgele hikayeler ("Ağrı gitti, herkes toplandı = aggregate") hiç ipucu olmamasından daha kötüdür, çünkü yanlış bağ kurar.
  - LLM önerir, kalite kontrolünden geçmeyen ipucu gösterilmez. Beğenmezsen kendin yazarsın.
- **Basamak 8 (isteğe bağlı) — Üretim:** Kelimeyle kendi cümleni yaz, LLM kısa geri bildirim versin (doğru kullanım, eşdizim, alternatif).

**Hangi kelimeler hasat edilir?**
- Öncelik **Akademik Kelime Listesi (AWL, Coxhead 2000; 570 kelime ailesi)** ve YDS'de sık çıkan kelimeler.
- Çok temel kelimeler (zaten bilinen) ve çok nadir kelimeler (bir kez çıkıp kaybolan) atlanır.
- Soruda işaretlediğin (dokunup anlamına baktığın) kelimeler her zaman eklenir.
- Alfabetik listelerden çalışılmaz. Alfabetik sıra *adapt/adopt, affect/effect* gibi birbirine benzeyen kelimeleri yan yana getirir ve karışmalarına yol açar.

**Gruplama kuralı:**
- **Tematik gruplar iyidir:** aynı metinden/konudan gelen kelimeler (iklim metnindeki *emission, mitigate, adverse*). Sorudan hasat zaten bunu doğal olarak sağlar.
- **Eş anlamlıları ilk öğrenmede birlikte vermek kötüdür:** birbirine karışırlar (anlamsal kümelenme girişimi; Tinkham 1993, Waring 1997, Türk öğrencilerle Erten & Tekin 2008). Eş anlamlılar kelime oturduktan sonra, basamak 6'da gelir.
- **Kelime ailesi** (aynı kök: *adapt, adaptation, adaptive*) birlikte verilebilir, bu bir biçim ilişkisidir, karışıklık yaratmaz.

**Günlük yeni kelime sınırı:**
- Başlangıç: **günde 10 yeni kelime**. Aralıklı tekrarda her yeni kelime sonraki günlere tekrar yükü bindirir. Günde 50 yeni kelime birkaç hafta içinde günde yüzlerce tekrar demektir ve bunalmanın en hızlı yolu budur.
- Tekrar yükü günde ~15 dakikayı aşarsa yeni kelime otomatik durdurulur, yük düşünce tekrar açılır. Hafif günlerde sınır 15–20'ye çıkabilir.

**Etkisi düşük yöntemler (kullanılmaz):** kendi sesini kaydedip pasif olarak dinlemek ve listeyi tekrar tekrar okumak. Bunlar tanıdıklık hissi yaratır ama hatırlamayı az geliştirir (Dunlosky vd. 2013). Aynı süre hatırlama pratiğine harcanır.

### 12.3 Yapı alıştırmaları

Kelimeyi bilmek yetmez. Uzun akademik cümlenin iskeletini görebilmek gerekir. "Anlamıyorum" hissinin büyük kısmı buradan gelir.

| Alıştırma | Ne yapılır | Hedef |
|---|---|---|
| **Cümle çözümleme** | Uzun bir cümlede ana özneye, ana yükleme ve yan cümlelere dokunarak işaretle | Çeviri, okuma, T8 |
| **Dönüşüm** | Aynı anlamı başka yapıyla seç: *Although it rained → Despite the rain* | T11, yakın anlam |
| **Bağlaç yönü** | İki cümle arasındaki ilişkiyi seç: zıtlık / neden / sonuç / ek / örnek | T3, cümle tamamlama, cloze |
| **Zaman çizgisi** | Cümledeki olayları zamana göre sırala, tense'i seç | T2, dilbilgisi |
| **Zamir takibi** | *it / they / this* neyi gösteriyor? | T6, paragraf tamamlama |
| **Kısaltılmış yapılar** | *The study conducted in 2010...* = *which was conducted* | Okuma, çeviri |
| **Devrik yapı** | *Not only did..., Rarely have...* | Yakın anlam, okuma |

Her yapı kalıbı bir **yapı kartıdır** (StructureCard). Strateji kartları gibi aralıklı tekrar edilir ve karşılaşıldığı sorulara bağlanır.

### 12.4 Günün okuma metni (kontrollü girdi)

- LLM her gün **150–250 kelimelik** akademik bir paragraf üretir. Konular YDS'nin sevdiği alanlardan seçilir: bilim, sağlık, çevre, tarih, psikoloji, teknoloji.
- Metin, **bildiğin kelimelerin ~%95–98'ini** içerecek şekilde kurulur ve son günlerde öğrendiğin 5–8 kelimeyi içerir. Böylece metin hem anlaşılır olur hem de yeni kelimeleri doğal bağlamda tekrar ettirir.
- Ardından 3 kısa soru: ana fikir, detay, bir kelimenin eş anlamlısı.
- Seviye ilerledikçe cümleler uzar ve yapılar karmaşıklaşır.
- İsteğe bağlı: metnin tek bir cümlesini Türkçeye çevir, LLM geri bildirim versin.

### 12.5 Her soruda açıklama + bağlantılı alıştırma

Soru geri bildirim ekranındaki katmanlara (Bölüm 3) bir eylem eklenir:

- **Kelime katmanı** → "Bu 4 kelimeyi merdivene ekle" (varsayılan olarak ekli)
- **Yapı katmanı** → "Bu yapıyı çalış": ilgili yapı kartı + 3 dönüşüm alıştırması
- **Mantık katmanı** → "Bu tuzağın benzerleri": aynı tuzak kodunu içeren 2–3 soru

Böylece her yanlış cevap, ilgili kelime, yapı ve tuzak alıştırmalarına dönüşür.

### 12.6 Üretim ve veri hattına etkisi

- Soru etiketleme aşamasında (veri hattı) her soru için ayrıca: hasat edilecek kelimeler (lemma, aile, eşdizim, eş anlam), yapı kalıbı etiketleri ve **merdiven alıştırmaları önceden üretilir** ve içerik dosyalarına kaydedilir.
- Canlıda üretilen tek şey günün okuma metnidir, çünkü bilinen kelimelere göre kişiselleştirilir. Üretilen metinler saklanır, tekrar kullanılabilir.
- Alıştırmaların kalitesi için kural: her boşluk doldurma ve eş anlam sorusunda **tek doğru cevap** olmalı. Bunun için kör çözüm testi burada da uygulanır.
