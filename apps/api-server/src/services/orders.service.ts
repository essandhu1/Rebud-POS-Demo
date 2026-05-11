import { getPool } from "../db/pool";
import { ApiError } from "../lib/api-error";
import { DEMO_STORE_CODE } from "./products.service";

// ── Types ───────────────────────────────────────────────────────────────────

export type CartItemInput = {
  productId: string | number;
  quantity: number;
};

export type CustomerInput = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
};

export type CreateOrderInput = {
  customer: CustomerInput;
  channel: "mobile_app" | "pos_dashboard";
  items: CartItemInput[];
};

export type OrderResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  itemCount: number;
};

// ── Service ─────────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  const pool = getPool();

  // 1. Look up demo store
  const storeResult = await pool.query(
    `SELECT id FROM stores WHERE code = $1 LIMIT 1`,
    [DEMO_STORE_CODE]
  );
  if (storeResult.rowCount === 0) {
    throw new ApiError(500, "STORE_NOT_FOUND", "Demo store not found in database");
  }
  const storeId = storeResult.rows[0].id as number;

  // 2. Find or create customer
  const customerId = await findOrCreateCustomer(pool, storeId, input.customer);

  // 3. Resolve price & validate inventory for each item
  type ResolvedItem = { productId: number; quantity: number; unitPriceCents: number; lineTotalCents: number };
  const resolvedItems: ResolvedItem[] = [];

  for (const item of input.items) {
    const pid = typeof item.productId === "string" ? Number(item.productId) : item.productId;
    if (!Number.isFinite(pid) || pid <= 0) {
      throw new ApiError(400, "INVALID_PRODUCT_ID", `Invalid product id: ${item.productId}`);
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new ApiError(400, "INVALID_QUANTITY", `Invalid quantity for product ${pid}`);
    }

    const invResult = await pool.query(
      `SELECT i.unit_price_cents, i.quantity_on_hand, i.quantity_reserved
       FROM inventory i
       WHERE i.product_id = $1 AND i.store_id = $2
       LIMIT 1`,
      [pid, storeId]
    );
    if (invResult.rowCount === 0) {
      throw new ApiError(400, "PRODUCT_NOT_FOUND", `Product ${pid} not found or not in inventory`);
    }

    const inv = invResult.rows[0] as { unit_price_cents: number; quantity_on_hand: number; quantity_reserved: number };
    const available = inv.quantity_on_hand - inv.quantity_reserved;
    if (item.quantity > available) {
      throw new ApiError(
        400,
        "INSUFFICIENT_STOCK",
        `Insufficient stock for product ${pid}: requested ${item.quantity}, available ${available}`
      );
    }

    const unitPriceCents = inv.unit_price_cents;
    const lineTotalCents = unitPriceCents * item.quantity;
    resolvedItems.push({ productId: pid, quantity: item.quantity, unitPriceCents, lineTotalCents });
  }

  // 4. Calculate totals
  const subtotalCents = resolvedItems.reduce((s, i) => s + i.lineTotalCents, 0);
  // Demo: no tax or discount
  const totalCents = subtotalCents;

  // 5. Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 6. Create the order (status: 'placed')
  const orderResult = await pool.query(
    `INSERT INTO orders (store_id, customer_id, order_number, status, subtotal_cents, tax_cents, discount_cents, total_cents, channel, placed_at)
     VALUES ($1, $2, $3, 'placed', $4, 0, 0, $5, $6, NOW())
     RETURNING id, order_number, status`,
    [storeId, customerId, orderNumber, subtotalCents, totalCents, input.channel]
  );
  const order = orderResult.rows[0] as { id: number; order_number: string; status: string };

  // 7. Create order items
  for (const ri of resolvedItems) {
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, line_total_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, ri.productId, ri.quantity, ri.unitPriceCents, ri.lineTotalCents]
    );
  }

  // 8. Log order status event
  await pool.query(
    `INSERT INTO order_status_events (order_id, previous_status, new_status, source)
     VALUES ($1, NULL, 'placed', $2)`,
    [order.id, input.channel]
  );

  return {
    orderId: String(order.id),
    orderNumber: order.order_number,
    status: order.status,
    totalCents,
    itemCount: resolvedItems.length,
  };
}

async function findOrCreateCustomer(
  pool: ReturnType<typeof getPool>,
  storeId: number,
  input: CustomerInput
): Promise<number> {
  // Try to find by phone first, then email
  let result;
  if (input.phone) {
    result = await pool.query(
      `SELECT id FROM customers WHERE store_id = $1 AND phone = $2 LIMIT 1`,
      [storeId, input.phone]
    );
    if (result.rowCount && result.rowCount > 0) {
      return result.rows[0].id as number;
    }
  }
  if (input.email) {
    result = await pool.query(
      `SELECT id FROM customers WHERE store_id = $1 AND email = $2 LIMIT 1`,
      [storeId, input.email]
    );
    if (result.rowCount && result.rowCount > 0) {
      return result.rows[0].id as number;
    }
  }

  // Create new customer
  const insertResult = await pool.query(
    `INSERT INTO customers (store_id, first_name, last_name, phone, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [storeId, input.firstName, input.lastName, input.phone || null, input.email || null]
  );
  return insertResult.rows[0].id as number;
}