# Teevee — Totaal production visual convergence

Status: **OWNER-APPROVED PRODUCTION SPECIFICATION — CANONICAL ON MERGE; DO NOT IMPLEMENT BEFORE MERGE**
Date: 2026-09-21
Owner-approved: 2026-09-21
Micro-programme refinement owner-approved: 2026-09-21
Canonical visual baseline: 2026-09-21

This document converts the owner-approved Totaal production visual into one concrete production implementation contract. It is accepted-design convergence, not exploration and not runtime implementation.

After merge, this owner-approved document is the single Totaal-specific visual handoff for Development. It does not reopen the already proven Totaal interaction, television-day, Programme Detail or programme-windowing architecture.

## 1. Authority

Reconcile Totaal implementation against, in this order:

1. current explicit owner corrections;
2. docs/PROJECT_STATE.md, docs/PRODUCT.md, docs/UX.md and accepted ADRs for product/interaction semantics;
3. docs/VISUAL_BASELINE.md;
4. design/current/guide/TOTAAL.md;
5. the exact canonical visual '/Teevee/Totaal production design - light dark expanded condensed.png' (Library file id 'file_00000000aafc8230b3218e6577a1d912');
6. design/current/guide/GUIDE_DAY_SELECTOR.md;
7. docs/DESIGN_SYSTEM.md and design/current/TYPOGRAPHY.md;
8. this document for exact Totaal production calibration;
9. current runtime only as implementation evidence.

The canonical board remains authoritative for composition and hierarchy. This written specification supplies the exact metrics, responsive rules, states, edge cases and acceptance criteria the board intentionally left open.

## 2. Scope

Required:
- shared Guide shell integration;
- accepted compact day selector + separate Nu action;
- sticky/condensed functional context;
- open 2D schedule canvas;
- exact production row/rail/time-axis geometry;
- programme typography and width-aware degradation;
- restrained actual-current treatment;
- compact current-time axis marker;
- logo-first channel rail;
- light/dark/system;
- Dynamic Type;
- VoiceOver/TalkBack;
- Reduce Motion;
- safe-area and bottom-navigation ownership;
- loading/hosted/fallback visual continuity;
- physical iPhone validation criteria.

Explicitly out of scope:
- changing horizontal=time / vertical=channels;
- changing real-duration horizontal programme geometry;
- changing native horizontal inertia/bounce, normal native vertical scrolling/fling/deceleration or directional lock; Totaal's intentional vertical endpoint no-overscroll exception is itself frozen;
- replacing EdgeReadabilityOverlay / left-edge masking mechanics;
- changing the stable viewed-time anchor semantics;
- changing D-2..D+7 or the 06:00 television day;
- changing Programme Detail scope/round-trip;
- changing provider/data architecture;
- changing bounded horizontal programme windowing;
- changing bottom-nav information architecture;
- changing Nu & Straks deferred loading;
- adding artwork, genres, recommendations or programme progress bars.

## 3. Frozen interaction/data/performance contracts

Preserve:
- horizontal schedule movement = time navigation;
- vertical movement = channel navigation;
- real startAt/endAt define programme X and width;
- native horizontal schedule/time-axis inertia and bounce;
- native vertical schedule scrolling, fling and deceleration, with **vertical endpoint overscroll/rubber-band intentionally disabled in Totaal** because physical iPhone validation rejected schedule/channel-only displacement beneath the fixed date/Nu/time-axis/Guide chrome stack;
- this vertical endpoint exception is Totaal-only and does not change Per zender or Nu & Straks;
- directional lock;
- current stable Totaal viewed-time anchor inset: **120 pt** into the programme viewport;
- visible day derives from that stable viewed-time anchor, not from a sliver at the viewport edge;
- crossing 06:00 with the stable anchor changes date context;
- real-clock 06:00 rollover alone does not move a stationary Totaal anchor;
- day change preserves Amsterdam wall-clock time where practical;
- Nu restores the actual instant and containing television day;
- D-2..D+7 bounded day selector;
- direct Programme Detail;
- mounted Guide/context-preserving Detail round-trip;
- coarse viewport-bucket programme windowing and overscan;
- no per-frame JS/React state ownership of horizontal scroll position;
- existing partial-left programme readability;
- fixture-first / hosted schedule boundary.

Visual convergence must fit this architecture rather than replacing it.

## 4. Current runtime evidence that is not canonical visual design

The current Totaal runtime still contains prototype-era visual treatment:

1. standalone TEEVEE / Gids header instead of shared GuideChrome;
2. floating bottom Guide-presentation pill;
3. old default date copy that can include a redundant suffix after Vandaag/Morgen;
4. permanent rounded/filled programme cards;
5. current-programme in-cell progress bars;
6. full-height red now line through programme rows;
7. visible ZENDER corner heading;
8. duplicate visible channel captions under successful logos;
9. system-font programme typography rather than the accepted Instrument Sans hierarchy.

These are visual implementation deltas. They do not reopen frozen interaction/data mechanics.

## 5. Production coordinate system

At fontScale 1.0:

- screen horizontal inset for shared Guide chrome: **20 pt**;
- channel rail width: **84 pt**;
- programme viewport begins at X = **84 pt**;
- base channel row height: **76 pt**;
- horizontal scale: **3.00 pt per real minute**;
- 15-minute duration = 45 pt;
- 30-minute duration = 90 pt;
- programme geometry uses exact real duration;
- permanent programme-card gap: **0 pt**.

The 84 / 76 / 3.00 calibration is retained because it aligns with the accepted board and the already-proven Totaal gesture/windowing geometry. The visual redesign does not need a new schedule zoom level.

## 6. Shared Guide shell

Totaal uses the same GuideChrome and shared presentation selector as Per zender and Nu & Straks.

### 6.1 Expanded/rest

Below the top safe area:

1. shared brand/action row;
2. shared Guide presentation tabs;
3. Totaal day/Nu context;
4. Totaal time axis;
5. schedule canvas.

