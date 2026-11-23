ALTER TABLE "practice_sessions" ADD COLUMN "day" date;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD COLUMN "review_words" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "practice_sessions_user_day_uq" ON "practice_sessions" USING btree ("user_id","day");