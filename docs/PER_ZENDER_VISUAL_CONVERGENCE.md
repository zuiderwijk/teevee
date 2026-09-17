# Teevee — Per zender production design specification

Status: **CANONICAL PRODUCTION IMPLEMENTATION SPEC — accepted design, no redesign**  
Date: 2026-09-17  
Revision: **owner-approved Per-zender refinement — temporal states, typography, condensed rail and press feedback**

This document is the production implementation specification for the accepted **Per zender** Guide presentation. It converts the owner-approved visual/UX baseline into concrete metrics and state rules. It is accepted-design convergence, not exploration or Development implementation.

For Per-zender visual implementation details that are not more specifically frozen by higher-priority product/UX/ADR contracts, this file is the single canonical developer handoff. Do not maintain a second copy of these surface-specific numeric metrics elsewhere.

## 1. Authority and inspected baseline

This specification is reconciled against:

- `AGENTS.md`;
- `docs/PROJECT_STATE.md`;
- `docs/PRODUCT.md`;
- `docs/UX.md`;
- `docs/VISUAL_BASELINE.md`;
- `docs/DESIGN_SYSTEM.md`;
- `docs/ENGINEERING_QUALITY_POLICY.md`;
- `design/current/TYPOGRAPHY.md`;
- `design/current/guide/PER_ZENDER.md`;
- `design/current/guide/GUIDE_DAY_SELECTOR.md`;
- ADR 0005 and ADR 0008, plus the existing provider/data contracts where relevant;
- PR #83 — `Design: accept Per-zender refinement`;
- the exact canonical Per-zender visual assets selected by the repository;
- physical iPhone evidence used only to calibrate implementation fidelity.

PR #83 on branch `design/per-zender-refinement-2026-09-17` contains the owner-approved refinement of 17 September 2026. Until the Lead merges it, this branch is the accepted-design increment being specified here; it must not be replaced by a competing design-spec branch.

Exact canonical pixels remain:

- Per zender light + dark: `/Teevee/TV-gids app in licht en donker thema.png`, Library file id `file_000000008b2481f4ad34bb1547fc813e`;
- Guide day-selector states: `/Teevee/Teevee Guide day selector - states and bottom sheet.png`, Library file id `file_00000000390c8210b76256621721592b`;
- sticky/condensed behaviour: `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`, Library file id `file_00000000314481f69f6a34d18ece1c21`.

The 2026-09-17 written refinement supersedes those historical pixels only for the explicitly changed details in this document: temporal utility states, programme-title calibration, settled condensed channel-strip height, channel-rail positioning behaviour and programme-row pressed feedback. All other accepted composition remains intact.

### Source precedence

1. explicit current owner corrections;
2. owner-approved refinement recorded in PR #83;
3. `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md` and accepted ADRs for product/interaction contracts;
4. `VISUAL_BASELINE.md` + `design/current/` for accepted visual composition and typography family;
5. this document for exact Per-zender production metrics and state treatment;
6. current runtime only as implementation evidence.

Do not use old exploration, superseded mock-ups, brainstorms or runtime behaviour to override this hierarchy.

## 2. Frozen Per-zender schedule model

Per zender is a **chronological fixed-row programme list**, not a duration-proportional vertical time axis.

Canonical rules:

- every non-current programme uses the same standard row height at the same Dynamic Type scale;
- the actual current programme uses one separate higher row;
- programme duration never determines Y position or row height;
- no pt/minute mapping;
- no `normalizedHeight`;
- no duration-dependent programme heights or blank gaps;
- real `startAt` / `endAt` timestamps remain the source of truth for ordering, visible time labels, current-state calculation, progress, `Nu`, `Primetime`, day/channel anchor preservation and Programme Detail semantics.

A 10-minute and a 120-minute non-current programme therefore occupy the same standard row. A real schedule gap does not create duration-proportional vertical whitespace; the next real programme follows as the next fixed row with its truthful start time.

The phrase `vertical wall-clock schedule` in older broad project documentation must be read for Per zender as chronological schedule browsing with truthful wall-clock timestamps, not as a spatial minute-to-pixel layout.

## 3. Visual component zones

| Zone | Function | Production hierarchy / relationship |
| --- | --- | --- |
| Shared Guide chrome | Brand + Guide presentation switching | Rest-state context only; presentation selector remains typographic and restrained. |
| Channel-logo strip | Primary channel navigation | Logo-led horizontal rail; 72 pt at rest, 60 pt settled condensed; 48×48 items unchanged. |
| Selected-channel heading | Context at top of schedule | Large contextual channel name at rest; absent in settled condensed state. |
| Day selector | D-2..D+7 navigation | Primarily typographic text + disclosure; never a permanent pill. |
| Primetime | Jump to 20:30 on selected TV day | Light secondary action when inactive; semantic active/current treatment at Primetime context. |
| Nu | Return to actual current instant/day | Strongest return action when away; semantic active/current treatment when actually at Now. |
| Schedule container | One-channel chronological list | Fixed programme rows; open canvas; no cards or duration geometry. |
| Time gutter | Start-time orientation | Stable left column; tabular numerals. |
| Programme column | Title/current detail | Stable X across all row types. |
| Standard row | Non-current programme | Fixed 52 pt base row; vertically centred time + title. |
| Current row | Actual current programme | Fixed 120 pt base row; title + description/subtitle when available + mandatory local progress. |
| Row separator | Scanning cue | One quiet row-bottom hairline. |
| Pressed row | Interaction feedback | Temporary full-row semantic `surface` fill only while pressed. |
| Sticky/condensed state | Functional context while scrolling | 60-pt channel strip + 52-pt compact context, 88 pt when wrapped. |
| Bottom navigation | Primary app navigation boundary | Existing stable shell; outside Per-zender list. |

