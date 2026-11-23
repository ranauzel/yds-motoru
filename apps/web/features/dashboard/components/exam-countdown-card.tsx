"use client";
import { CalendarPlus, GraduationCap, Pencil } from "lucide-react";
import { ExamDateDialog } from "@/features/profile/components/exam-date-dialog";
import { TILE, TILE_ICON, TILE_LINK } from "./tile";

/** Sınava kalan gün. Tarih yoksa ya da geçtiyse "ekle" kartı; kart tarih penceresini açar (spec §5.3–5.4). */
export function ExamCountdownCard({ examDate, daysLeft }: { examDate: string | null; daysLeft: number | null }) {
  const expired = daysLeft !== null && daysLeft < 0;
  const hasDate = examDate !== null && !expired;

  const title = !hasDate ? "Sınav tarihini ekle" : daysLeft === 0 ? "Sınav bugün" : `Sınava ${daysLeft} gün`;
  const sub = expired
    ? "Sınav günü geçti — yeni tarih ekle"
    : hasDate
      ? new Date(`${examDate}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
      : "Geri sayımı başlatalım";

  return (
    <ExamDateDialog
      initial={hasDate ? examDate : null}
      autoOpen={examDate === null}
      trigger={
        <button type="button" className={`${TILE} ${TILE_LINK} relative w-full text-left`}>
          <span className={TILE_ICON} aria-hidden="true">
            {hasDate ? <GraduationCap className="size-5" /> : <CalendarPlus className="size-5" />}
          </span>
          {hasDate && (
            <span className="absolute top-4 right-4 text-muted" aria-hidden="true">
              <Pencil className="size-4" />
            </span>
          )}
          <span className="mt-2 block font-bold">{title}</span>
          <span className="block text-sm text-muted">{sub}</span>
          {hasDate && <span className="sr-only">, tarihi düzenle</span>}
        </button>
      }
    />
  );
}
