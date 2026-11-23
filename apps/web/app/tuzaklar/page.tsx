import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TrapsView } from "@/features/traps/components/traps-view";
import { trapsPageData } from "@/features/traps/server";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Tuzaklarım · YDS Motoru" };

// Oturum ve içerik okuyan kısım <Suspense> arkasında (cacheComponents).
export default function TrapsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-12">
      <Link href="/" className="-ml-2 inline-flex min-h-12 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-muted outline-none hover:text-text focus-visible:ring-3 focus-visible:ring-ring/50">
        <ArrowLeft className="size-4" aria-hidden="true" /> Bugün
      </Link>
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight">Tuzaklarım</h1>
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted" aria-busy="true">Yükleniyor…</p>}>
        <Traps />
      </Suspense>
    </main>
  );
}

async function Traps() {
  const user = await requireUser();
  const data = await trapsPageData(user.id);
  return <TrapsView stats={data.stats} untouched={data.untouched} />;
}
