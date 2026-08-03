import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeTakeFirst, selectFrom } = vi.hoisted(() => ({
  executeTakeFirst: vi.fn(),
  selectFrom: vi.fn(),
}));

vi.mock("./database/db.js", () => ({
  postgresDb: { selectFrom },
}));

import authMiddleware from "./middleware.js";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = {
      innerJoin: vi.fn(),
      select: vi.fn(),
      where: vi.fn(),
      executeTakeFirst,
    };
    query.innerJoin.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.where.mockReturnValue(query);
    selectFrom.mockReturnValue(query);
  });

  it("rejects requests without a session cookie", async () => {
    // Arrange
    const req = { cookies: {}, originalUrl: "/api/recipes" } as Request;
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an expired or unknown session", async () => {
    // Arrange
    executeTakeFirst.mockResolvedValue(undefined);
    const req = {
      cookies: { sid: "expired-session" },
      originalUrl: "/api/recipes",
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Session expired" });
    expect(next).not.toHaveBeenCalled();
  });

  it("adds the session user to an authenticated request", async () => {
    // Arrange
    executeTakeFirst.mockResolvedValue({ user_id: "user-1", email: "a@b.com" });
    const req = {
      cookies: { sid: "valid-session" },
      originalUrl: "/api/recipes",
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    // Act
    await authMiddleware(req, res, next);

    // Assert
    expect(req.user).toEqual({ id: "user-1", email: "a@b.com" });
    expect(next).toHaveBeenCalledOnce();
  });
});
