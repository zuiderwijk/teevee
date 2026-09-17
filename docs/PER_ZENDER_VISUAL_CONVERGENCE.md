# Teevee — Per zender production design specification

Status: **CANONICAL PRODUCTION IMPLEMENTATION SPEC — accepted design, no redesign**  
Date: 2026-09-17

This document is the implementation-level visual specification for the accepted **Per zender** Guide presentation. It converts the already approved visual/UX baseline into concrete production metrics. It does not create a new design.

For Per-zender visual implementation details that are not already more specifically frozen by higher-priority product/UX/ADR documents, this file is the single canonical developer handoff. Do not maintain a second copy of these measurements elsewhere.

## 1. Authority and inspected baseline

This specification was calibrated against `main` at commit `5b659c213b697573fc9e41139e7f331214b41661` and the following canonical sources:

- `AGENTS.md`;
- `docs/PROJECT_STATE.md`;
- `docs/PRODUCT.md`;
- `docs/UX.md`;
- `docs/VISUAL_BASELINE.md`;
- `docs/DESIGN_SYSTEM.md`;
- `design/current/guide/PER_ZENDER.md`;
- `design/current/guide/GUIDE_DAY_SELECTOR.md`;
- ADR 0005, ADR 0007 and ADR 0008;
- current `PerChannelGuideView`, `GuideDaySelector`, `GuidePresentationSelector`, `ChannelIdentity`, Per-channel geometry and theme-token implementation.

Exact canonical pixels remain:

- Per zender light + dark: `/Teevee/TV-gids app in licht en donker thema.png`, Library file id `file_000000008b2481f4ad34bb1547fc813e`;
- Guide day-selector states: `/Teevee/Teevee Guide day selector - states and bottom sheet.png`, Library file id `file_00000000390c8210b76256621721592b`;
- sticky/condensed behaviour: `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`, Library file id `file_00000000314481f69f6a34d18ece1c21`.

The physical iPhone screenshot supplied for this specification is **current-state evidence only**. It does not supersede the canonical visual.

### Source precedence

1. Product behaviour, television-day semantics and gestures: `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md`, accepted ADRs.
2. Accepted visual composition: `VISUAL_BASELINE.md` + `design/current/guide/PER_ZENDER.md` + exact canonical assets above.
3. Exact Per-zender implementation metrics where the accepted sources were previously non-specific: **this document**.
4. Reusable visual-system principles: `DESIGN_SYSTEM.md`.
5. Current runtime/code: evidence of implementation state, never authority for an intentional visual difference.

The historical date/time-picker shown on the original Per-zender board is superseded. The accepted model is one bounded D-2..D+7 day selector plus separate `Primetime` and `Nu`; the old `Vanmiddag` / `Vooravond` / `Kies tijd…` picker must not return.

## 2. Metric status and units

All dimensions below are React Native logical **pt/dp** unless stated otherwise. A `hairline` means `StyleSheet.hairlineWidth`, not a fixed physical pixel.

Values have one of three origins:

- **FROZEN** — already explicitly defined by product/UX/ADR or existing canonical system behaviour.
- **CANONICAL** — directly expresses an approved visible relationship from the canonical Per-zender visual.
- **IMPLEMENTATION CALIBRATION** — an exact production value was not previously specified in a vector design system. The value below is chosen to reproduce the accepted composition consistently on real devices without changing the product decision. Calibration values are implementation constraints, not new product choices.

Do not replace a calibration value with an ad-hoc local number during implementation. If physical-device evidence proves a calibration materially wrong, update this specification first and record the evidence.

## 3. Visual breakdown by component zone

| Zone | Function | Visual hierarchy and layout relation | Relevant component/state |
| --- | --- | --- | --- |
| 1. Shared Guide chrome / presentation navigation | Identifies Teevee and switches Guide presentation | Brand context first; `Totaal / Per zender / Nu & Straks` directly below. `Per zender` is selected with a restrained red underline, never a filled segmented pill. | Shared Guide shell + `GuidePresentationSelector`; rest state only for non-functional brand chrome. |
| 2. Channel-logo strip | Primary channel navigation | Directly below presentation navigation; horizontally browsable; logos dominate; selected item is a quiet surface/border treatment. | Per-channel channel strip; persistent in rest and condensed states. |
| 3. Selected-channel heading/context | Confirms the channel whose schedule is shown | Large `NPO 1`-style heading below the strip at rest. It is secondary to the logo strip as navigation and disappears in condensed state. | Selected channel rest heading. |
| 4. Day selector | Selects one D-2..D+7 television day | Primarily typographic, left side of the utility row; no large pill. | Shared `GuideDaySelector`. |
| 5. Primetime | Jump to 20:30 on the selected television day | Compact secondary utility, visually stronger than a text link but not a hero control. | Per-zender utility action. |
| 6. Nu | Restore actual current instant and its television day | Compact sibling to Primetime, visually distinct and always available. | Per-zender utility action. |
| 7. Schedule container | Time-geometric vertical programme surface | Open canvas below the context row; no cards or hour-grid dominance. | Outer vertical schedule + horizontal adjacent-channel pager. |
| 8. Time gutter | Gives programme start-time orientation | Left aligned, quiet, tabular numerals; substantive enough to pass text contrast. | Programme-aligned start-time labels. |
| 9. Programme content column | Carries title and conditional current detail | Starts at one stable X coordinate across all rows. | Programme content. |
| 10. Normal programme row | Shows one scheduled programme | Time + title only by default; open surface; real duration determines height. | Normal programme state. |
| 11. Current programme | Communicates the programme airing at the real current instant | Title emphasis + one local progress treatment; optional description only when geometry permits. No filled card, red side bar, global now line or extra `Nu bezig` label. | Current programme state. |
| 12. Separators/reference cues | Supports scanning without becoming a grid | One restrained programme-end hairline where useful. No full-width hourly grid as primary structure. | Programme boundary; schedule-start boundary. |
| 13. Sticky/condensed state | Keeps functional context while returning vertical space | Channel strip stays sticky; immediately below it one compact channel/date/Primetime/Nu row. Brand/presentation chrome and the large channel heading are absent after collapse. | Scroll-driven condensed Guide chrome. |
| 14. Bottom-navigation boundary | Separates Guide from primary navigation | Existing stable app-shell tab bar remains outside Per-zender schedule; one quiet top boundary only. | Existing Expo/router tab bar; unchanged IA. |

