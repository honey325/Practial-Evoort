import { logger } from "../lib/logger.js";

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(
      {
        err: error,
        method: req.method,
        url: req.originalUrl,
        requestId: req.id
      },
      "Unhandled server error"
    );
  } else {
    logger.warn(
      {
        err: error,
        method: req.method,
        url: req.originalUrl,
        requestId: req.id
      },
      "Request error"
    );
  }

  if (res.headersSent) {
    return next(error);
  }

  const response = {
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : error.message || "Request failed"
  };

  if (error.details) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && error.stack) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
}

export { errorHandler };
