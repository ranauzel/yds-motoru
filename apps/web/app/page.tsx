import Link from "next/link";
import { Suspense } from "react";
import { startSession } from "@/features/session/actions";
import { latestUnfinishedSession } from "@/features/session/server";
import { getAllQuestions } from "@/lib/content/repo";
import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

// Statik kabuk anında gelir; oturum ve içerik okuyan kısımlar <Suspense> arkasında akar
// (cacheComponents açıkken istek verisi sınır dışında okunamaz).
export default function TodayPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Suspense fallback={<p className="text-sm text-muted">&nbsp;</p>}>
            <Greeting />
          </Suspense>
          <h1 className="text-2xl font-bold">Bugün</h1>
        </div>
        <SignOutButton />
      </header>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Bugünün oturumu</h2>
        <Suspense fallback={<p className="mt-3 text-sm text-muted">Yükleniyor…</p>}>
          <SessionSummary />
        </Suspense>
      </section>
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();
  return <p className="text-sm text-muted">Merhaba {user.name}</p>;
}

async function SessionSummary() {
  const user = await requireUser();
  const [questions, open] = await Promise.all([getAllQuestions(), latestUnfinishedSession(user.id)]);
  if (!questions.length)
    return (
      <p className="mt-3 text-sm text-muted">
        Henüz soru yok. Soruları aktarmak için <code>apps/web</code> içinde <code>pnpm content:import</code> çalıştır.
      </p>
    );
  const warmupWords = new Set(questions.flatMap((q) => q.vocab.filter((v) => v.warmup).map((v) => v.word)));
  const primary = "flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 font-semibold text-white";
  return (
    <>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        <li>• {warmupWords.size} kelimelik ısınma havuzu</li>
        <li>• {questions.length} soru hazır</li>
      </ul>
      <div className="mt-6">
        {open ? (
          <>
            <Link href={`/oturum/${open.id}`} className={primary}>
              Oturumuna devam et ({open.position}/{open.total})
            </Link>
            <form action={startSession} className="mt-2 text-center">
              <button type="submit" className="min-h-12 px-4 text-sm text-muted underline">Yeni oturum başlat</button>
            </form>
          </>
        ) : (
          <form action={startSession}>
            <button type="submit" className={primary}>Başla</button>
          </form>
        )}
      </div>
    </>
  );
}
