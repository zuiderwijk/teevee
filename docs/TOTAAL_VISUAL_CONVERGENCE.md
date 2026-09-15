# Teevee — Totaal visual convergence handoff

Status: **IMPLEMENTATION HANDOFF — accepted baseline, no redesign**
Date: 2026-09-15
Owner-approved sources: `design/current/guide/TOTAAL.md`, `design/current/guide/GUIDE_DAY_SELECTOR.md`, `docs/VISUAL_BASELINE.md`, `docs/UX.md`, `docs/DESIGN_SYSTEM.md`.

## Purpose

Bring the existing `GuideView` implementation visually into line with the already accepted Totaal baseline without reopening the proven interaction mechanics.

This is a convergence task, not a new design exploration. When this document conflicts with a generated mock-up, use the exact canonical assets referenced from `design/current/guide/TOTAAL.md` and the written repository rules.

## Canonical visual references

Totaal core composition:
- light: `/Teevee/Nederlandse tv-gids op smartphone.png`
  - file id: `file_0000000015ac81f4ab067e5473ed692d`
- dark: `/Teevee/Donkere Nederlandse tv-gidsinterface.png`
  - file id: `file_000000008448821095d8432693d09bd8`

Accepted day selector and sticky state:
- `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - file id: `file_00000000390c8210b76256621721592b`
- `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - file id: `file_00000000314481f69f6a34d18ece1c21`

Important authority rule: the day-selector boards define only the approved day-selector and sticky/condensed behaviour. Their generated programme-grid styling is not authoritative where it conflicts with the canonical Totaal images. In particular, do **not** copy the full-height red line visible in those boards.

## Current implementation: preserve versus converge

### Preserve exactly unless concrete physical regression evidence requires change

- horizontal movement remains time navigation;
- vertical movement remains channel navigation;
- real programme duration continues to determine horizontal geometry;
- current native inertia, bounce and directional locking;
- the proven partial-left-title/readability behaviour (`EdgeReadabilityOverlay` and related time-axis masking behaviour);
- direct programme tap -> Programme Detail;
- Programme Detail round-trip context;
- deferred Nu & Straks loading architecture;
- fixture-first / hosted-data runtime boundary;
- current large-text geometry adaptation as a capability;
- current semantic theme architecture and light/dark/system support.

This task must not turn into gesture, data or navigation refactoring merely to achieve the visual target.

## Visual hierarchy

At rest, the Totaal surface should read in this order:

1. shared Guide brand/shell context;
2. Guide presentation selector, with `Totaal` selected;
3. compact Guide day selector + separate `Nu` action;
4. time axis with restrained current-time marker;
5. open schedule grid with channel logos at left and programme typography aligned to real time;
6. quiet stable bottom navigation.

When vertically scrolled, non-functional upper chrome condenses away. The persistent functional stack is:

1. date selector + `Nu`;
2. time axis;
3. schedule grid.

The channel identity rail remains spatially available with the grid.

## Required convergence changes

### 1. Shared Guide presentation selector

The current floating bottom pill is not the accepted Totaal composition.

Target:
- presentation selector is part of the upper Guide hierarchy, under the brand/header area;
- treatments are primarily typographic and quiet rather than a floating segmented pill;
- selected state is explicit, with restrained red/current emphasis consistent with the canonical Totaal reference;
- `Totaal`, `Per zender`, `Nu & Straks` remain the same three presentations and keep their existing selection semantics;
- the control remains accessible as a tablist/tab group and retains usable touch targets even when the visual treatment is text-led.

Because this selector is shared by all Guide presentations, implement it as shared shell/chrome rather than as a Totaal-only duplicate.

### 2. Day selector

Replace the prototype permanent `Vandaag` / `Morgen` buttons with the accepted `GUIDE_DAY_SELECTOR.md` pattern:
- one compact typographic date control;
- separate `Nu` action;
- bounded D-2..D+7 bottom sheet;
- preserve viewed wall-clock time when changing day where practical;
- `Nu` restores both current day and actual current instant;
- between 00:00 and 05:59 show the preceding television-day date without a misleading `Vandaag` label;
- no unrestricted calendar, horizontal ten-day rail or previous/next-day arrows.

Visual treatment should feel like part of the information hierarchy, not a prominent pill toolbar.

### 3. Open programme grid — remove card treatment

The current permanent filled/rounded programme blocks are superseded for Totaal.