Shared shell metrics:
- brand row: **52 pt**;
- presentation tabs: **48 pt** through effective fontScale 1.35;
- presentation tabs: **64 pt**, max two lines, above 1.35;
- shared expanded GuideChrome: **100 pt standard / 116 pt Larger Text**;
- screen inset: **20 pt**;
- compact shared tab label cap: **1.20**.

Do not render a separate Gids heading and do not render a floating Guide selector near bottom navigation.

### 6.2 Persistent Totaal functional stack

The Totaal-specific sticky stack is constant at every font scale:

- day + Nu context: **52 pt**;
- time axis: **44 pt**;
- total: **96 pt**.

Compact day/Nu/axis chrome may use the existing **1.20 maximumFontSizeMultiplier**. Programme content may not.

### 6.3 Condensed/scrolled

Vertical channel scrolling removes the complete non-functional GuideChrome:
- tv. brand disappears;
- Search/settings actions disappear;
- Guide presentation tabs disappear;
- no compact tv. mark remains.

The 96-pt functional stack stays visible.

Settled viewport top, excluding safe area: **96 pt**.

### 6.4 Collapse calibration

Use the fixed-native-viewport / collapse-isolation pattern already proven in the Guide.

Normal motion:
- native collapse distance: **56 pt**;
- shared GuideChrome max upward translate: **12 pt**;
- no direction-based hide/reveal;
- no spring;
- active vertical ScrollView viewport stays fixed during visual collapse.

Standard:
- full visual contraction: **100 pt**;
- native contribution: **56 pt**;
- visual compensation: **44 pt**;
- rest overlay bottom: **196 pt** = 100 + 96;
- settled overlay bottom: **96 pt**.

Above fontScale 1.35:
- full visual contraction: **116 pt**;
- native contribution: **56 pt**;
- visual compensation: **60 pt**;
- rest overlay bottom: **212 pt** = 116 + 96;
- settled overlay bottom: **96 pt**.

At progress p, native movement and visual compensation together account for the complete disappearing GuideChrome height. Do not mutate normal-flow sibling heights above the active vertical ScrollView per frame.

Reduce Motion:
- discrete expanded/condensed switch at **28 pt** vertical schedule offset;
- same final geometry;
- no spring/crossfade.

## 7. Safe-area and bottom-navigation ownership

- apply the top safe area exactly once at the Guide root;
- GuideChrome and the 96-pt functional stack live below it;
- schedule content never renders under the notch/Dynamic Island;
- bottom navigation is owned by the app shell;
- do not recreate or visually duplicate bottom navigation inside Totaal;
- do not double-apply bottom safe-area inset;
- the last channel row must remain fully scrollable clear of bottom navigation/home indicator;
- after the final row, retain at least **16 pt** usable visual clearance once app-shell occupancy is accounted for.

## 8. Day + Nu context

Height: **52 pt**.
Horizontal inset: **20 pt**.

Layout:
- day selector leading;
- Nu trailing;
- both vertically centred;
- no second row at Larger Text;
- within the supported compact 1.20 text cap, the day label + chevron and `Nu` keep their intrinsic one-line width when the 52-pt row has sufficient horizontal room;
- `Nu` must never ellipsize; the day label must not truncate merely because sibling flex allocation shrinks it while unused row width exists.

### 8.1 Day selector

Visible treatment:
- primarily typographic;
- no permanent pill/card;
- label: **15/20 Instrument Sans Semibold**;
- maximumFontSizeMultiplier: **1.20**;
- chevron: **14/16 Instrument Sans Semibold**;
- label→chevron gap: **6 pt**;
- platform-safe target: minimum **44 pt iOS / 48 dp Android**.

Wording is frozen by GUIDE_DAY_SELECTOR.md:
- 06:00–23:59: current television day = Vandaag; next = Morgen;
- all other days = abbreviated weekday + date, e.g. Zo 20 sep;
- 00:00–05:59: explicit weekday + date for every day; no Vandaag/Morgen.

Do not show 'Vandaag · di 15 sep' or equivalent redundant suffix in Totaal.

### 8.2 Nu

Totaal Nu is a persistent recenter action, not a second representation of current-programme state.

Visible geometry:
- visible height: **36 pt**;
- minimum visible width: **48 pt**;
- effective target: minimum **44 pt iOS / 48 dp Android**;
- horizontal padding: **12 pt**;
- radius: **10 pt**;
- border: **1 pt semantic border**;
- label: **14/18 Instrument Sans Semibold**;
- maximumFontSizeMultiplier: **1.20**;
- normal background: transparent;
- pressed background: semantic surfaceElevated;
- pressed feedback clears immediately on release/cancel.

Nu remains enabled when already near now; tapping is allowed to re-centre exactly. Do not introduce a disabled state merely because the current programme is visible.

## 9. Time axis

The time axis is part of the 96-pt sticky Totaal functional stack.

Geometry:
- height: **44 pt**;
- fixed channel-axis corner width: same **84 pt** channel rail;
- corner contains no visible ZENDER label;
- programme-axis begins at X=84;
- no heavy bar fill.

### 9.1 Tick cadence

Generate real-time positions every **15 minutes**.

Visible hierarchy:
- whole/half-hour ticks: **1 × 10 pt**, semantic railTick, opacity **0.78**;
- quarter-hour ticks: **1 × 6 pt**, semantic railTick, opacity **0.50**;
- axis bottom baseline: **1 pt**, semantic railTick, opacity **0.42**;
- labels only on :00 and :30;
- :15/:45 remain unlabeled.

Keep tick width 1 pt. Do not draw these marks through programme rows.

### 9.2 Axis labels

- **11/14 Instrument Sans Medium**;
- semantic textMuted;
- centred on their tick;
- compact font cap: **1.20**;
- tabular numerals where reliably supported;
- no label background/pill.

Existing left-edge label masking/readability remains frozen.

### 9.3 DST

