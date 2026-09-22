# Nu & Straks — production convergence specification

Status: **CANONICAL PRODUCTION IMPLEMENTATION SPEC — owner-approved**
Date: 2026-09-18
Owner refinements: 2026-09-21 — temporal/density, accessibility, and final physical-composition refinements  
Kijktip refinement + production calibration: 2026-09-22

This document converts the accepted Nu & Straks direction into a production implementation contract. It is convergence, not redesign. Physical iPhone review of PR #96 exact head `224e7df1d47dbb5c42694cb36469de673496e7d5` accepted dark mode, Larger Text/Dynamic Type composition, vertical channel-position preservation, Nu, Primetime, the 15-minute rail and vertical :00/:15/:30/:45 ticks. The final owner refinement supersedes only three remaining presentation details: visible reference-time copy, the rail-bottom line treatment and reference→following visual rhythm. All other accepted Nu & Straks contracts remain frozen.

## 1. Authority

Reconcile implementation against, in this order:

1. explicit current owner corrections;
2. docs/PROJECT_STATE.md, docs/PRODUCT.md, docs/UX.md and accepted ADRs;
3. docs/VISUAL_BASELINE.md;
4. design/current/guide/NU_EN_STRAKS.md;
5. the exact canonical visual reference '/Teevee/Nu & Straks: Televiegids in beeld.png' (Library file id 'file_000000005b9c821080bc05914ea8c110');
6. docs/DESIGN_SYSTEM.md and design/current/TYPOGRAPHY.md;
7. this document for exact production convergence and implementation calibration;
8. existing runtime only as implementation evidence, never as design authority.

The canonical visual asset above remains the composition reference. This written specification supersedes it only for the explicitly documented production/accessibility calibrations and for later canonical product semantics such as ADR 0008.

## 2. Scope

This increment converges the already accepted Nu & Straks presentation to production quality.

Required:
- shared Guide-shell integration;
- one shared reference instant across all channels;
- live/browse semantics with Nu and Primetime;
- 06:00 Europe/Amsterdam television-day bounds;
- compact horizontal time rail with the already accepted fling/settle behaviour;
- stable vertical channel context while reference time changes;
- one dominant reference programme plus exactly three quieter following-programme slots;
- density/accessibility hardening without overlapping touch targets;
- Instrument Sans;
- light/dark/system;
- Dynamic Type and VoiceOver/TalkBack;
- Reduce Motion;
- safe-area correctness;
- direct Programme Detail round-trip;
- deterministic loading/empty/incomplete-data behaviour;
- preservation of the deferred NowNextGuideView module boundary.

Explicitly out of scope:
- independent date navigation;
- changing the three-presentation Guide IA;
- programme artwork;
- genre labels;
- progress bars;
- chevrons;
- repeated 'Daarna' labels;
- horizontal channel paging;
- recommendation or editorial modules;
- provider/data architecture changes;
- replacing the deferred import with a static startup import;
- changing Programme Detail scope.

## 3. Frozen interaction and information contract

Preserve:
- one reference instant drives every visible channel row;
- television day = 06:00 Europe/Amsterdam to 06:00 the following local day;
- midnight is not a Nu & Straks day boundary;
- 00:00–05:59 belongs to the preceding television day;
- Nu & Straks has no independent date selector;
- live mode follows the actual current instant and is never semantically rounded to a rail navigation increment;
- horizontal rail interaction leaves live mode and pins browse mode;
- Nu restores the actual current instant and containing television day;
- Primetime targets 20:30 on the active television day, including the preceding-evening 20:30 target between 00:00 and 05:59;
- vertical movement changes channel context only;
- horizontal movement in the time rail changes reference time only;
- channel order and vertical position stay stable while reference time changes;
- each channel exposes the reference programme plus exactly three following-programme slots;
- schedule membership uses start-inclusive/end-exclusive semantics;
- Programme Detail opens directly from any visible programme and returns to the same mounted Guide context.

Do not reinterpret implementation convenience as permission to change any of these contracts.

## 4. Current implementation defects that are not design questions

The production increment must correct these root-cause deviations rather than designing around them:

1. The current NowNextGuideView derives day bounds with the strict-midnight guideDayStart primitive. Nu & Straks must use the canonical 06:00 television-day semantics from ADR 0008.
2. Any refresh/day-rollover logic used by Nu & Straks must evaluate the television-day boundary rather than resetting at midnight.
3. The current standalone 'TEEVEE / Gids / Nu & Straks' header and floating presentation-selector path are prototype-era implementation evidence. Production Nu & Straks uses the canonical shared Guide shell.
4. Current 24-pt following-programme rows are below production touch-target requirements. Do not preserve them with overlapping hitSlop.
5. Current system-font/fontWeight styling is implementation debt; production uses the accepted Instrument Sans system.
6. The current opacity-heavy programme pressed state is prototype styling; production uses the accepted open-Guide transient surface treatment.

These are Development corrections, not owner decisions.

## 5. Shared Guide shell

Nu & Straks uses the same Guide chrome hierarchy as the other production Guide presentations.

### 5.1 Expanded/rest composition

From top to content:
1. top safe area;
2. shared brand/action chrome;
3. shared Guide presentation navigation with Nu & Straks selected;
4. utility-only Primetime/Nu context;
5. time rail;
6. vertically scrollable channel rows.

Shared metrics:
- horizontal screen inset: **20 pt**;
- brand top inset: **8 pt**;
- brand mark box: **56 × 44 pt**;
- Guide presentation navigation: **48 pt / one line through fontScale 1.35**;
- Guide presentation navigation: **64 pt / maximum two lines above 1.35**;
- expanded shared brand + presentation chrome: **100 pt standard / 116 pt Larger Text**, excluding top safe area;
- utility context: **52 pt at all font scales**;
- time rail: **52 pt**;
- persistent Nu & Straks functional stack: **104 pt at all font scales**.

