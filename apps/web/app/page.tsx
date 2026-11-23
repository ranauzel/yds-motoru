import Link from "next/link";
import { Suspense } from "react";
import { openTodaySession } from "@/features/session/actions";
import { CheckMark, WeekDots, WeekRing } from "@/features/session/components/progress";
import { BottomBar, Button, ProgressBar } from "@/features/session/components/ui";
import { todayKey, WEEKLY_GOAL, weekIndexes } from "@/features/session/day";
import { correctCount, finishedDays, getTodaySession, planToday } from "@/features/session/server";
import { getAllQuestions } from "@/lib/content/repo";
import { requireUser } from "@/lib/session";
import { guestEnabled } from "@/lib/guest";
import { DemoNote } from "./giris/login-screen";
import { SignOutButton } from "./sign-out-button";

// Statik kabuk anında gelir; oturum ve içerik okuyan kısımlar <Suspense> arkasında akar
// (cacheComponents açıkken istek verisi sınır dışında okunamaz).
export default function TodayPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-8 pb-32">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Suspense fallback={<p className="text-sm text-muted">&nbsp;</p>}>
            <Greeting />
          </Suspense>
          <h1 className="text-2xl font-bold">Bugün</h1>
        </div>
        <SignOutButton />
      </header>

      <Suspense fallback={<section className={CARD}><p className="text-sm text-muted">Yükleniyor…</p></section>}>
        <TodayCard />
      </Suspense>
      {guestEnabled() && <DemoNote />}
    </main>
  );
}

const CARD = "rounded-2xl border border-border bg-surface p-6";

async function Greeting() {
  const user = await requireUser();
  return <p className="text-sm text-muted">Merhaba {user.name}</p>;
}

/** "Bugünün oturumu" kartı: başlamadı / yarıda / bitti / iş yok (spec §5.6). Her durumda en fazla tek ana eylem (ARAYUZ K1). */
async function TodayCard() {
  const user = await requireUser();
  const now = new Date();
  const day = todayKey(now);
  const [today, doneDays] = await Promise.all([getTodaySession(user.id, day), finishedDays(user.id)]);
  const week = weekIndexes(doneDays, day);

  // 3. Bugünün oturumu bitti
  if (today?.finishedAt) {
    const right = await correctCount(user.id, today.id);
    const total = today.questionIds.length;
    const wordsKnown = today.reviewWords.filter((w) => today.warmAnswers[w] === true).length;
    const left = Math.max(WEEKLY_GOAL - week.done.length, 0);
    return (
      <>
        <section className={`${CARD} text-center`}>
          <CheckMark />
          <h2 className="mt-3 text-lg font-bold">Bugünün oturumu tamam</h2>
          <p className="anim-fade mt-1.5">
            {total > 0 && <><b>{right} / {total}</b> doğru</>}
            {total > 0 && today.reviewWords.length > 0 && " · "}
            {today.reviewWords.length > 0 && <>{wordsKnown}/{today.reviewWords.length} kelime</>}
          </p>
          <div className="mt-4 flex justify-center"><WeekRing done={week.done.length} /></div>
          <WeekDots doneIndexes={week.done} todayIndex={week.today} />
          <p className="mt-3 text-sm text-muted">
            Yarın yeni oturum açılacak. {left > 0 ? `Haftalık hedefe ${left} gün kaldı.` : "Bu haftanın hedefine ulaştın."}
          </p>
        </section>
        <Link href={`/oturum/${today.id}`} className="block min-h-12 text-center text-sm leading-[48px] text-muted underline">
          Bugünün oturumunu gözden geçir
        </Link>
      </>
    );
  }

  // 2. Bugünün oturumu yarıda
  if (today) {
    const total = today.questionIds.length;
    const label = total > 0 ? `Devam et (${today.position}/${total})` : "Devam et (kelime tekrarı)";
    return (
      <>
        <section className={`${CARD} anim-fade`}>
          <h2 className="font-semibold">Bugünün oturumu</h2>
          {total > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={today.position / total} />
              <span className="text-sm text-muted">{today.position} / {total}</span>
            </div>
          )}
          <p className="mt-2.5 text-sm text-muted">Kaldığın yerden devam edebilirsin.</p>
        </section>
        <BottomBar>
          <Link href={`/oturum/${today.id}`} className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-white">
            {label}
          </Link>
        </BottomBar>
      </>
    );
  }

  const [plan, questions] = await Promise.all([planToday(user.id, now), getAllQuestions(user.id)]);

  if (!questions.length)
    return (
      <section className={CARD}>
        <p className="text-sm text-muted">
          Henüz soru yok. Soruları aktarmak için <code>apps/web</code> içinde <code>pnpm content:import</code> çalıştır.
        </p>
      </section>
    );

  // 4. Bugün iş yok
  if (!plan.questionIds.length && !plan.reviewWords.length)
    return (
      <section className={`${CARD} anim-fade text-center`}>
        <div className="text-4xl" aria-hidden="true">🌿</div>
        <h2 className="mt-2 font-bold">Bugün için tekrar ya da yeni soru yok</h2>
        <p className="mt-2 text-sm text-muted">
          Bütün soruları çözdün ve tekrarların henüz zamanı gelmedi. Yeni sınav soruları eklendiğinde burada görünecek.
        </p>
      </section>
    );

  // 1. Bugün henüz başlanmadı (oturum Başla'ya basılınca oluşur)
  const newCount = plan.questionIds.length - plan.dueCount;
  return (
    <>
      <section className={`${CARD} anim-fade`}>
        <div className="flex items-center">
          <h2 className="font-semibold">Bugünün oturumu</h2>
          <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">~25 dk</span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {plan.reviewWords.length > 0 && <Bullet>{plan.reviewWords.length} kelime tekrarı</Bullet>}
          {plan.questionIds.length > 0 && (
            <Bullet>
              {[plan.dueCount && `${plan.dueCount} tekrar sorusu`, newCount && `${newCount} yeni soru`].filter(Boolean).join(" · ")}
            </Bullet>
          )}
        </ul>
        <p className="mt-3 text-sm text-muted">Bu hafta {week.done.length}/{WEEKLY_GOAL} gün çalıştın.</p>
      </section>
      <BottomBar>
        <form action={openTodaySession} className="flex flex-1">
          <Button primary type="submit" className="anim-press">Başla</Button>
        </form>
      </BottomBar>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </li>
  );
}
