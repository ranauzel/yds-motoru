import { TrendingDown } from "lucide-react";
import { QUESTION_TYPE_NAMES, TOPIC_NAMES } from "@/lib/content/schema";
import type { TopicStat } from "../stats";
import { TILE, TILE_ICON } from "./tile";

/** Zayıf konular kartı: en zayıf 3 konu ve doğru oranı (spec §4.4). Şimdilik bir sayfaya gitmez. */
export function WeakTopicsCard({ topics }: { topics: TopicStat[] }) {
  return (
    <section className={TILE} aria-labelledby="zayif-konular">
      <span className={TILE_ICON} aria-hidden="true"><TrendingDown className="size-5" /></span>
      <h2 id="zayif-konular" className="mt-2 font-bold">Zayıf konular</h2>
      {topics.length === 0 ? (
        <p className="text-sm text-muted">Henüz yeterli cevap yok</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-sm">
          {topics.map((t) => (
            <li key={`${t.type}:${t.topic}`} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">
                <span className="text-muted">{QUESTION_TYPE_NAMES[t.type]} · </span>
                {TOPIC_NAMES[t.topic as keyof typeof TOPIC_NAMES] ?? t.topic}
              </span>
              <b className="shrink-0">%{Math.round((100 * t.correct) / t.total)}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
