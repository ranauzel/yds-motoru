// Sunucu tarafı içerik yükleyici: content/sorular/**/*.json dosyalarını okur ve doğrular.
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { QuestionFile, type Question } from "./schema";

/** Gerçek sorular content/sorular'da (git dışı, ayrı private repo). Yoksa repodaki örnek içerik kullanılır. */
export function resolveContentDir(root: string): string {
  return existsSync(path.join(root, "sorular")) ? root : path.join(root, "ornek");
}

export const contentDir = () =>
  process.env.CONTENT_DIR ?? resolveContentDir(path.resolve(process.cwd(), "..", "..", "content"));

export async function loadQuestionFiles(dir = contentDir()): Promise<QuestionFile[]> {
  const root = path.join(dir, "sorular");
  const files: string[] = [];
  for (const exam of await readdir(root, { withFileTypes: true })) {
    if (!exam.isDirectory()) continue;
    for (const f of await readdir(path.join(root, exam.name)))
      if (f.endsWith(".json")) files.push(path.join(root, exam.name, f));
  }
  return Promise.all(files.sort().map(async (f) => {
    const parsed = QuestionFile.safeParse(JSON.parse(await readFile(f, "utf8")));
    if (!parsed.success) throw new Error(`Geçersiz içerik: ${f}\n${parsed.error.message}`);
    return parsed.data;
  }));
}

export async function loadQuestions(dir?: string): Promise<Question[]> {
  return (await loadQuestionFiles(dir)).flatMap((f) => f.questions);
}
