import express, { type Request, type Response } from "express";
import authMiddleware from "../middleware.js";
import {
  getRecipesByUserId,
  getRecipeById,
  deleteRecipeVersion,
  deleteRecipe,
  updateRecipe,
} from "../services/recipeService.js";
import {
  getRecipeErrors,
  deleteError,
  getAskMessages,
} from "../services/messageService.js";
import {
  addTagToRecipe,
  updateTag,
  removeTagFromRecipe,
} from "../services/tagService.js";
import {
  updateRecipeSchema,
  addTagSchema,
  validateRequest,
  type AddTagBody,
  type UpdateRecipeBody,
  type TagInput,
} from "../validation/recipeSchemas.js";

const router = express.Router();

type RecipeParams = {
  id: string;
};

type RecipeTagParams = {
  id: string;
  tagId: string;
};

type UpdateTagBody = {
  tag: Partial<Pick<TagInput, "name" | "color">>;
};

function requireUser(req: Request, res: Response): Express.UserPayload | null {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  return req.user;
}

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
    Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 6;
  try {
    const recipes = getRecipesByUserId(user.id, { page, pageSize });
    return res.json(recipes);
  } catch (error) {
    console.error("DB error:", error);
    return res.status(500).json({ error: `DB error: ${String(error)}` });
  }
});

router.get(
  "/:id",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const recipe = getRecipeById(req.params.id, user.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      return res.json(recipe);
    } catch (error) {
      console.error("DB error:", error);
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.get(
  "/errors/:id",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const errors = getRecipeErrors(req.params.id, user.id);
      if (errors === null) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      return res.json({ errors });
    } catch (error) {
      console.error("DB error:", error);
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.delete(
  "/error/:id",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const deleted = deleteError(req.params.id, user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Error message not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("DB error:", error);
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.delete(
  "/version/:id",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const deleted = deleteRecipeVersion(req.params.id, user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe version not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("DB error:", error);
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.delete(
  "/:id",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const deleted = deleteRecipe(req.params.id, user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("DB error:", error);
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.get(
  "/:id/askMessages",
  authMiddleware,
  async (req: Request<RecipeParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const askMessages = getAskMessages(req.params.id, user.id);
      if (askMessages === null) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      return res.json({ askMessages });
    } catch (error) {
      console.error("DB error:", error);
      return res.status(500).json({ error: `DB error: ${String(error)}` });
    }
  },
);

router.patch(
  "/:id",
  authMiddleware,
  validateRequest(updateRecipeSchema),
  async (req: Request<RecipeParams, {}, UpdateRecipeBody>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const result = updateRecipe(
        req.params.id,
        user.id,
        req.body.updatedRecipe,
      );
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(200).json({ success: true, updatedId: req.params.id });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: `Failed to update recipe: ${String(error)}` });
    }
  },
);

router.post(
  "/:id/tag",
  authMiddleware,
  validateRequest(addTagSchema),
  async (req: Request<RecipeParams, {}, AddTagBody>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const result = addTagToRecipe(req.params.id, user.id, req.body.newTag);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to add tag" });
    }
  },
);

router.patch(
  "/tag/:id",
  authMiddleware,
  async (req: Request<RecipeParams, {}, UpdateTagBody>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const result = updateTag(req.params.id, user.id, req.body.tag ?? {});
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

router.delete(
  "/:id/tag/:tagId",
  authMiddleware,
  async (req: Request<RecipeTagParams>, res: Response) => {
    const user = requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const result = removeTagFromRecipe(
        req.params.id,
        req.params.tagId,
        user.id,
      );
      if (!result.success) {
        return res
          .status(404)
          .json({ error: result.error || "Failed to remove tag" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to remove tag" });
    }
  },
);

export default router;