Do not add a Nu & Straks-specific duplicate heading or a replacement reference-time lane.

### 5.2 Sticky/condensed composition

Vertical channel scrolling may condense only non-functional shared brand/presentation chrome.

The persistent functional stack is always:
1. Primetime/Nu utility context: **52 pt**;
2. time rail: **52 pt**.

Settled functional height: **104 pt**, excluding top safe area, at both standard and Larger Text settings.

Normal-motion calibration remains:
- native collapse distance: **56 pt**;
- disappearing shared chrome translate: max **12 pt** upward;
- no scroll-direction hide/reveal;
- no spring;
- stable visible channel/list anchor throughout collapse.

Fixed-native-viewport visual compensation remains derived solely from the responsive expanded GuideChrome:
- standard: **100 - 56 = 44 pt**;
- Larger Text: **116 - 56 = 60 pt**.

Rest/settled overlay endpoints:
- standard rest: **204 pt** = 100 GuideChrome + 104 functional stack;
- Larger Text rest: **220 pt** = 116 GuideChrome + 104 functional stack;
- settled: **104 pt** at all font scales.

Reduce Motion:
- discrete expanded/condensed switch at **28 pt** vertical schedule offset;
- preserve the same final utility/rail geometry.

## 6. Utility-only temporal context

There is **no standalone visible reference-time copy** in Nu & Straks.

Do not render:
- `Referentietijd`;
- `Nu · HH:MM`;
- a browse `HH:MM` value;
- an empty or hidden visual lane reserved for any of those values.

The selected/browsed time is read from the sticky time rail itself. The exact reference instant remains part of the internal Nu & Straks state and programme-resolution semantics.

The context is a fixed **52-pt** row at every supported font scale:
- horizontal insets: **20 pt**;
- only Primetime + Nu are visible;
- actions are trailing-aligned;
- action gap: **8 pt**;
- row is vertically centred.

Compact utility labels retain the hard **1.20** maximum font-size multiplier. This is already physically accepted and avoids reopening the approved Larger Text composition.

There is no separate VoiceOver/TalkBack focus stop for removed reference-time copy. Rail targets expose the browsed time; Nu retains its live/return action semantics.

### 6.1 Nu and Primetime geometry

Production calibration:
- visible control height: **36 pt**;
- effective touch target: minimum **44 pt on iOS / 48 dp on Android**;
- action gap: **8 pt**;
- visible radius where a return-action surface is used: **18 pt**;
- Primetime horizontal padding: **10 pt**;
- Nu horizontal padding: **12 pt**;
- label: **14/18, Instrument Sans Semibold**.

### 6.2 Nu and Primetime semantic states

Live:
- Nu = active/current;
- Primetime = action.

Browse at an ordinary reference time:
- Nu = return action;
- Primetime = action.

Browse at the active television day's 20:30 target:
- Primetime = active/current;
- Nu = return action.

If actual Now and the Primetime semantic context overlap, **Nu wins while the presentation is in live mode**.

Active/current is never disabled. Disabled is reserved for genuinely unavailable actions.

Current state must not rely on colour alone; expose selected/current semantics to accessibility. Active/current `Nu` must not reuse the return-to-live pill/surface treatment.

## 7. Time rail

### 7.1 Television-day slots

The rail covers exactly the active television day:
- start: 06:00 Europe/Amsterdam;
- end: 06:00 the following local date;
- navigation interval: **15 minutes**.

Therefore:
- 23-hour spring-DST television day: **92 slots**;
- normal 24-hour television day: **96 slots**;
- 25-hour fall-DST television day: **100 slots**.

Do not assume a fixed 24-hour duration.

### 7.2 Geometry

Production calibration:
- rail height: **52 pt**;
- quarter-hour slot width: **48 pt**;
- slot interactive height: **48 pt**;
- every slot remains an accessible time target, including unlabeled quarter hours;
- whole and half hours: visible **13/18** label, Instrument Sans Medium; selected label Semibold;
- whole/half-hour positional tick: **1 × 10 pt** semantic `railTick`, opacity **1.00**, directly beneath the label anchor;
- quarter-hour positional tick: **1 × 6 pt** semantic `railTick`, opacity **0.78**, no visible text label;
- semantic `railTick`: light **#80807A**, dark **#72726B**;
- selected/current reference marker: **2 × 12 pt**, semantic `currentTime`, opacity **1.00**, visually stronger than either hairline;
- horizontal rail-bottom line: **1 pt**, semantic `railTick`, opacity **0.78**, exactly matching quarter-hour tick colour/thickness/strength;
- viewport insets centre the first and last quarter-hour targets as well as interior targets.

The ticks and rail-bottom line belong only to the rail and do not continue through programme content. `railTick` is intentionally distinct from the quieter generic `border` separator token: these marks are positional navigation signals and must remain physically legible, especially in dark mode. Keep the approved 1-pt tick/baseline width; do not use a generic hairline or change the global `border` token.

### 7.3 Live positioning

Live reference time remains the actual current instant. Do not round live semantics to a 15-minute slot.

The rail may centre the nearest quarter-hour navigation target while the programme resolver uses the exact actual instant. There is no separate visible reference-time copy. Entering browse mode commits the settled quarter-hour target as the semantic reference.

### 7.4 Snap and physically accepted fling/settle contract

