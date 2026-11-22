// Hesabı ve ona ait tüm verileri (oturum, cevaplar, tekrar havuzu) siler.
// Kullanım: pnpm user:delete <email>
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local", quiet: true });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Kullanım: pnpm user:delete <email>");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query('delete from "user" where email = $1', [email]);
  console.log(res.rowCount ? `Silindi: ${email}` : `Bulunamadı: ${email}`);
  await pool.end();
}

main().catch((e) => {
  console.error("Hata:", e.message);
  process.exit(1);
});
