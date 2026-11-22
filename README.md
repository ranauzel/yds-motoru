# YDS Strateji Motoru

Kişisel YDS çalışma uygulaması. Gerçek ÖSYM sorularını tuzak analizi, çözüm adımları ve aralıklı tekrarla (SM-2) çalıştırır.

Tasarım: [docs/TASARIM.md](docs/TASARIM.md) · Arayüz: [docs/ARAYUZ.md](docs/ARAYUZ.md) · Pratik ekranı: [docs/superpowers/specs/2026-11-22-pratik-ekrani-design.md](docs/superpowers/specs/2026-11-22-pratik-ekrani-design.md)

> Bu repoda ÖSYM sorusu **yoktur**. ÖSYM soruları telif hakkıyla korunur, bu yüzden yayımlanmaz. Repoda yalnızca `content/ornek/` altında kendi yazdığımız bir örnek soru var. Gerçek sorular `content/sorular/` klasöründe durur; bu klasör git dışıdır ve ayrı, private bir repoda tutulur. Kendi sorularını aynı formatta oraya koyabilirsin.

## Durum

- **Giriş:** Better Auth, e-posta + şifre. Kayıt kapalı; hesaplar `pnpm user:create` ile açılır (`ALLOW_SIGNUP=true` ile açılabilir).
- **Pratik ekranı** (`/oturum/[id]`): kelime ısınması → soru (seç, *Eminim / Emin değilim*) → geri bildirim, tuzaklar, çözüm adımları → mola → özet ve gözden geçirme. Yardımcılar: çeviri (T), kelimeler (K), ipucu (I). Tamamen klavyeyle kullanılabilir.
- **Kayıt:** her cevap, ısınma kelimesi ve ilerleme Postgres'e yazılır; bağlantı koparsa sıradaki kayıtlar yeniden denenir. Oturum yarıda kalırsa ana sayfadan devam edilir, başka cihazda kalınan yerden açılır.
- **Tekrar:** sorular ve kelimeler SM-2 ile planlanır (`review_items`).
- **İçerik:** soru tipi şimdilik cümle tamamlama. Her soru bir konuya ayrılmış: koşul, zıtlık, neden-sonuç, ekleme, zaman, amaç, karşılaştırma, ilişkili yapı. `content/sorular/` yoksa uygulama örnek soruyla açılır.

**Sırada:** soruların veritabanına taşınması (`content:import`), tek komutla Docker kurulumu (veritabanı + uygulama), vakti gelen yanlışların oturuma çekilmesi, konuya göre çalışma.

## Yapı

```
apps/web/            Next.js 16 (App Router, cacheComponents)
  app/               Sayfalar: / (ana sayfa), /giris, /oturum/[id]
  features/session/  Pratik oturumu: durum makinesi, sunucu eylemleri, kayıt kuyruğu, klavye, bileşenler
  lib/domain/        SM-2 vb. saf fonksiyonlar (testli)
  lib/content/       İçerik şeması (zod) + yükleyici
  lib/db/            Postgres şeması (Drizzle): yalnızca kullanıcı ve ilerleme verisi
  drizzle/           Migration'lar
pipeline/            Python: içerik doğrulama, inceleme ve pratik sayfası üretimi
content/ornek/       Örnek soru (repoda; ÖSYM sorusu değil)
content/sorular/     Gerçek sorular (JSON, git dışı): <sinav>/<soru-tipi>.json
data/raw/            ÖSYM PDF'leri (git dışı)
docs/                Tasarım, arayüz, spec ve planlar
```

## Kurulum

1. `apps/web/.env.example` dosyasını `apps/web/.env.local` olarak kopyala ve değerleri doldur.
2. Veritabanı: Neon (bulut) **ya da** kendi bilgisayarında `docker compose up -d db`.
3. `cd apps/web && pnpm install && pnpm db:migrate && pnpm user:create <email> <şifre>`
4. `pnpm dev` → http://localhost:3000

## Komutlar (apps/web içinde)

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm test` | Birim testleri + içerik doğrulama (Vitest) |
| `pnpm typecheck` | TypeScript kontrolü |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Şema değişikliğinden migration üretir |
| `pnpm db:migrate` | Migration'ları veritabanına uygular |
| `pnpm db:check` | Bağlantıyı ve tabloları kontrol eder |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm user:create <email> <şifre> [ad]` | Hesap oluşturur |
| `pnpm user:delete <email>` | Hesabı ve tüm verilerini siler |

## Yeni soru ekleme

1. Sınav PDF'ini `data/raw/` içine koy (git'e girmez).
2. Soruları `content/sorular/<sinav>/<soru-tipi>.json` dosyasına şemaya uygun yaz. Örnek: [content/ornek/sorular/ornek/cumle-tamamlama.json](content/ornek/sorular/ornek/cumle-tamamlama.json). Şema: ([apps/web/lib/content/schema.ts](apps/web/lib/content/schema.ts)). Her soruda şunlar olmalı: `topic`, şıkların çevirisi, yanlış şıklar için tuzak kodu, çözüm adımları ve kelimeler.
3. Doğrula ve inceleme sayfası üret (repo kökünde):

```
python pipeline/render_review.py content/sorular/<sinav>/<dosya>.json   # doğrula + inceleme sayfası
python pipeline/build_practice.py content/sorular/<sinav>/<dosya>.json  # yerel pratik sayfası
```

4. `cd apps/web && pnpm test`: içerik testleri bozuk dosyayı yakalar.
5. İncelenen soruların `review.status` alanını `reviewed` yap.

Windows'ta Python çıktısında Türkçe karakter hatası alırsan önce `PYTHONIOENCODING=utf-8` ayarla.
