# Programme Detail — production convergence specification

Status: **CANONICAL PRODUCTION IMPLEMENTATION SPEC — accepted direction, one owner product decision still open**  
Date: 2026-09-18

This document converts the accepted Programme Detail direction into a production implementation contract. It is convergence, not redesign.

## 1. Authority

Reconcile implementation against, in this order:

1. explicit current owner corrections;
2. `docs/PROJECT_STATE.md`, `docs/PRODUCT.md`, `docs/UX.md` and accepted ADRs;
3. `docs/VISUAL_BASELINE.md`;
4. `design/current/PROGRAMME_DETAIL.md`;
5. the exact canonical visual reference `/Teevee/Teevee Programmadetail: Sticky acties.png` (Library file id `file_00000000242481f4a0e772876f215342`);
6. `docs/DESIGN_SYSTEM.md` and `design/current/TYPOGRAPHY.md`;
7. this document for exact runtime convergence and implementation calibration;
8. existing runtime only as implementation evidence, never as design authority.

The canonical visual asset above was inspected for this handoff. Its accepted intent is a calm information surface with normal in-content actions and contextual sticky copies, not a permanently action-heavy media hero.

## 2. Scope

This increment converges the existing direct-open Programme Detail surface to production quality while preserving Guide context.

Required:
- title-first information hierarchy;
- channel identity + broadcast date/time;
- useful current status only when relevant;
- `Herinner mij` + `Bewaar` action treatment;
- scrollable substantive content;
- contextual sticky copies after the original action group scrolls away;
- Dynamic Type, VoiceOver/TalkBack, Reduce Motion and light/dark/system;
- existing direct-open / direct-return Guide-context behaviour;
- production-safe missing-description behaviour;
- provider-independent action ownership.

Explicitly not part of this increment:
- Share;
- overflow menu;
- calendar export;
- recommendation feedback;
- streaming-service hero treatment;
- mandatory artwork;
- a Saved-programmes library screen;
- account/cross-device sync;
- configurable reminder presets;
- broad Phase 6 personal-feature IA.

## 3. Existing runtime constraints to preserve

Current runtime already proves valuable interaction/architecture that must not be discarded without regression evidence:

- Programme Detail is a modal surface layered above the mounted Guide.
- Opening/closing Detail does not remount the large Guide or lose Guide scroll context.
- Native/backdrop close and accessibility escape are supported.
- Downward swipe dismissal exists and respects Reduce Motion on cancelled drags.
- Totaal, Per zender and Nu & Straks all use the same Detail entry path.

Do **not** replace this with a new routed screen merely to implement the accepted visual. Keeping the Guide mounted is an intentional performance/context boundary.

The current runtime is incomplete because:
- content is not scrollable;
- metadata appears before title;
- actions are missing;
- sticky actions are missing;
- Instrument Sans is not explicitly applied to the Detail styles;
- missing descriptions expose a test-data placeholder;
- channel identity is text-only;
- date/status semantics are incomplete.

## 4. Presentation model

Programme Detail remains a bottom-presented modal sheet.

### 4.1 Sheet

Implementation calibration:
- dimmed backdrop remains restrained; current ~35% black treatment is acceptable;
- top corners: 24 pt radius;
- horizontal content inset: 20 pt;
- top handle remains 38 × 4 pt with semantic border/muted treatment;
- sheet must respect top and bottom safe areas;
- long content uses one vertical ScrollView inside the sheet;
- short content may remain content-height driven, but must never exceed the available safe viewport;
- long content may grow to the available safe viewport and then scroll;
- no full-screen hero/header image is required.

The bottom safe area is owned exactly once by the Detail sheet/sticky-action system. Do not stack SafeAreaView padding and manual inset padding.

### 4.2 Dismiss gestures

Once the body becomes scrollable, the existing whole-sheet vertical pan must not compete with content scrolling.

Production rule:
- attach swipe-to-dismiss to the handle/header region, or use explicit top-of-scroll gesture coordination;
- do not let normal body scrolling accidentally dismiss the sheet;
- backdrop tap, native Back and accessibility escape remain valid close mechanisms;
- a sticky action bar must not become a full-width dismiss-gesture trap;
- Reduce Motion may simplify spring-back animation but does not remove dismissal affordances.

## 5. Information hierarchy

Render in this order:

1. programme title;
2. channel identity + broadcast date/time;
3. current/status context when useful;
4. canonical action group;
5. description when available;
6. optional secondary metadata/enrichment when present and proven useful.

Do not place channel/time above the title.

### 5.1 Title

Implementation calibration:
- Instrument Sans Semibold;
- base 28/34 pt;
- substantive Dynamic Type enabled;
- no hard font-size cap;
- wrap naturally; do not ellipsize the primary title merely to preserve a screenshot height.

### 5.2 Channel + broadcast time

- channel logo is preferred when a canonical local/readable asset exists;
- channel name remains present as text/accessibility identity;
- missing-logo fallback uses channel text, never an empty slot;
- render local broadcast date/time in `Europe/Amsterdam`;
- same-day detail may use a concise localized date treatment, but historical/future broadcasts must expose the date unambiguously;
- time range is start–end, not start only.

