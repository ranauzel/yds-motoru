"use client";
// Pratik oturumunun istemci kabuğu: durum makinesini çalıştırır, yan etkileri kayıt kuyruğuna verir, klavyeyi dinler.
import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { practiceSend } from "@/features/practice/send";
import { readSoundPref } from "@/features/ui/sound-pref";
import { recordWordPractice } from "@/features/words/actions";
import { advance, markBreakSeen, markWarmDone, recordAnswer, recordWarmup } from "../actions";
import { celebrate } from "../celebrate";
import { realFx } from "../fx";
import { keyToAction } from "../keyboard";
import { createSaveQueue, type QueueStatus } from "../save-queue";
import { effectsFor, feedbackFor, initState, isSnapshotAhead, reduce, type Action, type Effect, type Snapshot } from "../session-machine";
import { QuestionView } from "./question-view";
import { BreakView, Summary, Warmup, WarmupDone } from "./screens";
import { BottomBar, Button, ProgressBar } from "./ui";

// Isınma şıkları rastgele karıştırıldığı için akış yalnızca tarayıcıda kurulur (hidrasyon farkı olmasın).
const subscribe = () => () => {};
/** daily: günün oturumu (her şey kaydedilir). practice: serbest çalışma (yalnızca kelime cevabı yazılır, spec §5.8). */
export type SessionMode = "daily" | "practice";
export function PracticeSession({ snapshot, mode = "daily" }: { snapshot: Snapshot; mode?: SessionMode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return <p className="py-10 text-center text-sm text-muted">Yükleniyor…</p>;
  return <Flow snapshot={snapshot} mode={mode} />;
}

function Flow({ snapshot, mode }: { snapshot: Snapshot; mode: SessionMode }) {
  const [state, setState] = useState(() => initState(snapshot, Math.random, Date.now()));
  const stateRef = useRef(state);
  const [saveStatus, setSaveStatus] = useState<QueueStatus>("idle");
  const streak = useRef(0); // üst üste doğru (soru ya da kelime); yanlışta sıfırlanır

  const [queue] = useState(() => {
    if (mode === "practice") return createSaveQueue((e: Effect) => practiceSend(e, recordWordPractice), { onStatus: setSaveStatus });
    const id = snapshot.sessionId;
    const send = (e: Effect) => {
      switch (e.kind) {
        case "recordAnswer": return recordAnswer(id, e.questionId, e.answer, e.durationMs);
        case "advance": return advance(id, e.position);
        case "recordWarmup": return recordWarmup(id, e.word, e.correct);
        case "markWarmDone": return markWarmDone(id, e.block);
        case "markBreakSeen": return markBreakSeen(id);
      }
    };
    return createSaveQueue(send, { onStatus: setSaveStatus });
  });

  const act = useCallback((a: Action) => {
    const prev = stateRef.current;
    const next = reduce(prev, a);
    if (next === prev) return;
    stateRef.current = next;
    setState(next);
    queue.push(effectsFor(prev, a, next));
    const fb = feedbackFor(prev, a, next);
    if (fb) {
      streak.current = fb === "correct" ? streak.current + 1 : 0;
      celebrate(fb, {
        streak: streak.current, sound: readSoundPref(), fx: realFx,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    }
  }, [queue]);

  // Next sayfayı gizleyip durumunu korur; yeniden açılışta gelen snapshot başka cihazdaki ilerlemeyi
  // içeriyorsa (ve bekleyen yerel kayıt yoksa) onu benimse.
  useEffect(() => {
    if (queue.pending() || !isSnapshotAhead(snapshot, stateRef.current)) return;
    const fresh = initState(snapshot, Math.random, Date.now());
    stateRef.current = fresh;
    setState(fresh);
  }, [snapshot, queue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable]")) return;
      const a = keyToAction({
        key: e.key, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey,
        inSummary: !!t?.closest?.("summary"),
      }, stateRef.current, Date.now());
      if (a) { e.preventDefault(); act(a); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [act]);

  // Kaydedilmemiş cevap varken sayfadan çıkılırsa uyar.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => { if (queue.pending()) e.preventDefault(); };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [queue]);

  const s = state;
  const scr = s.screen;
  const n = s.questions.length;
  const screenKey = scr.kind === "review" ? `r${scr.i}` : scr.kind === "warmup" ? `w${scr.block}-${scr.idx}` : `${scr.kind}${s.position}`;
  useEffect(() => { window.scrollTo(0, 0); }, [screenKey]);

  let body: React.ReactNode;
  if (scr.kind === "warmup") body = <Warmup s={s} act={act} />;
  else if (scr.kind === "warmupDone") body = <WarmupDone s={s} act={act} />;
  else if (scr.kind === "break") body = <BreakView s={s} act={act} />;
  else if (scr.kind === "summary") body = <Summary s={s} act={act} mode={mode} />;
  else {
    const i = scr.kind === "review" ? scr.i : s.position;
    const q = s.questions[i];
    const answer = s.answers[q.id];
    body = (
      <>
        <div className="mb-2 flex items-center gap-3 text-sm text-muted">
          <span>{scr.kind === "review" ? "Gözden geçir" : "Soru"} {i + 1} / {n}</span>
          <ProgressBar value={(scr.kind === "review" ? i + 1 : i) / n} label="Oturum ilerlemesi" />
          <span>No {q.number}</span>
        </div>
        <QuestionView q={q} answer={answer} ui={s.ui} act={act} readOnly={scr.kind === "review"} topTrap={scr.kind === "question" ? s.topTrap : null} />
        <BottomBar>
          {scr.kind === "review" ? (
            <>
              <Button disabled={i === 0} onClick={() => act({ type: "reviewMove", delta: -1 })}>← Önceki</Button>
              <Button primary onClick={() => act({ type: "reviewMove", delta: 1 })}>{i + 1 < n ? "Sonraki →" : "Özete dön"}</Button>
            </>
          ) : answer ? (
            <Button primary onClick={() => act({ type: "next", now: Date.now() })}>{i + 1 < n ? "Sonraki soru →" : "Sonuçları gör →"}</Button>
          ) : (
            <>
              <Button disabled={!s.ui.sel} onClick={() => act({ type: "submit", sure: false, now: Date.now() })}>Emin değilim</Button>
              <Button primary disabled={!s.ui.sel} onClick={() => act({ type: "submit", sure: true, now: Date.now() })}>Eminim</Button>
            </>
          )}
        </BottomBar>
      </>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center">
        <Link href="/" aria-label={mode === "practice" ? "Çalışmadan çık" : "Oturumdan çık"} className="-ml-3 grid size-12 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-accent-soft"><X className="size-6" aria-hidden="true" /></Link>
      </div>
      {body}
      {saveStatus === "retrying" && (
        <p role="status" className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] text-center text-xs text-warn">
          Kaydedilemedi, tekrar deneniyor…
        </p>
      )}
    </>
  );
}
