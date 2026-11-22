// content:import argümanları ve soru görünürlüğü kuralı (saf fonksiyonlar, testli).

export function parseImportArgs(argv: string[]): { dir?: string; owner?: string } {
  let dir: string | undefined;
  let owner: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--sahip") {
      owner = argv[++i];
      if (!owner || owner.startsWith("--")) throw new Error("--sahip için e-posta yaz: --sahip ben@ornek.com");
    } else dir = argv[i];
  }
  return { dir, owner };
}

/**
 * Kendi sorusu olan kullanıcı yalnızca kendi sorularını, hiç sorusu olmayan (ör. misafir)
 * yalnızca herkese açık (sahipsiz) örnek soruları görür. Başkasının sorusu asla görünmez.
 */
export function visibleTo(hasOwnQuestions: boolean): "own" | "public" {
  return hasOwnQuestions ? "own" : "public";
}
