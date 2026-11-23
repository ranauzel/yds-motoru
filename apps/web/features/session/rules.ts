// Oturum kuralları: veritabanından bağımsız saf yardımcılar (server.ts buradan kullanır, testler buradan import eder).
import type { Question } from "@/lib/content/schema";
import { gradeAnswer, review, type ReviewState } from "@/lib/domain/sm2";

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
export function pickDailyQuestions(o: {
  questionIds: string[]; reviews: ReviewRow[]; dueBefore: Date; size: number; maxDue: number;
  /** Emekli sorular (bkz. retiredQuestions): hiç seçilmez. */
  retired: Set<string>;
  /** Yanlış yapılan konulardan yeni sorular öne alınır (sıra korunur). */
  boost?: { topicKey: Map<string, string>; keys: Set<string> };
}): string[] {
  const visible = new Set(o.questionIds.filter((id) => !o.retired.has(id)));
  const reviewed = new Set(o.reviews.map((r) => r.itemId));
  const due = o.reviews
    .filter((r) => visible.has(r.itemId) && r.dueAt < o.dueBefore)
    .sort(byUrgency)
    .map((r) => r.itemId);
  let fresh = o.questionIds.filter((id) => visible.has(id) && !reviewed.has(id));
  if (o.boost) {
    const { topicKey, keys } = o.boost;
    const boosted = (id: string) => keys.has(topicKey.get(id) ?? "");
    fresh = [...fresh.filter(boosted), ...fresh.filter((id) => !boosted(id))];
  }

  const firstDue = due.slice(0, o.maxDue);
  const newOnes = fresh.slice(0, o.size - firstDue.length);
  const moreDue = due.slice(o.maxDue, o.maxDue + (o.size - firstDue.length - newOnes.length));
  return [...firstDue, ...moreDue, ...newOnes];
}

/** "Doğru ama temiz değil" cevaptan sonra sorunun bir kez daha geleceği gün sayısı (spec §5). */
export const CHECK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Günlük oturumdaki bir cevap (attempts satırının kural için gereken kısmı). sessionId null ise günlük değildir. */
export type DailyAttempt = {
  sessionId: string | null; questionId: string; correct: boolean; sure: boolean; glossUsed: boolean; hintUsed: boolean; createdAt: Date;
};
type Answer = Pick<DailyAttempt, "correct" | "sure" | "glossUsed" | "hintUsed">;

/** Temiz doğru: eminim dendi, çeviri ve ipucu açılmadı. Kelimeler (K) yardım sayılmaz. */
export function isClean(a: Answer): boolean {
  return a.correct && a.sure && !a.glossUsed && !a.hintUsed;
}

/** Soru başına günlük cevaplar, createdAt sırasıyla. */
function dailyHistory(attempts: DailyAttempt[]): Map<string, DailyAttempt[]> {
  const m = new Map<string, DailyAttempt[]>();
  for (const a of attempts) if (a.sessionId !== null) m.set(a.questionId, [...(m.get(a.questionId) ?? []), a]);
  for (const list of m.values()) list.sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime());
  return m;
}

/** Emekli sorular: son günlük cevap doğru ve (temiz ya da bir önceki de doğru). Günlük oturuma bir daha gelmez. */
export function retiredQuestions(attempts: DailyAttempt[]): Set<string> {
  const out = new Set<string>();
  for (const [id, list] of dailyHistory(attempts)) {
    const last = list[list.length - 1];
    const prev = list[list.length - 2];
    if (last.correct && (isClean(last) || prev?.correct)) out.add(id);
  }
  return out;
}

/** Soru cevabından sonraki tekrar durumu: yanlışta SM-2; doğruda CHECK_DAYS gün sonra (temizse zaten emekli). */
export function questionReview(state: ReviewState, a: Answer, now: Date): ReviewState {
  if (!a.correct) return review(state, gradeAnswer(false, a.sure), now);
  const next = review(state, gradeAnswer(true, isClean(a)), now);
  return { ...next, dueAt: new Date(now.getTime() + CHECK_DAYS * DAY_MS) };
}

/** Son günlük cevabı yanlış olan soruların konu anahtarları (yeni soru seçiminde öne alınır). */
export function wrongTopicKeys(attempts: DailyAttempt[], topicKey: Map<string, string>): Set<string> {
  const out = new Set<string>();
  for (const [id, list] of dailyHistory(attempts)) {
    const key = topicKey.get(id);
    if (key && !list[list.length - 1].correct) out.add(key);
  }
  return out;
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

/**
 * İçerik değişince "yeniden oluştur" yalnızca bugünün bitmemiş oturumu için: geçmiş günün sayfasından bugünü
 * silmek ya da bitmiş günü (ve haftalık hedefi) geri almak veri kaybı olurdu.
 */
export function canRecreate(row: { day: string | null; finishedAt: Date | null }, today: string): boolean {
  return row.day === today && row.finishedAt === null;
}

/** Isınma cevabının SM-2 notu. */
export const WARMUP_GRADE = { correct: 4, wrong: 1 } as const;

/** Pozisyon yalnızca ileri gider ve soru sayısını aşmaz; tekrar gönderim güvenli. */
export function applyAdvance(current: number, requested: number, total: number): { position: number; finished: boolean } {
  const position = Math.min(Math.max(current, requested), total);
  return { position, finished: position >= total };
}
