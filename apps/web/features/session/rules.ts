// Oturum kuralları: veritabanından bağımsız saf yardımcılar (server.ts buradan kullanır, testler buradan import eder).
import type { Question } from "@/lib/content/schema";

/** Oturumun soruları. Şimdilik içerikteki tüm sorular, içerik sırasıyla; ileride tekrar/Elo seçimi buraya girer. */
export function pickSessionQuestions(questions: Question[]): string[] {
  return questions.map((q) => q.id);
}

/** Isınma cevabının SM-2 notu. */
export const WARMUP_GRADE = { correct: 4, wrong: 1 } as const;

/** Pozisyon yalnızca ileri gider ve soru sayısını aşmaz; tekrar gönderim güvenli. */
export function applyAdvance(current: number, requested: number, total: number): { position: number; finished: boolean } {
  const position = Math.min(Math.max(current, requested), total);
  return { position, finished: position >= total };
}
