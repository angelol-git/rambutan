export type RecipeId = string;
export type UserId = string;
export type VersionId = string;
export type SortOrder = "ASC" | "DESC";

export type RecipeRow = {
  id: RecipeId;
  title: string | null;
  created_at: string;
};

export type RecipeVersionRow = {
  id: VersionId;
  recipe_id: RecipeId;
  version_number: number;
  servings: number | null;
  total_time: number | null;
  calories: number | null;
  description: string | null;
  source_prompt: string | null;
  ai_model: string | null;
  created_at: string;
};

export type IngredientRow = {
  id: string;
  recipe_version_id: VersionId;
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
  is_optional: number;
};

export type InstructionRow = {
  id: string;
  recipe_version_id: VersionId;
  position: number;
  raw_text: string;
};

export type RecipeTagRow = {
  id: number;
  name: string;
  color: string;
};

export type RecipeTagAssociationRow = RecipeTagRow & {
  recipe_id: RecipeId;
};

export type ExistingNumericIdRow = {
  id: number;
};

export type ExistingTextIdRow = {
  id: string;
};

export type CountRow = {
  count: number;
};

export type AskMessageRow = {
  id: number;
  user_id: UserId;
  recipe_id: RecipeId | null;
  role: string;
  content: string;
  status: string | null;
  created_at: string;
};

export type ErrorMessageRow = {
  id: number;
  status: string | null;
  content: string;
  created_at: string;
};

export type UrlCacheRow = {
  normalized_url: string;
  source_url: string;
  content: string;
  fetched_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};
