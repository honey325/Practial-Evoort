import http from "http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { logger } from "./lib/logger.js";

const server = http.createServer(app);

let shuttingDown = false;

async function start() {
  try {
    await prisma.$connect();

    server.listen(env.PORT, env.HOST, () => {
      logger.info(
        {
          host: env.HOST,
          port: env.PORT,
          environment: env.NODE_ENV
        },
        "HTTP server started"
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server");
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "Shutdown started");

  server.close(async (serverError) => {
    if (serverError) {
      logger.error({ err: serverError }, "HTTP server close failed");
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
      logger.info("Database disconnected");
    } catch (error) {
      logger.error({ err: error }, "Database disconnect failed");
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  shutdown("uncaughtException");
});

start();