The axis represents real instants across Europe/Amsterdam DST transitions:
- no fixed-24-hour assumption;
- spring/fall television days may contain 23/25 real hours;
- duplicate fall-back local clock labels represent distinct instants and must not be merged;
- programme positions remain based on timestamps, not label strings.

## 10. Current-time marker

When the actual current instant lies inside the mounted Totaal timeline window, render one compact marker on the time axis.

Geometry:
- pointer X = exact actual current instant;
- marker body height: **18 pt**;
- minimum readable label box: **38 pt**;
- horizontal padding: **5 pt per side**, outside that readable label box;
- actual outer body width: **48 pt** at base compact scale and **56 pt** at the existing **1.20** compact scale cap;
- radius: **5 pt**;
- pointer/notch: **6 × 4 pt**;
- label: full actual local **HH:MM**; it must never ellipsize or shrink to a partial value such as `00:…`;
- label: **10/12 Instrument Sans Semibold**;
- compact font cap: **1.20**;
- marker fill: semantic currentTime;
- marker label foreground: semantic **onCurrentTime = #0D0D0D** in both themes.

`#0D0D0D` is intentional: it keeps the small marker label above 4.5:1 against both accepted currentTime fills (`#D64B42` light and `#F06B61` dark). The generated board's light label is compositional reference, not authority where it misses production contrast.

Behaviour:
- the Guide clock uses wall-clock phase-aligned refresh scheduling; at the current 30-second cadence ticks target real `:00` and `:30` boundaries so `HH:MM` advances on the actual minute boundary;
- AppState → active refreshes `Date.now()` immediately and restarts one aligned timer; background/unmount clears the pending timer so drift and duplicate timers do not accumulate;
- the pointer remains at the exact time coordinate;
- viewport edge clamping uses the actual outer body width; the body may clamp within the visible programme-axis viewport while the pointer remains exact and must never move with that clamp;
- marker may visually occlude the local axis label; do not shift the entire axis to avoid it;
- when now lies outside the loaded window, render no current-time marker;
- no full-height red line continues through channel rows;
- no second in-cell progress indication duplicates it.

The marker itself need not become a VoiceOver/TalkBack focus stop; actual-current programme actions expose current semantics.

## 11. Channel rail

Base width: **84 pt**.

### 11.1 Identity

Successful logo:
- optical box max: **48 × 36 pt**;
- aspect-fit;
- vertically/horizontally centred in the channel row;
- preserve source proportions;
- no recolouring;
- no duplicate visible channel caption below/next to a readable logo.

Fallback when logo is missing/fails:
- same optical identity zone;
- shortName ?? displayName;
- **12/14 Instrument Sans Bold**;
- max 2 short lines when required;
- compact max multiplier **1.20**;
- full displayName remains accessibility identity.

### 11.2 Rail surfaces

- rail uses the same semantic background as schedule;
- right rail boundary: **1 pt semantic border**;
- no sidebar/card fill;
- no visible ZENDER heading;
- no selected-channel treatment: Totaal is a multi-channel canvas, not a channel picker.

Channel identities remain vertically aligned to their deterministic row.

## 12. Channel rows

Base row height at fontScale 1.0: **76 pt**.

All channels use the same row height for the same fontScale.

The row height does not depend on:
- programme title length;
- programme duration;
- number of programmes currently mounted by windowing;
- current/future/past state;
- logo success/failure.

Row-bottom channel separator:
- **1 pt semantic border**;
- spans the channel rail and programme canvas;
- visually stronger than programme-time boundaries;
- no alternating row fills.

## 13. Programme geometry

Programme visual/action frame begins at its real start timestamp and ends at its real end timestamp.

At base scale:
- minute width = **3.00 pt/minute**;
- no permanent 2-pt card gap;
- no radius;
- no permanent fill;
- no elevation/shadow.

Adjacent programmes meet at their actual temporal boundary. A single visual boundary line may mark that edge; the line does not alter timestamp geometry.

Do not shift a programme's X/start to improve label placement.

## 14. Programme typography and content

### 14.1 Typography

Non-current title:
- **15/19 Instrument Sans Medium**;
- semantic text.

Actual-current title:
- **15/19 Instrument Sans Semibold**;
- semantic text.

Secondary time:
- **13/18 Instrument Sans Regular**;
- semantic textSecondary.

Title→secondary gap: **3 pt**.

Visible programme content block:
- vertically centred inside the deterministic channel row;
- comfortable/two-line title mode plus secondary time keeps at least **6 pt** top and bottom content breathing room through the supported Dynamic Type formula;
- content positioning never changes the programme frame or channel-row height.

Programme content is substantive:
- no global font cap;
- follows Dynamic Type;
- tabular numerals for times where reliable.

### 14.2 Metadata semantics

Actual-current programme:
- secondary copy = **tot HH:MM**;
- do not repeat its start time visually;
- no visible Nu bezig badge;
- no progress bar;
- accessibility label includes current/live state plus full start/end time.

Every non-current programme, future or historical:
- secondary copy = start time HH:MM when geometry permits;
- do not create a separate past colour state;
- end time normally omitted from grid;
- accessibility retains full start/end time.

## 15. Width-aware programme degradation

Use the existing proven width bands for normal programmes, measured on the currently visible programme remainder after left-edge clipping:

### Compact — visible width < 64 pt
- horizontal padding: **6 pt**;
- title max **1 line**;
- no visible secondary time;
- no progress/extra metadata.

### Standard — 64–125 pt
- horizontal padding: **8 pt**;
- title max **1 line**;
- secondary time may show on a second line.

### Comfortable — >=126 pt
- horizontal padding: **10 pt**;
- title max **2 lines** where content-safe;
- secondary time may show.

If remaining visible width falls below **52 pt**, secondary time must be hidden before title readability is sacrificed.

Long title:
- tail ellipsis;
- never move the programme block;
- full title remains accessibility/Programme Detail content.

### 15.1 Micro-programme threshold

