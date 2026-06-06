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
  saveAiError,
  saveRecipeToDb,
} from "../services/dbService.js";
import { getUrlContext } from "../services/urlContentService.js";
import { isValidUrl } from "../utils/urlValidator.js";

const router = express.Router();

type CreateRecipeBody = {
  prompt?: string;
  message?: string;
  recipeId?: string | null;
  recipeVersion?: unknown;
};

router.post("/create", optionalAuth, async (req: Request<{}, {}, CreateRecipeBody>, res: Response) => {
  const user = req.user;
  const { prompt, message, recipeId, recipeVersion } = req.body;
  const recipePrompt = prompt ?? message;

  if (!recipePrompt?.trim()) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    if (user) {
      saveUserPrompt(user.id, recipeId ?? null, recipePrompt);
    }

    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const containsUrl = recipePrompt.match(urlRegex);
    const url = containsUrl ? containsUrl[1] : null;

    let contextData: string | null = null;
    if (url && isValidUrl(url)) {
      if (recipeId) {
        return res.status(409).json({
          error: "URLs can't be used for new recipe threads. Start a new recipe to import one.",
        });
      }
      contextData = await getUrlContext(url);
    } else if (url) {
      console.warn(`Blocked potentially malicious URL: ${url}`);
    }

    const aiPrompt = createPrompt(recipePrompt, recipeVersion ?? null, contextData);
    const aiResponse = await generateResponse(aiPrompt);
    const parsedRecipe = validateAiResponse(aiResponse, recipePrompt);

    if (user) {
      const savedRecipe = saveRecipeToDb(parsedRecipe, {
        userId: user.id,
        recipeId: recipeId ?? null,
        sourceUrl: url,
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
          instructions: parsedRecipe.instructions,
          ingredients: parsedRecipe.ingredients,
          source_prompt: parsedRecipe.source_prompt,
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
      console.error(`[${now.toISOString()}] AI validation failed`, error.meta);

      if (user) {
        saveAiError(user.id, recipeId ?? null, {
          ...error.meta,
          ai_model: getModelName(),
        });
      }

      return res.status(400).json({ error: error.message });
    }

    console.error(`[${now.toISOString()}] Create recipe failed`, error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
