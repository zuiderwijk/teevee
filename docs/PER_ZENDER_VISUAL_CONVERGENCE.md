# Teevee — Per zender production design specification

Status: **CANONICAL PRODUCTION IMPLEMENTATION SPEC — accepted design, no redesign**  
Date: 2026-09-17  
Revision: **fixed-row schedule correction — owner approved 2026-09-17**

This document is the implementation-level visual specification for the accepted **Per zender** Guide presentation. It converts the already approved visual/UX baseline into concrete production metrics. It does not create a new design.

For Per-zender visual implementation details that are not already more specifically frozen by higher-priority product/UX/ADR documents, this file is the single canonical developer handoff. Do not maintain a second copy of these measurements elsewhere.

## 1. Authority and correction note

This specification is based on:

- `AGENTS.md`;
- `docs/PROJECT_STATE.md`;
- `docs/PRODUCT.md`;
- `docs/UX.md`;
- `docs/VISUAL_BASELINE.md`;
- `docs/DESIGN_SYSTEM.md`;
- `design/current/guide/PER_ZENDER.md`;
- `design/current/guide/GUIDE_DAY_SELECTOR.md`;
- ADR 0005, ADR 0007 and ADR 0008;
- the exact canonical Per-zender visual asset;
- physical iPhone implementation evidence supplied by the owner.

Exact canonical pixels remain:

- Per zender light + dark: `/Teevee/TV-gids app in licht en donker thema.png`, Library file id `file_000000008b2481f4ad34bb1547fc813e`;
- Guide day-selector states: `/Teevee/Teevee Guide day selector - states and bottom sheet.png`, Library file id `file_00000000390c8210b76256621721592b`;
- sticky/condensed behaviour: `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`, Library file id `file_00000000314481f69f6a34d18ece1c21`.

### 1.1 Owner correction: Per-zender is not duration-geometric

The first implementation against the previous revision exposed a fundamental interpretation error in this handoff. The accepted Per-zender design is a **chronological fixed-row programme list**, not a vertical duration-proportional time axis.

The following rule is now canonical and supersedes every earlier statement in this document that implied proportional vertical programme geometry:

- every non-current programme uses the same standard programme-row height, independent of duration;
- the programme airing at the actual current instant uses one separate, taller current-programme row;
- programme start/end timestamps remain the source of truth for ordering, labels, current-state calculation, navigation anchors and progress;
- programme duration **does not determine Y position or row height**;
- schedule gaps do not create duration-proportional blank vertical space;
- do not use pt/minute, `normalizedHeight`, duration-driven frame height or minimum-height exceptions in Per zender.

The phrase `vertical wall-clock schedule` elsewhere in project documentation must therefore be read for Per zender as **chronological schedule browsing with truthful wall-clock timestamps**, not as a spatial minute-to-pixel scale. This owner correction is the more specific canonical visual rule.

### 1.2 Source precedence

1. Product behaviour, television-day semantics and gestures: `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md`, accepted ADRs.
2. Accepted visual composition: `VISUAL_BASELINE.md` + `design/current/guide/PER_ZENDER.md` + exact canonical visual assets.
3. Exact Per-zender implementation metrics and the fixed-row correction above: **this document**.
4. Reusable visual-system principles: `DESIGN_SYSTEM.md`.
5. Current runtime/code: evidence of implementation state, never authority for an intentional visual difference.

The historical expanded date/time picker remains superseded. The accepted model is one bounded D-2..D+7 day selector plus separate `Primetime` and `Nu`.

## 2. Metric status and units

All dimensions below are React Native logical **pt/dp** unless stated otherwise. A `hairline` means `StyleSheet.hairlineWidth`.

Values have one of three origins:

- **FROZEN** — already explicitly defined by product/UX/ADR.
- **CANONICAL** — directly expresses an approved visible relationship from the canonical Per-zender visual.
- **IMPLEMENTATION CALIBRATION** — an exact production value was not previously available as a vector token; the value below reproduces the approved composition without changing the product design.

Do not replace calibration values with local magic numbers. If physical evidence proves a calibration materially wrong, update this document first.

## 3. Visual breakdown by component zone