Target:
- programme surfaces visually read as part of one open timeline canvas;
- no permanent grey programme-card fill;
- no rounded-card stacking;
- use whitespace plus restrained row/temporal separators for structure;
- real programme start/duration geometry remains unchanged;
- pressed state may use a temporary, subtle opacity or transient surface feedback, but must not introduce a new permanent card language.

Do not change programme geometry merely to make the screenshot line up pixel-for-pixel.

### 4. Current programme treatment

Remove the in-cell progress bar from Totaal.

For a programme airing at the actual current instant:
- title is primary;
- useful secondary time copy is the end time, e.g. `tot 09:00`;
- do not redundantly repeat its already-spatially-evident start time;
- no progress bar;
- no special filled card is required.

For non-current programme cells:
- title remains primary;
- show start time when space/density permits;
- end time is normally unnecessary;
- historical programmes use the same neutral non-live treatment; do not add a special "past" colour state.

For very narrow cells, preserve the existing width-aware content degradation principle: title first, secondary time may disappear before the title does.

### 5. Current-time indicator

The canonical target is a compact red time marker on the time axis, including the actual current clock time when space permits.

Required:
- no full-height red line through all channel rows;
- no duplicate progress indication inside current cells;
- the marker may include a small pointer/notch anchoring it to the axis;
- the state cannot rely on red alone for accessibility; screen-reader programme labels still expose current status.

The compact marker should remain legible in both light and dark mode and must not obscure adjacent time labels.

### 6. Time axis

Keep the axis spatially stable and readable while horizontally browsing.

Target visual character:
- light typography and hairline/tick structure rather than a heavy bar;
- half-hour labels remain easy to scan;
- minor ticks may be used where already supported without adding noise;
- existing left-edge readability/masking behaviour remains intact;
- time-axis layout must keep working with the larger-text geometry strategy.

### 7. Channel identity rail

The canonical Totaal rail is logo-first and visually open.

Target:
- channel logos are the dominant visible identity;
- do not show a permanent `ZENDER` heading if it adds chrome without utility;
- when a readable logo exists, avoid making a small duplicate channel-name caption compete with it;
- full channel identity remains available to accessibility APIs;
- text-only fallback remains intentional and distinguishable, including at larger system text sizes;
- preserve logo proportions and do not recolour/distort marks for layout consistency.

Any ChannelIdentity change must be checked against Per zender and Nu & Straks before being shared globally. If the required visual treatment differs by presentation, add an explicit presentation variant instead of regressing those accepted surfaces.

### 8. Separators and surfaces

Light mode:
- near-white neutral canvas;
- programme area should not read as a patchwork of grey cards;
- use subtle neutral hairlines only where they improve temporal/channel orientation.

Dark mode:
- calm dark-anthracite canvas;
- same open grid hierarchy as light mode;
- avoid replacing light-mode grey cards with equally card-like dark blocks;
- separators remain subordinate to text and channel marks.

Use semantic theme tokens. If existing `programme` / `programmeCurrent` tokens become unnecessary for Totaal after convergence, do not delete or globally redefine them without first checking other surfaces that may still use them.

### 9. Brand/header condensation

At the top of the Guide, non-functional brand/header chrome may be visible.

On vertical scroll:
- it progressively condenses away with scroll position;
- it does not behave like a news-app header that disappears/reappears based on scroll direction;
- date + `Nu` + time axis remain persistently available;
- returning to the top restores the full rest-state hierarchy naturally;
- reduced-motion may use a simpler discrete state transition.

Do not let sticky chrome cover programme content or the system safe area.

## Typography

- Use the repository's approved Söhne visual direction / eventual production equivalent; do not bundle unlicensed font files as part of this convergence task.
- Programme title hierarchy is more important than exact screenshot font size.
- Secondary time text uses lower weight/contrast.
- Avoid excessive boldness across every row.
- Preserve tabular-number behaviour for times where technically appropriate.

## Larger system text

The accepted screenshot density is not a reason to cap substantive text globally.

At larger text sizes:
- row height and available text geometry may grow;
- essential title information must not be clipped solely to preserve baseline density;
- secondary time metadata may reduce/disappear before essential title information;
- compact Guide/day controls may use only the already documented narrow scaling caps where needed;
- text-only channel fallbacks must remain visually distinguishable;
- sticky date/`Nu`/time context may become taller if necessary rather than shrinking text beyond legibility.

Representative larger-text settings require physical validation.

## Gestures and gesture conflicts