Preserve the interaction behaviour physically accepted after PR #24:
- native horizontal inertia;
- platform bounce/elasticity where appropriate;
- directional lock;
- fast rail deceleration;
- snap interval = **48 pt**, one 15-minute slot;
- beginning a user rail drag switches live → browse;
- programme/reference semantics do not update on every scroll frame;
- a fast drag commits from native momentum-end;
- end-drag commits only when effectively no momentum follows;
- **a rail-originated settled commit updates semantic reference state only and must not issue another programmatic scrollTo**;
- direct slot taps, Nu and Primetime may programmatically centre their target;
- no broad selected-slot effect may continuously fight native momentum.

This is a frozen interaction requirement, not an optional implementation style.

## 8. Channel-row layout

The accepted visual hierarchy is preserved, but programme targets become production-safe.

### 8.1 Horizontal geometry

Production calibration:
- screen left inset: **20 pt**;
- channel identity zone: **64 pt**;
- channel identity → programme gap: **16 pt**;
- programme content starts at **X = 100 pt**;
- programme right inset: **24 pt**.

These values keep channel identity visually distinct while aligning programme content with the established Guide system.

### 8.2 Base vertical geometry

Per channel at normal text:
- top padding: **8 pt**;
- reference-programme block: minimum **64 pt**;
- reference → following gap: **0 pt**;
- each following programme on iOS: minimum **44 pt**;
- each following programme on Android: minimum **48 dp**;
- following rows are directly adjacent: **0 pt additional inter-row gap**;
- bottom padding: **12 pt**.

Base channel-row height:
- iOS: **216 pt**;
- Android: **228 dp**.

The row total remains deliberately unchanged while the 4 pt formerly placed between reference and following content moves to the row bottom. This tightens the visible reference→following sequence without changing channel-position geometry or the three independent production-safe programme targets.

No cards, artwork, extra labels or decorative containers are added to justify the extra geometry.

## 9. Channel identity

Channel identity is optically associated with the reference programme rather than vertically centred across the entire tall channel row.

Production target:
- identity zone width: **64 pt**;
- logo max: **40 × 32 pt**, aspect-fit;
- preserve source proportions;
- never recolour or distort a broadcaster mark for consistency;
- use the same intentional fixed-geometry text fallback when a logo is unavailable;
- full channel display name remains available to accessibility.

Nu & Straks does not introduce channel-selection interaction inside this identity zone.

## 10. Reference programme

The reference programme remains the visual anchor for each channel.

Typography:
- title: **18/22, Instrument Sans Semibold**;
- maximum **2 lines** when the content-safe rule below permits;
- primary text colour;
- title block is **bottom-aligned** within the deterministic reference programme height;
- extra bottom inset: **0 pt**.

No visible end-time metadata is shown in the reference block. In ordinary continuous schedules, the first following programme's start time communicates the same boundary with less repetition.

Live/current state and full start/end time remain present in accessibility semantics. Browse mode likewise keeps the full start/end time available to accessibility and Programme Detail without rendering `tot HH:MM` in the row.

The full reference block is one programme button. Any two-line known-gap treatment uses the same bottom anchor so switching between programme/gap states does not reintroduce a large visual void before following content.

Do not add progress, genre, artwork, chevron, repeat metadata or a separate 'Nu bezig' badge.

### 10.1 Reference Kijktip editorial disclosure

When the reference programme has canonical `isKijktip = true`, add exactly one quiet metadata line **above** the reference title.

Frozen typography:
- literal label **`Kijktip`**;
- **12/16 Instrument Sans Medium**;
- semantic **`textSecondary`**;
- letterSpacing **0**;
- one line;
- no pill, icon, badge, accent colour, underline or independent interaction.

Reference Kijktip → title gap: **3 pt**, fixed structural spacing. It does **not** scale with Dynamic Type.

The Kijktip line and title form one bottom-aligned content stack. The reference Pressable, reference-block height helper and channel-row height remain authoritative; Kijktip does **not** introduce a Kijktip-specific height.

Let:
- `S = max(1, effectiveFontScale)`;
- `H = nowNextReferenceBlockHeight(S)` from the existing Nu & Straks geometry;
- Kijktip line-height = `16 × S`;
- title line-height = `22 × S`;
- structural gap = `3`.

For a Kijktip reference programme, the maximum title line count is:

`maxReferenceKijktipTitleLines = clamp(1, 2, floor((H - (16 × S) - 3) / (22 × S)))`

The actual title uses the lesser of:
- the natural title line requirement; and
- this content-safe maximum.

This rule is deliberate: **reference geometry never grows merely because Kijktip is present**, preserving the frozen vertical channel-position contract. When the label consumes the space that would otherwise hold a second title line, the title ellipsizes earlier instead of changing row geometry.

Representative calibration:

| S | H | Kijktip reference title allowance | Content-stack result |
| ---: | ---: | ---: | --- |
| 1.00 | 64 | **2 lines** | one-line title: stack top **23**; two-line title: stack top **1** |
| 1.35 | 64 | **1 line** | stack top **9.7** |
| 1.50 | 66 | **1 line** | stack top **6** |
| 2.00 | 88 | **1 line** | stack top **9** |

At S=1 with a two-line title:
- Kijktip line box Y **1…17**;
- gap Y **17…20**;
- title line boxes Y **20…64**.

At S=1 with a one-line title:
- Kijktip line box Y **23…39**;
- gap Y **39…42**;
- title line box Y **42…64**.

Do not reserve an empty Kijktip line when `isKijktip = false`; the existing non-Kijktip reference presentation remains unchanged.

## 11. Three following programmes — accepted density/accessibility refinement

There are always exactly three following **slots** in the channel-row geometry. Known programmes occupy those slots; missing programmes leave their slot empty and non-interactive.

This preserves stable vertical channel context while keeping the information hierarchy unchanged.

