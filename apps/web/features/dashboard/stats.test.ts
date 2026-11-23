import { describe, expect, it } from "vitest";
import { calendarWindow, dayLevel, daysUntil, tipOfDay, todayProgress, type DaySummary } from "./stats";

const S = (o: Partial<DaySummary> & { day: string }): DaySummary => ({ finished: true, correct: 0, total: 0, wordsKnown: 0, wordsTotal: 0, ...o });

describe("pano hesapları", () => {
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
});
