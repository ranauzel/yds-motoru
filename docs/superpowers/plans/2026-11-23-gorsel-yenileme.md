# Görsel yenileme, pano, Kelimeler ve Tuzaklarım Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uygulamayı açık temalı "Odak Panosu" görünümüne taşımak. Bu kapsamda şunlar eklenir:
- sınav tarihi
- ses ve emoji kutlaması
- tuzak uyarısı
- Kelimeler ve Tuzaklarım sayfaları, serbest çalışmayla birlikte

**Architecture:**
- **Hesaplar saf ve testli:** ısı haritası penceresi ve seviyesi, ipucu, geri sayım, tuzak istatistiği, kelime sınıflandırması, serbest çalışma seçimi ve yazma kuralı, kutlama tetikleyicisi.
- **Sunucu:** Bu fonksiyonları birleştiren sorgular ve server action'lar.
- **Arayüz:** shadcn/ui bileşenleri ve motion/canvas-confetti/zzfx kullanan istemci bileşenleri.
- **Mantık korunur:** Günlük oturumun mantığına dokunulmaz.

**Tech Stack:** Next.js 16.4 (cacheComponents), React 19.3, Tailwind 4.3, shadcn/ui (radix-ui), motion 14, canvas-confetti 1.9, zzfx 1.4, lucide-react 1.78, react-activity-calendar 3.2, sonner 2.0, react-day-picker 10, Drizzle/Postgres, zod 4, vitest.

**Spec:** [docs/superpowers/specs/2026-11-23-gorsel-yenileme-design.md](../specs/2026-11-23-gorsel-yenileme-design.md) (ayrıca: [günlük oturum tasarımı](../specs/2026-11-23-gunluk-oturum-design.md))

**Dal:** `gorsel-yenileme` (`gunluk-oturum` dalının ucundan). Komutlar `apps/web` içinden çalıştırılır.

## Global Constraints

- **Tema:** Yalnızca açık tema. `prefers-color-scheme: dark` bloğu kaldırılır.
- **Palet:** zemin `#f7f5ff`, yüzey `#ffffff`, vurgu `#6d4aff`, kahraman kart geçişi `#6d4aff`→`#ff6aa2`.
- **Kontrast:** Metin ile zemini arasında en az **4.5:1**. Bu Task 1'deki testle sabitlenir.
- **Dokunma alanı:** en az 48px (K8).
- **Ana eylem:** Her ekranda en fazla bir ana eylem (K1).
- **Yanlış cevap:** turuncu renk ve tuzak adıyla gösterilir, kırmızı kullanılmaz (K6).
- **Klavye:** Kısayollar korunur (K10).
- **Kartlar:** Simgeler lucide ile. Emoji yalnızca kutlamada kullanılır.
- **Hareket ve ses sınırları:**
  - Kutlama en fazla 1,2 sn sürer.
  - Mikro geçişler 150–300 ms.
  - `prefers-reduced-motion: reduce` açıkken konfeti ve emoji oynamaz.
  - Ses kapalıyken hiç ses çalmaz.
  - Ses tercihi `localStorage` içinde `yds-ses` anahtarında tutulur, varsayılan açık.
- **Serbest çalışma:**
  - `practice_sessions` tablosuna yazmaz.
  - Haftalık hedefe ve günlük oturuma etkisi yoktur.
  - Soru cevapları hiçbir yere yazılmaz.
  - Kelime cevapları yalnızca §5.6'daki kurala göre yazılır.
- **Günlük oturum:** Mantığı aynen kalır. Mevcut testler geçmeye devam eder.
- **Server action'lar:** Girdiler zod ile doğrulanır.
- **Metinler:** Kısa, Türkçe, cezalandırıcı olmayan bir dil.

## Review Focus

1. **Sınav tarihi yokken ya da geçmişteyken pano:** "Sınav tarihini ekle" ya da "Sınav günü geçti — yeni tarih ekle" kartı görünür. Pano çökmez. → Task 2 (`daysUntil`) ve Task 5'in elle deneme adımı.
2. **Yeni kullanıcı (hiç oturum yok, hiç yanlış yok):**
   - Isı haritasında hiç renkli gün yok, sadece kilitli gelecek günler var.
   - Tuzaklarım kartında "Henüz tuzağa düşmedin" yazar.
   - İpucu, gösterilen sorulardan birinin altın kuralı olur.
   - → Task 2 ve Task 3'te testi var.
3. **Ses ya da hareket kapalı:** Hiç ses yok. "Hareketi azalt" açıksa konfeti yok, metin geri bildirimi kalır. → Task 6, `celebrate` testi.
4. **Serbest kelime çalışması:**
   - Bugünün oturumundaki ve bugün zamanı gelen kelimeler çıkmaz.
   - Sunucu, bu kelimelere gelen bir isteği reddeder.
   - → Task 7'de testi var.
5. **Serbest tuzak çalışması:** Hiçbir tabloya yazmaz. Yan etki iletici yalnızca kelime cevabını iletir. → Task 9'da testi var.

---

### Task 1: Kütüphaneler, açık tema, palet ve kontrast