| Zone | Function | Visual hierarchy and layout relation | Relevant component/state |
| --- | --- | --- | --- |
| 1. Shared Guide chrome / presentation navigation | Identifies Teevee and switches Guide presentation | Brand context first; `Totaal / Per zender / Nu & Straks` directly below. `Per zender` selected with restrained red underline, never a filled segmented pill. | Shared Guide shell + presentation selector. |
| 2. Channel-logo strip | Primary channel navigation | Directly below presentation navigation; horizontally browsable; logos dominate; selected item receives a quiet surface/border. | Persistent channel strip. |
| 3. Selected-channel heading/context | Confirms selected channel | Large contextual channel name below strip at rest; absent from settled condensed state. | Rest selected-channel heading. |
| 4. Day selector | Selects D-2..D+7 television day | Primarily typographic, left side of context/utilities. | Shared day selector. |
| 5. Primetime | Jump to 20:30 on selected television day | Compact secondary utility. | Per-zender utility action. |
| 6. Nu | Restore actual current instant/day | Compact sibling utility. | Per-zender utility action. |
| 7. Schedule container | Chronological one-channel programme list | Open canvas below context; fixed programme rows; no duration-proportional vertical axis. | Vertical list + adjacent-channel paging. |
| 8. Time gutter | Programme start-time orientation | Stable left column; quiet tabular numerals. | Programme row time column. |
| 9. Programme content column | Title and current detail | Stable X coordinate across all row types. | Programme row content. |
| 10. Standard programme row | Normal programme before/after current | Fixed equal height; vertically centered time + title. | Standard row. |
| 11. Current programme row | Programme airing at actual current instant | Taller row; title + optional short description + mandatory local progress bar. | Current row. |
| 12. Separators | Supports scanning | One restrained row-bottom hairline. | Standard/current row bottom. |
| 13. Sticky/condensed state | Keeps functional context | Channel strip + compact channel/date/Primetime/Nu; non-functional chrome removed. | Scroll-driven condensed state. |
| 14. Bottom-navigation boundary | Separates Guide from primary nav | Existing stable app-shell tab bar. | Router tab bar. |

## 4. Production metric tokens

Implementation must define these values once as named metrics. Do not scatter literal copies through components.

### 4.1 Shared Guide chrome

| Token | Value | Status |
| --- | ---: | --- |
| `guide.screenInsetX` | 20 | IMPLEMENTATION CALIBRATION |
| `guide.brandTopInset` | 8 | IMPLEMENTATION CALIBRATION |
| `guide.brandMarkBoxWidth` | 56 | IMPLEMENTATION CALIBRATION |
| `guide.brandMarkBoxHeight` | 44 | IMPLEMENTATION CALIBRATION |
| `guide.presentationNavHeight` | 48 | IMPLEMENTATION CALIBRATION |
| `guide.presentationIndicatorWidth` | 88 | IMPLEMENTATION CALIBRATION |
| `guide.presentationIndicatorHeight` | 2.5 | IMPLEMENTATION CALIBRATION |
| `guide.presentationIndicatorRadius` | 1.25 | IMPLEMENTATION CALIBRATION |
| `guide.controlPressOpacity` | 0.64 | IMPLEMENTATION CALIBRATION |
| `guide.disabledOpacity` | 0.40 | IMPLEMENTATION CALIBRATION |

Presentation tabs divide available width equally. The selected indicator is centred and uses `min(88, tabWidth - 16)`.

### 4.2 Channel strip and context

| Token | Value | Status |
| --- | ---: | --- |
| `perChannel.channelStripInsetX` | 20 | IMPLEMENTATION CALIBRATION |
| `perChannel.channelItemSize` | 48 | IMPLEMENTATION CALIBRATION |
| `perChannel.channelItemGap` | 12 | IMPLEMENTATION CALIBRATION |
| `perChannel.logoMaxWidth` | 40 | IMPLEMENTATION CALIBRATION |
| `perChannel.logoMaxHeight` | 32 | IMPLEMENTATION CALIBRATION |
| `perChannel.channelStripHeight` | 72 | IMPLEMENTATION CALIBRATION |
| `perChannel.stripToHeadingGap` | 24 | IMPLEMENTATION CALIBRATION |
| `perChannel.headingToUtilitiesGap` | 8 | IMPLEMENTATION CALIBRATION |
| `perChannel.utilityRowMinHeight` | 52 | IMPLEMENTATION CALIBRATION |
| `perChannel.utilityVisibleHeight` | 36 | IMPLEMENTATION CALIBRATION |
| `perChannel.utilityGap` | 8 | IMPLEMENTATION CALIBRATION |
| `perChannel.utilityToScheduleGap` | 12 | IMPLEMENTATION CALIBRATION |
| `perChannel.stickyContextHeight` | 52 | IMPLEMENTATION CALIBRATION |
| `perChannel.stickyContextWrappedHeight` | 88 | IMPLEMENTATION CALIBRATION |
| `perChannel.collapseDistance` | 56 | IMPLEMENTATION CALIBRATION |

