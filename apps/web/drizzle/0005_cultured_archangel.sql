ALTER TABLE "questions" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questions_owner_idx" ON "questions" USING btree ("owner_id");