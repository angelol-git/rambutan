import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format");

const tagSchema = z.object({
  id: z.union([z.string(), z.number()]),
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

export const updateRecipeSchema = z.object({
  body: z.object({
    updatedRecipe: z.object({
      id: z.union([z.string(), z.number()]),
      title: z
        .string()
        .min(1)
        .max(150)
        .transform((s) => s.trim()),
      recipeDetails: recipeDetailsSchema,
      description: z
        .string()
        .max(2000)
        .transform((s) => s.trim())
        .optional()
        .nullable(),
      instructions: z
        .array(z.string())
        .min(1)
        .transform((arr) => arr.map((s) => s.trim())),
      ingredients: z
        .array(z.string())
        .min(1)
        .transform((arr) => arr.map((s) => s.trim())),
      tags: z.array(tagSchema).optional().default([]),
    }),
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
export type UpdateRecipeBody = z.infer<typeof updateRecipeSchema>["body"];
export type AddTagBody = z.infer<typeof addTagSchema>["body"];

export function validateRequest<T extends z.ZodTypeAny>(schema:T) {
  return (req:Request, res:Response, next:NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
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
