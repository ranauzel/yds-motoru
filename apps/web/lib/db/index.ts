// Standart Postgres sürücüsü (node-postgres): hem Neon'da hem de kullanıcının kendi
// bilgisayarındaki (Docker) Postgres'te aynı şekilde çalışır.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL tanımlı değil. apps/web/.env.local dosyasına ekle (bkz. .env.example).");

// Geliştirmede sıcak yeniden yüklemede bağlantı havuzu çoğalmasın diye global'de tutulur.
const g = globalThis as unknown as { __pgPool?: Pool };
// keepAlive: boşta bekleyen bağlantı ağ/Neon tarafından sessizce düşürülmesin.
// max 10: pano aynı anda ~7 sorgu atar, sıra beklemesin. Neon'un bağlantı havuzlayıcısı (pooler) bunu rahat taşır.
const pool = g.__pgPool ?? new Pool({
  connectionString: url, max: 10, keepAlive: true, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000,
});
// Boştaki bir bağlantı sunucu tarafında koparsa pg havuzda "error" yayar; dinleyici yoksa süreç çöker.
// Kopan bağlantı havuzdan zaten atılır, bir sonraki sorgu yenisini açar.
if (!g.__pgPool) pool.on("error", (err) => console.warn("[db] boştaki bağlantı koptu:", err.message));
if (process.env.NODE_ENV !== "production") g.__pgPool = pool;

export const db = drizzle({ client: pool, schema });
export { schema };