### 11.1 Standard text layout — fontScale <= 1.35

Each following target remains:
- time column width: **52 pt**;
- time → title gap: **8 pt**;
- time: **13/18, Instrument Sans Regular**, tabular numerals where supported;
- title: **15/20, Instrument Sans Medium**;
- title maximum **1 line**, tail ellipsis;
- complete target minimum **44 pt iOS / 48 dp Android**;
- **0 pt** interaction gap between adjacent targets.

Visible standard-text content uses a deterministic **progressive vertical cluster** inside the unchanged safe targets. Let:

`visibleSlack = followingTargetHeight - 20 pt`

where 20 pt is the maximum one-line visible content height from the 15/20 title line.

Apply these top offsets inside the target:
- following #1: `round(visibleSlack × 2/3)`;
- following #2: `round(visibleSlack × 1/3)`;
- following #3: `0`.

At base geometry this yields approximately:
- iOS 44-pt targets: **16 / 8 / 0 pt** top offsets and ~16-pt visible gaps;
- Android 48-dp targets: **19 / 9 / 0 dp** top offsets and ~18–19-dp visible gaps.

The compact continuation is therefore created by:
- bottom-aligning the reference title;
- removing the reference→following spacer;
- progressively lifting the three standard-text following content blocks through their existing target slack.

All visible content remains inside its own Pressable. Touch targets remain adjacent and non-overlapping. No extra separator is added between the three programmes.

### 11.2 Following Kijktip inline disclosure

When a following programme has canonical `isKijktip = true`, render `Kijktip` **inline directly after the programme title** inside the existing title lane.

Frozen typography:
- literal label **`Kijktip`**;
- **12/16 Instrument Sans Medium**;
- semantic **`textSecondary`**;
- letterSpacing **0**;
- one line;
- baseline aligned with the programme-title line on which it appears.

Inline title→Kijktip gap: **8 pt**, fixed structural spacing. It does **not** scale with Dynamic Type.

No new column is created. No row height changes. No Kijktip-specific second line is introduced.

#### Width reservation algorithm

The label must remain visible for long following titles. Do not rely on a plain nested Text layout that allows tail truncation to consume the Kijktip label.

For each following programme, define:
- `W` = width available to the title/Kijktip lane after the existing time column and existing time→title gap;
- `L` = intrinsic rendered width of the literal `Kijktip` at **12 pt Medium × S**;
- `G = 8 pt`;
- protected trailing reserve `R = L + G`;
- minimum visible final-line title budget = **48 pt**.

The **48-pt minimum is a visual readability floor**, not a touch target and not a new column.

Standard one-line mode:
1. protect `R` before laying out/truncating the title;
2. title maximum usable width = `W - R`;
3. short titles use their intrinsic width and Kijktip starts exactly **8 pt** after the visible title end;
4. long titles tail-ellipsize inside the protected title width; Kijktip starts **8 pt** after the ellipsis;
5. if the remaining title budget falls below **48 pt**, reduce the visible title to a single ellipsis `…` rather than hiding/clipping Kijktip.

The reserve is **not** a right-aligned Kijktip column: different title lengths produce different Kijktip X positions.

For a max-two-line title, the first line may use the full title lane. The protected reserve applies to the **final visible title line** so Kijktip can follow that line after the fixed 8-pt gap. Tail ellipsis, when required, belongs to the final title fragment before Kijktip.

Development may implement the final-line reservation with a deterministic native text-layout helper; no new dependency is required. The observable contract is the geometry above, not a particular measurement API.

### 11.3 Larger/accessibility text layout — fontScale > 1.35

The physically approved Larger Text composition remains frozen.

Primary accessibility composition is an **inline time + title flow**:
- start time retains **13/18 Regular, textMuted**;
- title retains **15/20 Medium, textSecondary**;
- inline time → title separation: **8 pt**;
- programme content keeps full Dynamic Type scaling;
- title may wrap so the combined visible programme occupies maximum **2 lines**;
- when Kijktip is present, the final visible title line uses the §11.2 protected reserve and Kijktip remains inline after that final title fragment;
- Kijktip remains substantive/uncapped at **12/16 Medium × S** and adds no vertical line because its 16-pt base line-height fits within the existing 20-pt title-line envelope;
- full programme title, Kijktip state and start/end times remain available to assistive technology;
- content block is vertically **centred** within its target; the standard-text progressive offsets do not apply above fontScale 1.35.

Content-safe following target height:

`max(platform minimum touch target, ceil(40 × fontScale + 8))`

The 8-pt term is **4 pt top + 4 pt bottom** content allowance. The time shares the first line with the title and therefore does not reserve a separate vertical line.

### 11.4 Extreme-width fallback

Only when **both** conditions apply:
- effective `fontScale > 2.0`; and
- available programme-content width is **< 180 pt**;

the target may fall back to stacked time then title:
- time line first;
- **3 pt** gap;
- title maximum 2 lines;
- when Kijktip is present, title + Kijktip use the same §11.2 final-line reservation inside the now-full programme width beneath the stacked time line;
- Kijktip adds no extra vertical line and no height term;
- 6 pt top + 6 pt bottom content padding;
- stacked content block remains vertically centred.

Fallback height:

`max(platform minimum touch target, ceil(18 × fontScale + 3 + 40 × fontScale + 12))`

This remains a last-resort width fallback, not the default Larger Text mode.

### 11.5 Non-overlap invariant

Following-programme targets must never overlap spatially.

Do not use oversized hitSlop that extends one programme target into an adjacent programme target.

Automated layout tests must prove non-overlap for standard, inline-accessibility and extreme fallback modes.

## 12. Deterministic channel-row height and stable vertical context

