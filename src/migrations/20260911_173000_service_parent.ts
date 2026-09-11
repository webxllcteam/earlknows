import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two-level service taxonomy: Roofing is a category, "Metal roofing" a child.
 *
 * Billing stays on the category — a sub-service page inherits its parent's
 * panel and filters it by what each provider declared they do. Provider
 * subServices reuse providers_rels, so only this column is new.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "parent_id" integer;
    DO $$ BEGIN
      ALTER TABLE "services" ADD CONSTRAINT "services_parent_id_services_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "services_parent_idx" ON "services" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "services_parent_idx";
    ALTER TABLE "services" DROP COLUMN IF EXISTS "parent_id";
  `)
}
