CREATE TABLE "workflow_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "duplicated_from" uuid;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workflow_folders" ADD CONSTRAINT "workflow_folders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_folder_location_id_idx" ON "workflow_folders" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "workflow_folder_location_name_idx" ON "workflow_folders" USING btree ("location_id","name");--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_folder_id_workflow_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."workflow_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_duplicated_from_workflows_id_fk" FOREIGN KEY ("duplicated_from") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_folder_id_idx" ON "workflows" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "workflow_deleted_at_idx" ON "workflows" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "workflow_duplicated_from_idx" ON "workflows" USING btree ("duplicated_from");--> statement-breakpoint
CREATE INDEX "workflow_created_by_idx" ON "workflows" USING btree ("created_by");