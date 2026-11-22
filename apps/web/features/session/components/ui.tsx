// Oturum ekranlarında ortak küçük parçalar.
import type { ReactNode } from "react";
import { TRAP_NAMES, type TrapCode } from "@/lib/content/schema";

export function TrapChip({ code, count }: { code: TrapCode; count?: number }) {
  return (
    <span className="mr-1.5 mt-1 inline-block rounded-md border border-warn bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
      {code} · {TRAP_NAMES[code]}{count ? ` ×${count}` : ""}
    </span>
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

const btnBase = "min-h-12 flex-1 rounded-xl px-4 text-base font-semibold transition-opacity disabled:opacity-40";

export function Button({ primary, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  const look = primary ? "bg-accent text-white" : "border border-border bg-surface";
  return <button type="button" {...props} className={`${btnBase} ${look} ${className}`} />;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
      <i className="block h-full bg-accent transition-[width] duration-300" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function Center({ children }: { children: ReactNode }) {
  return <div className="px-2 py-10 text-center">{children}</div>;
}
