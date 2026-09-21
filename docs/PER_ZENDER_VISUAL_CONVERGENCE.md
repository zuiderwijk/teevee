# Teevee — Per zender production design specification

Status: **CANONICAL PRODUCTION IMPLEMENTATION SPEC — accepted design, no redesign**  
Date: 2026-09-18  
Revision: **post-PR #86 production convergence — compact temporal context + PR #81 collapse-isolation architecture**

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
- PR #81 — merged Per-zender fixed-row convergence and fixed-native-viewport/collapse-isolation runtime architecture;
- PR #83 — merged accepted Per-zender refinement baseline;
- PR #86 — merged accepted compact temporal-context refinement after physical iPhone validation;
- the exact canonical Per-zender visual assets selected by the repository;
- physical iPhone evidence used only to calibrate implementation fidelity.

PR #83 established the 17 September accepted baseline. PR #81 subsequently merged the production fixed-row implementation and the **fixed-native-viewport / collapse-isolation architecture** that prevents scroll-driven chrome contraction from mutating normal-flow geometry above the active vertical schedule ScrollView. PR #86 established the compact 18 September temporal-context baseline. Physical iPhone validation on PR #88 exact head `18c021b4ccfb36d599d6301dd04f9ec96ab6d66d` then refined **only** the expanded/rest spacing distribution from 16/12 to **4/24**. The total expanded gap sum stays 28 pt, so the accepted 140/56/84 collapse geometry remains unchanged. No other accepted Per-zender product or interaction decision is reopened.

Exact canonical pixels remain:

- Per zender light + dark: `/Teevee/TV-gids app in licht en donker thema.png`, Library file id `file_000000008b2481f4ad34bb1547fc813e`;
- Guide day-selector states: `/Teevee/Teevee Guide day selector - states and bottom sheet.png`, Library file id `file_00000000390c8210b76256621721592b`;
- sticky/condensed behaviour: `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`, Library file id `file_00000000314481f69f6a34d18ece1c21`.

The 2026-09-17 written refinement supersedes those historical pixels only for the explicitly changed details in this document: temporal utility states, programme-title calibration, settled condensed channel-strip height, channel-rail positioning behaviour and programme-row pressed feedback. The 2026-09-18 owner refinements additionally supersede selected-channel text outside the rail, the former compressed current-programme treatment, the old 24-pt rail→utilities calibration, the physically rejected 16/12 expanded spacing distribution, long Per-zender relative date labels and Dynamic-Type-driven wrapped temporal chrome. All other accepted composition remains intact.

### Source precedence

