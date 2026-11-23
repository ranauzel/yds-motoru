import { Suspense } from "react";
import Link from "next/link";
import { PracticeSession } from "@/features/session/components/practice-session";
import { practiceSnapshot } from "@/features/practice/server";
import { parsePracticeParams, type PracticeParams } from "@/features/practice/snapshot";
import { requireUser } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = { title: "Serbest çalışma · YDS Motoru" };

// Odak modu: menü yok. Parametreler ve veri istek anında okunur, bu yüzden <Suspense> içinde (cacheComponents).
export default function PracticePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-[680px] flex-1 px-4 pt-2 pb-32">
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted" aria-busy="true">Yükleniyor…</p>}>
        <Practice searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Practice({ searchParams }: { searchParams: SearchParams }) {
  const [sp, user] = await Promise.all([searchParams, requireUser()]);
  const params = parsePracticeParams(sp);
  const snapshot = params && (await practiceSnapshot(user.id, params, new Date()));
  if (!snapshot) return <Nothing params={params} />;
  return <PracticeSession snapshot={snapshot} mode="practice" />;
}

/** Seçilecek bir şey yoksa (ya da adres geçersizse) kısa mesaj ve geri bağlantısı. */
function Nothing({ params }: { params: PracticeParams | null }) {
  const back = params?.tur === "kelime" ? { href: "/kelimeler", label: "Kelimelere dön", what: "kelime" }
    : params?.tur === "tuzak" ? { href: "/tuzaklar", label: "Tuzaklarıma dön", what: "soru" }
    : { href: "/", label: "Panoya dön", what: "kelime ya da soru" };
  return (
    <div className="py-10 text-center">
      <p>Şu an çalışılacak {back.what} yok.</p>
      {params?.tur === "kelime" && <p className="mt-2 text-sm text-muted">Bugün sırası gelen kelimeler günün oturumunda sorulacak.</p>}
      <Link href={back.href} className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {back.label}
      </Link>
    </div>
  );
}
