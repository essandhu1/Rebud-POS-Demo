/** Demo threshold: at or below this on-hand count is "low_stock". */
export const LOW_STOCK_THRESHOLD = 10;

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function stockStatusFromQuantity(quantityOnHand: number): StockStatus {
  if (quantityOnHand <= 0) return "out_of_stock";
  if (quantityOnHand <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}
