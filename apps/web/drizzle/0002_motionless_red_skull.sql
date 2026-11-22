CREATE TABLE "practice_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_ids" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"break_seen" boolean DEFAULT false NOT NULL,
	"warm_done" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"warm_answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_sessions_user_created_idx" ON "practice_sessions" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_session_question_uq" ON "attempts" USING btree ("session_id","question_id");