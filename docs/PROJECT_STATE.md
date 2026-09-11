# Teevee — Canonical Project State

Last updated: 2026-09-11
Status: ACTIVE
Current phase: **Phase 1 — Guide Interaction Prototype**
Previous phase: **Phase 0 — Project Foundation: COMPLETE**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a new premium, paid and ad-free television-guide app for iOS and Android, developed under supervision of Bindinc/TVgids.nl. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen decisions
- iOS + Android via React Native/Expo and strict TypeScript.
- Paid, ad-free, Guide-first.
- Light, dark and system appearance.
- No mandatory account for core Guide use.
- Provider-independent Teevee EPG domain model.
- Mobile client never consumes/parses external EPG directly.
- Deterministic fixtures are mandatory.
- Free external EPG data is development-only until rights/reliability are approved.
- Core Guide cannot depend on artwork/enrichment.
- `docs/PROJECT_STATE.md` is canonical cross-session agent memory.
- Complexity requires evidence.

Relevant ADRs: `0001` through `0004` in `docs/decisions/`.

## Working hypotheses
Primary navigation later: Guide / Tonight / Search. RevenueCat preferred for subscriptions. Supabase/PostgreSQL is the initial real-data backend preference. Sentry is preferred for observability. These are not required for Phase 1.

## Visual state
Existing light/dark concepts are **Visual Direction 01 — reference, not specification**. Preserve calm premium utility, hierarchy, restrained chrome and functional density. Light is the primary exploration direction; both themes are required.

## Implementation reality
The first Phase 1 foundation increment is implemented on `main`:
- Expo SDK 57 / React Native / Expo Router project manifest and app configuration;
- strict TypeScript configuration;
- semantic light/dark theme tokens and system theme resolver;
- app opens directly to a minimal Guide route;
- Teevee-owned `Channel`, `Programme` and `GuideFixture` domain types;
- deterministic fixture generator with 16 synthetic channels and 49 hours of programme data;
- fixture edge cases include varied duration/title length, missing metadata, live/repeat flags and a deliberate schedule gap;
- domain helpers for programme duration/progress;
- Vitest coverage for fixture horizon/edge cases and programme geometry helpers;
- Expo lint configuration;
- GitHub Actions CI definition for install, typecheck, lint and tests.

No external EPG provider has been integrated. No production assets/logos are used.

### Verification status
Repository writes are complete, but this agent environment cannot execute the mobile repository directly. A GitHub Actions workflow has been added to provide an external quality gate. At the time of this update GitHub reported no workflow runs yet, so runtime/typecheck/lint/test verification remains **PENDING**, not assumed green.

## Phase 1 objective
Validate the defining UX/technical risk: a high-performance touch-native two-dimensional TV Guide using realistic deterministic fixture data.

Phase 1 still needs:
- verified build/typecheck/lint/tests;
- two-dimensional schedule surface;
- persistent channel/time context;
- vertical channel movement and horizontal time movement;
- current-time marker and programme progress;
- jump-to-Now;
- minimal day navigation;
- programme selection/detail;
- realistic performance validation on iOS and Android.

## Phase 1 exit gate
Do not leave Phase 1 until the Guide is smooth at realistic volume, movement preserves time/channel context, Now is predictable, current/progress state is understandable, programme cells remain useful at practical density, light/dark both work, programme selection works, geometry/domain logic is tested, and the Guide interaction is strong enough to justify proceeding.

## Known risks
Primary risk remains two-dimensional virtualised Guide performance and scroll synchronisation in React Native. Prototype and measure before selecting specialised primitives. Production EPG rights/source, exact subscription model and final visual design remain later gates.

## EXACT NEXT STEP
**Verify the Phase 1 foundation through CI/runtime, resolve any dependency/type/lint/test failures, then implement the first real two-dimensional Guide viewport using the deterministic fixture/domain layer.**

For that Guide increment:
1. define time-to-pixel schedule geometry as pure tested domain/layout functions;
2. render a time axis plus a fixed/anchored channel column and programme cells for realistic fixture volume;
3. support vertical channel movement and horizontal time movement while preserving context;
4. do not yet add real EPG, Tonight, subscriptions, accounts or enrichment;
5. measure before adding specialised virtualisation dependencies.

If CI cannot run because repository Actions are disabled, treat enabling/running CI as the first verification action rather than assuming the foundation is valid.

After completing the increment, update this file with implementation reality and exactly one next step.

## Resume instruction
> Read `AGENTS.md` and `docs/PROJECT_STATE.md` from `zuiderwijk/teevee`. Treat PROJECT_STATE as canonical. Execute the EXACT NEXT STEP autonomously, follow the Definition of Done, and update PROJECT_STATE when finished. Ask only when a decision crosses the human-approval boundaries in AGENTS.md.