1. explicit current owner corrections;
2. owner-approved refinements recorded in merged PR #83 and PR #86, plus the PR #81 fixed-native-viewport/collapse-isolation architecture;
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
| Rest channel identity | Confirms selected channel | Selected logo in the channel rail is sufficient identity; no separate large textual heading in expanded/rest state. |
| Day selector | D-2..D+7 navigation | Primarily typographic text + disclosure; never a permanent pill. |
| Primetime | Jump to 20:30 on selected TV day | Light secondary action when inactive; semantic active/current treatment at Primetime context. |
| Nu | Return to actual current instant/day | Strongest return action when away; semantic active/current treatment when actually at Now. |
| Schedule container | One-channel chronological list | Fixed programme rows; open canvas; no cards or duration geometry. |
| Time gutter | Start-time orientation | Stable left column; tabular numerals. |
| Programme column | Title/current detail | Stable X across all row types. |
| Standard row | Non-current programme | Fixed 52 pt base row; vertically centred time + title. |
| Current row | Actual current programme | Spacious fixed **176 pt** base row; title + up to four description lines + mandatory local progress with deliberate vertical breathing room. |
| Row separator | Scanning cue | One quiet row-bottom hairline. |
| Pressed row | Interaction feedback | Temporary full-row semantic `surface` fill only while pressed. |
| Sticky/condensed state | Functional context while scrolling | 60-pt channel strip + one **52-pt** compact date/Primetime/Nu context row; no selected-channel text is added. |
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
| `perChannel.stripToUtilitiesGapRest` | **4** | ACCEPTED | Expanded/rest channel strip → temporal context after PR #88 physical validation. |
| `perChannel.stripToUtilitiesGapCondensed` | **0** | ACCEPTED | Settled condensed strip → temporal context. |
| `perChannel.temporalContextHeight` | **52** | ACCEPTED | Exact height in expanded/rest, throughout interpolation and settled condensed state. No wrapped variant. |
| `perChannel.utilityVisibleHeight` | 36 | IMPLEMENTATION CALIBRATION | Temporal-control visual frame; touch target remains 44/48. |
| `perChannel.utilityGap` | 8 | IMPLEMENTATION CALIBRATION | Minimum control gap. |
| `perChannel.utilityToScheduleGapRest` | **24** | ACCEPTED | Expanded/rest temporal context → schedule after PR #88 physical validation. |
| `perChannel.utilityToScheduleGapCondensed` | **0** | ACCEPTED | Settled condensed temporal context → schedule. |
| `perChannel.nativeCollapseDistance` | **56** | ACCEPTED ARCHITECTURE | Native schedule-scroll distance consumed by the collapse. |
| `perChannel.fullVisualContraction` | **140** | ACCEPTED ARCHITECTURE | 100 Guide chrome + 12 rail delta + 4 top gap + 24 bottom gap. |
| `perChannel.visualCompensation` | **84** | ACCEPTED ARCHITECTURE | `140 - 56`; applied visually, never as normal-flow mutation above the active ScrollView. |
| `perChannel.fixedViewportTop` | **112** | ACCEPTED ARCHITECTURE | Settled functional stack: 60 rail + 52 temporal context. |
| `perChannel.scheduleContentTopInset` | **140** | ACCEPTED ARCHITECTURE | Static rest-state reservation inside the fixed native schedule viewport. |

Base settled condensed functional chrome = **60 + 52 = 112 pt**, excluding platform safe area. There is exactly one Per-zender temporal-context height: **52 pt**. Do not define or retain an 88-pt wrapped-height token.

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
| `perChannel.currentRowHeight` | **176** | ACCEPTED | Actual current programme at fontScale 1.0; deliberately spacious. |
| `perChannel.timeGutterWidth` | 64 | IMPLEMENTATION CALIBRATION | Stable time column. |
| `perChannel.timeTextX` | **24** | ACCEPTED CALIBRATION | Start-time X. |
| `perChannel.programmeColumnX` | **100** | ACCEPTED CALIBRATION | Title/description/progress X. |
| `perChannel.programmeRightInset` | **24** | ACCEPTED CALIBRATION | Content right inset. |
| `perChannel.currentContentTopInset` | **14** | ACCEPTED CALIBRATION | Current time/title top. |
| `perChannel.currentDescriptionGap` | **10** | ACCEPTED | Current title → description. |
| `perChannel.currentDescriptionToProgressMinGap` | **20** | ACCEPTED | Minimum clear vertical space between a full four-line description block and progress track at base scale. |
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
| Selected date | 15 / 20 | 600 | `text` | compact chrome; max 1.20 |
| Primetime | 14 / 18 | 600 | inactive `textSecondary`, active `text` | compact chrome; max 1.20 |
| Nu | 14 / 18 | 600 | `text` | compact chrome; max 1.20 |
| Programme start time | **16 / 20** | **400** | `textSecondary` | substantive; uncapped; tabular numerals |
| Standard programme title | **17 / 21** | **500** | `text` | substantive; uncapped |
| Current programme title | **19 / 23** | **700** | `text` | substantive; uncapped |
| Current description | **15 / 22** | **400** | `textSecondary` | substantive; uncapped; max 4 lines |

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

## 9. Rest channel identity and utility composition

### 9.1 Rest channel identity

- Do **not** render a separate large textual selected-channel heading below the channel-logo strip.
- The selected channel logo in the rail is the primary and sufficient channel identity in expanded/rest state.
- Do not replace the removed heading with another large label, badge or duplicate identity treatment.
- Do **not** introduce a compact textual channel name in condensed state; the selected logo remains sufficient visible channel identity throughout collapse.

