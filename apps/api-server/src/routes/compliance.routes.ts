import { Router, Request, Response, NextFunction } from "express";
import { getPool } from "../db/pool";

export const complianceRouter = Router();

/** GET /compliance-events — list all compliance events (latest first). */
complianceRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT
         ce.id::text,
         ce.store_id::text,
         ce.order_id::text,
         ce.inventory_id::text,
         ce.event_type,
         ce.status,
         ce.severity,
         ce.event_payload_json,
         ce.description,
         ce.occurred_at,
         ce.created_at
       FROM compliance_events ce
       ORDER BY ce.occurred_at DESC
       LIMIT 200`
    );
    res.status(200).json({ success: true, count: result.rowCount ?? 0, data: result.rows });
  } catch (error) {
    next(error);
  }
});
