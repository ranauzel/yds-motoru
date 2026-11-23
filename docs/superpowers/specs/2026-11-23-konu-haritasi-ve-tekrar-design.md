# Konu haritası ve soru tekrarı — tasarım

Tarih: 2026-11-23 · Durum: onaylandı

## 1. Amaç ve neden

İki istek:

1. **Her soru tipi, bağlaçlardaki gibi konulara ayrılsın ve her konunun kendi çözüm yolu olsun.** Cümle tamamlamada bu var. Sorular bağlacın işlevine göre 8 konuya ayrılıyor (zıtlık, koşul…) ve her soruda çözüm adımları var. Diğer 9 tipte yok. TASARIM §5'te yalnızca tip düzeyinde bir strateji kartı var. Kullanıcı hem konuya göre etiket (zayıf konuyu görmek, konuya göre çalışmak) hem de konuya özel tarif istiyor (seçenek C).
2. **Çözülen sorular tekrar tekrar önüne çıkmasın.** Şimdi SM-2 doğru bilinen soruyu da 1 gün, 6 gün… sonra geri getiriyor. Yeni soru azalınca boşluk bu tekrarlarla doluyor. Gerçek ÖSYM sorusu sınırlı ve ikinci görüşte cevap harfi hatırlanıyor. Bu ilerlemeyi olduğundan iyi gösteriyor.

