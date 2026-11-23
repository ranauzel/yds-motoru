// Komutun dosya yardımcıları.
import { existsSync } from "node:fs";
import { rename } from "node:fs/promises";
import path from "node:path";

/**
 * Var olan dosyayı silmeden kenara alır: inceleme.json → inceleme.2026-11-23T10-15-30.json.
 * Böylece önceki çalışmanın raporu (ve üzerinde yapılmış notlar) ne ezilir ne de güncelmiş gibi kalır.
 */
export async function archiveExisting(file: string, now: Date): Promise<string | null> {
  if (!existsSync(file)) return null;
  const stamp = now.toISOString().slice(0, 19).replace(/:/g, "-");
  const { dir, name, ext } = path.parse(file);
  const target = path.join(dir, `${name}.${stamp}${ext}`);
  await rename(file, target);
  return target;
}
