import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

type AppliedMigrationRow = {
  filename: string;
};

const db = new Database("recipes.db");
const migrationsDir = path.resolve("migrations");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

if (!fs.existsSync(migrationsDir)) {
  throw new Error(`Migrations directory not found: ${migrationsDir}`);
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort((left, right) => left.localeCompare(right));

const appliedRows = db
  .prepare("SELECT filename FROM schema_migrations")
  .all() as AppliedMigrationRow[];

const appliedFilenames = new Set(
  appliedRows.map((row) => row.filename),
);

for (const filename of migrationFiles) {
  if (appliedFilenames.has(filename)) {
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");

  const applyMigration = db.transaction(() => {
    db.exec(sql);
    db.prepare(
      "INSERT INTO schema_migrations (filename) VALUES (?)",
    ).run(filename);
  });

  applyMigration();
  console.log(`Applied migration: ${filename}`);
}

console.log("Migrations complete.");