## 4. Production metric tokens

All dimensions are React Native logical pt/dp unless stated otherwise. `hairline` means `StyleSheet.hairlineWidth`.

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
| `guide.controlPressOpacity` | 0.72 | IMPLEMENTATION CALIBRATION |
| `guide.disabledOpacity` | 0.40 | IMPLEMENTATION CALIBRATION |

Presentation tabs divide available width equally. Selected indicator width is `min(88, tabWidth - 16)` and remains centred.

### 4.2 Channel strip and context

| Token | Value | Status | Rule |
| --- | ---: | --- | --- |
| `perChannel.channelStripInsetX` | 20 | IMPLEMENTATION CALIBRATION | Rail edge inset. |
| `perChannel.channelItemSize` | 48 | ACCEPTED | Visible/touch item remains fixed in rest and condensed state. |
| `perChannel.channelItemGap` | 12 | IMPLEMENTATION CALIBRATION | Item-to-item gap. |
| `perChannel.logoMaxWidth` | 40 | ACCEPTED CALIBRATION | Aspect-fit. |
| `perChannel.logoMaxHeight` | 32 | ACCEPTED CALIBRATION | Aspect-fit. |
| `perChannel.channelStripRestHeight` | **72** | ACCEPTED | Full rest rail. |
| `perChannel.channelStripCondensedHeight` | **60** | ACCEPTED | Settled sticky rail. |
| `perChannel.channelContinuationCueTarget` | **12** | IMPLEMENTATION CALIBRATION | Preferred visible trailing sliver where practical; never overrides correct selection visibility/centering. |
| `perChannel.stripToHeadingGap` | 24 | IMPLEMENTATION CALIBRATION | Rest state only. |
| `perChannel.headingToUtilitiesGap` | 8 | IMPLEMENTATION CALIBRATION | Rest heading → context. |
| `perChannel.utilityRowMinHeight` | 52 | IMPLEMENTATION CALIBRATION | Rest context base. |
| `perChannel.utilityVisibleHeight` | 36 | IMPLEMENTATION CALIBRATION | Temporal-control visual frame; touch target remains 44/48. |
| `perChannel.utilityGap` | 8 | IMPLEMENTATION CALIBRATION | Minimum control gap. |
| `perChannel.utilityToScheduleGap` | 12 | IMPLEMENTATION CALIBRATION | Rest context → schedule. |
| `perChannel.stickyContextHeight` | **52** | ACCEPTED CALIBRATION | Base compact sticky context. |
| `perChannel.stickyContextWrappedHeight` | **88** | ACCEPTED CALIBRATION | Minimum when Dynamic Type forces two rows. |
| `perChannel.collapseDistance` | 56 | IMPLEMENTATION CALIBRATION | Rest → condensed interpolation distance. |

Base settled condensed functional chrome = **60 + 52 = 112 pt**, excluding platform safe area. With wrapped compact context it becomes 148 pt.

### 4.3 Temporal-state metrics

| Token | Value | Status |
| --- | ---: | --- |
| `perChannel.temporalControlVisibleHeight` | 36 | IMPLEMENTATION CALIBRATION |
| `perChannel.temporalCurrentUnderlineWidth` | 24 | IMPLEMENTATION CALIBRATION |
| `perChannel.temporalCurrentUnderlineHeight` | 2 | IMPLEMENTATION CALIBRATION |
| `perChannel.temporalCurrentUnderlineRadius` | 1 | IMPLEMENTATION CALIBRATION |
| `perChannel.temporalCurrentUnderlineBottomInset` | 2 | IMPLEMENTATION CALIBRATION |
| `perChannel.temporalFocusRingWidth` | 2 | IMPLEMENTATION CALIBRATION |
| `perChannel.primetimeIconSize` | 14 | IMPLEMENTATION CALIBRATION |
| `perChannel.primetimeIconTextGap` | 7 | IMPLEMENTATION CALIBRATION |
| `perChannel.primetimeActionPaddingX` | 10 | IMPLEMENTATION CALIBRATION |
| `perChannel.nuActionPaddingX` | 12 | IMPLEMENTATION CALIBRATION |
| `perChannel.nuActionMinVisibleWidth` | 48 | IMPLEMENTATION CALIBRATION |

The short underline is a geometric current-state cue. Accessibility state remains mandatory so state is never colour-only.

### 4.4 Programme-list metrics

