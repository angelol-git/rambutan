import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import recipeRoutes from "./routes/recipes.js";
import kitchenRoutes from "./routes/kitchen.js";
import tagRoutes from "./routes/tags.js";
import cookieParser from "cookie-parser";
import type { ErrorRequestHandler } from "express";
import logger from "./logger.js";
type ShutdownSignal = "SIGTERM" | "SIGINT";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/kitchen", kitchenRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(
    {
      err,
      method: req.method,
      path: req.originalUrl,
    },
    "Unhandled request error",
  );
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server running");
});

const shutdown = (signal:ShutdownSignal) => {
  logger.warn({ signal }, "Starting graceful shutdown");
  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ promise, reason }, "Unhandled rejection");
  process.exit(1);
});
