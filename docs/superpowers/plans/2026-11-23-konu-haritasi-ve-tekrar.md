# Konu haritası ve soru tekrarı — uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Çözülen sorular günlük oturuma tekrar tekrar gelmesin.
- Panoda zayıf konular görünsün.
- Her soru tipi için konu haritası olsun; cümle tamamlamanın konu tarifleri uygulamada gösterilsin.

**Architecture:**
- **Kurallar:** saf fonksiyonlar `features/session/rules.ts` ve `features/dashboard/stats.ts` içinde, testli.
- **Emeklilik:** ek tablo yok, `attempts` geçmişinden hesaplanır.
- **Emin değilim kontrolü:** "doğru + emin değilim" için ~7 günlük kontrol, `review_items.due_at` üzerine yazılarak yapılır.
- **Konular:** tek kaynak `lib/content/topics.ts`. İçerik şeması, soru hattı istemi ve arayüz konuları buradan okur.

**Tech Stack:** Next.js 16, TypeScript, Drizzle/Postgres, zod, Vitest.

**Spec:** docs/superpowers/specs/2026-11-23-konu-haritasi-ve-tekrar-design.md

## Global Constraints

- **Telif:** ÖSYM sorusu git'e girmez. Haritadaki örnekler özgün yazılır.
- **Kapsam:** kural yalnızca günlük oturum sorularına uygulanır. Kelime SM-2'si ve serbest çalışma değişmez.
- **Emeklilik:** son günlük cevap doğruysa ve şu ikisinden biri doğruysa soru emeklidir: cevap "temiz" (eminim, çeviri ve ipucu açılmadı), ya da bir önceki günlük cevap da doğru.
- **Kontrol süresi:** `CHECK_DAYS = 7`. Doğru ama temiz olmayan cevaptan sonra soru 7 gün sonra gelir.
- **Zayıf konular:** konu en az 3 günlük cevapla listeye girer, en zayıf 3 konu gösterilir.
- **Konu kimliği:** konu (tip, konu) çiftiyle tanımlanır. Anahtar biçimi `${type}:${topic}`.
- **Dal:** iş `konu-haritasi` dalında yapılır, `gorsel-yenileme`'nin ucundan açılır.
- **Arayüz:** metinler Türkçe ve ARAYUZ.md üslubunda. Mevcut kart ve tile bileşenleri kullanılır.

## Review Focus

1. Hiç günlük cevabı olmayan sorular (yalnızca serbest çalışmada görülen ya da `sessionId` null olan) emekli sayılmamalı. Task 1 testi.
2. Emekli bir sorunun `review_items.due_at` değeri geçmişte kalsa bile soru seçilmemeli. Task 1 testi.
3. Aynı soruya aynı oturumda tekrar gönderim (çift kayıt engelli) emekliliği ya da 7 günü bozmamalı. Kayıt `onConflictDoNothing` ile korunur, Task 2'de elle doğrulanır.
4. Zayıf konular yalnızca görünür sorulardan hesaplanmalı. Başka hesabın ya da silinmiş sorunun cevabı atlanır. Task 3 testi.
5. Haritası olmayan tipte bir soru içe aktarılırsa net bir hata vermeli, sessizce geçmemeli. Task 5 testi.

---

### Task 1: Emeklilik, 7 günlük kontrol ve konu önceliği (saf kurallar)

**Files:**
- Modify: `apps/web/features/session/rules.ts`
- Test: `apps/web/features/session/rules.test.ts`

**Interfaces:**
- Produces:
  - `export const CHECK_DAYS = 7`
  - `export type DailyAttempt = { sessionId: string | null; questionId: string; correct: boolean; sure: boolean; glossUsed: boolean; hintUsed: boolean; createdAt: Date }`
  - `export function isClean(a: Pick<DailyAttempt, "correct" | "sure" | "glossUsed" | "hintUsed">): boolean`
  - `export function retiredQuestions(attempts: DailyAttempt[]): Set<string>`: yalnızca `sessionId !== null` olan kayıtlar, soru başına `createdAt` sırasıyla.
  - `export function questionReview(state: ReviewState, a: Pick<DailyAttempt, "correct" | "sure" | "glossUsed" | "hintUsed">, now: Date): ReviewState`:
    - Yanlış cevapta: `review(state, gradeAnswer(false, a.sure), now)`.
    - Doğru cevapta: `review(state, gradeAnswer(true, isClean(a)), now)`, ardından `dueAt = now + CHECK_DAYS gün`.
  - `export function wrongTopicKeys(attempts: DailyAttempt[], topicKey: Map<string, string>): Set<string>`: son günlük cevabı yanlış olan soruların konu anahtarları.
  - `pickDailyQuestions` iki yeni alan alır: `retired: Set<string>`, `boost?: { topicKey: Map<string, string>; keys: Set<string> }`.
    - Emekliler hem zamanı gelenlerden hem yenilerden çıkar.
    - Yeniler içinde konusu `boost.keys`'te olanlar öne alınır, sıra korunur (stable).

