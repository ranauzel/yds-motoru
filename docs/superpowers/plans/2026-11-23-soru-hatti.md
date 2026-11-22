# Soru hattı (PDF → Gemini) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `pnpm content:generate` ile bir YDS PDF'i ve cevap anahtarından cümle tamamlama (27–36) sorularını Gemini'ye analiz ettirip mevcut şemaya uygun içerik dosyası üretmek.

**Architecture:**
- Saf bir çekirdek fonksiyon (`generateQuestions`) PDF'i veri olarak ve model istemcisini parametre olarak alır. Analiz ve kör çözüm için iki çağrı yapar, sonucu zod şemasıyla doğrular ve geçen/inceleme sorularını döndürür.
- Komut (`scripts/generate-content.ts`) dosya okuma/yazma ve Gemini bağlantısını yapan ince bir katmandır.

**Tech Stack:** TypeScript, tsx, zod 4 (`z.toJSONSchema`), `@google/genai`, vitest.

**Spec:** [docs/superpowers/specs/2026-11-23-soru-hatti-design.md](../specs/2026-11-23-soru-hatti-design.md)

**Dal:** `soru-hatti`. `soru-erisim-duzeltmeleri` dalının ucundan açılır. Bütün komutlar `apps/web` içinden çalıştırılır.

## Global Constraints

- **Doğru cevap her zaman cevap anahtarından gelir.** Modelin döndürdüğü `answer` alanı yok sayılır.
- **Şemadan ya da kör çözümden geçemeyen soru içerik dosyasına yazılmaz.** Bu sorular `inceleme.json` dosyasına yazılır.
- **ÖSYM içeriği git'e girmez:**
  - Çıktı `<contentRoot>/sorular/<sinav>/` altına yazılır.
  - İnceleme dosyası repo kökündeki `data/raw/<sinav>/` altına yazılır. Bu klasör gitignore'da.
  - Testlerde yalnızca `content/ornek` kullanılır.
- **Soru kimliği biçimi:** `<sinav>-q<numara>` (örn. `2021-yds-1-q28`).
- **İçerik dosyası zaten varsa komut durur ve üzerine yazmaz.**
- **Şema tek kaynak:** Mevcut zod şeması kullanılır, ayrı bir kopyası yazılmaz.
- **Testler ağa çıkmaz:** Gemini yalnızca `createGeminiClient` içinde çağrılır.
- **`review` alanı:** Geçen sorular `{ status: "draft", blind_solve_match: true }` değeriyle yazılır.
- **Dil:** Kullanıcıya görünen bütün metinler Türkçedir (hata mesajları, özet).

## Review Focus

1. **Cevap anahtarında Windows satır sonu (CRLF), boş satır, fazla boşluk ya da küçük harf şık** (`27: c`): kabul edilir. → Görev 1'de test var.
2. **Model istenen bir numarayı döndürmez:** Soru "eksik" gerekçesiyle incelemeye düşer, sessizce kaybolmaz. → Görev 2'de test var.
3. **Model istenmeyen bir numarayı ya da aynı numarayı iki kez döndürür:** İstenmeyen numara yok sayılır, ikinci kopya da yok sayılır. → Görev 2'de test var.
4. **Kör çözüm bir numarayı cevapsız bırakır:** Uyuşmazlık sayılır ve soru incelemeye düşer. → Görev 2'de test var.
5. **Model çağrısı hata verir ya da beklenmeyen bir yapı döner:** Komut anlaşılır bir hata mesajıyla durur ve hiçbir dosya yazmaz. → Çekirdeğin fırlattığı Görev 2'de test ediliyor. Dosya yazılmaması ise yapıdan geliyor: Görev 3'te yazma bütün çağrılar bittikten sonra yapılıyor. Bunun otomatik testi yok, gözden geçirmede kontrol edilecek.

---

### Görev 1: Cevap anahtarı ayrıştırıcı

**Files:**
- Create: `apps/web/lib/content/generate/answer-key.ts`
- Test: `apps/web/lib/content/generate/answer-key.test.ts`

**Interfaces:**
- Produces: `parseAnswerKey(text: string): Map<number, OptionKey>`
  - Geçersiz bir satırda `Error` fırlatır. Hata mesajı satır numarasını ve satırın içeriğini içerir.
  - `OptionKey` tipi `@/lib/content/schema` dosyasından gelir: `z.infer<typeof OptionKey>`.

- [ ] **Step 1: Write the failing tests**