### 9.2 Rest utility row

- **4 pt** below the rest channel strip;
- horizontal inset 20;
- minimum height 52;
- date is the leading context;
- Primetime + Nu occupy the trailing utility area;
- minimum 8-pt separation between adjacent touch frames;
- schedule begins **24 pt** below the row.

The zone must read as **context + light temporal navigation**, not `[date pill] [Primetime pill] [Nu pill]`. With the fixed 72-pt rail / centred 48×48 item and 52-pt context / centred 36-pt visible controls, the accepted 4/24 calibration yields approximately **24 pt visible selected-item→controls whitespace** and **32 pt controls→schedule whitespace**. This is intentional: temporal context belongs optically with the channel rail, while programme content receives the larger separation.

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

Date labels and D-2..D+7 behaviour follow `GUIDE_DAY_SELECTOR.md`. Per zender uses these frozen visible labels:

- **06:00–23:59:** current television day = `Vandaag`; next television day = `Morgen`; no weekday/date suffix on those two labels;
- all other television days = explicit localized weekday + date, for example `Zo 20 sep`;
- **00:00–05:59:** every television-day label is explicit weekday + date; `Vandaag` and `Morgen` are not shown in either the inline selector or Per-zender day-sheet options.

Accessibility labels still expose the full selected date even when the visible label is only `Vandaag` or `Morgen`.

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

The actual current programme receives exactly one deliberately spacious **176-pt base row**.

The extra height is intentional: the current row should feel premium and editorial, with title, synopsis and progressbar reading as three distinct layers rather than a compressed metadata block.

### 12.1 Geometry

At fontScale 1.0:

- row height **176**;
- time X 24;
- title/description/progress X 100;
- right inset 24;
- current time/title top inset **14**;
- bottom separator at row bottom.

The 14-pt top inset remains accepted. Base-size geometry:

- current title line occupies Y 14–37;
- description begins at Y 47 after the **10-pt** title→description gap;
- max four **22-pt** description line boxes occupy through Y 135;
- progress top = `176 - 16 - 4 = 156`;
- a full four-line description therefore retains **21 pt** clear space before progress, satisfying the accepted minimum of 20 pt.

Do not reclaim this space simply because a description is shorter. Shorter copy should leave calm open space rather than vertically compressing the row.

No top-inset or progress-bottom-inset change is required.

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

- top gap from title line = **10**;
- `15/22 400 textSecondary`;
- maximum **4 lines**;
- preserve at least **20 pt** clear space between the full description block and progressbar at base scale;
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

`baseCurrentRowHeight(fontScale) = round(176 × contentScale)`

To preserve the accepted **minimum 20-pt description→progress clearance** when the current title is allowed to wrap to two lines above fontScale 1.35, also calculate a content-safe minimum using the already accepted metrics:

`maxCurrentTitleLines = contentScale <= 1.35 ? 1 : 2`

`contentSafeCurrentRowHeight = ceil(14 + (23 × contentScale × maxCurrentTitleLines) + 10 + (22 × contentScale × 4) + 20 + 4 + 16)`

`currentRowHeight(fontScale) = max(baseCurrentRowHeight(fontScale), contentSafeCurrentRowHeight)`

Rules:

- current title/description remain uncapped substantive text;
- current title stays one line through 1.35 and may use max two lines above 1.35;
- description remains max four lines with tail ellipsis;
- description uses the accepted 15/22 base typography and scales as substantive content;
- progress stays 4 pt high and does not scale into a heavy bar;
- progress bottom inset stays 16;
- current top inset stays 14;
- title→description gap stays 10;
- maintain at least 20 pt description→progress clearance at every supported scale; the content-safe minimum above is mandatory when the simple `176 × contentScale` height would violate that clearance;
- no duration-based content suppression.

Representative heights:

| Font scale | Current row |
| ---: | ---: |
| 1.00 | 176 |
| 1.10 | 194 |
| 1.35 | 238 |
| 1.50 | 265 |
| 2.00 | 352 |

The 19/23 title replaces all old 20/24 assumptions.

