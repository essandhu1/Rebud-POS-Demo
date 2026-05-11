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

export type OrderListRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  channel: string;
  totalCents: number;
  itemCount: number;
  placedAt: string;
};

export type OrderDetail = OrderListRow & {
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

type ResolvedItem = { productId: number; quantity: number; unitPriceCents: number; lineTotalCents: number; inventoryId: number };

// ── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  const pool = getPool();

  const storeId = await getStoreId(pool);

  // 1. Find or create customer
  const customerId = await findOrCreateCustomer(pool, storeId, input.customer);

  // 2. Resolve price & validate inventory for each item; also capture inventory_id for reservations
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
      `SELECT i.id, i.unit_price_cents, i.quantity_on_hand, i.quantity_reserved
       FROM inventory i
       WHERE i.product_id = $1 AND i.store_id = $2
       LIMIT 1`,
      [pid, storeId]
    );
    if (invResult.rowCount === 0) {
      throw new ApiError(400, "PRODUCT_NOT_FOUND", `Product ${pid} not found or not in inventory`);
    }

    const inv = invResult.rows[0] as { id: number; unit_price_cents: number; quantity_on_hand: number; quantity_reserved: number };
    const available = inv.quantity_on_hand - inv.quantity_reserved;
    if (item.quantity > available) {
      throw new ApiError(
        400,
        "INSUFFICIENT_STOCK",
        `Insufficient stock for product ${pid}: requested ${item.quantity}, available ${available}`
      );
    }

    resolvedItems.push({
      productId: pid,
      quantity: item.quantity,
      unitPriceCents: inv.unit_price_cents,
      lineTotalCents: inv.unit_price_cents * item.quantity,
      inventoryId: inv.id,
    });
  }

  // 3. Calculate totals
  const subtotalCents = resolvedItems.reduce((s, i) => s + i.lineTotalCents, 0);
  const totalCents = subtotalCents;

  // 4. Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 5. Create the order
  const orderResult = await pool.query(
    `INSERT INTO orders (store_id, customer_id, order_number, status, subtotal_cents, tax_cents, discount_cents, total_cents, channel, placed_at)
     VALUES ($1, $2, $3, 'placed', $4, 0, 0, $5, $6, NOW())
     RETURNING id, order_number, status`,
    [storeId, customerId, orderNumber, subtotalCents, totalCents, input.channel]
  );
  const order = orderResult.rows[0] as { id: number; order_number: string; status: string };

  // 6. Create order items, reservations, and inventory movements
  for (const ri of resolvedItems) {
    // Create order item
    const itemResult = await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, line_total_cents)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [order.id, ri.productId, ri.quantity, ri.unitPriceCents, ri.lineTotalCents]
    );
    const orderItemId = itemResult.rows[0].id as number;

    // Create inventory reservation
    await pool.query(
      `INSERT INTO inventory_reservations (store_id, order_id, order_item_id, inventory_id, quantity_reserved, status, reserved_at)
       VALUES ($1, $2, $3, $4, $5, 'reserved', NOW())`,
      [storeId, order.id, orderItemId, ri.inventoryId, ri.quantity]
    );

    // Increment quantity_reserved on the inventory row
    await pool.query(
      `UPDATE inventory SET quantity_reserved = quantity_reserved + $1, updated_at = NOW()
       WHERE id = $2`,
      [ri.quantity, ri.inventoryId]
    );

    // Log inventory movement
    await pool.query(
      `INSERT INTO inventory_movements (store_id, inventory_id, order_id, movement_type, quantity_delta, reason)
       VALUES ($1, $2, $3, 'reserve', $4, 'Order placed')`,
      [storeId, ri.inventoryId, order.id, ri.quantity]
    );
  }

  // 7. Log order status event
  await pool.query(
    `INSERT INTO order_status_events (order_id, previous_status, new_status, source)
     VALUES ($1, NULL, 'placed', $2)`,
    [order.id, input.channel]
  );

  // 8. Log compliance events
  await logComplianceEvent(pool, storeId, order.id, null, "order_created", `Order #${order.id} created via ${input.channel}`);
  await logComplianceEvent(pool, storeId, order.id, null, "inventory_reserved", `${resolvedItems.length} item(s) reserved for order #${order.id}`);

  return {
    orderId: String(order.id),
    orderNumber: order.order_number,
    status: order.status,
    totalCents,
    itemCount: resolvedItems.length,
  };
}

