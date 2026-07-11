import { z } from "zod";
import type {
  Recipe,
  RecipeIngredient,
  RecipeInstruction,
  RecipeSource,
  RecipeVersion,
} from "../types/recipe";
import type { Tag } from "../types/tag";

/*
 * Parses recipe data read from localStorage and ensures it matches
 * the current recipe runtime shape before the app uses it.
 */
const recipeInstructionSchema = z.object({
  id: z.string(),
  position: z.number(),
  raw_text: z.string(),
  completed: z.boolean(),
}) satisfies z.ZodType<RecipeInstruction>;

const recipeIngredientSchema = z.object({
  id: z.string(),
  position: z.number(),
  raw_text: z.string(),
  completed: z.boolean(),
  ingredient_name: z.string(),
  quantity_value: z.number().nullable(),
  quantity_text: z.string().nullable(),
  unit: z.string().nullable(),
  alternate_quantity_value: z.number().nullable(),
  alternate_quantity_text: z.string().nullable(),
  alternate_unit: z.string().nullable(),
  note: z.string().nullable(),
  is_optional: z.boolean(),
}) satisfies z.ZodType<RecipeIngredient>;

const recipeDetailsSchema = z.object({
  calories: z.union([z.string(), z.number(), z.null()]),
  servings: z.union([z.string(), z.number(), z.null()]),
  total_time: z.union([z.string(), z.number(), z.null()]),
});

const tagSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  color: z.string(),
}) satisfies z.ZodType<Tag>;

const recipeSourceSchema = z.object({
  type: z.enum(["url", "instruction", "raw_text"]),
  value: z.string(),
  summary: z.string(),
}) satisfies z.ZodType<RecipeSource>;

const recipeVersionSchema = z.object({
  id: z.string(),
  description: z.string(),
  notes: z.string(),
  ingredients: z.array(recipeIngredientSchema),
  instructions: z.array(recipeInstructionSchema),
  source: recipeSourceSchema.nullable(),
  recipeDetails: recipeDetailsSchema,
}) satisfies z.ZodType<RecipeVersion>;

const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: z.string().nullable().optional(),
  tags: z.array(tagSchema),
  versions: z.array(recipeVersionSchema),
}) satisfies z.ZodType<Recipe>;

const recipesSchema = z.array(recipeSchema);

export function parseStoredRecipe(recipe: unknown): Recipe {
  return recipeSchema.parse(recipe);
}

export function parseStoredRecipes(recipes: unknown): Recipe[] {
  const result = recipesSchema.safeParse(recipes);
  return result.success ? result.data : [];
}