Physical iPhone validation of PR #114 established that genuine very-short programme frames can produce meaningless fragments such as `B`, `Ha...` or `R...`. This refinement changes only title presentation for those frames; it does **not** change programme geometry or any existing Totaal production metric.

Let:

`S = max(1, effectiveFontScale)`.

A programme is a **microcell** when its **full real programme-frame width** is:

`frameWidth < 48 × S pt`.

Important:
- the threshold is based on the programme's full real frame, not merely the currently visible remainder after viewport clipping;
- real start/end geometry remains authoritative;
- there is no minimum programme width;
- a base-scale 15-minute programme is 45 pt and therefore qualifies as a microcell;
- normal programmes do not become microcells merely because horizontal scrolling clips them to a narrow visible remainder.

### 15.2 Individual microcell presentation

Micro classification remains §15.1: `frameWidth < 48 × S`.

For **every** individual microcell below that threshold:
- suppress the programme title fragment completely;
- suppress secondary start/end copy;
- render **no visible text glyph**: no title fragment and no `…`;
- keep exact real-duration frame geometry and the existing programme boundary;
- keep the full Pressable/hit target and pressed semantics;
- keep the complete accessibility label, including actual-current state;
- keep the Programme Detail destination.

There is no secondary individual-glyph threshold below `48 × S`. A text label becomes eligible only when there is at least `48 × S` usable presentation width: either because the programme itself is normal-width or because an eligible repeated-title run reaches the shared-title threshold.

### 15.3 Repeated-title run formation

A **repeated-title run** exists when **at least 2** consecutive programmes on the same channel all satisfy every condition below:

1. each programme is a microcell under §15.1;
2. each programme directly abuts the next: programme N `endAt` equals programme N+1 `startAt`;
3. there is no temporal gap and no overlap;
4. titles are identical after:
   - trimming leading/trailing whitespace;
   - collapsing internal whitespace runs to one space;
5. title comparison is otherwise exact/case-sensitive; do not use fuzzy matching, case folding, punctuation stripping, stemming or editorial equivalence.

Use the original programme title for display. The normalised form exists only for run membership.

Run membership must be derived from the chronological channel schedule **before viewport programme windowing**, so bucket/overscan transitions cannot split or redefine a run.

A same-title normal-width programme breaks the run; repeated-title sharing applies only to consecutive microcells.

### 15.4 Shared repeated-title presentation

A repeated-title run shows one shared visual title only when the **currently visible intersection of the complete run and the programme viewport** is at least:

`48 × S pt`.

When that condition is met:
- suppress the individual microcell glyph presentation for the run's visible microcells;
- render one shared programme title across the visible run region;
- one line only;
- **15/19 Instrument Sans Medium** at base scale, substantive/un-capped Dynamic Type;
- semantic primary text;
- left aligned at the first visible run position + the existing compact **6-pt** programme inset;
- use normal tail ellipsis if the full title still does not fit;
- hard-clip the shared label to the true run bounds and viewport intersection;
- do not add a background, fill, radius or merged-cell surface.

The title may visually span multiple underlying microcells. This is a text-presentation layer only: it does not create a combined programme action or combined duration.

If the visible run intersection drops below `48 × S pt`, remove the shared title. The underlying individual microcells remain visually text-free under §15.2.

### 15.5 Repeated-title boundaries and actions

Every underlying programme in a repeated-title run remains:
- its own exact start→end frame;
- its own temporal boundary;
- its own press state;
- its own pointer/touch hit area;
- its own accessibility action;
- its own Programme Detail destination.

Internal 1-pt programme boundaries retain the canonical §18.1 geometry and remain visible above and below the text line. The shared title may naturally occlude only the tiny part of a boundary directly underneath its glyphs; do not erase or merge the boundary itself.

The shared title layer must use `pointerEvents="none"` / equivalent non-interactive semantics. A tap at X belonging to programme 3 in a four-cell run must open programme 3, even when the visible title began over programme 1.

### 15.6 Partial visibility of a repeated-title run

The shared run title is **sticky only within its own run bounds**.

For viewport-left clipping:
- visible run start = `max(runStartX, viewportLeftX)`;
- title anchor = visible run start + **6 pt**;
- the title may move right as earlier microcells leave the viewport;
- it may never anchor before the real run start.

For viewport-right clipping:
- visible run end = `min(runEndX, viewportRightX)`;
- clip the title at that visible/run end;
- do not move programme boundaries or extend title content beyond the run.

The label therefore remains readable while the start of a repeated run scrolls offscreen, but it never behaves like a global sticky row label.

### 15.7 Current state inside a repeated-title run

A shared repeated-title label remains **Medium**, even if one of the underlying microcells is the actual-current programme. Do not make the entire shared title Semibold because that would imply that the complete repeated run is one current programme.

For a repeated run:
- current programme semantics remain on the exact underlying programme action;
- the compact current-time axis marker continues to identify the exact current instant;
- no run-level current fill, stripe, badge or secondary `tot` copy is added.

When the shared title is not active, every individual microcell remains visually text-free. An actual-current microcell keeps full current accessibility semantics; current state is not reintroduced as an individual glyph.

### 15.8 Dynamic Type, accessibility and themes

Dynamic Type:
- micro classification threshold = `48 × S`;
- there is no individual microcell text/glyph threshold below that boundary;
- shared-title visibility threshold = `48 × S`;
- the shared repeated-run title remains substantive and uncapped;
- the existing minuteWidth/channelWidth/rowHeight formulas remain unchanged;
- the compact 6-pt inset and programme-boundary metrics are not retuned.

Accessibility:
- a visually empty microcell never removes/replaces semantic programme content;
- every underlying programme action exposes full channel display name, full title, start, end and actual-current state as already specified;
- the shared run title is not a separate accessibility element/focus stop;
- individual microcells expose no visual glyph and therefore add no separate presentation focus stop;
- screen-reader traversal remains programme-by-programme in chronological order.

Light/Dark/System:
- identical geometry and run logic;
- title/`…` use semantic primary text;
- boundaries continue to use the existing semantic border treatment;
- no new microcell-specific colour token or surface is introduced.

