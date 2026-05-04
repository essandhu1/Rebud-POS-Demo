import { apiGetData } from "../lib/api";
import type { MenuProduct } from "../types/product";

/** GET /products → normalized product list. */
export async function fetchProducts(): Promise<MenuProduct[]> {
  return apiGetData<MenuProduct[]>("/products");
}

/** GET /products/:id → single product. */
export async function fetchProductById(productId: string): Promise<MenuProduct> {
  return apiGetData<MenuProduct>(`/products/${encodeURIComponent(productId)}`);
}
