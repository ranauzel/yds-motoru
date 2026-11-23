// Oturum ekranlarında ortak küçük parçalar (shadcn Button/Progress üstüne, Odak Panosu görünümü).
import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button as UiButton } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TRAP_NAMES, type TrapCode } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import type { Snapshot } from "../session-machine";

/** Oturum kartı: 20px köşe, yumuşak gölge (spec §5.2; pano kartlarıyla aynı). */
export const CARD = "rounded-[20px] border border-border bg-surface shadow-[0_8px_18px_rgb(80_60_180/0.06)]";

export function TrapChip({ code, count }: { code: TrapCode; count?: number }) {
  return (
    <span className="mr-1.5 mt-1 inline-block rounded-md border border-warn bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
      {code} · {TRAP_NAMES[code]}{count ? ` ×${count}` : ""}
    </span>
  );
}

/** Rehber metnindeki *vurgu*ları italik yazar. */
function Emphasis({ text }: { text: string }) {
  return <>{text.split("*").map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}</>;
}

/** Sorunun üstünde ince uyarı: en sık düşülen tuzak ve nasıl yakalanacağı (spec §5.5). */
export function TrapWarning({ trap }: { trap: NonNullable<Snapshot["topTrap"]> }) {
  return (
    <div role="note" className="mt-3 flex gap-2.5 rounded-xl border border-warn/40 bg-warn-soft px-3.5 py-2.5 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
      <p>
        Dikkat: en sık <b className="text-warn">{trap.name} ({trap.code})</b> tuzağına düşüyorsun.{" "}
        <span className="text-muted"><Emphasis text={trap.catch} /></span>
      </p>
    </div>
  );
}

/** Altta sabit eylem çubuğu (başparmak bölgesi). */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg/95 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto flex max-w-[680px] gap-2.5">{children}</div>
    </div>
  );
}

/** Ekranda en fazla bir `primary` (K1); diğerleri çerçeveli. Dokunma hedefi ≥ 48px. */
export function Button({ primary, className, ...props }: React.ComponentProps<typeof UiButton> & { primary?: boolean }) {
  return (
    <UiButton
      type="button"
      variant={primary ? "default" : "outline"}
      className={cn("h-auto min-h-12 flex-1 rounded-xl px-4 text-base font-semibold whitespace-normal disabled:opacity-40", primary ? "" : "bg-surface", className)}
      {...props}
    />
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return <Progress value={Math.round(value * 100)} aria-label={label} className="flex-1 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-border" />;
}

export function Center({ children }: { children: ReactNode }) {
  return <div className="px-2 py-10 text-center">{children}</div>;
}