A micro-programme refinement must never falsify duration geometry merely to fit text.

## 16. Partial-left readability

Preserve the proven EdgeReadabilityOverlay / masking contract.

For normal/non-micro programmes, when horizontal scrolling cuts through a programme:
- programme geometry remains unchanged;
- the left-edge mask remains active for any positive partial-left remainder so the underlying offscreen-positioned title cannot leak a one-letter, bare-ellipsis or similar fragment through the viewport edge;
- sticky title text is a separate presentation decision and appears only when the visible remainder is at least the existing `48 × S` readable-presentation threshold;
- once that threshold is reached, readable title content may re-anchor into the visible remainder;
- the duplicated readability layer must not create a second accessibility focus target;
- when visible remainder <52 pt, secondary time disappears;
- reverse scrolling must not briefly collapse newly visible text because a stale settled viewport lies beyond the programme;
- exact programme-boundary switching remains deterministic.

Microcells use §15.2 and remain text-free rather than exposing clipped title fragments. Repeated-title runs use the run-bounded sticky shared-title rule in §15.6. These layers must coexist with EdgeReadabilityOverlay without producing duplicate visible labels or duplicate accessibility targets.

Do not replace this with cell repositioning or per-frame React layout.

## 17. Current programme visual treatment

The actual current programme is deliberately restrained.

Production treatment:
- same open canvas as all other programmes;
- no permanent programmeCurrent fill;
- no card/radius;
- title weight changes Medium → Semibold for normal programmes;
- secondary copy changes to 'tot HH:MM' for normal programmes;
- micro/repeated-title programmes use the explicit current-state exceptions in §15.7;
- current semantics remain in accessibility;
- no local progress bar;
- no red border/dot/stripe inside the row.

The compact axis marker is the only red visual current-time indicator in Totaal.

This typographic-only current treatment is chosen because it matches the accepted board while avoiding a new filled state that would weaken the open-grid hierarchy.

## 18. Programme boundaries, separators and pressed state

### 18.1 Temporal programme boundary

At a programme end:
- draw at most one **1-pt semantic border** line;
- opacity **0.55**;
- vertical inset: **10 pt top / 10 pt bottom** at base scale;
- keep the same 10-pt structural inset at larger text rather than scaling a decorative separator;
- vertical extent remains inside that channel row;
- adjacent programmes must not each draw a duplicate line.

No independent hourly/half-hour grid runs down through the schedule.

### 18.2 Pressed

The programme's exact action rect receives:
- temporary semantic surfaceElevated fill;
- no radius;
- no shadow;
- no persistent state;
- clear immediately on release/cancel/gesture takeover.

Do not use whole-card permanent grey fills or an opacity-only pressed treatment as the primary affordance.

## 19. Light / Dark / System

Geometry is identical in every appearance mode.

Use semantic theme tokens:
- light background: #F7F7F5;
- dark background: #10100F;
- primary/secondary/muted text from the theme;
- channel separators: border;
- temporal programme boundaries: border at 0.55;
- axis ticks/baseline: railTick with the opacities in §9;
- current marker: currentTime;
- pressed programme: surfaceElevated;
- repeated-run shared titles: semantic primary text with no dedicated fill/token; individual microcells carry no text glyph.

Do not use programme / programmeCurrent as permanent Totaal fills. Do not delete or globally redefine those tokens because other surfaces may still use them.

System appearance changes must not reset:
- selected Guide presentation;
- day;
- horizontal position;
- vertical channel position;
- Programme Detail round-trip state.

## 20. Dynamic Type and responsive schedule geometry

Let S = max(1, effective fontScale).

### 20.1 Compact chrome

Hard max multiplier **1.20**:
- shared Guide tabs;
- day selector;
- Nu;
- time-axis labels;
- current-time marker label;
- channel fallback text.

Shared tabs independently switch from 48/one-line to 64/max-two-lines above S=1.35.

Totaal day/Nu context remains 52 pt and time axis remains 44 pt at all scales.

### 20.2 Substantive schedule geometry

Programme title and programme secondary time remain uncapped.

Preserve the proven gradual horizontal-density adaptation:

- minuteWidth = round((3.00 + 1.20 × (S - 1)) × 100) / 100;
- channelWidth = round(84 + 28 × (S - 1)).

Deterministic channel row height:

- baseline growth = round(76 + 40 × (S - 1));
- content-safe height = ceil(56 × S + 13);
- rowHeight = max(baseline growth, content-safe height).

Representative results:
- S=1.00 → 76 pt;
- S=1.35 → 90 pt;
- S=1.50 → 97 pt;
- S=2.00 → 125 pt.

The content-safe term reserves two 19-pt title lines, one 18-pt secondary line, a 3-pt title/time gap and 10 pt total vertical breathing room.

Row height stays identical across channels at a given S.

### 20.3 Content line count

- compact/standard width modes: title max 1 line;
- comfortable width: title max 2 lines;
- secondary time stays max 1 line;
- secondary time disappears before essential title content when width becomes constrained.

Do not disable Dynamic Type or shrink substantive text to preserve screenshot density.

## 21. Horizontal time-window and performance architecture

Preserve:
- real timeline width derived from actual window duration × minuteWidth;
- current coarse render bucket = one programme viewport width;
- conservative **1.5 viewport overscan** on either side of the owned bucket;
- native onScroll ownership on the UI thread;
- React receives only coarse bucket transitions;
- animated programmatic time jumps do not pre-align React ownership ahead of native movement;
- non-animated jumps may pre-align the destination programme window before the native viewport moves.

Visual convergence must not return to mounting the complete multi-day programme grid.

No new dependency is required.

## 22. Day/time behaviour

### 22.1 Continuous horizontal browsing

Totaal may show the selected television day plus the following day when that next day is inside D-2..D+7.

Horizontal scroll can therefore cross:
- calendar midnight;
- the 06:00 television-day boundary.

