import express from "express";
import { healthRouter } from "./routes/health.routes";
import { productsRouter } from "./routes/products.routes";
import { inventoryRouter } from "./routes/inventory.routes";
import { ordersRouter } from "./routes/orders.routes";
import { customersRouter } from "./routes/customers.routes";
import { complianceRouter } from "./routes/compliance.routes";
import { authMiddleware } from "./middleware/auth";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { requestLoggerMiddleware } from "./middleware/request-logger";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLoggerMiddleware);

  // Apply auth to protected routes only when they are added.
  app.use("/api", authMiddleware, (_req, _res, next) => next());

  app.use(healthRouter);
  app.use("/products", productsRouter);
  app.use("/inventory", inventoryRouter);
  app.use("/orders", ordersRouter);
  app.use("/customers", customersRouter);
  app.use("/compliance-events", complianceRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use(errorHandlerMiddleware);

  return app;
}
