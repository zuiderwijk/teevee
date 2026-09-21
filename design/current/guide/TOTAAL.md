# Totaal — current accepted production visual design

Status: **ACCEPTED — PRODUCTION VISUAL DESIGN OWNER-APPROVED**
Owner-approved: 2026-09-21
Micro-programme refinement owner-approved: 2026-09-21

This manifest defines the accepted Totaal production visual direction. It freezes composition, hierarchy and visual language. The detailed owner-approved production implementation specification is `docs/TOTAAL_VISUAL_CONVERGENCE.md`; it becomes canonical Development authority when the documentation/design PR is merged to `main`. Development must not start before that merge.

## Canonical visual asset

- `/Teevee/Totaal production design - light dark expanded condensed.png`
  - Library file id: `file_00000000aafc8230b3218e6577a1d912`
  - Library file id (stable record): `libfile_1f6afbdcf8748191b5d524a7aad5e0df`

The board contains:
- light / expanded-rest state;
- light / condensed-scrolled state;
- dark / expanded-rest state;
- dark / condensed-scrolled state.

The programme titles, exact broadcaster mix and generated icon artwork in the board are illustrative schedule content. The accepted production channel-logo registry and shared app-shell/navigation components remain authoritative for exact assets.

## Frozen interaction/data constraints

The visual design does not reopen:
- horizontal = time, vertical = channels;
- real programme start/duration determines horizontal geometry;
- native horizontal inertia/bounce and directional lock; normal vertical scrolling/fling/deceleration stay native, while Totaal alone intentionally disables vertical endpoint overscroll/rubber-band because physical iPhone validation rejected schedule-only displacement beneath the fixed functional stack;
- proven partial-left-title/time-axis readability behaviour;
- D-2 through D+7 Guide horizon;
- 06:00 Europe/Amsterdam television-day boundary;
- shared day selector + separate `Nu`;
- Programme Detail direct open and round-trip context preservation;
- bounded horizontal programme windowing/performance architecture;
- provider/data architecture;
- Instrument Sans;
- light/dark/system;
- Dynamic Type and accessibility.

## Accepted expanded/rest composition

Top to content:
1. shared Teevee Guide shell with `tv.` brand mark;
2. shared Search + secondary/settings action area;
3. shared Guide presentation tabs: `Totaal · Per zender · Nu & Straks`, with Totaal selected;
4. compact date selector + separate `Nu`;
5. compact time axis;
6. open 2D schedule grid with logo-first channel rail;
7. existing shared bottom navigation, visually identical in structure to Per zender.

Do not restore a large standalone `Gids` heading or the floating bottom Guide-presentation pill.

## Accepted condensed/scrolled composition

On vertical scroll:
- non-functional brand/action chrome and Guide presentation tabs condense away;
- **do not retain the `tv.` mark** in the condensed functional stack;
- date selector + `Nu` remain available;
- time axis remains available;
- schedule/channel context continues underneath without being covered;
- returning to the top restores the expanded hierarchy naturally;
- bottom navigation remains stable.

The exact collapse distance/animation calibration is not frozen by this visual board and must be specified against the existing proven scroll architecture rather than guessed from pixels.

## Accepted date-label presentation

Totaal now follows the same compact temporal wording as Per zender:
- from 06:00–23:59, current television day = **`Vandaag`** only;
- next television day = **`Morgen`** only;
- all other days use abbreviated weekday + date, e.g. **`Zo 20 sep`**;
- from 00:00–05:59, use explicit weekday + date for every day option/context; do not use `Vandaag` or `Morgen`.

No redundant date suffix follows `Vandaag` or `Morgen`.

The bounded D-2..D+7 bottom-sheet contract remains defined by `design/current/guide/GUIDE_DAY_SELECTOR.md`.

## Accepted schedule visual language

### Open grid
- no permanent rounded programme cards;
- no permanent programme fill used merely to define every cell;
- the schedule reads as one continuous timeline canvas;
- whitespace and restrained separators define structure;
- programme geometry continues to communicate real duration.

### Programme typography and metadata
- Instrument Sans;
- programme title is the primary visual information;
- running programme: secondary copy prioritises **`tot HH:MM`**;
- future/non-current programme: secondary copy uses the start time when useful;
- secondary time copy is visually quieter than the title;
- for normal narrow/partially clipped cells, title survives before secondary time metadata;
- a genuine microcell whose full real frame width is `< 48 × S pt` (`S = max(1, effectiveFontScale)`) suppresses meaningless title fragments and secondary time;
- individual micro presentation uses the typography-derived floor `27 × S`: below it the frame shows no visible glyph; at/above it (while still below `48 × S`) it shows one centred `…`;
- a visually empty ultra-microcell still keeps its full programme boundary, Pressable, accessibility label and Programme Detail action;
- when an individual `…` is shown, actual-current uses Semibold and non-current uses Medium;
- two or more directly adjacent microcells on the same channel with the same title after trim/whitespace normalisation form a repeated-title run;
- when the visible repeated-run intersection is at least `48 × S pt`, suppress per-cell `…` and show one shared one-line Medium title over the visible run, left-aligned with the existing 6-pt compact inset and clipped/sticky strictly inside the run bounds;
- repeated-title sharing never merges geometry: every underlying broadcast retains its own boundary, hit target, accessibility action and Programme Detail action;
- shared repeated-run title remains Medium even when one underlying broadcast is current; exact current semantics remain on that broadcast and the time-axis marker;
- exact font sizes/weights/row metrics remain defined by the production spec and validated physically.

