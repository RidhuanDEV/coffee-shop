import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error.js";
import { logger } from "../logger/logger.js";
import { ZodError } from "zod";
import { UniqueConstraintError, ForeignKeyConstraintError } from "sequelize";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;
  if ("status" in err && err.status === 413) {
    res
      .status(413)
      .json({ success: false, message: "PAYLOAD_TOO_LARGE", errors: [] });
    return;
  }
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    res
      .status(400)
      .json({ success: false, message: "VALIDATION_FAILED", errors: [] });
    return;
  }
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({
        success: false,
        message: "VALIDATION_FAILED",
        errors: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    return;
  }
  if (
    err instanceof UniqueConstraintError ||
    err instanceof ForeignKeyConstraintError
  ) {
    res.status(409).json({ success: false, message: "CONFLICT", errors: [] });
    return;
  }

  if (err instanceof HttpError) {
    logger.warn({
      requestId,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  logger.error({
    requestId,
    err,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
  });
}
