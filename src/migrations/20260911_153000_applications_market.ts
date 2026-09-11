import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Applications reference a market, not a city.
 *
 * Billing is per trade per metro, so "which market do you want to be listed in"
 * is the question a contractor is actually answering. Hand-written because
 * payload migrate:create prompts interactively for whether this is a rename,
 * and that prompt can't be answered without a TTY.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "market_id" integer;
    DO $$ BEGIN
      ALTER TABLE "applications" ADD CONSTRAINT "applications_market_id_markets_id_fk"
        FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "applications_market_idx" ON "applications" USING btree ("market_id");

    DROP INDEX IF EXISTS "applications_city_idx";
    ALTER TABLE "applications" DROP COLUMN IF EXISTS "city_id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "city_id" integer;
    DO $$ BEGIN
      ALTER TABLE "applications" ADD CONSTRAINT "applications_city_id_cities_id_fk"
        FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "applications_city_idx" ON "applications" USING btree ("city_id");

    DROP INDEX IF EXISTS "applications_market_idx";
    ALTER TABLE "applications" DROP COLUMN IF EXISTS "market_id";
  `)
}
