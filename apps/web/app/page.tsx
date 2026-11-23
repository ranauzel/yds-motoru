import { Suspense } from "react";
import { dashboardData } from "@/features/dashboard/server";
import { DayCalendar } from "@/features/dashboard/components/day-calendar";
import { ExamCountdownCard } from "@/features/dashboard/components/exam-countdown-card";
import { TipCard } from "@/features/dashboard/components/tip-card";
import { TodayTaskCard } from "@/features/dashboard/components/today-task-card";
import { TrapsCard } from "@/features/dashboard/components/traps-card";
import { WeekGoalCard } from "@/features/dashboard/components/week-goal-card";
import { WordsCard } from "@/features/dashboard/components/words-card";
import { TILE } from "@/features/dashboard/components/tile";
import { SoundToggle } from "@/features/ui/sound-toggle";
import { requireUser } from "@/lib/session";
import { guestEnabled } from "@/lib/guest";
import { DemoNote } from "./giris/login-screen";
import { SignOutButton } from "./sign-out-button";

const GRID = "grid grid-cols-2 gap-3 lg:grid-cols-4";

// Statik kabuk anında gelir; oturum ve içerik okuyan kısımlar <Suspense> arkasında akar
// (cacheComponents açıkken istek verisi sınır dışında okunamaz).
export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-12">
      <header className="mb-6 flex items-center gap-2">
        <div className="mr-auto">
          <Suspense fallback={<p className="text-sm text-muted">&nbsp;</p>}>
            <Greeting />
          </Suspense>
          <h1 className="text-2xl font-extrabold tracking-tight">Bugün</h1>
        </div>
        <SoundToggle />
        <SignOutButton />
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
      {guestEnabled() && <DemoNote />}
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();
  return <p className="text-sm font-semibold text-muted">Merhaba {user.name}</p>;
}

/** Pano: mobilde 2, lg ve üstünde 4 sütun; kahraman kart, takvim ve ipucu 2 sütun (spec §5.3). */
async function Dashboard() {
  const user = await requireUser();
  const d = await dashboardData(user.id, new Date());
  return (
    <div className={GRID}>
      <TodayTaskCard
        today={d.today} plan={d.plan} progress={d.progress} weekDays={d.weekDays}
        noQuestions={d.noQuestions} todayCorrect={d.todayCorrect}
      />
      <ExamCountdownCard examDate={d.examDate} daysLeft={d.daysLeft} />
      <WeekGoalCard weekDays={d.weekDays} />
      <WordsCard learned={d.words.learned} reviewing={d.words.reviewing} />
      <TrapsCard topTrap={d.topTrap} />
      <DayCalendar weeks={d.calendar} />
      {d.tip && <TipCard tip={d.tip} />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className={GRID} aria-busy="true">
      <div className="col-span-2 h-36 rounded-[20px] bg-accent-soft" />
      <div className={`${TILE} h-36`} />
      <div className={`${TILE} h-36`} />
      <p className="sr-only">Yükleniyor…</p>
    </div>
  );
}
