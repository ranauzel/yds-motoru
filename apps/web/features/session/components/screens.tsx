// Kelime tekrarı / ısınma, mola ve günün özeti ekranları.
import Link from "next/link";
import { Coffee, Languages } from "lucide-react";
import { TipCard } from "@/features/dashboard/components/tip-card";
import { TRAP_NAMES } from "@/lib/content/schema";
import { REVIEW_BLOCK, summarize, type Action, type State } from "../session-machine";
import { CountUp } from "./count-up";
import { CheckMark, WeekRing } from "./progress";
import { BottomBar, Button, CARD, Center, ProgressBar, TrapChip } from "./ui";

/** Ekran simgesi (lucide; kartlarda emoji yok, spec §5.2). */
const SCREEN_ICON = "mx-auto grid size-16 place-items-center rounded-full bg-accent-soft text-accent";

export function Warmup({ s, act }: { s: State; act: (a: Action) => void }) {
  if (s.screen.kind !== "warmup") return null;
  const { block, idx } = s.screen;
  const items = s.warmItems[block] ?? [];
  const it = items[idx];
  if (!it) return null;
  const review = block === REVIEW_BLOCK;
  const answered = it.word in s.warmAnswers;
  const knewIt = answered && s.warmAnswers[it.word] === true;
  return (
    <>
      <div className="mb-2 flex items-center gap-3 text-sm text-muted">
        <span>{review ? "Kelime tekrarı" : "Kelime ısınması"} {idx + 1} / {items.length}</span>
        <ProgressBar value={idx / items.length} label={`${review ? "Kelime tekrarı" : "Kelime ısınması"} ilerlemesi`} />
      </div>
      {/* key: her kelimede kart yeniden kayarak gelir */}
      <div key={`${block}-${idx}`} className="anim-slide">
        <Center>
          <div className="relative">
            <div className="font-serif text-3xl font-semibold">{it.word}</div>
            {knewIt && <span className="anim-plus absolute -top-2 right-0 text-sm font-bold text-ok opacity-0" aria-hidden="true">+1</span>}
          </div>
          {it.context && <div className="mt-2 font-serif text-muted italic">“…{it.context}…”</div>}
        </Center>
        <div className="flex flex-col gap-2.5">
          {it.choices.map((c, k) => {
            const isRight = c === it.tr;
            let look = "border-border bg-surface";
            if (answered) look = isRight ? "anim-ok border-ok bg-ok-soft" : k === s.ui.warmPick ? "border-warn bg-warn-soft" : "border-border bg-surface opacity-60";
            return (
              <button key={k} type="button" disabled={answered} onClick={() => act({ type: "warmPick", choiceIndex: k })}
                className={`anim-press flex min-h-12 items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition-colors duration-200 ${look}`}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-sm font-bold">{"ABCD"[k]}</span>
                <span>{c}</span>
                {answered && isRight && <span className="ml-auto font-bold text-ok" aria-label="doğru anlam">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 text-center">
        <button type="button" className="min-h-12 px-4 text-sm text-muted underline" onClick={() => act({ type: "warmSkip", now: Date.now() })}>
          {review ? "Tekrarı atla" : "Isınmayı atla"}
        </button>
      </div>
      {answered && <BottomBar><Button primary onClick={() => act({ type: "warmNext" })}>Devam →</Button></BottomBar>}
    </>
  );
}

export function WarmupDone({ s, act }: { s: State; act: (a: Action) => void }) {
  if (s.screen.kind !== "warmupDone") return null;
  const review = s.screen.block === REVIEW_BLOCK;
  const items = s.warmItems[s.screen.block] ?? [];
  const score = items.filter((it) => s.warmAnswers[it.word] === true).length;
  const next = s.questions.length ? "Sorulara geç →" : "Özete geç →";
  return (
    <>
      <Center>
        {review ? <CheckMark /> : <div className={SCREEN_ICON}><Languages className="size-8" aria-hidden="true" /></div>}
        <h2 className="mt-3 text-xl font-bold">{review ? "Tekrar bitti" : "Isınma bitti"}</h2>
        <p className="mt-2"><b>{score} / {items.length}</b> kelimeyi {review ? "hatırladın" : "bildin"}.</p>
        <p className="anim-fade-2 mt-2 text-sm text-muted">
          {review
            ? "Hatırlamadıkların yarın yeniden gelecek."
            : "Bu kelimeler şimdi sorularda karşına çıkacak. Takılırsan “Kelimeler” düğmesine bas."}
        </p>
      </Center>
      <BottomBar><Button primary onClick={() => act({ type: "warmEnd", now: Date.now() })}>{review ? next : "Sorulara geç →"}</Button></BottomBar>
    </>
  );
}

export function BreakView({ s, act }: { s: State; act: (a: Action) => void }) {
  const seen = s.questions.slice(0, s.position);
  const right = seen.filter((q) => s.answers[q.id]?.choice === q.answer).length;
  return (
    <>
      <Center>
        <div className={SCREEN_ICON}><Coffee className="size-8" aria-hidden="true" /></div>
        <h2 className="mt-3 text-xl font-bold">{s.position} soru bitti</h2>
        <p className="mt-2">{right} / {s.position} doğru. Kısa bir mola dikkatini toplamana yardımcı olur.</p>
        <p className="mt-2 text-sm text-muted">Sayfayı kapatabilirsin, kaldığın yerden devam eder.</p>
      </Center>
      {s.tip && <div className="anim-fade-2"><TipCard tip={s.tip} /></div>}
      <BottomBar><Button primary onClick={() => act({ type: "breakContinue", now: Date.now() })}>Devam et</Button></BottomBar>
    </>
  );
}

/**
 * Günün özeti. Ana eylem yok: günün işi bitti; gözden geçirme ikincil (ARAYUZ K1, TASARIM §8).
 * Serbest çalışmada (practice) haftalık hedef, havuz ve "yarın" satırı yok; ana eylem "Panoya dön" (spec §5.8).
 */
export function Summary({ s, act, mode = "daily" }: { s: State; act: (a: Action) => void; mode?: "daily" | "practice" }) {
  const r = summarize(s);
  const wrong = r.total - r.right;
  const practice = mode === "practice";
  return (
    <>
      <Center>
        <CheckMark />
        <div className="mt-2 text-sm text-muted">{practice ? "Çalışma özeti" : "Günün özeti"}</div>
        {r.total > 0 ? (
          <>
            <div className="text-5xl font-bold"><CountUp to={r.right} /> / {r.total}</div>
            <div className="text-sm text-muted">doğru</div>
          </>
        ) : (
          <div className="mt-1 text-xl font-bold">{practice ? "Kelime çalışması bitti" : "Bugün kelime günüydü"}</div>
        )}
      </Center>
      {practice ? (
        r.reviewTotal > 0 && (
          <div className={`anim-fade-2 p-4 text-center ${CARD}`}>
            <b>{r.reviewKnown} / {r.reviewTotal}</b> kelimeyi bildin
          </div>
        )
      ) : (
        <div className={`anim-fade-2 flex items-center gap-4 p-4 ${CARD}`}>
          <WeekRing done={s.weekDays} />
          <div className="text-sm leading-relaxed">
            {r.reviewTotal > 0 && <>Kelime tekrarı: <b>{r.reviewKnown} / {r.reviewTotal}</b> biliniyor<br /></>}
            Havuzda <b>{s.newLeft}</b> yeni soru kaldı
          </div>
        </div>
      )}
      {r.traps.length > 0 && (
        <div className={`anim-fade-3 mt-3 p-4 ${CARD}`}>
          <b>Düştüğün tuzaklar</b>
          <div className="mt-2">{r.traps.map(([t, n]) => <TrapChip key={t} code={t} count={n} />)}</div>
          <p className="mt-2 text-sm text-muted">En sık: <b>{TRAP_NAMES[r.traps[0][0]]}</b>. Bir sonraki oturumda buna dikkat et.</p>
        </div>
      )}
      {r.wrongRules.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 font-semibold">Bu oturumdan aklında kalsın</h3>
          <div className="space-y-2.5">
            {r.wrongRules.map((w) => (
              <div key={w.number} className={`p-4 text-sm ${CARD}`}><b>Soru {w.number}:</b> {w.rule}</div>
            ))}
          </div>
        </>
      )}
      {!practice && r.sureWrong > 0 && <p className="mt-4 text-sm text-muted">{r.sureWrong} soruda emin olduğun halde yanlış yaptın. Bunlar ilk tekrar edilecekler.</p>}
      {r.total > 0 && <p className="mt-4 text-sm text-muted">Çeviriyi {r.glossCount} / {r.total} soruda açtın. Bu sayı zamanla düştükçe ilerlediğini göreceksin.</p>}
      {wrong === 0 && r.total > 0 && <p className="mt-4 text-center">Hiç tuzağa düşmedin. Harika iş! 🎯</p>}
      {practice ? (
        <BottomBar>
          {s.questions.length > 0 && <Button onClick={() => act({ type: "startReview" })}>Soruları gözden geçir</Button>}
          <Link href="/" className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Panoya dön
          </Link>
        </BottomBar>
      ) : (
        <>
          <p className="mt-4 text-center text-sm text-muted">Yarın yeni oturum açılacak.</p>
          {s.questions.length > 0 && (
            <BottomBar><Button onClick={() => act({ type: "startReview" })}>Soruları gözden geçir</Button></BottomBar>
          )}
        </>
      )}
    </>
  );
}
