// Konuya ilk giriş: o konunun tarifi bir kez, sorudan önce (spec §4.3). Sonra ipucu panelinde durur.
import { Compass } from "lucide-react";
import { QUESTION_TYPE_NAMES, type Question } from "@/lib/content/schema";
import { topicDef } from "@/lib/content/topics";
import { BottomBar, Button, CARD, TrapChip } from "./ui";

export function TopicIntro({ q, onContinue }: { q: Question; onContinue: () => void }) {
  const def = topicDef(q.type, q.topic);
  if (!def) return null;
  return (
    <>
      <section className={`${CARD} anim-fade p-[18px]`} aria-labelledby="konu-tarifi">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Compass className="size-4 text-accent" aria-hidden="true" />
          Yeni konu · {QUESTION_TYPE_NAMES[q.type]}
        </p>
        <h2 id="konu-tarifi" className="mt-1 text-xl font-bold">{def.name}</h2>
        <p className="mt-2 text-sm"><b>Nasıl tanınır:</b> {def.signal}</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed">
          {def.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <p className="mt-3 text-sm text-muted">Sık tuzaklar: {def.traps.map((t) => <TrapChip key={t} code={t} />)}</p>
        <p className="mt-3 text-xs text-muted">Bu tarif sorudaki “İpucu” düğmesinde de duruyor.</p>
      </section>
      <BottomBar>
        <Button primary onClick={onContinue}>Soruya geç →</Button>
      </BottomBar>
    </>
  );
}
