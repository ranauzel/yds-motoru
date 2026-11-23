// Kullanıcının ilerleme verisini okuyan tek yer: tekrar kayıtları (review_items) ve cevap geçmişi (attempts).
// Pano, oturum, Kelimeler, Tuzaklarım ve serbest çalışma buradan okur; aynı istek içinde her biri bir kez sorgulanır.
import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import type { ReviewRow } from "@/features/session/rules";

const { attempts, reviewItems } = schema;

export type AttemptRow = {
  sessionId: string | null; questionId: string; choice: string; correct: boolean; createdAt: Date;
  sure: boolean; glossUsed: boolean; hintUsed: boolean;
};

/** Kullanıcının bir türdeki (kelime ya da soru) bütün tekrar kayıtları. */
export const reviewRows = cache(async (userId: string, kind: "word" | "question"): Promise<ReviewRow[]> =>
  db.select({ itemId: reviewItems.itemId, dueAt: reviewItems.dueAt, priority: reviewItems.priority, reps: reviewItems.reps })
    .from(reviewItems).where(and(eq(reviewItems.userId, userId), eq(reviewItems.kind, kind))));

/** Kullanıcının bütün cevapları. Tuzak istatistikleri tüm geçmişi kullandığı için tarihle sınırlanmaz. */
export const attemptRows = cache(async (userId: string): Promise<AttemptRow[]> =>
  db.select({
    sessionId: attempts.sessionId, questionId: attempts.questionId, choice: attempts.choice,
    correct: attempts.correct, createdAt: attempts.createdAt,
    sure: attempts.sure, glossUsed: attempts.glossUsed, hintUsed: attempts.hintUsed,
  }).from(attempts).where(eq(attempts.userId, userId)));