| Token | Value | Status | Rule |
| --- | ---: | --- | --- |
| `perChannel.standardRowHeight` | **52** | ACCEPTED | All non-current programmes at fontScale 1.0. |
| `perChannel.currentRowHeight` | **120** | ACCEPTED | Actual current programme at fontScale 1.0. |
| `perChannel.timeGutterWidth` | 64 | IMPLEMENTATION CALIBRATION | Stable time column. |
| `perChannel.timeTextX` | **24** | ACCEPTED CALIBRATION | Start-time X. |
| `perChannel.programmeColumnX` | **100** | ACCEPTED CALIBRATION | Title/description/progress X. |
| `perChannel.programmeRightInset` | **24** | ACCEPTED CALIBRATION | Content right inset. |
| `perChannel.currentContentTopInset` | **14** | ACCEPTED CALIBRATION | Current time/title top. |
| `perChannel.currentDescriptionGap` | **2** | ACCEPTED CALIBRATION | Current title → description. |
| `perChannel.progressHeight` | **4** | ACCEPTED | Current local progress. |
| `perChannel.progressRadius` | **2** | ACCEPTED CALIBRATION | Half progress height. |
| `perChannel.progressBottomInset` | **16** | ACCEPTED | Current-row bottom → progress bottom. |
| `perChannel.separatorLeftInset` | **20** | ACCEPTED | Row separator left edge. |

There is intentionally no `minuteHeight`, pt/minute, duration frame, compact-duration threshold or normalized-height token in Per zender.

## 5. Typography

### 5.1 Canonical family

**Instrument Sans** is the accepted primary Teevee UI typeface.

Use Instrument Sans as one coherent UI family for Per zender. Do not introduce a second sans-serif for times or metadata. Exact font source, licence, required weight files and Expo/React Native delivery remain implementation verification work. Until the approved family is wired into runtime, the platform system font may exist only as temporary implementation fallback; it is not an alternate accepted design.

### 5.2 Per-zender type tokens

| Text role | Size / line height | Weight | Colour | Dynamic Type |
| --- | --- | ---: | --- | --- |
| Presentation tab — inactive | 16 / 22 | 400 | `textSecondary` | compact chrome; max 1.20 |
| Presentation tab — selected | 16 / 22 | 600 | `text` | compact chrome; max 1.20 |
| Channel-strip fallback | 12 / 14 | 700 | selected `text`, unselected `textSecondary` | compact; max 1.20 |
| Selected-channel heading | 24 / 30 | 700 | `text` | substantive; uncapped |
| Selected date | 15 / 20 | 600 | `text` | compact chrome; max 1.20 |
| Primetime | 14 / 18 | 600 | inactive `textSecondary`, active `text` | compact chrome; max 1.20 |
| Nu | 14 / 18 | 600 | `text` | compact chrome; max 1.20 |
| Condensed channel prefix | 14 / 18 | 700 | `text` | compact chrome; max 1.20 |
| Programme start time | **16 / 20** | **400** | `textSecondary` | substantive; uncapped; tabular numerals |
| Standard programme title | **17 / 21** | **500** | `text` | substantive; uncapped |
| Current programme title | **19 / 23** | **700** | `text` | substantive; uncapped |
| Current description | **15 / 18** | **400** | `textSecondary` | substantive; uncapped; max 3 lines |

The 17/21 standard title and 19/23 current title are **Per-zender surface-specific accepted calibrations**. Do not propagate them to other Teevee surfaces without a separate owner decision.

Letter spacing = 0 for programme/time/body text. Programme times use tabular numerals where supported reliably by the production Instrument Sans build/runtime.

## 6. Colour and semantic tokens

Use the existing semantic theme tokens; do not introduce local palette variants.

| Semantic use | Light | Dark | Token |
| --- | --- | --- | --- |
| Guide canvas / sticky background | `#F7F7F5` | `#10100F` | `background` |
| Temporary programme-row pressed surface | `#FFFFFF` | `#191918` | `surface` |
| Nu return-action / subtle elevated surface | `#FFFFFF` | `#222220` | `surfaceElevated` |
| Primary text | `#171717` | `#F4F4F1` | `text` |
| Secondary substantive text | `#565656` | `#C2C2BD` | `textSecondary` |
| Muted/decorative text | `#7A7A78` | `#8E8E88` | `textMuted` |
| Separator / border / progress track | `#E4E4E0` | `#30302D` | `border` |
| Neutral interactive accent | `#202020` | `#F4F4F1` | `accent` |
| Current/progress/selected indicator | `#D64B42` | `#F06B61` | `currentTime` |

Programme rows remain permanently on `background`. `surface` appears only as temporary press/focus feedback. Do not use `programme` / `programmeCurrent` as permanent row fills.

## 7. Shared Guide presentation navigation

At rest:

1. platform top safe area;
2. 8-pt brand top inset;
3. accepted `tv.` mark in a 56×44 aspect-fit box at X=20;
4. presentation navigation, 48 high;
5. rest channel strip, 72 high.

Presentation navigation:

- three equal-width press zones within 20-pt screen insets;
- inactive `16/22 400 textSecondary`;
- selected `16/22 600 text`;
- selected underline base 88×2.5, radius 1.25, `currentTime`;
- no filled/outlined segmented container;
- minimum 44 pt iOS / 48 dp Android touch height;
- semantic selected tab state.

## 8. Channel-logo strip

### 8.1 Geometry

Rest:

- strip height **72**;
- item **48×48**;
- item is vertically centred: 12 pt top/bottom space;
- horizontal inset 20;
- item gap 12;
- logo max 40×32, `contain`.

Settled condensed:

- strip height **60**;
- item remains **48×48**;
- item is vertically centred: 6 pt top/bottom space;
- horizontal inset/gap/logo geometry are unchanged;
- touch target never shrinks.

