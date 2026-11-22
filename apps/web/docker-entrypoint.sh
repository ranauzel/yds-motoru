#!/bin/sh
# Konteyner her açıldığında: tabloları güncelle, (istenirse) deneme hesabını aç, soruları aktar, sunucuyu başlat.
set -e

pnpm -s db:migrate

if [ -n "$DEMO_EMAIL" ] && [ -n "$DEMO_PASSWORD" ]; then
  # Hesap zaten varsa hata verir; sorun değil.
  pnpm -s user:create "$DEMO_EMAIL" "$DEMO_PASSWORD" Deneme 2>/dev/null || true
fi

# Gerçek sorular (content/sorular) deneme hesabına ait aktarılır; yoksa örnekler herkese açık aktarılır.
if [ -d "${CONTENT_DIR:-/content}/sorular" ] && [ -n "$DEMO_EMAIL" ]; then
  pnpm -s content:import --sahip "$DEMO_EMAIL"
else
  pnpm -s content:import
fi

exec node_modules/.bin/next start -H 0.0.0.0 -p 3000