### 4.3 Programme-list metrics — canonical corrected values

| Token | Value | Status | Rule |
| --- | ---: | --- | --- |
| `perChannel.standardRowHeight` | **52** | CANONICAL CALIBRATION | Every non-current programme at base text size. Duration-independent. |
| `perChannel.currentRowHeight` | **120** | CANONICAL CALIBRATION | Programme airing at actual current instant at base text size. Duration-independent. |
| `perChannel.timeGutterWidth` | 64 | IMPLEMENTATION CALIBRATION | Stable time column. |
| `perChannel.timeTextX` | 24 | IMPLEMENTATION CALIBRATION | Start-time text X. |
| `perChannel.programmeColumnX` | 100 | IMPLEMENTATION CALIBRATION | Title/description/progress X. |
| `perChannel.programmeRightInset` | 24 | IMPLEMENTATION CALIBRATION | Title/description/progress right edge. |
| `perChannel.currentContentTopInset` | 14 | IMPLEMENTATION CALIBRATION | Current title content top. |
| `perChannel.currentDescriptionGap` | 2 | IMPLEMENTATION CALIBRATION | Current title → description. |
| `perChannel.progressHeight` | 4 | CANONICAL CALIBRATION | Local current progress track. |
| `perChannel.progressRadius` | 2 | IMPLEMENTATION CALIBRATION | Half track height. |
| `perChannel.progressBottomInset` | 16 | IMPLEMENTATION CALIBRATION | Current-row bottom → progress bottom. |
| `perChannel.separatorLeftInset` | 20 | CANONICAL CALIBRATION | Separator starts at primary content inset. |

There is intentionally **no** `minuteHeight`, pt/minute scale, duration frame height, compact-duration threshold or normalized-height token in Per zender.

Key X geometry:

- screen/content left = **20**;
- start-time text left = **24**;
- programme title/description/progress left = **100**;
- programme content right inset = **24**;
- progress width = `screenWidth - 100 - 24`.

## 5. Typography

### 5.1 Typeface and production-safe fallback

Preferred family: **Söhne**, subject to valid production licensing and mobile delivery.

Until that is available, leave React Native `fontFamily` unset so the platform system UI font is used:

- iOS: system San Francisco family;
- Android: system Roboto family.

Do not bundle unlicensed Söhne files or hard-code private platform font names.

### 5.2 Type tokens

| Text role | Size / line height | Weight | Colour | Dynamic Type |
| --- | --- | ---: | --- | --- |
| Presentation tab — inactive | 16 / 22 | 400 | `textSecondary` | compact chrome; max multiplier 1.20 |
| Presentation tab — selected | 16 / 22 | 600 | `text` | compact chrome; max multiplier 1.20 |
| Channel-strip fallback | 12 / 14 | 700 | selected `text`, unselected `textSecondary` | compact; max 1.20 |
| Selected-channel heading | 24 / 30 | 700 | `text` | substantive; uncapped |
| Selected date | 15 / 20 | 600 | `text` | compact chrome; max 1.20 |
| Primetime | 14 / 18 | 600 | `textSecondary` | compact chrome; max 1.20 |
| Nu | 14 / 18 | 600 | `text` | compact chrome; max 1.20 |
| Condensed channel prefix | 14 / 18 | 700 | `text` | compact chrome; max 1.20 |
| Programme start time | **16 / 20** | **400** | `textSecondary` | substantive; uncapped; tabular numerals |
| Standard programme title | **18 / 22** | **500** | `text` | substantive; uncapped |
| Current programme title | **20 / 24** | **700** | `text` | substantive; uncapped |
| Current description | **15 / 18** | **400** | `textSecondary` | substantive; uncapped; max 3 lines |

The previous `16/20` standard programme-title specification is superseded. Physical iPhone evidence showed it was materially too small relative to the accepted visual hierarchy. **18/22 weight 500 is canonical for standard programme titles.**

Letter spacing = **0** for programme/time/body text. Programme times use `tabular-nums`.

Do not use light-mode `textMuted` for substantive programme times; use `textSecondary`.

## 6. Colour and semantic tokens

No new brand palette is introduced.

