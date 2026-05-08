import Database from "better-sqlite3";

const db = new Database("recipes.db");

db.pragma("foreign_keys = ON");

db.prepare(
  `
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        external_id TEXT UNIQUE,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    parent_id TEXT,
    title TEXT NOT NULL CHECK(length(title) <= 150),
    source_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES recipes(id) ON DELETE SET NULL
    )
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    recipe_id TEXT,
    role TEXT CHECK(role IN ('user','assistant')) NOT NULL,
    content TEXT NOT NULL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS recipe_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL,
    servings INTEGER,
    total_time INTEGER,
    calories INTEGER,
    description TEXT,
    instructions TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    source_prompt TEXT,
    ai_model TEXT,
    relation TEXT CHECK (relation IN ('reply','fork')) DEFAULT 'reply',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT "#FFB86C",
  UNIQUE(user_id,name)
)
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS recipe_tags (
    recipe_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY(recipe_id, tag_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS url_cache (
    normalized_url TEXT NOT NULL PRIMARY KEY,
    source_url TEXT NOT NULL,
    content TEXT NOT NULL,
    fetched_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`,
).run();

export default db;
