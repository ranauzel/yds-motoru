# Soru hazırlama hattı (PDF → Gemini) — tasarım

> 2026-11-23 · Kapsam: ilk dilim, yalnızca cümle tamamlama (27–36)
> Temel: [TASARIM.md](../../TASARIM.md) §4 tuzak kataloğu, §5 strateji kartları ve numara aralıkları · [YOL-HARITASI.md](../../YOL-HARITASI.md) 1. adım

## Amaç

Bugün her sınavın soruları elle JSON'a yazılıyor ve hazırlığın en yavaş kısmı bu. Sınava (mart–nisan 2027) kadar çalışmak için yüzlerce soru gerekiyor. Kaynak, ÖSYM'nin yayımladığı çıkmış sınavlar. Hat bir sınav PDF'ini ve cevap anahtarını alıp mevcut şemaya uygun JSON üretecek. Kullanıcı yalnızca hattın şüpheli bulduğu sorulara bakacak.

Hattı şimdilik proje sahibi kendi bilgisayarında, kendi Gemini anahtarıyla kullanıyor. Sorular mevcut `content:import --sahip` adımıyla canlı veritabanına gidiyor.

## Vazgeçilmezler

- **Doğru cevap her zaman cevap anahtarından gelir.** Modelin döndürdüğü `answer` değeri yok sayılır, anahtardaki değer yazılır.
- **Şemadan ya da kör çözümden geçemeyen soru içerik dosyasına girmez.**
- **ÖSYM içeriği git'e girmez.**
  - PDF'ler `data/raw/` altında durur. Bu klasör gitignore'da.
  - Çıktı `content/sorular/` altına yazılır. Bu klasör ayrı bir private repoda.

## Komut

```
pnpm content:generate <sinav.pdf> --anahtar <cevaplar.txt> --sinav <id> --tarih YYYY-MM-DD [--ad "<sınav adı>"]
```

`--tarih` zorunlu, çünkü `content:import` bu değeri veritabanındaki `NOT NULL` tanımlı `exam_date` kolonuna yazıyor.

- **Cevap anahtarı:** Bir metin dosyası, her satırda `numara: şık` yazılı (örn. `27: C`).
  - Anahtarda yer almayan bir numara (örneğin iptal edilmiş bir soru) uyarı verilerek atlanır.
  - Geçersiz bir satır (A–E dışında bir şık ya da tekrar eden bir numara) hattı başlamadan durdurur.
- **Anahtar:** `GEMINI_API_KEY`, `apps/web/.env.local` dosyasından okunur. `.env.example` dosyasına açıklamalı bir satır eklenir.

## Akış (sınav başına iki Gemini çağrısı)

1. Cevap anahtarı okunur ve cümle tamamlama aralığındaki (27–36) numaralar alınır.
2. **Analiz çağrısı.** PDF, modele şu bilgilerle birlikte gönderilir:
   - soru numaraları ve doğru cevaplar
   - cümle tamamlama strateji kartı (TASARIM §5.4)
   - tuzak kataloğu (§4)
   - mevcut örnek sorulardan biri, biçim örneği olarak

   Model soruları yapılandırılmış JSON olarak döndürür. Bu JSON'un şeması mevcut zod şemasından üretilir.
3. **Hattın yazdığı alanlar.** `id` (`<sinav>-q<numara>`), `number`, `type` ve `answer` alanlarını model değil hat yazar. Her soru mevcut zod şemasından geçirilir (`superRefine` kuralları dahil). Geçemeyen soru, hata mesajıyla birlikte incelemeye ayrılır.
4. **Kör çözüm çağrısı.** Şemadan geçen soruların metni ve şıkları, cevaplar gösterilmeden modele verilir. Model her soru için bir şık seçer. Seçtiği şık anahtarla uyuşmayan soru incelemeye ayrılır.
5. **Yazma.**
   - Geçen sorular `content/sorular/<sinav>/cumle-tamamlama.json` dosyasına yazılır, `review: { status: "draft", blind_solve_match: true }` değeriyle.
   - İncelemeye ayrılanlar gerekçeleriyle birlikte `data/raw/<sinav>/inceleme.json` dosyasına yazılır.
   - Bir özet yazdırılır (örn. "10 soru: 8 hazır, 2 inceleme").
   - **İçerik dosyası zaten varsa hat durur ve üzerine yazmaz.**

`draft` sorular `content:import` sonrasında çalışmada hemen görünür. Bu kullanıcının kararı. Kullanıcı inceleme listesindeki soruları düzeltip içerik dosyasına kendisi ekler.

## Kod yapısı

- **Analiz işi tek bir fonksiyon:** `generateQuestions({ pdf, answers, type, client })`. PDF'i veri olarak, cevapları ve model istemcisini parametre olarak alır. Geçen ve incelemeye ayrılan soruları döndürür. Dosya okumaz, dosya yazmaz.
  - Komut bu fonksiyonun etrafında ince bir katmandır.
  - İleride web sürümü de aynı fonksiyonu çağırır.
- **Tipe özel kısım:** Bir tipin numara aralığı ve talimatı (strateji kartı) tipe göre bir tabloda tutulur. Yeni bir tip eklemek, bu tabloya bir satır ve o tipin şemasını eklemektir. Okuma ve cloze gibi tipler için metin grupları o tipin diliminde tasarlanır.
- **Model istemcisi:** Küçük bir arayüzdür. Testler sahte bir istemci kullanır, gerçek Gemini'ye gidilmez.
- **Yer:** `apps/web/scripts/` (komut) ve `apps/web/lib/content/` (fonksiyon), TypeScript ve `tsx` ile.

## Testler

Testler ağa çıkmaz:
- **Anahtar ayrıştırma:** geçerli satırlar, eksik numaranın atlanması, geçersiz şık, tekrar eden numara
- **Doğru cevap:** model farklı bir `answer` döndürse bile anahtardaki değer yazılır
- **Şema:** şemadan geçmeyen soru incelemeye ayrılır
- **Kör çözüm:** uyuşmayan soru içerik dosyasına girmez
- **Hattın alanları:** `id`, `number` ve `type` hattın yazdığı değerlerle çıkar

## Kabul

- Hat, **2021-yds-1** PDF'i ve anahtarıyla `--sinav 2021-yds-1-deneme` kimliği kullanılarak çalıştırılır. Elle hazırlanmış dosyaya dokunulmaz, deneme çıktısı veritabanına aktarılmaz.
- Çıktı elle hazırlanmış sorularla karşılaştırılır:
  - **Birebir aynı olmalı:** soru metni, şıklar ve cevap.
  - **Göz kontrolüyle değerlendirilir:** tuzak kodları ve açıklamalar. Kullanıcı bu soruları elle düzeltmeden çalışabileceğini söylemeli.
- Maliyet ve süre not edilir.

## Bilerek dışarıda bırakılanlar

- Diğer soru tipleri ve metin grupları
- Metin sadakati kontrolü (PDF metin katmanıyla karşılaştırma)
- Tip doğrulama (tip yalnızca numara aralığından belirlenir)
- Önbellek ve yarıda kalan çalışmayı sürdürme (10 soruyu yeniden çalıştırmak ucuz)
- Web arayüzünden yükleme

Hat kullanıldıkça gerek görülürse bunlar sonradan eklenir.

## Yapana bırakılanlar

- Gemini SDK'sı ve model seçimi, PDF'in gönderilme biçimi, yapılandırılmış çıktı ayarları. Güncel Gemini belgelerinden doğrulanmalı.
- Talimatların metni.
- Şemadan geçmeyen soru için bir kez yeniden deneme yapılıp yapılmayacağı.