| Semantic use | Light | Dark | Repository token |
| --- | --- | --- | --- |
| Guide canvas / sticky background | `#F7F7F5` | `#10100F` | `background` |
| Raised/base surface | `#FFFFFF` | `#191918` | `surface` |
| Selected/utility surface | `#FFFFFF` | `#222220` | `surfaceElevated` |
| Primary text | `#171717` | `#F4F4F1` | `text` |
| Secondary/substantive grey | `#565656` | `#C2C2BD` | `textSecondary` |
| Muted/decorative grey | `#7A7A78` | `#8E8E88` | `textMuted` |
| Separator / progress track | `#E4E4E0` | `#30302D` | `border` |
| Neutral interactive accent | `#202020` | `#F4F4F1` | `accent` |
| Selected/current/progress red | `#D64B42` | `#F06B61` | `currentTime` |

Programme rows remain on the Guide canvas. Do not use `programme` / `programmeCurrent` as permanent Per-zender row fills.

## 7. Shared Guide presentation navigation

At rest:

1. platform top safe area;
2. 8-pt brand top inset;
3. accepted `tv.` mark in a 56 × 44 aspect-fit box at X=20;
4. presentation navigation, 48 high;
5. channel strip.

Presentation navigation:

- three equal-width press zones within 20-pt screen insets;
- inactive label `16/22 400 textSecondary`;
- selected label `16/22 600 text`;
- selected underline base `88 × 2.5`, radius 1.25, `currentTime`;
- no filled/outlined segmented container;
- at least 44 pt iOS / 48 dp Android touch height;
- semantic selected tab state.

## 8. Channel-logo strip

### Geometry

- strip height **72**;
- horizontal content inset **20**;
- item **48 × 48**;
- item gap **12**;
- logo max **40 × 32**;
- logo resize mode `contain`;
- no caption beneath a successful logo.

Selected item:

- 48 × 48 wrapper;
- radius 12;
- `surfaceElevated`;
- one hairline `border`;
- full logo opacity;
- semantic selected state.

Unselected item:

- transparent background;
- no underline;
- full channel-mark opacity.

Pressed: temporary opacity 0.64.

Strip remains horizontally free-scrollable. Selecting/swiping channels must keep the selected item fully visible and centre it where practical. No previous/next arrow buttons.

### Missing-logo fallback

When `logoUrl` is missing/fails:

- keep the exact same 48 × 48 item box;
- fallback content box 40 × 32;
- `channel.shortName ?? channel.displayName`;
- one line, `12/14 700`;
- selected `text`, unselected `textSecondary`;
- tail ellipsis;
- no second caption.

Accessibility always exposes the full `channel.displayName`.

## 9. Selected channel, date and utilities

### Rest selected channel

- 24 pt below channel strip;
- left/right inset 20;
- `24/30 700 text`;
- max two lines;
- no permanent swipe-help text;
- no decorative channel arrows.

### Utility row

- 8 pt below heading;
- horizontal inset 20;
- min height 52;
- date control left, Primetime + Nu right;
- min control gap 8;
- schedule begins 12 pt below the utility row.

### Day selector

- no visible pill/background in rest state;
- `15/20 600 text`;
- vector/simple chevron box 14 × 18, gap 6;
- whole press target min 44/48;
- copy follows bounded D-2..D+7 television-day semantics;
- 00:00–05:59 must not falsely call the preceding television day `Vandaag`.

### Primetime

Semantics remain FROZEN: jump to **20:30 Europe/Amsterdam on the selected television day**, without changing that day.

- visible height 36;
- touch wrapper min 44/48;
- horizontal padding 14;
- radius 18;
- `surfaceElevated` + hairline `border`;
- moon icon 14 × 14;
- icon/text gap 7;
- `14/18 600 textSecondary`;
- no shadow/elevation.

### Nu

Semantics remain FROZEN: restore actual current instant and its containing television day.

- visible height 36;
- min visible width 48;
- touch wrapper min 44/48;
- horizontal padding 12;
- radius 18;
- transparent/background fill + hairline `border`;
- `14/18 600 text`.

## 10. Programme schedule model — fixed rows

Per zender renders programmes in **chronological start-time order**. It does not render a spatial wall-clock axis.

For a selected channel/day:

1. order programmes by real `startAt`;
2. identify the programme current at the actual current instant using `startAt <= now < endAt`;
3. render every non-current programme with `standardRowHeight`;
4. render the current programme with `currentRowHeight`;
5. show truthful programme start time in the time gutter;
6. use real start/end timestamps for current progress and navigation semantics;
7. never derive row Y or row height from duration.

