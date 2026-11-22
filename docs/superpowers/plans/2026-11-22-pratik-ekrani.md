# Pratik Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Başla" ile açılan, pratik.html akışını (ısınma → soru → geri bildirim → mola → özet) Next'e taşıyan ve her cevabı Postgres'e kaydeden odak modu ekranı.

**Architecture:** Sorular sunucuda yüklenir, oturum durumu `practice_sessions` tablosundan okunur ve tek bir client bileşenine verilir. Akış saf bir reducer'da (`session-machine.ts`) döner; her geçişin yan etkileri saf bir `effectsFor` fonksiyonuyla hesaplanır ve sıralı, yeniden denemeli bir kayıt kuyruğu üzerinden server action'lara gider. Geri bildirim sunucuyu beklemez.

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents: true`), React 19.3, Drizzle ORM + node-postgres, Better Auth, Tailwind 4, Vitest 5, zod 4. Yeni bağımlılık yok.

**Spec:** [docs/superpowers/specs/2026-11-22-pratik-ekrani-design.md](../specs/2026-11-22-pratik-ekrani-design.md) — uygulayıcı planla birlikte okur. Davranış referansı: `pipeline/build_practice.py` içindeki JS.

## Global Constraints

- Tüm komutlar `apps/web` içinde çalışır. Next koduna dokunmadan önce `node_modules/next/dist/docs/` içindeki ilgili rehber okunur (AGENTS.md).
- `cacheComponents: true`: oturum/istek verisi (`headers()`, `requireUser()`, params) okuyan her sunucu bileşeni `<Suspense>` içinde render edilir. Sayfa `params`'ı `Promise<{ id: string }>`.
- Yeni npm bağımlılığı eklenmez.
- Sabitler: `BREAK_AFTER = 4`, `WARM_MAX = 30`; bilinen kelime = `isKnown` (`review_items.reps >= 2`, `lib/domain/sm2.ts`). Isınma notu: doğru → `4`, yanlış → `1`. Soru notu: `gradeAnswer(correct, sure)`.
- Arayüz metinleri Türkçe ve pratik.html'deki kopyayla aynı (ör. "Emin değilim", "Eminim", "Sonraki soru →", "Sonuçları gör →", "Parça parça çeviri", "Kelimeler", "İpucu", "Isınmayı atla", "Sorulara geç →", "Devam et"). "Baştan başla" yerine **"Yeni oturum"**.
- Yanlış = `warn` (amber) belirteçleri, doğru = `ok`; kırmızı yok. İngilizce metin `font-serif` 18–19px, satır aralığı 1.6; Türkçe `text-sm text-muted`. Dokunma alanları ≥ 48px; ana düğmeler altta sabit çubukta.
- Direktif metni (cumle_tamamlama): "**Önce bağlacı bul**, yönünü belirle (zıtlık / neden / ek / koşul). Sonra zaman ve zamir uyumuna bak."
- Repo git deposu değil: "Checkpoint" adımları commit yerine `pnpm typecheck && pnpm test` çalıştırır. (Kullanıcı `git init` yaparsa her checkpoint bir commit olur.)

## Review Focus

1. **Çift gönderim** (Enter'a hızlı iki kez basma, yeniden deneme): bir soru için tek `attempts` satırı; reducer cevaplanmış soruda `submit`'i yok sayar → Task 2 ve Task 3 testleri.
2. **Ağ kesintisi oturum ortasında:** akış sürer, kayıtlar sırayla yeniden denenir, "Kaydedilemedi, tekrar deneniyor…" görünür, bağlantı gelince kaybolur → Task 4 testleri.
3. **Isınma ortasında kapatıp açma:** kaldığı kelimeden devam, skor korunur, aynı kelime ikinci kez notlanmaz → Task 2 testi.
4. **Başkasının / var olmayan oturum id'si:** 404 → Task 5 elle doğrulama.
5. **İçerik oturumdan sonra değişti** (`question_ids` içindeki bir id artık içerikte yok): çökme yok; "Bu oturumun bazı soruları artık mevcut değil" mesajı + **Yeni oturum** düğmesi → Task 5.

---

### Task 1: Veritabanı şeması ve migration

**Files:**
- Modify: `lib/db/schema.ts` (yeni tablo + `attempts.sessionId`)
- Create: `drizzle/0002_*.sql` (`pnpm db:generate` üretir)

**Interfaces:**
- Produces: `schema.practiceSessions` — sütunlar: `id` text PK, `userId` text FK→user cascade, `questionIds` jsonb `$type<string[]>()`, `position` integer default 0, `breakSeen` boolean default false, `warmDone` jsonb `$type<number[]>()` default `[]`, `warmAnswers` jsonb `$type<Record<string, boolean>>()` default `{}`, `createdAt`, `updatedAt`, `finishedAt` (nullable timestamptz). İndeks `(userId, createdAt)`.
- Produces: `schema.attempts.sessionId` — nullable text FK→practice_sessions cascade; `uniqueIndex("attempts_session_question_uq").on(sessionId, questionId)`.

- [ ] **Step 1:** Şemayı yukarıdaki gibi ekle (`practiceSessions`, `attempts`'ten önce tanımlansın ki FK çözülsün).
- [ ] **Step 2:** `pnpm db:generate` → yeni SQL dosyası oluşur; içinde `CREATE TABLE "practice_sessions"`, `ALTER TABLE "attempts" ADD COLUMN "session_id"` ve benzersiz indeks olduğunu kontrol et.
- [ ] **Step 3:** `pnpm db:migrate`, ardından `pnpm db:check` → tablolar listesinde `practice_sessions` görünür, "Kullanıcı sayısı: 1".
- [ ] **Step 4: Checkpoint** `pnpm typecheck && pnpm test` → temiz.

---

### Task 2: Saf oturum makinesi

**Files:**
- Create: `features/session/session-machine.ts`
- Create: `features/session/session-machine.test.ts`
- Modify: `vitest.config.mts` (`include: ["lib/**/*.test.ts", "features/**/*.test.ts"]`)

**Interfaces:**
- Consumes: `Question` (`lib/content/schema.ts`), `TRAP_NAMES`, `isKnown` mantığı (bilinen kelime kümesi string[] olarak gelir).
- Produces:
```ts
export const BREAK_AFTER = 4, WARM_MAX = 30;
export type OptionKey = "A" | "B" | "C" | "D" | "E";
export type Tool = "gloss" | "words" | "hint";
export type AnswerRecord = { choice: OptionKey; sure: boolean; glossUsed: boolean; hintUsed: boolean; wordsUsed: boolean };
export type Snapshot = {                       // sunucudan gelen durum
  sessionId: string; questions: Question[];    // question_ids sırasıyla
  position: number; breakSeen: boolean; warmDone: number[];
  warmAnswers: Record<string, boolean>; answers: Record<string, AnswerRecord>; // anahtar: question id
  knownWords: string[];                        // oturum açılışında isKnown olan kelimeler
};
export type WarmItem = { word: string; tr: string; context?: string; choices: string[] }; // 4 şık, karışık
export type Screen =
  | { kind: "warmup"; block: number; idx: number }   // idx: items içindeki konum
  | { kind: "warmupDone"; block: number }
  | { kind: "question" }                              // answers[q.id] varsa geri bildirim görünümü
  | { kind: "break" }
  | { kind: "summary" }
  | { kind: "review"; i: number };
