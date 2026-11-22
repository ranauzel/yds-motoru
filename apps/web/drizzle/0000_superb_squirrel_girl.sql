CREATE TYPE "public"."review_kind" AS ENUM('word', 'question', 'card');--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"choice" text NOT NULL,
	"correct" boolean NOT NULL,
	"sure" boolean NOT NULL,
	"gloss_used" boolean DEFAULT false NOT NULL,
	"hint_used" boolean DEFAULT false NOT NULL,
	"words_used" boolean DEFAULT false NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"kind" "review_kind" NOT NULL,
	"item_id" text NOT NULL,
	"ease" real DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"priority" boolean DEFAULT false NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	CONSTRAINT "review_items_kind_item_id_pk" PRIMARY KEY("kind","item_id")
);
--> statement-breakpoint
CREATE INDEX "attempts_question_idx" ON "attempts" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "attempts_created_idx" ON "attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coach_messages_question_idx" ON "coach_messages" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "review_items_due_idx" ON "review_items" USING btree ("due_at");