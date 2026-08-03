import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRecipesByUserId, getRecipeById, updateRecipeMetadata } = vi.hoisted(
  () => ({
    getRecipesByUserId: vi.fn(),
    getRecipeById: vi.fn(),
    updateRecipeMetadata: vi.fn(),
  }),
);

vi.mock("../middleware.js", () => ({
  default: (req: Request, _res: Response, next: () => void) => {
    req.user = { id: "user-1", email: "user@example.com" };
    next();
  },
}));

vi.mock("../services/recipeService.js", () => ({
  getRecipesByUserId,
  getRecipeById,
  updateRecipeMetadata,
  deleteRecipe: vi.fn(),
}));

vi.mock("../services/messageService.js", () => ({
  getRecipeErrors: vi.fn(),
  deleteError: vi.fn(),
  getAskMessages: vi.fn(),
}));

import recipeRoutes from "./recipes.js";

async function request({
  method,
  path,
  body,
  query = {},
}: {
  method: string;
  path: string;
  body?: unknown;
  query?: Record<string, string>;
}) {
  const req = {
    method,
    url: path,
    originalUrl: `/api/recipes${path}`,
    baseUrl: "/api/recipes",
    body,
    query,
    params: {},
  } as Request;
  const response = { statusCode: 200, body: undefined as unknown };
  const res = {
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      complete();
      return res;
    }),
    send: vi.fn(() => {
      complete();
      return res;
    }),
  } as unknown as Response;
  let complete!: () => void;
  const completed = new Promise<void>((resolve) => {
    complete = resolve;
  });

  recipeRoutes(req, res, (error: unknown) => {
    if (error) throw error;
    complete();
  });
  await completed;
  return response;
}

describe("recipe routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses safe pagination defaults and scopes the list to the authenticated user", async () => {
    // Arrange
    getRecipesByUserId.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 8,
      totalItems: 0,
      totalPages: 0,
    });

    // Act
    const response = await request({
      method: "GET",
      path: "/",
      query: { page: "-1", pageSize: "not-a-number" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(getRecipesByUserId).toHaveBeenCalledWith("user-1", {
      page: 1,
      pageSize: 8,
    });
  });

  it("does not expose a recipe that the service cannot find for this user", async () => {
    // Arrange
    getRecipeById.mockResolvedValue(null);

    // Act
    const response = await request({
      method: "GET",
      path: "/someone-elses-recipe",
    });

    // Assert
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: "Recipe not found" });
    expect(getRecipeById).toHaveBeenCalledWith(
      "someone-elses-recipe",
      "user-1",
    );
  });

  it("rejects an invalid update before it reaches the service", async () => {
    // Arrange
    const invalidUpdate = { updatedRecipe: { title: "   " } };

    // Act
    const response = await request({
      method: "PATCH",
      path: "/recipe-1",
      body: invalidUpdate,
    });

    // Assert
    expect(response.statusCode).toBe(400);
    expect(updateRecipeMetadata).not.toHaveBeenCalled();
  });

  it("does not update a recipe that does not belong to the authenticated user", async () => {
    // Arrange
    updateRecipeMetadata.mockResolvedValue({
      success: false,
      error: "Recipe not found",
    });
    const update = { updatedRecipe: { title: "New title" } };

    // Act
    const response = await request({
      method: "PATCH",
      path: "/someone-elses-recipe",
      body: update,
    });

    // Assert
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: "Recipe not found" });
    expect(updateRecipeMetadata).toHaveBeenCalledWith(
      "someone-elses-recipe",
      "user-1",
      update.updatedRecipe,
    );
  });

  it("updates a valid, normalized title for the authenticated user", async () => {
    // Arrange
    updateRecipeMetadata.mockResolvedValue({ success: true });
    const update = { updatedRecipe: { title: "  New title  " } };

    // Act
    const response = await request({
      method: "PATCH",
      path: "/recipe-1",
      body: update,
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(updateRecipeMetadata).toHaveBeenCalledWith("recipe-1", "user-1", {
      title: "New title",
    });
  });
});