A 10-minute programme and a 120-minute programme therefore occupy the same standard row when neither is current.

A real schedule gap does **not** become proportional blank vertical space. Do not create filler rows or fake programme content; the next real programme simply follows as the next fixed row with its truthful start time.

This correction intentionally removes the previous duration-driven geometry even if current implementation helpers still expose `scheduleYForTime` / `programmeVerticalFrame`. Those helpers are not the target for Per-zender list layout after this revision.

## 11. Standard programme row

### 11.1 Base geometry

At default text size:

- row height = **52** exactly;
- time text X = **24**;
- programme title X = **100**;
- programme right inset = **24**;
- separator at row bottom;
- no card/background/radius;
- no genre, thumbnail, duration or end-time metadata.

### 11.2 Vertical alignment

Time and title are vertically centred independently inside the 52-pt row:

- time line box: 20 high → top = **16**;
- title line box: 22 high → top = **15**.

Do not top-align standard rows. The accepted list rhythm depends on centred programme rows.

### 11.3 Content

Time:

- programme `startAt` only;
- `16/20 400 textSecondary`;
- tabular numerals;
- one line.

Title:

- `18/22 500 text`;
- one line at normal text sizes;
- tail ellipsis when it does not fit horizontally;
- full untruncated title remains available to accessibility APIs.

Historical and future normal programmes use the same visual treatment. Programme duration does not alter typography or row density.

## 12. Current programme row

The programme airing at the actual current instant receives exactly one taller row in the chronological list.

### 12.1 Base geometry

At default text size:

- row height = **120** exactly;
- time X = 24;
- content/progress X = 100;
- right inset = 24;
- current title/content top inset = **14**;
- bottom separator at row bottom.

Time and current title both begin at the current content top region; no separate `Nu bezig` text is required visually.

### 12.2 Current title

- `20/24 700 text`;
- one line at normal text sizes;
- tail ellipsis when needed;
- full title in accessibility label.

### 12.3 Description

If a programme description exists, show it. If `description` is absent but a useful `subtitle` exists, `subtitle` may be used as fallback.

- margin top from title line box = **2**;
- `15/18 400 textSecondary`;
- maximum **3 lines**;
- `numberOfLines={3}` / equivalent;
- tail ellipsis on overflow;
- never hide it because the programme itself is short — duration has no layout role.

If neither description nor usable subtitle exists, leave the area open; do not fabricate metadata.

### 12.4 Mandatory local progress bar

The current row **always** shows a local red progress bar.

Geometry:

- left = **100**;
- right = **24**;
- width = `screenWidth - 124`;
- height = **4**;
- radius = **2**;
- bottom inset = **16**;
- track colour = `border`;
- fill colour = `currentTime`.

Progress calculation:

`progress = clamp((nowMs - startMs) / (endMs - startMs), 0, 1)`

The fill width equals `progress × trackWidth`.

This is the only visual live/current progress treatment. Do **not** additionally render:

- a current card fill;
- a red left rail;
- a schedule-wide current-time line;
- a now-dot;
- a visible `Nu bezig` badge;
- a second progress indicator.

The title weight + taller current row + local progress bar form one coherent current treatment.

## 13. Separators

Every visible programme row has one row-bottom separator:

- position = `bottom: 0` of the standard/current row;
- left = **20**;
- right = **0**;
- thickness = `StyleSheet.hairlineWidth`;
- colour = `border`.

Do not render an independent hourly grid. Do not add a second separator because two programmes are adjacent.

The separator location follows fixed row boundaries, not programme start/end duration.

## 14. Dynamic Type — fixed-row rules

Dynamic Type remains required for substantive schedule content. The fixed-row correction changes **how** Per zender adapts: every row of a given type grows consistently with text size rather than using duration geometry.

Let:

`contentScale = max(1, systemFontScale)`

### 14.1 Standard rows

`standardRowHeight(fontScale) = round(52 × contentScale)`

Rules:

- all non-current programme rows use exactly this same computed height;
- time/title font sizes and line heights follow platform Dynamic Type normally; no `maximumFontSizeMultiplier`;
- time remains one line and vertically centred;
- for `fontScale <= 1.35`, title remains max 1 line;
- for `fontScale > 1.35`, title may use max 2 lines;
- a two-line title block is vertically centred inside the same equal row height;
- do not vary an individual row height because its title is longer or its programme duration differs.

Representative heights:

| Font scale | Standard row |
| ---: | ---: |
| 1.00 | 52 |
| 1.10 | 57 |
| 1.35 | 70 |
| 1.50 | 78 |
| 2.00 | 104 |

