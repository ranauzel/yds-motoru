"use server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { todayKey } from "@/features/session/day";
import { parseExamDate } from "./exam-date";

/** Sınav tarihini kaydeder (null: temizler). Geçersiz girdi { ok: false } döner. */
export async function setExamDate(date: string | null): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = parseExamDate(date, todayKey(new Date()));
  if (!parsed.ok) return { ok: false };
  await db.update(schema.user).set({ examDate: parsed.date }).where(eq(schema.user.id, user.id));
  return { ok: true };
}
