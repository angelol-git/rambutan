import type { RequestHandler } from "express";
import { postgresDb } from "./database/db.js";
import logger from "./logger.js";

type SessionUserRow = {
  user_id: string;
  email: string;
};

export const authMiddleware: RequestHandler = async (req, res, next) => {
  const sid = req.cookies.sid;
  if (!sid) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await getSessionUser(sid);

    if (!user) {
      logger.warn({ path: req.originalUrl }, "Session expired");
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(
      {
        err: error,
        path: req.originalUrl,
      },
      "Failed to load authenticated session",
    );
    return res.status(500).json({ error: "DB error" });
  }
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  const sid = req.cookies.sid as string | undefined;

  if (!sid) {
    req.user = null;
    return next();
  }

  try {
    req.user = await getSessionUser(sid);
    next();
  } catch (error) {
    logger.error(
      {
        err: error,
        path: req.originalUrl,
      },
      "Failed to load optional session",
    );
    req.user = null;
    next();
  }
};

const getSessionUser = async (
  sid: string,
): Promise<Express.UserPayload | null> => {
  const user = (await postgresDb
    .selectFrom("sessions as s")
    .innerJoin("users as u", "u.id", "s.user_id")
    .select(["s.user_id", "u.email"])
    .where("s.sid", "=", sid)
    .where("s.expires_at", ">", new Date())
    .executeTakeFirst()) as SessionUserRow | undefined;

  if (!user) {
    return null;
  }

  return {
    id: user.user_id,
    email: user.email,
  };
};

export default authMiddleware;
