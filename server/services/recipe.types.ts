import type { RecipeId } from "./db.types.js";

export type RecipeIngredient = {
  id: string;
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
};

export type RecipeInstruction = {
  id: string;
  position: number;
  raw_text: string;
};

export type RecipeVersion = {
  id: string;
  recipeDetails: {
    calories: number | null;
    servings: number | null;
    total_time: number | null;
  };
  description: string;
  instructions: RecipeInstruction[];
  ingredients: RecipeIngredient[];
  source_prompt: string;
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
