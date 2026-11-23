import { describe, expect, it } from "vitest";
import { parseExamDate } from "./exam-date";

describe("parseExamDate", () => {
  it("geçerli gelecek tarih ve bugün kabul, null kabul", () => {
    expect(parseExamDate("2027-03-28", "2026-11-23")).toEqual({ ok: true, date: "2027-03-28" });
    expect(parseExamDate("2026-11-23", "2026-11-23")).toEqual({ ok: true, date: "2026-11-23" });
    expect(parseExamDate(null, "2026-11-23")).toEqual({ ok: true, date: null });
  });
  it("geçmiş, olmayan gün ve biçimsiz reddedilir", () => {
    for (const bad of ["2026-11-22", "2027-02-30", "28.03.2027", 20270328, ""]) expect(parseExamDate(bad, "2026-11-23")).toEqual({ ok: false });
  });
});
