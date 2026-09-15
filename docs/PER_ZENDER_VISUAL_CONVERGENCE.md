# Teevee — Per zender visual convergence handoff

Status: **IMPLEMENTATION HANDOFF — accepted baseline, no redesign**
Date: 2026-09-15
Owner-approved sources: `design/current/guide/PER_ZENDER.md`, `design/current/guide/GUIDE_DAY_SELECTOR.md`, `docs/VISUAL_BASELINE.md`, `docs/UX.md`, `docs/DESIGN_SYSTEM.md`.

## Purpose

Bring the existing `PerChannelGuideView` implementation visually into line with the accepted Per-zender baseline without reopening the proven interaction mechanics.

This is a convergence task, not a new design exploration. If a generated board conflicts with the exact canonical Per-zender asset or the written repository rules, the canonical asset plus written rules win.

## Canonical visual references

Per-zender core composition:
- light + dark: `/Teevee/TV-gids app in licht en donker thema.png`
  - file id: `file_000000008b2481f4ad34bb1547fc813e`

Accepted day selector and sticky state:
- `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - file id: `file_00000000390c8210b76256621721592b`
- `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - file id: `file_00000000314481f69f6a34d18ece1c21`

Authority notes:
- exact historical date choices are superseded by `GUIDE_DAY_SELECTOR.md`;
- the direct `Primetime` utility visible in the original Per-zender reference is owner-approved and remains part of the target;
- the older expanded time-picker (`Vanmiddag`, `Vooravond`, `Kies tijd…`) is **not** accepted;
- the sticky/condensed board predates the Primetime amendment, so its Per-zender compact row is stale only where it omits `Primetime`; written rules below win for that detail.

## Current implementation: preserve versus converge

### Preserve exactly unless concrete physical regression evidence requires change

- vertical movement remains schedule/time navigation;
- horizontal swipe across the schedule remains previous/next channel;
- the horizontally browsable channel-logo strip remains direct-tap channel navigation;
- direction locking and nested-scroll behaviour remain intact;
- changing channel preserves the viewed wall-clock anchor where practical;
- real programme times continue to determine vertical schedule geometry;
- direct programme tap -> Programme Detail;
- Programme Detail round-trip preserves channel/day/time context;
- fixture-first / hosted-data runtime boundary remains unchanged;
- light/dark/system continue through semantic theme tokens;
- text-only channel fallbacks remain supported;
- no thumbnails, genres or decorative previous/next channel arrows are added.

## Visual hierarchy

At rest, Per zender should read in this order:

1. shared Guide brand/shell context;
2. shared Guide presentation selector, with `Per zender` selected;
3. horizontal channel-logo strip;
4. selected channel name;
5. compact Guide day selector with separate `Primetime` and `Nu` utilities;
6. open vertical schedule with time gutter + programme titles;
7. quiet stable bottom navigation.

When vertically scrolled, the persistent functional stack becomes:

1. channel-logo strip;
2. one compact selected-channel + date context row with `Primetime` and `Nu`;
3. schedule.

Do not keep a duplicate large channel heading in the condensed state.

## Required convergence changes

### 1. Shared Guide presentation selector

Use the same shared upper Guide selector specified by `docs/TOTAAL_VISUAL_CONVERGENCE.md`.

Target:
- no floating bottom segmented pill;
- `Totaal`, `Per zender`, `Nu & Straks` remain the same three presentations and semantics;
- selected state is explicit but restrained;
- the selector is implemented once in shared Guide chrome rather than duplicated per presentation;
- existing deferred Nu & Straks loading behaviour remains untouched.

### 2. Channel-logo strip

The strip is one of the defining Per-zender controls and remains persistent.

Target:
- logos are the dominant visible identity;
- when a readable logo exists, do not add a permanent small text caption beneath it;
- full channel names remain available to accessibility APIs;
- text-only fallback remains intentional when artwork is missing or fails;
- active channel state is clear but quiet: a subtle selected surface/ring/treatment is preferred over a prominent decorative underline competing with the channel marks;
- preserve logo proportions; do not recolour or distort marks;
- keep enough spacing that the strip reads as channel navigation rather than a dense icon toolbar;
- tapping a logo selects directly; horizontal browsing of the strip remains independent from horizontal schedule paging.

