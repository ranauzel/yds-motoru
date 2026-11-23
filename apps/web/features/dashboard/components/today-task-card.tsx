import Link from "next/link";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { openTodaySession } from "@/features/session/actions";
import { WEEKLY_GOAL } from "@/features/session/day";
import type { DashboardData } from "../server";

type Props = Pick<DashboardData, "today" | "plan" | "progress" | "weekDays" | "noQuestions" | "todayCorrect">;

const HERO = "col-span-2 flex items-center gap-4 rounded-[20px] bg-linear-135 from-hero-from to-hero-to p-5 text-white shadow-[0_10px_24px_rgb(109_74_255/0.25)]";
const ACTION =
  "anim-press mt-3 inline-flex min-h-12 items-center gap-1.5 rounded-xl bg-surface px-5 text-base font-bold text-accent outline-none focus-visible:ring-3 focus-visible:ring-white/70";

const R = 32;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** Bugünün ilerleme halkası (todayProgress); bitmişse onay işareti. */
function Ring({ value, done }: { value: number; done: boolean }) {
  const pct = Math.round(value * 100);
  return (
    <div className="relative size-20 shrink-0" role="img" aria-label={done ? "Bugünün oturumu tamam" : `Bugünün ilerlemesi yüzde ${pct}`}>
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={R} fill="none" strokeWidth="8" className="stroke-white/30" />
        <circle
          cx="40" cy="40" r={R} fill="none" strokeWidth="8" strokeLinecap="round" className="anim-ring stroke-white"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - value)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-lg font-extrabold" aria-hidden="true">
        {done ? <Check className="size-8" strokeWidth={3} /> : `%${pct}`}
      </div>
    </div>
  );
}

/** "Günün görevi" kahraman kartı: başlamadı / yarıda / bitti / iş yok (spec §5.3). Tek ana eylem (K1). */
export function TodayTaskCard({ today, plan, progress, weekDays, noQuestions, todayCorrect }: Props) {
  // 3. Bugünün oturumu bitti
  if (today?.finishedAt) {
    const total = today.questionIds.length;
    const wordsKnown = today.reviewWords.filter((w) => today.warmAnswers[w] === true).length;
    const left = Math.max(WEEKLY_GOAL - weekDays, 0);
    const parts = [
      total > 0 && `${todayCorrect ?? 0}/${total} doğru`,
      today.reviewWords.length > 0 && `${wordsKnown}/${today.reviewWords.length} kelime`,
    ].filter(Boolean);
    return (
      <section className={`${HERO} anim-fade`} aria-labelledby="gunun-gorevi">
        <Ring value={1} done />
        <div className="min-w-0">
          <h2 id="gunun-gorevi" className="text-lg font-bold">Bugün tamam</h2>
          {parts.length > 0 && <p className="text-sm">{parts.join(" · ")}</p>}
          <p className="mt-1 text-sm">
            Yarın yeni oturum açılacak. {left > 0 ? `Haftalık hedefe ${left} gün kaldı.` : "Bu haftanın hedefine ulaştın."}
          </p>
          <Link href={`/oturum/${today.id}`} className={ACTION}>
            Gözden geçir <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  // 2. Bugünün oturumu yarıda
  if (today) {
    const total = today.questionIds.length;
    const label = total > 0 ? `Devam et (${today.position}/${total})` : "Devam et (kelime tekrarı)";
    return (
      <section className={`${HERO} anim-fade`} aria-labelledby="gunun-gorevi">
        <Ring value={progress} done={false} />
        <div className="min-w-0">
          <h2 id="gunun-gorevi" className="text-lg font-bold">Günün görevi</h2>
          <p className="text-sm">Kaldığın yerden devam edebilirsin.</p>
          <Link href={`/oturum/${today.id}`} className={ACTION}>
            {label} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  if (noQuestions || !plan)
    return (
      <section className={HERO} aria-labelledby="gunun-gorevi">
        <div className="min-w-0">
          <h2 id="gunun-gorevi" className="text-lg font-bold">Henüz soru yok</h2>
          <p className="mt-1 text-sm">
            Soruları aktarmak için <code>apps/web</code> içinde <code>pnpm content:import</code> çalıştır.
          </p>
        </div>
      </section>
    );

  // 4. Bugün iş yok
  if (!plan.questionIds.length && !plan.reviewWords.length)
    return (
      <section className={`${HERO} anim-fade`} aria-labelledby="gunun-gorevi">
        <div className="grid size-20 shrink-0 place-items-center rounded-full bg-white/20" aria-hidden="true">
          <Leaf className="size-9" />
        </div>
        <div className="min-w-0">
          <h2 id="gunun-gorevi" className="text-lg font-bold">Bugün için tekrar ya da yeni soru yok</h2>
          <p className="mt-1 text-sm">
            Bütün soruları çözdün, tekrarların henüz zamanı gelmedi. Yeni sorular eklendiğinde burada görünecek.
          </p>
        </div>
      </section>
    );

  // 1. Bugün henüz başlanmadı (oturum Başla'ya basılınca oluşur)
  const newCount = plan.questionIds.length - plan.dueCount;
  const summary = [
    plan.reviewWords.length > 0 && `${plan.reviewWords.length} kelime`,
    plan.questionIds.length > 0 && `${plan.questionIds.length} soru`,
    "~25 dk",
  ].filter(Boolean).join(" · ");
  const detail = [plan.dueCount > 0 && `${plan.dueCount} tekrar`, newCount > 0 && `${newCount} yeni soru`].filter(Boolean).join(" · ");
  return (
    <section className={`${HERO} anim-fade`} aria-labelledby="gunun-gorevi">
      <Ring value={0} done={false} />
      <div className="min-w-0">
        <h2 id="gunun-gorevi" className="text-lg font-bold">Günün görevi</h2>
        <p className="text-sm">{summary}</p>
        {detail && <p className="text-sm">{detail}</p>}
        <form action={openTodaySession}>
          <button type="submit" className={ACTION}>
            Başla <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}
