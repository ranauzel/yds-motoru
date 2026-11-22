# Yol haritası (sınava kadar)

> 2026-11-23 · Sınav: mart–nisan 2027 (yaklaşık 18–20 hafta)
> Hedef: YDS'nin bütün soru tiplerini uygulamaya almak ve puanı en yükseğe çıkarmak. Temel: [TASARIM.md](TASARIM.md)

## YDS'nin matematiği (öncelikleri belirleyen gerçekler)

- **Puanlama:** 80 soru, 100 puan, yani her soru 1,25 puan.
- **Yanlışlar doğruları götürmüyor.** Hiçbir soru boş bırakılmamalı. İki şıkka kadar elenmiş bir soruda tahmin etmenin beklenen getirisi yarım soru.
- **Okuma:** 20 soru, yani 25 puan. En büyük blok.
- **1–36 arası:** Kelime, dilbilgisi, cloze ve cümle tamamlama toplam 36 soru. Hepsi aynı temele dayanıyor: kelime, tense ve bağlaçlar. Bu temele yapılan yatırım dört tipe birden yansıyor.
- **Süre:** 180 dakikada 80 soru, yani soru başına yaklaşık 2,25 dakika. Okumaya süre kalması için 1–36 arası hızlı geçilmeli.
- **Hedef puan için gereken doğru sayısı:** 60 puan için 48, 70 puan için 56, 80 puan için 64 doğru.

## İçerik kaynağı

1. **ÖSYM'nin çıkmış soruları (ana kaynak):** 2013'ten bu yana yılda 2–3 sınav yapılıyor. Yaklaşık 2.000 soru demek. Hat (1. adım) ile her sınav tek komutla içeri alınır.
2. **Kendi ürettiğimiz alıştırmalar:** Kelime merdiveni, boşluk doldurma ve yapı alıştırmaları (TASARIM §12). Her birinin tek bir doğru cevabı olur ve kör çözümle doğrulanır.
3. **Üretilmiş YDS tarzı sorular (isteğe bağlı, sonra):** Zayıf tuzaklara özel üretilir, "üretilmiş" olarak işaretlenir ve çifte doğrulamadan geçer (TASARIM Faz 6).

## Sıra

| Haftalar | Adım | Neden bu sırada |
|---|---|---|
| 1–2 | **1. Soru hattı** (PDF → Gemini, cümle tamamlama) + geçmiş sınavların içeri alınması | İçerik darboğazı: şu an 10 soru var. Gemini altyapısı sonraki her adımda kullanılıyor. Tasarım: [specs/2026-11-23-soru-hatti-design.md](superpowers/specs/2026-11-23-soru-hatti-design.md) |
| 1–2 | **2. Soru seçimi (Faz 3):** her oturumda yeni sorular + zamanı gelen yanlışlar | Yüzlerce soru gelince `pickSessionQuestions` (şu an bütün sorular) yetmez |
| 3–6 | **3. Okuma tipi:** analizör, metin grupları, şemanın tipe göre ayrılması, ekran | En çok puan burada (25) |
| 3–6 | **4. Puan getirisi önerisi:** tipe göre doğru oranı × soru sayısı = tahmini puan; en çok puan kazandıracak tipi öner, en sık düşülen tuzağı göster | Çalışmayı puan getirisine göre yönlendirir |
| 7–9 | **5. Koç** (TASARIM §6.1): "Koça sor" düğmesi, hazır sorular, akış halinde cevap, sohbetin kaydedilmesi | Önceden üretilmiş açıklamaların karşılayamadığı soruları cevaplar |
| 10–14 | **6. Kalan tipler**, puan getirisine göre sırayla (muhtemelen önce dilbilgisi ve cloze) | Her tip için analizör ve ekran birlikte yazılır |
| 15–20 | **7. Süreli deneme modu** (80 soru, 180 dakika) + **kelime/alıştırma paneli** | Son haftalar deneme ağırlıklı geçmeli |

Her adım ayrı ayrı brainstorming ile tasarlanır ve plana dökülür. Sıra, puan getirisi verisi ve kalan süreye göre güncellenir.

## Sonraya kalanlar

- **Web sürümü:** Başka kullanıcıların canlı sitede kendi PDF'lerini yüklemesi.
  - Çözülmesi gerekenler: kimin anahtarı kullanılacak, telif, Vercel'deki süre sınırı.
  - Koç, sorunun önceden derin analiz edilmesinin yerini kısmen alarak maliyeti düşürebilir.
- **Python betikleri:** `render_review.py` ve `build_practice.py`, hat oturduktan sonra emekliye ayrılabilir.
- **Tuzak kataloğu:** Kodu olmayan tuzaklar için yeni kodlar, o tipler eklenirken eklenir. Örnekler: ton uyumsuzluğu, etken/edilgen değişimi, karşılaştırmanın ters çevrilmesi.
