import pino from "pino";
import { env } from "../config/env.js";

const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: "express-prisma-api"
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie"
    ],
    remove: true
  }
});

export { logger };
