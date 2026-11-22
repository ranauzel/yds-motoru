// content:generate argümanları (saf fonksiyon, testli).

export const GENERATE_USAGE =
  'Kullanım: pnpm content:generate <sinav.pdf> --anahtar <cevaplar.txt> --sinav <id> --tarih YYYY-MM-DD [--ad "<sınav adı>"]';

const FLAGS = { "--anahtar": "key", "--sinav": "examId", "--ad": "name", "--tarih": "date" } as const;
type Field = (typeof FLAGS)[keyof typeof FLAGS];

export function parseGenerateArgs(argv: string[]): { pdf: string; key: string; examId: string; name?: string; date: string } {
  const out: Partial<Record<Field | "pdf", string>> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a in FLAGS) {
      const v = argv[++i];
      if (!v || v.startsWith("--")) throw new Error(`${a} için değer yaz.\n${GENERATE_USAGE}`);
      out[FLAGS[a as keyof typeof FLAGS]] = v;
    } else if (!out.pdf) out.pdf = a;
    else throw new Error(`Beklenmeyen argüman: ${a}\n${GENERATE_USAGE}`);
  }

  const { pdf, key, examId, name, date } = out;
  if (!pdf) throw new Error(`PDF dosyasını yaz.\n${GENERATE_USAGE}`);
  if (!key) throw new Error(`--anahtar eksik.\n${GENERATE_USAGE}`);
  if (!examId) throw new Error(`--sinav eksik.\n${GENERATE_USAGE}`);
  if (!date) throw new Error(`--tarih eksik (veritabanına sınav tarihi olarak yazılır).\n${GENERATE_USAGE}`);
  // Sınav kimliği klasör adı olur: yalnızca küçük harf, rakam ve "-" (../ gibi yollar giremez).
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(examId)) throw new Error(`--sinav yalnızca küçük harf, rakam ve "-" içerebilir: ${examId}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`--tarih YYYY-MM-DD biçiminde olmalı: ${date}`);
  return { pdf, key, examId, ...(name ? { name } : {}), date };
}