For a given platform, width and font scale, every channel row uses the same deterministic height.

Row height must **not** vary based on:
- programme title length;
- how many following programmes are currently known;
- whether a reference programme exists at the selected instant;
- whether reference or following programmes carry `isKijktip`;
- how many Kijktips are visible in the channel row;
- which rail slot/reference instant is selected.

Missing following programmes keep their geometry but render no visible placeholder copy and expose no action.

This invariant is required so changing reference time never shifts the user's vertical channel context.

## 13. Programme pressed and focus states

Reference and following programmes use the established open-Guide interaction language:
- full programme hit rectangle receives a temporary semantic 'surface' fill while pressed;
- no permanent fill;
- no card radius;
- no shadow/elevation;
- no chevron;
- no extra border;
- press fill clears immediately on release, cancel or gesture takeover.

Do not use strong whole-row opacity reduction as the primary pressed feedback.

Keyboard/focus treatment on platforms that expose focus must remain visible without changing row geometry.

## 14. Dynamic Type

Two deliberate categories apply.

### Compact functional chrome — hard 1.20 cap
- Guide presentation labels;
- Nu;
- Primetime;
- time-rail labels.

The physically accepted responsive shared presentation tabs remain:
- **48 pt / 1 line** at fontScale <=1.35;
- **64 pt / max 2 lines** above 1.35.

Nu & Straks itself no longer needs a Larger Text-specific temporal-context expansion because visible reference-time copy is gone:
- utility context = **52 pt at all font scales**;
- Primetime/Nu remain in the same compact capped row;
- time rail remains **52 pt**.

### Substantive content — no global cap
- reference programme title;
- reference programme time/status in accessibility semantics;
- reference/following Kijktip editorial metadata;
- following programme times;
- following programme titles;
- channel text fallback.

Above fontScale 1.35, following programmes retain the physically accepted inline two-line accessibility composition from §11.3. Kijktip remains inline after the final visible title fragment using the protected width reserve from §11.2. Stacked time/title remains reserved only for the extreme-width fallback in §11.4.

Kijktip has no compact-chrome cap. Its **12/16** typography scales with substantive content while its **3-pt reference gap** and **8-pt following inline gap** remain fixed structural spacings.

Do not solve density by clipping essential copy, reducing substantive font scaling or overlapping interaction areas.

## 15. Empty and incomplete data

### 15.1 Gap at the reference instant

When no programme covers the reference instant:
- retain the normal reference-block geometry;
- render:
  - 'Geen programma'
  - 'op dit tijdstip'
- use quiet secondary hierarchy;
- still surface up to the next three known programmes in the following slots.

Do not pretend the previous programme remains current.

### 15.2 Fewer than three following programmes

- render only known programmes;
- retain all three slot geometries;
- missing slots are visually empty and non-interactive;
- do not repeat 'Geen programma' in missing following slots;
- do not fabricate schedule items.

### 15.3 No usable schedule for the current dataset

When no usable schedule/fallback is available:
- keep shared Guide shell;
- keep Primetime/Nu controls;
- keep time rail;
- preserve any established channel catalogue;
- show one calm schedule availability state in the content region rather than repeating the same error in every channel row.

Fixture-first/hosted/fallback transitions must not transiently replace production styling with prototype styling.

### 15.4 Deferred module-load failure

The existing recoverable Nu & Straks load boundary remains:
- user-facing generic error;
- retry action;
- other Guide presentations remain usable;
- no raw exception text.

## 16. Programme Detail round-trip

Tap on any visible reference/following programme opens Programme Detail directly.

Closing Programme Detail preserves:
- active Guide presentation = Nu & Straks;
- live versus browse mode;
- exact reference instant;
- settled time-rail position;
- vertical channel scroll position.

Programme Detail personal-state changes such as Bewaar/Herinner mij must not be a reason to remount or rebuild Nu & Straks.

## 17. Gesture arbitration

Frozen gesture zones:
- horizontal gesture in the time rail → reference-time navigation;
- vertical gesture in the channel list → channel navigation;
- programme tap → Programme Detail;
- no horizontal adjacent-channel paging in Nu & Straks;
- directional locking remains active;
- a reference-time change must not move the vertical channel list;
- vertical channel scrolling must not change reference time.

The accessibility layout must not create cross-row or cross-zone gesture traps through overlapping hit areas.

## 18. Reduce Motion

Respect platform Reduce Motion:
- user-driven native scrolling remains native;
- explicit Nu, Primetime and direct slot taps may use a direct non-animated recenter;
- shared Guide chrome uses the discrete 28-pt expanded/condensed switch;
- no decorative crossfade between programme sets is required;
- no spring animation is introduced.

## 19. Light / Dark / System

The same layout, geometry, interaction states and touch targets apply in all appearance modes.

Use semantic theme tokens only.

Light:
- background: '#F7F7F5';
- primary text: '#171717';
- quiet secondary/muted tokens as defined by the theme;
- pressed programme: semantic 'surface';
- separators: semantic 'border';
- rail positional ticks: semantic `railTick` **#80807A** with major opacity 1.00 / quarter opacity 0.78;
- rail-bottom line: **1 pt railTick #80807A @ 0.78**, exactly matching quarter-hour tick strength;
- reference marker/current indicator: semantic 'currentTime'.

Dark:
- background: '#10100F';
- primary text: '#F4F4F1';
- same semantic hierarchy;
- pressed programme: semantic 'surface';
- rail positional ticks: semantic `railTick` **#72726B** with major opacity 1.00 / quarter opacity 0.78;
- rail-bottom line: **1 pt railTick #72726B @ 0.78**, exactly matching quarter-hour tick strength;
- no separate dark-mode composition.