### 14.2 Current row

`currentRowHeight(fontScale) = round(120 × contentScale)`

Rules:

- current title and description scale normally; no multiplier cap;
- description remains max 3 lines and tail-ellipsized;
- current title remains max 1 line through `fontScale <= 1.35`; above 1.35 it may use max 2 lines;
- progress track stays **4 pt high** and full specified width; it does not scale into a heavy bar;
- progress bottom inset remains **16 pt**;
- current top inset remains **14 pt**;
- description gap remains **2 pt**;
- description is not removed because of programme duration;
- if accessibility text becomes extremely large, text is constrained only by its defined line count/ellipsis, not by duration-based thresholds.

Representative heights:

| Font scale | Current row |
| ---: | ---: |
| 1.00 | 120 |
| 1.10 | 132 |
| 1.35 | 162 |
| 1.50 | 180 |
| 2.00 | 240 |

### 14.3 Compact chrome remains separately capped

`maximumFontSizeMultiplier = 1.20` remains allowed only for compact Guide chrome:

- presentation tabs;
- channel-strip text fallback;
- day-selector label;
- Primetime/Nu labels;
- condensed channel/date row.

Selected-channel heading, programme times, programme titles and current description remain uncapped.

If date + Primetime + Nu no longer fit:

- row 1 = day selector;
- row 2 = Primetime + Nu;
- condensed context min height becomes 88;
- do not abbreviate `Primetime` or hide `Nu`.

## 15. Sticky / condensed state

Settled condensed stack:

1. platform safe area;
2. channel strip — 72 high;
3. compact channel/date/Primetime/Nu context — 52 high base, 88 minimum when wrapped;
4. fixed-row schedule list.

Absent when settled condensed:

- brand mark/header chrome;
- large presentation-navigation row;
- large selected-channel heading.

Compact context left group:

- channel prefix `14/18 700`;
- ` · `;
- selected date `14/18 600`;
- disclosure chevron.

Trailing group:

- Primetime + Nu, same visible 36-pt treatment;
- min gap 8.

Surface:

- `background`;
- no card/shadow/elevation;
- bottom hairline `border`.

### Collapse motion

Normal motion:

`progress = clamp(scrollY / 56, 0, 1)`

- disappearing brand/presentation/large-channel context opacity = `1 - progress`;
- translate disappearing content upward by max 12 pt × progress;
- no spring;
- no scroll-direction toolbar hide/reveal behaviour.

Reduce Motion:

- discrete rest/condensed switch at 28 pt scroll offset;
- no fade/translation interpolation.

Because Per zender is now fixed-row based, header condensation must preserve the visible programme-row/list anchor; it must not infer a wall-clock instant from pixel distance.

## 16. Time-anchor semantics after the fixed-row correction

Existing product behaviour still requires preserving the viewed time anchor where practical when changing channel/day.

That requirement remains, but implementation must no longer calculate it as `scrollY / ptPerMinute`.

The semantic anchor is derived from the real timestamps of the programme at/nearest the stable viewport anchor. When switching channel/day, resolve that timestamp against the target schedule and restore the corresponding/nearest programme context. Exact implementation remains a Development concern; the visual requirement is that fixed row heights are never distorted to preserve an old pixel-to-time mapping.

`Primetime` and `Nu` likewise target real timestamps first, then scroll the fixed-row list to the programme containing/nearest that instant.

## 17. Light / Dark / System

Layout metrics, fixed row heights, type hierarchy and touch geometry are identical across themes.

Light:

- canvas `#F7F7F5`;
- selected/utility surface `#FFFFFF`;
- primary `#171717`;
- no grey programme cards.

Dark:

- canvas `#10100F`;
- selected/utility surface `#222220`;
- primary `#F4F4F1`;
- same open fixed-row list;
- channel marks keep brand colours.

System follows OS appearance through existing semantic theme resolution. No alternate layout branch.

## 18. Accessibility

### Touch targets

- channel item: min 44 pt iOS / 48 dp Android; visible box is 48;
- day selector: min 44/48;
- Primetime/Nu: visible 36, touch wrapper min 44/48;
- presentation tabs: min 44/48;
- **standard programme row base height 52 already satisfies the minimum row target**;
- current row base height 120.

Unlike the superseded duration-geometric interpretation, Per zender no longer needs overlapping/non-overlapping touch-target exceptions for short programmes. Every standard programme row is a full fixed-row press target.

