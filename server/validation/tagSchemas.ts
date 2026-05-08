import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Helper for validating hex colors
const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format");

const tagSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z
    .string()
    .min(1)
    .max(50)
    .transform((s) => s.trim())
    .optional(),
  color: hexColorSchema.optional(),
});

export const deleteTagsSchema = z.object({
  body: z.object({
    tagIds: z
      .array(z.union([z.string(), z.number()]))
      .min(1, "At least one tag ID is required"),
  }),
});

export const updateTagsSchema = z.object({
  body: z.object({
    tags: z.array(tagSchema).min(1, "At least one tag is required"),
  }),
});

export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
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
