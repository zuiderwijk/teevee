# Nu & Straks — production convergence specification

Status: **CANONICAL PRODUCTION IMPLEMENTATION SPEC — owner-approved**
Date: 2026-09-18
Owner refinements: 2026-09-21 — temporal/density refinement plus post-PR #96 physical refinement

This document converts the accepted Nu & Straks direction into a production implementation contract. It is convergence, not redesign. Physical iPhone review of PR #96 exact head `32db9459d265e8546c7137baf82e623f015ad652` rejected only rail-tick legibility, larger-text composition and the perceived rhythm of the three following programmes. The post-PR #96 owner refinement below supersedes only those calibrations; all other accepted Nu & Straks contracts remain frozen.

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

### 5.1 Standard expanded/rest composition — fontScale <= 1.35

From top to content:
1. top safe area;
2. shared brand/action chrome;
3. shared Guide presentation navigation with Nu & Straks selected;
4. reference-time context;
5. time rail;
6. vertically scrollable channel rows.

Standard metrics:
- horizontal screen inset: **20 pt**;
- brand top inset: **8 pt**;
- brand mark box: **56 × 44 pt**;
- Guide presentation navigation: **48 pt**, one-line labels;
- expanded shared brand + presentation chrome: **100 pt**, excluding top safe area;
- reference-time context: **52 pt**;
- time rail: **52 pt**;
- persistent functional stack: **104 pt**.

Do not add a Nu & Straks-specific duplicate heading below the shared presentation navigation.

### 5.2 Responsive accessibility composition — fontScale > 1.35

Physical iPhone evidence proves that keeping the shared presentation tabs and Nu & Straks temporal controls inside the standard one-line geometry causes unacceptable truncation.

The shared Guide presentation selector therefore uses its accepted accessibility state:
- navigation height: **64 pt**;
- visible labels remain `Totaal`, `Per zender`, `Nu & Straks`; do not abbreviate them;
- labels may use **maximum 2 lines**;
- text remains centred;
- compact-label `maximumFontSizeMultiplier = 1.20` remains in force;
- the full 64-pt tab remains the interactive target;
- selected indicator remains the canonical **2.5-pt** underline treatment.

The brand row remains **52 pt**, so expanded shared brand + presentation chrome becomes **116 pt**.

Nu & Straks reference context becomes **88 pt** in this mode:
- upper reference-time lane: **40 pt**;
- lower utilities lane: **48 pt**.

The rail remains **52 pt**. The persistent functional stack is therefore **140 pt** in accessibility mode.

This is responsive accessibility composition, not a separate product state.

### 5.3 Sticky/condensed composition

Vertical channel scrolling may condense only non-functional shared brand/presentation chrome.

Persistent functional stack:
- standard mode: **52 reference + 52 rail = 104 pt**;
- accessibility mode: **88 reference/utilities + 52 rail = 140 pt**.

No date row, selected-channel label, compact channel title or other extra context is added.

Normal-motion calibration remains:
- native collapse distance: **56 pt**;
- disappearing shared chrome translate: max **12 pt** upward;
- no scroll-direction hide/reveal;
- no spring;
- stable visible channel/list anchor throughout collapse.

Fixed-native-viewport visual compensation is derived from the responsive expanded GuideChrome:
- standard: **100 - 56 = 44 pt**;
- accessibility: **116 - 56 = 60 pt**.

Reduce Motion:
- discrete expanded/condensed switch at **28 pt** vertical schedule offset;
- preserve the applicable standard/accessibility final geometry.

## 6. Reference-time context

The former `Referentietijd` caption remains removed.

### 6.1 Standard mode — fontScale <= 1.35

The context is a fixed **52-pt** horizontal row with **20-pt** horizontal insets.

Left:
- value: **18/22, Instrument Sans Semibold**;
- live: `Nu · HH:MM`, using the exact actual minute;
- browse: `HH:MM`, using the settled 15-minute browse reference.

Right:
- Primetime + Nu in the same row.

The value is vertically centred. Do not replace the removed caption with another explanatory label.

### 6.2 Accessibility mode — fontScale > 1.35

The context becomes **88 pt**, split into two non-competing lanes.

Upper reference lane — **40 pt**:
- left inset **20 pt**;
- same `Nu · HH:MM` / `HH:MM` copy;
- **18/22 Semibold**;
- one line;
- tabular numerals where supported.

Lower utility lane — **48 pt**:
- Primetime + Nu align to the trailing side;
- same **8-pt** inter-control gap;
- same 36-pt visible controls;
- same platform-safe 44/48 touch targets;
- same semantic states.

All compact reference/utility chrome keeps the hard **1.20** maximum font-size multiplier. Programme content remains substantive and uncapped.

### 6.3 Nu and Primetime geometry

Production calibration:
- visible control height: **36 pt**;
- effective touch target: minimum **44 pt on iOS / 48 dp on Android**;
- action gap: **8 pt**;
- visible radius where a return-action surface is used: **18 pt**;
- Primetime horizontal padding: **10 pt**;
- Nu horizontal padding: **12 pt**;
- label: **14/18, Instrument Sans Semibold**.