### Semantics

Channel:

- button;
- full channel name;
- explicit selected state.

Programme:

- button;
- full channel, title, start and end time;
- append `nu bezig` when current;
- hint may state that it opens Programme Detail.

Day selector:

- full selected date;
- `Kies een dag` action;
- selected sheet option has explicit selected state and checkmark.

Primetime:

- label equivalent to `Ga naar primetime, 20:30 op geselecteerde dag`.

Nu:

- label `Ga naar nu`.

Contrast:

- normal/substantive text >= 4.5:1 target;
- essential UI/large text >= 3:1 where applicable;
- state is never colour-only;
- programme times use `textSecondary`, not light `textMuted`.

## 19. Physical runtime comparison after correction

The owner-supplied first implementation demonstrates why the duration interpretation is invalid.

| Part | Accepted target | First physical implementation | Required correction |
| --- | --- | --- | --- |
| Standard rows | Every non-current programme exactly 52 pt at base text size | Row Y/spacing follows programme duration, producing visibly irregular density and large gaps | Replace duration frames with equal fixed rows. |
| Current row | One 120-pt row with title, description when available and local progress | Current programme is effectively another duration-driven row; canonical expanded current treatment is missing/incomplete | Render explicit 120-pt current row. |
| Programme title | 18/22 weight 500 | Previous spec's 16/20 reads materially too small on physical iPhone | Increase to 18/22 weight 500. |
| Current title | 20/24 weight 700 | Current title emphasis exists but without full canonical row treatment | Use 20/24 in the 120-pt row. |
| Time | 16/20 weight 400 | Broadly close but participates in duration-spaced layout | Keep type; vertically centre per fixed standard row. |
| Current description | 15/18, max 3, ellipsis | Not consistently present as canonical current detail | Show whenever description/fallback subtitle exists. |
| Progress | Mandatory local 4-pt bar, X=100 → right24, bottom16 | Missing from the physically shown current programme state | Always render for actual current programme. |
| Separators | One hairline at every fixed row bottom, left20→right edge | Separators inherit duration-driven frame positions | Position by fixed row boundaries. |
| Sticky list | Same fixed-row list beneath compact sticky context | Sticky screenshot exposes especially large duration-derived blank gaps | Fixed rows continue unchanged in sticky state. |
| Vertical time model | Chronological list; timestamps truthful; duration not spatial | pt/minute/time-axis model | Remove pt/minute mapping from Per-zender layout. |

The supplied physical runtime may differ from `main`; Development implements the canonical target in this document, not either incidental implementation state.

## 20. Explicitly superseded rules from the previous revision

The following rules are **deleted and must not survive implementation**:

- `perChannel.minuteHeightBase = 1.30 pt/min`;
- any formula mapping elapsed minutes to Y position;
- `programmeHeight = durationMinutes × minuteHeight`;
- `normalizedHeight`;
- 20 / 32 / 56 / 92 duration-height content thresholds;
- compact title mode chosen because a programme duration creates a short frame;
- hiding programme time/title because the programme is too short;
- hiding current progress because the programme is too short;
- hiding current description because the programme is too short;
- duration-proportional schedule gaps;
- Dynamic Type rules that increase a minute-to-height scale;
- accessibility exceptions caused by programme frames shorter than the minimum touch target;
- Development instructions to preserve the existing duration-geometric Per-channel schedule rendering.

Any code/helper that implements those concepts may remain elsewhere for another presentation only if genuinely needed there, but it is not part of the Per-zender visual target.

## 21. Current implementation calibration register

Values still classified as implementation calibration rather than a new product decision:

1. Guide screen inset 20 and brand box 56×44.
2. Presentation row 48 and selected indicator 88×2.5.
3. Channel strip: 72 high; 20 inset; 48 item; 12 gap; 40×32 logo max.
4. Context spacing: 24 strip→heading, 8 heading→utilities, 52 utility-row min, 12 utility→schedule.
5. Utility treatment: 36 high, radius18, gap8, icon14.
6. Schedule columns: time X24, programme X100, right24.
7. **Standard row 52 and current row 120**, calibrated directly from the accepted visual composition and now owner-confirmed as fixed-row semantics.
8. Standard title `18/22 500`, current title `20/24 700`, time `16/20 400`, description `15/18 400`.
9. Current content top14, description gap2, progress 4 high / bottom16.
10. Separator left20, bottom of row.
11. Sticky context 52/88 and collapse distance56.
12. Press opacity0.64 and disabled opacity0.40.

