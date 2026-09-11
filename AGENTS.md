# Teevee Agent Operating Model

Every agent must begin by reading `docs/PROJECT_STATE.md`.

Teevee is designed for autonomous AI-agent development under human product supervision. Agents may make ordinary technical implementation decisions autonomously, but may not materially change the product promise, paid/ad-free positioning, primary navigation, programme-data rights/provider strategy, mandatory account policy, monetisation model, or fundamental architecture without human approval.

## Source-of-truth order
1. `docs/PROJECT_STATE.md`
2. `docs/PRODUCT.md`
3. `docs/UX.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA.md`
6. `docs/DESIGN_SYSTEM.md`
7. `docs/BUILD_SPEC.md`
8. `docs/decisions/*`

If documents conflict, resolve the conflict before proceeding and update the lower-priority document.

## Working rules
- Prefer simple explicit code over abstraction.
- Keep all EPG providers behind typed adapters.
- The mobile client must never depend directly on an external EPG provider.
- Deterministic fixture data must keep core development and tests independent of external services.
- Avoid microservices, Kubernetes, speculative infrastructure and premature abstraction.
- Treat visual references as direction rather than specification unless explicitly frozen.
- Work in small complete vertical increments.
- Record long-lived architectural decisions as ADRs.
- Update `docs/PROJECT_STATE.md` after every substantive milestone with completed work, known issues and exactly one next step.

## Definition of Done
A feature is DONE only when acceptance criteria are met; relevant loading, empty, error and offline states are handled; light and dark themes work; accessibility is acceptable; strict TypeScript, lint and tests pass; critical flows have automated coverage; performance is acceptable at realistic EPG volume; required observability exists; no secrets are committed; and documentation reflects reality.

## Product restraint
Teevee is guide-first. Do not introduce advertising, news feeds, social mechanics, engagement loops, AI recommendations, streaming-catalogue complexity or mandatory accounts unless product scope is explicitly changed.
