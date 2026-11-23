// Oturum kuralları: veritabanından bağımsız saf yardımcılar (server.ts buradan kullanır, testler buradan import eder).
import type { Question } from "@/lib/content/schema";

/** Günlük oturumun büyüklüğü (spec §5.1). Tek yerde. */
export const DAILY_QUESTIONS = 10;
export const MAX_DUE_QUESTIONS = 6;
export const DAILY_REVIEW_WORDS = 15;

/** review_items satırının seçim için gereken kısmı. */
export type ReviewRow = { itemId: string; dueAt: Date; priority: boolean; reps: number };

/** Zamanı gelenlerin sırası: önce "eminim deyip yanlış", sonra yanlış (reps küçük), sonra en eski. */
function byUrgency(a: ReviewRow, b: ReviewRow): number {
  return Number(b.priority) - Number(a.priority) || a.reps - b.reps || a.dueAt.getTime() - b.dueAt.getTime();
}

/**
 * Günün soruları: en fazla maxDue zamanı gelen, kalanı yeni sorular (içerik sırasıyla); yeni yetmezse zamanı
 * gelenlerle tamamlanır. Seçilemeyen zamanı gelenler sonraki günlere kalır (dueAt geçmiş olduğu için yine aday).
 */
export function pickDailyQuestions(o: { questionIds: string[]; reviews: ReviewRow[]; dueBefore: Date; size: number; maxDue: number }): string[] {
  const visible = new Set(o.questionIds);
  const reviewed = new Set(o.reviews.map((r) => r.itemId));
  const due = o.reviews
    .filter((r) => visible.has(r.itemId) && r.dueAt < o.dueBefore)
    .sort(byUrgency)
    .map((r) => r.itemId);
  const fresh = o.questionIds.filter((id) => !reviewed.has(id));

  const firstDue = due.slice(0, o.maxDue);
  const newOnes = fresh.slice(0, o.size - firstDue.length);
  const moreDue = due.slice(o.maxDue, o.maxDue + (o.size - firstDue.length - newOnes.length));
  return [...firstDue, ...moreDue, ...newOnes];
}

/** Günün tekrar kelimeleri: zamanı gelenler aynı sırayla; anlamı bilinmeyen (known'da olmayan) kelime atlanır. */
export function pickReviewWords(o: { reviews: ReviewRow[]; known: Set<string>; dueBefore: Date; size: number }): string[] {
  return o.reviews
    .filter((r) => o.known.has(r.itemId) && r.dueAt < o.dueBefore)
    .sort(byUrgency)
    .slice(0, o.size)
    .map((r) => r.itemId);
}

/** Görünür sorulardaki kelimeler: kelime ilk görüldüğü sorudaki girdiyle tutulur. */
export function vocabByWord(questions: Question[]): Map<string, Question["vocab"][number]> {
  const m = new Map<string, Question["vocab"][number]>();
  for (const q of questions) for (const v of q.vocab) if (!m.has(v.word)) m.set(v.word, v);
  return m;
}

/** Isınma cevabının SM-2 notu. */
export const WARMUP_GRADE = { correct: 4, wrong: 1 } as const;

/** Pozisyon yalnızca ileri gider ve soru sayısını aşmaz; tekrar gönderim güvenli. */
export function applyAdvance(current: number, requested: number, total: number): { position: number; finished: boolean } {
  const position = Math.min(Math.max(current, requested), total);
  return { position, finished: position >= total };
}
