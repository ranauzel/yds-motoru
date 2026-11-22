// Soru JSON'larını doğrular ve questions tablosuna yazar. Aynı soru tekrar gelirse günceller.
// Kullanım: pnpm content:import [klasör]   (varsayılan: content/sorular, yoksa content/ornek)
// Dosyadan silinen sorular tablodan silinmez (eski cevaplar onlara bağlı kalır).
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const { sql } = await import("drizzle-orm");
  const { contentDir, loadQuestionFiles, resolveContentDir } = await import("../lib/content/load");
  const { toQuestionRows } = await import("../lib/content/rows");
  const { db, schema } = await import("../lib/db");

  const arg = process.argv[2];
  const dir = arg ? resolveContentDir(arg) : contentDir();
  const rows = toQuestionRows(await loadQuestionFiles(dir));

  const existing = new Map(
    (await db.select({ id: schema.questions.id, hash: schema.questions.hash }).from(schema.questions))
      .map((r) => [r.id, r.hash]),
  );
  const changed = rows.filter((r) => existing.get(r.id) !== r.hash);
  const added = changed.filter((r) => !existing.has(r.id)).length;

  if (changed.length) {
    await db.insert(schema.questions).values(changed).onConflictDoUpdate({
      target: schema.questions.id,
      set: {
        examId: sql`excluded.exam_id`, examName: sql`excluded.exam_name`, examDate: sql`excluded.exam_date`,
        number: sql`excluded.number`, type: sql`excluded.type`, topic: sql`excluded.topic`,
        status: sql`excluded.status`, data: sql`excluded.data`, hash: sql`excluded.hash`, updatedAt: sql`now()`,
      },
    });
  }
  console.log(`${dir}\n${rows.length} soru okundu: ${added} yeni, ${changed.length - added} güncellendi, ${rows.length - changed.length} aynı.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Hata:", e?.message ?? e);
  process.exit(1);
});
