import type { Question, TrapCode } from "@/lib/content/schema";

export type AttemptRow = { questionId: string; choice: string; correct: boolean; createdAt: Date };
export type TrapStat = { code: TrapCode; count: number; lastAt: Date };

/** Yanlış cevaplarda seçilen şıkkın tuzak kodlarını sayar. Çok olan önce, eşitlikte son tarihi yeni olan önce. */
export function trapStats(attempts: AttemptRow[], questions: Map<string, Question>): TrapStat[] {
  const acc = new Map<TrapCode, TrapStat>();
  for (const a of attempts) {
    if (a.correct) continue;
    const opt = questions.get(a.questionId)?.options.find((o) => o.key === a.choice);
    if (!opt) continue;
    for (const code of opt.traps) {
      const cur = acc.get(code);
      if (!cur) acc.set(code, { code, count: 1, lastAt: a.createdAt });
      else {
        cur.count += 1;
        if (a.createdAt > cur.lastAt) cur.lastAt = a.createdAt;
      }
    }
  }
  return [...acc.values()].sort((x, y) => y.count - x.count || y.lastAt.getTime() - x.lastAt.getTime());
}

/** Yanlış şıklarından birinde bu kod geçen sorular: önce düşülenler (içerik sırasıyla), sonra diğerleri. */
export function pickTrapPractice(o: { code: TrapCode; questions: Question[]; fellIds: Set<string>; size: number }): string[] {
  const hits = o.questions.filter((q) => q.options.some((opt) => opt.key !== q.answer && opt.traps.includes(o.code)));
  const fell = hits.filter((q) => o.fellIds.has(q.id));
  const rest = hits.filter((q) => !o.fellIds.has(q.id));
  return [...fell, ...rest].slice(0, o.size).map((q) => q.id);
}