Selected item:

- 48×48 wrapper;
- radius 12;
- `surfaceElevated` + one hairline `border`;
- full logo opacity;
- semantic selected state.

Unselected item:

- transparent background;
- no underline;
- full logo opacity.

Channel-strip press feedback may use temporary content opacity 0.72; selected state itself never relies on opacity.

### 8.2 Missing-logo fallback

When logo is unavailable/fails:

- preserve the same 48×48 item box;
- content box 40×32;
- visible value `channel.shortName ?? channel.displayName`;
- one line `12/14 700`;
- selected `text`, unselected `textSecondary`;
- tail ellipsis;
- no second caption.

Accessibility label is always the complete channel name.

### 8.3 Spatial navigation and recentering

After either direct channel selection or adjacent-channel schedule swipe, apply this priority:

1. **fully visible** — selected 48×48 item must be wholly inside the visible rail;
2. **comfortably centred** — where scroll geometry permits, target `selectedItemCenter - viewportWidth / 2` and clamp to rail bounds;
3. **continuation cue** — when trailing channels exist and the preceding priorities remain satisfied, prefer roughly **12 pt** of the next off-screen item remaining visible as a spatial continuation cue.

The 12-pt continuation cue is a target, not an invariant: do not shift a correctly centred selected item merely to force the cue. Rail start/end clamping always wins.

After schedule paging, let paging settle first, then smoothly recenter the rail. Avoid two aggressive simultaneous animations. With Reduce Motion, jump directly to the correct final rail position.

Do not add arrows, fades, gradient masks, page dots, permanent swipe-help text or gesture-help chrome.

Accessibility focus must remain on the selected/focused logical channel; animated rail recentering must not move VoiceOver/TalkBack focus to another item.

## 9. Selected channel and utility composition

### 9.1 Rest selected-channel heading

- 24 pt below rest channel strip;
- 20-pt left/right inset;
- `24/30 700 text`;
- maximum two lines;
- no permanent swipe instruction;
- no previous/next channel arrows.

### 9.2 Rest utility row

- 8 pt below selected-channel heading;
- horizontal inset 20;
- minimum height 52;
- date is the leading context;
- Primetime + Nu occupy the trailing utility area;
- minimum 8-pt separation between adjacent touch frames;
- schedule begins 12 pt below the row.

The zone must read as **context + light temporal navigation**, not `[date pill] [Primetime pill] [Nu pill]`.

### 9.3 Date selector

Visible treatment is always primarily typographic:

- no permanent filled surface;
- no permanent pill/border;
- `15/20 600 text`;
- disclosure chevron 14×18, gap 6;
- complete touch target minimum 44 pt iOS / 48 dp Android;
- pressed state: temporary content opacity 0.72;
- focused keyboard/switch-access state: platform focus affordance or 2-pt `currentTime` focus ring around the touch frame; focus does not turn the control into a permanent pill;
- disabled only if day selection is genuinely unavailable; apply `disabledOpacity=0.40` and semantic disabled state.

Date labels and D-2..D+7 behaviour follow `GUIDE_DAY_SELECTOR.md`. Between 00:00 and 05:59, the preceding television-day date is never falsely labelled `Vandaag`.

## 10. Temporal controls — canonical state model

### 10.1 Semantic target resolution

Control state is derived from the **stable semantic schedule anchor**, never from which control was tapped last.

Resolve targets using existing timestamp/programme-anchor semantics:

- `Nu` target = actual `now` timestamp and its containing television day;
- `Primetime` target = 20:30 Europe/Amsterdam on the selected television day;
- resolve each target against the fixed-row schedule to the programme/context containing that timestamp, or the canonical nearest/gap anchor if no programme contains it;
- resolve the stable viewport/schedule anchor through the same semantic anchor model;
- compare semantic anchors, not pixel offsets.

Do **not** introduce pt/minute, pixel thresholds, arbitrary ±minute windows or tolerance bands when semantic programme/context equality is available.

Precedence rule: when the stable context resolves to the actual `Nu` target, **Nu wins**. `Nu` is active/current and Primetime remains a light action even when the actual current programme also happens to contain the selected day's 20:30 instant. This prevents two simultaneous primary current indicators and matches the accepted state matrix.

### 10.2 Definitive state matrix

| Schedule context | Date | Primetime | Nu |
| --- | --- | --- | --- |
| Stable anchor = actual current context | Typographic normal/action | Light secondary action | **Active/current** |
| Elsewhere on current/selected day | Typographic normal/action | Light secondary action | **Strong return-action** |
| Stable anchor = selected day's 20:30 context and not actual Nu | Typographic normal/action | **Active/current** | **Strong return-action** |
| Action genuinely unavailable | Normal if selector itself remains available; disabled only if it truly cannot open | **Disabled only if target truly unavailable** | **Disabled only if target truly unavailable** |

`active/current` is never equivalent to `disabled`.

### 10.3 Primetime — inactive/action

Semantics remain frozen: jump to 20:30 on the selected television day without changing that day.

Visual treatment:

- transparent background;
- no permanent border/capsule;
- 36-pt visual frame inside minimum 44/48 touch target;
- horizontal content padding 10;
- moon icon 14×14;
- icon/text gap 7;
- `14/18 600 textSecondary`;
- no shadow/elevation.

