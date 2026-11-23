// Pano hesapları: ısı haritası penceresi, geri sayım, günün ipucu, bugünün ilerlemesi. Saf fonksiyonlar, testli.
import { addDays, weekdayIndex } from "@/features/session/day";

export type DaySummary = { day: string; finished: boolean; correct: number; total: number; wordsKnown: number; wordsTotal: number };

/** Gün yoğunluğu: 0 oturum yok, 1 bitmemiş, 2 bitmiş (<%80), 3 bitmiş (≥%80). */
export function dayLevel(s: DaySummary | undefined): 0 | 1 | 2 | 3 {
  if (!s) return 0;
  if (!s.finished) return 1;
  // Soru varsa soru oranı, yoksa (kelime günü) kelime oranı
  const [num, den] = s.total > 0 ? [s.correct, s.total] : [s.wordsKnown, s.wordsTotal];
  const ratio = den > 0 ? num / den : 0;
  return ratio >= 0.8 ? 3 : 2;
}

export type DayCell = { day: string; level: 0 | 1 | 2 | 3; locked: boolean; today: boolean; exam: boolean };

const WEEKS = 9;
const WEEKS_BEFORE = 4;

/** 9 haftalık Pazartesi–Pazar penceresi; bu haftadan 4 hafta öncesinin Pazartesi'sinden başlar. */
export function calendarWindow(o: { today: string; days: DaySummary[]; examDate: string | null }): DayCell[][] {
  const byDay = new Map(o.days.map((d) => [d.day, d]));
  const start = addDays(o.today, -weekdayIndex(o.today) - WEEKS_BEFORE * 7);
  return Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, w * 7 + i);
      const locked = day > o.today;
      return { day, level: locked ? 0 : dayLevel(byDay.get(day)), locked, today: day === o.today, exam: day === o.examDate };
    }),
  );
}

/** İki gün anahtarı arasındaki takvim günü farkı; geçmiş tarihte negatif. */
export function daysUntil(examDate: string, today: string): number {
  return Math.round((Date.parse(`${examDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** Günün ipucu: yanlış yapılan kurallardan, yoksa tüm kurallardan; gün anahtarından deterministik seçim. */
export function tipOfDay(o: { wrongRules: string[]; allRules: string[]; today: string }): string | null {
  const source = o.wrongRules.length > 0 ? o.wrongRules : o.allRules;
  if (source.length === 0) return null;
  const sum = [...o.today].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return source[sum % source.length];
}

/** Bugünün oturum ilerlemesi 0–1: (konum + cevaplanmış tekrar kelimesi) / (soru + tekrar kelimesi). */
export function todayProgress(
  row: { questionIds: string[]; position: number; reviewWords: string[]; warmAnswers: Record<string, boolean>; finishedAt: Date | null } | null,
): number {
  if (!row) return 0;
  if (row.finishedAt) return 1;
  const total = row.questionIds.length + row.reviewWords.length;
  if (total === 0) return 0;
  const answered = row.reviewWords.filter((w) => w in row.warmAnswers).length;
  return (row.position + answered) / total;
}
