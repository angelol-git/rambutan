import express, { type Request, type Response } from "express";
import authMiddleware from "../middleware.js";
import { deleteTags, updateTag, updateTags } from "../services/tagService.js";
import {
  deleteTagsSchema,
  updateTagsSchema,
  validateRequest,
} from "../validation/tagSchemas.js";
import { z } from "zod";
import { requireUser } from "./routeUtils.js";

/*
 * Routes for managing global recipe tags ex. bulk updates and deletes from the home page.
 */
const router = express.Router();
type DeleteTagsBody = z.infer<typeof deleteTagsSchema>["body"];
type UpdateTagsBody = z.infer<typeof updateTagsSchema>["body"];
type TagParams = {
  tagId: string;
};
type UpdateTagBody = {
  tag: {
    name?: string;
    color?: string;
  };
};

router.delete(
  "/",
  authMiddleware,
  validateRequest(deleteTagsSchema),
  async (
    req: Request<Record<string, never>, object, DeleteTagsBody>,
    res: Response,
  ) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    const result = await deleteTags(req.body.tagIds, user.id);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result);
  },
);

router.patch(
  "/:tagId",
  authMiddleware,
  async (req: Request<TagParams, object, UpdateTagBody>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const tagId = Number.parseInt(req.params.tagId, 10);
      if (!Number.isInteger(tagId)) {
        return res.status(400).json({ error: "Invalid tag id" });
      }

      const result = await updateTag(tagId, user.id, req.body.tag ?? {});
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update tag" });
    }
  },
);

router.patch(
  "/",
  authMiddleware,
  validateRequest(updateTagsSchema),
  async (
    req: Request<Record<string, never>, object, UpdateTagsBody>,
    res: Response,
  ) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    const result = await updateTags(req.body.tags, user.id);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result);
  },
);

export default router;
