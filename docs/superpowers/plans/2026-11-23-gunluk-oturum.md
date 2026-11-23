# Günlük oturum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Her gün otomatik açılan tek oturum. Oturumda kelime tekrarı, zamanı gelen sorular, yeni sorular ve günün özeti bulunur.

**Architecture:**
- **Saf mantık (birim testli):**
  - gün anahtarı ve gün sonu, seri hesabı (`day.ts`)
  - soru ve kelime seçimi (`rules.ts`)
  - kelime tekrarı bölümü (`session-machine.ts`, `REVIEW_BLOCK = -1` ile mevcut ısınma altyapısı üzerinden)
- **Veritabanı tarafı (`server.ts` / `actions.ts`):** Oturum açılırken içerik bir kez seçilir ve `practice_sessions` satırına kaydedilir. Satırda yeni `day` ve `review_words` kolonları var, `(user_id, day)` benzersiz.
- **Arayüz:** Ana sayfa dört durumdan birini gösterir. Özet ekranı yeni bilgileri gösterir.

**Tech Stack:** Next.js 16 (cacheComponents), TypeScript, Drizzle/Postgres, zod 4, vitest.

**Spec:** [docs/superpowers/specs/2026-11-23-gunluk-oturum-design.md](../specs/2026-11-23-gunluk-oturum-design.md)

**Dal:** `gunluk-oturum`. Komutlar `apps/web` içinden çalıştırılır.

## Global Constraints

- **Sabitler** (tek yerde, `rules.ts` ve `session-machine.ts`):
  - `DAILY_QUESTIONS = 10`, `MAX_DUE_QUESTIONS = 6`, `DAILY_REVIEW_WORDS = 15`
  - `WARM_MAX` 30 → **8**
- **Gün sınırı:** `Europe/Istanbul`, 00:00.
- **Zamanı gelme ölçütü:** `dueAt < dayEnd(now)`.
- **Günde tek oturum:** `(user_id, day)` benzersiz indeks + `onConflictDoNothing`.
- **İçerik bir kez seçilir:** oturum açılırken seçilir ve satıra kaydedilir. Gün içinde yeniden açılınca aynı içerik gelir.
- **Görünürlük:** Yalnızca `getAllQuestions(userId)` fonksiyonunun döndürdüğü sorular kullanılır.
- **Mimari:** `session-machine.ts` saf kalır, React ve veritabanı içermez. Server action girdileri zod ile doğrulanır (`inputs.ts`).
- **Metinler:** Kullanıcıya görünen metinler Türkçe, kısa ve cezalandırıcı olmayan bir dille yazılır.

## Review Focus

1. **Aynı anda iki istek:** İki sekmeden aynı anda "Başla"ya basılır. Tek satır oluşur ve iki sekme de aynı oturuma gider. → Otomatik testi yok. Task 4 Step 4'te elle denenir.
2. **Gün dönümü:** Gece 00:00'dan sonra açılan sayfa, bugünün yeni oturumunu gösterir. Dünün yarım kalan oturumu ana sayfada görünmez. → `todayKey` sınır testi Task 1'de var. Ana sayfa davranışı Task 4 Step 4'te elle denenir.
3. **Sadece kelime olan oturum:** Önce kelime tekrarı, sonra özet gelir. Oturum "bitti" sayılır ve seri artar. → Durum makinesi testi Task 2'de var. Sunucuda `finishedAt` yazılması Task 4 Step 4'te elle denenir.
4. **Kelime tekrarında "Atla":** Bölüm biter ve sorulara geçilir. Sayfa yeniden açılınca tekrar bölümü bir daha gösterilmez. → Task 2'de test var.
5. **Görünmeyen review kaydı:** Silinmiş ya da başkasına ait bir soruya ait `review` satırı seçime girmez. → Task 1'de test var.

---

### Task 1: Gün, seri ve seçim fonksiyonları (saf)

