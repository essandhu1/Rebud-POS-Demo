import { Router } from "express";
import { getInventoryByProductId, listInventory } from "../services/inventory.service";
import { ApiError } from "../lib/api-error";

export const inventoryRouter = Router();

function parseProductIdParam(raw: string | undefined): string {
  if (raw === undefined || raw === "") {
    throw new ApiError(400, "INVALID_PRODUCT_ID", "Invalid product id");
  }
  if (!/^\d+$/.test(raw)) {
    throw new ApiError(400, "INVALID_PRODUCT_ID", "Invalid product id");
  }
  return raw;
}

/** GET /inventory — all inventory rows for the demo store (POS-friendly). */
inventoryRouter.get("/", async (_req, res, next) => {
  try {
    const data = await listInventory();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

/** GET /inventory/:productId — inventory for a single product. */
inventoryRouter.get("/:productId", async (req, res, next) => {
  try {
    const productId = parseProductIdParam(req.params.productId);
    const data = await getInventoryByProductId(productId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});
