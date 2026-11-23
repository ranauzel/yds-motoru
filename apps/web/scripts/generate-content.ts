// Sınav PDF'i + cevap anahtarından cümle tamamlama sorularını Gemini ile hazırlar.
// Kullanım: pnpm content:generate <sinav.pdf> --anahtar <cevaplar.txt> --sinav <id> --tarih YYYY-MM-DD [--ad "<sınav adı>"]
// Geçen sorular content/sorular/<sinav>/ altına (draft), şüpheliler data/raw/<sinav>/inceleme.json'a yazılır.
// Doğrulanmamış soru içerik dosyasına girmez; var olan içerik dosyasının üzerine yazılmaz.
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const { existsSync } = await import("node:fs");
  const { mkdir, readFile, writeFile } = await import("node:fs/promises");
  const path = (await import("node:path")).default;
  const { contentRoot } = await import("../lib/content/load");
  const { QuestionFile } = await import("../lib/content/schema");
  const { parseGenerateArgs } = await import("../lib/content/generate/args");
  const { parseAnswerKey } = await import("../lib/content/generate/answer-key");
  const { generateQuestions } = await import("../lib/content/generate/generate");
  const { GENERATORS } = await import("../lib/content/generate/prompts");
  const { createGeminiClient } = await import("../lib/content/generate/gemini");
  const { archiveExisting } = await import("../lib/content/generate/files");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY tanımlı değil (apps/web/.env.local).");

  const args = parseGenerateArgs(process.argv.slice(2));
  const answers = parseAnswerKey(await readFile(args.key, "utf8"));
  const type = "cumle_tamamlama" as const;
  const gen = GENERATORS[type]!;

  const outFile = path.join(contentRoot(), "sorular", args.examId, gen.fileName);
  if (existsSync(outFile)) throw new Error(`${outFile} zaten var; üzerine yazılmaz. Farklı bir --sinav kullan ya da dosyayı taşı.`);

  const started = Date.now();
  const client = createGeminiClient(apiKey, process.env.GEMINI_MODEL || undefined);
  const r = await generateQuestions({ pdf: new Uint8Array(await readFile(args.pdf)), answers, type, examId: args.examId, client });

  // Yazma yalnızca bütün model çağrıları bittikten sonra: hata olursa hiçbir dosya yazılmaz.
  if (r.ready.length) {
    const file = QuestionFile.parse({
      schema_version: "0.1",
      exam: { id: args.examId, name: args.name ?? args.examId, date: args.date },
      questions: r.ready,
    });
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, JSON.stringify(file, null, 2) + "\n", "utf8");
  }
  // Önceki çalışmanın inceleme raporu her durumda kenara alınır: ezilmez, güncelmiş gibi de kalmaz.
  const reviewFile = path.resolve(process.cwd(), "..", "..", "data", "raw", args.examId, "inceleme.json");
  const archived = await archiveExisting(reviewFile, new Date());
  if (archived) console.log(`Önceki inceleme raporu kenara alındı: ${archived}`);
  if (r.review.length) {
    await mkdir(path.dirname(reviewFile), { recursive: true });
    await writeFile(reviewFile, JSON.stringify(r.review, null, 2) + "\n", "utf8");
  }

  const asked = r.ready.length + r.review.length;
  console.log(`${asked} soru istendi: ${r.ready.length} hazır, ${r.review.length} inceleme, ${r.skipped.length} atlandı (${Math.round((Date.now() - started) / 1000)} sn)`);
  if (r.ready.length) console.log(`→ ${outFile}`);
  if (r.skipped.length) console.log(`Atlanan (anahtarda yok): ${r.skipped.join(", ")}`);
  for (const item of r.review) console.log(`  q${item.number}: ${item.reason} — ${item.detail.split("\n")[0]}`);
  if (r.review.length) console.log(`→ ${reviewFile}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Hata:", e?.message ?? e);
  process.exit(1);
});
