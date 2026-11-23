// Soru: direktif, kök (vurgulu ya da parça parça çeviri), araçlar, şıklar ve cevaptan sonra geri bildirim.
import { CircleCheck, Lightbulb, Star } from "lucide-react";
import type { Question } from "@/lib/content/schema";
import { topicDef } from "@/lib/content/topics";
import { optionPattern, trapWarningFor } from "../option-pattern";
import type { Action, AnswerRecord, OptionKey, Snapshot, Ui } from "../session-machine";
import { CARD, TrapChip, TrapWarning } from "./ui";

const DIRECTIVE: Partial<Record<Question["type"], React.ReactNode>> = {
  cumle_tamamlama: <><b className="text-text">Önce bağlacı bul</b>, yönünü belirle (zıtlık / neden / ek / koşul). Sonra zaman ve zamir uyumuna bak.</>,
  kelime: <><b className="text-text">Boşluğun yanına bak</b>: edat ya da kalıp var mı? Sonra cümlenin yönünü ve tonunu belirle.</>,
  dilbilgisi: <><b className="text-text">Önce şıkları karşılaştır</b>: neyi test ediyor (zaman, bağlaç, edat…)? Sonra cümledeki ipucunu bul.</>,
};

type Props = { q: Question; answer?: AnswerRecord; ui: Ui; act: (a: Action) => void; readOnly?: boolean; topTrap?: Snapshot["topTrap"] };

