import { apiGetData } from "./api";

/** Matches the backend InventoryRowApi shape from GET /inventory. */
export type InventoryRow = {
  inventoryId: string;
  productId: string;
  productName: string;
  sku: string;
  category: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  stockQuantity: number;
  inventoryDbStatus: string;
  stockStatus: string;
};

/** Fetch full inventory list from the backend. */
export async function fetchInventory(): Promise<InventoryRow[]> {
  return apiGetData<InventoryRow[]>("/inventory");
}