import type { ColumnType, Generated } from "kysely";

/**
 * PostgreSQL returns `timestamptz` columns as Date instances through `pg`.
 * Mutable timestamp columns accept either a Date or an ISO-8601 string.
 */
type Timestamp = ColumnType<
  Date,
  Date | string | undefined,
  Date | string | undefined
>;

type CreatedAt = ColumnType<Date, Date | string | undefined, never>;
type Defaulted<T> = ColumnType<T, T | undefined, T>;

type RecipeSourceType = "url" | "instruction" | "raw_text";
type RecipeRelation = "reply" | "fork";
type MessageRole = "user" | "assistant";

export interface UsersTable {
  id: string;
  external_id: string | null;
  email: string;
  created_at: CreatedAt;
}

export interface SessionsTable {
  sid: string;
  user_id: string;
  expires_at: Timestamp;
  created_at: CreatedAt;
}

export interface RecipesTable {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  created_at: CreatedAt;
  updated_at: Timestamp;
}

export interface RecipeVersionsTable {
  id: string;
  recipe_id: string;
  version_number: number;
  description: string | null;
  servings: number | null;
  total_time: number | null;
  calories: number | null;
  source_type: RecipeSourceType | null;
  source_value: string | null;
  source_summary: string | null;
  ai_model: string | null;
  relation: Defaulted<RecipeRelation>;
  notes: string | null;
  created_at: CreatedAt;
  updated_at: Timestamp;
}

export interface RecipeVersionIngredientsTable {
  id: string;
  recipe_version_id: string;
  position: number;
  raw_text: string;
  ingredient_name: string;
  quantity_value: number | null;
  quantity_text: string | null;
  unit: string | null;
  alternate_quantity_value: number | null;
  alternate_quantity_text: string | null;
  alternate_unit: string | null;
  note: string | null;
  is_optional: boolean;
  created_at: CreatedAt;
  updated_at: Timestamp;
}

export interface RecipeVersionStepsTable {
  id: string;
  recipe_version_id: string;
  position: number;
  raw_text: string;
  created_at: CreatedAt;
  updated_at: Timestamp;
}

export interface TagsTable {
  id: Generated<number>;
  user_id: string;
  name: string;
  color: string;
  created_at: CreatedAt;
  updated_at: Timestamp;
}

export interface RecipeTagsTable {
  recipe_id: string;
  tag_id: number;
  created_at: CreatedAt;
}

export interface MessagesTable {
  id: Generated<number>;
  user_id: string;
  recipe_id: string | null;
  recipe_version_id: string | null;
  role: MessageRole;
  content: string;
  status: string | null;
  created_at: CreatedAt;
}

export interface UrlCacheTable {
  normalized_url: string;
  source_url: string;
  content: string;
  fetched_at: Timestamp;
  expires_at: Timestamp;
  created_at: CreatedAt;
  updated_at: Timestamp;
}

export interface DatabaseSchema {
  users: UsersTable;
  sessions: SessionsTable;
  recipes: RecipesTable;
  recipe_versions: RecipeVersionsTable;
  recipe_version_ingredients: RecipeVersionIngredientsTable;
  recipe_version_steps: RecipeVersionStepsTable;
  tags: TagsTable;
  recipe_tags: RecipeTagsTable;
  messages: MessagesTable;
  url_cache: UrlCacheTable;
}