export function QuestionView({ q, answer, ui, act, readOnly, topTrap }: Props) {
  const done = !!answer;
  const pattern = optionPattern(q);
  const warn = trapWarningFor(q, topTrap ?? null);
  return (
    <>
      {warn && <TrapWarning trap={warn} />}
      <p className="mt-3 mb-4 text-sm text-muted">{pattern ? <b className="text-text">{pattern.directive}</b> : DIRECTIVE[q.type]}</p>
      <div className={`${CARD} p-[18px]`}><Stem q={q} gloss={ui.gloss} /></div>

      <div className="my-3 flex flex-wrap gap-2">
        <Chip on={ui.gloss} onClick={() => act({ type: "toggle", tool: "gloss" })}>Parça parça çeviri</Chip>
        {!done && <Chip on={ui.words} onClick={() => act({ type: "toggle", tool: "words" })}>Kelimeler</Chip>}
        {!done && <Chip on={ui.hint} onClick={() => act({ type: "toggle", tool: "hint" })}>İpucu</Chip>}
      </div>

      {ui.words && !done && (
        <div className="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          {q.vocab.filter((v) => v.warmup).map((v) => (
            <Pair key={v.word} a={v.word} b={v.tr} />
          ))}
        </div>
      )}
      {ui.hint && !done && (
        <div className="mb-3 flex gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <div>
            {pattern && (
              <div className="mb-2 border-b border-accent/20 pb-2">
                <b>Şıklardan nasıl gidilir</b>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                  {pattern.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            )}
            {pattern ? <><b>Bu soruda:</b> {q.solution_steps[0]}</> : q.solution_steps[0]}
            <TopicRecipe q={q} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {q.options.map((o) => {
          let look = "border-border bg-surface";
          if (done) look = o.key === q.answer ? "border-ok bg-ok-soft" : o.key === answer.choice ? "border-warn bg-warn-soft" : "border-border bg-surface opacity-60";
          else if (ui.sel === o.key) look = "border-accent bg-accent-soft";
          return (
            <button
              key={o.key}
              type="button"
              disabled={done || readOnly}
              onClick={() => act({ type: "select", key: o.key as OptionKey })}
              className={`anim-press flex min-h-12 w-full items-start gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition-colors duration-200 ${look}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-sm font-bold">{o.key}</span>
              <span className="font-serif text-[17px] leading-relaxed">
                {o.text}
                {done && <span className="mt-1 block font-sans text-sm text-muted">{o.text_tr}</span>}
                {done && o.traps.length > 0 && <span className="block font-sans">{o.traps.map((t) => <TrapChip key={t} code={t} />)}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {done && <Feedback q={q} answer={answer} />}
    </>
  );
}

/** İpucunda konunun tarifi (spec §4.3); konu haritası yoksa hiçbir şey. */
function TopicRecipe({ q }: { q: Question }) {
  const def = topicDef(q.type, q.topic);
  if (!def) return null;
  return (
    <div className="mt-2 border-t border-accent/20 pt-2">
      <b>Konu: {def.name}</b>
      <ol className="mt-1 list-decimal space-y-0.5 pl-5">
        {def.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`min-h-12 rounded-full border px-4 text-sm transition-colors duration-150 ${on ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface"}`}>
      {children}
    </button>
  );
}

function Pair({ a, b }: { a: string; b: React.ReactNode }) {
  return <><span className="font-serif font-semibold">{a}</span><span>{b}</span></>;
}

function Stem({ q, gloss }: { q: Question; gloss: boolean }) {
  if (gloss)
    return (
      <div className="flex flex-wrap gap-x-2 gap-y-2.5">
        {q.stem_chunks.map((c, i) => {
          const look = c.tag === "conj" ? "border-conj bg-conj-soft text-conj" : c.tag === "ref" ? "border-ref bg-ref-soft" : c.tag === "blank" ? "border-dashed border-accent" : "border-border";
          return (
            <div key={i} className={`max-w-full rounded-xl border px-2.5 py-1.5 ${look}`}>
              <span className="font-serif text-[17px]">{c.en}</span>
              {c.label && <span className="ml-1.5 rounded-md bg-conj px-1.5 py-px align-middle text-[11px] font-bold uppercase text-surface">{c.label}</span>}
              {c.sign && <span className="ml-1.5 rounded-md bg-border px-1.5 py-px align-middle text-[11px] font-bold uppercase">{c.sign}</span>}
              {c.tag !== "blank" && <span className={`mt-0.5 block text-sm ${c.tag === "conj" ? "text-conj" : "text-muted"}`}>{c.tr}</span>}
            </div>
          );
        })}
      </div>
    );
  return (
    <p className="font-serif text-[19px] leading-[1.6]">
      {q.stem_chunks.map((c, i) => (
        <span key={i}>
          {i > 0 && " "}
          {c.tag === "conj" ? <span className="rounded bg-conj-soft px-0.5 font-semibold text-conj">{c.en}</span>
            : c.tag === "ref" ? <span className="rounded bg-ref-soft px-0.5 text-ref">{c.en}</span>
            : c.tag === "blank" ? <span className="font-bold tracking-widest text-accent">{c.en}</span>
            : c.en}
        </span>
      ))}
    </p>
  );
}

function Feedback({ q, answer }: { q: Question; answer: AnswerRecord }) {
  const ok = answer.choice === q.answer;
  const chosen = q.options.find((o) => o.key === answer.choice);
  return (
    <div className="mt-4 space-y-2.5">
      <div className={`anim-fade rounded-[20px] border p-4 ${ok ? "border-ok bg-ok-soft" : "border-warn bg-warn-soft"}`}>
        {ok ? (
          <>
            <h3 className="flex items-center gap-1.5 font-semibold text-ok">
              <CircleCheck className="size-5" aria-hidden="true" />Doğru{answer.sure ? "" : " — ve tahminin tuttu"}
            </h3>
            <p className="mt-1 text-sm">{q.summary}</p>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-warn">{answer.choice} şıkkı bir tuzaktı</h3>
            <div>{chosen?.traps.map((t) => <TrapChip key={t} code={t} />)}</div>
            <p className="mt-2 text-sm">{chosen?.explanation}</p>
            <p className="mt-2 text-sm"><b>Doğru cevap {q.answer}.</b> {q.summary}</p>
            {answer.sure && <p className="mt-2 text-sm text-muted">“Eminim” deyip yanlış yaptığın sorular en kalıcı öğrenilenlerdir. Bu soru tekrar listesinde önce gelecek.</p>}
          </>
        )}
      </div>
      <div className={`${CARD} flex gap-2 p-4 text-sm`}>
        <Star className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        <p><b>Altın kural:</b> {q.golden_rule}</p>
      </div>
      <Details title="Adım adım çözüm">
        <ol className="list-decimal space-y-1.5 pl-5">{q.solution_steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {q.structure && <p className="mt-2 text-muted"><b>Yapı:</b> {q.structure}</p>}
      </Details>
      <Details title="Şıklar neden yanlış?">
        {q.options.map((o) => (
          <p key={o.key} className="mb-2"><b>{o.key})</b> {o.key === q.answer ? <CircleCheck className="inline size-4 align-[-3px] text-ok" aria-label="doğru şık" /> : o.traps.map((t) => <TrapChip key={t} code={t} />)} {o.explanation}</p>
        ))}
      </Details>
      <Details title={`Kelimeler (${q.vocab.length})`}>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {q.vocab.map((v) => <Pair key={v.word} a={v.word} b={<>{v.tr}{v.note && <span className="text-muted"> · {v.note}</span>}</>} />)}
        </div>
      </Details>
    </div>
  );
}

function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className={CARD}>
      <summary className="min-h-12 cursor-pointer px-4 py-3 font-semibold">{title}</summary>
      <div className="px-4 pb-3.5 text-sm">{children}</div>
    </details>
  );
}
