// Veritabanı bağlantısını ve tabloları kontrol eder. Kullanım: pnpm db:check
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local", quiet: true });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tables = await pool.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  );
  console.log("Bağlantı OK. Tablolar:", tables.rows.map((r) => r.table_name).join(", ") || "(yok)");
  const users = await pool.query("select count(*)::int as n from information_schema.tables where table_name = 'user'");
  if (users.rows[0].n) {
    const n = await pool.query<{ n: number }>('select count(*)::int as n from "user"');
    console.log("Kullanıcı sayısı:", n.rows[0].n);
  }
  await pool.end();
}

main().catch((e) => {
  console.error("Bağlantı HATASI:", e.message);
  process.exit(1);
});
