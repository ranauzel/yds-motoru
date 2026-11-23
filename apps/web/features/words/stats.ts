import type { Question } from "@/lib/content/schema";
import type { ReviewRow } from "@/features/session/rules";

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