Development does not choose alternate values locally. Physical retuning requires evidence and a documentation update first.

## 22. Missing asset/licensing inputs

### Söhne

Production font licensing/delivery remains unresolved. Use system-font fallback while preserving the numeric hierarchy above. Do not commit font binaries without licence approval.

### Channel logos

Fixtures may not have licensed production logos. Use the exact 48×48 fallback geometry; do not revert to large text tabs.

### Brand mark

Reuse an approved distributable `tv.` asset if present when Development starts; otherwise final pixel acceptance requires the approved asset. The 56×44 layout box is already fixed.

No third-party icon dependency is required solely for the moon or chevron.

## 23. Development handoff

When Lead schedules Per-zender convergence, Development must treat this revision as a correction to the prior handoff.

Required implementation intent:

1. Keep shared Guide chrome/channel/date/Primetime/Nu decisions unchanged.
2. Replace Per-zender duration-driven vertical frames with a chronological fixed-row list.
3. Define **52 pt standard row** and **120 pt current row** at fontScale1 as tokens.
4. Render every non-current programme with the same row height regardless of 5/30/60/120-minute duration.
5. Render the actual current programme with the dedicated current row.
6. Use standard title **18/22 weight500**, current title **20/24 weight700**, time **16/20 weight400**, description **15/18 weight400**.
7. Current description: max 3 lines, tail ellipsis, shown whenever data exists; no duration-based suppression.
8. Current progress: mandatory 4-pt local bar, X100 to right24, bottom16; fill from real start/end/now.
9. Separator: hairline at bottom of each fixed row, left20 to right edge.
10. Remove Per-zender pt/minute, `normalizedHeight`, duration-frame and short-programme visibility logic from rendering.
11. Rework time-anchor restoration so timestamps remain semantic anchors without relying on pixel-to-minute geometry.
12. Preserve adjacent-channel swipe, direct strip selection, D-2..D+7, 06:00 television day, Primetime/Nu semantics and Programme Detail context.
13. Validate rest and sticky states on physical iPhone against the exact canonical visual.
14. Validate light/dark/system plus fontScale around 1.0, 1.1, 1.35 and a representative accessibility size.
15. Run normal automated/physical gates when implementation occurs.

This documentation change performs **no Development implementation**.

## 24. Frozen decisions explicitly preserved

This correction does not reopen:

- horizontal adjacent-channel swipe;
- chronological vertical programme browsing;
- channel-strip direct selection;
- preserving viewed time context where practical;
- television day = 06:00 Europe/Amsterdam → 06:00 next day;
- D-2..D+7 horizon;
- `Primetime` = 20:30 on selected television day;
- `Nu` = actual current instant + containing television day;
- direct Programme Detail/context round-trip;
- provider-independent data architecture;
- fixture-first/hosted-data boundary;
- primary bottom navigation;
- light/dark/system;
- no programme thumbnails;
- no genre labels;
- no decorative channel arrows;
- no expanded historical time picker.

The only corrected interpretation is the Per-zender schedule's vertical layout model plus the resulting programme typography calibration.

## 25. Visual acceptance checklist

Per-zender visual convergence is ready only when all are true on the exact implementation head:

- presentation navigation matches shared Guide chrome;
- channel navigation reads as a logo strip/final fallback geometry;
- rest and sticky channel/date/utility hierarchy matches the canonical visual;
- every non-current programme row is exactly the same computed height for the active Dynamic Type scale;
- at default scale every non-current row is **52 pt**;
- programme duration has zero effect on standard row height or Y spacing;
- actual current programme alone is **120 pt** at default scale;
- current row always contains the mandatory local progress bar;
- current description appears when data exists, max 3 lines with tail ellipsis;
- standard programme title is **18/22 weight500**;
- current title is **20/24 weight700**;
- time is **16/20 weight400**, tabular;
- standard row time/title are vertically centred;
- progress geometry is X100 → right24, height4, bottom16;
- every row separator is a bottom hairline from X20 to the right edge;
- no pt/minute, `normalizedHeight`, duration frame or duration-based content suppression remains in Per-zender rendering;
- no schedule-wide now line, current card fill, red left rail, now-dot or hourly grid dominance is used;
- sticky mode retains the same fixed-row schedule model;
- Dynamic Type grows both row types consistently without making individual programme durations affect height;
- light/dark/system use semantic tokens;
- channel/day/time/navigation semantics remain unchanged;
- final physical comparison is made against the exact canonical asset, not the superseded first implementation.