/** Cancel an order and release its inventory reservations. */
export async function cancelOrder(orderId: string | number): Promise<void> {
  const pool = getPool();
  const oid = typeof orderId === "string" ? Number(orderId) : orderId;

  // 1. Verify the order exists and can be cancelled
  const orderResult = await pool.query(
    `SELECT id, store_id, status FROM orders WHERE id = $1 LIMIT 1`,
    [oid]
  );
  if (orderResult.rowCount === 0) {
    throw new ApiError(404, "ORDER_NOT_FOUND", `Order ${oid} not found`);
  }
  const order = orderResult.rows[0] as { id: number; store_id: number; status: string };

  const cancelable = ["placed", "accepted", "preparing"];
  if (!cancelable.includes(order.status)) {
    throw new ApiError(
      400,
      "ORDER_NOT_CANCELLABLE",
      `Order ${oid} is in status "${order.status}" and cannot be cancelled`
    );
  }

  // 2. Update order status
  await pool.query(
    `UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [oid]
  );

  // 3. Release all active reservations
  const reservations = await pool.query(
    `SELECT ir.id, ir.inventory_id, ir.quantity_reserved
     FROM inventory_reservations ir
     WHERE ir.order_id = $1 AND ir.status = 'reserved'`,
    [oid]
  );

  for (const row of reservations.rows as { id: number; inventory_id: number; quantity_reserved: number }[]) {
    // Release the reservation record
    await pool.query(
      `UPDATE inventory_reservations SET status = 'released', released_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [row.id]
    );

    // Decrement quantity_reserved on the inventory row
    await pool.query(
      `UPDATE inventory SET quantity_reserved = GREATEST(0, quantity_reserved - $1), updated_at = NOW()
       WHERE id = $2`,
      [row.quantity_reserved, row.inventory_id]
    );

    // Log release movement
    await pool.query(
      `INSERT INTO inventory_movements (store_id, inventory_id, order_id, movement_type, quantity_delta, reason)
       VALUES ($1, $2, $3, 'release', $4, 'Order cancelled')`,
      [order.store_id, row.inventory_id, oid, row.quantity_reserved]
    );
  }

  // ── Log status event ──
  await pool.query(
    `INSERT INTO order_status_events (order_id, previous_status, new_status, source, note)
     VALUES ($1, $2, 'cancelled', 'api_server', 'Inventory reservations released')`,
    [oid, order.status]
  );

  // Log compliance event
  await logComplianceEvent(pool, order.store_id, oid, null, "order_cancelled", `Order #${oid} cancelled, ${reservations.rows.length} reservation(s) released`);
}

