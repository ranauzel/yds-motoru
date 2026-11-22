// content:import argümanları (saf fonksiyon, testli).

export function parseImportArgs(argv: string[]): { dir?: string; owner?: string } {
  let dir: string | undefined;
  let owner: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--sahip") {
      owner = argv[++i]?.trim().toLowerCase();
      if (!owner || owner.startsWith("--")) throw new Error("--sahip için e-posta yaz: --sahip ben@ornek.com");
    } else dir = argv[i];
  }
  return { dir, owner };
}