If `ChannelIdentity` is shared with other Guide presentations, add an explicit compact/logo-only variant rather than globally removing fallback behaviour needed elsewhere.

### 3. Remove redundant swipe instruction

The current permanent text `Veeg horizontaal voor een andere zender` is not part of the accepted visual baseline.

Target:
- remove this persistent instructional copy from the normal screen;
- the persistent strip, selected state and proven horizontal schedule swipe provide the affordance;
- do not replace it with arrow buttons or another permanent hint.

If physical testing later shows discoverability is inadequate, treat that as separate UX evidence rather than silently restoring chrome.

### 4. Day selector

Replace prototype permanent `Vandaag` / `Morgen` buttons with the accepted `GUIDE_DAY_SELECTOR.md` pattern:
- one compact typographic date control;
- bounded D-2..D+7 bottom sheet;
- changing day preserves the viewed wall-clock time where practical;
- between 00:00 and 05:59 show the preceding television-day date without misleading `Vandaag` copy;
- no unrestricted calendar, horizontal ten-day rail or previous/next-day arrows.

`Primetime` and `Nu` are sibling utilities beside the date selector; neither is part of the bottom-sheet day selection itself.

### 5. Primetime and Nu utilities

Per zender has two deliberately different fast-navigation actions.

#### Primetime
- keeps the **currently selected television day**;
- jumps the vertical schedule to **20:30 Europe/Amsterdam** on that selected television day;
- does not switch back to the actual current date;
- between 00:00 and 05:59, when the active television day is still the preceding date, it jumps back to 20:30 on that preceding television-day evening;
- use a compact secondary treatment, preferably a small moon icon plus `Primetime` text where room permits;
- it remains available in both rest and condensed/sticky states.

#### Nu
- restores the **actual current instant**;
- also restores the television day containing that instant;
- remains visually compact and clearly distinct from Primetime.

Do not reintroduce the historical expanded time-picker with `Vanmiddag`, `Vooravond` or arbitrary `Kies tijd…` navigation as part of this decision.

### 6. Rest and condensed channel/date context

At rest:
- selected channel name can use the larger accepted heading treatment;
- date selector, `Primetime` and `Nu` form the secondary functional row directly beneath / alongside it;
- retain deliberate breathing room between the channel strip and schedule.

After vertical scroll:
- non-functional brand/header and large channel heading condense away;
- channel strip remains sticky at the top safe area;
- immediately beneath it, show one compact row such as `NPO 1 · ma 15 sep⌄` with `Primetime` and `Nu` available;
- no duplicate large `NPO 1` heading remains;
- condensation follows scroll position naturally and does not hide/show based merely on scroll direction;
- returning to the top restores the rest state naturally;
- reduced-motion may use a simpler discrete transition.

The condensed row may grow or wrap at larger text sizes; do not solve space pressure by shrinking substantive text below legibility.

### 7. Open vertical schedule

The schedule remains time-based, but its visual treatment should converge toward the canonical calm typographic list.

Target:
- time gutter on the left, programme title/content on the right;
- programme entries are open surfaces, not stacked cards;
- programme start time aligns with the programme frame and is the primary temporal label;
- separators are subtle and subordinate to typography;
- avoid a heavy full-width hourly grid when programme-aligned time/title rows already provide orientation;
- real programme start/duration geometry remains authoritative; do not flatten the schedule into equal-height rows simply to mimic the screenshot;
- gaps in the schedule remain honest spatial gaps rather than being visually collapsed.

The implementation may retain subtle hour/reference cues where useful for orientation, but they must not dominate the programme hierarchy.

### 8. Current programme treatment

Per zender may use a restrained row-local progress treatment because the accepted Per-zender visual explicitly uses one. This is presentation-specific; it must not be copied back into Totaal or Nu & Straks.

Target for the programme airing at the actual current instant:
- title remains primary;
- start time remains aligned in the left time gutter;
- a slim progress bar may communicate progress within the current programme;
- optional description/subtitle may appear only when source data exists and the programme's real vertical geometry provides comfortable space;
- no mandatory filled card is required;
- avoid redundant simultaneous live signals such as a filled block + red left border + full-width now line + progress bar.

