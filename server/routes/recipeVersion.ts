import express, { type Request, type Response } from "express";
import authMiddleware from "../middleware.js";
import {
  deleteRecipeVersion,
  updateRecipeVersion,
} from "../services/recipeVersionService.js";
import {
  updateRecipeVersionSchema,
  validateRequest,
  type UpdateRecipeVersionBody,
} from "../validation/recipeSchemas.js";
import logger from "../logger.js";
import { requireUser } from "./routeUtils.js";

const router = express.Router();

type RecipeVersionParams = {
  recipeId: string;
  versionId: string;
};

router.patch(
  "/:recipeId/versions/:versionId",
  authMiddleware,
  validateRequest(updateRecipeVersionSchema),
  async (
    req: Request<RecipeVersionParams, object, UpdateRecipeVersionBody>,
    res: Response,
  ) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const result = await updateRecipeVersion(
        req.params.recipeId,
        req.params.versionId,
        user.id,
        req.body.updatedRecipe,
      );

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(200).json({
        success: true,
        updatedId: req.params.recipeId,
        updatedVersionId: req.params.versionId,
      });
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          recipeId: req.params.recipeId,
          recipeVersionId: req.params.versionId,
        },
        "Failed to update recipe version",
      );
      return res
        .status(500)
        .json({ error: `Failed to update recipe version: ${String(error)}` });
    }
  },
);

router.delete(
  "/:recipeId/versions/:versionId",
  authMiddleware,
  async (req: Request<RecipeVersionParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const deleted = await deleteRecipeVersion(req.params.versionId, user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe version not found" });
      }
      return res.status(204).send();
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          recipeId: req.params.recipeId,
          recipeVersionId: req.params.versionId,
        },
        "Failed to delete recipe version",
      );
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

export default router;