Do not reopen accepted mechanics:
- horizontal gesture over schedule -> time;
- vertical gesture -> channels;
- directional lock remains active;
- day selector opens only from its explicit touch target and must not create a competing horizontal gesture zone;
- programme tap remains responsive immediately after momentum settles;
- bottom-sheet gestures must not interfere with the mounted Guide state or force the Guide to remount.

## Programme Detail context

Opening Programme Detail must preserve:
- active Totaal presentation;
- selected television day;
- horizontal time position;
- vertical channel position.

Closing detail returns to the same context. Visual convergence must not trade this away.

## Loading / real-data / fallback states

The same Totaal visual rules apply whether content comes from:
- deterministic fixture first frame;
- hosted canonical real data;
- offline/unavailable fallback.

A fixture -> hosted-data update must not flash back to the old card styling or reconstruct the Guide solely to apply the visual treatment.

## Accessibility

Minimum requirements:
- every programme remains a meaningful button for VoiceOver/TalkBack with channel, title and time context;
- current/live status is included semantically, not only through red;
- Guide presentation selector remains semantically a tablist/tab group;
- date selector exposes selected date and `Dag kiezen` semantics;
- `Nu` exposes `Ga naar nu` semantics;
- channel logos do not replace textual accessibility identity;
- touch targets remain platform-appropriate;
- contrast remains sufficient in light/dark/system;
- reduced-motion is respected for header condensation and animated jumps.

## Explicit non-goals

Do not use this work to:
- redesign Totaal gestures;
- change the television-day boundary or horizon;
- change Programme Detail scope;
- change bottom-nav information architecture;
- change provider/data architecture;
- add artwork, genre labels or recommendations;
- retune core timeline geometry solely for cosmetic matching;
- replace current validated interaction code with a parallel Guide implementation.

## Implementation order

Recommended sequence to minimise regression risk:

1. move/shared-style the Guide presentation selector into the accepted upper Guide shell while preserving selection/deferred-load semantics;
2. integrate the already accepted Guide day selector in place of prototype day buttons;
3. convert Totaal programme cells to open-grid styling without changing geometry/scroll architecture;
4. replace progress/full-height-current-time treatment with the compact axis marker and correct time-copy hierarchy;
5. refine channel rail presentation without breaking shared ChannelIdentity behaviour;
6. implement/validate header condensation and sticky context;
7. validate light/dark/system and representative larger-text settings;
8. run the existing interaction/test/export/native checks and perform focused physical iPhone acceptance; Android remains a separate physical gate when a device is available.

## Acceptance criteria

Totaal visual convergence is complete only when all of the following are true:

1. The screen clearly matches the canonical Totaal visual language in both light and dark mode: open timeline, logo rail, restrained separators, typography-led programme cells.
2. No permanent grey/rounded programme-card styling remains in Totaal.
3. No in-cell progress bar remains in Totaal.
4. No full-height red current-time line remains.
5. Current programmes show useful end-time context where space permits; non-current programmes use start-time context where space permits.
6. The Guide presentation selector is visually integrated into the upper Guide hierarchy rather than floating above the bottom navigation.
7. The accepted date selector/`Nu` pattern and D-2..D+7 behaviour are used.
8. Vertical scrolling preserves sticky date + `Nu` + time-axis context while non-functional chrome condenses.
9. Horizontal and vertical Guide gestures, inertia, bounce, directional lock and partial-left-title readability remain at least as good as the physically accepted baseline.
10. Programme Detail opens and returns without losing channel/time/day context.
11. Larger system text remains usable without globally disabling scaling.
12. Light, dark and system modes all preserve hierarchy/contrast.
13. Fixture-first, hosted real-data and fallback paths share the same visual treatment.
14. Existing automated checks pass; physical iPhone validation shows no interaction/performance regression.

## Current known code deltas (15 September 2026)

These are observations, not alternative design choices:
- `GuideView.tsx` still renders permanent `Vandaag` / `Morgen` pills plus a filled `Nu` badge;
- `GuideView.tsx` renders filled rounded programme blocks;
- current programmes render an in-cell progress track/fill;
- `GuideView.tsx` renders a full-height current-time line;
- the channel corner currently contains the `ZENDER` label;
- `ChannelIdentity` currently renders a small channel-name caption below a successful logo;
- `GuidePresentationSelector` is currently a floating segmented pill docked above the bottom navigation by `app/index.tsx`.

These implementation details are the primary visual convergence delta. They must not be mistaken for newer product decisions than the accepted canonical visuals.