## 4. Production metric tokens

Implementation must define these values once as named Guide/Per-zender metrics. Do not scatter literal copies through components.

### 4.1 Shared Guide chrome metrics

| Token | Value | Status | Rule |
| --- | ---: | --- | --- |
| `guide.screenInsetX` | 20 | IMPLEMENTATION CALIBRATION | Primary horizontal content inset in Guide chrome. |
| `guide.brandTopInset` | 8 | IMPLEMENTATION CALIBRATION | Applied after the platform top safe-area inset. |
| `guide.brandMarkBoxWidth` | 56 | IMPLEMENTATION CALIBRATION | Aspect-fit box for the accepted `tv.` mark; never stretch the mark. |
| `guide.brandMarkBoxHeight` | 44 | IMPLEMENTATION CALIBRATION | As above. |
| `guide.presentationNavHeight` | 48 | IMPLEMENTATION CALIBRATION | Visible/touch row below brand context. |
| `guide.presentationIndicatorWidth` | 88 | IMPLEMENTATION CALIBRATION | Base selected underline width; responsive rule below. |
| `guide.presentationIndicatorHeight` | 2.5 | IMPLEMENTATION CALIBRATION | Red selected indicator. |
| `guide.presentationIndicatorRadius` | 1.25 | IMPLEMENTATION CALIBRATION | Half-height. |
| `guide.controlPressOpacity` | 0.64 | IMPLEMENTATION CALIBRATION | Temporary press feedback for text-led chrome. |
| `guide.disabledOpacity` | 0.40 | IMPLEMENTATION CALIBRATION | Disabled/busy visual state where required. |

Presentation tabs divide the available width equally. The selected indicator is centered beneath its tab and uses `min(88, tabWidth - 16)` so compact screens do not clip it. Do not replace this treatment with a filled pill.

The Per-zender surface adds no Per-zender-specific search/overflow icons to the brand row. Any separately accepted shared shell action may occupy the trailing brand slot, but current runtime chrome is not authority to add new header actions.

### 4.2 Per-zender structural metrics

| Token | Value | Status | Rule |
| --- | ---: | --- | --- |
| `perChannel.channelStripInsetX` | 20 | IMPLEMENTATION CALIBRATION | First/last channel-item edge inset. |
| `perChannel.channelItemSize` | 48 | IMPLEMENTATION CALIBRATION | Visible selection box and minimum iOS touch box. Android touch wrapper expands to at least 48 dp. |
| `perChannel.channelItemGap` | 12 | IMPLEMENTATION CALIBRATION | Gap between 48-pt item boxes. |
| `perChannel.logoMaxWidth` | 40 | IMPLEMENTATION CALIBRATION | Aspect-fit; never upscale/distort beyond box. |
| `perChannel.logoMaxHeight` | 32 | IMPLEMENTATION CALIBRATION | Aspect-fit. |
| `perChannel.channelStripHeight` | 72 | IMPLEMENTATION CALIBRATION | Rest and condensed state. |
| `perChannel.stripToHeadingGap` | 24 | IMPLEMENTATION CALIBRATION | Bottom of strip to heading top. |
| `perChannel.headingToUtilitiesGap` | 8 | IMPLEMENTATION CALIBRATION | Heading block to rest utility row. |
| `perChannel.utilityRowMinHeight` | 52 | IMPLEMENTATION CALIBRATION | Base one-row context. |
| `perChannel.utilityVisibleHeight` | 36 | IMPLEMENTATION CALIBRATION | Visible Primetime/Nu treatment inside larger touch wrapper. |
| `perChannel.utilityGap` | 8 | IMPLEMENTATION CALIBRATION | Primetime ↔ Nu; date ↔ trailing utilities uses available flex space, never less than 8. |
| `perChannel.utilityToScheduleGap` | 12 | IMPLEMENTATION CALIBRATION | Bottom of utility row to schedule boundary. |
| `perChannel.timeGutterWidth` | 64 | IMPLEMENTATION CALIBRATION | Starts at `guide.screenInsetX`. |
| `perChannel.timeTextInsetX` | 4 | IMPLEMENTATION CALIBRATION | Time text X = 20 + 4 = 24. |
| `perChannel.timeToProgrammeGap` | 16 | IMPLEMENTATION CALIBRATION | Gap after 64-pt gutter. |
| `perChannel.programmeColumnX` | 100 | DERIVED | `20 + 64 + 16`; one stable title/progress X. |
| `perChannel.programmeRightInset` | 24 | IMPLEMENTATION CALIBRATION | Programme text/progress right edge. |
| `perChannel.minuteHeightBase` | 1.30 pt/min | IMPLEMENTATION CALIBRATION | Real wall-clock vertical scale at fontScale 1.0. |
| `perChannel.programmeContentInsetY` | 8 | IMPLEMENTATION CALIBRATION | Standard programme content top inset. |
| `perChannel.programmeCompactInsetY` | 4 | IMPLEMENTATION CALIBRATION | For compact 20–31-pt normalized frames. |
| `perChannel.progressHeight` | 4 | IMPLEMENTATION CALIBRATION | Current-programme local progress track. |
| `perChannel.progressRadius` | 2 | IMPLEMENTATION CALIBRATION | Half-height. |
| `perChannel.currentProgressMinNormalizedHeight` | 56 | IMPLEMENTATION CALIBRATION | Below this, omit progress. |
| `perChannel.currentDescriptionMinNormalizedHeight` | 92 | IMPLEMENTATION CALIBRATION | Below this, omit description/subtitle. |
| `perChannel.normalTitleMinNormalizedHeight` | 20 | IMPLEMENTATION CALIBRATION | Below this, omit visible programme title rather than falsifying height. |
| `perChannel.normalFullTitleMinNormalizedHeight` | 32 | IMPLEMENTATION CALIBRATION | 20–31 uses compact title typography. |
| `perChannel.stickyContextHeight` | 52 | IMPLEMENTATION CALIBRATION | Base condensed row beneath sticky channel strip. |
| `perChannel.stickyContextWrappedHeight` | 88 | IMPLEMENTATION CALIBRATION | Two-row compact context when width/text size requires wrap. |
| `perChannel.collapseDistance` | 56 | IMPLEMENTATION CALIBRATION | Scroll distance over which non-functional rest chrome condenses. |