Implementation calibration:
- 15/20 pt Medium for channel identity;
- 14/20 pt Regular for date/time secondary context;
- use semantic secondary text colour;
- keep enough spacing that channel/date/time reads as one metadata layer beneath the title.

The Detail selection contract must carry stable channel identity, not only a display name. Extend the selection type with canonical channel id / channel metadata rather than reverse-mapping from presentation text.

### 5.3 Status

Only add status when it gives information not already obvious from date/time.

Canonical current status:
- when `startAt <= now < endAt`: show textual `Nu bezig` treatment;
- state may use red/accent emphasis, but must not rely on colour alone.

Past/future broadcasts do not receive decorative `Afgelopen` / `Straks` badges by default. Their date/time is sufficient unless later research proves a need.

## 6. Actions

The accepted action set is exactly:
- `Herinner mij`;
- `Bewaar`.

No third action is introduced.

### 6.1 Layout

Base/supported phone widths:
- actions sit directly below identity/status and before description;
- minimum touch height: 48 pt;
- horizontal gap: 12 pt;
- base layout is two actions side by side when both labels fit comfortably;
- horizontal content inset remains aligned with the 20-pt Detail grid;
- `Herinner mij` may use the primary accent treatment;
- `Bewaar` is quieter, using semantic surface/border/text rather than a competing primary fill;
- state must be conveyed by label/semantic selected state as well as colour.

Action text uses Instrument Sans Medium/Semibold at normal functional-control sizing. Do not hard-cap Dynamic Type to preserve side-by-side layout.

### 6.2 Larger text / narrow width

When the two actions no longer fit with their platform touch targets and readable labels:
- stack vertically;
- preserve 12 pt separation;
- keep full labels;
- do not shrink text or clip labels.

Use actual available-width/text measurement or an equivalently deterministic layout rule rather than a device-name breakpoint.

### 6.3 Action states

`Bewaar`:
- available for historical, current and future broadcasts;
- inactive label: `Bewaar`;
- active label: `Bewaard`;
- toggling updates visible state immediately;
- state is local/persistent for the MVP; account sync remains Phase 6+.

`Herinner mij`:
- available only while the programme start is in the future;
- once a programme has started, omit the impossible reminder action rather than displaying a dead primary control;
- inactive label: `Herinner mij`;
- active label: `Herinnering aan`;
- cancelling an active reminder is done by pressing the active action again;
- notification permission is requested only as a consequence of an explicit reminder action, never on app launch;
- if permission/scheduling fails, the UI must not claim an active reminder.

The exact notification fire time is the one unresolved owner product decision; see §15.

## 7. Description and optional enrichment

- description uses Instrument Sans Regular, base 16/24 pt;
- substantive Dynamic Type remains enabled;
- do not cap description line count;
- do not render the current test string `Voor dit programma is in de huidige testdata nog geen beschrijving beschikbaar.` in production;
- when description is absent/blank, omit the description block and its spacing;
- optional artwork must degrade to no artwork without leaving a structural hole;
- artwork is not required for this increment;
- genre/repeat/live metadata is secondary and must not be added merely because domain fields exist.

## 8. Sticky action copies

The canonical actions live in content. The sticky bar is contextual duplication only.

### 8.1 Eligibility

- sticky bar can appear only when the Detail body is actually scrollable;
- it stays hidden while any meaningful part of the original action group is visible;
- short Detail pages whose original actions never leave the viewport never show the sticky bar;
- sticky bar mirrors the currently available action set and current action states.

### 8.2 Hysteresis

Do not derive stickiness from a magic absolute document scroll offset. Derive it from the measured original action-group position relative to the visible ScrollView viewport.

Canonical thresholds:
- **show** sticky copies only after the original action group is fully above the viewport and its lower edge has cleared the viewport top by at least **12 pt**;
- once sticky is visible, **hide** it only after at least **24 pt** of the original action group has re-entered the viewport from the top;
- these asymmetric 12/24 thresholds are intentional hysteresis and prevent boundary flicker.

Equivalent geometry is acceptable only if deterministic tests prove the same visible behaviour under Dynamic Type and stacked actions.

### 8.3 Sticky bar geometry

Implementation calibration:
- pinned to the bottom of the Detail sheet, not the app/root window;
- semantic sheet/elevated surface;
- subtle top hairline/separator;
- no heavy shadow/floating card;
- horizontal inset: 16 pt inside the bar;
- top padding: 10 pt;
- bottom padding: `max(10 pt, bottomSafeAreaInset)`;
- action touch height remains at least 48 pt;
- base gap between actions remains 12 pt;
- stacked layout follows the same rule as the canonical action group.

The body ScrollView must reserve bottom content padding equal to the rendered sticky bar height plus 16 pt clearance while the sticky system is eligible, so content can never be obscured.

## 9. Personal-state ownership