Recommendation for convergence:
- remove the schedule-wide horizontal current-time line from the normal Per-zender list;
- remove the current filled-background + red-left-border stack if a local progress treatment is present;
- use one restrained primary visual current-state treatment, with semantic `nu bezig` status still exposed to assistive technology.

For short current programmes where a progress bar or description would crowd the title, title wins and secondary enrichment disappears first.

### 9. Programme information hierarchy

For non-current programmes:
- left gutter: start time;
- right: programme title;
- no genre labels;
- no thumbnails;
- no repeated end-time metadata when the following programme start already provides sufficient context.

For the current programme:
- start time remains in the time gutter;
- title is primary;
- optional description/subtitle is secondary and conditional;
- progress is allowed only as the restrained Per-zender current-state indicator described above.

Historical and future programmes share the same neutral typographic treatment; do not introduce separate decorative past/future card states.

### 10. Light / dark / system surfaces

Light mode:
- near-white neutral canvas;
- restrained hairlines;
- no grey stacked programme cards.

Dark mode:
- calm dark-anthracite canvas;
- the same open schedule hierarchy;
- selected/current surfaces remain subtle and do not become large bright blocks;
- channel logos provide much of the natural colour.

Use semantic tokens. Do not globally redefine shared theme tokens just to tune Per zender without checking Totaal and Nu & Straks.

## Larger system text

Per zender is time-geometric, so accessibility scaling must preserve time relationships rather than simply assigning equal minimum heights to every programme.

At larger text sizes:
- the global minute-height / schedule scale may increase to create more vertical room while preserving proportional wall-clock geometry;
- programme titles remain substantive and readable;
- descriptions/subtitles disappear before titles are clipped;
- very short programmes may use title-only treatment;
- channel strip and sticky context may grow in height where needed;
- date / `Primetime` / `Nu` utilities may wrap or use an adaptive two-row layout before labels are excessively shrunk;
- text-only channel fallback remains distinguishable;
- do not shrink substantive programme text merely to preserve screenshot density.

Representative larger-text settings require physical validation.

## Gestures and gesture conflicts

Do not reopen accepted mechanics:
- vertical gesture over schedule -> schedule time;
- horizontal gesture over schedule -> adjacent channel;
- horizontal gesture over channel strip -> browse channels;
- tap logo -> direct channel selection;
- date selector, `Primetime` and `Nu` are tap-driven and must not introduce another horizontal gesture zone;
- bottom-sheet gestures must not cause the mounted Guide to lose schedule/channel context;
- directional lock remains active to prevent accidental diagonal channel switches.

## Programme Detail context

Opening Programme Detail must preserve:
- active `Per zender` presentation;
- selected channel;
- selected television day;
- viewed time anchor / vertical schedule position.

Closing detail returns to that context.

## Loading / real-data / fallback states

The same Per-zender visual rules apply to:
- deterministic fixture first frame;
- hosted canonical schedule;
- offline/unavailable fallback.

A data refresh must not reset the selected channel/day/time unless the existing runtime contract requires a meaningful rollover, and it must not revert to older prototype day controls or styling.

## Accessibility

Minimum requirements:
- channel buttons expose full channel names and selected state;
- every programme exposes channel, title, start/end time and current status where relevant;
- date selector exposes selected date and `Dag kiezen` semantics;
- `Primetime` exposes `Ga naar primetime, 20:30 op geselecteerde dag` or equivalent semantics;
- `Nu` exposes `Ga naar nu` semantics;
- current state is not colour-only;
- date, Primetime and Nu retain platform-appropriate touch targets;
- sticky header never covers programme content or system safe areas;
- light/dark/system maintain sufficient contrast;
- reduced-motion is respected for header condensation and animated scroll/jump transitions.

## Explicit non-goals

