# Phase 4 Guide day navigation increment

Status: **IMPLEMENTED IN PR #66 — NOT ACCEPTED / NOT MERGED**

This document records the durable implementation choices for the Phase 4 Guide day-selector increment. `docs/PROJECT_STATE.md` remains canonical for accepted project status and its `EXACT NEXT STEP` must not be advanced until Lead has accepted and merged the PR.

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

## Loading strategy

No ten-day hosted payload is introduced.

**Per zender** loads only the selected non-current television day through one bounded `[06:00, 06:00)` hosted read.

**Totaal** renders a bounded selected window plus the following television day when that following day is still inside D-2..D+7. These are two independent bounded day reads composed through the existing loader. The second day is not speculative prefetch: it is required by the accepted Totaal interaction contract so horizontal browsing can remain continuous when the stable time anchor crosses 06:00. D+7 therefore has no out-of-horizon following window.

The already proven shared current-day runtime remains owner of current-day fixture-first startup and D+D1 hosted refresh; the selected-day hook does not start a duplicate current-day request.

Visited non-current windows are retained only in a component-session in-memory Map, capped at ten entries. There is no persistence, SQLite, TanStack Query or new dependency.

## Failure, freshness and race handling

- network errors and `unavailable` responses do not clear an already usable selected-window cache or installed current-day schedule;
- in accordance with ADR 0007, an authoritative canonical `ok` schedule with a valid channel set and `programmes: []` remains authoritative covered-empty data and is never replaced by synthetic fixture programmes;
- an `ok` result with `channels: []` is treated separately as structurally unusable for the Guide surface and does not replace usable state;
- deterministic fixture fallback remains immediately usable only when no authoritative usable canonical schedule is available;
- returning to a visited window is immediate;
- selected non-current windows revalidate on app resume;
- a monotonic request version prevents stale/out-of-order results from a rapid day switch winning;
- freshness-only responses preserve equal cached content and therefore do not reset Guide context;
- current-day runtime refreshes do not cancel an in-flight non-current selected-day revalidation.

The deterministic source fixture remains unchanged. A new shared alignment path anchors that same 49-hour fixture to an explicitly selected 06:00 television-day boundary. This supplies complete selected-day early-morning fallback and enough real duration for two adjacent Totaal television-day windows even across the 25-hour fall-DST day, without changing programme ids, metadata, spacing or durations.

## Totaal behaviour

- accepted compact date selector replaces the old permanent `Vandaag` / `Morgen` prototype controls;
- `Nu` remains separate;
- existing 2D horizontal-time / vertical-channel gesture parameters are retained;
- programmes after midnight remain in the same television day;
- horizontal browsing can cross the next 06:00 boundary continuously and the visible date context follows the stable time anchor;
- selecting another day shifts the bounded base window while preserving the viewed wall-clock anchor;
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

Larger-text layout, VoiceOver interaction and physical gesture coexistence remain part of the focused iPhone acceptance gate because CI/jsdom cannot prove those device behaviours.

## Deterministic evidence

Focused tests cover:
- exact D-2 and D+7 availability and no outside selection;
- pre-06:00 labels, midnight continuity and exact 06:00 rollover;
- wall-clock preservation, `Nu` and `Primetime` semantics;
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

The exact PR head must have the repository-required typecheck, lint, test, Expo export and Android native CI checks green before QA starts.

## Intentionally unchanged

- no date selector in Nu & Straks;
- no eager `NowNextGuideView` import;
- no Programme Detail product change;
- no provider/server/storage contract change;
- no direct mobile external-provider dependency;
- no persistent schedule cache or new dependency;
- no unrestricted calendar, horizontal ten-day date rail or eager ten-day loading;
- no retuning of frozen Totaal or Per-zender gesture physics;
- no change to accepted visual design beyond wiring its documented states.

## Acceptance gates still open

This is a **HIGH-risk** increment. Before merge it requires:
1. exact-head CI fully green;
2. independent QA on that exact head;
3. focused physical iPhone acceptance for date-selector interaction, D-2/D+7, Totaal 00:00/06:00 continuity, wall-clock preservation, `Nu`, Per-zender `Primetime`, channel navigation, larger text, light/dark, Programme Detail round-trip, background/resume and frozen gesture behaviour.

Physical Android remains separately deferred by current project state; Android native compilation is not device acceptance.
