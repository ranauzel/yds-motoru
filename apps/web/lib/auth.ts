import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "./db";

/**
 * Kayıt varsayılan olarak KAPALI: sadece `pnpm user:create` ile oluşturulan hesaplar girebilir.
 * İleride herkese açmak için .env'de ALLOW_SIGNUP=true yeterli.
 */
export function createAuth(opts: { allowSignUp?: boolean } = {}) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !(opts.allowSignUp ?? process.env.ALLOW_SIGNUP === "true"),
      minPasswordLength: 8,
    },
    session: { expiresIn: 60 * 60 * 24 * 30 }, // 30 gün açık kalsın
    plugins: [nextCookies()],
  });
}

export const auth = createAuth();
