import express, { type Request, type Response } from "express";
import db from "../db.js";
import authMiddleware from "../middleware.js";
import {
  deleteTagsSchema,
  updateTagsSchema,
  validateRequest,
} from "../validation/tagSchemas.js";
import { z } from "zod";

const router = express.Router();

type DeleteTagsBody = z.infer<typeof deleteTagsSchema>["body"];
type UpdateTagsBody = z.infer<typeof updateTagsSchema>["body"];

function requireUser(req: Request, res: Response): Express.UserPayload | null {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  return req.user;
}

router.delete(
  "/",
  authMiddleware,
  validateRequest(deleteTagsSchema),
  async (req: Request<{}, {}, DeleteTagsBody>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    const { tagIds } = req.body;

    try {
      const deleteTransaction = db.transaction(() => {
        db.prepare(
          `DELETE FROM recipe_tags WHERE tag_id IN (${tagIds.map(() => "?").join(", ")})`,
        ).run(...tagIds);

        db.prepare(
          `DELETE FROM tags WHERE id IN (${tagIds.map(() => "?").join(", ")}) AND user_id = ?`,
        ).run(...tagIds, user.id);
      });

      deleteTransaction();
      return res.json({ success: true, deletedTagIds: tagIds });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete tags" });
    }
  },
);

router.patch(
  "/",
  authMiddleware,
  validateRequest(updateTagsSchema),
  async (req: Request<{}, {}, UpdateTagsBody>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    const { tags } = req.body;

    try {
      const updateStatement = db.prepare(
        `UPDATE tags
         SET name = COALESCE(?, name),
             color = COALESCE(?, color)
         WHERE id = ? AND user_id = ?`,
      );

      const transaction = db.transaction((inputTags: UpdateTagsBody["tags"]) => {
        inputTags.forEach((tag) => {
          updateStatement.run(tag.name ?? null, tag.color ?? null, tag.id, user.id);
        });
      });

      transaction(tags);
      return res.json({ success: true, updated: tags.length });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update tag" });
    }
  },
);

export default router;
