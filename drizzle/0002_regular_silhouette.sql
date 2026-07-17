CREATE TABLE "changelog_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "shipped_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "changelog_entry" ADD CONSTRAINT "changelog_entry_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "changelog_project_idx" ON "changelog_entry" USING btree ("project_id","published_at");