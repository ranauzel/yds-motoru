#!/bin/sh
# Konteyner her açıldığında: tabloları güncelle, soruları aktar, (istenirse) deneme hesabını aç, sunucuyu başlat.
set -e

pnpm -s db:migrate
pnpm -s content:import

if [ -n "$DEMO_EMAIL" ] && [ -n "$DEMO_PASSWORD" ]; then
  # Hesap zaten varsa hata verir; sorun değil.
  pnpm -s user:create "$DEMO_EMAIL" "$DEMO_PASSWORD" Deneme 2>/dev/null || true
fi

exec node_modules/.bin/next start -H 0.0.0.0 -p 3000