Pressed: preserve geometry and use temporary content opacity 0.72.  
Focus: platform focus affordance or 2-pt `currentTime` focus ring around touch frame.  
Accessibility: button label `Ga naar primetime, 20:30 op geselecteerde dag`; not selected; not disabled unless genuinely unavailable.

### 10.4 Primetime — active/current

- transparent background;
- no pill/border;
- icon + label use primary `text`;
- same 36-pt visual frame and touch target;
- centred short underline: 24×2, radius 1, `currentTime`, bottom inset 2;
- underline remains visible in light/dark through semantic `currentTime` token;
- accessibility exposes selected/current state plus the same meaningful action label/hint;
- tapping may re-anchor to 20:30 but the control remains enabled.

### 10.5 Nu — return-action

When stable context is not actual Now, `Nu` is the strongest return action in the utility group:

- visible height 36;
- min visible width 48;
- minimum touch target 44/48;
- horizontal padding 12;
- radius 18;
- `surfaceElevated` fill;
- one hairline `border`;
- `14/18 600 text`;
- no shadow/elevation.

Pressed: keep surface treatment and apply temporary content opacity 0.72.  
Focus: 2-pt `currentTime` focus ring outside the touch/visible boundary where custom focus indication is needed.  
Accessibility: button label `Ga naar nu`; enabled; not selected/current.

### 10.6 Nu — active/current

When the stable semantic anchor corresponds to actual Now:

- remove elevated pill dominance;
- transparent background;
- no permanent border;
- primary `text`;
- same 36-pt frame/minimum touch target;
- centred short underline: 24×2, radius 1, `currentTime`, bottom inset 2;
- accessibility exposes selected/current state;
- never expose disabled merely because tapping would be a no-op/re-anchor.

Pressed/focus behaviour follows the active Primetime pattern.

### 10.7 Disabled temporal controls

Disabled exists only when the action is truly unavailable after normal fallback/anchor resolution. Do not disable because the target is already active.

- preserve the state's basic geometry;
- remove active/current underline;
- opacity 0.40;
- `accessibilityState.disabled = true`;
- no selected/current state simultaneously.

## 11. Programme schedule and standard row

Per zender renders programmes in chronological `startAt` order. Programme duration never affects row geometry.

### 11.1 Standard-row geometry

At fontScale 1.0:

- row height **52** exactly;
- time text X **24**;
- programme title X **100**;
- right inset **24**;
- separator at row bottom;
- no card/radius/permanent fill;
- no thumbnail, genre, duration or standard-row end time.

### 11.2 Standard-row typography and vertical alignment

Time:

- `16/20 400 textSecondary`;
- one line;
- tabular numerals;
- vertically centred: `(52 - 20) / 2 = 16` pt top equivalent.

Title:

- **`17/21 500 text`**;
- one line at normal text sizes;
- tail ellipsis when needed;
- vertically centred using layout centring; mathematical top equivalent = `(52 - 21) / 2 = 15.5` pt;
- do not retain the stale 15-pt offset derived from a 22-pt line box.

Prefer actual flex/layout centring over manually rounding 15.5 to a platform-specific integer. Full untruncated title remains available to accessibility APIs.

### 11.3 Programme-row pressed feedback

The entire row is tappable.

Rest:

- `background` canvas;
- no row fill/card.

Pressed:

- temporarily fill the **full row bounds** with semantic `surface` (`#FFFFFF` light / `#191918` dark);
- no radius;
- no new border;
- no chevron;
- no elevation/shadow;
- keep the existing bottom separator visible;
- do not use strong whole-row opacity reduction as the primary feedback.

Clear the surface immediately on release, cancel, vertical-scroll takeover or horizontal-pager gesture takeover. This pressed fill is visual feedback only, not an accessibility selected state.

## 12. Current programme row

The actual current programme receives exactly one 120-pt base row.

### 12.1 Geometry

At fontScale 1.0:

- row height **120**;
- time X 24;
- title/description/progress X 100;
- right inset 24;
- current time/title top inset **14**;
- bottom separator at row bottom.

The 14-pt top inset remains accepted after the 19/23 title refinement. Geometry check at base size:

- current title line occupies Y 14–37;
- description begins at Y 39 after the 2-pt gap;
- max three 18-pt lines occupy through Y 93;
- progress top = `120 - 16 - 4 = 100`;
- therefore even a full three-line description leaves 7 pt clear space before progress.

No top-inset change is required.

### 12.2 Current time/title

Time:

- `16/20 400 textSecondary`;
- top = 14;
- tabular numerals.

Title:

- **`19/23 700 text`**;
- top = 14;
- one line at normal text sizes;
- tail ellipsis when needed;
- full title in accessibility label.

### 12.3 Current description/subtitle

If `description` exists, show it. Otherwise a useful `subtitle` may be used.

- top gap from title line = 2;
- `15/18 400 textSecondary`;
- maximum **3 lines**;
- tail ellipsis;
- never hide because programme duration is short.

If neither exists, leave the space open; do not fabricate metadata.

### 12.4 Mandatory local progress bar

Current row always shows one local progress bar:

- left 100;
- right 24;
- width `screenWidth - 124`;
- height 4;
- radius 2;
- bottom inset 16;
- track `border`;
- fill `currentTime`.

`progress = clamp((nowMs - startMs) / (endMs - startMs), 0, 1)`

