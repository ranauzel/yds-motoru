# Uygulama imajı: derler, açılışta migration + soru aktarımı yapar, sonra sunucuyu başlatır.
# Tek başına değil, repo kökündeki docker-compose.yml ile kullanılır.
FROM node:22-alpine
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Derleme sırasında veritabanına bağlanılmaz; modül yüklenirken adres tanımlı olsun diye sahte değer.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm build

ENV NODE_ENV=production
EXPOSE 3000
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