/** List orders for the demo store. */
export async function listOrders(): Promise<OrderListRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       o.id::text,
       o.order_number,
       c.first_name || ' ' || c.last_name AS customer_name,
       o.status,
       o.channel,
       o.total_cents,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS item_count,
       o.placed_at
     FROM orders o
     INNER JOIN customers c ON c.id = o.customer_id
     WHERE o.store_id = (SELECT id FROM stores WHERE code = $1 LIMIT 1)
     ORDER BY o.placed_at DESC`,
    [DEMO_STORE_CODE]
  );
  return result.rows.map((r) => ({
    id: r.id as string,
    orderNumber: r.order_number as string,
    customerName: r.customer_name as string,
    status: r.status as string,
    channel: r.channel as string,
    totalCents: r.total_cents as number,
    itemCount: r.item_count as number,
    placedAt: (r.placed_at as Date).toISOString(),
  }));
}

/** Get a single order with items. */
export async function getOrderById(orderId: string | number): Promise<OrderDetail> {
  const pool = getPool();
  const oid = typeof orderId === "string" ? Number(orderId) : orderId;

  const orderResult = await pool.query(
    `SELECT
       o.id::text,
       o.order_number,
       c.first_name || ' ' || c.last_name AS customer_name,
       o.status,
       o.channel,
       o.total_cents,
       o.placed_at
     FROM orders o
     INNER JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1
     LIMIT 1`,
    [oid]
  );
  if (orderResult.rowCount === 0) {
    throw new ApiError(404, "ORDER_NOT_FOUND", `Order ${oid} not found`);
  }

  const row = orderResult.rows[0] as {
    id: string;
    order_number: string;
    customer_name: string;
    status: string;
    channel: string;
    total_cents: number;
    placed_at: Date;
  };

  const itemsResult = await pool.query(
    `SELECT
       oi.product_id::text,
       p.name AS product_name,
       oi.quantity,
       oi.unit_price_cents,
       oi.line_total_cents
     FROM order_items oi
     INNER JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [oid]
  );

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    status: row.status,
    channel: row.channel,
    totalCents: row.total_cents,
    itemCount: itemsResult.rowCount ?? 0,
    placedAt: row.placed_at.toISOString(),
    items: itemsResult.rows.map((i) => ({
      productId: i.product_id as string,
      productName: i.product_name as string,
      quantity: i.quantity as number,
      unitPriceCents: i.unit_price_cents as number,
      lineTotalCents: i.line_total_cents as number,
    })),
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getStoreId(pool: ReturnType<typeof getPool>): Promise<number> {
  const result = await pool.query(
    `SELECT id FROM stores WHERE code = $1 LIMIT 1`,
    [DEMO_STORE_CODE]
  );
  if (result.rowCount === 0) {
    throw new ApiError(500, "STORE_NOT_FOUND", "Demo store not found in database");
  }
  return result.rows[0].id as number;
}

async function findOrCreateCustomer(
  pool: ReturnType<typeof getPool>,
  storeId: number,
  input: CustomerInput
): Promise<number> {
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

  const insertResult = await pool.query(
    `INSERT INTO customers (store_id, first_name, last_name, phone, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [storeId, input.firstName, input.lastName, input.phone || null, input.email || null]
  );
  return insertResult.rows[0].id as number;
}

// ── Status transitions ──────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  placed: ["accepted"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
};

/** Update an order's status following allowed transitions. */
export async function updateOrderStatus(
  orderId: string | number,
  newStatus: string,
  source: string = "pos_dashboard"
): Promise<void> {
  const pool = getPool();
  const oid = typeof orderId === "string" ? Number(orderId) : orderId;

  const orderResult = await pool.query(
    `SELECT id, store_id, customer_id, status, total_cents FROM orders WHERE id = $1 LIMIT 1`,
    [oid]
  );
  if (orderResult.rowCount === 0) {
    throw new ApiError(404, "ORDER_NOT_FOUND", `Order ${oid} not found`);
  }
  const order = orderResult.rows[0] as { id: number; store_id: number; customer_id: number; status: string; total_cents: number };

  if (order.status === newStatus) {
    return; // no-op
  }

  if (order.status === "cancelled" || order.status === "completed") {
    throw new ApiError(
      400,
      "ORDER_FINALIZED",
      `Order ${oid} is already ${order.status} and cannot be changed`
    );
  }

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new ApiError(
      400,
      "INVALID_STATUS_TRANSITION",
      `Cannot transition order ${oid} from "${order.status}" to "${newStatus}"`
    );
  }

  // ── On "completed": fulfil reservations, deduct inventory ──
  if (newStatus === "completed") {
    await completeOrderFulfillment(pool, oid, order.store_id);
  }

  // Update the order status
  const extraFields = newStatus === "completed"
    ? "status = $1, completed_at = NOW(), updated_at = NOW()"
    : "status = $1, updated_at = NOW()";

  await pool.query(
    `UPDATE orders SET ${extraFields} WHERE id = $2`,
    [newStatus, oid]
  );

  await pool.query(
    `INSERT INTO order_status_events (order_id, previous_status, new_status, source)
     VALUES ($1, $2, $3, $4)`,
    [oid, order.status, newStatus, source]
  );

  // ── Post-status-change side-effects ──
  if (newStatus === "completed") {
    // Award loyalty points (1 point per $1 = total_cents / 100)
    await awardLoyaltyPoints(pool, order.store_id, order.customer_id, oid, order.total_cents);
    // Log compliance event
    await logComplianceEvent(pool, order.store_id, oid, null, "order_completed", `Order #${oid} completed`);
  }
}

