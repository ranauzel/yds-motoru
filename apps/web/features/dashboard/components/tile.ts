// Pano kartlarının ortak görünümü: 20px köşe, yumuşak gölge (spec §5.2). Tıklanabilir kartlarda odak halkası görünür.
export const TILE = "rounded-[20px] bg-surface p-4 text-text shadow-[0_1px_0_var(--border),0_8px_18px_rgb(80_60_180/0.06)]";
export const TILE_LINK =
  "block min-h-12 transition-shadow outline-none hover:shadow-[0_1px_0_var(--border),0_10px_24px_rgb(80_60_180/0.12)] focus-visible:ring-3 focus-visible:ring-ring/50";
/** Kart simgesi kutusu (lucide, emoji yok). */
export const TILE_ICON = "grid size-10 place-items-center rounded-xl bg-accent-soft text-accent";
