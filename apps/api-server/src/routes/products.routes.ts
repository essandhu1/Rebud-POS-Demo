import { Router } from "express";
import { getProductById, listProducts } from "../services/products.service";
import { ApiError } from "../lib/api-error";

export const productsRouter = Router();

function parseProductIdParam(raw: string | undefined): string {
  if (raw === undefined || raw === "") {
    throw new ApiError(400, "INVALID_PRODUCT_ID", "Invalid product id");
  }
  if (!/^\d+$/.test(raw)) {
    throw new ApiError(400, "INVALID_PRODUCT_ID", "Invalid product id");
  }
  return raw;
}

/** GET /products — all products for the demo store (with inventory when present). */
productsRouter.get("/", async (_req, res, next) => {
  try {
    const data = await listProducts();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

/** GET /products/:id — one product with stock from joined inventory. */
productsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = parseProductIdParam(req.params.id);
    const data = await getProductById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});
