import { Router, Request, Response, NextFunction } from "express";
import {
  createOrder,
  cancelOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  type CreateOrderInput,
} from "../services/orders.service";

export const ordersRouter = Router();

function paramId(req: Request): string {
  const raw = req.params.id;
  return typeof raw === "string" ? raw : "";
}

/** POST /orders — create a new order from cart items. */
ordersRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateOrderInput;

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

/** GET /orders — list all orders (latest first). */
ordersRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await listOrders();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

/** GET /orders/:id — single order with line items. */
ordersRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    if (!id || !/^\d+$/.test(id)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ORDER_ID", message: "Invalid order id" },
      });
      return;
    }
    const data = await getOrderById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/** POST /orders/:id/cancel — cancel an order and release reservations. */
ordersRouter.post("/:id/cancel", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    if (!id || !/^\d+$/.test(id)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ORDER_ID", message: "Invalid order id" },
      });
      return;
    }
    await cancelOrder(id);
    const data = await getOrderById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/** PATCH /orders/:id/status — update order status. */
ordersRouter.patch("/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    if (!id || !/^\d+$/.test(id)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ORDER_ID", message: "Invalid order id" },
      });
      return;
    }
    const { status: newStatus } = req.body as { status?: string };
    if (!newStatus) {
      res.status(400).json({
        success: false,
        error: { code: "MISSING_STATUS", message: "New status is required" },
      });
      return;
    }
    await updateOrderStatus(id, newStatus);
    const data = await getOrderById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});