# MVP Scope

## In Scope

- Native iOS customer app shell with menu browsing and cart flow.
- Mock POS dashboard for viewing and updating order status.
- Backend API server as the integration layer.
- Shared TypeScript types used by API and client surfaces.
- Simple database schema and seed data for products, orders, and rewards.
- Documentation and demo script for stakeholder walkthroughs.

## Out of Scope

- Real POS integrations.
- Real compliance system integrations.
- Real payment processing.
- Production-grade auth, infra, and observability.
- App Store deployment.

## MVP User Flow

1. Customer opens mobile app and browses menu.
2. Customer places an order.
3. API validates and stores order.
4. POS dashboard receives the order.
5. Staff updates order status in dashboard.
6. Customer sees status updates in app.

## Deliverables

- Repository structure for all systems.
- Starter docs and architecture baseline.
- Clear path for implementation in each app area.