### Current programme
- no in-cell progress bar;
- no heavy permanent current-programme card treatment;
- current state may use restrained typography or an extremely subtle local surface only if the production specification can prove it improves scanning without adding noise;
- current/live status remains explicit in accessibility semantics.

### Current-time indicator
- one compact red current-time marker anchored to the time axis;
- body height is 18 pt; the **38-pt minimum is readable label space**, with existing 5-pt X padding outside it, so actual outer body width is **48 pt at base compact scale / 56 pt at the 1.20 cap**;
- visible current clock copy is always the full `HH:MM` in existing 10/12 Semibold and must not ellipsize/shrink;
- the 6×4 pointer/notch remains tied to the exact current-minute X; viewport-edge clamping may move only the body, never the pointer;
- **no full-height red line through all channel rows**;
- current state is never colour-only semantically.

## Accepted time axis

- calm, light timeline rather than a heavy bar/raster;
- text labels on whole and half hours;
- quarter hours use unlabeled minor ticks;
- no extra dense intermediate tick rhythm by default;
- existing proven left-edge masking/readability behaviour remains intact;
- exact tick lengths/contrast and current-marker dimensions remain production-spec details.

## Accepted channel rail

- logo-first identity;
- no visible `ZENDER` heading;
- when a readable logo exists, do not duplicate the channel name visually underneath it;
- text fallback only when a logo is unavailable/unusable;
- full channel display name remains available to accessibility;
- logos use one consistent optical identity box while preserving original proportions;
- no arbitrary recolouring or distortion;
- rail shares the calm Guide canvas rather than reading as a separate card/sidebar;
- use only a restrained boundary where orientation benefits from it.

## Separators and surfaces

Light:
- near-white neutral canvas;
- subtle horizontal channel separation;
- temporal/programme boundaries are lighter than channel separation;
- no patchwork of grey cards.

Dark:
- calm dark-anthracite canvas;
- same open-grid hierarchy and geometry;
- separators remain subordinate to text/channel marks;
- do not convert light open-grid whitespace into dark filled cards.

## Bottom navigation

Use the same canonical bottom-navigation structure and behaviour as Per zender. The generated board is composition reference, not authority for exact glyph drawing.

## Accessibility and larger text

- substantive programme content remains Dynamic-Type/font-scale aware;
- do not preserve screenshot density by globally disabling scaling;
- channel text fallback remains readable and distinguishable;
- compact shared Guide controls follow their existing documented scaling rules;
- touch targets remain platform-safe;
- light/dark/system retain equivalent hierarchy and semantics;
- physical validation must cover representative larger-text settings.

## Production calibration

The owner-approved board freezes **direction and composition**, not every generated pixel. Exact production metrics, responsive rules, edge cases and physical acceptance criteria are proposed in `docs/TOTAAL_VISUAL_CONVERGENCE.md`.

That handoff calibrates the remaining implementation details, including:
- programme title/time typography;
- deterministic base/Dynamic-Type row geometry;
- channel-rail width/logo optical box;
- separator/tick hierarchy;
- compact current-time marker;
- fixed-native-viewport collapse/compensation;
- very short programmes, long titles and missing logos.

The production specification is owner-approved. Its values become Development authority when the documentation/design PR is merged to `main`; physical-device validation remains a later runtime gate.

The 2026-09-21 micro-programme amendment and subsequent owner physical refinement are targeted production refinements only. They do **not** reopen 84/76/3.00 programme geometry, programme boundaries, open-grid styling, channel rail, Guide chrome, day navigation, horizontal gesture/inertia ownership or programme-windowing. The explicit refinements are limited to the `27 × S` ultra-micro no-glyph floor, Totaal-only disabled vertical endpoint overscroll, and clarified current-marker readable/outer-body sizing while preserving exact-minute pointer semantics.

## Superseded Totaal visual treatments

This accepted production design supersedes:
- the previous provisional light image `/Teevee/Nederlandse tv-gids op smartphone.png`;
- the previous provisional dark image `/Teevee/Donkere Nederlandse tv-gidsinterface.png`;
- large standalone `TEEVEE / Gids` Totaal header treatment;
- floating bottom Guide-presentation selector;
- permanent rounded/filled programme cards;
- in-cell progress bars;
- full-height red current-time line;
- visible `ZENDER` heading;
- duplicate channel-name captions beneath readable broadcaster logos;
- `Vandaag, <date>` / `Morgen, <date>` wording.

Git history remains the archive for the earlier directions.
