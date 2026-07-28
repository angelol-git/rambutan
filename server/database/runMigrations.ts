import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { destroyPostgresDb, postgresDb } from "./db.js";

const migrationFolder = fileURLToPath(
  new URL("./migrations/", import.meta.url),
);

const migrator = new Migrator({
  db: postgresDb,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,
  }),
});

try {
  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    console.log(`${result.status}: ${result.migrationName}`);
  });

  if (error) {
    throw error;
  }

  console.log("Migrations complete.");
} finally {
  await destroyPostgresDb();
}
