# Teevee — Canonical Project State

Last updated: 2026-09-11
Status: ACTIVE
Current phase: **Phase 1 — Guide Interaction Prototype**
Previous phase: **Phase 0 — Project Foundation: COMPLETE**

> This is the mandatory starting point for every development-agent session. Read `AGENTS.md` and this file before making changes. If repository reality conflicts with this document, investigate and correct PROJECT_STATE before proceeding.

## 1. Product in one paragraph
Teevee is a new premium, paid and ad-free television-guide app for iOS and Android, developed under supervision of Bindinc/TVgids.nl. The Guide is the product: the app should be the fastest, calmest and most pleasant way to see what is on television now and next. The Dutch market is first. Core use must not require an account. Feature breadth is subordinate to Guide usability, speed, reliability and polish.

## 2. Current objective
Phase 1 exists to validate the defining UX and largest technical risk before broad product development: a high-performance, touch-native two-dimensional TV Guide on mobile using realistic deterministic fixture data.

No external EPG integration is required in Phase 1.

## 3. Frozen decisions
These may not be materially changed by an autonomous agent without human product approval or a clearly documented blocking technical finding.

- iOS + Android.
- React Native + Expo + strict TypeScript baseline.
- Paid, ad-free positioning.
- Guide-first; Guide is default destination.
- Netherlands first.
- No mandatory account for core Guide use.
- Light, dark and system appearance.
- External EPG providers are replaceable adapters behind a Teevee-owned canonical model.
- Mobile client never parses/calls an external EPG provider directly.
- Deterministic fixture data is mandatory.
- Free external EPG data is development-only until commercial rights/reliability are approved.
- Core Guide functionality cannot depend on programme artwork/enrichment.
- `docs/PROJECT_STATE.md` is canonical session-to-session agent memory.
- Complexity requires evidence; no speculative microservices/infrastructure.

Relevant ADRs:
- `docs/decisions/0001-guide-first-paid-ad-free.md`
- `docs/decisions/0002-cross-platform-expo.md`
- `docs/decisions/0003-provider-independent-epg.md`
- `docs/decisions/0004-project-state-as-canonical-memory.md`

## 4. Working but not frozen product hypotheses
- Working name: Teevee.
- Primary navigation later: Guide / Tonight / Search.
- Saved/reminders do not initially need a permanent primary tab.
- Tonight is a discovery presentation of schedule data, not a news feed.
- RevenueCat is preferred for subscriptions.
- Supabase/PostgreSQL is the initial backend preference once real-data work begins.
- Sentry is the preferred observability layer.

These hypotheses may be refined without reopening the frozen product promise, but material scope changes still require product approval.

## 5. Visual state
The supplied light/dark concept work is registered as **Visual Direction 01 — reference, not specification**.

Direction worth retaining: clean, contemporary, premium utility; restrained chrome; strong typography; functional Guide density; richer imagery outside the timeline. Exact colours, typography, spacing, components and navigation styling are not frozen.

Light mode is the primary exploration direction, but both themes are required.

## 6. Repository implementation state
At completion of Phase 0 the repository intentionally contains project foundation/documentation only. There is no production app implementation yet.

Foundation documents:
- `AGENTS.md` — agent operating model and Definition of Done
- `docs/PRODUCT.md` — product vision and MVP
- `docs/UX.md` — UX/IA and Guide interaction baseline
- `docs/ARCHITECTURE.md` — technical architecture
- `docs/DATA.md` — provider-independent EPG/data strategy
- `docs/DESIGN_SYSTEM.md` — visual/design-system direction
- `docs/BUILD_SPEC.md` — phased build specification
- `docs/decisions/*` — accepted durable decisions

## 7. Phase 1 scope
Build only enough product infrastructure to validate the Guide interaction:

- bootstrap Expo/React Native/TypeScript app;
- establish minimal semantic light/dark theme tokens;
- create realistic deterministic Dutch-style fixture schedule data;
- render a two-dimensional schedule with channel identity and time context;
- vertical channel navigation;
- horizontal time navigation;
- current-time marker;
- progress representation for currently airing programmes;
- jump-to-Now;
- minimal day navigation;
- programme tap to minimal detail presentation;
- instrument/profile rendering performance where useful.

Do not implement real EPG ingestion, Tonight, subscriptions, accounts, broad search, editorial content or metadata enrichment in this phase.

## 8. Phase 1 validation dataset
Fixtures must be designed for engineering/UX stress rather than screenshots. Include a realistic number of channels and programme cells, varied programme durations, very short and long titles, missing metadata, midnight boundaries, simultaneous prime-time starts, schedule gaps and at least 48 hours of data.

Exact fixture channel names/logos do not need to reproduce protected production assets. Synthetic or clearly development-only channel identities are acceptable.

## 9. Phase 1 exit gate
Phase 1 is complete only when all of the following are true:

- Guide scrolling/panning feels smooth at realistic data volume on representative iOS and Android targets.
- Horizontal and vertical movement preserve clear channel/time context.
- No material scroll synchronisation or layout instability remains.
- Now returns predictably to the current schedule position.
- Current-time/progress representation is understandable.
- Programme cells remain useful at realistic density.
- Light and dark themes both work.
- Programme selection/detail works sufficiently to validate navigation from the grid.
- Automated tests cover important schedule geometry/domain logic.
- The interaction is judged strong enough to justify proceeding rather than adding features to compensate for a weak Guide.

If performance or interaction is inadequate, iterate Phase 1. Do not hide the problem by proceeding to later phases.

## 10. Known risks / gates
### Primary technical risk
Two-dimensional virtualised Guide performance and synchronised interaction in React Native. Do not pre-optimise blindly; prototype, measure and select primitives based on evidence.

### Production data gate — later
The initial free external EPG provider still requires technical evaluation and is not approved for commercial production. Production schedule, metadata, channel-logo and artwork rights remain explicit later gates.

### Commercial gate — later
Exact subscription price, trial and paywall timing are not decided and do not block Phase 1.

### Design gate — later
Visual Direction 01 is not a frozen UI design. Phase 1 should establish a coherent working visual baseline but avoid expensive brand polishing before the Guide interaction is validated.

## 11. Definition of Done reminder
Follow `AGENTS.md`. In particular: acceptance criteria, relevant states, light/dark, accessibility, strict TypeScript, lint/tests, realistic performance, no secrets and updated project documentation are required before declaring work DONE.

## 12. EXACT NEXT STEP
**Bootstrap the Phase 1 Expo/React Native application foundation and implement the deterministic Guide fixture/domain layer required for the first Guide screen — without integrating any external EPG provider yet.**

The increment is complete when the repository can run an iOS/Android Expo app that opens directly to a minimal Guide route, has semantic light/dark theme plumbing, and exposes deterministic typed fixture data for at least 48 hours with realistic schedule edge cases. Do not build the full two-dimensional Guide interaction in the same increment; that is the following step after this foundation is verified.

After completing this increment, update this file with implementation reality and replace this EXACT NEXT STEP with the single next Guide-interaction increment.

## 13. Resume instruction
A fresh agent should be instructed:

> Read `AGENTS.md` and `docs/PROJECT_STATE.md` from `zuiderwijk/teevee`. Treat PROJECT_STATE as canonical. Execute the EXACT NEXT STEP autonomously, follow the Definition of Done, and update PROJECT_STATE when finished. Ask only when a decision crosses the human-approval boundaries in AGENTS.md.
