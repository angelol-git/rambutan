import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.GOOGLE_API_KEY = "test-api-key";
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: vi.fn() };
  },
}));

import { AiValidationError, validateAiResponse } from "./aiService.js";

function createAiResponse(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
  } as never;
}

describe("validateAiResponse", () => {
  it("reports invalid JSON returned by the AI", () => {
    // Arrange
    const response = createAiResponse("this is not JSON");
    const prompt = "Make tomato soup";

    // Act
    const validate = () => validateAiResponse(response, prompt);

    // Assert
    expect(validate).toThrow("Invalid JSON from AI");
    try {
      validate();
    } catch (error) {
      expect(error).toBeInstanceOf(AiValidationError);
      expect((error as AiValidationError).meta.type).toBe("invalid_json");
    }
  });

  it("rejects a structurally valid but empty recipe", () => {
    // Arrange
    const response = createAiResponse(
      JSON.stringify({
        title: "",
        description: "",
        ingredients: [],
        instructions: [],
        servings: null,
        calories: null,
        total_time: null,
      }),
    );
    const prompt = "Hello";

    // Act
    const validate = () => validateAiResponse(response, prompt);

    // Assert
    expect(validate).toThrow("Recipe could not be generated from this input.");
    try {
      validate();
    } catch (error) {
      expect((error as AiValidationError).meta.type).toBe("empty_recipe");
    }
  });
});
