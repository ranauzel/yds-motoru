// Kullanıcı verisi (hesap + ilerleme) — Postgres'te durur.
// İçerik (sorular, kelimeler, kartlar) ise repo kökündeki content/ klasöründeki JSON dosyalarındadır.
import {
  boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, real, serial, text, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// ── Better Auth tabloları (alan adları kütüphanenin beklediği şekilde) ─────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("session_user_idx").on(t.userId)]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("account_user_idx").on(t.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ── Çalışma verisi (her satır bir kullanıcıya ait) ─────────────────────────────────

const userId = () => text("user_id").notNull().references(() => user.id, { onDelete: "cascade" });

/** Bir çalışma turu ("Başla"dan özete). Kaldığın yerden devam için durum burada tutulur. */
export const practiceSessions = pgTable("practice_sessions", {
  id: text("id").primaryKey(),
  userId: userId(),
  questionIds: jsonb("question_ids").$type<string[]>().notNull(),   // oturumdaki soruların sırası
  position: integer("position").notNull().default(0),               // geçilen soru sayısı (N = bitti)
  breakSeen: boolean("break_seen").notNull().default(false),
  warmDone: jsonb("warm_done").$type<number[]>().notNull().default([]),
  warmAnswers: jsonb("warm_answers").$type<Record<string, boolean>>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [index("practice_sessions_user_created_idx").on(t.userId, t.createdAt)]);

/** Her soru cevabı. Analiz ve tuzak istatistikleri buradan hesaplanır. */
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: userId(),
  sessionId: text("session_id").references(() => practiceSessions.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),       // örn. "2021-yds-1-q28"
  choice: text("choice").notNull(),                 // "A".."E"
  correct: boolean("correct").notNull(),
  sure: boolean("sure").notNull(),                  // "Eminim" mi "Emin değilim" mi
  glossUsed: boolean("gloss_used").notNull().default(false),
  hintUsed: boolean("hint_used").notNull().default(false),
  wordsUsed: boolean("words_used").notNull().default(false),
  durationMs: integer("duration_ms"),
  createdAt: createdAt(),
}, (t) => [
  index("attempts_user_question_idx").on(t.userId, t.questionId),
  index("attempts_user_created_idx").on(t.userId, t.createdAt),
  uniqueIndex("attempts_session_question_uq").on(t.sessionId, t.questionId),
]);

export const reviewKind = pgEnum("review_kind", ["word", "question", "card"]);

/** Aralıklı tekrar (SM-2) durumu: kelimeler, sorular ve strateji/tuzak kartları için tek tablo. */
export const reviewItems = pgTable("review_items", {
  userId: userId(),
  kind: reviewKind("kind").notNull(),
  itemId: text("item_id").notNull(),                // kelime, soru id'si ya da kart id'si
  ease: real("ease").notNull().default(2.5),
  intervalDays: integer("interval_days").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  priority: boolean("priority").notNull().default(false), // "eminim" deyip yanlış yapılanlar
  dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.kind, t.itemId] }),
  index("review_items_user_due_idx").on(t.userId, t.dueAt),
]);

/** Koça sorulan sorular ve cevapları (Faz 2). */
export const coachMessages = pgTable("coach_messages", {
  id: serial("id").primaryKey(),
  userId: userId(),
  questionId: text("question_id"),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: createdAt(),
}, (t) => [index("coach_messages_user_question_idx").on(t.userId, t.questionId)]);
