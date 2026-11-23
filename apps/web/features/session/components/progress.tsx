// İlerleme göstergeleri: onay işareti, haftalık hedef halkası (affedici seri) ve haftanın günleri.
// Hook kullanmaz; hem sunucu bileşenlerinde (ana sayfa) hem oturum ekranlarında kullanılır.
import { WEEKLY_GOAL } from "../day";

const CIRCUMFERENCE = 2 * Math.PI * 40; // r = 40

/** Çizilerek beliren onay işareti (hareket kapalıysa doğrudan görünür). */
export function CheckMark({ size = 64 }: { size?: number }) {
  return (
    <svg className="anim-check mx-auto" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" className="fill-ok-soft" />
      <path d="M19 33 l9 9 l17 -19" fill="none" className="stroke-ok" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" />
    </svg>
  );
}

/** "Bu hafta X/5 gün" halkası. Hedef aşılsa da halka dolu kalır; kaçırılan gün hiçbir şeyi sıfırlamaz. */
export function WeekRing({ done }: { done: number }) {
  const p = Math.min(done / WEEKLY_GOAL, 1);
  return (
    <div className="relative size-[92px] shrink-0" role="img" aria-label={`Bu hafta ${done} / ${WEEKLY_GOAL} gün`}>
      <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90" aria-hidden="true">
        <circle cx="46" cy="46" r="40" fill="none" strokeWidth="8" className="stroke-border" />
        <circle
          cx="46" cy="46" r="40" fill="none" strokeWidth="8" strokeLinecap="round" className="anim-ring stroke-ok"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - p)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-tight" aria-hidden="true">
        <div>
          <div className="text-xl font-bold">{done}/{WEEKLY_GOAL}</div>
          <div className="text-[11px] text-muted">bu hafta</div>
        </div>
      </div>
    </div>
  );
}

const DAY_LETTERS = ["P", "S", "Ç", "P", "C", "C", "P"]; // Pazartesi … Pazar

/** Haftanın günleri: çalışılan günler yeşil, bugün çerçeveli. weekIndex: Pazartesi = 0. */
export function WeekDots({ doneIndexes, todayIndex }: { doneIndexes: number[]; todayIndex: number }) {
  return (
    <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
      {DAY_LETTERS.map((d, i) => (
        <span
          key={i}
          className={`grid size-[26px] place-items-center rounded-full text-[11px] font-semibold ${
            doneIndexes.includes(i) ? "bg-ok-soft text-ok" : "bg-border text-muted"
          } ${i === todayIndex ? "outline-2 outline-offset-1 outline-ok" : ""}`}
        >
          {d}
        </span>
      ))}
    </div>
  );
}
