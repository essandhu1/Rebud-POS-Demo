import { Router, Request, Response, NextFunction } from "express";
import { getPool } from "../db/pool";

export const customersRouter = Router();

/** GET /customers — list all customers. */
customersRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT
         c.id::text,
         c.first_name || ' ' || c.last_name AS name,
         c.phone,
         c.email,
         c.loyalty_points_balance,
         c.lifetime_points_earned,
         c.membership_status,
         c.created_at
       FROM customers c
       WHERE c.store_id = (SELECT id FROM stores WHERE code = 'DEMO' LIMIT 1)
       ORDER BY c.created_at DESC
       LIMIT 50`
    );
    res.status(200).json({ success: true, count: result.rowCount ?? 0, data: result.rows });
  } catch (error) {
    next(error);
  }
});

/** GET /customers/:id — single customer detail. */
customersRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!id || !/^\d+$/.test(id)) {
      res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid customer id" } });
      return;
    }
    const pool = getPool();
    const result = await pool.query(
      `SELECT
         c.id::text,
         c.first_name || ' ' || c.last_name AS name,
         c.phone,
         c.email,
         c.loyalty_points_balance,
         c.lifetime_points_earned,
         c.membership_status,
         c.created_at
       FROM customers c
       WHERE c.id = $1
       LIMIT 1`,
      [Number(id)]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
      return;
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/** GET /customers/:id/rewards — loyalty event history for a customer. */
customersRouter.get("/:id/rewards", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!id || !/^\d+$/.test(id)) {
      res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid customer id" } });
      return;
    }
    const pool = getPool();

    // Get customer summary
    const custResult = await pool.query(
      `SELECT
         c.id::text,
         c.first_name || ' ' || c.last_name AS name,
         c.loyalty_points_balance,
         c.lifetime_points_earned
       FROM customers c
       WHERE c.id = $1
       LIMIT 1`,
      [Number(id)]
    );
    if (custResult.rowCount === 0) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
      return;
    }

    // Get loyalty events
    const eventsResult = await pool.query(
      `SELECT
         le.id::text,
         le.event_type,
         le.points_delta,
         le.points_balance_after,
         le.order_id::text,
         le.description,
         le.created_at
       FROM loyalty_events le
       WHERE le.customer_id = $1
       ORDER BY le.created_at DESC
       LIMIT 100`,
      [Number(id)]
    );

    res.status(200).json({
      success: true,
      data: {
        customer: custResult.rows[0],
        events: eventsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});
