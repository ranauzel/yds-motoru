// Sınav tarihi doğrulaması: saf, testli.

export type ExamDateResult = { ok: true; date: string | null } | { ok: false };

const FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/** null kabul; aksi halde bugünden önce olmayan, gerçek bir "YYYY-MM-DD" takvim günü olmalı. */
export function parseExamDate(input: unknown, today: string): ExamDateResult {
  if (input === null) return { ok: true, date: null };
  if (typeof input !== "string" || !FORMAT.test(input)) return { ok: false };
  const parsed = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== input) return { ok: false }; // 2027-02-30 gibi
  if (input < today) return { ok: false };
  return { ok: true, date: input };
}