System follows OS appearance without remounting or losing reference/channel context.

Existing provenance debt for RTL 4/RTL 5/SBS6 dark-background broadcaster assets remains separate. Do not recolour or fabricate marks.

## 20. Safe areas and bottom clearance

- apply top safe area exactly once;
- the persistent functional stack sits below the top safe area: **104 pt at all font scales**;
- no content may render behind the notch/Dynamic Island;
- bottom navigation remains stable;
- the last channel row can scroll fully clear of bottom navigation/home indicator;
- after accounting for navigation and safe area, retain at least **16 pt** visible clearance after the final channel row;
- do not double-apply bottom insets.

## 21. Accessibility semantics

Programme focus order within a channel:
1. reference programme;
2. following programme 1;
3. following programme 2;
4. following programme 3.

Channel identity does not need to become an extra focus stop between every programme; include the full channel name in programme labels.

Reference programme label includes, in order:
- full channel name;
- full programme title;
- literal **Kijktip** once when `isKijktip = true`;
- start and end time;
- current/live state when applicable.

Following programme label includes, in order:
- full channel name;
- full programme title;
- literal **Kijktip** once when `isKijktip = true`;
- start and end time.

Time slots:
- button role;
- label such as 'Tijd 20:30';
- selected state for the settled active navigation slot.

Nu/Primetime:
- button role;
- meaningful action label;
- selected/current semantic state when applicable;
- active/current is never disabled.

State never depends on colour alone.


The visible Kijktip Text is presentation-only inside the parent programme action and must not become a second VoiceOver/TalkBack focus stop. Progressive disclosure does not alter semantics: when the same broadcast moves from following to reference, it is still announced as Kijktip exactly once.

## 22. Deterministic test contract

Development must add coverage for at least:

1. 06:00→06:00 television-day bounds;
2. 00:00–05:59 membership in the preceding television day;
3. 05:59→06:00 rollover;
4. Primetime after midnight resolves to the preceding evening's 20:30;
5. 92/96/100 quarter-hour time-slot counts across 23/24/25-hour television days;
6. start-inclusive/end-exclusive reference semantics;
7. reference programme + exactly three following programmes;
8. honest gap + next three known programmes;
9. live versus browse state;
10. Nu active/current state;
11. Primetime active/current state;
12. Nu precedence when actual Now overlaps Primetime context;
13. stable channel-row height with missing following programmes;
14. minimum 44 pt iOS / 48 dp Android following targets;
15. no overlap between adjacent following targets;
16. standard following layout at fontScale <=1.35;
17. inline two-line following accessibility layout above 1.35;
18. stacked following fallback only when fontScale >2.0 and programme width <180 pt;
19. all three following content blocks are vertically centred without changing target geometry;
20. vertical channel position remains stable after reference changes;
21. rail-originated momentum settle updates state without secondary scrollTo;
22. no-momentum drag commit;
23. explicit slot/Nu/Primetime actions may centre their targets;
24. Reduce Motion action/collapse behaviour;
25. Programme Detail reference-programme round-trip;
26. Programme Detail following-programme round-trip;
27. incomplete/empty schedule behaviour;
28. light/dark semantic token usage;
29. deferred NowNextGuideView import remains deferred;
30. only whole/half-hour rail slots render text labels;
31. whole/half and quarter ticks remain 1 pt with 10/6 heights;
32. major tick uses `railTick` at 1.00 opacity and quarter tick at 0.78;
33. rail-bottom line uses **1 pt `railTick` @ 0.78** and never generic `border`/hairline treatment;
34. `railTick` resolves to #80807A light / #72726B dark;
35. no standalone visible reference-time text or reserved reference-time lane renders in live or browse;
36. reference programmes render no visible `tot HH:MM` metadata while accessibility retains start/end time;
37. base geometry remains reference min64 / reference→following0 / bottom12 / 44-or-48 following targets / 216-or-228 channel row;
38. reference title is bottom-aligned with zero extra bottom inset;
39. active/current Nu and return-to-live Nu render distinct state treatments;
40. shared Guide presentation nav remains 48/one-line through 1.35 and 64/max-two-lines above 1.35;
41. Nu & Straks utility context is exactly 52 pt at all font scales;
42. persistent Nu & Straks functional stack is exactly 104 pt at all font scales;
43. expanded rest overlay is 204 standard / 220 Larger Text and settled overlay is 104 in both modes;
44. fixed-native-viewport compensation remains 44 standard / 60 Larger Text while native collapse remains 56;
45. reference Kijktip typography is exactly 12/16 Instrument Sans Medium, textSecondary, letterSpacing0;
46. reference Kijktip gap is exactly 3 pt and does not scale;
47. reference Kijktip never changes reference/channel-row height;
48. reference Kijktip title-line allowance follows `clamp(1,2,floor((H-16S-3)/(22S)))`, yielding 2 lines at S1 and 1 line at S1.35/S1.5/S2;
49. reference S1 one-line/two-line stack tops are 23/1 respectively;
50. following Kijktip typography is exactly 12/16 Instrument Sans Medium, textSecondary, letterSpacing0;
51. following title→Kijktip inline gap is exactly 8 pt and does not scale;
52. following width reserve is intrinsic Kijktip width + 8 pt, with a 48-pt minimum final-line title budget;
53. long following titles ellipsize before the protected Kijktip label; Kijktip never disappears because of title truncation;
54. one, two and three visible following Kijktips do not change target/row geometry or progressive standard-text content offsets;
55. reference + following Kijktips may coexist without grouping, numbering or a shared label column;
56. the same broadcast can move from following inline disclosure to reference overline disclosure without semantic duplication;
57. above 1.35, Kijktip remains on the final visible title line of the existing max-two-line inline composition and adds no height term;
58. the >2.0/<180 stacked fallback keeps Kijktip inline with the title beneath the stacked time and adds no height term;
59. following Kijktip does not change the 44-pt iOS / 48-dp Android target minima or introduce hit overlap;
60. accessibility announces channel, title, Kijktip, start/end, then current state where applicable, with one programme focus target;
61. light/dark/system use semantic textSecondary with identical Kijktip geometry and no dedicated Kijktip colour token.

