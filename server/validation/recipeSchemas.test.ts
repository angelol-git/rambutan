import { describe, expect, it } from "vitest";
import { addTagSchema, updateRecipeMetadataSchema } from "./recipeSchemas.js";

describe("recipe request schemas", () => {
  it("trims a valid recipe title", () => {
    // Arrange
    const input = {
      body: { updatedRecipe: { title: "  Tomato Soup  " } },
    };

    // Act
    const result = updateRecipeMetadataSchema.parse(input);

    // Assert
    expect(result.body.updatedRecipe.title).toBe("Tomato Soup");
  });

  it("rejects a whitespace-only recipe title", () => {
    // Arrange
    const input = { body: { updatedRecipe: { title: "   " } } };

    // Act
    const result = updateRecipeMetadataSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("trims a tag name and applies its default color", () => {
    // Arrange
    const input = { body: { newTag: { name: "  Vegan " } } };

    // Act
    const result = addTagSchema.parse(input);

    // Assert
    expect(result.body.newTag).toEqual({ name: "Vegan", color: "#FFB86C" });
  });
});
