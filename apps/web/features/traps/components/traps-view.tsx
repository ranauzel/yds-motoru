// Tuzaklarım: düşülen tuzaklar (çoktan aza) ve soluk "henüz düşmediklerin" listesi.
// Rehber metnindeki *vurgu* <em> olarak gösterilir. Satırdaki bağlantı ikincil (çerçeveli).
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { TRAP_NAMES, type TrapCode } from "@/lib/content/schema";
import { TRAP_GUIDE } from "@/lib/content/traps";
import { emphasisParts, type TrapStat } from "../stats";

const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });

function Rich({ text }: { text: string }) {
  return <>{emphasisParts(text).map((p, i) => (p.em ? <em key={i}>{p.text}</em> : <span key={i}>{p.text}</span>))}</>;
}

function PracticeLink({ code }: { code: TrapCode }) {
  return (
    <Link
      href={`/calis?tur=tuzak&kod=${code}`}
      className="mt-3 inline-flex min-h-12 items-center rounded-xl border border-border bg-surface px-4 text-base font-semibold text-text outline-none hover:bg-bg focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      Bu tuzağı çalış<span className="sr-only">: {TRAP_NAMES[code]}</span>
    </Link>
  );
}

export function TrapsView({ stats, untouched }: { stats: TrapStat[]; untouched: TrapCode[] }) {
  return (
    <div>
      {stats.length === 0 ? (
        <div className="mb-6 rounded-[20px] bg-surface p-6 text-center shadow-[0_1px_0_var(--border)]">
          <ShieldCheck className="mx-auto mb-2 size-8 text-ok" aria-hidden="true" />
          <p className="font-semibold">Henüz bir tuzağa düşmedin.</p>
          <p className="mt-1 text-muted">Soru çözdükçe düştüğün tuzaklar burada görünür.</p>
        </div>
      ) : (
        <ul className="mb-8 grid gap-3">
          {stats.map((s) => (
            <li key={s.code} className="rounded-2xl bg-surface p-4 shadow-[0_1px_0_var(--border)]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold">
                  <span className="mr-2 rounded-md bg-warn-soft px-2 py-0.5 text-sm font-extrabold text-warn">{s.code}</span>
                  {TRAP_NAMES[s.code]}
                </h2>
                <span className="shrink-0 rounded-full bg-warn-soft px-3 py-1 text-sm font-semibold text-warn">{s.count} kez</span>
              </div>
              <p className="mt-1 text-sm text-muted">Son: {dateFormat.format(s.lastAt)}</p>
              <p className="mt-3 text-base"><span className="font-semibold">Nasıl düşersin: </span><Rich text={TRAP_GUIDE[s.code].how} /></p>
              <p className="mt-2 text-base"><span className="font-semibold">Nasıl yakalarsın: </span><Rich text={TRAP_GUIDE[s.code].catch} /></p>
              <PracticeLink code={s.code} />
            </li>
          ))}
        </ul>
      )}

      {untouched.length > 0 && (
        <section aria-labelledby="untouched-h">
          <h2 id="untouched-h" className="mb-3 text-lg font-bold text-muted">Henüz düşmediklerin</h2>
          <ul className="grid gap-2">
            {untouched.map((code) => (
              <li key={code} className="rounded-2xl border border-border bg-bg p-4">
                <h3 className="text-base font-semibold text-muted">
                  <span className="mr-2 text-sm font-extrabold">{code}</span>{TRAP_NAMES[code]}
                </h3>
                <p className="mt-1 text-sm text-muted"><Rich text={TRAP_GUIDE[code].how} /></p>
                <PracticeLink code={code} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
