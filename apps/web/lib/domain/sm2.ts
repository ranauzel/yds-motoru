// SM-2 aralıklı tekrar algoritması (Wozniak, 1987) — framework'ten bağımsız, saf fonksiyonlar.

export type ReviewState = {
  ease: number;          // kolaylık katsayısı, en az 1.3
  intervalDays: number;  // bir sonraki tekrara kadar gün
  reps: number;          // üst üste başarılı tekrar sayısı
  lapses: number;        // toplam unutma sayısı
  priority: boolean;     // emin olup yanlış yapıldıysa öncelikli
  dueAt: Date;
};

/** 0–5 arası not. 3 ve üstü "hatırladı" sayılır. */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function newReviewState(now: Date): ReviewState {
  return { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, priority: false, dueAt: now };
}

/**
 * Bir cevabı SM-2 notuna çevirir.
 * Emin olup yanlış (hiperdüzeltme) en düşük not; emin olmadan doğru, şansla doğru olabileceği için orta not.
 */
export function gradeAnswer(correct: boolean, sure: boolean): Grade {
  if (!correct) return sure ? 0 : 1;
  return sure ? 5 : 3;
}

export function review(state: ReviewState, grade: Grade, now: Date): ReviewState {
  const ease = Math.max(MIN_EASE, state.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));

  if (grade < 3) {
    return {
      ease,
      intervalDays: 1,
      reps: 0,
      lapses: state.lapses + 1,
      priority: grade === 0 || state.priority,
      dueAt: new Date(now.getTime() + DAY_MS),
    };
  }

  const reps = state.reps + 1;
  const intervalDays = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(state.intervalDays * ease);
  return {
    ease,
    intervalDays,
    reps,
    lapses: state.lapses,
    priority: false,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}

/** Isınmada bir kelime "biliniyor" sayılsın mı? (üst üste 2 doğru) */
export function isKnown(state: Pick<ReviewState, "reps">): boolean {
  return state.reps >= 2;
}
