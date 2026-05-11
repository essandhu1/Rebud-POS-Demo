import { Router, Request, Response, NextFunction } from "express";
import { createOrder, type CreateOrderInput } from "../services/orders.service";

export const ordersRouter = Router();

/** POST /orders — create a new order from cart items. */
ordersRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateOrderInput;

    // Validate required fields
    if (!body.customer || !body.customer.firstName || !body.customer.lastName) {
      res.status(400).json({
        success: false,
        error: { code: "MISSING_CUSTOMER_INFO", message: "Customer first and last name are required" },
      });
      return;
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: "MISSING_ITEMS", message: "At least one cart item is required" },
      });
      return;
    }
    if (body.channel && !["mobile_app", "pos_dashboard"].includes(body.channel)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_CHANNEL", message: `Invalid channel: ${body.channel}` },
      });
      return;
    }

    const result = await createOrder({
      customer: body.customer,
      channel: body.channel || "mobile_app",
      items: body.items,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});