Do not add a current card fill, red left rail, schedule-wide current-time line, now-dot, visible `Nu bezig` badge or second progress signal.

Current row uses the same temporary full-row `surface` pressed feedback as a standard row; the progressbar remains visible over that temporary pressed surface.

## 13. Separators

Every visible programme row has one bottom separator:

- `bottom: 0`;
- left **20**;
- right **0**;
- `StyleSheet.hairlineWidth`;
- colour `border`.

No independent hourly grid. No duplicate boundary for adjacent programmes. Separator placement follows fixed row bounds, never duration.

## 14. Dynamic Type

Let `contentScale = max(1, systemFontScale)`.

### 14.1 Standard rows

`standardRowHeight(fontScale) = round(52 × contentScale)`

Rules:

- every non-current row uses the same computed height at that scale;
- time/title remain uncapped substantive text;
- time remains one line and vertically centred;
- title stays max one line through `fontScale <= 1.35`;
- above 1.35, title may use max two lines;
- two-line title block is vertically centred;
- no row height varies because title content or programme duration differs.

Representative heights:

| Font scale | Standard row |
| ---: | ---: |
| 1.00 | 52 |
| 1.10 | 57 |
| 1.35 | 70 |
| 1.50 | 78 |
| 2.00 | 104 |

The 17/21 title scales as substantive content. Do not retain offsets/examples based on the superseded 18/22 title.

### 14.2 Current row

`currentRowHeight(fontScale) = round(120 × contentScale)`

Rules:

- current title/description remain uncapped substantive text;
- current title stays one line through 1.35 and may use max two lines above 1.35;
- description remains max three lines with tail ellipsis;
- progress stays 4 pt high and does not scale into a heavy bar;
- progress bottom inset stays 16;
- current top inset stays 14;
- title→description gap stays 2;
- no duration-based content suppression.

Representative heights:

| Font scale | Current row |
| ---: | ---: |
| 1.00 | 120 |
| 1.10 | 132 |
| 1.35 | 162 |
| 1.50 | 180 |
| 2.00 | 240 |

The 19/23 title replaces all old 20/24 assumptions.

### 14.3 Compact chrome scaling

`maximumFontSizeMultiplier = 1.20` remains allowed only for documented compact chrome:

- presentation tabs;
- channel fallback;
- date label;
- Primetime/Nu labels;
- condensed channel/date context.

Selected-channel heading, programme times, programme titles and current description remain uncapped.

If date + Primetime + Nu cannot fit:

- row 1 = date selector;
- row 2 = Primetime + Nu;
- compact sticky context minimum becomes 88;
- never abbreviate Primetime or hide Nu.

## 15. Sticky / condensed state

### 15.1 Rest state

- channel strip **72**;
- channel item **48×48**;
- large selected-channel heading visible;
- date / Primetime / Nu use the refined temporal hierarchy;
- brand/presentation chrome may be visible.

### 15.2 Settled condensed state

Functional stack:

1. platform safe area;
2. channel strip **60**;
3. compact channel/date/Primetime/Nu context **52** base, **88** when wrapped;
4. fixed-row schedule.

Base functional chrome = **112 pt**.

Absent:

- brand/header identity chrome;
- presentation selector;
- large selected-channel heading.

The same temporal state machine remains live in condensed state. Do not revert to static pills after collapse.

### 15.3 Collapse motion

Normal motion:

`progress = clamp(scrollY / 56, 0, 1)`

- disappearing brand/presentation/large-channel context opacity = `1 - progress`;
- disappearing blocks translate upward by max `12 × progress` pt;
- channel strip height = `72 - (12 × progress)` pt, ending at 60;
- 48×48 channel items remain unchanged and vertically centred inside the interpolated rail;
- no spring;
- no scroll-direction hide/reveal behaviour.

Reduce Motion:

- discrete rest/condensed switch at 28 pt schedule offset;
- strip changes directly 72 → 60;
- no height/fade/translation interpolation required;
- item remains 48×48.

Collapse must preserve the stable visible programme/list anchor. Do not infer a timestamp from pixel/minute geometry.

## 16. Time-anchor semantics and temporal-state evaluation

Changing channel/day still preserves viewed time context where practical, but fixed-row layout means this cannot be calculated as `scrollY / ptPerMinute`.

The stable anchor is semantic:

- identify the programme/context at the canonical viewport anchor;
- retain its real timestamp/programme anchor;
- resolve that semantic timestamp against the target channel/day schedule;
- scroll to the corresponding/nearest fixed-row context.

`Nu` and `Primetime` use the same resolver for navigation **and** active/current state. This keeps the UI state aligned with what the user is semantically viewing and avoids last-action flags or pixel tolerances.

## 17. Light / Dark / System

The exact same layout, geometry, state machine, touch targets and transitions apply in light, dark and system modes. Only semantic tokens resolve differently.

Light:

- canvas `background #F7F7F5`;
- pressed row `surface #FFFFFF`;
- Nu return action `surfaceElevated #FFFFFF`;
- primary text `#171717`.

Dark:

- canvas `background #10100F`;
- pressed row `surface #191918`;
- Nu return action `surfaceElevated #222220`;
- primary text `#F4F4F1`.

System follows OS appearance. Do not create a second dark-mode composition.

## 18. Accessibility

### Channels

