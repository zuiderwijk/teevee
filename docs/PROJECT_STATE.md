# Teevee — Canonical Project State

Last updated: 2026-09-11 19:00 CEST
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
The current Phase 1 prototype on `main` includes:
- Expo SDK 57 / React Native / Expo Router project foundation;
- strict TypeScript;
- semantic light/dark theme tokens and system theme resolver;
- Teevee-owned `Channel`, `Programme` and `GuideFixture` domain types;
- deterministic fixture generator with 16 synthetic channels and 49 hours of programme data;
- edge cases for varied duration/title length, missing metadata, live/repeat flags and a deliberate schedule gap;
- pure Guide time-to-pixel geometry with automated tests;
- a real two-dimensional Guide viewport;
- fixed/anchored channel column and horizontally scrollable timeline;
- synchronised vertical channel movement;
- programme widths based on real duration;
- current-time marker;
- `Nu` action;
- current-programme progress indication;
- minimal day switching between today and tomorrow;
- programme selection with a simple bottom-sheet-style detail modal;
- GitHub Actions CI for install, typecheck, lint and tests.

No external EPG provider has been integrated. No production channel logos or programme artwork are used.

## Verification status
The repository reached a fully green CI state before the latest programme-interaction increment. GitHub Actions run #13 was started for the new increment and was queued/in progress at the time of this update. Therefore the newest interaction changes are **PENDING CI VERIFICATION** until that run completes successfully.

## Phase 1 objective
Validate the defining UX/technical risk: a high-performance touch-native two-dimensional TV Guide using realistic deterministic fixture data.

## Phase 1 remaining work
- keep latest CI green and resolve any failures;
- validate rendering/scroll behaviour under realistic mobile conditions;
- inspect whether the current nested ScrollView strategy remains smooth enough before adding specialised virtualisation;
- improve programme-cell usability at short durations and narrow widths;
- verify programme selection/detail interaction on device;
- verify light/dark appearance on device;
- prepare the first practical device-test path/build;
- perform representative iOS and Android performance validation.

## Phase 1 exit gate
Do not leave Phase 1 until the Guide is smooth at realistic volume, movement preserves time/channel context, Now is predictable, current/progress state is understandable, programme cells remain useful at practical density, light/dark both work, programme selection works, geometry/domain logic is tested, and the Guide interaction is strong enough to justify proceeding.

## Known risks
### Primary technical risk
The current implementation deliberately uses standard React Native primitives first. The nested scrolling/layout approach must be measured on real devices before introducing specialised virtualisation or gesture dependencies.

### Production data gate — later
The external development EPG source is not approved for commercial production. Production schedule, metadata, channel-logo and artwork rights remain later gates.

### Commercial gate — later
Exact subscription price, trial and paywall timing are not decided and do not block Phase 1.

### Design gate — later
Visual Direction 01 is not a frozen UI design. Avoid expensive brand polishing before Guide interaction and performance are validated.

## EXACT NEXT STEP
**Wait for/inspect CI for the latest Guide interaction increment; fix any failures autonomously. Once green, harden the Guide for first-device validation by improving narrow-programme rendering and adding a lightweight development build/test path without introducing real EPG or later-phase product scope.**

For that increment:
1. verify CI before claiming success;
2. keep standard React Native primitives unless measurement demonstrates a need for specialised virtualisation;
3. ensure very short programme blocks degrade gracefully instead of becoming unreadable/broken;
4. define the simplest repeatable way to launch/install the Phase 1 prototype on a physical iOS/Android device;
5. update `docs/DEVLOG.md` and this file after completion.

## Resume instruction
> Read `AGENTS.md` and `docs/PROJECT_STATE.md` from `zuiderwijk/teevee`. Treat PROJECT_STATE as canonical. Execute the EXACT NEXT STEP autonomously, follow the Definition of Done, and update PROJECT_STATE and the Dutch `docs/DEVLOG.md` when finished. Ask only when a decision crosses the human-approval boundaries in AGENTS.md.