### 6.4 Nu and Primetime semantic states

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
- whole/half-hour positional tick: **1 × 10 pt** semantic `border` hairline, directly beneath the label anchor;
- quarter-hour positional tick: **1 × 6 pt** semantic `border` hairline, no visible text label;
- selected/current reference marker: **2 × 12 pt**, semantic `currentTime`, visually stronger than either hairline;
- viewport insets centre the first and last quarter-hour targets as well as interior targets.

The hairlines belong only to the rail and do not continue through programme content.

### 7.3 Live positioning

Live reference time remains the actual current instant. Do not round live semantics to a 15-minute slot.

The rail may centre the nearest quarter-hour navigation target while the visible live copy and programme resolver use the exact actual instant. Entering browse mode commits the settled quarter-hour target as the semantic reference.

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
- reference → following gap: **4 pt**;
- each following programme on iOS: minimum **44 pt**;
- each following programme on Android: minimum **48 dp**;
- following rows are directly adjacent: **0 pt additional inter-row gap**;
- bottom padding: **8 pt**.

Base channel-row height:
- iOS: **216 pt**;
- Android: **228 dp**.

This is deliberately denser than the 18 September calibration while preserving three independent production-safe programme targets. Do not compress the following targets below their platform minima.

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
- maximum **2 lines**;
- primary text colour.

No visible end-time metadata is shown in the reference block. In ordinary continuous schedules, the first following programme's start time communicates the same boundary with less repetition.

Live/current state and full start/end time remain present in accessibility semantics. Browse mode likewise keeps the full start/end time available to accessibility and Programme Detail without rendering `tot HH:MM` in the row.

The full reference block is one programme button.

Do not add progress, genre, artwork, chevron, repeat metadata or a separate 'Nu bezig' badge.

## 11. Three following programmes — accepted density/accessibility refinement

There are always exactly three following **slots** in the channel-row geometry. Known programmes occupy those slots; missing programmes leave their slot empty and non-interactive.

This preserves stable vertical channel context while keeping the information hierarchy unchanged.

### 11.1 Normal text layout

At effective font scale **≤ 1.35**:
- one horizontal row;
- time column width: **52 pt**;
- time → title gap: **8 pt**;
- time: **13/18, Instrument Sans Regular**, tabular numerals where supported;
- title: **15/20, Instrument Sans Medium**;
- title: maximum **1 line**, ellipsis at tail;
- the complete row is one non-overlapping programme button;
- row minimum = **44 pt iOS / 48 dp Android**.

### 11.2 Larger/accessibility text layout

At effective font scale **> 1.35**:
- switch each following slot to a stacked layout;
- start time appears first;
- **3 pt** time → title gap;
- title may use maximum **2 lines**;
- both time and title keep substantive Dynamic Type;
- do not shrink text to retain screenshot density.

Content-safe row height is:

max(platform minimum touch target,
ceil(18 × fontScale + 3 + 40 × fontScale + 12))

The 12 pt term represents 6 pt top + 6 pt bottom content padding.

Rows therefore grow substantially at accessibility sizes. This is intentional: legibility and separate touch targets take precedence over showing more channels per viewport.

### 11.3 Non-overlap invariant

Following-programme targets must never overlap spatially.

Do not use oversized hitSlop that extends one programme target into an adjacent programme target.

Automated layout tests should prove non-overlap for supported font-scale/layout modes.

## 12. Deterministic channel-row height and stable vertical context

For a given platform, width and font scale, every channel row uses the same deterministic height.

Row height must **not** vary based on:
- programme title length;
- how many following programmes are currently known;
- whether a reference programme exists at the selected instant;
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
- reference-time value;
- Nu;
- Primetime;
- time-rail labels.

### Substantive content — no global cap
- reference programme title;
- reference programme time/status;
- following programme times;
- following programme titles;
- channel text fallback.

Substantive content adapts by increasing geometry and, for following rows, switching to the accepted stacked layout above fontScale 1.35.

Do not solve density by clipping essential copy or overlapping interaction areas.

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
- keep reference controls;
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
- reference marker/current indicator: semantic 'currentTime'.

Dark:
- background: '#10100F';
- primary text: '#F4F4F1';
- same semantic hierarchy;
- pressed programme: semantic 'surface';
- no separate dark-mode composition.

System follows OS appearance without remounting or losing reference/channel context.

Existing provenance debt for RTL 4/RTL 5/SBS6 dark-background broadcaster assets remains separate. Do not recolour or fabricate marks.

## 20. Safe areas and bottom clearance

- apply top safe area exactly once;
- the persistent 104-pt functional stack sits below the top safe area;
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

Reference programme label includes:
- full channel name;
- full programme title;
- start and end time;
- current/live state when applicable.