**Files:**
- Create: `apps/web/features/session/day.ts`
- Test: `apps/web/features/session/day.test.ts`
- Modify: `apps/web/features/session/rules.ts`. `pickSessionQuestions` silinir. Yerine aşağıdaki fonksiyonlar ve sabitler gelir.
- Modify: `apps/web/features/session/rules.test.ts`

**Interfaces:**
- Produces (`day.ts`):
  - `todayKey(now: Date): string`: İstanbul'a göre `YYYY-MM-DD`. Bunun için `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" })` kullanılır.
  - `dayEnd(now: Date): Date`: İstanbul'da ertesi günün 00:00 anı. Türkiye sabit UTC+3 olduğu için şu şekilde hesaplanır: `new Date(\`${ertesiGünKey}T00:00:00+03:00\`)`.
  - `streakDays(finishedDays: string[], today: string): number`
    - Bugün bitmişse sayım bugünden geriye doğru yapılır, bitmemişse dünden geriye doğru.
    - Ardışık günler sayılır, ilk boşlukta sayım durur.
- Produces (`rules.ts`):
  - `export type ReviewRow = { itemId: string; dueAt: Date; priority: boolean; reps: number }`
  - `export const DAILY_QUESTIONS = 10, MAX_DUE_QUESTIONS = 6, DAILY_REVIEW_WORDS = 15`
  - `pickDailyQuestions(o: { questionIds: string[]; reviews: ReviewRow[]; dueBefore: Date; size: number; maxDue: number }): string[]`
  - `pickReviewWords(o: { reviews: ReviewRow[]; known: Set<string>; dueBefore: Date; size: number }): string[]`
    - `known`: anlamı bilinen kelimeler, yani `vocabByWord` haritasının anahtarları.
  - `vocabByWord(questions: Question[]): Map<string, Question["vocab"][number]>`: bir kelime ilk görüldüğü sorudaki girdiyle tutulur.
  - `WARMUP_GRADE` ve `applyAdvance` aynen kalır.

- [ ] **Step 1: Başarısız testleri yaz**

`day.test.ts`:
```ts
it("todayKey İstanbul gününe göre: UTC 21:30 ertesi gün, 20:59 aynı gün", () => {
  expect(todayKey(new Date("2026-11-23T21:30:00Z"))).toBe("2026-11-24");
  expect(todayKey(new Date("2026-11-23T20:59:00Z"))).toBe("2026-11-23");
});
it("dayEnd İstanbul'da ertesi günün 00:00'ı", () => {
  expect(dayEnd(new Date("2026-11-23T08:00:00+03:00")).toISOString()).toBe("2026-11-23T21:00:00.000Z");
});
it("seri: bugün bitmişse bugünden, bitmemişse dünden geriye ardışık günler", () => {
  expect(streakDays(["2026-11-21", "2026-11-22", "2026-11-23"], "2026-11-23")).toBe(3);
  expect(streakDays(["2026-11-21", "2026-11-22"], "2026-11-23")).toBe(2);
  expect(streakDays(["2026-11-20", "2026-11-22", "2026-11-23"], "2026-11-23")).toBe(2);
  expect(streakDays([], "2026-11-23")).toBe(0);
});
```