Programme personal state must remain independent from the EPG provider/data-source implementation.

### 9.1 Save state

Phase 4 `Bewaar` state is local-first and persists across:
- Detail close/reopen;
- Guide presentation changes;
- app restart.

Store by canonical `programme.id`. Persist a minimal snapshot sufficient for recovery/debugging (programme id, channel id, start/end, title) but do not make the snapshot a second schedule source of truth.

Keep storage behind a small repository/service boundary. Do not add SQLite/TanStack or an account dependency for this.

### 9.2 Reminder state

Reminder state owns:
- canonical programme id;
- scheduled local-notification identifier;
- scheduled fire instant;
- programme start instant used when scheduling.

Do not store reminder state inside Guide presentation components.

If the same canonical programme is later opened with a corrected start time, the reminder service must detect stale scheduled metadata before presenting `Herinnering aan` as valid. Exact background rescheduling policy may be hardened in Phase 6; Detail must at least not silently claim an active reminder whose local scheduling record is invalid.

## 10. Guide round-trip

Opening Programme Detail must not mutate:
- selected Guide presentation;
- selected day;
- selected channel;
- Totaal horizontal/vertical scroll position;
- Per-zender semantic viewed-time anchor;
- Nu & Straks reference instant/channel position.

Closing by any supported mechanism returns to the same mounted Guide surface.

Do not make Detail action state updates a reason to remount or rebuild the Guide dataset.

## 11. Accessibility

Required:
- sheet is exposed as modal content and background Guide content is not duplicated to screen readers while open;
- title is a heading;
- channel + date/time are exposed in a coherent accessible order;
- actions have button role, meaningful labels and selected/state semantics;
- `Herinnering aan` / `Bewaard` must be announced as states, not colour changes;
- Dynamic Type may increase sheet height and action-stack height;
- body remains scrollable at representative large accessibility sizes;
- sticky copies do not create confusing duplicate focus while originals are still accessible/visible;
- when sticky copies are active, originals that are fully offscreen remain normal scroll content; focus order must not jump unpredictably;
- minimum touch targets remain platform appropriate;
- Reduced Motion is respected for drag cancellation/presentation where supported.

## 12. Theme

Use semantic theme tokens only.

Light:
- near-white/neutral Detail surface;
- dark primary text;
- restrained secondary/meta text;
- red accent only for meaningful primary/current state.

Dark:
- calm anthracite/elevated surface;
- readable logos/fallback text;
- no hard-coded black/white assumptions in actions or separators.

System mode follows platform appearance without remounting action state.

## 13. Deterministic test contract

Development must add coverage for at least:

1. title precedes channel/date/time in rendered semantics;
2. missing description omits the production description block / test placeholder;
3. historical/current/future action availability;
4. `Bewaar` local state persists through Detail reopen and storage serialization;
5. reminder permission/schedule failure does not expose active state;
6. side-by-side actions at normal text and stacked actions under constrained text/width;
7. sticky show threshold after full exit + 12 pt;
8. sticky remains visible until 24 pt re-entry;
9. sticky never appears on non-scrollable short detail;
10. sticky state mirrors original action state;
11. sticky bottom padding includes bottom safe area once;
12. scrollable content cannot be obscured by sticky actions;
13. close/backdrop/native Back/accessibility escape;
14. header drag dismiss does not steal body ScrollView gestures;
15. Guide remains mounted and its existing context survives open/close/action toggles;
16. light/dark semantic tokens;
17. representative Dynamic Type layout without clipped essential copy.

Physical validation remains required for:
- nested sheet ScrollView + dismiss gesture feel on iPhone;
- large-text action stacking;
- sticky transition/hysteresis;
- bottom safe area;
- light/dark visual fidelity;
- VoiceOver focus order;
- Android gesture/back/TalkBack when a physical Android device is available.

## 14. Risk / implementation boundary

This is a HIGH-risk interaction increment because it combines:
- modal gesture arbitration;
- scroll measurement;
- sticky interactive chrome;
- persistent personal state;
- local-notification permission/scheduling if `Herinner mij` is implemented.

Keep these concerns separated:
- Detail presentation/layout component;
- personal-state repository;
- reminder notification service;
- pure geometry/state helpers for sticky thresholds.

Do not add unrelated Guide refactors.

## 15. OWNER PRODUCT DECISION REQUIRED BEFORE REMINDER RUNTIME

The accepted product baseline says `Herinner mij` uses push/local notifications as appropriate, but it does **not** define the default notification fire time.

Development must not invent this durable user-facing behaviour.

Freeze exactly one default for the MVP before notification code is added:

- **Option A — at programme start**: simplest and literal; no advance warning.
- **Option B — 5 minutes before start**: gives the user time to switch on the TV/stream, but establishes an implicit lead-time policy.
- **Option C — configurable lead time**: explicitly out of current Phase 4 scope unless the owner expands scope.

All other production rules in this document can proceed independently. No runtime PR should claim Programme Detail actions complete until this decision is recorded canonically.
