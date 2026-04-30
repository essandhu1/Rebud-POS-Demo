# Product Vision

## Problem

Dispensaries often run legacy POS systems that are not built to deliver a polished, branded customer app experience. Teams want modern digital ordering and loyalty features without replacing their entire POS stack.

## Vision

Build a proof-of-concept that shows a native iOS customer app can sit on top of a mock POS dashboard through a backend API layer. The POC should prove the integration pattern, customer flow, and operational value.

## Users

- **Customers:** browse products, place pickup orders, and track status.
- **Store staff:** receive and process incoming orders in the POS dashboard.
- **Product/engineering team:** validate architecture, speed, and demo readiness.

## Success Criteria

- A full order lifecycle works end-to-end: browse -> checkout -> POS processing -> status updates.
- The API cleanly separates mobile and POS concerns.
- Shared types reduce integration drift between systems.
- The repo is organized to support quick iteration and future production hardening.
