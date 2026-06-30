import express, { type Request, type Response } from "express";
import authMiddleware from "../middleware.js";
import {
  getRecipesByUserId,
  getRecipeById,
  deleteRecipe,
  updateRecipeMetadata,
} from "../services/recipeService.js";
import {
  getRecipeErrors,
  deleteError,
  getAskMessages,
} from "../services/messageService.js";
import {
  updateRecipeMetadataSchema,
  validateRequest,
  type UpdateRecipeMetadataBody,
} from "../validation/recipeSchemas.js";
import logger from "../logger.js";
import { requireUser } from "./routeUtils.js";

const router = express.Router();

type RecipeParams = {
  recipeId: string;
};

type RecipeErrorParams = {
  errorId: string;
};

type RecipeErrorListParams = {
  recipeId: string;
};

type RecipeAskMessagesParams = {
  recipeId: string;
};

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const user = requireUser(req, res);

  if (!user) {
    return;
  }
  const rawPage = req.query.page;
  const rawPageSize = req.query.pageSize;

  const parsedPage =
    typeof rawPage === "string" ? Number.parseInt(rawPage, 10) : NaN;
  const parsedPageSize =
    typeof rawPageSize === "string" ? Number.parseInt(rawPageSize, 10) : NaN;

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 8;
  try {
    const recipes = getRecipesByUserId(user.id, { page, pageSize });
    return res.json(recipes);
  } catch (error) {
    logger.error(
      { err: error, path: req.originalUrl, userId: user.id },
      "Failed to list recipes",
    );
    return res.status(500).json({ error: `DB error: ${String(error)}` });
  }
});

router.get(
  "/:recipeId",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const recipe = getRecipeById(req.params.recipeId, user.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      return res.json(recipe);
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          recipeId: req.params.recipeId,
        },
        "Failed to fetch recipe",
      );
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.patch(
  "/:recipeId",
  authMiddleware,
  validateRequest(updateRecipeMetadataSchema),
  async (
    req: Request<RecipeParams, object, UpdateRecipeMetadataBody>,
    res: Response,
  ) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const result = updateRecipeMetadata(
        req.params.recipeId,
        user.id,
        req.body.updatedRecipe,
      );
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }
      return res
        .status(200)
        .json({ success: true, updatedId: req.params.recipeId });
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          recipeId: req.params.recipeId,
        },
        "Failed to update recipe",
      );
      return res
        .status(500)
        .json({ error: `Failed to update recipe: ${String(error)}` });
    }
  },
);

router.delete(
  "/:recipeId",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const deleted = deleteRecipe(req.params.recipeId, user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      return res.status(204).send();
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          recipeId: req.params.recipeId,
        },
        "Failed to delete recipe",
      );
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

// Recipe auxiliary routes
router.get(
  "/errors/:recipeId",
  authMiddleware,
  async (req: Request<RecipeErrorListParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const errors = getRecipeErrors(req.params.recipeId, user.id);
      if (errors === null) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      return res.json({ errors });
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          recipeId: req.params.recipeId,
        },
        "Failed to fetch recipe errors",
      );
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.delete(
  "/error/:errorId",
  authMiddleware,
  async (req: Request<RecipeErrorParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const deleted = deleteError(req.params.errorId, user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Error message not found" });
      }
      return res.status(204).send();
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          errorId: req.params.errorId,
        },
        "Failed to delete recipe error message",
      );
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.get(
  "/:recipeId/askMessages",
  authMiddleware,
  async (req: Request<RecipeAskMessagesParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const askMessages = getAskMessages(req.params.recipeId, user.id);
      if (askMessages === null) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      return res.json({ askMessages });
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user.id,
          recipeId: req.params.recipeId,
        },
        "Failed to fetch ask messages",
      );
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

export default router;
