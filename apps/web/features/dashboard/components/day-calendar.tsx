"use client";
import { useState } from "react";
import { GraduationCap, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DayCell } from "../stats";
import { TILE } from "./tile";

const DAY_LETTERS = ["P", "S", "Ç", "P", "C", "C", "P"]; // Pazartesi … Pazar
const LEVEL_BG = ["bg-border", "bg-accent/30", "bg-accent/60", "bg-accent"] as const;
const LEVEL_TEXT = ["Oturum yok", "Başladın, bitmedi", "Oturum bitti", "Bitti, %80 ve üstü doğru"] as const;

const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" });

function summary(c: DayCell): string {
  const date = dateFormat.format(new Date(`${c.day}T00:00:00Z`));
  const parts = [date];
  if (c.exam) parts.push("Sınav günü");
  if (c.today) parts.push("Bugün");
  parts.push(c.locked ? "Henüz gelmedi" : LEVEL_TEXT[c.level]);
  return parts.join(" · ");
}

/**
 * Gün takvimi (ısı haritası): 9 hafta, sütun = hafta, satır = gün (Pazartesi başlar). Gelecek günler kilitli ve soluk,
 * sınav günü bayraklı. Kareye gelince ya da dokununca o günün özeti Tooltip'te görünür.
 */
export function DayCalendar({ weeks }: { weeks: DayCell[][] }) {
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <section className={`${TILE} col-span-2`} aria-labelledby="gun-takvimi">
      <div className="flex items-center">
        <h2 id="gun-takvimi" className="font-bold">Gün takvimi</h2>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted" aria-hidden="true">
          Az
          {LEVEL_BG.map((bg) => <i key={bg} className={cn("size-3 rounded-[3px]", bg)} />)}
          Çok
        </div>
      </div>
      <TooltipProvider>
        <div className="mt-3 grid grid-flow-col grid-cols-[auto_repeat(9,minmax(0,1fr))] grid-rows-7 gap-1">
          {DAY_LETTERS.map((d, i) => (
            <span key={`l${i}`} className="grid place-items-center pr-1 text-xs text-muted" aria-hidden="true">{d}</span>
          ))}
          {weeks.flat().map((c) => (
            <Tooltip key={c.day} open={openDay === c.day} onOpenChange={(o) => setOpenDay((cur) => (o ? c.day : cur === c.day ? null : cur))}>
              <TooltipTrigger
                closeOnClick={false}
                onClick={() => setOpenDay(c.day)}
                aria-label={summary(c)}
                className={cn(
                  "grid aspect-square w-full place-items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  c.locked ? "bg-accent-soft text-muted" : LEVEL_BG[c.level],
                  c.today && "ring-2 ring-text ring-offset-1",
                  c.exam && "bg-warn-soft text-warn ring-2 ring-warn",
                )}
              >
                {c.exam ? <GraduationCap className="size-3.5" aria-hidden="true" /> : c.locked && <Lock className="size-3 opacity-60" aria-hidden="true" />}
              </TooltipTrigger>
              <TooltipContent>{summary(c)}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </section>
  );
}