export type Ui = { sel: OptionKey | null; gloss: boolean; words: boolean; hint: boolean; used: Record<Tool, boolean> };
export type State = Snapshot & { warmItems: Record<number, WarmItem[]>; screen: Screen; ui: Ui; questionStartedAt: number };
export type Action =
  | { type: "select"; key: OptionKey } | { type: "toggle"; tool: Tool }
  | { type: "submit"; sure: boolean; now: number } | { type: "next"; now: number }
  | { type: "warmPick"; choiceIndex: number } | { type: "warmNext" } | { type: "warmSkip" } | { type: "warmEnd"; now: number }
  | { type: "breakContinue"; now: number } | { type: "startReview" } | { type: "reviewMove"; delta: 1 | -1 };
export type Effect =
  | { kind: "recordAnswer"; questionId: string; answer: AnswerRecord; durationMs: number }
  | { kind: "advance"; position: number }
  | { kind: "recordWarmup"; word: string; correct: boolean }
  | { kind: "markWarmDone"; block: number }
  | { kind: "markBreakSeen" };
export function warmVocab(s: Pick<Snapshot, "questions" | "knownWords" | "warmAnswers">, block: number): Question["vocab"];
export function buildWarmItems(s: Snapshot, rng: () => number): Record<number, WarmItem[]>;
export function initState(s: Snapshot, rng: () => number, now: number): State;
export function reduce(state: State, action: Action): State;
export function effectsFor(prev: State, action: Action, next: State): Effect[];
export function summarize(state: Pick<State, "questions" | "answers">): {
  right: number; total: number; traps: [TrapCode, number][]; // çoktan aza
  wrongRules: { number: number; rule: string }[]; sureWrong: number; glossCount: number };