### 14.3 Compact chrome scaling

For **Per-zender temporal chrome**, `maximumFontSizeMultiplier = 1.20` is a **hard cap**:

- selected date: base 15/20 → maximum **18/24**;
- Primetime: base 14/18 → maximum **16.8/21.6**;
- Nu: base 14/18 → maximum **16.8/21.6**.

These three visible labels remain **one line** in both expanded/rest and condensed state. The temporal context remains 52 pt high and does not enter the former 88-pt wrap state because of system text size.

Touch targets remain minimum 44 pt iOS / 48 dp Android; the cap applies to visible compact-label scaling, not hit areas or accessibility semantics. VoiceOver/TalkBack receive the full selected date and action labels.

Programme times, programme titles and current description remain uncapped substantive content and continue to follow §§14.1–14.2.

Presentation tabs follow the shared Guide accessibility composition: **48 pt / one line through fontScale 1.35**, then **64 pt / maximum two lines above 1.35**, while retaining the shared 1.20 compact-label cap. Channel fallback retains its existing compact-chrome scaling rule. This shared-shell amendment does not change the fixed 52-pt Per-zender temporal context.

On supported phone widths, a Per-zender temporal row that wraps or truncates at the documented 1.20 cap is an implementation/convergence defect, not an instruction to grow the context to 88 pt. Do not abbreviate `Primetime` or hide `Nu`; use the accepted compact date labels instead.

## 15. Sticky / condensed state

### 15.1 Rest state

- channel strip **72**;
- channel item **48×48**;
- no separate large textual selected-channel heading; the selected logo carries channel identity;
- rest utility row starts **4 pt** below the channel strip;
- date / Primetime / Nu use the refined temporal hierarchy;
- brand/presentation chrome may be visible.

### 15.2 Settled condensed state

Functional stack:

1. platform safe area;
2. channel strip **60**;
3. compact date/Primetime/Nu context **52**;
4. fixed-row schedule.

Base functional chrome = **112 pt**.

Absent:

- brand/header identity chrome;
- presentation selector;
- selected-channel text outside the persistent logo rail.

The condensed row keeps the same temporal information as expanded/rest: date + Primetime + Nu. The selected rail logo remains sufficient visible channel identity. The same temporal state machine remains live in condensed state. Do not revert to static pills after collapse.

### 15.3 Collapse motion

Normal motion:

`progress = clamp(scrollY / 56, 0, 1)`

The heading-less expanded/rest geometry must converge continuously into the settled condensed stack. Use the accepted rest gaps as interpolation endpoints:

- channel strip height = `72 - (12 × progress)` pt, ending at 60;
- strip → functional context gap = `4 × (1 - progress)` pt, ending at 0;
- functional context → schedule gap = `24 × (1 - progress)` pt, ending at 0;
- functional temporal context remains **52 pt** throughout; there is no canonical 52↔88 wrap transition;
- context content remains date + Primetime + Nu throughout collapse; do not inject selected-channel text;
- disappearing non-functional brand/presentation chrome opacity = `1 - progress`;
- disappearing blocks translate upward by max `12 × progress` pt;
- 48×48 channel items remain unchanged and vertically centred inside the interpolated rail;
- no spring;
- no scroll-direction hide/reveal behaviour.

Production scroll-layout invariant — **PR #81 architecture is frozen**:

- the active vertical schedule ScrollView keeps a fixed native viewport while collapse is in progress;
- fixed native viewport top = **112 pt** = 60-pt settled channel rail + 52-pt temporal context;
- the schedule reserves a static **140-pt content top inset** for the full expanded→condensed visual contraction;
- native scrolling consumes exactly **56 pt** over the collapse;
- visual content compensation supplies exactly **84 pt** = `140 - 56`;
- at collapse progress `p`, native collapse contribution = `56 × p` and visual content translation = `-84 × p`; together they account for the full `140 × p` visual contraction;
- standard-text rest overlay bottom = **252 pt** = 100 Guide chrome + 72 rail + 4 gap + 52 context + 24 gap; settled overlay bottom = **112 pt** = 60 rail + 52 context;
- above fontScale 1.35, the shared Guide presentation row grows 48→64, so expanded Guide chrome becomes **116 pt**, rest overlay bottom becomes **268 pt**, full visual contraction becomes **156 pt**, native collapse remains **56 pt** and visual compensation becomes **100 pt**; the settled 112-pt Per-zender functional viewport and all rail/context/schedule metrics remain unchanged;
- scroll-driven rest→condensed geometry is visual overlay/transform geometry and must not mutate normal-flow sibling heights above that same ScrollView;
- semantic programme/timestamp anchors use explicit native↔schedule offset conversion so isolation does not change Nu, Primetime, day/channel continuity or fixed-row semantics;
- temporal context is always 52 pt, so **no wrap delta exists** in visual geometry or native↔semantic conversion;
- do not reintroduce a Dynamic-Type-driven wrap state, a second context height, or selected-channel text injection to preserve the old implementation path;
- do not reintroduce a `contentOffset → collapse → normal-flow height → compensated contentOffset` feedback path. Physical iPhone tracing on PR #81 proved that architecture causes post-fling forward/back oscillation.

Reduce Motion:

- discrete rest/condensed switch at 28 pt schedule offset;
- strip changes directly 72 → 60;
- strip→context gap changes directly **4 → 0**;
- context→schedule gap changes directly **24 → 0**;
- rest temporal context remains date + Primetime + Nu; no selected-channel text is introduced;
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

| Part | Superseded production-spec treatment | Current accepted treatment |
| --- | --- | --- |
| Standard title | 18/22 weight 500 | **17/21 weight 500** |
| Current title | 20/24 weight 700 | **19/23 weight 700** |
| Time | 16/20 weight 400 | **unchanged: 16/20 weight 400** |
| Description | 15/18 weight 400, max 3 | **15/22 weight 400, max 4** |
| Standard row | 52 | **unchanged: 52** |
| Current row | 120 | **176**, deliberately more spacious |
| Settled condensed channel strip | 72 | **60**, item remains 48×48 |
| Primetime | Permanent elevated/bordered capsule | **light transparent secondary action; active/current via primary text + short underline** |
| Nu | Permanent fixed outlined/pill treatment | **strong elevated return action away from Now; typographic active/current state at Now** |
| Temporal state | Static buttons / last action could be inferred | **semantic target/anchor state; active ≠ disabled** |
| Channel selection positioning | Fully visible/centre where practical, underspecified | **fully visible → comfortably centred → trailing continuation cue where practical** |
| Programme press | Generic opacity reduction | **temporary full-row semantic `surface` fill** |
| Selected-channel text | Large rest heading / compact condensed channel name | **removed outside the persistent rail; selected logo is sufficient visible identity in both states** |
| Current internal spacing | 2-pt title→description gap; ~7 pt before progress at max copy | **10-pt title→description gap; minimum 20 pt before progress at max four-line copy** |
| Expanded/rest spacing distribution | 24 rail→utilities, then 16/12 | **4 rail→context / 24 context→schedule** after PR #88 physical iPhone validation; total gap sum remains 28 |
| Per-zender relative day label | `Vandaag/Morgen · weekday date` | **`Vandaag` / `Morgen` only from 06:00–23:59; explicit weekday + date otherwise** |
| Per-zender compact Dynamic Type | Could wrap to 88-pt context | **hard 1.20 cap; one-row 52-pt temporal context** |

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
- selected-channel text outside the persistent logo rail, including the former compact condensed channel name;
- 24-pt rest rail→utilities spacing and the later physically rejected 16/12 expanded spacing distribution;
- long Per-zender relative date labels (`Vandaag/Morgen · weekday date`);
- Per-zender `Vandaag`/`Morgen` labels between 00:00–05:59;
- Dynamic-Type-driven 88-pt wrapped Per-zender temporal context;
- current row height 120 pt;
- current description 15/18 capped at three lines;
- 2-pt current title→description gap and the compressed description→progress spacing it produced;
- any pt/minute, `normalizedHeight`, duration-height thresholds or duration-driven Per-zender programme geometry.

