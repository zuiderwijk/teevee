# Nu & Straks — current accepted visual

Status: **ACCEPTED**
Accepted: 2026-09-13
Production refinement accepted: 2026-09-18
Owner refinement accepted: 2026-09-21
Production specification: `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`

## Canonical asset
- Light/dark/live/Primetime reference: `/Teevee/Nu & Straks: Televiegids in beeld.png`
  - file id: `file_000000005b9c821080bc05914ea8c110`

## Preserve
- One shared reference instant across all channels.
- Reference/current programme is visually dominant.
- Exactly three following programme slots are shown more quietly.
- No programme artwork.
- No genre labels.
- No progress bars.
- No chevrons or repeated `Daarna` labels.
- Compact shared time rail with **15-minute navigation steps**; only whole and half hours carry visible time labels.
- Every quarter-hour position has a thin vertical tick: whole/half-hour ticks are longer, quarter-hour ticks are shorter and unlabeled; the selected/current reference marker remains visually strongest.
- `Primetime` is the explicit 20:30 shortcut; `Nu` restores live when browsing.
- Live mode always resolves programmes against the **actual current instant** and never rounds semantic `Nu` to a rail slot; visible live context is `Nu · HH:MM` using the actual minute.
- Horizontal movement changes the reference time; vertical movement changes channel context.
- Channel order and vertical position stay stable while the reference time changes.
- The physically accepted time-rail fling/settle behaviour remains frozen.
- `NowNextGuideView` remains behind its deferred import boundary.

## Current behaviour that overrides the screenshot
ADR 0008 defines the active television day as 06:00 to 06:00. Between 00:00 and 05:59, Nu & Straks remains in the preceding television-day context. It still has no independent date selector.

The accepted shared Guide shell also supersedes any standalone prototype header/floating-selector treatment visible in current runtime evidence. Nu & Straks uses the shared Guide chrome and keeps reference-time context + time rail as the persistent functional stack.

## Owner-accepted refinement — 2026-09-21

Physical iPhone evidence on the production-convergence candidate justified reopening a small set of Nu & Straks presentation details. These refinements are **OWNER ACCEPTED** and supersede the earlier production calibration only where listed:

- time navigation settles in **15-minute** increments instead of 30-minute increments;
- whole and half hours show text labels plus a thin vertical tick; quarter hours show only a shorter thin vertical tick;
- the selected/current rail marker remains the strongest temporal marker;
- the `Referentietijd` caption is removed; live context shows `Nu · HH:MM` with the exact actual minute, browse context shows the selected time;
- visible reference-programme `tot HH:MM` metadata is removed because the following programme start time normally communicates the same boundary; full start/end times remain available to accessibility and Programme Detail;
- the reference programme block is more compact and the transition to the three following programmes is tighter;
- the three following programme rows remain directly adjacent with no additional visual inter-row gap while retaining independent minimum 44 pt iOS / 48 dp Android touch targets;
- active/current `Nu` and return-to-live `Nu` must be visually and semantically distinct. The same control treatment may not represent both states.

Exact production metrics and acceptance criteria are frozen in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`.

## Accepted production density/accessibility refinement
The former compact following-row debt is resolved by the owner-approved production specification:

- each following programme owns a real, non-overlapping platform-safe target: minimum **44 pt on iOS / 48 dp on Android**;
- three following **slot geometries** remain reserved per channel even when programme data is missing, so reference-time changes do not shift vertical channel context;
- at effective font scale `<= 1.35`, following time + title remain on one row;
- above `1.35`, each following programme switches to stacked time/title layout and grows vertically rather than shrinking or overlapping text;
- substantive programme content keeps Dynamic Type; compact functional chrome alone uses the documented 1.20 cap;
- reference/following hierarchy remains typographic and open: no cards, artwork, progress, chevrons or extra labels are introduced.

Exact metrics, safe-area rules, shell condensation, Nu/Primetime states, time-rail geometry, pressed states, empty-data behaviour, Programme Detail round-trip and physical validation criteria live in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`.

## Superseded
Earlier Nu & Straks designs with progress bars, fewer following programmes, artwork, genres, card-heavy treatment or a calendar-day-only interpretation are not current.

The following prototype/runtime treatments are also non-canonical:
- 30-minute-only rail navigation;
- rail labels without positional quarter/half-hour ticks;
- rounding live `Nu` semantics to the nearest rail slot;
- a visible `Referentietijd` caption;
- visible reference-programme `tot HH:MM` metadata;
- identical visual treatment for active/current `Nu` and return-to-live `Nu`;
- strict-midnight day bounds;
- standalone `TEEVEE / Gids / Nu & Straks` production header;
- floating bottom presentation selector for this view;
- 24-pt interactive following rows;
- overlapping hitSlop as an accessibility workaround;
- system-font styling that bypasses Instrument Sans;
- opacity-heavy programme press feedback as the primary interaction state;
- any rail-settle path that starts a second `scrollTo()` after native snap.
