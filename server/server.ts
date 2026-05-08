import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth.js";
import recipeRoutes from "./routes/recipes.js";
import chatRoutes from "./routes/chat.js";
import tagRoutes from "./routes/tags.js";
import cookieParser from "cookie-parser";
import type { ErrorRequestHandler } from "express";
type ShutdownSignal = "SIGTERM" | "SIGINT";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const isProduction = process.env.NODE_ENV === "production";

const log = (message:string) => {
  if (isProduction) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  } else {
    console.log(message);
  }
};

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/chat", chatRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  log(`Error: ${err instanceof Error ? err.message : String(err)}`);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  log(`CORS origin: ${CLIENT_URL}`);
  log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

const shutdown = (signal:ShutdownSignal) => {
  log(`${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    log("Server closed. Exiting process.");
    process.exit(0);
  });

  setTimeout(() => {
    log("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  log(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});
