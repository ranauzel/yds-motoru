import Link from "next/link";
import { Crosshair } from "lucide-react";
import { TRAP_NAMES } from "@/lib/content/schema";
import type { TrapStat } from "@/features/traps/stats";
import { TILE, TILE_ICON, TILE_LINK } from "./tile";

/** Tuzaklarım kartı: en sık düşülen tuzak; Tuzaklarım sayfasını açar. */
export function TrapsCard({ topTrap }: { topTrap: TrapStat | null }) {
  return (
    <Link href="/tuzaklar" className={`${TILE} ${TILE_LINK}`}>
      <span className={TILE_ICON} aria-hidden="true"><Crosshair className="size-5" /></span>
      <span className="mt-2 block font-bold">Tuzaklarım</span>
      <span className="block text-sm text-muted">
        {topTrap ? `En sık: ${TRAP_NAMES[topTrap.code]} (${topTrap.code})` : "Henüz tuzağa düşmedin"}
      </span>
    </Link>
  );
}