Do not use this work to:
- redesign adjacent-channel swipe;
- replace the time-based vertical schedule with an equal-row list;
- add decorative channel arrows;
- add thumbnails or genre chips;
- reintroduce the expanded historical time-picker (`Vanmiddag`, `Vooravond`, `Kies tijd…`);
- change television-day boundary/horizon;
- change Programme Detail scope;
- change bottom navigation;
- change data/provider architecture;
- rewrite the accepted pager/strip architecture into a parallel implementation.

## Implementation order

Recommended sequence:

1. reuse the shared upper Guide presentation selector from the Totaal convergence work;
2. convert the channel strip to the accepted logo-led treatment without changing strip/pager mechanics;
3. integrate the accepted shared Guide day selector plus separate `Primetime` / `Nu` utilities;
4. remove redundant persistent swipe-help copy and align the rest-state channel/date/utility hierarchy;
5. implement the approved sticky/condensed channel-strip + compact channel/date/Primetime/Nu context state;
6. simplify the schedule toward programme-aligned time/title rows while retaining real time geometry;
7. converge current-programme treatment to one restrained local progress/current state and remove duplicate live signals;
8. validate Primetime semantics for current, historical, future and 00:00–05:59 television-day contexts;
9. validate light/dark/system and representative larger text;
10. run existing tests/checks and perform focused physical iPhone acceptance; Android remains a separate physical gate when a device is available.

## Acceptance criteria

Per-zender visual convergence is complete only when all of the following are true:

1. The screen clearly matches the accepted Per-zender visual language in light and dark mode: logo strip, selected channel context, open time/title schedule, restrained chrome.
2. The shared Guide presentation selector is in the upper Guide shell, not a floating bottom pill.
3. The channel strip is logo-led; successful logos are not forced to carry redundant tiny captions.
4. Selected channel state is clear without decorative previous/next arrows or excessive accent treatment.
5. Permanent swipe-instruction copy is gone.
6. The accepted date selector + separate `Primetime` + `Nu` pattern is used with D-2..D+7 behaviour.
7. `Primetime` keeps the selected television day and jumps to 20:30 on that day; `Nu` restores the actual current day and instant.
8. Between 00:00 and 05:59, Primetime returns to the preceding television-day evening rather than the following calendar evening.
9. Vertical scrolling leaves the channel strip plus one compact channel/date/Primetime/Nu context sticky while non-functional chrome condenses.
10. No duplicate large channel heading remains in condensed state.
11. Programme rows remain open and typographic, with start time in a left gutter and title primary.
12. Real wall-clock geometry, schedule gaps and channel/time-anchor preservation remain correct.
13. Current programme uses one restrained local current/progress treatment rather than multiple competing live indicators.
14. No artwork or genre labels are introduced.
15. Horizontal schedule swipe, channel-strip browsing/tap, direction lock and vertical scrolling remain at least as good as the physically accepted interaction baseline.
16. Programme Detail opens/returns without losing selected channel/day/time context.
17. Larger system text remains usable without globally disabling scaling or flattening time geometry.
18. Fixture-first, hosted real-data and fallback paths share the same visual treatment.
19. Existing automated checks pass; physical iPhone validation shows no interaction/performance regression.

## Current known code deltas (15 September 2026)

These are observations, not alternative design choices:
- `PerChannelGuideView.tsx` still has a bespoke `TEEVEE` / `Gids` header plus separate `Per zender` label while the shared Guide selector is currently docked at the bottom by `app/index.tsx`;
- the channel strip currently uses shared `ChannelIdentity`, which renders a tiny channel-name caption under successful logos;
- active strip selection currently adds a prominent underline in addition to opacity changes;
- prototype `Vandaag` / `Morgen` buttons remain in the context row;
- the accepted direct `Primetime` shortcut is not yet implemented;
- a permanent `Veeg horizontaal voor een andere zender` hint is rendered under the selected channel;
- the schedule currently combines hour-grid lines, filled current surface, red left current border and a schedule-wide horizontal now marker;
- programme description/subtitle is not currently used in Per zender even though the canonical domain supports it;
- the current schedule architecture is already time-geometric and must be preserved rather than flattened.

These implementation details are the primary visual-convergence delta. They must not be mistaken for newer product decisions than the accepted canonical visual and UX baselines.
