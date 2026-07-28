import "dotenv/config";
import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import logger from "../logger.js";
import type { DatabaseSchema } from "./types.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be configured for PostgreSQL access.");
}

const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (error) => {
  logger.error({ err: error }, "Unexpected PostgreSQL pool error");
});

export const postgresDb = new Kysely<DatabaseSchema>({
  dialect: new PostgresDialect({ pool }),
});

export async function checkPostgresReadiness(): Promise<void> {
  await sql`SELECT 1 FROM users LIMIT 1`.execute(postgresDb);
}

export async function destroyPostgresDb(): Promise<void> {
  await postgresDb.destroy();
}
