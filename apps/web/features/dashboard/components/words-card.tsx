import Link from "next/link";
import { BookOpen } from "lucide-react";
import { TILE, TILE_ICON, TILE_LINK } from "./tile";

/** Kelimeler kartı: öğrenilen ve tekrardaki kelime sayısı; Kelimeler sayfasını açar. */
export function WordsCard({ learned, reviewing }: { learned: number; reviewing: number }) {
  return (
    <Link href="/kelimeler" className={`${TILE} ${TILE_LINK}`}>
      <span className={TILE_ICON} aria-hidden="true"><BookOpen className="size-5" /></span>
      <span className="mt-2 block font-bold">Kelimeler</span>
      <span className="block text-sm text-muted">{learned} öğrenildi · {reviewing} tekrarda</span>
    </Link>
  );
}