```
Davranış (pratik.html ile aynı, spec §5.4–5.5):
- `warmVocab`: blok = `questions.slice(block, block + 4)`; `warmup: true` kelimeler, tekil, `word ∈ warmAnswers || !knownWords.includes(word)`, en fazla 30.
- `buildWarmItems`: her blok başı (0, 4, 8…) için; doğru `tr` + diğer tüm sorulardaki farklı `tr`'lerden 3 tanesi, `rng` ile karıştırılmış. Karıştırma yalnızca burada.
- `initState`: `position >= N` → summary; `position % 4 === 0 && !warmDone.includes(position)` ve o bloğun cevaplanmamış öğesi varsa → warmup (idx = ilk `warmAnswers`'ta olmayan öğe); hepsi cevaplanmış ama warmDone yoksa → warmupDone; `position === 4 && !breakSeen && N > 4` → break; diğer → question.
- `submit`: `ui.sel` yoksa ya da soru cevaplanmışsa değişiklik yok. `answers[q.id]` = seçim + `used` bayrakları. `gloss` bayrağı yalnızca cevaptan önce açıldıysa (`used.gloss`).
- `toggle`: cevaptan sonra `words`/`hint` değişmez; `gloss` değişir ama `used.gloss`'u etkilemez.
- `next` (cevaplanmışsa): position+1, ui sıfırlanır, `questionStartedAt = now`; ardından position N → summary; position 4 ve !breakSeen → break (breakSeen = true); blok başı ve ısınma gerekiyorsa → warmup; değilse question.
- `warmPick`: aynı öğede ikinci seçim yok sayılır; `warmAnswers[word] = correct`. `warmEnd`/`warmSkip` → warmDone'a blok eklenir, question ekranı (ya da warmupDone → `warmEnd`).
- `effectsFor`: submit → `recordAnswer` (durationMs = now - questionStartedAt); next → `advance(position)` (+ `markBreakSeen` molaya girerken); warmPick (yeni cevapsa) → `recordWarmup`; warmEnd/warmSkip → `markWarmDone(block)`. Değişiklik olmayan geçişte `[]`.

- [ ] **Step 1: Failing testleri yaz** (`session-machine.test.ts`). İçerik: gerçek içerik yerine test içinde 10 soruluk küçük bir fabrika (`makeQuestion(n, { vocab })`); `rng = () => 0.42`. Testler:
  - `starts with warmup at block 0 when unknown warmup words exist` → `initState(...).screen` = `{ kind: "warmup", block: 0, idx: 0 }`
  - `known words are excluded from warmup` → `warmVocab` sonucunda `knownWords` içindeki kelime yok
  - `resume mid-warmup continues at first unanswered word` → `warmAnswers = { w1: true }` iken `screen.idx === 1`; `summarize` dışında skor = 1
  - `warmPick twice on same item is ignored` → ikinci `warmPick` sonrası `warmAnswers` değişmez ve `effectsFor` `[]`
  - `submit without selection does nothing` ve `submit twice records once` → ikinci submit'te `effectsFor` `[]`
  - `gloss opened after answer does not mark glossUsed`
  - `next after 4th question shows break once` → position 4, `screen.kind === "break"`, effects içinde `{ kind: "advance", position: 4 }` ve `{ kind: "markBreakSeen" }`; `breakContinue` sonrası blok 4 ısınması
  - `next after last question shows summary and advances to N`
  - `resume on answered-but-not-advanced question shows feedback` → `screen.kind === "question"` ve `answers[q.id]` dolu
  - `resume with position N shows summary`
  - `summarize counts traps of chosen wrong options, most frequent first, and sureWrong`
- [ ] **Step 2:** `pnpm test` → yeni testler FAIL (modül yok).
- [ ] **Step 3:** `session-machine.ts`'i yukarıdaki imzalarla uygula.
- [ ] **Step 4:** `pnpm test` → hepsi PASS.
- [ ] **Step 5: Checkpoint** `pnpm typecheck && pnpm test`.

---

### Task 3: Sunucu katmanı (sorgular + server action'lar)

**Files:**
- Create: `features/session/server.ts` (`import "server-only"` yoksa yorumla belirt; paket kurulu değilse ekleme)
- Create: `features/session/actions.ts` (`"use server"`)
- Create: `features/session/server.test.ts` (saf yardımcılar için)

**Interfaces:**
- Consumes: `db`, `schema` (Task 1), `requireUser()` (`lib/session.ts`), `loadQuestions()`, `newReviewState`, `review`, `gradeAnswer`, `isKnown` (`lib/domain/sm2.ts`), `Snapshot`, `AnswerRecord` (Task 2).
- Produces (`server.ts`):
```ts
export function pickSessionQuestions(questions: Question[]): string[];          // içerik sırası, tüm sorular
export const WARMUP_GRADE = { correct: 4, wrong: 1 } as const;
export function applyAdvance(current: number, requested: number, total: number): { position: number; finished: boolean }; // max, N'de finished
export async function getOwnedSession(userId: string, id: string): Promise<PracticeSessionRow | null>;
export async function latestUnfinishedSession(userId: string): Promise<{ id: string; position: number; total: number } | null>;
export async function loadSnapshot(userId: string, id: string): Promise<{ ok: true; snapshot: Snapshot } | { ok: false; reason: "not_found" | "content_changed" }>;
export async function upsertReview(userId: string, kind: "word" | "question", itemId: string, grade: Grade, now: Date): Promise<void>; // satır yoksa newReviewState'ten başlar
```
- Produces (`actions.ts`), hepsi önce `requireUser()` + sahiplik kontrolü; sahip değilse `throw new Error("not_found")`:
```ts
export async function startSession(): Promise<void>;   // satır oluşturur, redirect(`/oturum/${id}`)
export async function recordAnswer(sessionId: string, questionId: string, a: AnswerRecord, durationMs: number): Promise<void>;
  // questionId question_ids içinde değilse hata; correct içerikten hesaplanır; insert ... onConflictDoNothing (session_id, question_id);
  // satır gerçekten eklendiyse upsertReview("question", gradeAnswer(correct, sure))
