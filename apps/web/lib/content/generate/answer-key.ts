// Cevap anahtarı dosyası: her satırda "numara: şık" (örn. "27: C"). Doğru cevabın tek kaynağı budur.
import type { z } from "zod";
import type { OptionKey } from "../schema";

const LINE = /^(\d+)\s*:\s*([A-Ea-e])$/;

export function parseAnswerKey(text: string): Map<number, z.infer<typeof OptionKey>> {
  const answers = new Map<number, z.infer<typeof OptionKey>>();
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const m = LINE.exec(line);
    const n = m ? Number(m[1]) : NaN;
    if (!m || n < 1 || n > 80) throw new Error(`Cevap anahtarı ${i + 1}. satır geçersiz: "${line}" (beklenen: "27: C")`);
    if (answers.has(n)) throw new Error(`Cevap anahtarında ${n} numara iki kez var (${i + 1}. satır)`);
    answers.set(n, m[2].toUpperCase() as z.infer<typeof OptionKey>);
  });
  return answers;
}
