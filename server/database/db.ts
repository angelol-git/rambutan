import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DatabaseSchema } from "./types.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be configured for PostgreSQL access.");
}

const pool = new Pool({ connectionString });

export const postgresDb = new Kysely<DatabaseSchema>({
  dialect: new PostgresDialect({ pool }),
});

export async function destroyPostgresDb(): Promise<void> {
  await postgresDb.destroy();
}