Neden şimdi: diğer 9 tipten (~630 soru, 9 sınavın PDF'i ve anahtarları elde) soru çıkarmaya başlamadan önce. Konular baştan belli olursa sorular ilk çıkarımda doğru etiketlenir, sonradan yeniden etiketleme gerekmez. Sınav mart–nisan 2027.

## 2. Hedefler, hedef dışı, karşı-hedefler

**Hedefler**
- 10 tipin her biri için konu listesi ve her konu için kısa tarif (`docs/KONU-HARITASI.md`), kullanıcı onaylı.
- Kodda `topic` tipe göre doğrulanır. Cümle tamamlamanın 8 konusu tarifleriyle koda girer ve uygulamada gösterilir.
- Günlük oturumda yeni soru tekrarı kuralı (§5).
- Panoda "Zayıf konular" kartı (§4.4).

**Hedef dışı (bu işte yok)**
- Diğer 9 tipin sorularını çıkarmak. Ayrı iş, sıradaki. Her tip çıkarılırken konuları koda eklenir.
- TASARIM §3'teki tam 4 aşamalı öğrenme yolu (rehberli/hatırlatmalı aşamalar, geçiş eşikleri). Bu işte yalnızca konuya ilk girişte tarif kartı var (§4.3).
- Kelime tekrarına dokunmak. Kelimeler SM-2 ile aynen devam eder.
- Serbest çalışmada "konuya göre" modu. Kullanıcı kararı: sonra, yeni tipler gelince.

**Karşı-hedefler (çalışsa bile başarısızlık sayılır)**
- Aynı soru, doğru ve emin cevaplandıktan sonra günlük oturumda yine çıkıyorsa.
- Yeni soru bitince oturum eski doğru sorularla doldurulup "çalışıyormuş gibi" gösteriyorsa.
- Konu listesi kullanıcının görmediği/onaylamadığı bir şekilde koda gömülüyse.
- Sade uygulama isteğine aykırı ek ekran, ayar, yönetim paneli.

## 3. Yaklaşımlar

1. **Önce harita dokümanı, kod her tiple birlikte** (seçilen). Doküman şimdi, kodda yalnızca cümle tamamlama + genel yapı. Diğer tiplerin kodu soruları çıkarılırken.
2. **Hepsi şimdi koda.** Sorusu olmayan tipler için kod. Gerçek sorular gelince konular değişeceği için iş iki kez yapılır.
3. **Konular veritabanında, düzenleme ekranıyla.** Esnek ama sadelik isteğine aykırı.

Kullanıcı 1'i seçti (önerildi): haritanın değeri içeriğinde. Kodla bağlamadan önce kullanıcının (sınava giren kişi) düzeltmesi en ucuzu.

## 4. Konu haritası

### 4.1 Doküman: `docs/KONU-HARITASI.md`

Her tip için:
- Konu listesi: kod adı (`snake_case`, ASCII) + Türkçe ad.
- Her konu için:
  - **Nasıl tanınır** (1 satır: soruda hangi işaret bu konuyu gösterir)
  - **Tarif** (3–4 adım)
  - **Sık tuzaklar** (TASARIM §4 kodları T1–T15)
  - **Mini örnek** (özgün, kendi yazdığımız; ÖSYM sorusu değil)

Tipin genel kartı TASARIM §5'te kalır. Harita onun altındaki konu düzeyidir ve ona atıf yapar, tekrar etmez.

### 4.2 Önerilen konular (başlangıç; doküman yazılırken ve gerçek sorulara bakılarak düzeltilir)

| Tip | Konular |
|---|---|
| Kelime | eşdizim/edat kalıbı · bağlamdan yön (zıt/benzer) · phrasal verb · benzer görünen kelime · ton/anlam |
| Dilbilgisi | tense · modal · edilgen · if/koşul · relative clause · noun clause · gerund/infinitive · edat · bağlaç · karşılaştırma/niceleyici |
| Cloze | cümleler arası bağlaç · tense · edat · kelime · zamir/gönderge |
| Cümle tamamlama | koşul · zıtlık · neden-sonuç · ekleme · zaman · amaç · karşılaştırma · ilişkili yapı (mevcut 8) |
| Çeviri | ana/yan cümle · edilgen · kapsam/niceleyici · karşılaştırma · olumsuzluk · zaman/modal · bağlaç |
| Okuma | ana fikir/başlık · detay · çıkarım · yazarın tutumu/amacı · gönderge/kelime anlamı |
| Diyalog | soru-cevap uyumu · katılma/itiraz · öneri/tavsiye · gerekçe/açıklama |
| Yakın anlamlı cümle | karşılaştırma · neden-sonuç · zaman/modal · kapsam · olumsuzluk · bağlaç dönüşümü |
| Paragraf tamamlama | giriş cümlesi · ara cümle (gönderge bağlantısı) · geçiş (bağlaç) · sonuç cümlesi |
| Anlamı bozan cümle | konudan sapma · odak sapması · zaman/bakış açısı kopması · gönderge zinciri kopması |

Bir soru tek bir ana konuya bağlanır (`topic`). İnce ayrım `sub_topic` serbest metninde kalır (bugünkü gibi).

### 4.3 Kod (bu işte)

- **Tek kaynak:** konular ve tarifler `apps/web/lib/content/topics.ts` içinde, tipe göre. Cümle tamamlamanın 8 konusu tarifleriyle girer. Diğer tiplerin girdileri o tip çıkarılırken eklenir. Bugünkü `TOPICS`/`TOPIC_NAMES` buradan türetilir.
- **Doğrulama:** içerik şeması, sorunun `topic`'inin kendi `type`'ının listesinde olduğunu kontrol eder. Listesi olmayan tip için soru kabul edilmez. Bu, haritası yazılmadan soru girmesini engeller.
- **Gösterim:**
  - Pratik ekranındaki ipucu panelinde (I) sorunun konusu ve tarifi görünür.
  - Kullanıcı bir konudan ilk kez soru gördüğünde, sorudan önce o konunun tarif kartı bir kez gösterilir ("Göster" aşamasının hafif hali). Kart tek dokunuşla geçilir, sonra yine ipucunda bulunur. *(Benim kararlarım:)*
    - Kart yalnızca günlük oturumda çıkar.
    - "Görüldü", `attempts` kaydından hesaplanır: o (tip, konu) çiftinde hiç cevap yoksa kart çıkar. Ek tablo yoktur.
    - Mevcut kullanıcı cümle tamamlamanın 8 konusunu zaten gördüğü için bu konularda kart görmez; tarifler ipucunda durur. Kart, yeni tiplerin konularında çıkar.
  - Konu kimliği (tip, konu) çiftidir. `zaman` gibi adlar tipler arasında tekrar edebilir.
- **Soru hattı:** Gemini istemi (`lib/content/generate/prompts.ts`) konu listesini `topics.ts`'ten alır. Elle liste tekrar yazılmaz.

### 4.4 Panoda "Zayıf konular" kartı

- Panodaki mevcut kart düzeninde (`features/dashboard/components/traps-card.tsx` gibi) bir kart.
- En zayıf 3 konuyu gösterir: Türkçe adı ve doğru oranı, ör. "Zıtlık %55". Konu adının yanında tip adı da yazar (ör. "Cümle tamamlama · Zıtlık").
- Kaynak: `attempts`, yalnızca günlük oturum cevapları. Bir konu, en az 3 cevap olunca listeye girer. *(Benim kararım: tek bir yanlış konuyu "zayıf" göstermesin.)*
- Yeterli veri yoksa kart "Henüz yeterli cevap yok" der.
- Kart şimdilik bir sayfaya gitmez. Konuya göre çalışma modu gelince oraya bağlanır.
- Hesap saf fonksiyon olarak testlenir (`features/dashboard/stats.ts` düzeninde).

## 5. Soru tekrarı kuralı

Yalnızca **günlük oturumdaki sorular** için. Kelimeler ve serbest çalışma bu kuralın dışında.

| Son cevap | Sonuç |
|---|---|
| Doğru + Eminim | Soru **emekli**: günlük oturuma bir daha gelmez. |
| Doğru + Emin değilim | ~7 gün sonra bir kez gelir. O zaman doğruysa (eminlik fark etmez) emekli. |
| Yanlış | SM-2 ile geri gelir (bugünkü gibi; "eminim deyip yanlış" önceliği korunur). Ayrıca sonraki oturumlarda, aynı tip ve konudan görülmemiş sorular yeni sorular arasında öne alınır. *(Benim kararım: açık oturum değişmez. Bu yalnızca `pickDailyQuestions` içinde bir sıralama kuralıdır, günlük 10 sorunun içinde kalır ve sıradan bir yeni sorunun yerini alır.)* |

- **~7 günlük kontrolde yanlış:** soru normal SM-2'ye döner ve tablo sonraki cevaba yeniden uygulanır. "Bir kez" mutlak bir sınır değildir. *(Benim kararım.)*

- **Yardım kullanıldıysa:** çeviri (T) veya ipucu (I) açılmışsa "Doğru + Eminim" bile "Doğru + Emin değilim" sayılır. *(Benim kararım: yardımla bulunan cevap ezberlenmiş sayılmamalı.)* Kelimeler (K) sayılmaz.
- **Yeni soru bitince:** oturum emekli sorularla doldurulmaz. Zamanı gelen tekrar yoksa ve yeni soru kalmadıysa ana sayfa "Bugünlük yeni soru kalmadı" der. Kelime tekrarı varsa oturum yalnızca kelimelerle açılır (bugünkü davranış).
- **Geçmiş:** kural mevcut kayıtlara da uygulanır. Bir sorunun son `attempts` kaydı doğru + emin ise ve yardım kullanılmamışsa emekli sayılır. Böylece bugüne kadar doğru çözdüğü sorular hemen kesilir.
- **Serbest çalışma:** bu işte değişmez. Tuzak çalışması kullanıcının bilerek seçtiği bir tekrar olduğu için emekli soruları da gösterebilir. "Çözdüklerim" gibi ayrı bir mod bu işte yok. *(Benim kararım.)*

## 5a. Sıra

*(Benim kararım.)*

1. Tekrar kuralı (§5) ve Zayıf konular kartı (§4.4). İkisi de haritaya bağlı değil, önce gelir.
2. `docs/KONU-HARITASI.md`. **Burada durulur:** kullanıcı okuyup onaylar.
3. Konu kodu (§4.3). Tarifler onaylı dokümandan alınır.

## 6. Kısıtlar

- ÖSYM sorusu git'e girmez. Haritadaki örnekler özgündür.
- Doğru cevap her zaman anahtardan gelir (soru hattı kuralı değişmez).
- Mevcut testler yeşil kalır. Yeni kurallar saf fonksiyon (`features/session/rules.ts`) olarak testlenir.
- Türkçe arayüz metni ARAYUZ.md üslubunda.

## 7. Kullanıcının kararları

- Konu + tarif birlikte (C).
- Önce doküman, kod tip tip (yaklaşım 1).
- Zayıf konular kartı şimdi, konuya göre çalışma modu sonra.
- §5 tablosu (doğru+eminim emekli, emin değilim 1 kez daha, yanlış SM-2 + aynı konudan başka soru, boşluk eski soruyla doldurulmaz).

## 8. Yapan kişiye bırakılanlar

- Emekliliğin nasıl tutulacağı: `review_items`'a bir alan mı, `attempts`'ten mi hesaplanır. Basit olan seçilir, migration gerekiyorsa küçük tutulur.
- "~7 gün" tam değeri ve sabitin yeri (`rules.ts`'teki diğer sabitlerin yanında).
- Tarif kartı ve ipucu panelindeki yerleşim (mevcut bileşenlere uyarak).
- Harita dokümanındaki tariflerin ve örneklerin ifadesi. Kullanıcı okuyup düzeltecek.
