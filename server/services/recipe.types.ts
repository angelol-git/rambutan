import type { RecipeId } from "./db.types.js";

export type RecipeSourceType = "url" | "instruction" | "raw_text";

export type RecipeSource = {
  type: RecipeSourceType;
  value: string;
  summary: string;
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
  recipeDetails: {
    calories: number | null;
    servings: number | null;
    total_time: number | null;
  };
  description: string;
  notes: string;
  instructions: RecipeInstruction[];
  ingredients: RecipeIngredient[];
  source: RecipeSource | null;
  ai_model: string | null;
  created_at: string;
  version_number: number;
};

export type RecipeTag = {
  id: number;
  name: string;
  color: string;
};

export type Recipe = {
  id: RecipeId;
  title: string;
  created_at: string;
  tags: RecipeTag[];
  versions: RecipeVersion[];
};
