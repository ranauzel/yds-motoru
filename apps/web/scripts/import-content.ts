// Soru JSON'larını doğrular ve questions tablosuna yazar. Aynı soru tekrar gelirse günceller.
// Kullanım:
//   pnpm content:import --sahip ben@ornek.com         content/sorular → yalnızca o hesap görür
//   pnpm content:import                               content/sorular yoksa content/ornek → herkese açık
//   pnpm content:import <klasör> [--sahip e-posta]
// Örnek sorular (içerik kökündeki ornek klasörü) herkese açıktır; gerçek sorular --sahip ister ve
// yalnızca o hesaba görünür. Başka hesaba ait sorular devralınamaz (bkz. lib/content/access.ts).
// Dosyadan silinen sorular tablodan silinmez.
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const { eq, sql } = await import("drizzle-orm");
  const { contentDir, contentRoot, isExampleDir, loadQuestionFiles, resolveContentDir } = await import("../lib/content/load");
  const { parseImportArgs } = await import("../lib/content/import-args");
  const { findTakeovers, importAccess } = await import("../lib/content/access");
  const { toQuestionRows } = await import("../lib/content/rows");
  const { db, schema } = await import("../lib/db");
  const { questions, user } = schema;

  const args = parseImportArgs(process.argv.slice(2));
  const dir = args.dir ? resolveContentDir(args.dir) : contentDir();

  let ownerId: string | null = null;
  if (args.owner) {
    const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, args.owner)).limit(1);
    if (!u) throw new Error(`Bu e-postayla hesap yok: ${args.owner} (önce pnpm user:create)`);
    ownerId = u.id;
  }
  const access = importAccess({ isExample: isExampleDir(dir, contentRoot()), ownerId });

  const rows = toQuestionRows(await loadQuestionFiles(dir)).map((r) => ({ ...r, ...access }));
  const existing = new Map(
    (await db.select({ id: questions.id, hash: questions.hash, ownerId: questions.ownerId, isPublic: questions.isPublic }).from(questions))
      .map((r) => [r.id, r]),
  );
  const taken = findTakeovers(existing, rows.map((r) => r.id), access);
  if (taken.length)
    throw new Error(`${taken.length} soru başka bir hesaba ait ya da herkese açık örnek; devralınmaz. İlk birkaçı: ${taken.slice(0, 5).join(", ")}`);

  const changed = rows.filter((r) => {
    const e = existing.get(r.id);
    return !e || e.hash !== r.hash || e.ownerId !== r.ownerId || e.isPublic !== r.isPublic;
  });
  const added = changed.filter((r) => !existing.has(r.id)).length;

  if (changed.length) {
    await db.insert(questions).values(changed).onConflictDoUpdate({
      target: questions.id,
      set: {
        ownerId: sql`excluded.owner_id`, isPublic: sql`excluded.is_public`,
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