The key schedule X geometry is therefore:

- screen/content left: **20**;
- start-time text left: **24**;
- time gutter: **64**;
- time/title whitespace: **16**;
- programme title/progress start: **100**;
- programme title/progress right inset: **24**.

These values intentionally move programme titles materially farther right than the supplied current physical runtime, where title content begins too close to the time gutter.

## 5. Typography

### 5.1 Typeface and fallback

Preferred family: **Söhne**, subject to a valid production licence and agreed mobile delivery. Until that is available, use the platform system UI font by leaving React Native `fontFamily` unset:

- iOS: system San Francisco family selected by iOS;
- Android: system Roboto family selected by Android.

Do not hard-code private platform font names and do not bundle unlicensed Söhne files.

Numeric `fontWeight` below is the semantic target. If licensed Söhne uses named face files, map those files to the same weight hierarchy; do not change hierarchy to fit available font files.

### 5.2 Type tokens

| Text role | Size / line height | Weight | Colour | Dynamic Type |
| --- | --- | ---: | --- | --- |
| Presentation tab — inactive | 16 / 22 | 400 | `textSecondary` | compact chrome; max multiplier 1.20 |
| Presentation tab — selected | 16 / 22 | 600 | `text` | compact chrome; max multiplier 1.20 |
| Channel-strip text fallback | 12 / 14 | 700 | selected: `text`; unselected: `textSecondary` | compact; max multiplier 1.20 |
| Selected-channel heading | 24 / 30 | 700 | `text` | substantive/contextual; no multiplier cap; may wrap to 2 lines |
| Selected date | 15 / 20 | 600 | `text` | compact chrome; max multiplier 1.20 |
| Date disclosure | 14 / 18 equivalent icon box | 600-equivalent stroke | `textSecondary` | icon does not independently scale beyond control layout |
| Primetime | 14 / 18 | 600 | `textSecondary` | compact chrome; max multiplier 1.20 |
| Nu | 14 / 18 | 600 | `text` | compact chrome; max multiplier 1.20 |
| Condensed channel prefix | 14 / 18 | 700 | `text` | compact chrome; max multiplier 1.20 |
| Condensed date | 14 / 18 | 600 | `text` | compact chrome; max multiplier 1.20 |
| Programme start time | 15 / 20 | 400 | `textSecondary` | substantive; no cap; `tabular-nums` |
| Normal programme title | 16 / 20 | 500 | `text` | substantive; no cap |
| Compact programme title | 14 / 17 | 500 | `text` | substantive; no cap; only when normalized frame is 20–31 |
| Current programme title | 16 / 20 | 700 | `text` | substantive; no cap |
| Current description/subtitle | 14 / 19 | 400 | `textSecondary` | substantive but conditional; no cap; max 3 visible lines when geometry permits |

Letter spacing is **0** for normal body/chrome text. Do not reproduce generated-image kerning by adding arbitrary tracking. Tabular numerals are required for programme times.

`textMuted` is deliberately **not** used for 15-pt schedule start times in light mode: the current light `textMuted` token has insufficient contrast for normal-size body text against `background`. Use `textSecondary` for substantive schedule times.

## 6. Colour and semantic tokens

No new brand palette is introduced by this specification. Per zender uses the existing repository theme tokens as the production colour source.

| Semantic use | Light | Dark | Repository token |
| --- | --- | --- | --- |
| Guide canvas / sticky background | `#F7F7F5` | `#10100F` | `background` |
| Raised sheet/base surface | `#FFFFFF` | `#191918` | `surface` |
| Subtle selected/utility surface | `#FFFFFF` | `#222220` | `surfaceElevated` |
| Primary text | `#171717` | `#F4F4F1` | `text` |
| Secondary/substantive grey text | `#565656` | `#C2C2BD` | `textSecondary` |
| Muted/decorative text | `#7A7A78` | `#8E8E88` | `textMuted` |
| Separator / subtle border / progress track | `#E4E4E0` | `#30302D` | `border` |
| General neutral interactive accent | `#202020` | `#F4F4F1` | `accent` |
| Selected/current/progress red | `#D64B42` | `#F06B61` | `currentTime` |

Rules:

