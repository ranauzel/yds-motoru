// Doğrulanmış soru dosyalarını veritabanı satırlarına çevirir (content:import kullanır).
import { createHash } from "node:crypto";
import type { Question, QuestionFile } from "./schema";

export type QuestionRow = {
  id: string;
  examId: string;
  examName: string;
  examDate: string;
  number: number;
  type: Question["type"];
  topic: Question["topic"];
  status: Question["review"]["status"];
  data: Question;
  hash: string;
};

export function toQuestionRows(files: QuestionFile[]): QuestionRow[] {
  const seen = new Set<string>();
  return files.flatMap((f) => f.questions.map((q) => {
    if (seen.has(q.id)) throw new Error(`Aynı soru id'si birden fazla dosyada: ${q.id}`);
    seen.add(q.id);
    return {
      id: q.id, examId: f.exam.id, examName: f.exam.name, examDate: f.exam.date,
      number: q.number, type: q.type, topic: q.topic, status: q.review.status,
      data: q, hash: createHash("sha256").update(JSON.stringify(q)).digest("hex"),
    };
  }));
}
