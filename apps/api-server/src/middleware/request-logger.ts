import { NextFunction, Request, Response } from "express";

export function requestLoggerMiddleware(req: Request, _res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}
