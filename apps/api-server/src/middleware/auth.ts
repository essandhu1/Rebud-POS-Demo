import { NextFunction, Request, Response } from "express";

export function authMiddleware(_req: Request, _res: Response, next: NextFunction) {
  // Placeholder for Issue 5+ auth checks. Keep open for current POC routes.
  next();
}
