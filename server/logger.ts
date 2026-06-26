import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  name: "rambutan-server",
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
});

export default logger;
