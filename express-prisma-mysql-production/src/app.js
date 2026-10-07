import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// app.use(
//   pinoHttp({
//     logger,
//     autoLogging: {
//       ignore: (req) => req.url === "/health"
//     }
//   })
// );

app.use(helmet());

const allowedOrigins = env.CORS_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);

// app.use(
//   rateLimit({
//     windowMs: env.RATE_LIMIT_WINDOW_MS,
//     limit: env.RATE_LIMIT_MAX,
//     standardHeaders: "draft-8",
//     legacyHeaders: false
//   })
// );

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb"
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Express Prisma MySQL API is running"
  });
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export { app };
