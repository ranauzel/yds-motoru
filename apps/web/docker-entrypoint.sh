#!/bin/sh
# Konteyner her açıldığında: tabloları güncelle, (istenirse) deneme hesabını aç, soruları aktar, sunucuyu başlat.
set -e

pnpm -s db:migrate

if [ -n "$DEMO_EMAIL" ] && [ -n "$DEMO_PASSWORD" ]; then
  # Hesap zaten varsa hata verir; sorun değil. Sorular bu hesaba ait olarak aktarılır.
  pnpm -s user:create "$DEMO_EMAIL" "$DEMO_PASSWORD" Deneme 2>/dev/null || true
  pnpm -s content:import --sahip "$DEMO_EMAIL"
else
  pnpm -s content:import
fi

exec node_modules/.bin/next start -H 0.0.0.0 -p 3000
