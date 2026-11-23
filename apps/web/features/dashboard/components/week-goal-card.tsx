import { Flame } from "lucide-react";
import { WEEKLY_GOAL } from "@/features/session/day";
import { TILE, TILE_ICON } from "./tile";

/** Haftalık hedef (affedici seri): kaçırılan gün hiçbir şeyi sıfırlamaz. */
export function WeekGoalCard({ weekDays }: { weekDays: number }) {
  const reached = weekDays >= WEEKLY_GOAL;
  return (
    <section className={TILE} aria-label="Haftalık hedef">
      <span className={TILE_ICON} aria-hidden="true"><Flame className="size-5" /></span>
      <p className="mt-2 font-bold">Bu hafta {weekDays}/{WEEKLY_GOAL} gün</p>
      <p className="text-sm text-muted">{reached ? "Haftanın hedefi tamam" : "Kaçırdığın gün sıfırlamaz"}</p>
    </section>
  );
}