/**
 * Fulfil all active reservations for a completed order and deduct inventory.
 */
async function completeOrderFulfillment(
  pool: ReturnType<typeof getPool>,
  oid: number,
  storeId: number
): Promise<void> {
  const reservations = await pool.query(
    `SELECT ir.id, ir.inventory_id, ir.quantity_reserved
     FROM inventory_reservations ir
     WHERE ir.order_id = $1 AND ir.status = 'reserved'`,
    [oid]
  );

  for (const row of reservations.rows as { id: number; inventory_id: number; quantity_reserved: number }[]) {
    // Mark reservation as fulfilled
    await pool.query(
      `UPDATE inventory_reservations SET status = 'fulfilled', fulfilled_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [row.id]
    );

    // Deduct from quantity_on_hand and quantity_reserved
    await pool.query(
      `UPDATE inventory
       SET quantity_on_hand = GREATEST(0, quantity_on_hand - $1),
           quantity_reserved = GREATEST(0, quantity_reserved - $1),
           updated_at = NOW()
       WHERE id = $2`,
      [row.quantity_reserved, row.inventory_id]
    );

    // Log deduct movement
    await pool.query(
      `INSERT INTO inventory_movements (store_id, inventory_id, order_id, movement_type, quantity_delta, reason)
       VALUES ($1, $2, $3, 'deduct', $4, 'Order completed')`,
      [storeId, row.inventory_id, oid, row.quantity_reserved]
    );

    // Log compliance event for inventory adjustment
    await logComplianceEvent(pool, storeId, oid, row.inventory_id, "inventory_adjusted", `Inventory item ${row.inventory_id} reduced by ${row.quantity_reserved} for order #${oid}`);
  }
}

/**
 * Award loyalty points to a customer (1 point per $1 spent).
 */
async function awardLoyaltyPoints(
  pool: ReturnType<typeof getPool>,
  storeId: number,
  customerId: number,
  orderId: number,
  totalCents: number
): Promise<void> {
  const pointsEarned = Math.floor(totalCents / 100); // 1 point per $1

  if (pointsEarned <= 0) return;

  // Update customer totals
  await pool.query(
    `UPDATE customers
     SET loyalty_points_balance = loyalty_points_balance + $1,
         lifetime_points_earned = lifetime_points_earned + $1,
         updated_at = NOW()
     WHERE id = $2`,
    [pointsEarned, customerId]
  );

  // Get new balance
  const custResult = await pool.query(
    `SELECT loyalty_points_balance FROM customers WHERE id = $1 LIMIT 1`,
    [customerId]
  );
  const newBalance = (custResult.rows[0] as { loyalty_points_balance: number }).loyalty_points_balance;

  // Log loyalty event
  await pool.query(
    `INSERT INTO loyalty_events (store_id, customer_id, order_id, event_type, points_delta, points_balance_after, description)
     VALUES ($1, $2, $3, 'earn', $4, $5, $6)`,
    [storeId, customerId, orderId, pointsEarned, newBalance, `Earned ${pointsEarned} points from order completion`]
  );
}

/**
 * Log a mock compliance event for demo visibility.
 */
async function logComplianceEvent(
  pool: ReturnType<typeof getPool>,
  storeId: number,
  orderId: number | null,
  inventoryId: number | null,
  eventType: string,
  description: string
): Promise<void> {
  await pool.query(
    `INSERT INTO compliance_events (store_id, order_id, inventory_id, event_type, status, severity, event_payload_json, description)
     VALUES ($1, $2, $3, $4, 'logged', 'info', '{}'::JSONB, $5)`,
    [storeId, orderId, inventoryId, eventType, description]
  );
}