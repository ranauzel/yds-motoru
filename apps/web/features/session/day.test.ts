import { describe, expect, it } from "vitest";
import { dayEnd, todayKey, weekDaysDone } from "./day";

describe("gün", () => {
  it("todayKey İstanbul gününe göre: UTC 21:30 ertesi gün, 20:59 aynı gün", () => {
    expect(todayKey(new Date("2026-11-23T21:30:00Z"))).toBe("2026-11-24");
    expect(todayKey(new Date("2026-11-23T20:59:00Z"))).toBe("2026-11-23");
  });

  it("dayEnd İstanbul'da ertesi günün 00:00'ı", () => {
    expect(dayEnd(new Date("2026-11-23T08:00:00+03:00")).toISOString()).toBe("2026-11-23T21:00:00.000Z");
    expect(dayEnd(new Date("2026-11-30T23:59:00+03:00")).toISOString()).toBe("2026-11-30T21:00:00.000Z"); // ay sonu
  });

  // 2026-11-23 Pazartesi, 2026-11-29 Pazar, 2026-11-30 Pazartesi
  it("haftalık hedef: yalnızca bu haftanın (Pzt–Paz) bitmiş günleri sayılır", () => {
    expect(weekDaysDone(["2026-11-22", "2026-11-23", "2026-11-25"], "2026-11-26")).toBe(2); // 22 Kasım önceki hafta
    expect(weekDaysDone(["2026-11-23", "2026-11-29"], "2026-11-29")).toBe(2);
    expect(weekDaysDone(["2026-11-23", "2026-11-29"], "2026-11-30")).toBe(0); // yeni hafta
    expect(weekDaysDone(["2026-11-24", "2026-11-24"], "2026-11-24")).toBe(1); // aynı gün bir kez
    expect(weekDaysDone([], "2026-11-24")).toBe(0);
  });
});
