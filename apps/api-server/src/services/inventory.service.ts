import { getPool } from "../db/pool";
import { ApiError } from "../lib/api-error";
import { DEMO_STORE_CODE } from "./products.service";
import { stockStatusFromQuantity } from "../lib/stock-status";

export type InventoryRowApi = {
  inventoryId: string;
  productId: string;
  productName: string;
  sku: string;
  category: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  stockQuantity: number;
  inventoryDbStatus: string;
  stockStatus: ReturnType<typeof stockStatusFromQuantity>;
};

type InventoryQueryRow = {
  inventory_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  inventory_status: string;
};

function mapInventoryRow(row: InventoryQueryRow): InventoryRowApi {
  const onHand = row.quantity_on_hand;
  const reserved = row.quantity_reserved;
  const available = Math.max(0, onHand - reserved);
  return {
    inventoryId: row.inventory_id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    category: row.category,
    quantityOnHand: onHand,
    quantityReserved: reserved,
    stockQuantity: available,
    inventoryDbStatus: row.inventory_status,
    stockStatus: stockStatusFromQuantity(available),
  };
}

export async function listInventory(): Promise<InventoryRowApi[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT
      i.id::text AS inventory_id,
      p.id::text AS product_id,
      p.name AS product_name,
      p.sku,
      p.category,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.status AS inventory_status
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id
    WHERE i.store_id = (SELECT id FROM stores WHERE code = $1 LIMIT 1)
    ORDER BY p.name ASC
    `,
    [DEMO_STORE_CODE]
  );
  return result.rows.map((row) => mapInventoryRow(row as InventoryQueryRow));
}

export async function getInventoryByProductId(
  productId: string
): Promise<InventoryRowApi> {
  const pool = getPool();
  const productCheck = await pool.query(
    `
    SELECT 1
    FROM products p
    WHERE p.id = $1::bigint
      AND p.store_id = (SELECT id FROM stores WHERE code = $2 LIMIT 1)
    LIMIT 1
    `,
    [productId, DEMO_STORE_CODE]
  );
  if (productCheck.rowCount === 0) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const result = await pool.query(
    `
    SELECT
      i.id::text AS inventory_id,
      p.id::text AS product_id,
      p.name AS product_name,
      p.sku,
      p.category,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.status AS inventory_status
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id
    WHERE i.product_id = $1::bigint
      AND i.store_id = (SELECT id FROM stores WHERE code = $2 LIMIT 1)
    LIMIT 1
    `,
    [productId, DEMO_STORE_CODE]
  );

  if (result.rowCount === 0) {
    throw new ApiError(
      404,
      "INVENTORY_NOT_FOUND",
      "Inventory record not found for this product"
    );
  }

  return mapInventoryRow(result.rows[0] as InventoryQueryRow);
}
