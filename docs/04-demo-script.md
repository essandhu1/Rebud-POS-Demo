# Demo Script

## Demo Goal

Show that a native iOS app can place and track orders through a backend API into a mock POS dashboard.

## Pre-Demo Setup

- Seed sample products and rewards data.
- Start API server.
- Open mobile app simulator.
- Open POS dashboard in browser.

## Walkthrough

1. **Menu browsing:** show products in mobile app.
2. **Add to cart:** add one or more products.
3. **Checkout:** place an order from mobile app.
4. **Backend handoff:** mention API receives and stores order.
5. **POS intake:** show new order appearing in dashboard.
6. **Order updates:** update status from dashboard (e.g., preparing -> ready).
7. **Customer feedback:** show status reflected in mobile app.

## Talking Points

- Clear architecture separation: app -> API -> POS.
- Shared types support consistency across systems.
- POC can evolve into production with real integrations.

## Expected Outcome

Stakeholders can see the complete order lifecycle and understand how the customer app can coexist with existing POS workflows.
