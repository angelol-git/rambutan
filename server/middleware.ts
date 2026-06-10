import type { NextFunction, Request, RequestHandler, Response } from "express";
import db from "./db.js";

type SessionUserRow = {
  user_id: string;
  email: string;
};

export const authMiddleware: RequestHandler = (req, res, next)=> {
  const sid = req.cookies.sid;
  if (!sid) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = getSessionUser(sid);

    if (!user) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("DB error:", error);
    return res.status(500).json({ error: "DB error" });
  }
}

export const optionalAuth: RequestHandler = (req, res, next) =>{
  const sid = req.cookies.sid as string | undefined;

  if (!sid) {
    req.user = null;
    return next();
  }

  try { 
    req.user = getSessionUser(sid);
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

const getSessionUser = (sid: string): Express.UserPayload | null => {
  const user = db
    .prepare(
      `SELECT s.user_id, u.email
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.sid = ? AND s.expires_at > ?`,
    )
    .get(sid, new Date().toISOString()) as SessionUserRow | undefined;

  if (!user) {
    return null;
  }

  return {
    id: user.user_id,
    email: user.email,
  };
};

export default authMiddleware;
