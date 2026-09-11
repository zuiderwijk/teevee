# ADR-002: EPG provider independence

Date: 2026-09-11
Status: Accepted

## Context
Teevee is developed under Bindinc/TVgids.nl supervision, but early development should not depend on internal Bindinc availability. A free external EPG source can accelerate development, while production may later use Bindinc or another licensed supplier.

## Decision
The mobile application never consumes an external EPG provider directly. All sources pass through provider adapters and a Teevee-owned canonical programme-data contract. Deterministic fixture data is a first-class provider for development and tests.

## Consequences
Changing EPG suppliers must not require rewriting Guide feature/UI code. Provider-specific identifiers and XML/feed details remain outside the client domain. Free external data is considered development-only until commercial rights and operational suitability are explicitly approved.
