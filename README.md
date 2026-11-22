# YDS Strateji Motoru

Kişisel YDS çalışma uygulaması. Gerçek ÖSYM sorularını tuzak analizi, çözüm adımları ve aralıklı tekrarla (SM-2) çalıştırır.

Tasarım: [docs/TASARIM.md](docs/TASARIM.md) · Arayüz: [docs/ARAYUZ.md](docs/ARAYUZ.md) · Pratik ekranı: [docs/superpowers/specs/2026-11-22-pratik-ekrani-design.md](docs/superpowers/specs/2026-11-22-pratik-ekrani-design.md)

> Bu repoda ÖSYM sorusu **yoktur**. ÖSYM soruları telif hakkıyla korunur, bu yüzden yayımlanmaz. Repoda yalnızca `content/ornek/` altında kendi yazdığımız bir örnek soru var. Gerçek sorular `content/sorular/` klasöründe durur; bu klasör git dışıdır ve ayrı, private bir repoda tutulur. Kendi sorularını aynı formatta oraya koyabilirsin.

## Durum

- **Giriş:** Better Auth, e-posta + şifre. Kayıt kapalı; hesaplar `pnpm user:create` ile açılır (`ALLOW_SIGNUP=true` ile açılabilir).
- **Pratik ekranı** (`/oturum/[id]`): kelime ısınması → soru (seç, *Eminim / Emin değilim*) → geri bildirim, tuzaklar, çözüm adımları → mola → özet ve gözden geçirme. Yardımcılar: çeviri (T), kelimeler (K), ipucu (I). Tamamen klavyeyle kullanılabilir.
- **Kayıt:** her cevap, ısınma kelimesi ve ilerleme Postgres'e yazılır; bağlantı koparsa sıradaki kayıtlar yeniden denenir. Oturum yarıda kalırsa ana sayfadan devam edilir, başka cihazda kalınan yerden açılır.
- **Tekrar:** sorular ve kelimeler SM-2 ile planlanır (`review_items`).
- **İçerik:** sorular JSON dosyalarında yazılır, `pnpm content:import` ile `questions` tablosuna aktarılır; uygulama soruları veritabanından okur. Soru tipi şimdilik cümle tamamlama. Her soru bir konuya ayrılmış: koşul, zıtlık, neden-sonuç, ekleme, zaman, amaç, karşılaştırma, ilişkili yapı.

**Sırada:** vakti gelen yanlışların oturuma çekilmesi, konuya göre çalışma.

## Yapı

```
apps/web/            Next.js 16 (App Router, cacheComponents)
  app/               Sayfalar: / (ana sayfa), /giris, /oturum/[id]
  features/session/  Pratik oturumu: durum makinesi, sunucu eylemleri, kayıt kuyruğu, klavye, bileşenler
  lib/domain/        SM-2 vb. saf fonksiyonlar (testli)
  lib/content/       İçerik şeması (zod), dosya yükleyici, veritabanından okuma
  lib/db/            Postgres şeması (Drizzle): hesaplar, sorular, çalışma verisi
  drizzle/           Migration'lar
pipeline/            Python: içerik doğrulama, inceleme ve pratik sayfası üretimi
content/ornek/       Örnek soru (repoda; ÖSYM sorusu değil)
content/sorular/     Gerçek sorular (JSON, git dışı): <sinav>/<soru-tipi>.json
data/raw/            ÖSYM PDF'leri (git dışı)
docs/                Tasarım, arayüz, spec ve planlar
```

## Canlı demo

Misafir olarak, kayıt olmadan dene: **(adres yakında)**. Demodaki 10 soru bizim yazdığımız örnek sorulardır, ÖSYM sorusu değildir. Misafir hesapları 7 gün sonra silinir. Kendi sorularınla kullanmak için uygulamayı aşağıdaki gibi kendin kur.

## Hızlı deneme (Docker)

Bilgisayarında [Docker](https://www.docker.com/products/docker-desktop/) kurulu olsun. Repo kökünde:

```
docker compose up -d --build
```

http://localhost:3000 adresini aç ve `deneme@ornek.com` / `deneme123` ile giriş yap. Açılışta tablolar kurulur, sorular aktarılır ve bu deneme hesabı oluşturulur. Hesap bilgilerini değiştirmek için repo kökünde bir `.env` dosyasına `DEMO_EMAIL=…` ve `DEMO_PASSWORD=…` yaz.

İlk açılışta tek bir örnek soru görürsün. **Kendi sorularını eklemek için:**

1. JSON dosyalarını `content/sorular/<sinav>/<soru-tipi>.json` olarak koy (format için aşağıdaki "Yeni soru ekleme" bölümüne bak).
2. `docker compose restart web`: açılışta sorular doğrulanıp yeniden aktarılır. Bozuk dosya varsa uygulama açılmaz; hatayı `docker compose logs web` gösterir.

Durdurmak için `docker compose down`. Verilerin (`yds-db` volume'ü) silinmez. Hepsini silmek için `docker compose down -v`.

> Docker kurulumu kendi bilgisayarında denemek içindir. İnternete açacaksan `BETTER_AUTH_SECRET` değerini mutlaka kendin üret (`openssl rand -base64 32`).

## Geliştirme kurulumu

1. `apps/web/.env.example` dosyasını `apps/web/.env.local` olarak kopyala ve değerleri doldur.
2. Veritabanı: Neon (bulut) **ya da** kendi bilgisayarında `docker compose up -d db`.
3. `cd apps/web && pnpm install && pnpm db:migrate && pnpm content:import && pnpm user:create <email> <şifre>`
4. `pnpm dev` → http://localhost:3000

## Vercel'e yükleme (kendi demon)

1. Neon'da demo için **ayrı** bir veritabanı aç. Gerçek sorularının olduğu veritabanını kullanma.
2. Vercel → *Add New Project* → bu repoyu seç → **Root Directory: `apps/web`**.
3. Ortam değişkenleri: `DATABASE_URL` (demo veritabanı), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (sitenin adresi, ör. `https://xxx.vercel.app`), `ALLOW_GUEST=true`, `CRON_SECRET`.
4. Deploy. Her derlemede tablolar güncellenir ve repodaki örnek sorular aktarılır (`vercel.json`). Eski misafir hesapları her gece silinir.

## Komutlar (apps/web içinde)

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm test` | Birim testleri + içerik doğrulama (Vitest) |
| `pnpm typecheck` | TypeScript kontrolü |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Şema değişikliğinden migration üretir |
| `pnpm db:migrate` | Migration'ları veritabanına uygular |
| `pnpm content:import [klasör]` | Soru JSON'larını doğrular, veritabanına aktarır (yeni/değişen sorular) |
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
5. `pnpm content:import`: sorular veritabanına aktarılır (Docker'da `docker compose restart web`).
6. İncelenen soruların `review.status` alanını `reviewed` yap ve tekrar aktar.

Windows'ta Python çıktısında Türkçe karakter hatası alırsan önce `PYTHONIOENCODING=utf-8` ayarla.
