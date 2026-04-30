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
