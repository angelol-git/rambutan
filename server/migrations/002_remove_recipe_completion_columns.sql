PRAGMA foreign_keys = OFF;

CREATE TABLE recipe_version_ingredients_new (
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

INSERT INTO recipe_version_ingredients_new (
  id,
  recipe_version_id,
  position,
  raw_text,
  ingredient_name,
  quantity_value,
  quantity_text,
  unit,
  alternate_quantity_value,
  alternate_quantity_text,
  alternate_unit,
  note,
  is_optional,
  created_at,
  updated_at
)
SELECT
  id,
  recipe_version_id,
  position,
  raw_text,
  ingredient_name,
  quantity_value,
  quantity_text,
  unit,
  alternate_quantity_value,
  alternate_quantity_text,
  alternate_unit,
  note,
  is_optional,
  created_at,
  updated_at
FROM recipe_version_ingredients;

DROP TABLE recipe_version_ingredients;
ALTER TABLE recipe_version_ingredients_new RENAME TO recipe_version_ingredients;
CREATE INDEX idx_recipe_version_ingredients_version_id ON recipe_version_ingredients(recipe_version_id);

CREATE TABLE recipe_version_steps_new (
  id TEXT PRIMARY KEY,
  recipe_version_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  raw_text TEXT NOT NULL CHECK (length(trim(raw_text)) > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_version_id) REFERENCES recipe_versions(id) ON DELETE CASCADE,
  UNIQUE (recipe_version_id, position)
);

INSERT INTO recipe_version_steps_new (
  id,
  recipe_version_id,
  position,
  raw_text,
  created_at,
  updated_at
)
SELECT
  id,
  recipe_version_id,
  position,
  raw_text,
  created_at,
  updated_at
FROM recipe_version_steps;

DROP TABLE recipe_version_steps;
ALTER TABLE recipe_version_steps_new RENAME TO recipe_version_steps;
CREATE INDEX idx_recipe_version_steps_version_id ON recipe_version_steps(recipe_version_id);

PRAGMA foreign_keys = ON;
