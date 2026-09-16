# Phase 4 Guide day navigation increment

Status: **ACCEPTED / MERGED — PR #66**

This document records the durable implementation choices for the accepted Phase 4 Guide day-selector increment. PR #66 merged to `main` as `823d3f6335eeec1abe4403f0ef2b1b324f16c35f` from exact independently reviewed and physically tested head `87bc533139223734f2a2fa51fad5fd3b237e861b`.

## Scope

PR #66 wires the accepted shared Guide day selector/date context into **Totaal** and **Per zender** for exactly D-2..D+7 television days. It uses the existing 06:00 Europe/Amsterdam television-day primitives from ADR 0008. `Nu & Straks` remains single-active-day and retains its deferred module import.

Accepted UX/design sources:
- `design/current/guide/GUIDE_DAY_SELECTOR.md`;
- `design/current/guide/TOTAAL.md`;
- `design/current/guide/PER_ZENDER.md`;
- `docs/TOTAAL_VISUAL_CONVERGENCE.md`;
- `docs/PER_ZENDER_VISUAL_CONVERGENCE.md`;
- ADR 0008.

## Selection model

The selected date is represented by the **absolute UTC instant of the television-day start**, not a calendar-day index. Consequences:
- midnight never changes the selected television day;
- 00:00–05:59 belongs to the preceding television-day date;
- the current day rolls exactly at 06:00 Europe/Amsterdam;
- a manually selected non-current day survives current-day refresh/resume while it remains inside D-2..D+7;
- `Nu` always resolves to the real current instant and the television day containing it;
- Per-zender `Primetime` keeps the selected day and resolves 20:30 on that day’s label date.

Day changes preserve the viewed Amsterdam wall-clock time where practical. The shared domain resolver handles spring/fall DST without fixed-24-hour arithmetic. A nonexistent spring-forward wall-clock target advances by the DST gap to the nearest practical equivalent.

Totaal has one additional source-of-truth rule: its visible date context is a projection of the **stable viewed-time anchor**, not of the real current clock. A real-clock 05:59 → 06:00 rollover therefore does not change a stationary Totaal date context. The date changes when the viewed-time anchor itself crosses 06:00. `Nu` is the explicit exception because it moves that anchor to the real current instant and therefore also to the current television day.

## Loading strategy

No ten-day hosted payload is introduced.

**Per zender** loads only the selected non-current television day through one bounded `[06:00, 06:00)` hosted read.

**Totaal** renders a bounded selected window plus the following television day when that following day is still inside D-2..D+7. These are two independent bounded day reads composed through the existing loader. The second day is not speculative prefetch: it is required by the accepted Totaal interaction contract so horizontal browsing can remain continuous when the stable time anchor crosses 06:00. D+7 therefore has no out-of-horizon following window.

The already proven shared current-day runtime remains owner of current-day fixture-first startup and D+D1 hosted refresh; the selected-day hook does not start a duplicate current-day request. Lifecycle ownership is derived from one explicit relationship: **selected television day equals current television day**. When that relation is true, resume refresh remains owned by the shared runtime. When the real clock crosses 06:00 and an unchanged selected/window day becomes historical, the relation flips to non-current and the selected-day hook takes over bounded resume revalidation for that same visible window.

Visited non-current windows are retained only in a component-session in-memory Map, capped at ten entries. There is no persistence, SQLite, TanStack Query or new dependency.

## Failure, freshness and race handling

- network errors and `unavailable` responses do not clear an already usable selected-window cache or installed current-day schedule;
- in accordance with ADR 0007, an authoritative canonical `ok` schedule with a valid channel set and `programmes: []` remains authoritative covered-empty data and is never replaced by synthetic fixture programmes;
- an `ok` result with `channels: []` is treated separately as structurally unusable for the Guide surface and does not replace usable state;
- deterministic fixture fallback remains immediately usable only when no authoritative usable canonical schedule is available;
- returning to a visited window is immediate;
- selected non-current windows revalidate on app resume, including a window whose `selectedDayStartMs` did not change but whose current/non-current ownership changed at the 06:00 real-clock boundary;
- current-day windows never install the selected-day resume listener, avoiding duplicate current-day refresh ownership;
- a monotonic request version prevents stale/out-of-order results from a rapid day switch winning;
- freshness-only responses preserve equal cached content and therefore do not reset Guide context;
- current-day runtime refreshes do not cancel an in-flight non-current selected-day revalidation.

The deterministic source fixture remains unchanged. A new shared alignment path anchors that same 49-hour fixture to an explicitly selected 06:00 television-day boundary. This supplies complete selected-day early-morning fallback and enough real duration for two adjacent Totaal television-day windows even across the 25-hour fall-DST day, without changing programme ids, metadata, spacing or durations.

## Totaal behaviour

