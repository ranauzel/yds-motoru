// Soruları veritabanından okur (sunucu tarafı). Satırlar import sırasında şemayla doğrulandı.
import { asc, inArray } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import type { Question } from "./schema";

const { questions } = schema;

/** Bütün sorular, sınav ve soru numarasına göre sıralı. Aynı istek içinde bir kez sorgulanır. */
export const getAllQuestions = cache(async (): Promise<Question[]> => {
  const rows = await db.select({ data: questions.data }).from(questions)
    .orderBy(asc(questions.examId), asc(questions.number));
  return rows.map((r) => r.data);
});

export async function getQuestionsByIds(ids: string[]): Promise<Map<string, Question>> {
  if (!ids.length) return new Map();
  const rows = await db.select({ data: questions.data }).from(questions).where(inArray(questions.id, ids));
  return new Map(rows.map((r) => [r.data.id, r.data]));
}

export async function getQuestion(id: string): Promise<Question | undefined> {
  return (await getQuestionsByIds([id])).get(id);
}
