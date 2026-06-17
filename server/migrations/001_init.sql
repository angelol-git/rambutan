PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  external_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  sid TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  parent_id TEXT,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 150),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES recipes(id) ON DELETE SET NULL
);

CREATE TABLE recipe_versions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  description TEXT,
  servings INTEGER CHECK (servings IS NULL OR servings > 0),
  total_time INTEGER CHECK (total_time IS NULL OR total_time > 0),
  calories INTEGER CHECK (calories IS NULL OR calories >= 0),
  source_prompt TEXT,
  ai_model TEXT,
  relation TEXT NOT NULL DEFAULT 'reply' CHECK (relation IN ('reply', 'fork')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  UNIQUE (recipe_id, version_number)
);

CREATE TABLE recipe_version_ingredients (
  id TEXT PRIMARY KEY,
  recipe_version_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  raw_text TEXT NOT NULL CHECK (length(trim(raw_text)) > 0),
  ingredient_name TEXT NOT NULL CHECK (length(trim(ingredient_name)) > 0),
  quantity_value REAL,
  quantity_text TEXT,
  unit TEXT,
  alternate_quantity_value REAL,
  alternate_quantity_text TEXT,
  alternate_unit TEXT,
  note TEXT,
  is_optional INTEGER NOT NULL DEFAULT 0 CHECK (is_optional IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_version_id) REFERENCES recipe_versions(id) ON DELETE CASCADE,
  UNIQUE (recipe_version_id, position)
);

CREATE TABLE recipe_version_steps (
  id TEXT PRIMARY KEY,
  recipe_version_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  raw_text TEXT NOT NULL CHECK (length(trim(raw_text)) > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_version_id) REFERENCES recipe_versions(id) ON DELETE CASCADE,
  UNIQUE (recipe_version_id, position)
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  color TEXT NOT NULL DEFAULT '#FFB86C',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);

CREATE TABLE recipe_tags (
  recipe_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (recipe_id, tag_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  recipe_id TEXT,
  recipe_version_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_version_id) REFERENCES recipe_versions(id) ON DELETE SET NULL
);

CREATE TABLE url_cache (
  normalized_url TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  content TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_recipes_user_id_created_at ON recipes(user_id, created_at DESC);
CREATE INDEX idx_recipe_versions_recipe_id_created_at ON recipe_versions(recipe_id, created_at DESC);

CREATE INDEX idx_recipe_version_ingredients_version_id ON recipe_version_ingredients(recipe_version_id);
CREATE INDEX idx_recipe_version_steps_version_id ON recipe_version_steps(recipe_version_id);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_messages_recipe_id_created_at ON messages(recipe_id, created_at DESC);
CREATE INDEX idx_messages_recipe_version_id_created_at ON messages(recipe_version_id, created_at DESC);
