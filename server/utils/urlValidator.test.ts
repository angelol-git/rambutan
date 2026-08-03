import { describe, expect, it } from "vitest";
import { isValidUrl, normalizeUrl } from "./urlValidator.js";

describe("isValidUrl", () => {
  it.each([
    "http://localhost:3000/recipe",
    "http://127.0.0.1/recipe",
    "http://192.168.1.10/recipe",
    "file:///etc/passwd",
  ])("rejects unsafe or unsupported URLs: %s", (url) => {
    // Arrange
    const unsafeUrl = url;

    // Act
    const result = isValidUrl(unsafeUrl);

    // Assert
    expect(result).toBe(false);
  });

  it("allows public HTTP(S) URLs", () => {
    // Arrange
    const publicUrl = "https://example.com/recipe";

    // Act
    const result = isValidUrl(publicUrl);

    // Assert
    expect(result).toBe(true);
  });
});

describe("normalizeUrl", () => {
  it("removes fragments, tracking parameters, and trailing slashes", () => {
    // Arrange
    const input =
      "HTTPS://Example.COM/recipes/pasta/?utm_source=newsletter&keep=yes#ingredients";

    // Act
    const result = normalizeUrl(input);

    // Assert
    expect(result).toBe("https://example.com/recipes/pasta?keep=yes");
  });
});
