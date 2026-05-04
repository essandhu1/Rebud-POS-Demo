/**
 * Normalized product shape (matches API `data` payload from GET /products and GET /products/:id).
 */
export type MenuProduct = {
  id: string;
  name: string;
  category: string | null;
  sku: string;
  description: string | null;
  imageUrl: string;
  thcPercent: number | null;
  cbdPercent: number | null;
  /** Dollars (from backend inventory unit price). */
  price: number;
  /** Available units (on_hand - reserved). */
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
};
