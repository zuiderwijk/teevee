# ADR 0003 — Provider-independent EPG architecture

Status: Accepted
Date: 2026-09-11

## Context
Development is supervised by Bindinc/TVgids.nl, but early progress must not depend on availability of internal Bindinc systems. A free external EPG source can accelerate development, but its reliability, completeness and commercial rights cannot be assumed.

## Decision
Teevee owns a canonical Channel/Programme domain model. External EPG sources are consumed only through provider adapters and a normalisation layer. The mobile client never calls or parses an external provider directly.

Development must remain possible with deterministic fixtures. A free external provider is permitted for development and validation only until production rights are explicitly confirmed. Bindinc/TVgids or a commercial supplier can later replace it behind the same boundary.

## Consequences
- Provider changes do not require rewriting presentation features.
- Ingestion and mapping become explicit backend concerns.
- Fixtures are a first-class development dependency.
- Production release has a hard data-rights/provider gate.
- Provider-specific IDs and malformed data must be normalised before reaching client features.