The visible date label changes only when the stable 120-pt viewed-time anchor crosses 06:00.

### 22.2 Day selection

Selecting another day:
- preserves the current Amsterdam wall-clock reference where practical;
- updates the horizontal target;
- preserves vertical channel position;
- does not reset the Guide to 06:00 or Primetime.

DST nonexistent/ambiguous local times use the existing canonical matching-wall-clock helper.

### 22.3 Nu

Nu:
- restores actual Date.now/reference clock instant;
- restores its containing television day;
- preserves vertical channel position;
- may animate horizontally under normal motion;
- is non-animated under Reduce Motion.

## 23. Gesture ownership

Frozen:
- horizontal drag over schedule/time axis → time navigation;
- vertical drag over schedule → channel navigation;
- directional lock remains active;
- programme tap → Programme Detail;
- day selector target → day sheet;
- Guide presentation tab → presentation change;
- Nu → current instant;
- bottom navigation → app section.

Do not add:
- horizontal channel paging to Totaal;
- gesture-based day switching;
- programme-card swipes;
- oversized overlapping hitSlop between adjacent short programmes.

Programme taps must remain responsive after native momentum settles.

## 24. Programme Detail round-trip

Opening a Totaal programme opens the canonical Programme Detail directly.

Closing preserves:
- Guide presentation = Totaal;
- exact selected television-day context;
- horizontal viewed-time/scroll position;
- vertical channel position;
- current programme-window ownership;
- appearance/font-scale state.

Opening/closing Detail must not remount GuideView.

Bewaar/Herinner mij changes inside Detail likewise must not rebuild Totaal.

## 25. Loading, hosted transition and unavailable data

The production visual language is source-independent.

### 25.1 Fixture-first

Deterministic fixture first frame uses:
- same open canvas;
- same channel rail;
- same programme typography;
- same current marker rules.

No prototype card styling may flash before hosted data arrives.

### 25.2 Fixture → hosted

When hosted canonical data replaces fixture data:
- preserve current day/viewed-time anchor where valid;
- preserve vertical channel context by semantic channel identity where practical;
- keep horizontal programme-window ownership coherent;
- do not remount solely because guideDataVersion changed;
- do not flash old visual treatment.

### 25.3 Day loading with established catalogue

When an established canonical broadcaster catalogue exists but a selected day is loading:
- retain that catalogue rather than substituting unrelated generic channel identities;
- retain the open Totaal shell/rail;
- render one calm schedule loading/unavailable treatment rather than fake programmes.

### 25.4 Unavailable

Do not claim 'Geen programma' for provider/data unavailability.

Use one schedule-level availability state. If programme actions are absent, retained channel identities must remain discoverable to assistive technology.

## 26. Accessibility

### 26.1 Programme actions

Every visible programme action label includes:
- full channel display name;
- full programme title;
- start time;
- end time;
- 'nu bezig' only for the actual current programme.

Visual truncation, microcell glyph suppression and repeated-title sharing never truncate or merge accessibility semantics. A repeated-title visual run still exposes every underlying broadcast as its own programme action.

### 26.2 Channel rail

Normal schedule-present state:
- do not add a redundant channel-logo focus stop before every programme;
- programme labels already carry channel identity.

Catalogue-retained/unavailable state:
- if no programme actions exist, expose retained channel identities with full displayName.

### 26.3 Axis

Time ticks and the current-time marker are orientation chrome, not a long series of screen-reader focus stops.

The selected day control and Nu provide explicit navigation semantics.

### 26.4 Focus/navigation order

Logical order:
1. shared brand/actions;
2. Guide presentation tabs;
3. day selector;
4. Nu;
5. schedule programme actions in channel-major chronological order;
6. bottom navigation through normal app-shell traversal.

Bottom sheet owns modal focus while open and returns focus to the day selector on close where platform behaviour allows.

### 26.5 Touch targets

- day selector: 44 iOS /48 Android minimum;
- Nu: 44/48 minimum;
- shared presentation tabs: entire 48/64 row item;
- programme touch ownership follows exact non-overlapping real-duration geometry.

For sub-15-minute broadcasts, do not create overlapping hidden hit areas. Exact spatial ownership plus accessible programme actions is preferred over ambiguous overlap.

## 27. Reduce Motion

When Reduce Motion is enabled:
- shared GuideChrome switches discretely at 28 pt rather than interpolating;
- Nu/day programmatic horizontal moves may be non-animated;
- user-driven horizontal/vertical scrolling remains native;
- no programme crossfade/card animation is introduced;
- current marker movement follows time without decorative springing.

## 28. Deterministic test contract

Development must cover at least:

