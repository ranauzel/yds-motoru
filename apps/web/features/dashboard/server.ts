// Pano verisi: günün oturumu, haftalık hedef, gün takvimi, sınav geri sayımı, kelime/tuzak/ipucu kartları.
// Sadece sunucu bileşenleri kullanır. Hesaplar saf fonksiyonlarda (stats.ts), burada yalnızca sorgu ve birleştirme var.
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { getAllQuestions } from "@/lib/content/repo";
import { attemptRows, reviewRows } from "@/features/progress/server";
import { db, schema } from "@/lib/db";
import { addDays, todayKey, weekDaysDone, weekdayIndex } from "@/features/session/day";
import { vocabByWord } from "@/features/session/rules";
import { finishedDays, getTodaySession, planToday, type PracticeSessionRow } from "@/features/session/server";
import { trapStats, type TrapStat } from "@/features/traps/stats";
import { classifyWords } from "@/features/words/stats";
import { calendarWindow, daysUntil, tipOfDay, todayProgress, type DayCell, type DaySummary } from "./stats";

const { practiceSessions, user } = schema;

export type DashboardData = {
  today: PracticeSessionRow | null;
  /** Yalnızca bugünün satırı yoksa hesaplanır (günlük oturumdaki gibi). */
  plan: Awaited<ReturnType<typeof planToday>> | null;
  progress: number;
  weekDays: number;
  calendar: DayCell[][];
  examDate: string | null;
  daysLeft: number | null;
  words: { learned: number; reviewing: number };
  topTrap: TrapStat | null;
  tip: string | null;
  /** Kullanıcıya görünen soru yok ("pnpm content:import" mesajı). */
  noQuestions: boolean;
  /** Bitmiş bugünkü oturumda doğru sayısı; bitmemişse null. */
  todayCorrect: number | null;
};

export async function dashboardData(userId: string, now: Date): Promise<DashboardData> {
  const day = todayKey(now);
  const windowStart = addDays(day, -weekdayIndex(day) - 28); // calendarWindow'un ilk Pazartesi'si (bu hafta + 4 hafta öncesi)

  const [today, doneDays, questions, [profile], sessions, userAttempts, wordReviews] = await Promise.all([
    getTodaySession(userId, day),
    finishedDays(userId),
    getAllQuestions(userId),
    db.select({ examDate: user.examDate }).from(user).where(eq(user.id, userId)).limit(1),
    db.select().from(practiceSessions).where(and(
      eq(practiceSessions.userId, userId), isNotNull(practiceSessions.day), gte(practiceSessions.day, windowStart),
    )),
    attemptRows(userId),
    reviewRows(userId, "word"),
  ]);

  const plan = today ? null : await planToday(userId, now);

  const correctBySession = new Map<string, number>();
  for (const a of userAttempts)
    if (a.correct && a.sessionId) correctBySession.set(a.sessionId, (correctBySession.get(a.sessionId) ?? 0) + 1);

  const days: DaySummary[] = sessions.map((s) => ({
    day: s.day!,
    finished: !!s.finishedAt,
    correct: correctBySession.get(s.id) ?? 0,
    total: s.questionIds.length,
    wordsKnown: s.reviewWords.filter((w) => s.warmAnswers[w] === true).length,
    wordsTotal: s.reviewWords.length,
  }));

  const examDate = profile?.examDate ?? null;
  const byId = new Map(questions.map((q) => [q.id, q]));
  const words = classifyWords(vocabByWord(questions), wordReviews);
  const wrongIds = new Set(userAttempts.filter((a) => !a.correct).map((a) => a.questionId));

  return {
    today,
    plan,
    progress: todayProgress(today),
    weekDays: weekDaysDone(doneDays, day),
    calendar: calendarWindow({ today: day, days, examDate }),
    examDate,
    daysLeft: examDate ? daysUntil(examDate, day) : null,
    words: {
      learned: words.filter((w) => w.status === "learned").length,
      reviewing: words.filter((w) => w.status === "reviewing").length,
    },
    topTrap: trapStats(userAttempts, byId)[0] ?? null,
    tip: tipOfDay({
      wrongRules: [...new Set(questions.filter((q) => wrongIds.has(q.id)).map((q) => q.golden_rule))],
      allRules: [...new Set(questions.map((q) => q.golden_rule))],
      today: day,
    }),
    noQuestions: questions.length === 0,
    todayCorrect: today?.finishedAt ? (correctBySession.get(today.id) ?? 0) : null,
  };
}
