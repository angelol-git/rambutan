import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format");

const tagSchema = z.object({
  id: z.number().int(),
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1).max(50)),
  color: hexColorSchema.default("#FFB86C"),
});

const recipeDetailsSchema = z.object({
  servings: z.number().int().min(1).optional().nullable(),
  total_time: z.number().int().min(1).optional().nullable(),
  calories: z.number().int().min(0).optional().nullable(),
});

const recipeIngredientSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1),
  raw_text: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
  ingredient_name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
  quantity_value: z.number().optional().nullable(),
  quantity_text: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  alternate_quantity_value: z.number().optional().nullable(),
  alternate_quantity_text: z.string().optional().nullable(),
  alternate_unit: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  is_optional: z.boolean().default(false),
});

const recipeInstructionSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1),
  raw_text: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
});

const recipeSourceSchema = z
  .object({
    type: z.enum(["url", "instruction", "raw_text"]),
    value: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1)),
    summary: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1)),
  })
  .nullable();

const updateRecipeMetadataPayloadSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(150)
    .transform((s) => s.trim()),
});

const updateRecipeVersionPayloadSchema = z.object({
  recipeDetails: recipeDetailsSchema,
  description: z
    .string()
    .max(2000)
    .transform((s) => s.trim())
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(4000)
    .transform((s) => s.trim())
    .optional()
    .nullable(),
  instructions: z.array(recipeInstructionSchema).min(1),
  ingredients: z.array(recipeIngredientSchema).min(1),
  source: recipeSourceSchema,
});

const updateRecipeTagsPayloadSchema = z.object({
  tags: z.array(tagSchema).optional().default([]),
});

export const updateRecipeMetadataSchema = z.object({
  body: z.object({
    updatedRecipe: updateRecipeMetadataPayloadSchema,
  }),
});

export const updateRecipeVersionSchema = z.object({
  body: z.object({
    updatedRecipe: updateRecipeVersionPayloadSchema,
  }),
});

export const updateRecipeTagsSchema = z.object({
  body: z.object({
    updatedRecipe: updateRecipeTagsPayloadSchema,
  }),
});

export const addTagSchema = z.object({
  body: z.object({
    newTag: z.object({
      name: z
        .string()
        .transform((s) => s.trim())
        .pipe(z.string().min(1).max(50)),
      color: hexColorSchema.default("#FFB86C"),
    }),
  }),
});

export type TagInput = z.infer<typeof tagSchema>;
export type RecipeDetailsInput = z.infer<typeof recipeDetailsSchema>;
export type UpdateRecipeMetadataBody = z.infer<
  typeof updateRecipeMetadataSchema
>["body"];
export type UpdateRecipeVersionBody = z.infer<
  typeof updateRecipeVersionSchema
>["body"];
export type UpdateRecipeTagsBody = z.infer<
  typeof updateRecipeTagsSchema
>["body"];
export type AddTagBody = z.infer<typeof addTagSchema>["body"];

export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body: Request["body"];
        query: Request["query"];
        params: Request["params"];
      };
      // Apply the parsed values back onto the request so route handlers see Zod
      // transforms/defaults (for example trimmed strings) instead of raw input.
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}