- role button;
- full channel name;
- explicit selected state;
- visible item/touch geometry 48×48;
- animated recentering must not unexpectedly move accessibility focus.

### Programme rows

- role button;
- accessibility label includes full channel, full title, start and end time;
- append current state where relevant;
- hint may state that it opens Programme Detail;
- temporary pressed `surface` fill is visual feedback only, not a semantic selected state.

### Date

- full selected date;
- `Kies een dag` action semantics;
- full 44/48 minimum touch target;
- selected option in bottom sheet uses explicit selected state + non-colour mark.

### Primetime

Inactive/action:

- label `Ga naar primetime, 20:30 op geselecteerde dag`;
- enabled unless truly unavailable.

Active/current:

- same useful action label/hint;
- selected/current semantic state;
- not disabled.

### Nu

Return/action:

- label `Ga naar nu`;
- enabled, not selected/current.

Active/current:

- label/hint identifies current Now context;
- selected/current semantic state;
- never disabled merely because it is already current.

### State indication and contrast

- relevant state never depends on colour alone;
- short underline + semantic selected/current state form the accepted temporal current treatment;
- programme times use `textSecondary`, not light `textMuted`;
- normal/substantive text targets >= 4.5:1 contrast;
- essential graphics/large text target >= 3:1 where applicable;
- VoiceOver and TalkBack must retain correct focus/selected semantics after channel recentering and header condensation.

## 19. Programme-row and gesture interaction

Preserve accepted mechanics:

- horizontal swipe over schedule → adjacent channel;
- vertical scroll → programme list / rest-to-condensed transition;
- channel rail remains directly horizontally scrollable/selectable;
- date/Primetime/Nu are tap controls and must not create a competing horizontal gesture zone;
- programme row tap opens Programme Detail;
- row pressed fill clears when either vertical or horizontal gesture wins;
- directional locking remains active where already proven.

After adjacent-channel paging, schedule settles first and rail recentering follows calmly. Reduce Motion may use direct final rail position.

## 20. Physical-runtime convergence evidence

The accepted refinement explicitly corrects the previous production calibration; runtime appearance is evidence, not authority.

| Part | Superseded production-spec treatment | Accepted 2026-09-17 treatment |
| --- | --- | --- |
| Standard title | 18/22 weight 500 | **17/21 weight 500** |
| Current title | 20/24 weight 700 | **19/23 weight 700** |
| Time | 16/20 weight 400 | **unchanged: 16/20 weight 400** |
| Description | 15/18 weight 400 | **unchanged: 15/18 weight 400, max 3** |
| Standard row | 52 | **unchanged: 52** |
| Current row | 120 | **unchanged: 120** |
| Settled condensed channel strip | 72 | **60**, item remains 48×48 |
| Primetime | Permanent elevated/bordered capsule | **light transparent secondary action; active/current via primary text + short underline** |
| Nu | Permanent fixed outlined/pill treatment | **strong elevated return action away from Now; typographic active/current state at Now** |
| Temporal state | Static buttons / last action could be inferred | **semantic target/anchor state; active ≠ disabled** |
| Channel selection positioning | Fully visible/centre where practical, underspecified | **fully visible → comfortably centred → trailing continuation cue where practical** |
| Programme press | Generic opacity reduction | **temporary full-row semantic `surface` fill** |

All fixed-row schedule corrections from the previous owner decision remain in force: no pt/minute, duration-proportional rows, normalizedHeight or duration-based content suppression.

## 21. Superseded production-spec rules

The following must not survive as current rules:

- standard programme title 18/22 weight 500;
- current programme title 20/24 weight 700;
- settled condensed channel strip permanently 72 pt;
- Primetime always using `surfaceElevated + border` capsule treatment;
- Nu always using the same static button treatment regardless of schedule context;
- treating active/current as disabled or as a last-tapped flag;
- temporal active-state calculation through pixel thresholds or arbitrary time tolerances;
- programme-row primary pressed feedback through whole-row opacity reduction;
- channel selection merely being just-visible without the centering priority;
- no intentional continuation cue in the rail;
- any pt/minute, `normalizedHeight`, duration-height thresholds or duration-driven Per-zender programme geometry.

## 22. Implementation calibration register

Surface-specific implementation calibrations now frozen for Development handoff:

1. Guide screen inset 20 and brand box 56×44.
2. Presentation row 48 and selected indicator 88×2.5.
3. Channel rail: 72 rest / 60 condensed, 48×48 item, 12 gap, 40×32 logo max, 20 edge inset.
4. Preferred trailing continuation cue target 12 pt where it does not disturb centering/visibility.
5. Context spacing: 24 strip→heading, 8 heading→utilities, 52 utility-row minimum, 12 utility→schedule.
6. Temporal visible frame 36, active underline 24×2/bottom2, icon14/gap7, Nu return-action padding12/min width48.
7. Programme columns: time X24, programme X100, right24.
8. Standard row 52, current row 120.
9. Standard title 17/21 500, current title 19/23 700, time 16/20 400, description 15/18 400 — Instrument Sans.
10. Current top14, description gap2, progress 4 high/radius2/bottom16.
11. Separator left20 at bottom of each row.
12. Sticky context 52/88; collapse distance56; Reduce Motion state switch at28.

Development must not choose alternatives locally. A future retune requires new owner-approved evidence and an update to this source of truth.