`rules.test.ts` (eski `pickSessionQuestions` testi silinir):
```ts
const D = (s: string) => new Date(s);
const dueBefore = D("2026-11-23T21:00:00Z"); // İstanbul 24 Kasım 00:00
const r = (itemId: string, dueAt: string, reps = 1, priority = false): ReviewRow => ({ itemId, dueAt: D(dueAt), reps, priority });

it("zamanı gelenler priority > reps > dueAt sırasıyla, sonra yeniler içerik sırasıyla", () => {
  const ids = ["a", "b", "c", "d", "n1", "n2"];
  const reviews = [r("a", "2026-11-20T00:00:00Z", 3), r("b", "2026-11-22T00:00:00Z", 0), r("c", "2026-11-23T10:00:00Z", 0, true), r("d", "2026-11-21T00:00:00Z", 0)];
  expect(pickDailyQuestions({ questionIds: ids, reviews, dueBefore, size: 10, maxDue: 6 })).toEqual(["c", "d", "b", "a", "n1", "n2"]);
});
it("gün içinde daha sonra zamanı gelen de bugün sayılır; yarın gelen sayılmaz", () => {
  const reviews = [r("a", "2026-11-23T18:00:00Z"), r("b", "2026-11-23T21:00:00Z")];
  expect(pickDailyQuestions({ questionIds: ["a", "b"], reviews, dueBefore, size: 10, maxDue: 6 })).toEqual(["a"]);
});
it("zamanı gelenler maxDue ile sınırlı, kalan yer yenilerle dolar", () => {
  const due = ["d1", "d2", "d3"].map((id) => r(id, "2026-11-20T00:00:00Z"));
  expect(pickDailyQuestions({ questionIds: ["d1", "d2", "d3", "n1", "n2", "n3"], reviews: due, dueBefore, size: 4, maxDue: 2 }))
    .toEqual(["d1", "d2", "n1", "n2"]);
});
it("yeni soru yetmezse boşluk zamanı gelenlerle dolar", () => {
  const due = ["d1", "d2", "d3"].map((id) => r(id, "2026-11-20T00:00:00Z"));
  expect(pickDailyQuestions({ questionIds: ["d1", "d2", "d3", "n1"], reviews: due, dueBefore, size: 4, maxDue: 2 }))
    .toEqual(["d1", "d2", "d3", "n1"]);
});
it("görünmeyen soruların review kaydı yok sayılır; aday yoksa boş", () => {
  expect(pickDailyQuestions({ questionIds: ["a"], reviews: [r("gizli", "2026-11-20T00:00:00Z"), r("a", "2026-11-30T00:00:00Z")], dueBefore, size: 10, maxDue: 6 })).toEqual([]);
});
it("kelimeler aynı sırayla, bilinmeyen kelime atlanır, size ile sınırlı", () => {
  const reviews = [r("x", "2026-11-20T00:00:00Z", 2), r("y", "2026-11-22T00:00:00Z", 0), r("bilinmeyen", "2026-11-20T00:00:00Z", 0), r("z", "2026-11-21T00:00:00Z", 0)];
  expect(pickReviewWords({ reviews, known: new Set(["x", "y", "z"]), dueBefore, size: 2 })).toEqual(["z", "y"]);
});
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını gör**

Run: `pnpm vitest run features/session/day.test.ts features/session/rules.test.ts`
Expected: FAIL. `./day` modülü bulunamaz, `pickDailyQuestions` tanımlı değildir.

- [ ] **Step 3: `day.ts` ve `rules.ts` dosyalarını yaz.**

`pickSessionQuestions` kullanan yerler Task 3'te değişiyor. Bu yüzden bu görevde `server.ts` dosyasındaki yeniden dışa aktarma satırından `pickSessionQuestions` çıkarılır. `actions.ts` dosyasındaki `startSession` ise Task 3'e kadar geçici olarak şunu kullanır: `(await getAllQuestions(user.id)).map((q) => q.id)`. Böylece tip kontrolü yeşil kalır.

- [ ] **Step 4: Bütün testleri çalıştır**

Run: `pnpm vitest run; pnpm tsc --noEmit`
Expected: Bütün testler PASS, tsc çıkış kodu 0.

- [ ] **Step 5: Commit**

```bash
git add features/session/day.ts features/session/day.test.ts features/session/rules.ts features/session/rules.test.ts features/session/server.ts features/session/actions.ts
git commit -m "Günlük oturum: gün anahtarı, seri ve soru/kelime seçimi"
```

---

### Task 2: Durum makinesinde kelime tekrarı bölümü

**Files:**
- Modify: `apps/web/features/session/session-machine.ts`
- Modify: `apps/web/features/session/session-machine.test.ts`. Mevcut 29 test geçmeye devam eder. Snapshot fixture'ına yeni alanlar boş değerlerle eklenir.

**Interfaces:**
- Consumes: yok (saf).
- Produces:
  - `export const REVIEW_BLOCK = -1`
  - `WARM_MAX = 8`
  - **`Snapshot` tipine eklenecek alanlar:**
    - `reviewVocab: Question["vocab"]`: bugünün tekrar kelimeleri, sırasıyla, anlamlarıyla birlikte.
    - `streak: number`
    - `newLeft: number`: havuzda kalan yeni soru sayısı.
  - **`buildWarmItems`:**
    - `out[REVIEW_BLOCK]` girdisini de üretir. Şıklar, mevcut kuralla doğru anlam ve diğer anlamlardan 3 tane olacak şekilde oluşturulur. Anlam havuzu soru kelimeleri ile `reviewVocab` girdilerinin birleşimidir.
    - `warmVocab`, `reviewVocab` içindeki kelimeleri blok ısınmasına almaz.
  - **`screenAt`:**
    - `warmItems[REVIEW_BLOCK]` doluysa ve `warmDone` içinde `REVIEW_BLOCK` yoksa, ilk ekran `{ kind: "warmup", block: -1, idx }` ya da `{ kind: "warmupDone", block: -1 }` olur. Bu kontrol pozisyon kontrollerinden **önce** yapılır.
    - Soru sayısı 0 ise ve bölüm bitmişse sıradaki ekran özettir.
  - **`warmEnd` / `warmSkip`:** `screen: { kind: "question" }` yerine `screenAt(...)` döner. Böylece tekrar bölümünden sonra blok 0'ın ısınması, ya da 0 soruda özet gelir.
  - **`summarize`:** dönen nesneye `reviewTotal` (`reviewVocab` sayısı) ve `reviewKnown` (`warmAnswers[word] === true` olan tekrar kelimeleri) eklenir.
  - **Effect türü eklenmez.** Bölüm bittiğinde mevcut `{ kind: "markWarmDone", block: -1 }` effect'i kullanılır. Sadece kelime olan oturumun sunucuda bitirilmesi Task 3'te `markWarmDone` içinde yapılır.

- [ ] **Step 1: Başarısız testleri yaz**

Test düzeni:
- Mevcut test dosyasındaki snapshot yardımcısı genişletilir. `reviewVocab` için iki kelime verilir: `{ word: "rw1", tr: "a1" }` ve `{ word: "rw2", tr: "a2" }`.
- Sorulardan birinin `vocab` listesine `{ word: "rw1", tr: "a1", warmup: true }` girdisi eklenir. Bu, tekrar kelimesinin blok ısınmasından çıkarıldığını sınamak için.

```ts
it("tekrar kelimeleri varsa ilk ekran kelime tekrarı", () => {
  expect(init(snap({ reviewVocab: RV })).screen).toEqual({ kind: "warmup", block: -1, idx: 0 });
});
it("tekrar bitince (warmEnd) blok 0 ısınmasına ya da soruya geçer ve markWarmDone(-1) üretir", () => { /* reduce + effectsFor ile: next.screen.kind !== "warmup" || block === 0; effects içerir { kind: "markWarmDone", block: -1 } */ });
it("Atla tekrar bölümünü bitirir; yeniden açılışta (warmDone: [-1]) tekrar gösterilmez", () => {
  expect(init(snap({ reviewVocab: RV, warmDone: [-1] })).screen.kind).not.toBe("warmup"); // blok 0 ısınması varsa block 0 olmalı
});
it("tekrar kelimesi blok ısınmasında yeniden sorulmaz", () => {
  expect(warmVocab({ ...snap({ reviewVocab: RV }) }, 0).map((v) => v.word)).not.toContain("rw1");
});
it("soru yoksa: önce kelime tekrarı, bitince özet", () => {
  const s0 = init(snap({ questions: [], reviewVocab: RV }));
  expect(s0.screen.kind).toBe("warmup");
  const done = reduce(s0, { type: "warmSkip", now: 1 });
  expect(done.screen).toEqual({ kind: "summary" });
  expect(effectsFor(s0, { type: "warmSkip", now: 1 }, done)).toEqual([{ kind: "markWarmDone", block: -1 }]);
});
it("tekrar kelimesi yoksa davranış eskisi gibi", () => {
  expect(init(snap({ reviewVocab: [] })).screen.kind).not.toBe("warmup" /* block -1 */);
});
it("summarize tekrar sayısını ve bilinenleri verir", () => {
  expect(summarize({ ...snap({ reviewVocab: RV }), warmAnswers: { rw1: true, rw2: false } })).toMatchObject({ reviewTotal: 2, reviewKnown: 1 });
});
```

(Gövdesi yorumla verilen testlerde beklenen değerler yorumda yazıyor. Uygulayan kişi bunları mevcut test dosyasındaki `init` / `reduce` / `effectsFor` kalıbıyla yazar.)

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını gör**

Run: `pnpm vitest run features/session/session-machine.test.ts`
Expected: Yeni testler FAIL, eskiler PASS.

- [ ] **Step 3: `session-machine.ts` değişikliklerini yap.**

Snapshot'a eklenen alanlar Task 3'te `loadSnapshot` tarafından doldurulacak. O zamana kadar tip kontrolünün yeşil kalması için `server.ts` içindeki `loadSnapshot` dönüşüne geçici olarak `reviewVocab: [], streak: 0, newLeft: 0` eklenir.

- [ ] **Step 4: Testleri çalıştır**

Run: `pnpm vitest run; pnpm tsc --noEmit`
Expected: Bütün testler PASS, tsc çıkış kodu 0.

- [ ] **Step 5: Commit**

```bash
git add features/session/session-machine.ts features/session/session-machine.test.ts features/session/server.ts
git commit -m "Günlük oturum: durum makinesinde kelime tekrarı bölümü"
```

---

### Task 3: Veritabanı, günün oturumunu açma ve snapshot

**Files:**
- Modify: `apps/web/lib/db/schema.ts`. `practice_sessions` tablosuna eklenecekler:
  - `day: date("day")`: boş bırakılabilir, `mode: "string"`
  - `reviewWords: jsonb("review_words").$type<string[]>().notNull().default([])`
  - `uniqueIndex("practice_sessions_user_day_uq").on(t.userId, t.day)`
- Create: migration (`pnpm db:generate`)
- Modify: `apps/web/features/session/server.ts`
- Modify: `apps/web/features/session/actions.ts`
- Modify: `apps/web/features/session/inputs.ts`: `WarmDoneInput.block` alanı `z.number().int().min(-1)` olur.
- Modify: `apps/web/features/session/inputs.test.ts`: `-1` kabul edilir, `-2` reddedilir.

**Interfaces:**
- Consumes:
  - Task 1: `todayKey`, `dayEnd`, `streakDays`, `pickDailyQuestions`, `pickReviewWords`, `vocabByWord`, sabitler
  - Task 2: `Snapshot` yeni alanları, `REVIEW_BLOCK`
- Produces (`server.ts`):
  - `planToday(userId: string, now: Date): Promise<{ questionIds: string[]; reviewWords: string[] }>`
    - Kaynaklar: `getAllQuestions`, `review_items` (soru ve kelime), seçim fonksiyonları ve sabitler.
  - `getTodaySession(userId: string, day: string): Promise<PracticeSessionRow | null>`
  - `loadSnapshot`: ek olarak şunları doldurur:
    - `reviewVocab`: `vocabByWord` haritasından, `row.reviewWords` sırasıyla.
    - `streak`: kullanıcının `finishedAt` dolu satırlarının `day` değerleri üzerinden `streakDays(…, todayKey(new Date()))`.
    - `newLeft`: görünür sorulardan `review_items` kaydı olmayanların sayısı.
  - `latestUnfinishedSession` silinir.
- Produces (`actions.ts`):
  - `openTodaySession(): Promise<void>`
    1. Bugünün satırı varsa ona yönlendirir.
    2. Yoksa `planToday` çalıştırılır. Plan boşsa (0 soru ve 0 kelime) `redirect("/")` yapılır.
    3. Plan doluysa `insert … onConflictDoNothing({ target: [userId, day] })` yapılır. Ardından satır yeniden okunur ve ona yönlendirilir. Çakışma olsa da aynı satıra gidilir.
  - `recreateTodaySession(): Promise<void>`: bugünün satırını siler (attempts cascade ile silinir) ve `openTodaySession` çağırır.
  - `startSession` silinir.
  - **`markWarmDone`:** `block === -1` ve `row.questionIds.length === 0` ise aynı güncellemede `finishedAt` da yazılır. Sadece daha önce boşsa yazılır, böylece tekrar gönderimde değişmez.

- [ ] **Step 1: `inputs.test.ts` dosyasına `-1`/`-2` testini ekle, çalıştır, başarısız olduğunu gör**

Run: `pnpm vitest run features/session/inputs.test.ts`
Expected: FAIL. `-1` şu an reddediliyor.

- [ ] **Step 2: `inputs.ts` dosyasını düzelt, testi çalıştır, geçtiğini gör**

- [ ] **Step 3: Şemayı değiştir ve migration üret**

Run: `pnpm db:generate`
Expected: Yeni bir `drizzle/0007_*.sql` dosyası oluşur. Dosyada `ADD COLUMN "day" date`, `ADD COLUMN "review_words" jsonb DEFAULT '[]'::jsonb NOT NULL` ve benzersiz indeks bulunur.

- [ ] **Step 4: `server.ts` ve `actions.ts` dosyalarını yaz.**

`openTodaySession` ve `recreateTodaySession` girdi almaz, kullanıcıyı `requireUser` ile alır.

- [ ] **Step 5: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS. `eslint` ve `tsc` çıkış kodu 0. Bu adımda `app/page.tsx`, `oturum/[id]/page.tsx` ve `screens.tsx` hâlâ `startSession` ve `latestUnfinishedSession` kullanıyorsa tsc hata verir. Bunlar Task 4'te değişiyor. Bu yüzden bu görevde o üç dosyadaki `startSession` kullanımı **yalnızca** `openTodaySession` adına çevrilir, ana sayfadaki `latestUnfinishedSession` çağrısı da geçici olarak `getTodaySession(user.id, todayKey(new Date()))` olur. Davranış değişikliği Task 4'te yapılır.

- [ ] **Step 6: Commit**

```bash
git add lib/db/schema.ts drizzle/ features/session/ app/
git commit -m "Günlük oturum: gün kolonu, günün oturumunu açma, snapshot ek alanları"
```

---

### Task 4: Ana sayfa, özet ekranı ve elle deneme

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/features/session/components/screens.tsx`
- Modify: `apps/web/app/oturum/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 3'teki `openTodaySession`, `recreateTodaySession`, `getTodaySession`, `planToday`; Task 1'deki `todayKey`; Task 2'deki `summarize` ek alanları ve Snapshot'taki `streak` ile `newLeft`.

**Davranış (spec §5.5, §5.6):**
- **Ana sayfadaki "Bugünün oturumu" kartı:**
  1. **Satır yok, plan dolu:** "Bugün: N kelime, M soru" ve **Başla** düğmesi (`form action={openTodaySession}`). Sayılar `planToday` ile hesaplanır. Bu durumda satır oluşturulmaz.
  2. **Satır var, bitmemiş:** "Devam et (pozisyon/soru sayısı)" bağlantısı. Soru sayısı 0 ise "Devam et (kelime tekrarı)" yazar.
  3. **Satır bitmiş:** "Bugünün oturumu tamam" mesajı, doğru sayısı, seri, "Yarın yeni oturum açılacak" bilgisi ve "Gözden geçir" bağlantısı (oturum URL'si). Doğru sayısı için bugünün `attempts` kayıtlarındaki `correct` alanı sayılır.
  4. **Satır yok, plan boş:** "Bugün için tekrar ya da yeni soru yok."
  - "Yeni oturum başlat" bağlantısı kaldırılır. Mevcut "N soru hazır / ısınma havuzu" satırları korunur.
- **Özet ekranı (`Summary`):**
  - "Yeni oturum" düğmesi kaldırılır.
  - Şu satırlar eklenir:
    - `reviewTotal > 0` ise: "Kelime tekrarı: X / Y biliniyor"
    - "🔥 N gün üst üste" (`streak > 0` ise)
    - "Havuzda N yeni soru kaldı"
  - "Soruları gözden geçir" düğmesi kalır ama soru yoksa gizlenir.
- **Kelime ekranı:** `Warmup` ve `WarmupDone` ekranlarında `block === -1` iken:
  - başlık "Kelime tekrarı" olur ("Kelime ısınması" yerine),
  - bitiş metni "Tekrar bitti" olur,
  - düğme metni şöyle olur: soru varsa "Sorulara geç →", soru yoksa "Özete geç →".
- **Oturum sayfasında `content_changed` durumu:** "Bugünün oturumunu yeniden oluştur" düğmesi gösterilir (`form action={recreateTodaySession}`). Satırın `day` değeri boşsa (eski oturum) düğme yerine yalnızca "Ana sayfaya dön" bağlantısı gösterilir.

- [ ] **Step 1: Ekranları ve sayfaları değiştir**

- [ ] **Step 2: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0. `grep -rn "startSession\|latestUnfinishedSession" app features` hiçbir sonuç döndürmez.

- [ ] **Step 3: Migration'ı uygula ve uygulamayı aç**

Run: `pnpm db:migrate` (önce kullanıcıdan onay alınır: canlı Neon veritabanı), ardından `pnpm dev`
Expected: Migration başarılı olur, uygulama http://localhost:3000 adresinde açılır.

- [ ] **Step 4: Elle deneme (Review Focus 1–3)**
  - **Kart:** Ana sayfa 1. durumu gösterir. İlk gün kelime ya da zamanı gelen soru yoksa "Bugün: 0 kelime, 10 soru" yazar.
  - **Çift açma:** İki sekmede aynı anda "Başla"ya basılır. İki sekme de aynı `/oturum/<id>` adresine gider. Veritabanında bugüne ait tek satır olduğu `pnpm db:studio` ya da tek seferlik bir sorgu ile doğrulanır.
  - **Akış:** Bir soru cevaplanır, ana sayfaya dönülür, kart "Devam et (1/10)" gösterir. Oturum bitirilir, kart 3. durumu ve "1 gün üst üste" bilgisini gösterir.
  - **Sadece kelime olan oturum:** Kullanıcının onayıyla geçici bir test hesabında, ya da bir sonraki gün denenir. Hesabın zamanı gelen kelimesi olup yeni ve zamanı gelen sorusu olmamalı. Bunu sağlamak zorsa, test sonrası silinecek bir test hesabında `review_items.due_at` değerleri elle geçmişe çekilir. Önce kelime tekrarı, sonra özet gelmeli, `finishedAt` yazılmalı.
  - **Gün dönümü:** Sistem saatini değiştirmek yerine, bugünün satırının `day` değeri test hesabında bir gün geriye alınır. Ana sayfa yeni günün 1. durumunu göstermeli.

- [ ] **Step 5: Commit**

```bash
git add app/ features/session/components/
git commit -m "Günlük oturum: ana sayfa durumları, özet ekranı, kelime tekrarı metinleri"
```
