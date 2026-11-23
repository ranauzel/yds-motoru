// Soruları veritabanından okur (sunucu tarafı). Satırlar import sırasında şemayla doğrulandı.
// Her kullanıcı yalnızca kendi sorularını görür; hiç sorusu yoksa (ör. misafir) herkese açık örnekleri.
import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import type { Question } from "./schema";

const { questions } = schema;

/** Bu kullanıcının görebileceği soruların filtresi. Aynı istek içinde bir kez hesaplanır. */
const visibility = cache(async (userId: string): Promise<SQL> => {
  const own = await db.select({ id: questions.id }).from(questions).where(eq(questions.ownerId, userId)).limit(1);
  return own.length ? eq(questions.ownerId, userId) : eq(questions.isPublic, true);
});

/**
 * Kullanıcının bütün soruları, sınav ve soru numarasına göre sıralı.
 * Soru bankası büyük (her soru metin, şık, çeviri, kelime taşır) ve yalnızca `pnpm content:import` ile değişir;
 * bu yüzden sunucu belleğinde kullanıcı başına birkaç dakika tutulur, her sayfada baştan indirilmez.
 * Yeni içerik en geç bir iki dakika içinde görünür.
 */
export async function getAllQuestions(userId: string): Promise<Question[]> {
  "use cache";
  cacheLife("minutes");
  const rows = await db.select({ data: questions.data }).from(questions)
    .where(await visibility(userId))
    .orderBy(asc(questions.examId), asc(questions.number));
  return rows.map((r) => r.data);
}

export async function getQuestionsByIds(userId: string, ids: string[]): Promise<Map<string, Question>> {
  if (!ids.length) return new Map();
  const rows = await db.select({ data: questions.data }).from(questions)
    .where(and(inArray(questions.id, ids), await visibility(userId)));
  return new Map(rows.map((r) => [r.data.id, r.data]));
}

export async function getQuestion(userId: string, id: string): Promise<Question | undefined> {
  return (await getQuestionsByIds(userId, [id])).get(id);
}
