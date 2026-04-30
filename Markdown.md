# ReBUD Customer App POC Scope

## Goal

Build a real iOS customer app that communicates with a separate mock POS system through a backend API.

The purpose is to prove that a branded customer-facing app can connect to existing POS logic without replacing the POS.

## What This Is

This is a customer-facing app and integration proof of concept.

## What This Is Not

This is not a POS replacement.
This is not a Metrc integration.
This is not a real payment system.
This is not a production compliance system.
This is not a full SaaS platform yet.

## Core Architecture

Customer iOS App → Backend API → Mock POS Dashboard → Inventory / Orders / Rewards / Compliance Events

## MVP Demo Flow

1. Customer opens iOS app.
2. App pulls live inventory from backend.
3. Customer adds product to cart.
4. Customer places order.
5. Backend creates order and reserves inventory.
6. Mock POS dashboard receives order.
7. Employee changes order status.
8. Customer app receives status update.
9. Employee completes order.
10. Inventory quantity is reduced.
11. Customer earns rewards points.
12. Mock compliance event is created.

## Customer App Features

- Menu
- Product cards
- Product details
- Cart
- Checkout
- Order confirmation
- Live order status
- Rewards points
- Customer profile
- Order history

## Mock POS Features

- Inventory list
- Product quantity adjustment
- Incoming order queue
- Order detail page
- Status update controls
- Reserved inventory display
- Rewards event log
- Mock compliance event log

## Backend Features

- Product API
- Inventory API
- Order API
- Inventory reservation logic
- Order status update logic
- Rewards point calculation
- Mock compliance event generation

## Success Criteria

The demo is successful if the iOS app and mock POS behave like two separate systems connected through an API.
