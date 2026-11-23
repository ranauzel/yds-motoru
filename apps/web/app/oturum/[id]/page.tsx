import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { recreateTodaySession } from "@/features/session/actions";
import { PracticeSession } from "@/features/session/components/practice-session";
import { loadSnapshot } from "@/features/session/server";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Oturum · YDS Motoru" };

// Odak modu: menü yok. Oturum verisi istek anında okunur, bu yüzden <Suspense> içinde.
export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-[680px] flex-1 px-4 pt-2 pb-32">
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted">Yükleniyor…</p>}>
        <Session params={params} />
      </Suspense>
    </main>
  );
}

async function Session({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const res = await loadSnapshot(user.id, id);
  if (!res.ok && res.reason === "not_found") notFound();
  if (!res.ok)
    return (
      <div className="py-10 text-center">
        <p>Bu oturumun bazı soruları artık mevcut değil.</p>
        {res.recreatable ? (
          <form action={recreateTodaySession.bind(null, id)} className="mt-6">
            <button type="submit" className="min-h-12 rounded-xl bg-accent px-6 font-semibold text-white">Bugünün oturumunu yeniden oluştur</button>
          </form>
        ) : (
          <Link href="/" className="mt-6 inline-block min-h-12 rounded-xl bg-accent px-6 font-semibold leading-[48px] text-white">Ana sayfaya dön</Link>
        )}
      </div>
    );
  return <PracticeSession snapshot={res.snapshot} />;
}