Time-sensitive tests use injected/fixed instants. No wall-clock sleeps.

## 23. Risk and implementation boundary

The runtime convergence is a **HIGH-risk Guide interaction increment** under docs/ENGINEERING_QUALITY_POLICY.md because it combines:
- nested horizontal/vertical gestures;
- physically proven native rail momentum behaviour;
- 06:00/DST time semantics;
- Dynamic Type-driven row geometry;
- Programme Detail context preservation;
- shared Guide-shell condensation;
- deferred module/startup behaviour.

Keep concerns separated:
- television-day/reference-time domain helpers;
- rail settle/state helpers;
- deterministic layout metrics/helpers;
- presentation component;
- shared Guide chrome;
- Programme Detail selection boundary.

Do not introduce unrelated Guide/data refactors.

## 24. Physical iPhone validation

The following are already physically accepted on PR #96 exact head `224e7df1d47dbb5c42694cb36469de673496e7d5` and remain frozen:
- dark mode;
- Larger Text / Dynamic Type composition;
- vertical channel-position preservation;
- Nu;
- Primetime;
- 15-minute rail;
- vertical :00/:15/:30/:45 tick visibility.

Renewed physical validation after Development reconciliation should therefore focus on the three refined details while confirming no regression to those frozen items:

1. No visible standalone reference-time value in live mode.
2. No visible standalone reference-time value in browse mode.
3. No empty 40-pt/88-pt reference-time lane remains at Larger Text.
4. Primetime/Nu stay in one **52-pt utility row** at standard and Larger Text settings.
5. Persistent Nu & Straks stack is **104 pt** at all font scales.
6. Larger Text shared Guide tabs remain the already accepted 64-pt/max-two-line composition.
7. Horizontal rail-bottom line is visually indistinguishable in colour/thickness/strength from the approved quarter-hour ticks: **1 pt railTick @0.78**.
8. Global separator/border appearance remains unchanged.
9. Reference title sits visibly toward the bottom of the reference block.
10. There is **0 pt** dedicated reference→following spacer.
11. First following programme reads as a direct compact continuation under the reference programme.
12. Following #1/#2/#3 visible content is centred inside three separate targets.
13. All three following programmes remain individually tappable with **44 pt iOS / 48 dp Android** minimum targets and no overlap.
14. Base channel row remains **216 pt iOS / 228 dp Android**; moving the former 4-pt transition to bottom padding causes no vertical channel-position regression.
15. Larger Text following composition remains the already accepted inline time+title treatment and does not regress to the rejected automatic stacked mode.
16. Programme Detail round-trip, rail fling/settle and Nu/Primetime semantics remain unchanged.
17. VoiceOver focus order contains no redundant removed reference-time focus stop; rail targets continue to expose browsed time.
18. Light/dark/system all preserve the refined geometry.

Physical Android interaction acceptance remains separately open until a physical Android device is available, as recorded in canonical project state.



### 24.1 Kijktip refinement validation

After Kijktip runtime implementation, physically validate on the exact iPhone implementation head:

1. Reference Kijktip reads as quiet metadata above the title; title remains the dominant visual anchor.
2. Reference Kijktip uses 12/16 Medium textSecondary with a visually consistent fixed 3-pt gap.
3. Base 64-pt reference geometry does not grow merely because Kijktip is present.
4. At S1, a one-line Kijktip reference title remains bottom anchored with the 23-pt stack top; a two-line title uses the full content-safe 63-pt stack without clipping.
5. At representative Larger Text, Kijktip remains readable and the title ellipsizes to the content-safe line count rather than growing the reference block.
6. Following Kijktip sits inline immediately after the title with an 8-pt visual gap, never as a right-aligned global column.
7. A long following title ellipsizes earlier while Kijktip remains fully visible.
8. The 48-pt final-line title readability floor produces a deliberate ellipsis rather than clipped glyph fragments.
9. One, two and three following Kijktips remain calm and scan as repeated metadata; they do not create a badge-like rhythm.
10. Reference and following Kijktips may appear simultaneously without changing the established reference/following hierarchy.
11. Moving the same programme from following to reference changes only Kijktip placement (inline → above title), not Kijktip semantics or programme interaction.
12. Above fontScale1.35, following Kijktip remains attached to the final visible title line inside the existing two-line inline composition.
13. In the >2.0/<180 fallback, time remains stacked first and Kijktip remains inline with the title below it; no Kijktip-only row is introduced.
14. iOS 44-pt following targets remain independently tappable and non-overlapping with multiple Kijktips.
15. VoiceOver announces Kijktip exactly once inside the programme action and never lands on the visual Kijktip label as a separate focus stop.
16. Light, dark and system appearance preserve identical geometry; textSecondary remains quiet but legible in both themes.
17. Vertical channel position, rail fling/settle, Nu, Primetime and Programme Detail round-trip remain unchanged.

Android physical validation repeats items 6–17 with 48-dp minimum targets when hardware is available.

## 25. Implementation calibration register

Values frozen by this owner-approved production refinement:

