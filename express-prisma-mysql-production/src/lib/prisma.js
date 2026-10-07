import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? [
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" }
        ]
      : [{ emit: "event", level: "error" }]
});

prisma.$on("error", (event) => {
  logger.error({ prisma: event }, "Prisma error");
});

export { prisma };