- [ ] **Step 1: Write the failing tests** (`rules.test.ts`, mevcut `r()` yardımcısının yanına bir `att()` yardımcısı):
  - `retiredQuestions`:
    - "son günlük cevap temiz doğruysa emekli": `[att("q1", {correct:true, sure:true})]` → `Set{"q1"}`
    - "doğru ama emin değil → emekli değil": `sure:false` → boş
    - "ipucu ya da çeviri açıldıysa temiz sayılmaz": `sure:true, hintUsed:true` → boş; `glossUsed:true` → boş
    - "emin değil doğru, sonra yine doğru → emekli": iki kayıt, ikincisi `sure:false` → `Set{"q1"}`
    - "yanlış, sonra emin değil doğru → emekli değil" → boş
    - "temiz doğru, sonra yanlış → emekli değil" (son kayıt belirler; kayıtlar ters sırada verilse de `createdAt`'e göre) → boş
    - "sessionId null kayıtlar sayılmaz" → boş
  - `questionReview`:
    - "doğru + emin değil → 7 gün sonra": `dueAt === now + 7 gün`
    - "yanlış → SM-2 (1 gün, priority eminse)": `dueAt === now + 1 gün`, `sure:true` ise `priority === true`
  - `pickDailyQuestions`:
    - "emekli soru zamanı gelse de seçilmez, yeni olsa da seçilmez": `retired: Set{"d1","n1"}` → `d1` ve `n1` yok
    - "yanlış yapılan konudan yeni sorular öne alınır": `questionIds ["n1","n2","n3"]`, topicKey `n3 → cumle_tamamlama:zitlik`, keys `{cumle_tamamlama:zitlik}` → `["n3","n1","n2"]`
  - Mevcut `pickDailyQuestions` testlerine `retired: new Set()` eklenir. Beklenen sonuçları değişmez.

- [ ] **Step 2: Run to verify failure**
  - Run: `cd apps/web && pnpm vitest run features/session/rules.test.ts`
  - Expected: yeni testler FAIL (`retiredQuestions is not a function` vb.)

- [ ] **Step 3: Implement the functions above in `rules.ts`.** `review`/`gradeAnswer` `@/lib/domain/sm2`'den gelir.

- [ ] **Step 4: Run to verify pass**
  - Run: `pnpm vitest run features/session/rules.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit** `git commit -m "Tekrar kuralı: emeklilik, 7 günlük kontrol, konu önceliği (saf)"`

### Task 2: Kuralları oturuma bağla

**Files:**
- Modify:
  - `apps/web/features/progress/server.ts`: `AttemptRow`'a `sure`, `glossUsed`, `hintUsed` eklenir, select genişler.
  - `apps/web/features/session/server.ts`: `planToday` ve `upsertReview`.
  - `apps/web/features/session/actions.ts`: `recordAnswer` ve `recordWarmup`.

**Interfaces:**
- Consumes: Task 1'deki her şey.
- Produces: `upsertReview(userId, kind, itemId, step: (s: ReviewState) => ReviewState, now)`. Not yerine adım fonksiyonu alır.
  - Kelime çağrısı: `(s) => review(s, grade, now)`.
  - Soru çağrısı: `(s) => questionReview(s, answer, now)`.

- [ ] **Step 1: `planToday`'i güncelle.**
  - `attemptRows(userId)` da okunur.
  - `retired = retiredQuestions(attempts)` hesaplanır.
  - `topicKey` görünür sorulardan `${q.type}:${q.topic}` olarak kurulur.
  - `boost = { topicKey, keys: wrongTopicKeys(attempts, topicKey) }`.
  - İkisi `pickDailyQuestions`'a verilir.
- [ ] **Step 2: `recordAnswer` ve `recordWarmup`'ı yeni `upsertReview` imzasına geçir.**
- [ ] **Step 3: Doğrula**
  - Run: `pnpm typecheck && pnpm test`
  - Expected: hata yok, bütün testler PASS.
- [ ] **Step 4: Gerçek veride kontrol**
  - Run: `pnpm dev`. Doğru ve emin cevaplanmış bir sorusu olan hesapla gir.
  - Expected: panodaki "Günün görevi" sayısı o soruları içermiyor.
  - Bugünün oturumu zaten varsa değişmez; kural yarın açılan oturumda görünür. Bunu not et.
- [ ] **Step 5: Commit** `git commit -m "Tekrar kuralı oturuma bağlandı"`

### Task 3: Panoda "Zayıf konular" kartı

**Files:**
- Modify:
  - `apps/web/lib/content/schema.ts`: `QUESTION_TYPE_NAMES: Record<QuestionType, string>` eklenir (Kelime, Dilbilgisi, Cloze test, Cümle tamamlama, Çeviri, Okuma, Diyalog, Yakın anlamlı cümle, Paragraf tamamlama, Anlamı bozan cümle).
  - `apps/web/features/dashboard/stats.ts`
  - `apps/web/features/dashboard/server.ts`
  - `apps/web/app/page.tsx`
- Create: `apps/web/features/dashboard/components/weak-topics-card.tsx`
- Test: `apps/web/features/dashboard/stats.test.ts`

**Interfaces:**
- Produces:
  - `export type TopicStat = { type: QuestionType; topic: string; correct: number; total: number }`
  - `export function weakTopics(attempts: { sessionId: string | null; questionId: string; correct: boolean }[], byId: Map<string, Question>, min = 3, limit = 3): TopicStat[]`:
    - Yalnızca `sessionId !== null` ve `byId`'de olan sorular sayılır.
    - `total >= min` olanlar alınır.
    - Sıra: oran (`correct/total`) artan; eşitlikte `total` azalan.
  - `DashboardData.weakTopics: TopicStat[]`

- [ ] **Step 1: Write the failing tests** (`stats.test.ts`):
  - "en az 3 cevabı olan konular, en zayıftan başlayarak": zitlik 1/4, kosul 2/3, zaman 1/2 → `[zitlik, kosul]`
  - "eşit oranda çok cevaplı önce"
  - "serbest çalışma (sessionId null) ve görünmeyen soru sayılmaz"
  - "limit 3"
- [ ] **Step 2: Run** `pnpm vitest run features/dashboard/stats.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `weakTopics`.** Ardından:
  - `dashboardData` onu `userAttempts` ve `byId` ile doldurur.
  - `WeakTopicsCard`, `TrapsCard` düzeninde yazılır. `TILE`/`TILE_ICON` kullanılır, link yok, ikon `ChartBar` ya da `TrendingDown`.
  - Satır biçimi: "Cümle tamamlama · Zıtlık %25". Boşsa "Henüz yeterli cevap yok".
  - Kart `page.tsx`'te `TrapsCard`'ın yanına konur.
  - Konu adı için Task 5'e kadar mevcut `TOPIC_NAMES[topic]` kullanılır.
- [ ] **Step 4: Run** `pnpm typecheck && pnpm test`. Expected: PASS. Panoda kart görünür.
- [ ] **Step 5: Commit** `git commit -m "Pano: zayıf konular kartı"`

### Task 4: Konu haritası dokümanı — **ONAY DURAĞI**

**Files:**
- Create: `docs/KONU-HARITASI.md`

- [ ] **Step 1: Dokümanı yaz.** 10 tipin her biri için spec §4.2'deki konular. Her konu için:
  - kod adı (ASCII `snake_case`) ve Türkçe adı
  - **Nasıl tanınır** (1 satır)
  - **Tarif** (3–4 adım)
  - **Sık tuzaklar** (T1–T15)
  - **Mini örnek** (özgün)
  - Tipin genel kartı için TASARIM §5'e atıf yapılır.
  - Cümle tamamlamanın 8 konusu mevcut kodlarla aynı kalır: `kosul, zitlik, neden_sonuc, ek, zaman, amac, karsilastirma, iliskili_yapi`. Tarifleri, mevcut soruların `solution_steps`'lerine bakılarak yazılır.
- [ ] **Step 2: Commit** `git commit -m "Konu haritası dokümanı (taslak)"`
- [ ] **Step 3: DUR.** Kullanıcıya dokümanı ver, okuyup düzeltmesini ve onaylamasını bekle. Onaydan önce Task 5'e geçilmez.

### Task 5: `topics.ts` ve tipe göre konu doğrulaması

**Files:**
- Create: `apps/web/lib/content/topics.ts`
- Modify:
  - `apps/web/lib/content/schema.ts`: `TOPICS`/`TOPIC_NAMES` kaldırılır, `topic: z.string()` olur ve soru şemasına tipe göre `superRefine` eklenir.
  - `apps/web/lib/content/generate/prompts.ts`
  - `apps/web/lib/content/load.test.ts`
  - Task 3'teki kart
- Test: `apps/web/lib/content/topics.test.ts`

**Interfaces:**
- Produces:
  - `export type TopicDef = { code: string; name: string; signal: string; steps: string[]; traps: TrapCode[] }`
  - `export const TOPIC_MAP: Record<QuestionType, readonly TopicDef[]>`: yalnızca `cumle_tamamlama` dolu, metinler onaylı dokümandan. Diğer tipler `[]`.
  - `export function topicDef(type: QuestionType, code: string): TopicDef | undefined`
  - `export const topicKey = (type: QuestionType, code: string) => \`${type}:${code}\``
  - Task 1/2/3'teki elle yazılmış `${type}:${topic}` ifadeleri `topicKey` ile değiştirilir.

- [ ] **Step 1: Write the failing tests** (`topics.test.ts`):
  - "cümle tamamlamanın 8 konusu var, kodlar benzersiz, her tarif 3–4 adım"
  - "topicDef bilinmeyen konuda undefined"
  - Şema testleri:
    - "listede olmayan konu reddedilir": cumle_tamamlama + `topic:"yok"`
    - "haritası olmayan tipte soru reddedilir, hata mesajı tipi söyler": `type:"okuma"`
- [ ] **Step 2: Run** `pnpm vitest run lib/content`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `prompts.ts` konu listesini `TOPIC_MAP[type]`'tan alır.
  - `load.test.ts` doğrulamayı `topicDef` ile yapar.
  - Kart, konu adını `topicDef(...).name`'den alır.
- [ ] **Step 4: Run** `pnpm typecheck && pnpm test && pnpm content:import --sahip <email>`. Expected: hepsi PASS, mevcut 90 soru doğrulamadan geçer ("0 yeni").
- [ ] **Step 5: Commit** `git commit -m "Konular tek kaynakta: topics.ts, tipe göre doğrulama"`

### Task 6: İpucunda tarif ve konuya ilk girişte tarif kartı

**Files:**
- Modify:
  - `apps/web/features/session/session-machine.ts`
  - `apps/web/features/session/server.ts` (`loadSnapshot`)
  - `apps/web/features/session/components/question-view.tsx`
  - `apps/web/features/session/components/practice-session.tsx`: serbest çalışmada `seenTopics` hepsini kapsar, kart çıkmaz.
- Create: `apps/web/features/session/components/topic-intro.tsx`
- Test: `apps/web/features/session/session-machine.test.ts`

**Interfaces:**
- Consumes: `topicDef`, `topicKey` (Task 5).
- Produces:
  - `Snapshot.seenTopics: string[]`: kullanıcının günlük cevap verdiği soruların konu anahtarları. Oturum açılışında hesaplanır.
  - `State.introDone: string[]`
  - `Action { type: "dismissIntro" }`
  - `export function introFor(s: State): string | null`: soru ekranında, mevcut soru cevaplanmamışsa ve konusu `seenTopics`'te ya da `introDone`'da değilse konu anahtarını döner. Aksi halde null.

- [ ] **Step 1: Write the failing tests** (`session-machine.test.ts`):
  - "görülmemiş konuda introFor anahtarı döner, dismissIntro sonrası null"
  - "aynı konudan ikinci soruda yine null"
  - "seenTopics'teki konuda null"
  - "cevaplanmış soruda null"
- [ ] **Step 2: Run** `pnpm vitest run features/session/session-machine.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `loadSnapshot` `seenTopics`'i `attemptRows` ve sorulardan doldurur.
  - `TopicIntro` kartı: konu adı, "Nasıl tanınır", adımlar, tuzak çipleri ve tek düğme "Soruya geç". Soru ekranında `introFor` doluysa sorunun yerine gösterilir. Enter tuşu düğmeye basar.
  - İpucu paneli: mevcut `solution_steps[0]` satırının altına "Konu: {ad}" ve tarif adımları eklenir (`topicDef` yoksa eklenmez).
- [ ] **Step 4: Run** `pnpm typecheck && pnpm test && pnpm lint`. Expected: PASS. `pnpm dev` ile ipucunda tarif görünür.
- [ ] **Step 5: Commit** `git commit -m "Oturum: ipucunda konu tarifi, konuya ilk girişte tarif kartı"`
