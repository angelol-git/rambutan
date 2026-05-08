import express, { type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import authMiddleware from "../middleware.js";
import db from "../db.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

type GoogleAuthBody = {
  credential?: string;
};

type UserRow = {
  id: string;
};

function createSession(userId: string, res: Response): string {
  const sid = uuidv4();
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30;

  db.prepare(
    `INSERT INTO sessions (sid, user_id, expires) VALUES (?, ?, ?)`,
  ).run(sid, userId, expires);

  res.cookie("sid", sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  return sid;
}

router.post("/google", async (req: Request<{}, {}, GoogleAuthBody>, res: Response) => {
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

    const existingUser = db
      .prepare(`SELECT id FROM users WHERE external_id = ?`)
      .get(payload.sub) as UserRow | undefined;

    const userId = uuidv4();
    if (!existingUser) {
      db.prepare(
        `INSERT INTO users (id, external_id, email) VALUES (?, ?, ?)`,
      ).run(userId, payload.sub, payload.email);
      createSession(userId, res);
    } else {
      createSession(existingUser.id, res);
    }

    return res.json({ message: "Logged in", user: payload });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({ error: "Invalid Google token" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  const sid = req.cookies.sid as string | undefined;

  if (sid) {
    try {
      db.prepare(`DELETE FROM sessions WHERE sid = ?`).run(sid);
      res.clearCookie("sid");
    } catch (error) {
      console.log("Failed to delete session: ", error);
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