- Per-zender schedule rows use `background`; do not use `programme` / `programmeCurrent` as permanent row fills.
- Selected channel item and Primetime may use `surfaceElevated` plus the subtle `border` token.
- `Nu` uses a transparent/background-coloured visible surface plus `border`.
- Presentation underline and current progress fill use `currentTime`.
- `currentTime` is not used for normal-size body copy in light mode; it is a graphic accent. Selected day copy in the bottom sheet remains primary text, with a non-colour selected state and accent checkmark.
- Press feedback uses opacity `0.64`; do not create another permanent pressed colour token for this surface.
- Disabled/busy uses opacity `0.40` plus semantic disabled state; never indicate disabled state with colour alone.
- Do not suppress native accessibility focus. Where a custom visible focus ring is required, use a 2-pt `currentTime` ring outside the visible control with 2-pt clearance.

System mode resolves to the same light/dark token sets according to the operating-system appearance; layout metrics never change because of theme.

## 7. Shared Guide chrome / presentation navigation

At rest:

1. platform top safe area;
2. `guide.brandTopInset = 8`;
3. accepted `tv.` brand mark in a `56 × 44` aspect-fit box at X = 20;
4. presentation navigation, height 48;
5. channel strip.

Presentation navigation:

- three equal-width press zones within 20-pt left/right screen insets;
- label centered in each zone;
- inactive `16/22 400 textSecondary`;
- selected `16/22 600 text`;
- selected indicator centered at bottom: base `88 × 2.5`, radius `1.25`, colour `currentTime`;
- no filled/outlined segmented container;
- entire tab remains at least 44 pt high on iOS and 48 dp high on Android;
- selected state is also exposed semantically (`tab`, `selected=true`), not only through the red underline.

The presentation selector is shared Guide chrome. Development must reuse one component rather than create a Per-zender-only copy. This spec does not alter deferred loading or presentation-switch state semantics.

## 8. Channel-logo strip

The channel strip is the primary channel-navigation affordance.

### 8.1 Geometry

- strip height: **72**;
- horizontal content inset: **20**;
- each item: **48 × 48** visible/touch box;
- gap between item boxes: **12**;
- logo artwork max box: **40 × 32**;
- logos use `contain` / aspect-fit;
- never crop, recolour, stretch or force equal aspect ratios;
- no permanent caption beneath a successful logo.

Six 48-pt items plus five 12-pt gaps occupy 348 pt, intentionally allowing six common channels to read as a coherent set on a 390-pt screen while preserving 20-pt edge insets. Larger channel sets scroll horizontally.

### 8.2 Selected, unselected and pressed state

Selected:

- 48 × 48 wrapper;
- radius **12**;
- `surfaceElevated` background;
- one `hairline` `border` outline;
- full logo opacity;
- `accessibilityState.selected = true`.

Unselected:

- transparent background;
- no decorative underline;
- full logo opacity; do **not** dim licensed channel marks as a state mechanism.

Pressed:

- temporary wrapper opacity `0.64`;
- no scale animation required.

### 8.3 Scrolling

- horizontal free scrolling with platform-standard bounce/inertia where supported;
- no snap-to-item requirement;
- selected item must be fully visible after a channel change and should be centred when enough scroll range exists;
- tapping an item selects directly;
- strip horizontal scrolling remains independent from horizontal schedule paging;
- no previous/next arrow buttons.

### 8.4 Missing-logo placeholder

Production logos are not guaranteed in deterministic fixtures today. Missing assets must not force the old large text-tab layout.

When `logoUrl` is missing or fails:

- keep the **same 48 × 48 item box** and selected-state wrapper;
- use a centered `40 × 32` fallback content box;
- visible fallback = `channel.shortName ?? channel.displayName`, one line, `12/14 700`;
- selected fallback colour = `text`; unselected = `textSecondary`;
- ellipsize at the end if the short name still exceeds the box;
- do not add a second caption beneath the fallback.

This makes fixture/device validation representative of the final channel-strip geometry before production logo rights/assets are available.

Accessibility label is always the complete `channel.displayName`, independent of visible logo/fallback.

## 9. Selected channel, day selector and utilities

### 9.1 Rest-state selected channel

- heading starts **24 pt below** the channel strip;
- left/right content inset = 20;
- `24/30 700 text`;
- no subtitle such as “Veeg horizontaal…”;
- no decorative channel arrows;
- one line when it fits; may wrap to a maximum of two lines rather than shrink below the specified size.

### 9.2 Rest utility row

- begins **8 pt below** the heading block;
- horizontal inset = 20;
- minimum row height = **52**;
- base layout: date control on the left; Primetime + Nu grouped on the right;
- minimum visual gap between controls = **8**;
- schedule begins **12 pt below** the utility row.

If measured content does not fit in one row, use the Dynamic Type/wrapping rules in section 14; never reduce substantive labels below the specified compact-chrome scaling cap.

### 9.3 Day selector

Visible treatment:

- no pill/background in rest state;
- `15/20 600 text`;
- chevron-down visual box **14 × 18**, gap **6** after the date label;
- use a real/simple vector chevron or equivalent platform-safe drawing, not a font glyph whose baseline varies by device;
- full press target min 44 pt iOS / 48 dp Android;
- press opacity 0.64.

Copy follows `GUIDE_DAY_SELECTOR.md` exactly, e.g. `Vandaag · do 17 sep`, `Morgen · vr 18 sep`, or `Za 19 sep`; 00:00–05:59 never falsely labels the preceding television day as `Vandaag`.

Bottom sheet remains exactly the bounded ten-day D-2..D+7 selector. For its selected option:

- selected row uses `surfaceElevated`;
- label remains primary `text`, semibold;
- accent checkmark uses `currentTime`;
- accessibility selected state is explicit;
- do not rely on red body text alone.

### 9.4 Primetime

Semantics are FROZEN: jump to **20:30 Europe/Amsterdam on the currently selected television day**; do not change selected day.

Visible control:

- visible height **36**;
- touch wrapper min 44 pt iOS / 48 dp Android;
- horizontal padding **14**;
- radius **18**;
- `surfaceElevated` background;
- `hairline` `border` outline;
- moon icon **14 × 14**;
- icon/text gap **7**;
- label `14/18 600 textSecondary`;
- no heavy shadow/elevation.

A tiny local/vector moon icon is sufficient; do not introduce a third-party icon dependency solely for this control.

### 9.5 Nu

Semantics are FROZEN: restore the actual current instant **and** the television day containing it.

Visible control:

- visible height **36**;
- minimum visible width **48**;
- touch wrapper min 44 pt iOS / 48 dp Android;
- horizontal padding **12**;
- radius **18**;
- transparent/background-coloured fill;
- `hairline` `border` outline;
- label `14/18 600 text`;
- no icon required.

Primetime and Nu must remain visibly separate actions; neither is nested inside the day selector.

## 10. Open vertical programme schedule

The schedule is a continuous time surface. It is **not** an equal-height list.

### 10.1 Wall-clock geometry

At fontScale 1.0:

`Y = elapsedMinutesFromTelevisionDayStart × 1.30`

and:

`programmeHeight = visibleProgrammeDurationMinutes × 1.30`.

The programme frame is clipped only to the selected television-day window where required by the existing runtime. Start/end timestamps remain real UTC instants; timezone grouping remains Europe/Amsterdam per ADR 0008.

No artificial minimum row height may alter programme start/end geometry.

### 10.2 Horizontal geometry

- row interaction/visual canvas can span the full screen;
- time gutter starts at X = 20 and is width 64;
- start-time text X = **24**;
- programme-content X = **100**;
- programme-content right edge = `screenWidth - 24`;
- time → programme blank gap = 16.

### 10.3 Programme boundary

- use one `hairline` separator at a programme end where it improves scanning;
- separator colour = `border`;
- separator left = **20**;
- separator right = **0** (screen edge);
- do not add a second separator because another programme begins at the same timestamp;
- remove the heavy schedule-wide hourly grid from the normal visual hierarchy.

A schedule-start boundary may use the same hairline. Hour/reference lines are not rendered as a second structural grid.

## 11. Normal programme treatment

For every non-current programme:

- left: programme start time only;
- right: programme title;
- no thumbnail;
- no genre;
- no end-time duplicate;
- no permanent fill/card/radius;
- no past/future colour distinction.

### 11.1 Vertical content rules

Use `normalizedHeight = frameHeight / max(1, fontScale)` to choose content density. The time geometry itself scales with fontScale as specified in section 14.

- normalized height **>= 32**: normal title, `16/20 500`, top inset 8;
- normalized height **20–31**: compact title, `14/17 500`, inset 4, one line;
- normalized height **< 20**: do not force visible title/time into an impossible frame; preserve the exact time block and full accessibility label.

For normal title wrapping:

- one line is the default baseline;
- allow a second line only when measured text needs it **and** normalized frame height is at least 48;
- otherwise tail-ellipsize;
- never reduce below compact 14-pt title solely to fit a real short programme.

Start-time label follows the same visibility principle: if the frame cannot contain its scaled line height without overlap, omit the visible time for that frame. Full start/end times remain in accessibility semantics.

## 12. Current programme treatment

The accepted Per-zender design allows one restrained, **row-local** current treatment. It must not become a collection of live indicators.

For the programme for which `startAt <= now < endAt`:

1. keep its start time in the normal time gutter;
2. title uses `16/20 700 text` (or the compact equivalent when geometry forces compact title);
3. optional detail uses the first non-empty `description ?? subtitle`;
4. local progress track is allowed when geometry permits;
5. semantic accessibility label appends `nu bezig`.

Do **not** additionally render:

- a filled current-programme card;
- a red left border;
- a full-width/schedule-wide current-time line;
- a current-time dot;
- a visible `Nu bezig` badge or duplicate “tot …” row when the local progress treatment is present.

### 12.1 Current detail thresholds

Using `normalizedHeight`:

- **< 20**: no forced visible text; semantics only;
- **20–31**: compact current title only;
- **32–55**: current title only;
- **56–91**: current title + progress; no description;
- **>= 92**: current title + conditional description/subtitle + progress.

For `>= 92`:

- title begins at the standard 8-pt inset;
- description gap after title = **3**;
- description max = **3 lines**;
- progress is anchored **10 pt above the programme frame bottom**;
- minimum clear gap between the last rendered text line and progress = **6**;
- if text measurement would violate that gap, reduce description by one line at a time, then omit it; never compress the title.

For `56–91`:

- progress is anchored 10 pt above frame bottom;
- title remains top aligned;
- no description.

Progress geometry:

- X = 100;
- right inset = 24;
- height = 4;
- radius = 2;
- track = `border`;
- fill = `currentTime`;
- fill width = clamped programme progress `0…1` × track width.

The title-weight change plus local progress constitutes one coherent current-state treatment. Do not add another colour block or timeline marker.

## 13. Long programmes, short programmes, missing metadata and gaps

### Very short programmes

Real duration always wins. Never inflate a 5/10/15-minute item to a fake minimum visual row. Density degrades in this order:

1. description absent;
2. progress absent if current and below threshold;
3. title becomes compact;
4. visible start time/title may disappear if the exact frame cannot contain them safely;
5. accessibility still exposes channel, full title, start/end and current status.

### Long titles

- use normal title size, not a smaller ad-hoc font;
- two lines are permitted only when real geometry provides the room;
- otherwise tail-ellipsize;
- VoiceOver/TalkBack receives the untruncated full title.

### Long programmes

Extra duration creates real whitespace. Do not vertically centre the title through a multi-hour frame. Content remains top aligned so chronological scanning remains predictable.

### Missing description