1. Shared Guide screen inset20; brand row52; presentation nav48 through fontScale1.35 / **64 above 1.35**, max two lines, compact label cap1.20.
2. Nu & Straks visible temporal context is **utility-only**: Primetime + Nu, height **52 pt at all font scales**; no standalone reference-time copy or reserved lane.
3. Persistent Nu & Straks functional stack: **52 utility + 52 rail = 104 pt at all font scales**.
4. Shared chrome native collapse56; max translate12; Reduce Motion switch28; visual compensation **44 standard /60 Larger Text**; rest overlay **204/220**, settled overlay **104**.
5. Nu/Primetime visible height36; gap8; platform touch minimum44/48; labels14/18 Semibold; active/current Nu and return-action Nu remain distinct.
6. Time rail: height52; quarter slot48×48; whole/half labels13/18 Medium, selected Semibold; major tick **1×10 railTick @1.00**; quarter tick **1×6 railTick @0.78**; horizontal bottom line **1 pt railTick @0.78**; marker2×12 currentTime; snap interval48.
7. `railTick`: **#80807A light / #72726B dark**; global `border` remains unchanged.
8. Channel geometry: left20; identity64; gap16; programme X100; right24.
9. Reference block min64; reference title18/22 Semibold max2, **bottom-aligned with 0 bottom inset**; no visible end-time metadata.
10. Reference→following dedicated gap = **0 pt**; channel bottom padding = **12 pt**, preserving base row totals.
11. Following standard targets: min44 iOS /48 Android; 0 interaction gap; time width52; gap8; time13/18 Regular; title15/20 Medium; visible content **centred in all three targets**.
12. Above fontScale1.35, following content retains the accepted inline time+title max-two-line composition, height `max(minTarget, ceil(40×fontScale+8))`.
13. Stacked following fallback remains only for fontScale>2.0 **and** available programme width<180, using §11.3.
14. Base channel row remains **216 iOS /228 Android** at normal font scale.
15. Three following slot geometries always remain reserved even when programme data is missing.
16. Programme press = transient semantic surface fill, no permanent card/opacity-first treatment.
17. No artwork, genres, progressbars, chevrons or repeated 'Daarna' labels.
18. NowNextGuideView remains behind deferred import.
19. Kijktip shared programme metadata typography: **12/16 Instrument Sans Medium**, semantic textSecondary, letterSpacing0, substantive/uncapped.
20. Reference Kijktip: above title; fixed **3-pt** gap; one-line label; bottom-aligned stack; no Kijktip-specific geometry; content-safe title-line formula `clamp(1,2,floor((H-16S-3)/(22S)))`.
21. Following Kijktip: inline after title; fixed **8-pt** gap; intrinsic-label-width reserve + 8; **48-pt** minimum final-line title budget; long title ellipsizes before Kijktip; no right-aligned label column.
22. Following Larger Text and extreme fallback retain existing heights; Kijktip occupies the title-line envelope and adds **0 pt** vertical height.
23. Kijktip never changes 44/48 following targets, reference/following Pressable ownership, channel-row height or stable vertical channel context.
24. Accessibility order for Kijktip programmes: channel → full title → Kijktip → start/end → current state when applicable; one focus target only.

Development must not choose alternatives locally. A future retune requires new owner-approved evidence and an update to this source of truth.

## 26. Frozen decisions explicitly preserved

This specification does not reopen:
- shared-reference-instant model;
- 06:00 television day;
- no independent Nu & Straks date selector;
- live/browse semantics;
- Nu;
- Primetime;
- horizontal time navigation;
- stable vertical channel context;
- reference programme + three following programmes;
- accepted time-rail fling/settle and mixed-gesture behaviour;
- direct Programme Detail;
- shared primary navigation;
- provider-independent data architecture;
- light/dark/system;
- Instrument Sans;
- deferred NowNextGuideView boundary.

## 27. Explicitly superseded production/runtime treatments

Do not treat these current/prototype runtime values as canonical:
- strict-midnight day bounds in NowNextGuideView;
- standalone 'TEEVEE / Gids / Nu & Straks' production header;
- floating bottom presentation selector for Nu & Straks;
- 24-pt following programme rows;
- overlapping hitSlop as an accessibility workaround;
- system-font/fontWeight programme styling instead of Instrument Sans;
- opacity 0.58 as the primary programme pressed state;
- a rail settle path that issues a second scrollTo after native snapping;
- layout that changes a channel row's height when programme availability/title length changes;
- 30-minute-only rail navigation;
- rail time labels without positional whole/half-hour and quarter-hour hairlines;
- generic low-contrast `border` as the rail-tick colour;
- a fixed 48-pt one-line shared Guide presentation row at fontScale >1.35;
- an 88-pt/two-lane Nu & Straks reference-time + utilities context at fontScale >1.35;
- any standalone visible Nu & Straks reference-time copy (`Nu · HH:MM` or browse `HH:MM`);
- an empty/reserved reference-time lane after removing that copy;
- generic `border`/hairline treatment for the horizontal rail-bottom line;
- a 4-pt dedicated reference→following spacer;
- top/centre/bottom following-content bias; all three following content blocks are now centred;
- automatic stacked time-above-title following layout for every fontScale >1.35;
- visible `Referentietijd` caption;
- visible reference-programme `tot HH:MM` metadata;
- default 72-pt reference block / 8-pt transition calibration;
- identical visual treatment for active/current `Nu` and return-to-live `Nu`;
- Kijktip badge/pill/icon/accent treatments;
- a separate following Kijktip column or right-aligned label rail;
- Kijktip-specific reference/following row-height growth;
- allowing long following titles to ellipsize away the Kijktip label;
- exposing visible Kijktip text as a separate accessibility focus stop.

The exact canonical visual remains accepted for composition and hierarchy outside the explicit production refinements above.