1. base channel width 84, row height 76 and minute width 3.00;
2. 15/30-minute frames resolve to 45/90 pt at base scale;
3. real-duration programme frames no longer subtract a permanent 2-pt card gap;
4. title/time typography metrics and Instrument Sans families;
5. current title Medium→Semibold difference;
6. current programme secondary copy uses 'tot HH:MM';
7. non-current copy uses start time;
8. compact/standard/comfortable thresholds 64/126;
9. secondary time hides below 52 pt remaining visible width;
9a. microcell threshold uses full frame width `< 48 × S`, not clipped remainder;
9b. every individual microcell `< 48 × S` has no visible text glyph and no secondary copy while boundary/action/accessibility/Detail remain intact;
9c. repeated-title run requires >=2 directly adjacent microcells with exact title equality after trim/whitespace collapse;
9d. shared run title appears only when visible run intersection >= `48 × S` and is clipped/sticky within run bounds;
9e. repeated-title internal boundaries, separate programme actions and hit ownership remain intact;
9f. repeated-run membership is stable across programme-window bucket transitions;
9g. shared run title is accessibility-hidden/pointer-transparent and actual-current shared title remains Medium;
10. no Totaal programme progress bar;
11. no permanent programme fill/radius;
12. no full-height current-time line;
13. current marker body 18, readable label box min38 + 5/5 padding = outer48 base /56 at cap, full HH:MM, pointer6×4 and exact-now X independent of body clamping;
14. 15-minute tick generation with labels only at :00/:30;
15. major/minor/baseline railTick hierarchy;
16. blank channel-axis corner; no visible ZENDER label;
17. successful channel logo has no duplicate visible caption;
18. 84-pt rail and 48×36 logo optical box;
19. shared GuideChrome 100/116;
20. day/Nu 52 + axis44 = persistent96;
21. rest/settled overlay endpoints 196→96 standard and 212→96 Larger Text;
22. native collapse56 with visual compensation44/60;
23. Reduce Motion discrete28 switch;
24. compact day wording rules before/after 06:00;
25. stable 120-pt viewed-time anchor day projection;
26. stationary Totaal anchor does not follow real-clock 06:00 rollover;
27. anchor crossing 06:00 updates day;
28. day selection preserves wall-clock target;
29. Nu restores exact now + containing television day;
30. Dynamic Type formula for minuteWidth/channelWidth/rowHeight;
31. row height deterministic across channels/content/duration;
32. partial-left readability invariants and boundary switching;
33. programme window remains viewport-bucketed with 1.5× overscan;
34. animated vs non-animated programme-window prealignment ownership;
35. Programme Detail round-trip keeps Totaal instance and scroll context;
36. fixture/hosted version update does not remount Totaal solely for styling/data version;
37. normal rows avoid redundant channel focus stops;
38. unavailable retained catalogue exposes full channel identity;
39. Light/Dark/System semantic token use;
40. shared presentation tabs keep 48/64 accessibility contract.

Time/DST tests use injected fixed instants. No wall-clock sleeps.

## 29. Implementation risk and boundary

Totaal runtime convergence is **HIGH risk** under docs/ENGINEERING_QUALITY_POLICY.md because it touches:
- nested 2D scrolling;
- scroll-coupled chrome;
- real-time geometry;
- partial-left readability;
- programme windowing;
- Dynamic Type-driven geometry;
- Programme Detail context;
- hosted/fixture continuity.

Implementation should keep concerns separated:
- domain/day helpers;
- schedule geometry helpers;
- programme-windowing;
- edge-readability helpers;
- shared GuideChrome/day selector;
- Totaal visual metrics;
- GuideView presentation.

Do not combine this work with provider changes, caching, Search, Tonight or unrelated navigation work.

## 30. Physical iPhone validation

Physical validation must use the exact implementation head and the exact canonical visual board.

### Composition
1. Light expanded matches the canonical hierarchy.
2. Light condensed removes brand/actions/tabs completely.
3. Dark expanded matches the same geometry/hierarchy.
4. Dark condensed retains only day/Nu/axis above schedule.
5. No standalone Gids heading.
6. No floating Guide presentation pill.
7. Bottom navigation remains shared/app-owned.

### Shared chrome / collapse
8. Standard rest endpoint = 196 pt below safe area; settled = 96.
9. Larger Text rest endpoint = 212; settled = 96.
10. Strong vertical fling across first 56 pt produces no forward/back oscillation.
11. Returning to top restores full chrome naturally.
12. No half-clipped Guide tabs/header.
13. Reduce Motion uses clean discrete endpoint transition.

### Day/Nu
14. 06:00–23:59 current day shows only Vandaag.
15. Next day shows only Morgen.
16. Other day shows weekday + date.
17. 00:00–05:59 uses explicit date labels only.
18. Day sheet stays bounded D-2..D+7.
19. Day change preserves wall-clock position and vertical channel context.
20. Nu restores current day/instant without changing vertical channel position.

### Time axis
21. 44-pt axis reads calm, not heavy.
22. :00/:30 labels are legible; :15/:45 are unlabeled.
23. major > quarter > baseline contrast hierarchy is visible in light.
24. same hierarchy remains visible in dark.
25. current-time marker is compact, readable and anchored to exact minute.
26. marker near an edge stays readable without moving its pointer.
27. no red line continues through channel rows.

### Channel rail
28. Rail width/visual mass matches the board.
29. Readable logo uses no duplicate visible channel caption.
30. Missing-logo fallback remains intentional/readable.
31. Logos preserve proportions in light/dark.
32. Channel rows stay aligned while horizontally browsing.

### Programme grid
33. Open canvas: no permanent rounded/filled cards.
34. Base rows are 76 pt.
35. Actual duration remains spatially accurate.
36. Current programme is only typographically stronger and shows 'tot'.
37. Future/non-current programme shows start time.
38. No in-cell progress bar.
39. Channel separators read stronger than temporal programme boundaries.
40. No hourly grid runs through rows.
41. Press feedback is visible but does not leave a card state.

### Edge cases
42. At base scale, a 15-minute / 45-pt programme is visually text-free unless an eligible repeated-title run reaches the shared-title threshold.
43. Sub-15-minute programme does not overlap neighbour touch ownership; each microcell remains a separate Programme Detail action.
44. Two or more directly adjacent same-title microcells form a stable run, but shared title appears only once visible combined run width reaches `48 × S`.
45. Four consecutive 5-minute same-title programmes at base scale retain four 15-pt frames/boundaries/actions while showing one run-bounded shared title across the 60-pt run.
46. Three consecutive 5-minute same-title programmes at base scale total 45 pt and therefore show no shared title and no individual text glyphs; each boundary/action/accessibility contract remains intact.
47. Partial-left/right repeated-title scrolling keeps the shared label within real run bounds and becomes fully text-free below the visible `48 × S` threshold.
48. An individual current microcell remains visually text-free with full current accessibility semantics; a shared repeated-run title stays Medium even when one underlying broadcast is current.
49. Very long title truncates gracefully and full title opens in Detail.
50. Programme crossing left edge remains readable during and after momentum.
51. Rapid horizontal reversal does not flash missing/stale text.
52. Crossing midnight remains continuous.
53. Stable anchor crossing 06:00 changes date once/coherently.
54. DST representative day does not assume 24 hours.