Do not fabricate metadata or leave a placeholder line. Current progress keeps its defined bottom anchor; the space between title and progress simply remains open.

### Schedule gaps

A real schedule gap remains a blank time-geometric canvas for exactly that duration. Do not collapse it and do not pretend the preceding programme remains current. This specification adds no new “Geen programma” copy.

## 14. Vertical density and Dynamic Type

The accepted visual is more spacious than the supplied current physical runtime while retaining real time geometry. Base vertical scale is therefore **1.30 pt/minute** at fontScale 1.0.

Programme-content font scaling and schedule geometry remain coupled:

`minuteHeight(fontScale) = 1.30 × max(1, fontScale)`.

Do not cap this geometry to preserve screenshot density. This ensures a 60-minute programme grows from 78 pt at 100% to 105.3 pt at 135% while retaining the same wall-clock proportion.

Representative behaviour:

| Text setting | Effective minute scale | Chrome behaviour | Programme behaviour |
| --- | ---: | --- | --- |
| 100% (`fontScale ≈ 1.00`) | 1.30 | One-row context on normal phone widths | Base typography/density. |
| ~110% (`≈ 1.10`) | 1.43 | One row when measured content fits | Substantive programme text scales normally. |
| ~135% (`≈ 1.35`) | 1.755 | Rest/condensed utility context may use two rows; do not shrink below chrome cap | Programme title/time/description scale without max multiplier. |
| Accessibility size (`> 1.45`) | `1.30 × actual fontScale` | Use wrapped/taller context; sticky row min 88 when wrapped | Preserve time geometry; drop optional description before title; allow title wrap when real frame permits. |

### Compact chrome scaling caps

`maxFontSizeMultiplier = 1.20` is permitted only for:

- presentation-tab labels;
- channel-strip text fallback;
- day-selector visible label;
- Primetime / Nu labels;
- condensed channel/date row.

These controls compensate by growing/wrapping containers where needed. The cap must not be applied globally.

### Substantive content

No `maximumFontSizeMultiplier` cap for:

- selected-channel rest heading;
- programme start times;
- normal/current programme titles;
- current description/subtitle.

### Utility wrapping

If date + Primetime + Nu cannot fit with 20-pt screen insets and minimum 8-pt gaps:

- row 1: full-width day selector;
- row 2: Primetime + Nu aligned to the trailing edge;
- rest context height grows intrinsically;
- condensed context uses `stickyContextWrappedHeight = 88` as its minimum;
- do not truncate `Primetime` to an abbreviation and do not hide `Nu`.

## 15. Sticky / condensed state

The sticky state preserves only functional context.

### 15.1 Final condensed stack

From the top:

1. platform safe-area inset;
2. channel strip — **72** high;
3. compact channel/date/Primetime/Nu context — **52** high at base size, **88** minimum when wrapped;
4. schedule viewport.

Absent in settled condensed state:

- brand mark/header chrome;
- large presentation-navigation row;
- large selected-channel heading.

Do not show the large `NPO 1` heading and the compact `NPO 1 · date` row simultaneously after collapse.

### 15.2 Compact context composition

Left group:

- channel prefix `14/18 700`;
- separator copy ` · `;
- selected date `14/18 600`;
- disclosure chevron.

Trailing group:

- Primetime and Nu retain the same **36-pt visible** treatments and 44/48 minimum touch targets;
- minimum gap 8.

If width does not permit one row, use the two-row 88-pt minimum pattern from section 14.

### 15.3 Surface and boundary

- background = `background`;
- no floating card;
- no shadow;
- Android elevation = 0;
- bottom border = one `hairline` `border`;
- sticky container z-index/elevation ordering must place it above scrolling schedule content without introducing a visible shadow.

### 15.4 Collapse motion

The canonical requirement is scroll-coupled condensation, not a toolbar spring.

Normal motion:

- `progress = clamp(scrollY / 56, 0, 1)`;
- non-functional brand/presentation/large-channel context opacity = `1 - progress`;
- translate those disappearing blocks upward by at most **12 pt × progress**;
- channel strip and functional compact context settle into the sticky stack as the vacated height collapses;
- use direct scroll interpolation; **no spring and no scroll-direction hide/reveal behaviour**.

Any implementation that changes header height during this transition must compensate the schedule viewport/content inset so the viewed wall-clock anchor does not jump.

Reduce Motion:

- no interpolated fade/translation;
- switch from rest to condensed state discretely at **28 pt** vertical schedule offset;
- switch back when scrolling above that same threshold;
- preserve the same final rest/condensed geometry.

## 16. Light, dark and system

All layout metrics, typography hierarchy, touch geometry and schedule density are identical across themes.

Light:

- canvas `#F7F7F5`;
- selected/utility surface `#FFFFFF`;
- dark primary copy `#171717`;
- no grey programme cards.

Dark:

- canvas `#10100F`;
- selected/utility surface `#222220`;
- primary copy `#F4F4F1`;
- same open schedule and separator hierarchy;
- channel logos keep their own brand colours.

System:

- follows OS appearance through the existing appearance provider;
- no layout branch and no alternate component hierarchy.

Do not tune spacing separately for dark mode.

## 17. Accessibility specification

### Touch targets

- channel item: minimum 44 pt iOS / 48 dp Android; specified visible box is 48;
- day selector: minimum 44/48;
- Primetime: visible 36, invisible/touch wrapper minimum 44/48;
- Nu: visible 36, invisible/touch wrapper minimum 44/48;
- presentation tabs: minimum 44/48 in height.

Programme frames are an explicit time-geometry exception: short real programmes can be physically shorter than 44/48. Do **not** distort time geometry to meet a generic row-height rule. The programme press target may expand vertically only into non-overlapping free space, bounded by the midpoint to adjacent programme targets. Never create overlapping tap targets. Screen readers must still enumerate every programme as a distinct accessible button.

