import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

type SeedProduct = {
  productName: string;
  brand: string;
  category: string;
  sku: string;
  price: number;
  potency: {
    thcPercent: number | null;
    cbdPercent: number | null;
    thcMg: number | null;
    cbdMg: number | null;
    display: string;
  };
  description: string;
  imageUrl: string;
  inventoryQuantity: number;
  isActive: boolean;
};

function toCents(value: number) {
  return Math.round(value * 100);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run seed:products");
  }

  const seedPath = path.resolve(__dirname, "../../../../database/seed-data.json");
  const raw = await readFile(seedPath, "utf-8");
  const products = JSON.parse(raw) as SeedProduct[];

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    let productsUpserted = 0;
    let inventoryUpserted = 0;

    const storeResult = await client.query<{ id: number }>(
      `
      INSERT INTO stores (name, code)
      VALUES ($1, $2)
      ON CONFLICT (code)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
      `,
      ["Rebud Demo Store", "REBUD-DEMO-1"]
    );
    const storeId = storeResult.rows[0].id;

    for (const product of products) {
      const productResult = await client.query<{ id: number }>(
        `
        INSERT INTO products (
          store_id, sku, name, brand, category, description, image_url, potency_display, potency_json, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
        ON CONFLICT (store_id, sku)
        DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          potency_display = EXCLUDED.potency_display,
          potency_json = EXCLUDED.potency_json,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING id
        `,
        [
          storeId,
          product.sku,
          product.productName,
          product.brand,
          product.category,
          product.description,
          product.imageUrl,
          product.potency.display,
          JSON.stringify(product.potency),
          product.isActive,
        ]
      );

      const productId = productResult.rows[0].id;
      productsUpserted += 1;
      const status = product.isActive ? "active" : "archived";

      await client.query(
        `
        INSERT INTO inventory (
          store_id, product_id, quantity_on_hand, quantity_reserved, unit_price_cents, status
        )
        VALUES ($1, $2, $3, 0, $4, $5)
        ON CONFLICT (store_id, product_id)
        DO UPDATE SET
          quantity_on_hand = EXCLUDED.quantity_on_hand,
          unit_price_cents = EXCLUDED.unit_price_cents,
          status = EXCLUDED.status,
          updated_at = NOW()
        `,
        [storeId, productId, product.inventoryQuantity, toCents(product.price), status]
      );
      inventoryUpserted += 1;
    }

    await client.query("COMMIT");
    console.log(
      `Seeded ${productsUpserted} products and ${inventoryUpserted} inventory records successfully.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