### Runtime paths explicitly superseded by PR #86

PR #86 was documentation/design-only, so current `main` may still contain runtime symbols from the pre-refinement 52↔88 implementation. They are implementation debt, **not** canonical constraints. The next Development increment must converge them without changing the PR #81 fixed-native-viewport architecture.

Explicitly superseded in Per-zender runtime:

- `stickyContextWrappedHeight = 88`;
- `contextWrapped` React/ref/shared-value state;
- layout measurement whose purpose is to detect date/utilities wrapping;
- `wrappedContextDelta`;
- `perChannelContextWrapOffset`;
- `perChannelContextWrapAnchorTransition`;
- any `contextWrapped` / wrapped-height parameter that changes `perChannelStableScrollVisuals`, native↔schedule offset conversion or animated target calculation;
- `flexWrap: 'wrap'` as a Per-zender temporal-context adaptation path;
- the pre-PR #86 rest gap value `stripToUtilitiesGap = 24`;
- comments/tests/calculations that describe **148 pt** visual contraction or **92 pt** visual compensation.

Development must use the single fixed 52-pt context and **4/24 expanded → 0/0 condensed** gaps. At fontScale <=1.35 this yields **140 pt contraction / 56 pt native collapse / 84 pt visual compensation**. Above 1.35, the shared 64-pt Guide presentation row adds 16 pt only to expanded non-functional chrome, yielding **156 / 56 / 100** while the same fixed-native-viewport architecture and 112-pt settled Per-zender functional stack remain unchanged. This is a convergence of accepted shared accessibility chrome, not permission to redesign collapse or move it back into normal flow.

## 22. Implementation calibration register

Surface-specific implementation calibrations now frozen for Development handoff:

1. Guide screen inset 20 and brand box 56×44.
2. Shared Guide presentation row **48 through fontScale 1.35 / 64 above 1.35**, labels one line / max two lines respectively, selected indicator 88×2.5 and compact-label cap 1.20.
3. Channel rail: 72 rest / 60 condensed, 48×48 item, 12 gap, 40×32 logo max, 20 edge inset.
4. Preferred trailing continuation cue target 12 pt where it does not disturb centering/visibility.
5. Context geometry: expanded **4 / 52 / 24** (strip→context / context height / context→schedule); condensed **0 / 52 / 0**; no selected-channel text outside the rail and no wrapped context.
6. Temporal visible frame 36, active underline 24×2/bottom2, icon14/gap7, Nu return-action padding12/min width48.
7. Programme columns: time X24, programme X100, right24.
8. Standard row 52, current row **176**.
9. Standard title 17/21 500, current title 19/23 700, time 16/20 400, current description **15/22 400 max4** — Instrument Sans.
10. Current top14, title→description gap **10**, description→progress minimum **20 at every Dynamic Type scale**, progress 4 high/radius2/bottom16; current-row scaling uses the content-safe minimum from §14.2.
11. Separator left20 at bottom of each row.
12. Collapse isolation: temporal context **52 only**; hard temporal-label multiplier 1.20; fixed settled viewport top112; native collapse56; standard full contraction/visual compensation **140/84**, accessibility shared-tab mode **156/100**; rest gaps interpolate **4→0** above the context and **24→0** below it; Reduce Motion switches endpoints discretely at28.

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
5. current description **15/22 400**, max 4 lines + ellipsis;
6. preserve fixed rows: 52 standard / **176 current** at fontScale1;
7. preserve time X24 / programme X100 / right24; current top14; title→description gap10; minimum 20 pt description→progress clearance; progress 4 high / bottom16;
8. rest channel strip **72**, settled condensed **60**, item **48×48** throughout;
9. do not render selected-channel text outside the persistent rail in either expanded/rest or condensed state; selected logo is sufficient visible identity;
10. after channel change: fully visible → comfortably centred → trailing ~12-pt continuation cue where practical;
11. date remains typographic, not a pill; from 06:00–23:59 use only `Vandaag` / `Morgen` for current/next TV day, other days use weekday + date, and from 00:00–05:59 use explicit weekday + date for all day labels;
12. derive `Nu` and `Primetime` action/current states from semantic timestamp/programme anchors, with Nu precedence at actual Now;
13. `Nu` away from Now = strongest elevated return action; at Now = typographic active/current + short underline;
14. `Primetime` inactive = light transparent secondary action; active = primary text + short underline;
15. active/current never means disabled;
16. full programme row pressed = temporary semantic `surface` fill; clear on release/cancel/gesture takeover;
17. preserve horizontal adjacent-channel swipe, channel-rail browsing, D-2..D+7, 06:00 television-day semantics, Programme Detail round-trip and time-anchor semantics;
18. preserve the PR #81 fixed-native-viewport/collapse-isolation architecture: strip 72→60, strip→context **4→0**, context→schedule **24→0**, one fixed 52-pt temporal context, 48×48 items unchanged, native collapse56; standard shared chrome uses contraction/compensation **140/84**, accessibility shared-tab mode **156/100**; no per-frame normal-flow mutation above the active schedule ScrollView;
19. remove the obsolete wrapped-context runtime paths listed in §21 while preserving semantic native↔schedule anchor conversion;
20. enforce `maximumFontSizeMultiplier = 1.20` for Per-zender date/Primetime/Nu labels, keep them one line in the 52-pt context, and validate light/dark/system, substantive programme Dynamic Type, VoiceOver, TalkBack and Reduce Motion;
21. do not add swipe nudge, overflow button, arrows, fade masks or old exploration chrome;
22. run the implementation's normal automated/physical gates when Development occurs.