## 23. Missing asset/licensing inputs

### Instrument Sans

The family is accepted. Production still must verify exact distributable source/licence, required weights, offline availability and Expo/React Native loading/fallback behaviour. Do not commit arbitrary font binaries from chat/local machines.

### Channel logos

Fixtures may not have licensed production logos. Preserve final 48×48 item/fallback geometry rather than reverting to large text tabs.

### Brand mark

Reuse an approved distributable `tv.` asset if present when Development starts; otherwise final pixel acceptance requires the approved asset. The 56×44 layout box is already specified.

No third-party dependency is required solely for moon/chevron treatment.

## 24. Development handoff

When Lead schedules Per-zender visual convergence, Development must be able to implement without further design interpretation:

1. use Instrument Sans as the accepted UI family once production font delivery is wired;
2. standard title **17/21 500**;
3. current title **19/23 700**;
4. time **16/20 400**;
5. current description **15/18 400**, max 3 lines + ellipsis;
6. preserve fixed rows: 52 standard / 120 current at fontScale1;
7. preserve time X24 / programme X100 / right24 / progress 4 high / bottom16;
8. rest channel strip **72**, settled condensed **60**, item **48×48** throughout;
9. after channel change: fully visible → comfortably centred → trailing ~12-pt continuation cue where practical;
10. date remains typographic, not a pill;
11. derive `Nu` and `Primetime` action/current states from semantic timestamp/programme anchors, with Nu precedence at actual Now;
12. `Nu` away from Now = strongest elevated return action; at Now = typographic active/current + short underline;
13. `Primetime` inactive = light transparent secondary action; active = primary text + short underline;
14. active/current never means disabled;
15. full programme row pressed = temporary semantic `surface` fill; clear on release/cancel/gesture takeover;
16. preserve horizontal adjacent-channel swipe, channel-rail browsing, D-2..D+7, 06:00 television-day semantics, Programme Detail round-trip and time-anchor semantics;
17. implement 72→60 strip collapse without changing 48×48 items; no spring; discrete Reduce Motion state;
18. validate light/dark/system, Dynamic Type, VoiceOver, TalkBack and Reduce Motion;
19. do not add swipe nudge, overflow button, arrows, fade masks or old exploration chrome;
20. run the implementation's normal automated/physical gates when Development occurs.

This design-spec increment changes no runtime code.

## 25. Frozen decisions explicitly preserved

This refinement does not reopen:

- fixed-row chronological Per-zender schedule;
- 52/120 base programme-row geometry;
- horizontal adjacent-channel swipe;
- direct channel-strip selection;
- preserving viewed time context where practical;
- television day 06:00 Europe/Amsterdam → 06:00 next day;
- D-2..D+7;
- Primetime = 20:30 on selected television day;
- Nu = actual current instant + containing television day;
- direct Programme Detail/context round-trip;
- provider-independent data architecture;
- primary bottom navigation;
- light/dark/system;
- Instrument Sans as the one accepted UI family;
- no programme thumbnails;
- no genre labels;
- no programme cards/permanent row fills;
- no decorative channel arrows;
- no expanded historical time picker;
- no duration-driven programme geometry.

## 26. Explicitly outside this accepted refinement

The following are **not canonical** and must not be implemented as though approved:

- one-time horizontal schedule swipe nudge/peek;
- persisted `gesture hint shown` onboarding state;
- `•••` overflow in the shared header;
- Per-zender-only Settings/overflow IA change.

These require separate future owner acceptance.

## 27. Visual acceptance checklist

Per-zender visual convergence is ready only when all are true on the exact implementation head:

- shared Guide/presentation chrome matches canonical composition;
- Instrument Sans is used once the approved production assets are wired;
- channel rail is logo-led and selected item is fully visible;
- selected channel is comfortably centred where geometry allows;
- trailing continuation cue appears where practical without breaking centering/clamping;
- no arrows/fades/text swipe-help are added;
- rest strip is 72 and settled condensed strip is **60**;
- 48×48 channel items remain unchanged through collapse;
- base condensed functional stack is **112** (60+52), or 148 when context wraps to 88;
- date remains typographic;
- Nu/Primetime states are derived from semantic schedule anchors, not last tap/pixels/tolerance windows;
- Nu away = elevated return action; Nu current = typographic current state + underline;
- Primetime inactive = light secondary action; Primetime current = primary current state + underline;
- active/current is never exposed as disabled;
- standard title is **17/21 500**;
- current title is **19/23 700**;
- time is **16/20 400**;
- description is **15/18 400**, max 3 lines + ellipsis;
- standard row remains **52** and title is geometrically centred with 21-pt line height;
- current row remains **120**, current top inset 14 and progress geometry remains canonical;
- all non-current rows remain equal at a given Dynamic Type scale;
- programme duration has zero effect on row height/spacing;
- every row uses one bottom separator;
- programme press uses temporary `surface` fill without card/radius/elevation;
- no schedule-wide now line, current card fill, red left rail, now-dot or hourly-grid dominance;
- light/dark/system use semantic tokens;
- Dynamic Type, VoiceOver, TalkBack and Reduce Motion follow this specification;
- one-time swipe nudge and `•••` overflow remain absent;
- final physical comparison uses the exact canonical references plus the written 2026-09-17 refinement, never a superseded runtime screenshot.