### Semantics

Channel:

- label = full `channel.displayName`;
- role = button;
- selected state explicit.

Programme:

- role = button;
- label contains full channel name, full programme title, start and end time;
- append `nu bezig` when current;
- hint may state that it opens Programme Detail.

Day selector:

- label exposes the complete selected date and `Kies een dag` action;
- busy/unavailable states remain semantic;
- selected day in sheet has explicit selected state and checkmark.

Primetime:

- accessibility label equivalent to `Ga naar primetime, 20:30 op geselecteerde dag`.

Nu:

- accessibility label `Ga naar nu`.

### Colour and contrast

- normal/substantive text targets at least **4.5:1** against its active background;
- large text and essential graphical/UI boundaries target at least **3:1** where WCAG size rules apply;
- current/selected state cannot be colour-only;
- use `textSecondary`, not light-mode `textMuted`, for programme times and inactive presentation labels because they are substantive normal-size text;
- `currentTime` is a graphical accent in light mode, not a small body-copy colour.

## 18. Bottom-navigation boundary

Per zender does not redesign the primary tab bar.

Preserve the existing app-shell boundary:

- tab bar is outside the schedule scroll container;
- current shell height remains **66** plus the platform's bottom safe-area handling as implemented by the router/platform;
- top padding 7, bottom padding 7 in the existing shell;
- surface = `surface`;
- top border = `hairline border`;
- Per-zender content must not be obscured by the tab bar and must not introduce a floating control over the schedule/tab boundary.

Runtime-only debug/development overlays are not part of visual acceptance evidence.

## 19. Current runtime ↔ accepted design comparison

The supplied physical iPhone capture is useful evidence, but the exact target is defined above.

| Part | Accepted production target | Supplied physical runtime | Required implementation change |
| --- | --- | --- | --- |
| Canvas colour | `background`: light `#F7F7F5` | Capture already uses the current light background token | **No palette change** for the canvas. |
| Outer margins | 20-pt Guide content inset | Roughly 18 pt in several visible blocks | Standardise to 20 via one Guide metric. |
| Presentation selector | Upper typographic 3-tab row; 16/22; selected 88×2.5 underline | Structurally already moved to top in the supplied capture, but spacing/typography/indicator are still implementation-defined | Apply exact shared-chrome metrics; no filled/floating selector. |
| Channel strip | 48-pt logo items, 12 gap, 20 inset, 72 high | Large text tabs (`NPO 1`, `NPO 2`…) with a prominent selected block | Replace text-tab presentation with final logo-box geometry; use specified fallback inside the same box until logos exist. |
| Logo sizing | max 40×32 aspect-fit | No representative logo boxes in capture | Add logo/fallback variant; preserve mark proportions. |
| Selected channel treatment | Quiet 48×48 surface/border in strip; no underline | Large selected text block | Use subtle selected wrapper only. |
| Selected-channel heading | 24/30 700, 20-pt inset, 24 below strip | Heading is present but composition is compressed relative to canonical strip/heading hierarchy | Apply exact strip→heading spacing and type token. |
| Day selector | 15/20 600 typographic control; no visible pill | Current date copy is heavier/larger and its spacing is tied to current utility layout | Apply exact type, chevron and touch-area spec. |
| Primetime | 36-high subtle surface, radius18, moon 14, 14/18 label | Large outlined pill is visually more dominant | Reduce visible treatment; use subtle surface/border and exact icon/text geometry. |
| Nu | 36-high, min 48 wide, quiet outline | Large sibling pill | Use compact visible size while preserving 44/48 touch target. |
| Time gutter | left 20, width64; time text X=24 | Time and title columns sit materially closer together; measured title X is about 63 pt on the 390-pt capture | Move programme column to X=100 and preserve 16-pt gap after gutter. |
| Programme-title X | 100 | ≈63 in supplied capture | Shift to canonical two-column geometry. |
| Programme typography | normal 16/20 500; current 16/20 700 | Normal titles appear comparatively dominant and spatially close to times | Apply weight hierarchy and content-column geometry. |
| Current programme | Local title emphasis + optional description + one progress bar when space permits | Captured current row does not show the canonical local description/progress hierarchy. Current `main` still contains additional fill/left-border/global-now-line code. | Converge to the single treatment in section 12; remove both missing and duplicate-signal cases. |
| Vertical density | real-time geometry at 1.30 pt/min base | Physical capture is visibly denser; sampled start-time spacing is about 0.95 pt/min | Increase base minute scale while keeping exact wall-clock proportionality. |
| Separators | one quiet programme-end hairline; no hour grid | Multiple/higher-salience schedule reference lines remain visible | Keep programme-end hairline only; remove hourly grid dominance. |
| Overall hierarchy | logo strip → selected channel → date/utilities → calm schedule | channel text tabs and utility chrome compete strongly with the schedule | Re-establish canonical hierarchy through the exact metrics above. |
| Bottom-navigation boundary | stable existing shell, quiet hairline | Broadly aligned; capture also contains a non-product floating blue development/accessibility overlay | Preserve shell; exclude runtime-only overlays from acceptance captures. |

Note: the supplied physical runtime can be ahead of or different from `main`. Development must implement the **target**, not reconcile appearance by blindly copying either source. Frozen interaction/data mechanics in `main` remain protected.

## 20. Implementation calibration register

The following exact values were not previously available as vector design tokens and are therefore explicitly **IMPLEMENTATION CALIBRATION**, not new product/UX decisions:

1. Guide screen inset 20 and brand box 56×44.
2. Presentation row 48 and selected indicator base 88×2.5.
3. Channel strip: 72 high; 20 inset; 48 item; 12 gap; 40×32 logo max; radius12 selected wrapper.
4. Rest-context spacing: 24 strip→heading, 8 heading→utility, 52 utility-row minimum, 12 utility→schedule.
5. Utility visible height/radius: 36/18; utility gap8; icon14; Primetime padding14; Nu min width48/padding12.
6. Schedule columns: 64 time gutter, time X24, 16 gap, programme X100, right inset24.
7. Base vertical scale: **1.30 pt/minute**.
8. Content thresholds: normalized 20 / 32 / 56 / 92 pt and 8/4 vertical content insets.
9. Current progress: 4 high, radius2, bottom inset10, minimum 6 text clearance.
10. Sticky context 52 (88 wrapped), collapse distance56, Reduce Motion switch threshold28.
11. Exact typography sizes/line-heights in section 5 where previous repository documents specified hierarchy but not numeric values.
12. Press opacity0.64 and disabled opacity0.40.

These values are now the production handoff. Development does not choose alternatives locally. A future retune requires physical evidence and a documentation update before code drift.

## 21. Missing assets / licensing inputs

### Söhne

Production font licensing/delivery is still unresolved in `PROJECT_STATE.md` / `DESIGN_SYSTEM.md`. This does **not** block visual convergence: use the system-font fallback while keeping the exact numeric hierarchy in this spec. Do not commit font binaries without licence approval.

### Channel logos

Deterministic fixtures currently do not guarantee licensed `logoUrl` values. Production logo rights/assets remain an input. This does **not** justify large text tabs: use the exact fallback geometry from section 8.4 so physical visual validation remains representative.

### Brand mark

The canonical `tv.` visual exists in accepted visual references, but the repository does not currently establish a canonical distributable brand binary/vector in this Per-zender handoff. Reuse an already approved implementation asset if one exists when Development starts; otherwise an approved brand asset is required for final pixel acceptance. The 56×44 layout box is already specified.

No new third-party icon dependency is required for chevron or moon glyphs.

## 22. Development handoff

When Lead schedules Per-zender visual convergence, Development should implement this as visual convergence over the existing interaction architecture, not as a rewrite.

Required sequence:

1. Re-read `PROJECT_STATE.md`, this file and the exact canonical assets immediately before implementation.
2. Reuse the shared upper Guide presentation selector produced by the Totaal/shared-chrome work if it has landed; do not fork another selector.
3. Centralise the named metrics from section 4; do not scatter magic numbers.
4. Give `ChannelIdentity` or its caller an explicit Per-zender logo-only/fallback variant; do not globally remove identity behaviour used by other Guide presentations.
5. Preserve the existing outer vertical time scroll + three-page adjacent-channel pager + channel-strip direct-selection architecture.
6. Preserve D-2..D+7, 06:00 television-day, Primetime and Nu semantics exactly.
7. Change Per-zender schedule rendering to the X/Y geometry, typography, separator and current-programme rules in this document.
8. Remove duplicate current-state signals and hour-grid dominance; do not introduce programme cards.
9. Implement the scroll-coupled rest→condensed states without changing the viewed wall-clock anchor.
10. Validate light, dark and system appearance; fontScale ~1.0, ~1.1, ~1.35 and a representative accessibility size.
11. Verify horizontal channel swipe, strip browse/tap, direction lock, day changes, Primetime, Nu and Programme Detail round-trip after the visual changes.
12. Run applicable TypeScript/lint/tests/export/native checks and perform focused physical iPhone visual/interaction acceptance. Android physical interaction acceptance remains a separate open gate when hardware is available.

This specification does **not** change `PROJECT_STATE.md` sequencing. At the time of writing, Lead still owns the repository's single exact next step and shared Guide/Totaal convergence may land before Per-zender implementation.

## 23. Non-goals / frozen decisions explicitly preserved

This specification does not reopen or change:

- horizontal adjacent-channel swipe;
- vertical wall-clock schedule navigation;
- channel-strip direct selection;
- preservation of viewed time when changing channel/day where practical;
- television day = 06:00 Europe/Amsterdam → 06:00 next day;
- D-2..D+7 horizon;
- `Primetime` = 20:30 on selected television day;
- `Nu` = actual current instant + containing television day;
- Programme Detail direct navigation/context round-trip;
- provider-independent data architecture;
- fixture-first/hosted-data runtime boundary;
- primary bottom navigation;
- light/dark/system requirement;
- no programme thumbnails;
- no genre labels;
- no decorative channel arrows;
- no expanded historical time picker;
- no equal-height programme list.

## 24. Visual acceptance checklist

Per-zender visual convergence is visually ready only when all of the following are true on the exact implementation head:

- top presentation navigation is typographic and matches the specified shared Guide chrome;
- channel navigation reads as a logo strip, including fixture fallback geometry;
- selected channel is clear without a large text-tab block or decorative underline;
- rest-state selected channel + date/Primetime/Nu hierarchy matches the canonical composition;
- sticky state contains channel strip + one compact channel/date/Primetime/Nu row and no duplicate large heading;
- programme title starts at X=100 on a 390-pt class screen using the same tokenised geometry on other widths;
- vertical scale is 1.30 pt/min at fontScale1 and remains proportional at larger font scales;
- programme boundaries follow real time; gaps remain gaps;
- normal rows remain open and typographic;
- current row has at most the single local progress/current treatment defined here;
- no schedule-wide now line, current card fill, red left rail or hourly grid dominance remains;
- light/dark/system use the exact semantic token mapping;
- substantive time/title text is not forced to `textMuted` in light mode;
- representative Dynamic Type settings remain usable;
- all utility controls meet touch/semantic requirements;
- interactions and Programme Detail context remain unchanged;
- final iPhone comparison is made against the exact canonical file id, not against the current physical screenshot.
