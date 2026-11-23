// Gün hesabı: günlük oturumun sınırı Türkiye saatiyle 00:00 (sunucu UTC'de çalışır). Saf fonksiyonlar, testli.

const TZ = "Europe/Istanbul";
const ISTANBUL_OFFSET = "+03:00"; // Türkiye 2016'dan beri sabit UTC+3 (yaz saati yok)
const DAY_MS = 24 * 60 * 60 * 1000;

const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Bugünün İstanbul'a göre gün anahtarı: "YYYY-MM-DD". */
export function todayKey(now: Date): string {
  return keyFormat.format(now);
}

/** "YYYY-MM-DD" gününe n gün ekler (takvim hesabı, saat dilimi yok). */
function addDays(key: string, n: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** İstanbul'da ertesi günün 00:00 anı. "Bugün zamanı gelen" = dueAt < dayEnd(now). */
export function dayEnd(now: Date): Date {
  return new Date(`${addDays(todayKey(now), 1)}T00:00:00${ISTANBUL_OFFSET}`);
}

/** Affedici seri (TASARIM §8): haftada 5 gün hedefi; kaçırılan gün hiçbir şeyi sıfırlamaz. */
export const WEEKLY_GOAL = 5;

/** today'in içinde bulunduğu Pazartesi–Pazar haftasında oturumu bitirilmiş farklı gün sayısı. */
export function weekDaysDone(finishedDays: string[], today: string): number {
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Pazartesi = 0
  const monday = addDays(today, -weekday);
  const sunday = addDays(monday, 6);
  return new Set(finishedDays.filter((d) => d >= monday && d <= sunday)).size;
}
