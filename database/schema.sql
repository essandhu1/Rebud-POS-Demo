-- Rebud Customer App POC database schema
-- PostgreSQL-oriented SQL, simple enough for a demo and extensible for growth.

BEGIN;

-- =========================
-- Stores and rewards config
-- =========================

CREATE TABLE stores (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reward_tiers (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0 CHECK (min_points >= 0),
  max_points INTEGER CHECK (max_points IS NULL OR max_points >= min_points),
  points_multiplier_basis_points INTEGER NOT NULL DEFAULT 10000 CHECK (points_multiplier_basis_points > 0),
  perks_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, tier_name)
);

-- =========================
-- Catalog and inventory
-- =========================

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  image_url TEXT,
  potency_display TEXT,
  potency_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, sku)
);

CREATE TABLE inventory (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_code TEXT,
  package_tag TEXT,
  metrc_package_id TEXT,
  metrc_label TEXT,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  cost_cents INTEGER CHECK (cost_cents IS NULL OR cost_cents >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'sold_out', 'archived')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, product_id)
);

CREATE TABLE inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  order_id BIGINT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('restock', 'reserve', 'release', 'deduct', 'adjustment')),
  quantity_delta INTEGER NOT NULL,
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Customers and loyalty
-- =========================

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  external_customer_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  loyalty_points_balance INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points_balance >= 0),
  lifetime_points_earned INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_points_earned >= 0),
  current_tier_id BIGINT REFERENCES reward_tiers(id) ON DELETE SET NULL,
  points_to_next_tier INTEGER NOT NULL DEFAULT 0 CHECK (points_to_next_tier >= 0),
  membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, external_customer_id)
);

CREATE TABLE loyalty_events (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id BIGINT,
  event_type TEXT NOT NULL CHECK (event_type IN ('earn', 'redeem', 'adjustment', 'tier_change')),
  points_delta INTEGER NOT NULL,
  points_balance_after INTEGER NOT NULL CHECK (points_balance_after >= 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Orders and reservation flow
-- =========================

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed'
    CHECK (status IN ('placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  channel TEXT NOT NULL DEFAULT 'mobile_app' CHECK (channel IN ('mobile_app', 'pos_dashboard')),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, order_number)
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  inventory_id BIGINT REFERENCES inventory(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_reservations (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id BIGINT REFERENCES order_items(id) ON DELETE SET NULL,
  inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'released', 'fulfilled', 'expired')),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_events (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL
    CHECK (new_status IN ('placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  source TEXT NOT NULL CHECK (source IN ('mobile_app', 'api_server', 'pos_dashboard')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE inventory_movements
  ADD CONSTRAINT fk_inventory_movements_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

ALTER TABLE loyalty_events
  ADD CONSTRAINT fk_loyalty_events_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- =========================
-- Compliance logging
-- =========================

CREATE TABLE compliance_events (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  inventory_id BIGINT REFERENCES inventory(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'logged', 'sent', 'failed', 'ignored')),
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  external_reference TEXT,
  event_payload_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Indexes for common queries
-- =========================

CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_inventory_store_product ON inventory(store_id, product_id);
CREATE INDEX idx_orders_store_customer ON orders(store_id, customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_inventory_reservations_order_id ON inventory_reservations(order_id);
CREATE INDEX idx_inventory_reservations_inventory_id ON inventory_reservations(inventory_id);
CREATE INDEX idx_order_status_events_order_id ON order_status_events(order_id);
CREATE INDEX idx_loyalty_events_customer_id ON loyalty_events(customer_id);
CREATE INDEX idx_compliance_events_store_status ON compliance_events(store_id, status);

COMMIT;