export async function advance(sessionId: string, position: number): Promise<void>;  // applyAdvance; finished ise finished_at = now
export async function recordWarmup(sessionId: string, word: string, correct: boolean): Promise<void>;
  // tek UPDATE ile warm_answers'a ekle yalnızca anahtar yoksa (jsonb `?` operatörü, WHERE NOT warm_answers ? word ... RETURNING);
  // satır döndüyse upsertReview("word", correct ? 4 : 1)
export async function markWarmDone(sessionId: string, block: number): Promise<void>;  // tekrar eklemez
export async function markBreakSeen(sessionId: string): Promise<void>;
```
`loadSnapshot` `knownWords`'u `review_items(kind=word)` içinden `isKnown` olanlarla doldurur; `answers`'ı o oturumun `attempts` satırlarından kurar. `question_ids`'den biri içerikte yoksa `content_changed`.

- [ ] **Step 1: Failing testler** (`server.test.ts`, yalnızca saf fonksiyonlar):
  - `pickSessionQuestions keeps content order` → `["q27", …, "q36"]`
  - `applyAdvance never moves backwards` → `applyAdvance(5, 3, 10)` = `{ position: 5, finished: false }`
  - `applyAdvance finishes at total` → `applyAdvance(9, 10, 10)` = `{ position: 10, finished: true }`; `applyAdvance(10, 11, 10).position === 10`
  - Not: `server.ts` `db`'yi import ettiği için saf yardımcıları `features/session/rules.ts`'e koy ve `server.ts` oradan yeniden dışa aktarsın; test `rules.ts`'i import eder (DATABASE_URL gerekmez).
- [ ] **Step 2:** `pnpm test` → FAIL.
- [ ] **Step 3:** `rules.ts`, `server.ts`, `actions.ts`'i uygula. `startSession` yarım oturumu silmez.
- [ ] **Step 4:** `pnpm test` → PASS. `pnpm typecheck` temiz.
- [ ] **Step 5: Elle doğrulama (tek seferlik betik, scratchpad'de):** `tsx` ile `upsertReview` ve `recordWarmup`'ın aynı kelimeyi ikinci çağrıda notlamadığını doğrula: iki çağrıdan sonra `review_items.reps === 1`. Betik ve oluşturduğu test oturumu sonradan silinir.
- [ ] **Step 6: Checkpoint.**

---

### Task 4: Kayıt kuyruğu

**Files:**
- Create: `features/session/save-queue.ts`
- Create: `features/session/save-queue.test.ts`

**Interfaces:**
- Consumes: `Effect` (Task 2).
- Produces:
```ts
export type QueueStatus = "idle" | "saving" | "retrying";
export function createSaveQueue(send: (e: Effect) => Promise<void>, opts?: { retryDelaysMs?: number[]; onStatus?: (s: QueueStatus) => void; sleep?: (ms: number) => Promise<void> }): {
  push(effects: Effect[]): void;   // sıraya ekler, sırayla gönderir
  pending(): number;
};
```
Varsayılan `retryDelaysMs = [1000, 2000, 5000, 10000]`, son değer sınırsız tekrarlanır. Başarısız öğe başta kalır (sıra bozulmaz). `"not_found"` hatası yeniden denenmez, öğe atılır.

- [ ] **Step 1: Failing testler** (sahte `sleep` ile):
  - `sends effects in order`
  - `retries a failed effect before sending later ones` → sırayla `[e1(fail), e1(ok), e2]`
  - `reports retrying then idle` → `onStatus` çağrıları `["saving", "retrying", "saving", "idle"]`
  - `drops effect on not_found error`
- [ ] **Step 2:** `pnpm test` → FAIL. **Step 3:** uygula. **Step 4:** PASS. **Step 5: Checkpoint.**

---

### Task 5: Oturum sayfası ve arayüz bileşenleri

**Files:**
- Create: `app/oturum/[id]/page.tsx` (sunucu)
- Create: `features/session/components/practice-session.tsx` (`"use client"`; `useReducer(reduce, …, init)`, kuyruk, klavye)
- Create: `features/session/components/{warmup,question-view,stem,option-list,feedback,break-view,summary,answer-bar,save-status}.tsx`
- Create: `features/session/keyboard.ts` + `features/session/keyboard.test.ts`

**Interfaces:**
- Consumes: `loadSnapshot`, actions (Task 3), `initState`, `reduce`, `effectsFor`, `summarize` (Task 2), `createSaveQueue` (Task 4).
- Produces: `export function keyToAction(k: { key: string; shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean; inSummary: boolean }, s: State, now: number): Action | null` — spec §5.6 haritası; Ctrl/Alt/Meta veya `inSummary` (odak `<summary>` içinde) → `null`.

Sayfa: `export default function Page({ params }: { params: Promise<{ id: string }> })` sadece kabuk döner; `<Suspense>` içindeki async bileşen `requireUser()` → `loadSnapshot`. `not_found` → `notFound()`. `content_changed` → mesaj + `startSession` formu ("Yeni oturum"). Başarılı → `<PracticeSession snapshot={…} />`. Client'ta `initState(snapshot, Math.random, Date.now())` yalnızca ilk render'da (useReducer'ın `init` argümanı) çağrılır; hidrasyon farkını önlemek için `PracticeSession` sunucuda render edilmez: `QuestionView` dahil bütün akış, mount sonrası gösterilir (mount öncesi sade bir "Yükleniyor…" iskeleti).

Dispatch sarmalayıcısı: `const next = reduce(state, a); queue.push(effectsFor(state, a, next)); dispatch(a)` — kuyruğun `send`'i Effect türüne göre ilgili action'ı çağırır. Odak modu üst çubuğu: ✕ (Link `/`), ilerleme çubuğu (`position / N`), "Soru i / N · {exam name} · {number}". Altta sabit çubuk: answering'de "Emin değilim" / "Eminim" (seçim yokken `disabled`), feedback'te "Sonraki soru →" / son soruda "Sonuçları gör →". Özet: "Soruları gözden geçir" (`startReview`) ve "Yeni oturum" (`startSession` formu). `save-status` yalnızca `retrying`'de "Kaydedilemedi, tekrar deneniyor…" gösterir.

Stem: kapalıyken bağlaç (`tag: "conj"`) `bg-conj-soft text-conj`, gönderge (`ref`) `bg-ref-soft text-ref`, boşluk `text-accent`; parça parça çeviride her chunk bir kutu, `label`/`sign` etiketleri, boşlukta Türkçe yok. Geri bildirim içeriği ve sırası: spec §5.4 `feedback` satırı / pratik.html `feedbackHTML`.

- [ ] **Step 1: Failing testler** (`keyboard.test.ts`): `A selects option`, `Enter submits sure`, `Shift+Enter submits unsure`, `Enter after answer goes next`, `T toggles gloss`, `ctrl+A ignored`, `warmup: B picks index 1, Enter goes next`, `break: Enter continues`.
- [ ] **Step 2:** FAIL. **Step 3:** `keyboard.ts` + sayfa + bileşenler. **Step 4:** `pnpm test` PASS, `pnpm typecheck` temiz.
- [ ] **Step 5:** `pnpm build` → `/oturum/[id]` hatasız derlenir (blocking-route hatası yok).
- [ ] **Step 6: Checkpoint.**

---

### Task 6: "Bugün" kartı — Başla / Devam

**Files:**
- Modify: `app/page.tsx` (`SessionSummary` bileşeni)

**Interfaces:**
- Consumes: `latestUnfinishedSession` (Task 3), `startSession` (Task 3).

- [ ] **Step 1:** `SessionSummary` (zaten `<Suspense>` içinde) mevcut sayılarla birlikte birincil düğmeyi gösterir: yarım oturum varsa `<Link href={`/oturum/${id}`}>` "Oturumuna devam et ({position}/{total})" ve altında küçük ikincil "Yeni oturum başlat" (form → `startSession`); yoksa form → `startSession` "Başla". "Pratik ekranı bir sonraki adımda buraya geliyor." notu kaldırılır.
- [ ] **Step 2:** `pnpm typecheck && pnpm test && pnpm build` → temiz; `/` hâlâ `◐`.
- [ ] **Step 3: Elle uçtan uca** (`pnpm dev`): Başla → ısınma → 4 soru → mola → … → özet. Ortada sekmeyi kapat, `/`'da "Oturumuna devam et (n/10)" görün, aç ve kaldığın yerden sürdüğünü doğrula. Isınma ortasında yenile → kaldığı kelime. Rastgele bir id ile `/oturum/xyz` → 404. DevTools'ta ağı "Offline" yap, bir soru cevapla → geri bildirim anında, "Kaydedilemedi…" görünür; Online'a dön → kaybolur ve `attempts`'te satır var. Dar ekran (≈375px) ve masaüstü klavye kısayolları.
- [ ] **Step 4: Checkpoint.**
