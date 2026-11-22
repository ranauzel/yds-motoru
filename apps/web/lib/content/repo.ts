// Soruları veritabanından okur (sunucu tarafı). Satırlar import sırasında şemayla doğrulandı.
// Her kullanıcı yalnızca kendi sorularını görür; hiç sorusu yoksa herkese açık örnekleri (bkz. visibleTo).
import { and, asc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import { visibleTo } from "./import-args";
import type { Question } from "./schema";

const { questions } = schema;

/** Bu kullanıcının görebileceği soruların filtresi. Aynı istek içinde bir kez hesaplanır. */
const visibility = cache(async (userId: string): Promise<SQL> => {
  const own = await db.select({ id: questions.id }).from(questions).where(eq(questions.ownerId, userId)).limit(1);
  return visibleTo(own.length > 0) === "own" ? eq(questions.ownerId, userId) : isNull(questions.ownerId);
});

/** Kullanıcının bütün soruları, sınav ve soru numarasına göre sıralı. */
export const getAllQuestions = cache(async (userId: string): Promise<Question[]> => {
  const rows = await db.select({ data: questions.data }).from(questions)
    .where(await visibility(userId))
    .orderBy(asc(questions.examId), asc(questions.number));
  return rows.map((r) => r.data);
});

export async function getQuestionsByIds(userId: string, ids: string[]): Promise<Map<string, Question>> {
  if (!ids.length) return new Map();
  const rows = await db.select({ data: questions.data }).from(questions)
    .where(and(inArray(questions.id, ids), await visibility(userId)));
  return new Map(rows.map((r) => [r.data.id, r.data]));
}

export async function getQuestion(userId: string, id: string): Promise<Question | undefined> {
  return (await getQuestionsByIds(userId, [id])).get(id);
}
