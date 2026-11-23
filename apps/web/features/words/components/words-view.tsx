"use client";
// Kelimeler sayfası: üç sayı, sekmeler, arama ve liste. Tek birincil eylem "Kelime çalış".
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dueLabel, type WordRow, type WordStatus } from "../stats";

type Counts = Record<WordStatus, number>;
const TABS: { status: WordStatus; label: string; empty: string }[] = [
  { status: "reviewing", label: "Tekrarda", empty: "Tekrarda kelime yok. Çalıştıkça burada görünür." },
  { status: "learned", label: "Öğrenildi", empty: "Henüz öğrenilen kelime yok. Düzenli tekrarla buraya gelir." },
  { status: "new", label: "Yeni", empty: "Yeni kelime kalmadı. Harika gidiyorsun." },
];

export function WordsView({ rows, counts, now }: { rows: WordRow[]; counts: Counts; now: string }) {
  const [tab, setTab] = useState<WordStatus>("reviewing");
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("tr");
  const nowDate = new Date(now);

  return (
    <div>
      <dl className="mb-4 grid grid-cols-3 gap-3 text-center">
        {([["learned", "Öğrenildi"], ["reviewing", "Tekrarda"], ["new", "Yeni"]] as const).map(([s, label]) => (
          <div key={s} className="rounded-[20px] bg-surface p-3 shadow-[0_1px_0_var(--border)]">
            <dd className="text-2xl font-extrabold">{counts[s]}</dd>
            <dt className="text-sm text-muted">{label}</dt>
          </div>
        ))}
      </dl>

      <Link
        href={`/calis?tur=kelime&sekme=${tab}`}
        className="mb-4 flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Kelime çalış
      </Link>

      <label className="relative mb-4 block">
        <span className="sr-only">Kelime ara</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kelime ara"
          className="min-h-12 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-base text-text outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <Tabs value={tab} onValueChange={(v) => setTab(v as WordStatus)}>
        <TabsList className="mb-3 !h-12 w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.status} value={t.status} className="min-h-12 text-base text-text">
              {t.label} ({counts[t.status]})
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => {
          const list = rows.filter((w) => w.status === t.status && (!q || `${w.word} ${w.tr}`.toLocaleLowerCase("tr").includes(q)));
          return (
            <TabsContent key={t.status} value={t.status}>
              {list.length === 0 ? (
                <p className="py-8 text-center text-muted">{q ? "Eşleşen kelime yok." : t.empty}</p>
              ) : (
                <ul className="grid gap-2">
                  {list.map((w) => (
                    <li key={w.word} className="rounded-2xl bg-surface p-4 shadow-[0_1px_0_var(--border)]">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-serif text-lg font-semibold">{w.word}</span>
                        {t.status === "reviewing" && w.dueAt && (
                          <span className="shrink-0 text-sm text-muted">{dueLabel(w.dueAt, nowDate)}</span>
                        )}
                      </div>
                      <p className="text-base">{w.tr}</p>
                      {w.context && <p className="mt-1 font-serif text-sm text-muted">{w.context}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