This design-spec increment changes no runtime code.

## 25. Frozen decisions explicitly preserved

This refinement does not reopen:

- fixed-row chronological Per-zender schedule;
- 52-pt standard-row geometry and **176-pt current-row geometry**;
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
- no duration-driven programme geometry;
- selected logo as sufficient visible channel identity in both expanded/rest and condensed states; no duplicate selected-channel text outside the rail.

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
- neither expanded/rest nor condensed state renders selected-channel text outside the persistent logo rail;
- 48×48 channel items remain unchanged through collapse;
- base condensed functional stack is **112** (60+52); temporal context remains exactly 52 pt; expanded gaps are **4/24**, condensed gaps are **0/0**; full visual contraction remains **140**, native collapse **56** and visual compensation **84** under the fixed-native-viewport architecture;
- date remains typographic and follows the accepted 06:00 label rule: `Vandaag`/`Morgen` only from 06:00–23:59, explicit weekday + date otherwise;
- Nu/Primetime states are derived from semantic schedule anchors, not last tap/pixels/tolerance windows;
- Nu away = elevated return action; Nu current = typographic current state + underline;
- Primetime inactive = light secondary action; Primetime current = primary current state + underline;
- active/current is never exposed as disabled;
- standard title is **17/21 500**;
- current title is **19/23 700**;
- time is **16/20 400**;
- description is **15/22 400**, max 4 lines + ellipsis;
- standard row remains **52** and title is geometrically centred with 21-pt line height;
- current row is **176** at fontScale 1.0, current top inset 14, title→description gap is 10, full-copy description→progress clearance stays at least 20 pt at every supported scale via the §14.2 content-safe minimum, and progress geometry remains 4 high / bottom16;
- all non-current rows remain equal at a given Dynamic Type scale;
- programme duration has zero effect on row height/spacing;
- every row uses one bottom separator;
- programme press uses temporary `surface` fill without card/radius/elevation;
- no schedule-wide now line, current card fill, red left rail, now-dot or hourly-grid dominance;
- light/dark/system use semantic tokens;
- Per-zender date/Primetime/Nu compact chrome is hard-capped at 1.20 and remains one line; no 88-pt/wrapped-context state or selected-channel injection exists; programme content retains substantive Dynamic Type; VoiceOver, TalkBack and Reduce Motion follow this specification;
- one-time swipe nudge and `•••` overflow remain absent;
- final physical comparison uses the exact canonical references plus the written 2026-09-17 and 2026-09-18 refinements, never a superseded runtime screenshot.
