import { Lightbulb } from "lucide-react";

/** "Biliyor muydun?": günün ipucu (bir sorunun altın kuralı; gün boyunca aynı). */
export function TipCard({ tip }: { tip: string }) {
  return (
    <section className="col-span-2 flex gap-3 rounded-[20px] border border-dashed border-warn/40 bg-warn-soft p-4" aria-labelledby="biliyor-muydun">
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden="true" />
      <div>
        <h2 id="biliyor-muydun" className="font-bold">Biliyor muydun?</h2>
        <p className="mt-1 text-sm">{tip}</p>
      </div>
    </section>
  );
}
