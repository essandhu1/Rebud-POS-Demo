import { Router } from "express";
import { getHealth } from "../services/health.service";
import { toHealthResponse } from "../schemas/health.schema";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res, next) => {
  try {
    const health = await getHealth();
    const response = toHealthResponse(health);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});
