// Misafir (demo) modu: canlı demoda ziyaretçiler tek tıkla geçici hesapla girer.
// Kendi kurulumunda kapalıdır; açmak için ALLOW_GUEST=true.
import { timingSafeEqual } from "node:crypto";

export const GUEST_TTL_DAYS = 7;

export const guestEnabled = () => process.env.ALLOW_GUEST === "true";

/** Bu tarihten önce açılmış misafir hesapları silinir. */
export function guestCutoff(now: Date): Date {
  return new Date(now.getTime() - GUEST_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Vercel Cron, CRON_SECRET'i "Authorization: Bearer <anahtar>" başlığıyla gönderir. */
export function isCronAuthorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