**Files:**
- Run: `pnpm dlx shadcn@4.23.0 init`. Oluşanlar: `components.json`, `lib/utils.ts` (`cn`), `globals.css` değişiklikleri.
- Run: `pnpm dlx shadcn@4.23.0 add button card dialog switch progress tabs tooltip calendar sonner`. Dosyalar `components/ui/` altına gelir.
- Run: `pnpm add motion@14 canvas-confetti@1.9 zzfx@1.4 lucide-react@1.78 react-activity-calendar@3.2` ve `pnpm add -D @types/canvas-confetti`
- Create: `apps/web/lib/ui/palette.ts`, `apps/web/lib/ui/contrast.ts`
- Test: `apps/web/lib/ui/contrast.test.ts`
- Modify: `apps/web/app/globals.css`
  - Karanlık blok kaldırılır.
  - Belirteçler `palette.ts` ile aynı değerlere getirilir. shadcn'in `--primary`, `--background` gibi değişkenleri bizim belirteçlerimize bağlanır.
  - Mevcut `--color-*` adları korunur.
- Modify: `docs/TASARIM.md` §8 ve `docs/ARAYUZ.md` §6 (spec §3'teki ifadelerle)

**Interfaces:**
- Produces:
  - `PALETTE`: `{ bg, surface, text, muted, border, accent, accentSoft, ok, okSoft, warn, warnSoft, heroFrom, heroTo }`, değerler `#rrggbb` biçiminde. Sabit değerler: `bg "#f7f5ff"`, `surface "#ffffff"`, `accent "#6d4aff"`, `heroFrom "#6d4aff"`, `heroTo "#ff6aa2"`.
  - `contrastRatio(fg: string, bg: string): number`: WCAG göreli parlaklık formülü.
  - `TEXT_PAIRS: [string, string, string][]`: (ad, yazı, zemin) üçlüleri.

- [ ] **Step 1: Başarısız testi yaz**

```ts
it("WCAG örnekleri: siyah/beyaz 21, aynı renk 1", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  expect(contrastRatio("#6d4aff", "#6d4aff")).toBeCloseTo(1, 5);
});
it.each(TEXT_PAIRS)("%s en az 4.5:1", (_name, fg, bg) => {
  expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});
```

`TEXT_PAIRS` en az şunları içerir:
- text/bg, text/surface
- muted/bg, muted/surface
- accent/surface (bağlantı)
- beyaz/accent (ana düğme)
- ok/okSoft, warn/warnSoft (küçük etiketler)
- beyaz/heroFrom ve beyaz/heroTo

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `pnpm vitest run lib/ui/contrast.test.ts`
Expected: FAIL. `./contrast` modülü bulunamaz.

- [ ] **Step 3: `contrast.ts` ve `palette.ts` dosyalarını yaz.**

`ok`, `warn` ve `muted` tonları 4.5:1 sağlanana kadar koyulaştırılır. Mevcut tonlar `#1f8a4c`/`#e4f4ea` 3.84:1 ve `#b26a00`/`#fdf1dc` 3.79:1 veriyor.

**Bilinen bir çakışma var:** Beyaz yazı `#ff6aa2` üzerinde 4.5:1 sağlamıyor. Kahraman karttaki metin bu yüzden ya koyu renkte olacak ya da `heroTo` koyulaştırılacak (örneğin `#d63d7c`). Seçilen çözüm ledger'a Ruling olarak yazılır.

- [ ] **Step 4: Kurulumları yap, `globals.css` dosyasını güncelle, dokümanları güncelle**

- [ ] **Step 5: Bütün kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0.

- [ ] **Step 6: Commit**

```bash
git add -A . ../../docs/TASARIM.md ../../docs/ARAYUZ.md
git commit -m "Görsel yenileme: shadcn ve kütüphaneler, açık tema paleti, kontrast testi"
```

---

### Task 2: Pano hesapları (saf)

**Files:**
- Create: `apps/web/features/dashboard/stats.ts`
- Test: `apps/web/features/dashboard/stats.test.ts`

**Interfaces:**
- Consumes: `features/session/day.ts` içindeki `todayKey` ve haftanın günü yardımcıları.
- Produces:
  - `type DaySummary = { day: string; finished: boolean; correct: number; total: number; wordsKnown: number; wordsTotal: number }`
  - `dayLevel(s: DaySummary | undefined): 0 | 1 | 2 | 3`
    - Oturum yoksa 0.
    - Bitmemişse 1.
    - Bitmiş ve oran < %80 ise 2. Oran, soru varsa `correct/total`, soru yoksa `wordsKnown/wordsTotal`.
    - Bitmiş ve oran ≥ %80 ise 3.
  - `type DayCell = { day: string; level: 0 | 1 | 2 | 3; locked: boolean; today: boolean; exam: boolean }`
  - `calendarWindow(o: { today: string; days: DaySummary[]; examDate: string | null }): DayCell[][]`
    - Dönüş: 9 hafta. Her hafta Pazartesi'den Pazar'a 7 gün.
    - İlk hafta, bu haftanın Pazartesi'sinden 4 hafta önce başlar.
    - `locked = day > today`. Kilitli günlerde `level` 0 olur.
  - `daysUntil(examDate: string, today: string): number`: takvim günü farkı. Geçmiş tarihte negatif döner.
  - `tipOfDay(o: { wrongRules: string[]; allRules: string[]; today: string }): string | null`
    - `wrongRules` boş değilse ondan, boşsa `allRules`'tan seçer.
    - İndeks gün anahtarından deterministik olarak türetilir. Bunun için gün anahtarının karakter kodları toplamı kaynak dizinin uzunluğuna göre mod alınır.
    - İkisi de boşsa `null`.
  - `todayProgress(row: { questionIds: string[]; position: number; reviewWords: string[]; warmAnswers: Record<string, boolean>; finishedAt: Date | null } | null): number`
    - Satır yoksa 0. `finishedAt` doluysa 1.
    - Diğer durumda `(position + cevaplanmış tekrar kelimesi sayısı) / (soru sayısı + tekrar kelimesi sayısı)`.

- [ ] **Step 1: Başarısız testleri yaz**

```ts
const S = (o: Partial<DaySummary> & { day: string }): DaySummary => ({ finished: true, correct: 0, total: 0, wordsKnown: 0, wordsTotal: 0, ...o });
it("dayLevel 0–3; sadece kelime gününde kelime oranı", () => {
  expect(dayLevel(undefined)).toBe(0);
  expect(dayLevel(S({ day: "d", finished: false }))).toBe(1);
  expect(dayLevel(S({ day: "d", correct: 7, total: 10 }))).toBe(2);
  expect(dayLevel(S({ day: "d", correct: 8, total: 10 }))).toBe(3);
  expect(dayLevel(S({ day: "d", wordsKnown: 4, wordsTotal: 5 }))).toBe(3);
});
// 2026-11-25 Çarşamba; bu haftanın Pazartesi'si 2026-11-23
it("pencere 9 hafta × 7 gün, 4 hafta önceki Pazartesi'den başlar, gelecek kilitli, bugün ve sınav işaretli", () => {
  const w = calendarWindow({ today: "2026-11-25", days: [S({ day: "2026-11-24", correct: 9, total: 10 }), S({ day: "2026-12-01" })], examDate: "2026-12-20" });
  expect(w).toHaveLength(9);
  expect(w.every((wk) => wk.length === 7)).toBe(true);
  expect(w[0][0].day).toBe("2026-10-26");
  expect(w[8][6].day).toBe("2026-12-27");
  const flat = w.flat();
  expect(flat.find((c) => c.day === "2026-11-24")).toMatchObject({ level: 3, locked: false });
  expect(flat.find((c) => c.day === "2026-11-25")).toMatchObject({ today: true, locked: false });
  expect(flat.find((c) => c.day === "2026-12-01")).toMatchObject({ locked: true, level: 0 });
  expect(flat.filter((c) => c.exam).map((c) => c.day)).toEqual(["2026-12-20"]);
});
it("hiç oturum yok, sınav pencere dışında: hepsi 0, işaret yok", () => {
  const flat = calendarWindow({ today: "2026-11-25", days: [], examDate: "2027-03-28" }).flat();
  expect(flat.every((c) => c.level === 0 && !c.exam)).toBe(true);
});
it("daysUntil takvim günü; geçmiş negatif", () => {
  expect(daysUntil("2027-03-28", "2026-11-23")).toBe(125);
  expect(daysUntil("2026-11-20", "2026-11-23")).toBe(-3);
});
it("tipOfDay: aynı gün aynı ipucu, yanlış yoksa diğer kaynak, ikisi boşsa null", () => {
  const a = tipOfDay({ wrongRules: ["k1", "k2", "k3"], allRules: ["x"], today: "2026-11-23" });
  expect(["k1", "k2", "k3"]).toContain(a);
  expect(tipOfDay({ wrongRules: ["k1", "k2", "k3"], allRules: ["x"], today: "2026-11-23" })).toBe(a);
  expect(tipOfDay({ wrongRules: [], allRules: ["x"], today: "2026-11-23" })).toBe("x");
  expect(tipOfDay({ wrongRules: [], allRules: [], today: "2026-11-23" })).toBeNull();
});
it("todayProgress: yok 0, bitmiş 1, aradaki oran", () => {
  expect(todayProgress(null)).toBe(0);
  expect(todayProgress({ questionIds: ["a", "b"], position: 1, reviewWords: ["w1", "w2"], warmAnswers: { w1: true }, finishedAt: null })).toBe(0.5);
  expect(todayProgress({ questionIds: [], position: 0, reviewWords: ["w"], warmAnswers: {}, finishedAt: new Date() })).toBe(1);
});
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını gör**

Run: `pnpm vitest run features/dashboard/stats.test.ts`
Expected: FAIL, modül bulunamaz.

- [ ] **Step 3: `stats.ts` dosyasını yaz**

- [ ] **Step 4: Testleri çalıştır, geçtiklerini gör**

Run: `pnpm vitest run`
Expected: Bütün testler PASS.

- [ ] **Step 5: Commit**

```bash
git add features/dashboard/
git commit -m "Pano: ısı haritası penceresi, seviye, geri sayım, günün ipucu, bugünün ilerlemesi"
```

---

### Task 3: Tuzak ve kelime hesapları (saf) ve tuzak rehberi

**Files:**
- Create: `apps/web/lib/content/traps.ts`: `TRAP_GUIDE: Record<TrapCode, { how: string; catch: string }>`. Metinler `docs/TASARIM.md` §4 tablosundaki "Nasıl çalışır" ve "Nasıl yakalanır" sütunlarından **birebir** alınır.
- Create: `apps/web/features/traps/stats.ts`
- Test: `apps/web/features/traps/stats.test.ts`
- Create: `apps/web/features/words/stats.ts`
- Test: `apps/web/features/words/stats.test.ts`

**Interfaces:**
- Consumes: `ReviewRow` (`features/session/rules.ts`), `Question` ve `TrapCode` (`lib/content/schema.ts`).
- Produces (`traps/stats.ts`):
  - `type AttemptRow = { questionId: string; choice: string; correct: boolean; createdAt: Date }`
  - `type TrapStat = { code: TrapCode; count: number; lastAt: Date }`
  - `trapStats(attempts: AttemptRow[], questions: Map<string, Question>): TrapStat[]`
    - Yanlış cevapta seçilen şıkkın `traps` kodları sayılır.
    - Görünmeyen sorular yok sayılır.
    - Sıralama: önce `count` azalan, eşitlikte `lastAt` yeni olan önce.
  - `pickTrapPractice(o: { code: TrapCode; questions: Question[]; fellIds: Set<string>; size: number }): string[]`
    - Yanlış şıklarından birinde bu kodun geçtiği sorular alınır.
    - Önce `fellIds` içindekiler (içerik sırasıyla), sonra diğerleri. En fazla `size` kadar.
- Produces (`words/stats.ts`):
  - `type WordStatus = "learned" | "reviewing" | "new"`
  - `type WordRow = { word: string; tr: string; context?: string; status: WordStatus; dueAt: Date | null }`
  - `classifyWords(vocab: Map<string, Question["vocab"][number]>, reviews: ReviewRow[]): WordRow[]`
    - `reps >= 2` ise `learned`, kayıt var ama `reps < 2` ise `reviewing`, kayıt yoksa `new`.
    - Görünmeyen kelimelerin kayıtları yok sayılır.
  - `pickWordPractice(o: { words: WordRow[]; status: WordStatus; excluded: Set<string>; dueBefore: Date; size: number }): string[]`
    - Seçili durumdaki kelimelerden `excluded` içindekiler ve `dueAt < dueBefore` olanlar çıkarılır.
    - `reviewing` sekmesinde `dueAt` artan sırayla sıralanır, diğer sekmelerde liste sırası korunur. En fazla `size` kadar.
  - `shouldRecordWordPractice(o: { review: ReviewRow | null; correct: boolean; dueBefore: Date }): boolean`
    - Kayıt yoksa `true`.
    - `dueAt < dueBefore` ise `false`, çünkü kelime bugün günlük oturumda sorulacak.
    - Diğer durumda yalnızca `correct === false` ise `true`.

- [ ] **Step 1: Başarısız testleri yaz**

`traps/stats.test.ts`. `q(id, answer, trapsByKey)` küçük bir soru yapıcıdır. Doğru şıkta tuzak kodu yoktur.
```ts
it("yanlış seçilen şıkların kodları sayılır, doğrular ve görünmeyenler sayılmaz, sıralı", () => {
  const qs = new Map([["q1", q("q1", "A", { B: ["T3"], C: ["T3", "T6"] })], ["q2", q("q2", "A", { B: ["T6"] })]]);
  const at = (questionId: string, choice: string, correct: boolean, iso: string) => ({ questionId, choice, correct, createdAt: new Date(iso) });
  const s = trapStats([at("q1", "C", false, "2026-11-20"), at("q1", "B", false, "2026-11-21"), at("q2", "B", false, "2026-11-22"), at("q1", "A", true, "2026-11-23"), at("gizli", "B", false, "2026-11-23")], qs);
  expect(s.map((x) => [x.code, x.count])).toEqual([["T6", 2], ["T3", 2]]); // eşit sayıda son tarih (T6: 22 Kasım) önce
});
it("hiç yanlış yoksa boş", () => { expect(trapStats([], new Map())).toEqual([]); });
it("tuzak çalışması: önce düşülenler, sonra diğerleri, size ile sınırlı", () => {
  const list = [q("a", "A", { B: ["T3"] }), q("b", "A", { B: ["T6"] }), q("c", "A", { C: ["T3"] }), q("d", "A", { D: ["T3"] })];
  expect(pickTrapPractice({ code: "T3", questions: list, fellIds: new Set(["d"]), size: 2 })).toEqual(["d", "a"]);
});
```
`words/stats.test.ts`:
```ts
const dueBefore = new Date("2026-11-23T21:00:00Z");
it("sınıflandırma: reps>=2 öğrenildi, kayıtlı<2 tekrarda, kayıtsız yeni; görünmeyen kayıt yok sayılır", () => {
  const vocab = new Map([["a", { word: "a", tr: "A" }], ["b", { word: "b", tr: "B" }], ["c", { word: "c", tr: "C" }]]);
  const rows = classifyWords(vocab, [r("a", "2026-12-01T00:00:00Z", 2), r("b", "2026-11-24T00:00:00Z", 1), r("gizli", "2026-11-20T00:00:00Z", 0)]);
  expect(rows.map((w) => [w.word, w.status])).toEqual([["a", "learned"], ["b", "reviewing"], ["c", "new"]]);
});
it("serbest çalışma bugün zamanı gelenleri ve bugünün oturumundakileri almaz", () => {
  const words = [W("x", "reviewing", "2026-11-23T10:00:00Z"), W("y", "reviewing", "2026-11-26T00:00:00Z"), W("z", "reviewing", "2026-11-25T00:00:00Z"), W("o", "reviewing", "2026-11-27T00:00:00Z")];
  expect(pickWordPractice({ words, status: "reviewing", excluded: new Set(["o"]), dueBefore, size: 10 })).toEqual(["z", "y"]);
});
it("yazma kuralı: yeni her zaman, bugün zamanı gelen asla, zamanı gelmemişte yalnızca yanlış", () => {
  expect(shouldRecordWordPractice({ review: null, correct: true, dueBefore })).toBe(true);
  expect(shouldRecordWordPractice({ review: r("w", "2026-11-23T10:00:00Z"), correct: false, dueBefore })).toBe(false);
  expect(shouldRecordWordPractice({ review: r("w", "2026-11-30T00:00:00Z"), correct: true, dueBefore })).toBe(false);
  expect(shouldRecordWordPractice({ review: r("w", "2026-11-30T00:00:00Z"), correct: false, dueBefore })).toBe(true);
});
```
(`r` ve `W` test içinde küçük yapıcılardır, `features/session/rules.test.ts` dosyasındaki `r` ile aynı biçimde.)

Ayrıca `traps.ts` için bir test: `TRAP_GUIDE` içinde bütün `TRAP_CODES` kodlarının bulunması ve her metnin boş olmaması.

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını gör**

Run: `pnpm vitest run features/traps features/words lib/content/traps`
Expected: FAIL, modüller bulunamaz.

- [ ] **Step 3: Dosyaları yaz**

- [ ] **Step 4: Testleri çalıştır**

Run: `pnpm vitest run`
Expected: Bütün testler PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/traps.ts lib/content/traps.test.ts features/traps/ features/words/
git commit -m "Tuzak istatistiği, kelime sınıflandırması, serbest çalışma seçimi ve yazma kuralı"
```

---

### Task 4: Sınav tarihi

**Files:**
- Modify: `apps/web/lib/db/schema.ts`: `user` tablosuna `examDate: date("exam_date", { mode: "string" })`.
- Create: migration (`pnpm db:generate`).
- Create: `apps/web/features/profile/exam-date.ts` (saf), `apps/web/features/profile/actions.ts` (`"use server"`).
- Test: `apps/web/features/profile/exam-date.test.ts`
- Create: `apps/web/features/profile/components/exam-date-dialog.tsx` (istemci; shadcn Dialog ve Calendar).

**Interfaces:**
- Consumes: `todayKey` (`features/session/day.ts`), `daysUntil` (Task 2).
- Produces:
  - `parseExamDate(input: unknown, today: string): { ok: true; date: string | null } | { ok: false }`
    - `null` kabul edilir.
    - `YYYY-MM-DD` biçiminde geçerli bir takvim günü olmalı. Gidiş-dönüş kontrolü yapılır: `2026-02-30` reddedilir.
    - `>= today` olmalı.
  - `setExamDate(date: string | null): Promise<{ ok: boolean }>`: `requireUser` ile kullanıcıyı alır, sonra `parseExamDate` ile doğrular ve `user.exam_date` alanını günceller.
  - `<ExamDateDialog initial={string | null} autoOpen={boolean} />`:
    - `autoOpen` doğruysa ve `localStorage["yds-sinav-sonra"]` yoksa kendiliğinden açılır.
    - "Sonra" düğmesi bu anahtarı yazar.
    - Kaydedince `router.refresh()` çağrılır.

- [ ] **Step 1: Başarısız testi yaz**

```ts
it("geçerli gelecek tarih ve bugün kabul, null kabul", () => {
  expect(parseExamDate("2027-03-28", "2026-11-23")).toEqual({ ok: true, date: "2027-03-28" });
  expect(parseExamDate("2026-11-23", "2026-11-23")).toEqual({ ok: true, date: "2026-11-23" });
  expect(parseExamDate(null, "2026-11-23")).toEqual({ ok: true, date: null });
});
it("geçmiş, olmayan gün ve biçimsiz reddedilir", () => {
  for (const bad of ["2026-11-22", "2027-02-30", "28.03.2027", 20270328, ""]) expect(parseExamDate(bad, "2026-11-23")).toEqual({ ok: false });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `pnpm vitest run features/profile`
Expected: FAIL, modül bulunamaz.

- [ ] **Step 3: `exam-date.ts`, şema, migration, action ve dialog bileşenini yaz**

Run: `pnpm db:generate`
Expected: `drizzle/0008_*.sql` dosyası `ALTER TABLE "user" ADD COLUMN "exam_date" date;` içerir.

- [ ] **Step 4: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/ features/profile/
git commit -m "Sınav tarihi: kolon, doğrulama, server action, tarih penceresi"
```

---

### Task 5: Pano sayfası

**Files:**
- Create: `apps/web/features/dashboard/server.ts`
- Create: `apps/web/features/dashboard/components/`:
  - `today-task-card.tsx` (kahraman kart, 4 durum)
  - `exam-countdown-card.tsx`
  - `week-goal-card.tsx`
  - `day-calendar.tsx` (react-activity-calendar; kilitli günler için katman, sınav bayrağı, Tooltip)
  - `words-card.tsx`
  - `traps-card.tsx`
  - `tip-card.tsx`
- Create: `apps/web/features/ui/sound-toggle.tsx` (istemci; `yds-ses`, lucide `Volume2`/`VolumeX`, Switch)
- Modify: `apps/web/app/page.tsx`: pano düzeni. Mobilde 2, `lg` ve üstünde 4 sütun. Kahraman kart, takvim ve ipucu 2 sütun genişliğinde.
- Modify: `apps/web/app/layout.tsx`: sonner `<Toaster />` eklenir.

**Interfaces:**
- Consumes:
  - Task 2'nin bütün fonksiyonları
  - Task 3: `trapStats`, `classifyWords`, `TRAP_GUIDE`
  - Task 4: `ExamDateDialog`, `daysUntil`
  - Günlük oturumdan: `getTodaySession`, `planToday`, `finishedDays`, `weekDaysDone`, `vocabByWord`, `todayKey`, `WEEKLY_GOAL`
- Produces:
  - `dashboardData(userId: string, now: Date)`: `Promise<{ today, plan, progress: number, weekDays: number, calendar: DayCell[][], examDate: string | null, daysLeft: number | null, words: { learned: number; reviewing: number }, topTrap: TrapStat | null, tip: string | null }>`
  - `planToday` yalnızca bugünün satırı yoksa çağrılır. Bu davranış günlük oturumdakiyle aynıdır.
  - `DaySummary` verisi şuradan gelir:
    - `practice_sessions`: yalnızca `day` dolu satırlar, son 5 hafta.
    - `correct`: aynı oturumun `attempts` kayıtları.
    - `wordsKnown`: `warmAnswers` içinde `reviewWords` kelimelerinin `true` olanları.

**Davranış:**
- Kahraman kartın dört durumu günlük oturumdaki gibi kalır: Başla, Devam et, Bitti ("Gözden geçir" bağlantısı) ve İş yok. Kartta `todayProgress` halkası bulunur.
- **Sınav kartı:**
  - Tarih yok: "Sınav tarihini ekle". Pencere bir kez kendiliğinden açılır (`autoOpen`).
  - Tarih var: "Sınava N gün" ve düzenleme simgesi.
  - `daysLeft < 0`: "Sınav günü geçti — yeni tarih ekle".

- [ ] **Step 1: `dashboardData` ve kart bileşenlerini yaz, `page.tsx` dosyasını pano düzenine geçir**

- [ ] **Step 2: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0.

- [ ] **Step 3: Commit**

```bash
git add features/dashboard/ features/ui/ app/
git commit -m "Pano: günün görevi, sınav geri sayımı, haftalık hedef, gün takvimi, kelime/tuzak/ipucu kartları"
```

---

### Task 6: Oturum içi: kutlama, ses, tuzak uyarısı, yeni görünüm

**Files:**
- Modify: `apps/web/features/session/session-machine.ts`
  - `feedbackFor(prev: State, a: Action, next: State): "correct" | "wrong" | null` eklenir:
    - `submit` için: yeni cevabın şıkkı doğru cevapla aynıysa `correct`, değilse `wrong`.
    - `warmPick` için: `warmAnswers` içine eklenen değer.
    - Diğer eylemler için `null`.
  - Snapshot'a `topTrap: { code: TrapCode; name: string; catch: string } | null` ve `tip: string | null` eklenir.
- Modify: `apps/web/features/session/session-machine.test.ts` ve `keyboard.test.ts` (fixture'lara `topTrap: null, tip: null`).
- Modify: `apps/web/features/session/server.ts`: `loadSnapshot` bu iki alanı doldurur (`trapStats`, `TRAP_GUIDE`, `tipOfDay`).
- Create: `apps/web/features/session/celebrate.ts` (istemci)
- Test: `apps/web/features/session/celebrate.test.ts`
- Modify: `practice-session.tsx`:
  - `act` içinde `feedbackFor` sonucu `celebrate` fonksiyonuna verilir.
  - Üst üste doğru sayacı bir ref'te tutulur, yanlışta sıfırlanır.
- Modify: `question-view.tsx` (`topTrap` uyarı şeridi), `screens.tsx` (molada ipucu kartı), `ui.tsx` (shadcn Button/Progress'e taşınır).
- Modify: Oturum ekranları yeni palete ve shadcn bileşenlerine geçer. Davranış değişmez, mevcut testler yeşil kalır.

**Interfaces:**
- Produces:
  - `celebrate(kind: "correct" | "wrong", opts: { streak: number; sound: boolean; reducedMotion: boolean; fx: { play: (k: "correct" | "wrong" | "streak") => void; burst: (big: boolean) => void; toast: (msg: string) => void } }): void`
    - `fx` dışarıdan verilir, gerçek uygulama zzfx, canvas-confetti ve sonner ile sağlar. Bu sayede fonksiyon testlenebilir.
  - Davranış:
    - `wrong`: Ses açıksa `play("wrong")`. Başka hiçbir şey yapılmaz.
    - `correct`:
      - Ses açıksa `play(streak >= 3 ? "streak" : "correct")`.
      - Hareket kapalı değilse `burst(streak >= 3)`.
      - `streak === 3` ise `toast("3 doğru üst üste — ritmi yakaladın")`.
  - `useSoundPref(): [boolean, (v: boolean) => void]`: `localStorage["yds-ses"]`, varsayılan `true`.

- [ ] **Step 1: Başarısız testleri yaz**

`session-machine.test.ts`:
```ts
it("feedbackFor: doğru/yanlış cevap ve ısınma seçimi, diğer eylemler null", () => {
  const s = atQuestion(); // q1 cevabı C
  const sel = reduce(s, { type: "select", key: "C" });
  expect(feedbackFor(sel, { type: "submit", sure: true, now: 2 }, reduce(sel, { type: "submit", sure: true, now: 2 }))).toBe("correct");
  const selB = reduce(s, { type: "select", key: "B" });
  expect(feedbackFor(selB, { type: "submit", sure: true, now: 2 }, reduce(selB, { type: "submit", sure: true, now: 2 }))).toBe("wrong");
  expect(feedbackFor(s, { type: "select", key: "C" }, sel)).toBeNull();
});
```
`celebrate.test.ts`:
```ts
const spyFx = () => ({ play: vi.fn(), burst: vi.fn(), toast: vi.fn() });
it("ses ve hareket açık, 1. doğru: tını + küçük patlama, bildirim yok", () => {
  const fx = spyFx(); celebrate("correct", { streak: 1, sound: true, reducedMotion: false, fx });
  expect(fx.play).toHaveBeenCalledWith("correct"); expect(fx.burst).toHaveBeenCalledWith(false); expect(fx.toast).not.toHaveBeenCalled();
});
it("3. doğru: büyük patlama + bildirim", () => {
  const fx = spyFx(); celebrate("correct", { streak: 3, sound: true, reducedMotion: false, fx });
  expect(fx.play).toHaveBeenCalledWith("streak"); expect(fx.burst).toHaveBeenCalledWith(true); expect(fx.toast).toHaveBeenCalledWith("3 doğru üst üste — ritmi yakaladın");
});
it("ses kapalı: hiç ses yok; hareket azaltılmış: patlama yok", () => {
  const fx = spyFx(); celebrate("correct", { streak: 1, sound: false, reducedMotion: true, fx });
  expect(fx.play).not.toHaveBeenCalled(); expect(fx.burst).not.toHaveBeenCalled();
});
it("yanlış: yalnızca yumuşak ses, emoji yok", () => {
  const fx = spyFx(); celebrate("wrong", { streak: 0, sound: true, reducedMotion: false, fx });
  expect(fx.play).toHaveBeenCalledWith("wrong"); expect(fx.burst).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını gör**

Run: `pnpm vitest run features/session`
Expected: Yeni testler FAIL.

- [ ] **Step 3: Kodu yaz.**

Gerçek `fx` uygulaması:
- **Ses:** zzfx ile üç kısa parametre seti: parlak tını, daha uzun "streak" tınısı ve yumuşak "tık".
- **Patlama:** `confetti({ shapes: ["👏", "🎉", "✨"].map((t) => confetti.shapeFromText({ text: t, scalar })), … })`. Süre en fazla 1,2 sn.
- **Bildirim:** sonner `toast`.

- [ ] **Step 4: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0.

- [ ] **Step 5: Commit**

```bash
git add features/session/ app/
git commit -m "Oturum: doğru cevapta ses ve emoji kutlaması, tuzak uyarısı, molada ipucu, yeni görünüm"
```

---

### Task 7: Kelimeler sayfası ve kelime pratiği yazımı

**Files:**
- Create: `apps/web/app/kelimeler/page.tsx` (sunucu; `<Suspense>`)
- Create: `apps/web/features/words/server.ts`: `wordsPageData(userId, now)` → `{ rows: WordRow[]; counts }`
- Create: `apps/web/features/words/actions.ts` (`"use server"`): `recordWordPractice(word: string, correct: boolean): Promise<ActionResult>`
- Create: `apps/web/features/words/inputs.ts`: `WordPracticeInput = z.object({ word: z.string().min(1).max(100), correct: z.boolean() })`
- Test: `apps/web/features/words/inputs.test.ts`
- Create: `apps/web/features/words/components/words-view.tsx` (istemci; Tabs, arama, liste, "Kelime çalış" bağlantısı → `/calis?tur=kelime&sekme=<status>`)

**Interfaces:**
- Consumes: Task 3'teki `classifyWords`, `pickWordPractice`, `shouldRecordWordPractice`; günlük oturumdaki `vocabByWord`, `getTodaySession`, `dayEnd`, `todayKey`, `upsertReview`, `WARMUP_GRADE`.
- **`recordWordPractice` davranışı:**
  1. Girdi doğrulanır.
  2. Kelime görünür kelimelerde (`vocabByWord`) yoksa `invalid` döner.
  3. Kelime bugünün oturumunun `reviewWords` listesindeyse `invalid` döner.
  4. Kayıt okunur. `shouldRecordWordPractice` doğruysa `upsertReview(user, "word", word, correct ? WARMUP_GRADE.correct : WARMUP_GRADE.wrong, now)` yazılır, değilse yazılmaz. İki durumda da `OK` döner.

- [ ] **Step 1: `inputs.test.ts` dosyasını yaz** (boş, 100 karakterden uzun ve metin olmayan kelime reddedilir; `correct` boolean olmalı). Çalıştır ve başarısız olduğunu gör.

Run: `pnpm vitest run features/words/inputs.test.ts`
Expected: FAIL, modül bulunamaz.

- [ ] **Step 2: `inputs.ts`, `actions.ts`, `server.ts`, sayfa ve bileşeni yaz. Testi çalıştır, geçtiğini gör**

- [ ] **Step 3: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0.

- [ ] **Step 4: Commit**

```bash
git add app/kelimeler features/words/
git commit -m "Kelimeler sayfası: öğrenildi/tekrarda/yeni, arama, kelime pratiği yazımı"
```

---

### Task 8: Tuzaklarım sayfası

**Files:**
- Create: `apps/web/app/tuzaklar/page.tsx`
- Create: `apps/web/features/traps/server.ts`: `trapsPageData(userId)` → `{ stats: TrapStat[]; untouched: TrapCode[] }`
- Create: `apps/web/features/traps/components/traps-view.tsx`
  - Liste: kod, ad, kaç kez düşüldüğü, son tarih ve `TRAP_GUIDE` metinleri.
  - Altta soluk bir "Henüz düşmediklerin" listesi.
  - Her satırda "Bu tuzağı çalış" bağlantısı → `/calis?tur=tuzak&kod=<kod>`.

**Interfaces:** Consumes: Task 3'teki `trapStats`, `TRAP_GUIDE`, `TRAP_NAMES`; `getAllQuestions`, `attempts` (yalnızca kullanıcının kayıtları).

- [ ] **Step 1: Sunucu fonksiyonunu, sayfayı ve bileşeni yaz**

- [ ] **Step 2: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0.

- [ ] **Step 3: Commit**

```bash
git add app/tuzaklar features/traps/
git commit -m "Tuzaklarım sayfası: düşülen tuzaklar, rehber metinleri, henüz düşmediklerin"
```

---

### Task 9: Serbest çalışma (`/calis`)

**Files:**
- Create: `apps/web/features/practice/send.ts`
- Test: `apps/web/features/practice/send.test.ts`
- Create: `apps/web/features/practice/server.ts`: `practiceSnapshot(userId, params, now): Promise<Snapshot | null>`
  - **Kelime (`tur=kelime`):**
    - `questions: []`.
    - `reviewVocab`: `pickWordPractice` (Task 3) ile seçilen kelimeler. `excluded` = bugünün oturumunun `reviewWords` listesi.
    - `meaningPool`: görünür bütün anlamlar.
  - **Tuzak (`tur=tuzak`):**
    - `questions`: `pickTrapPractice` ile seçilen 5 soru, `fellIds` = kullanıcının bu tuzağa düştüğü sorular.
    - `warmDone`: her blok işaretli, yani ısınma yok. `reviewVocab: []`.
  - Ortak alanlar: `sessionId` olarak sabit `"pratik"`, `position: 0`, `breakSeen: true`, `answers: {}`, `weekDays: 0`, `newLeft: 0`, `topTrap: null`, `tip: null`.
  - Seçilecek bir şey yoksa `null` döner.
- Create: `apps/web/app/calis/page.tsx`: `searchParams` zod ile doğrulanır. `null` ise "Şu an çalışılacak kelime/soru yok" mesajı ve geri bağlantısı gösterilir.
- Modify: `practice-session.tsx` bileşenine `mode: "daily" | "practice"` prop'u eklenir.
  - `practice` modunda kayıt kuyruğu `practiceSend` ile kurulur.
  - Özet ekranında haftalık hedef ve havuz bilgisi gizlenir.
  - Özette "Panoya dön" bağlantısı gösterilir.

**Interfaces:**
- Produces:
  - `practiceSend(e: Effect, recordWord: (word: string, correct: boolean) => Promise<ActionResult>): Promise<ActionResult | void>`
  - Yalnızca `{ kind: "recordWarmup" }` effect'i `recordWord` fonksiyonuna iletilir. Diğer bütün effect türleri hiçbir şey çağırmadan `undefined` döner.

- [ ] **Step 1: Başarısız testi yaz**

```ts
it("yalnızca kelime cevabı iletilir; soru cevabı, ilerleme, ısınma bitişi, mola hiçbir şey yazmaz", async () => {
  const recordWord = vi.fn(async () => ({ ok: true as const }));
  await practiceSend({ kind: "recordWarmup", word: "w", correct: false }, recordWord);
  for (const e of [
    { kind: "recordAnswer", questionId: "q", answer: { choice: "A", sure: true, glossUsed: false, hintUsed: false, wordsUsed: false }, durationMs: 1 },
    { kind: "advance", position: 1 }, { kind: "markWarmDone", block: -1 }, { kind: "markBreakSeen" },
  ] as const) expect(await practiceSend(e, recordWord)).toBeUndefined();
  expect(recordWord).toHaveBeenCalledTimes(1);
  expect(recordWord).toHaveBeenCalledWith("w", false);
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `pnpm vitest run features/practice`
Expected: FAIL, modül bulunamaz.

- [ ] **Step 3: `send.ts`, `server.ts`, sayfa ve `practice-session.tsx` modunu yaz**

- [ ] **Step 4: Kontroller**

Run: `pnpm vitest run; pnpm eslint .; pnpm tsc --noEmit`
Expected: Bütün testler PASS, eslint ve tsc çıkış kodu 0.

- [ ] **Step 5: Commit**

```bash
git add features/practice/ app/calis features/session/components/practice-session.tsx
git commit -m "Serbest çalışma: kelime ve tuzak pratiği, günlük oturumu ve istatistikleri değiştirmeden"
```

---

### Task 10: Migration, tarayıcıda deneme ve UI kontrolü

- [ ] **Step 1: Migration'ı uygula (önce kullanıcıdan onay alınır, canlı Neon veritabanı)**

Run: `pnpm db:migrate`
Expected: Migration başarılı olur. `user` tablosunda `exam_date` kolonu bulunur.

- [ ] **Step 2: Tarayıcıyla deneme**

Önceki planda kullanılan Playwright sürücüsü (scratchpad `drive/`) ve test hesabı (`test-gunluk@ornek.invalid`) genişletilir. Denenecekler:
- **Pano:**
  - tarih yokken pencerenin kendiliğinden açılması, "Sonra" düğmesi
  - tarih girme, geri sayımın görünmesi
  - geçmiş tarihin reddedilmesi
- **Oturum:** doğru cevapta konfeti katmanının (canvas) görünmesi. Testte ses kapatılır.
- **Hareket:** `reducedMotion: "reduce"` bağlamında konfetinin oynamaması.
- **Kelimeler:** sekmeler ve kelime çalışması. Çalışmanın ardından `review_items` kaydında yalnızca kurala uyan değişikliklerin olduğu sorguyla doğrulanır.
- **Tuzaklarım:** tuzak çalışması. Ardından `attempts`, `review_items` ve `practice_sessions` tablolarındaki satır sayılarının değişmediği doğrulanır.

Sayfa hatası ve konsol hatası olmamalı.

- [ ] **Step 3: Ekran görüntüleri ve UI kontrolü**

- Ekran genişlikleri: 375, 768, 1280 px.
- Görüntülenecek ekranlar: pano (4 durum, sınav kartının 3 hali), oturum (soru, kutlama anı, tuzak uyarısı), Kelimeler, Tuzaklarım, serbest çalışma.
- `ui-ux-pro-max` kontrol listesi uygulanır. Kontrast Task 1'deki testle zaten sabitlenmiş durumda.
- Görüntüler kullanıcıya gösterilir. Bulunan sorunlar düzeltilir.

- [ ] **Step 4: Commit** (yalnızca düzeltme varsa)
