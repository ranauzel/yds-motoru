# Soruya özel ipucu ve tuzak uyarısı — kısa tasarım

Tarih: 2026-11-23 · Durum: kullanıcı onaylı (Task 11)

## Neden

Kullanıcı: "İpuçları hep aynı, soru özeline göre değişmiyor. Bağlaçla başlamalı diyor ama şıkların hepsi bağlaç zaten. Şıklardan nasıl gideceğimi bilmem lazım."

Kullanıcının 90 cümle tamamlama sorusunda şıklar şöyle dağılıyor:
- 45 soruda şıkların hepsi bağlaçla başlıyor.
- 36 soruda şıklarda bağlaç yok, bağlaç verilen kısımda.
- 9 soruda şıklar karışık: bazıları bağlaçla başlıyor, bazıları başlamıyor.

Sabit yönerge ("Önce bağlacı bul…") yarısında işe yaramıyor. Tuzak uyarısı da her soruda aynı ("en sık X tuzağına düşüyorsun"), o tuzak soruda olmasa bile çıkıyor.

## Ne yapılır

1. **Şık kalıbına göre yönerge ve adımlar.** Yalnızca cümle tamamlama sorularında geçerli. Kalıp şıkların ilk sözcüğünden ve kökte bağlaç etiketi (`stem_chunks` içinde `tag: "conj"`) olup olmamasından çıkarılır:
   - **Hepsi bağlaçlı:** yapı eleme yaptırmaz, anlam ilişkisi karşılaştırılır.
     - Kökte de bağlaç varsa ek uyarı: iki yan cümle oluşursa ana cümle eksik kalır.
   - **Bağlaç verilen kısımda, şıklarda yok:** bağlacın yönü yazılır, ana cümlenin ne içermesi gerektiği tahmin edilir, şıklar bu tahmine göre seçilir.
   - **Karışık:** önce cümle yapısıyla eleme yapılır, sonra anlam ilişkisine bakılır.
   - **Kalıp yoksa:** bugünkü sabit yönerge kalır.
   - **Gösterim:**
     - Yönerge, kökün üstündeki tek satırın yerine geçer.
     - Adımlar, "İpucu" panelinin başında "Şıklardan nasıl gidilir" başlığıyla gösterilir.
     - Ardından sorunun kendi ilk çözüm adımı ve konu tarifi gelir. Konu tarifi `topics.ts`'ten gelir ve aynen kalır.
2. **Soruya özel tuzak uyarısı.** "Dikkat" kutusu yalnızca kullanıcının en sık düştüğü tuzak bu sorunun yanlış şıklarından birinde etiketliyse görünür. Metin "bu soruda en sık düştüğün … tuzağı var" olur. Öbür sorularda kutu gösterilmez.

## Yaklaşımlar

- **(Seçilen) Kalıbı koddan çıkar.** Saf bir fonksiyon şık metinlerine ve kök etiketlerine bakar. İçeriğe dokunulmaz, 90 soruya hemen uygulanır.
- **İçeriğe alan ekle** (her soruya `option_pattern`). İçerik hattı değişir ve 7 sınav yeniden üretilir. Fazla iş.
- **Modele ürettir** (soru başına ipucu metni). Anahtar yok, maliyetli, tutarsız.

## Sınırlar

- Yalnızca cümle tamamlama. Diğer tipler soruları çıkarılınca kendi kalıplarıyla eklenir.
- Uyarı cevabı ele vermez. Hangi şıkta olduğunu söylemez, yalnızca tuzağın bu soruda bulunduğunu söyler.
- Arayüzde yeni ekran ya da ayar yok.
