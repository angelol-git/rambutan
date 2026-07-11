import type { Tag } from "./tag";

export type RecipeDetailValue = string | number | null;
export type RecipeSourceType = "url" | "instruction" | "raw_text";

export type RecipeSource = {
  type: RecipeSourceType;
  value: string;
  summary: string;
};

export type Recipe = {
  id: string;
  title: string;
  tags: Tag[];
  versions: RecipeVersion[];
  created_at?: string | null;
};

export type RecipeDetails = {
  calories: RecipeDetailValue;
  servings: RecipeDetailValue;
  total_time: RecipeDetailValue;
};

export type RecipeIngredient = {
  id: string;
  position: number;
  raw_text: string;
  completed: boolean;
  ingredient_name: string;
  quantity_value: number | null;
  quantity_text: string | null;
  unit: string | null;
  alternate_quantity_value: number | null;
  alternate_quantity_text: string | null;
  alternate_unit: string | null;
  note: string | null;
  is_optional: boolean;
};

export type RecipeInstruction = {
  id: string;
  position: number;
  raw_text: string;
  completed: boolean;
};

export type RecipeVersion = {
  id: string;
  description: string;
  notes: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  recipeDetails: RecipeDetails;
  source: RecipeSource | null;
  ai_model?: string | null;
  created_at?: string;
  version_number?: number;
};

export type UpdateRecipeMetadataInput = {
  recipeId: string;
  title: string;
};

export type UpdateRecipeTagsInput = {
  recipeId: string;
  tags: Tag[];
};

export type UpdateRecipeVersionInput = {
  recipeId: string;
  versionId: string;
  description: string;
  notes: string;
  instructions: RecipeInstruction[];
  ingredients: RecipeIngredient[];
  recipeDetails: RecipeDetails;
  source: RecipeSource | null;
};

export type UpdateRecipeInput = Omit<UpdateRecipeMetadataInput, "recipeId"> &
  Omit<UpdateRecipeTagsInput, "recipeId"> &
  Omit<UpdateRecipeVersionInput, "recipeId" | "versionId"> & {
    id: string;
    recipe_id: string;
  };
