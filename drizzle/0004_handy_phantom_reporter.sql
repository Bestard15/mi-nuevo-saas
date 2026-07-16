CREATE TYPE "public"."billing_plan" AS ENUM('free', 'starter', 'growth');--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "plan" "billing_plan" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "plan_renews_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_stripe_customer_id_unique" UNIQUE("stripe_customer_id");