# Rebud-POS-Demo
Something flashy to justify my worth to the company.
# Rebud Customer App POC

This project is a proof of concept for a native iOS customer app that communicates with a mock cannabis POS system through a backend API.

The goal is to prove that a branded customer-facing app can sit on top of an existing POS without replacing it.

## Core Demo

iOS Customer App → Backend API → Mock POS Dashboard → Inventory / Orders / Rewards / Compliance Events

## Main Components

### Mobile App

A customer-facing iOS app for browsing products, placing orders, tracking status, and viewing rewards.

### Mock POS Dashboard

A web dashboard that represents the internal POS system. It receives orders, manages order status, and displays inventory.

### API Server

The integration layer that connects the customer app to the mock POS logic.

## MVP Features

- Live menu
- Cart
- Checkout
- Inventory reservation
- POS order dashboard
- Order status updates
- Rewards points
- Mock compliance event logging

## Not Included Yet

- Real POS integration
- Real Metrc integration
- Real payments
- Real delivery GPS
- App Store release
- Multi-store SaaS

## Tech Stack

- Expo
- React Native
- TypeScript
- Next.js
- Node.js
- Supabase/Postgres
- Tailwind CSS

## Package Manager

This monorepo uses `pnpm` workspaces.

- Workspace config: `pnpm-workspace.yaml`
- Root package config: `package.json`

## Local Database (POC)

- Start local Postgres (if Docker is installed): `docker compose up -d`
- Apply schema: `pnpm db:schema`
- Seed demo products: `pnpm seed:products`

Fallback scripts:
- `pnpm db:schema:psql` if you prefer local `psql`
- `pnpm db:schema:docker` if Docker + `psql` are available in the container

### API Server (`apps/api-server`)

Prerequisites: Postgres running, schema applied, optional seed (`pnpm seed:products`), and `DATABASE_URL` set (see `apps/api-server/.env.example`).

Run the API locally:

```bash
pnpm dev:api
```

Health check:

```bash
curl -s http://localhost:4000/health
```

Products (demo store seeded as `REBUD-DEMO-1`):

```bash
curl -s http://localhost:4000/products | jq .
curl -s http://localhost:4000/products/1 | jq .
```

Inventory:

```bash
curl -s http://localhost:4000/inventory | jq .
curl -s http://localhost:4000/inventory/1 | jq .
```

Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }` (for example `PRODUCT_NOT_FOUND`, `INVENTORY_NOT_FOUND`, `INVALID_PRODUCT_ID`, `DATABASE_ERROR`).
