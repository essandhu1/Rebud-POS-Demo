import { getPool } from "../db/pool";
import { ApiError } from "../lib/api-error";
import { extractPotencyPercentages } from "../lib/potency";

/** Matches demo seed store (`seed-products.ts`). */
export const DEMO_STORE_CODE = "REBUD-DEMO-1";

const PLACEHOLDER_IMAGE =
  "https://placehold.co/600x600?text=Rebud+Demo+Product";

export type ProductApiRow = {
  id: string;
  name: string;
  category: string | null;
  sku: string;
  description: string | null;
  imageUrl: string;
  thcPercent: number | null;
  cbdPercent: number | null;
  price: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
};

function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

type ProductQueryRow = {
  id: string;
  name: string;
  category: string | null;
  sku: string;
  description: string | null;
  image_url: string | null;
  potency_json: unknown;
  created_at: Date;
  updated_at: Date;
  quantity_on_hand: number | null;
  quantity_reserved: number | null;
  unit_price_cents: number | null;
};

function mapProductRow(row: ProductQueryRow): ProductApiRow {
  const { thcPercent, cbdPercent } = extractPotencyPercentages(row.potency_json);
  const onHand = row.quantity_on_hand ?? 0;
  const reserved = row.quantity_reserved ?? 0;
  const available = Math.max(0, onHand - reserved);
  const priceCents = row.unit_price_cents ?? 0;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sku: row.sku,
    description: row.description,
    imageUrl: row.image_url?.trim() ? row.image_url : PLACEHOLDER_IMAGE,
    thcPercent,
    cbdPercent,
    price: centsToDollars(priceCents),
    stockQuantity: available,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listProducts(): Promise<ProductApiRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT
      p.id::text AS id,
      p.name,
      p.category,
      p.sku,
      p.description,
      p.image_url,
      p.potency_json,
      p.created_at,
      p.updated_at,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.unit_price_cents
    FROM products p
    LEFT JOIN inventory i
      ON i.product_id = p.id AND i.store_id = p.store_id
    WHERE p.store_id = (SELECT id FROM stores WHERE code = $1 LIMIT 1)
    ORDER BY p.name ASC
    `,
    [DEMO_STORE_CODE]
  );
  return result.rows.map((row) => mapProductRow(row as ProductQueryRow));
}

export async function getProductById(productId: string): Promise<ProductApiRow> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT
      p.id::text AS id,
      p.name,
      p.category,
      p.sku,
      p.description,
      p.image_url,
      p.potency_json,
      p.created_at,
      p.updated_at,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.unit_price_cents
    FROM products p
    LEFT JOIN inventory i
      ON i.product_id = p.id AND i.store_id = p.store_id
    WHERE p.id = $1::bigint
      AND p.store_id = (SELECT id FROM stores WHERE code = $2 LIMIT 1)
    LIMIT 1
    `,
    [productId, DEMO_STORE_CODE]
  );
  if (result.rowCount === 0) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  return mapProductRow(result.rows[0] as ProductQueryRow);
}
