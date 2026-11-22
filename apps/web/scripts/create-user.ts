// Hesap oluşturur (kayıt kapalıyken tek yol).
// Kullanım: pnpm user:create <email> <şifre> [ad]
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const [email, password, name = "Ben"] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Kullanım: pnpm user:create <email> <şifre> [ad]");
    process.exit(1);
  }
  const { createAuth } = await import("../lib/auth");
  const auth = createAuth({ allowSignUp: true });
  const res = await auth.api.signUpEmail({ body: { email, password, name } });
  console.log(`Hesap oluşturuldu: ${res.user.email} (id: ${res.user.id})`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Hata:", e?.body?.message ?? e?.message ?? e);
  process.exit(1);
});
