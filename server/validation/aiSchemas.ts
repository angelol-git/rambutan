import { z } from "zod";

export const aiRecipeSchema = z
  .object({
    title: z.string().max(150),
    description: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
    servings: z.number().int().min(1).nullable(),
    calories: z.number().int().min(0).nullable(),
    total_time: z.number().int().min(1).nullable(),
  })
  .strict();
