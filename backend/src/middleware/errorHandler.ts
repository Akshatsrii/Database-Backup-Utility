import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export function errorHandler(
  err:  Error,
  req:  Request,
  res:  Response,
  next: NextFunction
): void {
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error:   err.message || "Internal server error",
  });
}