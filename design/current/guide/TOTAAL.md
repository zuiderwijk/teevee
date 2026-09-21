# Totaal — current accepted production visual design

Status: **ACCEPTED — PRODUCTION VISUAL DESIGN + IMPLEMENTATION CALIBRATION**
Owner-approved: 2026-09-21
Production specification: `docs/TOTAAL_VISUAL_CONVERGENCE.md`

This manifest defines the accepted Totaal production visual direction. The dedicated production specification now freezes the exact implementation metrics, responsive rules, edge cases and validation contract. This file remains the concise visual manifest; Development uses `docs/TOTAAL_VISUAL_CONVERGENCE.md` as the implementation handoff.

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
- native inertia, bounce and directional lock;
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

Production collapse calibration is frozen in `docs/TOTAAL_VISUAL_CONVERGENCE.md`: fixed-native-viewport isolation, 56-pt native collapse, 12-pt maximum chrome translation, 28-pt Reduce Motion switch and responsive 44/60-pt visual compensation. The persistent Totaal functional stack is 52-pt date/Nu + 44-pt time axis = 96 pt.

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
- for narrow/partially clipped cells, title survives before secondary time metadata;
- production typography is 15/19 Instrument Sans Medium for programme titles, 15/19 Semibold for actual-current titles and 13/18 Regular for secondary time; base row height is 76 pt with the responsive formula defined in the production specification.

### Current programme
- no in-cell progress bar;
- no heavy permanent current-programme card treatment;
- current state may use restrained typography or an extremely subtle local surface only if the production specification can prove it improves scanning without adding noise;
- current/live status remains explicit in accessibility semantics.

### Current-time indicator
- one compact red current-time marker anchored to the time axis;
- visible current clock copy may sit inside the compact marker;
- small pointer/notch may connect the marker to the axis;
- **no full-height red line through all channel rows**;
- current state is never colour-only semantically.

## Accepted time axis

- calm, light timeline rather than a heavy bar/raster;
- text labels on whole and half hours;
- quarter hours use unlabeled minor ticks;
- no extra dense intermediate tick rhythm by default;
- existing proven left-edge masking/readability behaviour remains intact;
- production axis calibration: 44-pt axis; 15-minute positions; :00/:30 labels; 1×10 major and 1×6 quarter ticks using `railTick`; compact 46×20 current-time marker with 6×4 notch. Exact opacity/token rules live in the production specification.

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

## Production calibration now frozen

The owner-approved board freezes direction and composition; `docs/TOTAAL_VISUAL_CONVERGENCE.md` now freezes the production calibration. Key values:
- shared GuideChrome 100 pt standard / 116 pt above fontScale 1.35;
- date + Nu row 52 pt;
- time axis 44 pt;
- persistent functional stack 96 pt;
- fixed-native-viewport collapse 56 pt with 44/60 pt visual compensation;
- channel rail 84 pt base with responsive Dynamic-Type width;
- logo optical box max 52×40 pt;
- schedule row 76 pt base with deterministic responsive growth;
- programme title 15/19 Medium, actual-current title 15/19 Semibold, secondary time 13/18 Regular;
- real programme frame width is not shortened for cosmetic gaps;
- programme cells use open boundaries rather than cards;
- exact short-programme, partial-left, loading, DST, accessibility and physical-validation contracts are defined in the production specification.

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
