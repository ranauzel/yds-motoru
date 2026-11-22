// Soru JSON'larını doğrular ve questions tablosuna yazar. Aynı soru tekrar gelirse günceller.
// Kullanım:
//   pnpm content:import --sahip ben@ornek.com         content/sorular → yalnızca o hesap görür
//   pnpm content:import                               content/sorular yoksa content/ornek → herkese açık
//   pnpm content:import <klasör> [--sahip e-posta]
// Gerçek sorular (örnek klasörü dışındaki her şey) sahip belirtmeden aktarılamaz; ÖSYM soruları
// böylece yanlışlıkla herkese açılmaz. Dosyadan silinen sorular tablodan silinmez.
import path from "node:path";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const { eq, sql } = await import("drizzle-orm");
  const { contentDir, loadQuestionFiles, resolveContentDir } = await import("../lib/content/load");
  const { parseImportArgs } = await import("../lib/content/import-args");
  const { toQuestionRows } = await import("../lib/content/rows");
  const { db, schema } = await import("../lib/db");

  const args = parseImportArgs(process.argv.slice(2));
  const dir = args.dir ? resolveContentDir(args.dir) : contentDir();
  const isExample = path.basename(dir) === "ornek";

  let ownerId: string | null = null;
  if (args.owner) {
    const [u] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, args.owner)).limit(1);
    if (!u) throw new Error(`Bu e-postayla hesap yok: ${args.owner} (önce pnpm user:create)`);
    ownerId = u.id;
  } else if (!isExample) {
    throw new Error(`${dir}\nGerçek sorular sahip belirtmeden aktarılmaz (herkese açılmasınlar diye). Şöyle çalıştır:\n  pnpm content:import --sahip <e-postan>`);
  }

  const rows = toQuestionRows(await loadQuestionFiles(dir)).map((r) => ({ ...r, ownerId }));
  const existing = new Map(
    (await db.select({ id: schema.questions.id, hash: schema.questions.hash, ownerId: schema.questions.ownerId }).from(schema.questions))
      .map((r) => [r.id, r]),
  );
  const changed = rows.filter((r) => {
    const e = existing.get(r.id);
    return !e || e.hash !== r.hash || e.ownerId !== r.ownerId;
  });
  const added = changed.filter((r) => !existing.has(r.id)).length;

  if (changed.length) {
    await db.insert(schema.questions).values(changed).onConflictDoUpdate({
      target: schema.questions.id,
      set: {
        ownerId: sql`excluded.owner_id`,
        examId: sql`excluded.exam_id`, examName: sql`excluded.exam_name`, examDate: sql`excluded.exam_date`,
        number: sql`excluded.number`, type: sql`excluded.type`, topic: sql`excluded.topic`,
        status: sql`excluded.status`, data: sql`excluded.data`, hash: sql`excluded.hash`, updatedAt: sql`now()`,
      },
    });
  }
  const who = ownerId ? "yalnızca sahibi görür" : "herkese açık örnek";
  console.log(`${dir} (${who})\n${rows.length} soru okundu: ${added} yeni, ${changed.length - added} güncellendi, ${rows.length - changed.length} aynı.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Hata:", e?.message ?? e);
  process.exit(1);
});
