# Technical Architecture

## System Overview

The proof of concept contains three app surfaces and shared packages:

- `apps/mobile-app`: native iOS customer-facing experience.
- `apps/api-server`: backend API and orchestration layer.
- `apps/pos-dashboard`: mock internal POS web dashboard.
- `packages/shared-types`: shared request/response and domain types.
- `packages/api-client`: reusable client for calling the API.

Data assets live in `database/` and reference docs live in `docs/`.

## Request Flow

1. Mobile app sends requests to API server.
2. API server applies business rules and persists data.
3. API server exposes order data to POS dashboard.
4. POS dashboard updates order state.
5. API server makes updates available back to mobile app.

## Design Principles

- **Separation of concerns:** mobile UX, POS operations, and backend logic remain isolated.
- **Shared contracts:** common types reduce mismatch and integration bugs.
- **POC-first delivery:** optimize for clarity and demoability over production complexity.
- **Monorepo velocity:** iterate across systems in a single repository.

## Next Implementation Steps

- Initialize each app with its framework baseline.
- Define v1 API endpoints and shared type contracts.
- Add basic database schema for products and orders.
- Wire demo flow end-to-end with mock data.
