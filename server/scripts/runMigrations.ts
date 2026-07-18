import { promises as fs } from "node:fs";
import path from "node:path";
import "dotenv/config";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { destroyPostgresDb, postgresDb } from "../database/db.js";

const migrator = new Migrator({
  db: postgresDb,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.resolve("database/migrations"),
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
