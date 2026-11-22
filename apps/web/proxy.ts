// Giriş yapılmamışsa /giris sayfasına yönlendirir.
// Not: Bu sadece hızlı bir çerez kontrolüdür. Asıl oturum doğrulaması sayfalarda/sunucu
// işlemlerinde auth.api.getSession ile yapılır.
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/giris", request.url);
    url.searchParams.set("sonra", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // giriş sayfası, auth API'si ve statik dosyalar hariç her şey korunur
  matcher: ["/((?!giris|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webmanifest)$).*)"],
};