Following programme label includes:
- full channel name;
- full programme title;
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
15. no overlap between adjacent following programme targets;
16. horizontal normal layout at fontScale ≤1.35;
17. stacked following layout at fontScale >1.35;
18. vertical channel position remains stable after reference changes;
19. rail-originated momentum settle updates state without secondary scrollTo;
20. no-momentum drag commit;
21. explicit slot/Nu/Primetime actions may centre their targets;
22. Reduce Motion action/collapse behaviour;
23. Programme Detail reference-programme round-trip;
24. Programme Detail following-programme round-trip;
25. incomplete/empty schedule behaviour;
26. light/dark semantic token usage;
27. deferred NowNextGuideView import remains deferred;
28. only whole/half-hour rail slots render text labels;
29. whole/half-hour and quarter-hour ticks use distinct accepted hairline lengths;
30. live `Nu` copy uses the exact current minute while browse commits quarter-hour references;
31. reference programmes render no visible `tot HH:MM` metadata while accessibility retains start/end time;
32. default reference/following geometry uses the accepted 64/4/44-or-48 compact calibration;
33. active/current `Nu` and return-to-live `Nu` render distinct state treatments.

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

Physical validation on the exact implementation head must include:

1. Light/live state against the canonical Nu & Straks visual plus the 21 September refinement: exact `Nu · HH:MM`, no `Referentietijd` caption, quarter-hour ticks and no visible reference `tot` metadata.
2. Dark/live state with identical geometry and hierarchy.
3. Primetime jump to 20:30 and correct browse/current semantics.
4. Ordinary browse time: Nu becomes the clear return action.
5. Slow rail drag settles to one unambiguous **15-minute** slot; whole/half-hour labels and quarter-hour-only ticks remain visually clear.
6. Repeated hard fling + reversal reproducing the old PR #24 failure pattern: no oscillation, tug-of-war or inescapable slot.
7. Direct time-slot tap changes the programme set once and centres calmly.
8. Stable vertical context: scroll midway down the channel list, then change reference through rail, Primetime and Nu; the same channel context remains in the viewport.
9. All three following programmes can be tapped individually without an adjacent programme opening.
10. Default text remains visually compact/premium: 64-pt reference block, 4-pt transition and directly adjacent following targets without visual crowding.
11. Representative ~135% text shows no clipping/overlap.
12. Accessibility text >1.35 switches following programmes to stacked layout with fully separate targets.
13. VoiceOver focus order and labels for reference/following programmes, rail slots, Nu and Primetime.
14. Reduce Motion: direct action recentering and discrete shell condensation without unnecessary animation.
15. Programme Detail round-trip from reference programme preserves exact context.
16. Programme Detail round-trip from each following programme preserves exact context.
17. Gap state renders honestly while next known programmes remain usable.
18. Partial following data does not shift channel-row geometry.
19. Top/bottom safe areas: no obstruction by notch/Dynamic Island/home indicator/navigation.
20. Persisted Nu & Straks preference still respects the deferred module boundary during startup.
21. Realistic channel count/density scrolls acceptably at normal and accessibility text sizes.

Physical Android interaction acceptance remains separately open until a physical Android device is available, as recorded in canonical project state.

## 25. Implementation calibration register

Values frozen by this owner-approved production refinement:

1. Shared Guide screen inset 20; shared brand box 56×44; presentation navigation 48.
2. Persistent Nu & Straks functional chrome: 52 reference context + 52 time rail = **104 pt**.
3. Shared chrome collapse: 56-pt vertical distance; max 12-pt upward translation; Reduce Motion discrete switch at 28.
4. Reference-time value 18/22 Semibold with no caption; compact chrome max multiplier 1.20; live value uses exact actual minute.
5. Nu/Primetime visible height 36; gap 8; platform touch minimum 44/48; labels 14/18 Semibold; active/current Nu and return-action Nu are visibly distinct.
6. Time rail: height 52; quarter slot 48×48; whole/half labels 13/18 Medium, selected Semibold; major hairline 1×10; quarter hairline 1×6; marker 2×12; snap interval 48.
7. Channel geometry: left inset 20; identity zone 64; gap 16; programme X100; right inset24.
8. Reference block min64; reference title18/22 Semibold max2; no visible end-time metadata; reference→following gap4.
9. Following rows: min44 iOS /48 Android; 0 additional inter-row gap; time width52; gap8; time13/18 Regular; title15/20 Medium.
10. Following accessibility switch: fontScale >1.35 → stacked time/title, 3-pt gap, title max2; content-safe formula from §11.2.
11. Base channel row: 216 iOS /228 Android at normal font scale.
12. Three following slot geometries always remain reserved even when programme data is missing.
13. Programme press = transient semantic surface fill, no permanent card/opacity-first treatment.
14. No artwork, genres, progressbars, chevrons or repeated 'Daarna' labels.
15. NowNextGuideView remains behind deferred import.

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
- visible `Referentietijd` caption;
- visible reference-programme `tot HH:MM` metadata;
- default 72-pt reference block / 8-pt transition calibration;
- identical visual treatment for active/current `Nu` and return-to-live `Nu`.

The exact canonical visual remains accepted for composition and hierarchy outside the explicit production refinements above.
