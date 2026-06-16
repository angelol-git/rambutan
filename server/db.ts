import Database from "better-sqlite3";

const databasePath = process.env.DATABASE_URL || "rambutan.db";

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

export default db;
