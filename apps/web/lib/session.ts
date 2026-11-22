import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Sunucu tarafında oturumu doğrular; yoksa giriş sayfasına yönlendirir.
 * İstek verisi okur: çağıran bileşen <Suspense> içinde olmalı. cache() ile istek başına tek sorgu.
 */
export const requireUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/giris");
  return session.user;
});
