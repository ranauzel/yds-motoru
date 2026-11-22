// Isınma, mola ve özet ekranları.
import { startSession } from "../actions";
import { summarize, type Action, type State } from "../session-machine";
import { BottomBar, Button, Center, ProgressBar, TrapChip } from "./ui";
import { TRAP_NAMES } from "@/lib/content/schema";

export function Warmup({ s, act }: { s: State; act: (a: Action) => void }) {
  if (s.screen.kind !== "warmup") return null;
  const { block, idx } = s.screen;
  const items = s.warmItems[block] ?? [];
  const it = items[idx];
  if (!it) return null;
  const answered = it.word in s.warmAnswers;
  return (
    <>
      <div className="mb-2 flex items-center gap-3 text-sm text-muted">
        <span>Kelime ısınması {idx + 1} / {items.length}</span>
        <ProgressBar value={idx / items.length} />
      </div>
      <Center>
        <div className="font-serif text-3xl font-semibold">{it.word}</div>
        {it.context && <div className="mt-2 font-serif text-muted italic">“…{it.context}…”</div>}
      </Center>
      <div className="flex flex-col gap-2.5">
        {it.choices.map((c, k) => {
          let look = "border-border bg-surface";
          if (answered) look = c === it.tr ? "border-ok bg-ok-soft" : k === s.ui.warmPick ? "border-warn bg-warn-soft" : "border-border bg-surface opacity-60";
          return (
            <button key={k} type="button" disabled={answered} onClick={() => act({ type: "warmPick", choiceIndex: k })}
              className={`flex min-h-12 items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left ${look}`}>
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-sm font-bold">{"ABCD"[k]}</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      <div className="p-3 text-center">
        <button type="button" className="min-h-12 px-4 text-sm text-muted underline" onClick={() => act({ type: "warmSkip", now: Date.now() })}>
          Isınmayı atla
        </button>
      </div>
      {answered && <BottomBar><Button primary onClick={() => act({ type: "warmNext" })}>Devam →</Button></BottomBar>}
    </>
  );
}

export function WarmupDone({ s, act }: { s: State; act: (a: Action) => void }) {
  if (s.screen.kind !== "warmupDone") return null;
  const items = s.warmItems[s.screen.block] ?? [];
  const score = items.filter((it) => s.warmAnswers[it.word] === true).length;
  return (
    <>
      <Center>
        <div className="text-4xl">🔤</div>
        <h2 className="mt-2 text-xl font-bold">Isınma bitti</h2>
        <p className="mt-2">{score} / {items.length} kelimeyi bildin.</p>
        <p className="mt-2 text-sm text-muted">Bu kelimeler şimdi sorularda karşına çıkacak. Takılırsan “Kelimeler” düğmesine bas.</p>
      </Center>
      <BottomBar><Button primary onClick={() => act({ type: "warmEnd", now: Date.now() })}>Sorulara geç →</Button></BottomBar>
    </>
  );
}

export function BreakView({ s, act }: { s: State; act: (a: Action) => void }) {
  const seen = s.questions.slice(0, s.position);
  const right = seen.filter((q) => s.answers[q.id]?.choice === q.answer).length;
  return (
    <>
      <Center>
        <div className="text-4xl">☕</div>
        <h2 className="mt-2 text-xl font-bold">{s.position} soru bitti</h2>
        <p className="mt-2">{right} / {s.position} doğru. Kısa bir mola dikkatini toplamana yardımcı olur.</p>
        <p className="mt-2 text-sm text-muted">Sayfayı kapatabilirsin, kaldığın yerden devam eder.</p>
      </Center>
      <BottomBar><Button primary onClick={() => act({ type: "breakContinue", now: Date.now() })}>Devam et</Button></BottomBar>
    </>
  );
}

export function Summary({ s, act }: { s: State; act: (a: Action) => void }) {
  const r = summarize(s);
  const wrong = r.total - r.right;
  return (
    <>
      <Center>
        <div className="text-sm text-muted">Oturum özeti</div>
        <div className="text-5xl font-bold">{r.right} / {r.total}</div>
        <div className="text-sm text-muted">doğru</div>
      </Center>
      {r.traps.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
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
              <div key={w.number} className="rounded-2xl border border-border bg-surface p-4 text-sm"><b>Soru {w.number}:</b> {w.rule}</div>
            ))}
          </div>
        </>
      )}
      {r.sureWrong > 0 && <p className="mt-4 text-sm text-muted">{r.sureWrong} soruda emin olduğun halde yanlış yaptın. Bunlar ilk tekrar edilecekler.</p>}
      <p className="mt-4 text-sm text-muted">Çeviriyi {r.glossCount} / {r.total} soruda açtın. Bu sayı zamanla düştükçe ilerlediğini göreceksin.</p>
      {wrong === 0 && r.total > 0 && <p className="mt-4 text-center">Hiç tuzağa düşmedin. Harika iş! 🎯</p>}
      <BottomBar>
        <Button onClick={() => act({ type: "startReview" })}>Soruları gözden geçir</Button>
        <form action={startSession} className="flex flex-1"><Button primary type="submit">Yeni oturum</Button></form>
      </BottomBar>
    </>
  );
}
