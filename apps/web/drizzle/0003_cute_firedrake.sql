CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"exam_name" text NOT NULL,
	"exam_date" date NOT NULL,
	"number" integer NOT NULL,
	"type" text NOT NULL,
	"topic" text NOT NULL,
	"status" text NOT NULL,
	"data" jsonb NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "questions_exam_number_idx" ON "questions" USING btree ("exam_id","number");--> statement-breakpoint
CREATE INDEX "questions_type_topic_idx" ON "questions" USING btree ("type","topic");