- accepted compact date selector replaces the old permanent `Vandaag` / `Morgen` prototype controls;
- `Nu` remains separate;
- existing 2D horizontal-time / vertical-channel gesture parameters are retained;
- programmes after midnight remain in the same television day;
- horizontal browsing can cross the next 06:00 boundary continuously and the visible date context follows the stable viewed-time anchor;
- the real clock crossing 06:00 alone never advances a stationary Totaal date context;
- horizontal anchor movement, explicit day selection, horizon clamping and `Nu` all update the viewed-time anchor and its derived date context through the same commit path, preventing independent date/time state from drifting apart;
- selecting another day shifts the bounded base window while preserving the viewed wall-clock anchor;
- if D-2..D+7 shifts so the base window falls outside the horizon, the base window and viewed-time/date anchor are reconciled together to the nearest valid edge;
- vertical browsing may condense non-functional header chrome while date, `Nu` and the time axis remain available.

## Per-zender behaviour

- persistent channel-logo strip remains outside the vertical schedule scroll;
- existing adjacent-channel horizontal paging and vertical wall-clock geometry are retained;
- date switching preserves wall-clock context;
- `Primetime` stays on the selected television day and jumps to 20:30;
- before 06:00 that means 20:30 on the preceding television-day date;
- `Nu` instead returns to the real current television day and instant;
- only a user-initiated vertical drag triggers the condensed header state, so the programmatic initial time positioning does not incorrectly start the screen condensed.

## Accessibility and rendering

- bottom-sheet day rows expose complete labels and `accessibilityState.selected`;
- selected state is also visible with a checkmark and is not colour-only;
- introduced selector rows/close controls and the sibling Totaal `Nu` utility use at least 48 dp-equivalent touch-height targets;
- semantic theme tokens preserve light/dark/system behaviour;
- only one Per-zender television day and at most two adjacent Totaal television days are rendered, never all ten horizon days simultaneously.

Representative larger-text/accessibility use and physical gesture coexistence were exercised in the focused iPhone acceptance gate. Exact accessibility audit coverage remains part of later production hardening.

## Deterministic evidence

Focused tests cover:
- exact D-2 and D+7 availability and no outside selection;
- pre-06:00 labels, midnight continuity and exact 06:00 rollover;
- stationary Totaal viewed-time/date context across a real-clock 05:59 → 06:00 rollover, followed by date change only when the viewed anchor itself crosses 06:00;
- `Nu` explicitly resetting the Totaal anchor/date context to the real current instant and television day;
- current-day Totaal ownership before 06:00 with no duplicate selected-day network request or selected-day resume listener;
- an unchanged Totaal `selectedDayStartMs` becoming non-current at 06:00, causing selected-day lifecycle ownership to install and a later background → resume to revalidate that historical two-day window;
- wall-clock preservation and Per-zender `Primetime` semantics;
- spring/fall DST wall-clock targeting;
- selected-day bounded query windows including 23/25-hour DST days;
- one-day Per-zender versus two-independent-day Totaal loading;
- authoritative covered-empty schedules for both selected-day and current-day runtime paths;
- zero-channel `ok` schedules as a separate structurally unusable case;
- unavailable/network fallback and preservation of previously usable state during forced revalidation;
- revisit of cached context;
- rapid stale/out-of-order responses;
- non-current resume revalidation and freshness-only content equality;
- shared selector option count, busy state and selected accessibility semantics;
- selected television-day deterministic-fixture alignment without changing source programme identity;
- existing Programme Detail round-trip remains covered by the repository integration suite.

Exact PR head `87bc533139223734f2a2fa51fad5fd3b237e861b` passed CI #401 with strict TypeScript, lint, 44 test files / 265 tests, Expo export for iOS/Android/web and Android PR arm64 native compilation. Independent QA approved that exact head with no blocking or non-blocking findings. Post-merge CI #402 on exact merge SHA `823d3f6335eeec1abe4403f0ef2b1b324f16c35f` passed both `quality` and full-ABI `android-native`.

## Intentionally unchanged

- no date selector in Nu & Straks;
- no eager `NowNextGuideView` import;
- no Programme Detail product change;
- no provider/server/storage contract change;
- no direct mobile external-provider dependency;
- no persistent schedule cache or new dependency;
- no unrestricted calendar, horizontal ten-day date rail or eager ten-day loading;
- no retuning of frozen Totaal or Per-zender gesture physics;
- no Per-zender UX/gesture change as part of the Totaal lifecycle-ownership correction;
- no change to accepted visual design beyond wiring its documented states.

## Acceptance

This HIGH-risk increment is accepted and merged.

Physical iPhone acceptance passed on exact PR head `87bc533139223734f2a2fa51fad5fd3b237e861b` using iPhone 13 / iOS 26.6. Durable device evidence is recorded in `docs/PHYSICAL_EVIDENCE_2026-09-16_PHASE4_DAY_NAVIGATION.md`.

One non-blocking physical observation remains: the first very quick follow-up date interaction after a cold day/overview switch can feel briefly less responsive. That observation is tracked as issue #67 and must be measured before selecting any cache/prefetch optimisation. It is not evidence for eager D-2..D+7 loading or a new persistence dependency.

Physical Android remains separately deferred by current project state; Android native compilation is not device acceptance.
