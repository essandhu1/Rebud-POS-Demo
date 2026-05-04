import { NextFunction, Request, Response } from "express";
import { DatabaseError } from "pg";
import { ApiError } from "../lib/api-error";

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  if (err instanceof DatabaseError) {
    console.error("[api-server] database error", err);
    return res.status(500).json({
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Database query failed",
      },
    });
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  console.error("[api-server] unhandled error", err);
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message },
  });
}
