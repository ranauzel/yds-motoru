import { afterEach, describe, expect, it, vi } from "vitest";
import { GUEST_TTL_DAYS, guestCutoff, guestEnabled, isCronAuthorized } from "./guest";

afterEach(() => vi.unstubAllEnvs());

describe("misafir modu", () => {
  it("yalnızca ALLOW_GUEST=true iken açık", () => {
    vi.stubEnv("ALLOW_GUEST", "");
    expect(guestEnabled()).toBe(false);
    vi.stubEnv("ALLOW_GUEST", "true");
    expect(guestEnabled()).toBe(true);
  });

  it("temizlik sınırı şu andan GUEST_TTL_DAYS gün öncesi", () => {
    const now = new Date("2026-11-23T12:00:00Z");
    expect(GUEST_TTL_DAYS).toBe(7);
    expect(guestCutoff(now).toISOString()).toBe("2026-11-16T12:00:00.000Z");
  });

  it("cron isteği yalnızca doğru gizli anahtarla kabul edilir", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isCronAuthorized("Bearer ")).toBe(false); // anahtar tanımlı değilse hiç kabul etme
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isCronAuthorized("Bearer s3cret")).toBe(true);
    expect(isCronAuthorized("Bearer yanlis")).toBe(false);
    expect(isCronAuthorized(null)).toBe(false);
  });
});