### Dynamic Type/accessibility
55. Default text hierarchy matches canonical board.
56. Around 1.35: no clipping in programme content.
57. Above 1.35 shared tabs use accepted 64/max-two-line state.
58. At representative accessibility text, programme titles/times still scale and row geometry grows.
59. Compact date/Nu/axis chrome stays usable with 1.20 cap.
60. VoiceOver programme labels contain channel/title/start/end/current state.
61. Channel logos do not add redundant focus stops in normal schedule state.
62. Day sheet focus/modal behaviour is usable.
63. System appearance change does not reset day/scroll/presentation.

### Performance/context
64. Realistic channel volume vertical fling remains smooth.
65. Horizontal hard fling through multiple programme-window buckets shows no blank grid.
66. Fixture→hosted transition preserves styling and context.
67. Programme Detail open/close preserves exact Totaal context.
68. Detail personal-state changes do not remount the Guide.

## 31. Android physical validation — deferred device gate

When Android hardware is available, validate separately:
1. 48-dp day/Nu targets;
2. TalkBack labels/focus order;
3. horizontal vs vertical nested gesture arbitration;
4. native Android overscroll/edge behaviour;
5. rapid horizontal reversals/programme windowing;
6. font-size and display-size combinations;
7. 48/64 shared Guide tabs;
8. dynamic row/channel/minute geometry;
9. bottom gesture-navigation inset;
10. three-button-navigation inset where available;
11. cutout/status-bar safe area;
12. dark/light/system;
13. system Back from Programme Detail preserves exact context;
14. day bottom sheet Back/dismiss focus recovery;
15. performance on representative non-high-end hardware;
16. fixture→hosted transition;
17. current marker/tick legibility;
18. sub-15-minute programme tap ownership.

Successful Android compilation is not physical acceptance.

## 32. Production calibration register

Owner-approved production values frozen by this specification:

1. Shared Guide: inset20; brand row52; tabs48 through 1.35 /64 above; GuideChrome100/116.
2. Totaal sticky functional stack: day/Nu52 + axis44 = **96 at every font scale**.
3. Collapse: native56; max chrome translate12; compensation44/60; rest196/212; settled96; Reduce Motion switch28.
4. Day label15/20 Semibold cap1.20; chevron14/16 gap6.
5. Nu visible36, min width48, touch44/48, X padding12, radius10, 1-pt border, label14/18 Semibold cap1.20.
6. Base schedule: rail84, row76, minuteWidth3.00, viewed-time anchor120.
7. Channel logo optical max48×36; fallback12/14 Bold cap1.20.
8. Time axis44; label11/14 Medium cap1.20; :00/:30 text only.
9. Major tick1×10 railTick@0.78; quarter1×6@0.50; baseline1@0.42.
10. Current marker body18; readable label box min38; padding5 per side outside that box; outer body48 base /56 at cap1.20; radius5; pointer6×4; full non-ellipsized HH:MM label10/12 Semibold cap1.20; `onCurrentTime #0D0D0D`; body edge-clamping never moves pointer X.
11. Programme title15/19 Medium; actual-current Semibold; secondary13/18 Regular; title→time gap3.
12. Width modes: compact<64 / standard64–125 / comfortable>=126; hide secondary when remaining width<52.
13. Programme permanent gap0; temporal boundary1 pt border@0.55 with 10/10 vertical insets; row separator1 pt border@1.00.
14. Current programme = typography + 'tot HH:MM' only; no fill/progress.
15. Pressed programme = temporary surfaceElevated fill, no radius.
16. Dynamic minuteWidth = 3+1.2×(S−1); channelWidth = 84+28×(S−1); rowHeight = max(round(76+40×(S−1)), ceil(56×S+13)).
17. Programme window bucket/overscan remains one viewport /1.5 viewports.
18. Instrument Sans throughout; substantive programme copy uncapped.
19. Microcell: full frame width `< 48 × S`; every individual microcell has no visible text glyph and no secondary copy; boundary/action/accessibility/Detail remain programme-owned.
20. Repeated-title run: >=2 adjacent microcells, exact title after trim/whitespace collapse, shared label only when visible run width >= `48 × S`; shared title Medium/one-line/6-pt inset and bounded to the run.
21. Repeated-title runs preserve every internal 1-pt boundary, exact hit frame, accessibility action and Programme Detail action; shared label is pointer-transparent/accessibility-hidden.

These owner-approved values become implementation constraints when this specification is merged to `main`. Development must not substitute local alternatives after that point without new physical/UX evidence.

## 33. Superseded Totaal production treatments

Do not preserve:
- standalone TEEVEE/Gids production header;
- floating bottom Guide selector;
- redundant Vandaag/Morgen date suffix;
- permanent programme/card fills;
- rounded programme cards;
- 2-pt visual gaps used to create card separation;
- in-cell programme progress;
- full-height current-time line;
- visible ZENDER heading;
- duplicate visible name under a successful logo;
- system-font visual styling that bypasses Instrument Sans;
- heavy hourly grid;
- current state communicated only by colour.

## 34. Owner acceptance

No new fundamental product or interaction choice remains open.

The owner explicitly accepted the production-calibration package in §32 on 2026-09-21, including:
- **76 pt** base row;
- **84 pt** base channel rail / **48×36** optical logo box;
- **3.00 pt/min** base horizontal scale;
- **52 + 44 = 96 pt** persistent Totaal stack;
- programme typography **15/19 + 13/18**;
- open-grid separator/tick contrast;
- compact current-marker geometry;
- typographic-only current-programme treatment;
- Dynamic Type formulas;
- **micro-programme threshold `48 × S`** with no individual text glyph anywhere below that threshold;
- repeated-title run sharing across >=2 adjacent same-title microcells while preserving boundaries/actions and using the same `48 × S` visible-run threshold.

Merge this documentation/design PR first. Only after the owner-approved specification is canonical on `main` may Development begin Totaal runtime visual convergence.
