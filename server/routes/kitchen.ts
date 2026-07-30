import express, { type Request, type Response } from "express";
import { v7 as uuidv7 } from "uuid";
import { optionalAuth } from "../middleware.js";
import {
  generateResponse,
  validateAiResponse,
  createPrompt,
  getModelName,
  AiValidationError,
} from "../services/aiService.js";
import {
  saveUserPrompt,
  saveAssistantErrorMessage,
} from "../services/messageService.js";
import {
  parseRecipeSource,
  saveRecipeToDb,
} from "../services/recipeVersionService.js";
import { getUrlContext } from "../services/urlContentService.js";
import { isValidUrl } from "../utils/urlValidator.js";
import logger from "../logger.js";

const router = express.Router();

type CreateRecipeBody = {
  prompt?: string;
  message?: string;
  recipeId?: string | null;
  recipeVersion?: unknown;
};

//TODO: refactor to different parts
router.post(
  "/create",
  optionalAuth,
  async (
    req: Request<Record<string, never>, object, CreateRecipeBody>,
    res: Response,
  ) => {
    const user = req.user;
    const { prompt, message, recipeId, recipeVersion } = req.body;
    const recipePrompt = prompt ?? message;

    if (!recipePrompt?.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    try {
      if (user) {
        await saveUserPrompt(user.id, recipeId ?? null, recipePrompt);
      }

      const urlRegex = /(https?:\/\/[^\s]+)/i;
      const containsUrl = recipePrompt.match(urlRegex);
      const url = containsUrl ? containsUrl[1] : null;

      let contextData: string | null = null;
      if (url && isValidUrl(url)) {
        if (recipeId) {
          return res.status(409).json({
            error:
              "URLs can't be used for new recipe threads. Start a new recipe to import one.",
          });
        }
        contextData = await getUrlContext(url);
      } else if (url) {
        logger.warn(
          { path: req.originalUrl, url },
          "Blocked invalid or disallowed URL",
        );
      }

      const aiPrompt = createPrompt(
        recipePrompt,
        recipeVersion ?? null,
        contextData,
      );
      const aiResponse = await generateResponse(aiPrompt);
      const parsedRecipe = validateAiResponse(aiResponse, recipePrompt);

      if (user) {
        const savedRecipe = await saveRecipeToDb(parsedRecipe, {
          userId: user.id,
          recipeId: recipeId ?? null,
        });
        return res.json({
          recipe: savedRecipe,
          reply: savedRecipe,
          model: getModelName(),
        });
      }

      const guestRecipeId = recipeId ?? uuidv7();
      const guestRecipe = {
        id: guestRecipeId,
        title: parsedRecipe.title,
        created_at: new Date().toISOString(),
        tags: [],
        versions: [
          {
            id: uuidv7(),
            recipeDetails: {
              calories: parsedRecipe.calories,
              servings: parsedRecipe.servings,
              total_time: parsedRecipe.total_time,
            },
            description: parsedRecipe.description,
            notes: "",
            instructions: parsedRecipe.instructions.map(
              (instruction, index) => ({
                id: uuidv7(),
                position: index + 1,
                completed: false,
                ...instruction,
              }),
            ),
            ingredients: parsedRecipe.ingredients.map((ingredient, index) => ({
              id: uuidv7(),
              position: index + 1,
              completed: false,
              ...ingredient,
            })),
            source: parseRecipeSource(parsedRecipe.source_input),
          },
        ],
      };

      return res.json({
        recipe: guestRecipe,
        reply: guestRecipe,
        model: getModelName(),
      });
    } catch (error) {
      const now = new Date();

      if (error instanceof AiValidationError) {
        logger.error(
          {
            path: req.originalUrl,
            userId: user?.id,
            recipeId: recipeId ?? null,
            timestamp: now.toISOString(),
            meta: error.meta,
          },
          "AI validation failed",
        );

        if (user) {
          await saveAssistantErrorMessage(user.id, recipeId ?? null, {
            ...error.meta,
            ai_model: getModelName(),
          });
        }

        return res.status(400).json({ error: error.message });
      }

      logger.error(
        {
          err: error,
          path: req.originalUrl,
          userId: user?.id,
          recipeId: recipeId ?? null,
          timestamp: now.toISOString(),
        },
        "Create recipe failed",
      );
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
);

export default router;
