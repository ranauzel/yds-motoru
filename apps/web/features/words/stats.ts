import type { Question } from "@/lib/content/schema";
import type { ReviewRow } from "@/features/session/rules";
import { todayKey } from "@/features/session/day";

export type WordStatus = "learned" | "reviewing" | "new";
export type WordRow = { word: string; tr: string; context?: string; status: WordStatus; dueAt: Date | null };

/** reps >= 2 öğrenildi, kayıt var ama reps < 2 tekrarda, kayıt yok yeni. Görünmeyen kelimelerin kayıtları yok sayılır. */
export function classifyWords(vocab: Map<string, Question["vocab"][number]>, reviews: ReviewRow[]): WordRow[] {
  const byId = new Map(reviews.map((r) => [r.itemId, r]));
  return [...vocab.values()].map((v) => {
    const rev = byId.get(v.word);
    const status: WordStatus = !rev ? "new" : rev.reps >= 2 ? "learned" : "reviewing";
    return { word: v.word, tr: v.tr, context: v.context, status, dueAt: rev ? rev.dueAt : null };
  });
}

/**
 * Bugün serbest çalışmada not verilmeyecek kelimeler (aynı kelime aynı gün iki kez notlanmasın, spec §5.6):
 * bugünün oturumunun tekrar kelimeleri ve oturum sorularındaki ısınma (`warmup: true`) kelimeleri.
 */
export function todayExcludedWords(questions: Pick<Question, "id" | "vocab">[], today: { questionIds: string[]; reviewWords: string[] } | null): Set<string> {
  const out = new Set<string>();
  if (!today) return out;
  for (const w of today.reviewWords) out.add(w);
  const ids = new Set(today.questionIds);
  for (const q of questions) if (ids.has(q.id)) for (const v of q.vocab) if (v.warmup) out.add(v.word);
  return out;
}

/** Serbest çalışma: seçili durumdan hariç tutulanlar ve bugün zamanı gelenler çıkar; tekrarda sekmesi dueAt artan. */
export function pickWordPractice(o: { words: WordRow[]; status: WordStatus; excluded: Set<string>; dueBefore: Date; size: number }): string[] {
  const list = o.words.filter(
    (w) => w.status === o.status && !o.excluded.has(w.word) && !(w.dueAt && w.dueAt < o.dueBefore),
  );
  if (o.status === "reviewing") list.sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));
  return list.slice(0, o.size).map((w) => w.word);
}

/** Serbest çalışma cevabı kayda yazılsın mı: kayıtsız her zaman, bugün zamanı gelen asla, diğerinde yalnızca yanlış. */
export function shouldRecordWordPractice(o: { review: ReviewRow | null; correct: boolean; dueBefore: Date }): boolean {
  if (!o.review) return true;
  if (o.review.dueAt < o.dueBefore) return false;
  return !o.correct;
}

/** Sonraki tekrar için göreli metin (İstanbul günleriyle): geçmiş ve bugün "bugün", sonra "yarın", "3 gün sonra". */
export function dueLabel(dueAt: Date, now: Date): string {
  const days = Math.round((Date.parse(`${todayKey(dueAt)}T00:00:00Z`) - Date.parse(`${todayKey(now)}T00:00:00Z`)) / 86_400_000);
  if (days <= 0) return "bugün";
  return days === 1 ? "yarın" : `${days} gün sonra`;
}