```ts
it("satırları numara → şık olarak okur", () => {
  expect(parseAnswerKey("27: C\n28: a\n")).toEqual(new Map([[27, "C"], [28, "A"]]));
});
it("CRLF, boş satır ve fazla boşluk sorun değil", () => {
  expect(parseAnswerKey("\r\n 27 :  B \r\n\r\n29:E")).toEqual(new Map([[27, "B"], [29, "E"]]));
});
it("A–E dışındaki şık satırıyla birlikte hata verir", () => {
  expect(() => parseAnswerKey("27: F")).toThrow(/27: F/);
});
it("tekrar eden numara hata verir", () => {
  expect(() => parseAnswerKey("27: A\n27: B")).toThrow(/27/);
});
it("1–80 dışındaki numara ya da biçimsiz satır hata verir", () => {
  expect(() => parseAnswerKey("81: A")).toThrow();
  expect(() => parseAnswerKey("yirmi yedi: A")).toThrow();
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `pnpm vitest run lib/content/generate/answer-key.test.ts`
Expected: FAIL, "Cannot find module './answer-key'"

- [ ] **Step 3: `parseAnswerKey` fonksiyonunu yaz.** Her satır trim edilir, boş satırlar atlanır. Satırın biçimi `/^(\d+)\s*:\s*([A-Ea-e])$/` olmalı.

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `pnpm vitest run lib/content/generate/answer-key.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/content/generate/answer-key.ts lib/content/generate/answer-key.test.ts
git commit -m "Soru hattı: cevap anahtarı ayrıştırıcı"
```

---

### Görev 2: Çekirdek `generateQuestions`

**Files:**
- Modify: `apps/web/lib/content/schema.ts`. `Question` nesnesi iki parçaya ayrılır:
  - `export const QuestionBase = z.object({...})`: şimdiki alanlar, değiştirilmeden.
  - `export const Question = QuestionBase.superRefine(...)`: şimdiki kurallar.
  - `export type Question` aynı kalır. Bu ayrım gerekli, çünkü zod 4'te refinement eklenmiş bir nesne üzerinde `.omit` kullanılamıyor.
- Create: `apps/web/lib/content/generate/client.ts`: yalnızca arayüz.
- Create: `apps/web/lib/content/generate/prompts.ts`: tip tablosu ve talimat metinleri.
- Create: `apps/web/lib/content/generate/generate.ts`
- Test: `apps/web/lib/content/generate/generate.test.ts`

**Interfaces:**
- Consumes: Görev 1'deki `parseAnswerKey` sonucu (`Map<number, OptionKey>`).
- Produces (`client.ts`):
  ```ts
  export type JsonRequest = { prompt: string; pdf?: Uint8Array; schema: Record<string, unknown> };
  export interface ModelClient { generateJson(req: JsonRequest): Promise<unknown> }
  ```
- Produces (`prompts.ts`):
  - `GENERATORS: Partial<Record<Question["type"], { range: [number, number]; fileName: string; analysisPrompt(answers: Map<number, OptionKey>): string }>>`
    - Şimdilik tek kayıt var: `cumle_tamamlama: { range: [27, 36], fileName: "cumle-tamamlama.json", ... }`.
  - `blindSolvePrompt(questions: { number: number; stem: string; options: { key: string; text: string }[] }[]): string`
- Produces (`generate.ts`):
  ```ts
  export type ReviewItem = { number: number; reason: "eksik" | "sema" | "kor_cozum"; detail: string; data?: unknown };
  export type GenerateResult = { ready: Question[]; review: ReviewItem[]; skipped: number[] };
  export async function generateQuestions(opts: {
    pdf: Uint8Array; answers: Map<number, OptionKey>; type: Question["type"]; examId: string; client: ModelClient;
  }): Promise<GenerateResult>
  ```
  - `type` için `GENERATORS` içinde bir kayıt yoksa `Error` fırlatır.
  - Modelin döndürdüğü üst düzey yapı geçersizse `Error` fırlatır.

**Davranış (testlerin sabitlediği):**
1. **İstenen numaralar:** Aralıktaki numaralardan anahtarda olanlar istenir. Anahtarda olmayanlar `skipped` listesine girer.
2. **Analiz çağrısı:** `{ prompt, pdf, schema }` ile yapılır.
   - `schema` = `z.toJSONSchema(z.object({ questions: z.array(QuestionBase.omit({ id: true, type: true, answer: true, review: true })) }))`.
   - Dönen değer `{ questions: unknown[] }` yapısında değilse fonksiyon fırlatır.
3. **Her istenen numara için:**
   - İlk kopya alınır. İstenmeyen numaralar ve ikinci kopyalar yok sayılır.
   - Model o numarayı hiç döndürmediyse soru `eksik` gerekçesiyle incelemeye düşer.
   - Model öğesi hattın alanlarıyla birleştirilir: `{ ...item, id: \`${examId}-q${n}\`, number: n, type, answer: answers.get(n), review: { status: "draft", blind_solve_match: true } }`. Hattın alanları sonra yazıldığı için modelinkileri ezer.
   - Sonuç `Question.safeParse` ile doğrulanır. Geçemezse soru `sema` gerekçesiyle incelemeye düşer, `detail` = zod hata mesajı.
4. **Kör çözüm çağrısı:** Şemadan geçen bir soru yoksa yapılmaz. Varsa çağrı **PDF gönderilmeden** yapılır: `{ prompt: blindSolvePrompt(...), schema: z.toJSONSchema(z.object({ answers: z.array(z.object({ number: z.number().int(), choice: OptionKey })) })) }`. Talimatta cevaplar, tuzak kodları ve açıklamalar yer almaz.
5. **Kör çözüm sonucu:** `choice` değeri anahtarla aynıysa soru `ready` listesine girer. Farklıysa ya da o numara cevapsız kalmışsa soru `kor_cozum` gerekçesiyle incelemeye düşer. `detail` alanına modelin seçtiği şık ve doğru şık yazılır.
6. **`ready` listesi** numaraya göre sıralı döner.

- [ ] **Step 1: `schema.ts` dosyasında `QuestionBase` / `Question` ayrımını yap, mevcut testlerin hâlâ geçtiğini gör**

Run: `pnpm vitest run`
Expected: Mevcut 99 testin hepsi PASS

- [ ] **Step 2: Başarısız testleri yaz**

Test düzeni:
- Örnek veri: `loadQuestions(<repo>/content/ornek)` ile `ornek-q1` alınır. Bu sorudan `id`, `type`, `answer` ve `review` alanları çıkarılıp `number: 27` verilerek bir model öğesi (`item27`) oluşturulur. `ornek-q1` sorusunun cevabı `B`.
- Sahte istemci: `pdf` alanı varsa analiz çağrısına, yoksa kör çözüm çağrısına cevap verir. Her çağrıyı bir diziye kaydeder.
- Yardımcılar:
  - `run({ analysis, blind, answers })`: `calls` dizisini sıfırlar. `{ questions: analysis }` ve `{ answers: blind }` dönen sahte istemciyle `generateQuestions({ pdf: new Uint8Array([1]), answers: parseAnswerKey(answers), type: "cumle_tamamlama", examId: "2021-yds-1", client })` çağırır.
  - `runRaw({ analysisRaw, answers })`: aynı işi yapar, ama analiz çağrısında `analysisRaw` değerini olduğu gibi döner.

```ts
it("geçen soru hattın alanlarıyla ve draft olarak döner", async () => {
  const r = await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
  expect(r.ready).toHaveLength(1);
  expect(r.ready[0]).toMatchObject({ id: "2021-yds-1-q27", number: 27, type: "cumle_tamamlama", answer: "B",
    review: { status: "draft", blind_solve_match: true } });
});
it("modelin answer alanı yok sayılır, cevap anahtardan gelir", async () => {
  const r = await run({ analysis: [{ ...item27, answer: "A" }], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
  expect(r.ready[0].answer).toBe("B");
});
it("anahtarda olmayan numara atlanır ve modelden istenmez", async () => {
  const r = await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
  expect(r.skipped).toEqual([28, 29, 30, 31, 32, 33, 34, 35, 36]);
  expect(calls[0].prompt).toMatch(/27: B/);    // istenen satır biçimi: "<numara>: <şık>"
  expect(calls[0].prompt).not.toMatch(/\b28:/);
});
it("model istenen numarayı döndürmezse eksik olarak incelemeye düşer", async () => {
  const r = await run({ analysis: [], blind: [], answers: "27: B" });
  expect(r.review).toEqual([expect.objectContaining({ number: 27, reason: "eksik" })]);
});
it("istenmeyen numara ve ikinci kopya yok sayılır", async () => {
  const r = await run({ analysis: [item27, { ...item27, stem: "x" }, { ...item27, number: 5 }],
    blind: [{ number: 27, choice: "B" }], answers: "27: B" });
  expect(r.ready.map((q) => q.stem)).toEqual([item27.stem]);
  expect(r.review).toEqual([]);
});
it("şemadan geçmeyen soru (doğru şıkta tuzak kodu) incelemeye düşer ve kör çözüme gitmez", async () => {
  const bad = { ...item27, options: item27.options.map((o) => (o.key === "B" ? { ...o, traps: ["T1"] } : o)) };
  const r = await run({ analysis: [bad], blind: [], answers: "27: B" });
  expect(r.review[0]).toMatchObject({ number: 27, reason: "sema" });
  expect(calls).toHaveLength(1); // kör çözüm çağrısı yapılmadı
});
it("kör çözüm uyuşmazsa ya da numara cevapsız kalırsa incelemeye düşer", async () => {
  const wrong = await run({ analysis: [item27], blind: [{ number: 27, choice: "D" }], answers: "27: B" });
  expect(wrong.review[0]).toMatchObject({ number: 27, reason: "kor_cozum" });
  expect(wrong.ready).toEqual([]);
  const missing = await run({ analysis: [item27], blind: [], answers: "27: B" });
  expect(missing.review[0]).toMatchObject({ number: 27, reason: "kor_cozum" });
});
it("kör çözüme PDF, cevap ve tuzak kodları gönderilmez", async () => {
  await run({ analysis: [item27], blind: [{ number: 27, choice: "B" }], answers: "27: B" });
  expect(calls[1].pdf).toBeUndefined();
  expect(calls[1].prompt).not.toMatch(/T\d{1,2}\b/);
});
it("model beklenmeyen yapı dönerse fırlatır", async () => {
  await expect(runRaw({ analysisRaw: { foo: 1 }, answers: "27: B" })).rejects.toThrow();
});
```

- [ ] **Step 3: Testleri çalıştır, başarısız olduklarını gör**

Run: `pnpm vitest run lib/content/generate/generate.test.ts`
Expected: FAIL, "Cannot find module './generate'"

- [ ] **Step 4: `client.ts`, `prompts.ts` ve `generate.ts` dosyalarını yaz.**

`analysisPrompt` şunları içerir:
- istenen numaralar ve doğru şıkları
- talimat: "Yalnızca bu numaraları PDF'ten birebir çıkar ve analiz et; tüm açıklamalar Türkçe"
- [docs/TASARIM.md](../../TASARIM.md) içindeki §4 tuzak kataloğu tablosu ve §5.4 cümle tamamlama kartı, **birebir kopyalanmış** olarak
- şema kuralları:
  - doğru şıkta `traps` boş, yanlış şıkta en az bir kod
  - `stem_chunks` dizisinin `en` alanları birleştirilince `stem` metnini vermeli
  - `topic` alanı `TOPICS` listesinden
  - ısınma kelimeleri `warmup: true` ile işaretli
- biçim örneği olarak `ornek-q1` sorusu (JSON, `id`, `type`, `answer` ve `review` alanları olmadan) sabit bir metin olarak

- [ ] **Step 5: Testleri çalıştır, geçtiklerini gör**

Run: `pnpm vitest run`
Expected: Bütün testler PASS

- [ ] **Step 6: Commit**

```bash
git add lib/content/schema.ts lib/content/generate/
git commit -m "Soru hattı: generateQuestions çekirdeği (analiz + şema + kör çözüm)"
```

---

### Görev 3: Gemini bağlantısı ve `content:generate` komutu

**Files:**
- Create: `apps/web/lib/content/generate/gemini.ts`
- Create: `apps/web/lib/content/generate/args.ts`
- Test: `apps/web/lib/content/generate/args.test.ts`
- Create: `apps/web/scripts/generate-content.ts`
- Modify: `apps/web/package.json`:
  - `"content:generate": "tsx scripts/generate-content.ts"` betiği eklenir.
  - `@google/genai` bağımlılığı eklenir (`pnpm add @google/genai`).
- Modify: `apps/web/.env.example`:
  - `# Soru hattı (pnpm content:generate). https://aistudio.google.com/apikey` açıklamasıyla `GEMINI_API_KEY=` satırı eklenir.
  - `# GEMINI_MODEL=` satırı eklenir.
- Modify: `README.md`, "Yeni soru ekleme" bölümünün 2. adımı:
  - `pnpm content:generate data/raw/<sinav>.pdf --anahtar data/raw/<sinav>-anahtar.txt --sinav <sinav>` komutu birinci yol olarak eklenir. Elle yazma ikinci yol olarak kalır.
  - `inceleme.json` dosyasının ne olduğu bir satırla açıklanır.

**Interfaces:**
- Consumes:
  - Görev 1'deki `parseAnswerKey`
  - Görev 2'deki `generateQuestions`, `GENERATORS`, `ModelClient`, `GenerateResult`
  - Mevcut `contentRoot()` (`lib/content/load.ts`)
- Produces:
  - `createGeminiClient(apiKey: string, model: string): ModelClient`
  - `parseGenerateArgs(argv: string[]): { pdf: string; key: string; examId: string; name?: string; date: string }`
    - Bayraklar: `--anahtar`, `--sinav`, `--ad`, `--tarih`.
    - İlk bayraksız argüman PDF yoludur.
    - Zorunlu olanlar: PDF yolu, `--anahtar`, `--sinav` ve `--tarih`. Biri eksikse `Error` fırlatır, hata mesajı kullanım satırını içerir.
    - `--tarih` neden zorunlu: `content:import` bu değeri veritabanında `NOT NULL` tanımlı bir `date` kolonuna yazıyor, boş değer orada hata verir.
    - `--tarih` değeri `YYYY-MM-DD` biçiminde olmalı.
    - `--sinav` değeri yalnızca küçük harf, rakam ve `-` içerebilir. Bu kural, yol içinde `../` gibi tehlikeli değerleri önler.

- [ ] **Step 1: `parseGenerateArgs` için başarısız testleri yaz**

```ts
it("pdf, anahtar, sınav, ad ve tarih okunur", () => {
  expect(parseGenerateArgs(["a.pdf", "--anahtar", "k.txt", "--sinav", "2021-yds-1", "--ad", "2021 YDS/1", "--tarih", "2021-04-04"]))
    .toEqual({ pdf: "a.pdf", key: "k.txt", examId: "2021-yds-1", name: "2021 YDS/1", date: "2021-04-04" });
});
it("pdf, --anahtar, --sinav ya da --tarih eksikse kullanım satırıyla hata", () => {
  expect(() => parseGenerateArgs(["--anahtar", "k.txt", "--sinav", "x", "--tarih", "2021-04-04"])).toThrow(/content:generate/);
  expect(() => parseGenerateArgs(["a.pdf", "--sinav", "x", "--tarih", "2021-04-04"])).toThrow(/--anahtar/);
  expect(() => parseGenerateArgs(["a.pdf", "--anahtar", "k.txt", "--sinav", "x"])).toThrow(/--tarih/);
});
it("geçersiz sınav kimliği ve tarih reddedilir", () => {
  expect(() => parseGenerateArgs(["a.pdf", "--anahtar", "k", "--sinav", "../x"])).toThrow();
  expect(() => parseGenerateArgs(["a.pdf", "--anahtar", "k", "--sinav", "x", "--tarih", "4 Nisan"])).toThrow();
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `pnpm vitest run lib/content/generate/args.test.ts`
Expected: FAIL, "Cannot find module './args'"

- [ ] **Step 3: `args.ts` dosyasını yaz, testi çalıştır, geçtiğini gör**

Run: `pnpm vitest run lib/content/generate/args.test.ts`
Expected: PASS

- [ ] **Step 4: `gemini.ts` dosyasını yaz.**
  - `@google/genai` ile çalışır. PDF, `inlineData` olarak (`application/pdf`, base64) gönderilir.
  - JSON çıktısı, yapılandırılmış çıktı ayarlarıyla `schema` üzerinden istenir.
  - Dönen metin `JSON.parse` ile çözülür.
  - SDK alan adları ve varsayılan model adı güncel Gemini belgelerinden doğrulanır. Varsayılan model, kaliteli bir PDF/akıl yürütme modeli olur. `GEMINI_MODEL` ortam değişkeni bunu geçersiz kılar.
  - Bu dosya birim testine girmez. Görev 4'te gerçek bir çağrıyla denenir.

- [ ] **Step 5: `scripts/generate-content.ts` komutunu yaz.** Sırası:
  1. `dotenv` ile `.env.local` yüklenir. `import-content.ts` dosyasıyla aynı yöntem kullanılır: önce dotenv yüklenir, sonra dinamik import yapılır.
  2. `GEMINI_API_KEY` yoksa komut şu mesajla durur: "GEMINI_API_KEY tanımlı değil (apps/web/.env.local)".
  3. Argümanlar okunur, anahtar dosyası okunup ayrıştırılır.
  4. Çıktı yolu belirlenir: `path.join(contentRoot(), "sorular", examId, GENERATORS.cumle_tamamlama.fileName)`. Bu dosya varsa komut **herhangi bir model çağrısı yapmadan** şu mesajla durur: "<yol> zaten var; üzerine yazılmaz. Farklı bir --sinav kullan ya da dosyayı taşı."
  5. PDF okunur ve `generateQuestions` çağrılır. Bu adım hata verirse komut "Hata: …" mesajıyla durur ve `process.exit(1)` ile çıkar. Hiçbir dosya yazılmamış olur.
  6. Yazma:
     - `ready` boş değilse sorular `QuestionFile` biçiminde yazılır: `{ schema_version: "0.1", exam: { id: examId, name: name ?? examId, date }, questions: ready }`. Dosya yazılmadan önce `QuestionFile.parse` ile bir kez daha doğrulanır, klasör `mkdir -p` ile açılır.
     - `review` boş değilse liste `<repo>/data/raw/<sinav>/inceleme.json` dosyasına yazılır. Yol: `path.resolve(process.cwd(), "..", "..", "data", "raw", examId)`.
  7. Özet yazdırılır: `"<n> soru istendi: <ready> hazır, <review> inceleme, <skipped> atlandı"`. Ardından inceleme listesindeki her soru için bir satır: `"  q<numara>: <gerekçe> — <detay ilk satırı>"`.

- [ ] **Step 6: Bütün kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0

- [ ] **Step 7: Anahtarsız deneme**

Run: `pnpm content:generate x.pdf --anahtar x.txt --sinav deneme --tarih 2021-01-01` (`GEMINI_API_KEY` boşken)
Expected: "GEMINI_API_KEY tanımlı değil" mesajı, çıkış kodu 1

- [ ] **Step 8: Commit**

```bash
git add lib/content/generate/ scripts/generate-content.ts package.json pnpm-lock.yaml .env.example ../../README.md
git commit -m "Soru hattı: Gemini istemcisi ve content:generate komutu"
```

---

### Görev 4: Kabul — 2021-yds-1 ile uçtan uca deneme (elle, kullanıcıyla)

**Ön koşullar:**
- Kullanıcı `data/raw/2021-yds-1.pdf` ve `data/raw/2021-yds-1-anahtar.txt` dosyalarını koyar.
- Kullanıcı `GEMINI_API_KEY` anahtarını `apps/web/.env.local` dosyasına yazar.

- [ ] **Step 1: Hattı çalıştır**

Run: `pnpm content:generate ../../data/raw/2021-yds-1.pdf --anahtar ../../data/raw/2021-yds-1-anahtar.txt --sinav 2021-yds-1-deneme --ad "2021 YDS/1 (deneme)" --tarih 2021-04-04`
Expected: Özet satırı yazdırılır, `content/sorular/2021-yds-1-deneme/cumle-tamamlama.json` dosyası oluşur. Süre not edilir.

- [ ] **Step 2: Elle hazırlanmış dosyayla otomatik karşılaştırma**

Tek seferlik bir betik çalıştırılır (`node -e` ya da geçici bir `tsx` dosyası, repoya girmez). Betik iki dosyada aynı `number` değerine sahip soruların `stem`, `options[].text` ve `answer` alanlarını boşlukları normalleştirerek karşılaştırır.
Expected: Bütün ortak sorularda bu üç alan aynı. Fark varsa farklı sorular listelenir ve kullanıcıya gösterilir.

- [ ] **Step 3: Göz kontrolü**

Kullanıcıya şunlar gösterilir: 2–3 soruda tuzak kodları, açıklamalar, altın kural ve kelimeler, elle hazırlanmış karşılıklarıyla yan yana. Kullanıcıya şu sorulur: "Bunlarla düzeltme yapmadan çalışabilir misin?" Cevap ve inceleme listesine düşen sorular not edilir.

- [ ] **Step 4: Soru sırası ve maliyet**

- PDF'te 27–36 arasındaki soruların gerçekten cümle tamamlama olduğu doğrulanır (TASARIM §5'teki tablo).
- Gemini konsolundan çalıştırmanın maliyeti not edilir.
- Deneme klasörü (`content/sorular/2021-yds-1-deneme/`) silinir. Bu çıktı veritabanına aktarılmaz.

- [ ] **Step 5: Sonuçları kullanıcıya raporla**

Rapor şunları içerir: kaç soru hazır, kaç soru incelemede, fark bulunan alanlar, süre ve maliyet. Talimatta iyileştirme gerekiyorsa bu ayrı bir iş olarak önerilir.
