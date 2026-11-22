"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";

function LoginForm({ guest }: { guest: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function goNext() {
    const next = params.get("sonra");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  async function onGuest() {
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.anonymous();
    setPending(false);
    if (error) return setError(error.message ?? "Misafir girişi yapılamadı.");
    goNext();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      rememberMe: true,
    });
    setPending(false);
    if (error) {
      setError(error.status === 401 ? "E-posta ya da şifre hatalı." : error.message ?? "Giriş yapılamadı.");
      return;
    }
    goNext();
  }

  return (
    <div className="w-full max-w-sm space-y-4">
    {guest && (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold">YDS Motoru</h1>
        <p className="mt-1 mb-4 text-sm text-muted">
          Kelime ısınması, tuzak analizi ve aralıklı tekrarla YDS cümle tamamlama çalışması. Kayıt gerekmez.
        </p>
        <button type="button" onClick={onGuest} disabled={pending}
          className="min-h-12 w-full rounded-xl bg-accent font-semibold text-white disabled:opacity-50">
          {pending ? "Hazırlanıyor…" : "Misafir olarak dene"}
        </button>
        <DemoNote />
      </section>
    )}
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
      {guest ? (
        <h2 className="mb-6 font-semibold">Hesabın varsa giriş yap</h2>
      ) : (
        <>
          <h1 className="text-2xl font-bold">YDS Motoru</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Devam etmek için giriş yap.</p>
        </>
      )}

      <label className="block text-sm font-medium" htmlFor="email">E-posta</label>
      <input id="email" name="email" type="email" required autoComplete="email"
        className="mt-1 mb-4 w-full rounded-xl border border-border bg-bg px-3 py-3 outline-none focus:border-accent" />

      <label className="block text-sm font-medium" htmlFor="password">Şifre</label>
      <input id="password" name="password" type="password" required autoComplete="current-password" minLength={8}
        className="mt-1 mb-4 w-full rounded-xl border border-border bg-bg px-3 py-3 outline-none focus:border-accent" />

      {error && <p role="alert" className="mb-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>}

      <button type="submit" disabled={pending}
        className="min-h-12 w-full rounded-xl bg-accent font-semibold text-white disabled:opacity-50">
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
    </div>
  );
}

export function DemoNote() {
  return (
    <p className="mt-4 text-xs text-muted">
      Bu demodaki sorular örnektir, ÖSYM sorusu değildir. Misafir hesapları 7 gün sonra silinir.
      Kendi sorularınla kullanmak için{" "}
      <Link className="underline" href="https://github.com/ranauzel/yds-motoru#readme">README</Link>&apos;yi okuyup kurabilirsin.
    </p>
  );
}

export function LoginScreen({ guest }: { guest: boolean }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm guest={guest} />
      </Suspense>
    </main>
  );
}
