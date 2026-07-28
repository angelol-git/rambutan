import express, { type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { postgresDb } from "../database/db.js";
import authMiddleware from "../middleware.js";
import logger from "../logger.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

type GoogleAuthBody = {
  credential?: string;
};

/*
 * TO DO: Current implementation is conventional server side cookie session model
 * being done manually instead of express-session, or REDIS
 * - Currently doing a DB read on every auth request, works fine for now but does not scale well
 * - Sessions are currently fixed life time and not rolling. Active users always expire at day 30, it should extend
 * - Sessions are filtered out but not cleaned up automatically
 */
async function createSession(userId: string, res: Response): Promise<string> {
  const sid = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await postgresDb
    .insertInto("sessions")
    .values({ sid, user_id: userId, expires_at: expiresAt })
    .execute();

  res.cookie("sid", sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  return sid;
}

router.post(
  "/google",
  async (
    req: Request<Record<string, never>, unknown, GoogleAuthBody>,
    res: Response,
  ) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: "Credential is required" });
      }

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      const existingUser = await postgresDb
        .selectFrom("users")
        .select("id")
        .where("external_id", "=", payload.sub)
        .executeTakeFirst();

      const userId = uuidv4();
      if (!existingUser) {
        await postgresDb
          .insertInto("users")
          .values({
            id: userId,
            external_id: payload.sub,
            email: payload.email,
          })
          .execute();
        await createSession(userId, res);
      } else {
        await createSession(existingUser.id, res);
      }

      return res.json({ message: "Logged in", user: payload });
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
        },
        "Google login failed",
      );
      return res.status(401).json({ error: "Invalid Google token" });
    }
  },
);

router.post("/logout", async (req: Request, res: Response) => {
  const sid = req.cookies.sid as string | undefined;

  if (sid) {
    try {
      await postgresDb.deleteFrom("sessions").where("sid", "=", sid).execute();
      res.clearCookie("sid");
    } catch (error) {
      logger.error(
        {
          err: error,
          path: req.originalUrl,
        },
        "Failed to delete session during logout",
      );
    }
  }

  res.json({ message: "Logged out" });
});

router.get("/check", authMiddleware, (_req: Request, res: Response) => {
  res.json({ authenticated: true });
});

router.get("/me", authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.json(req.user);
});

export default router;
