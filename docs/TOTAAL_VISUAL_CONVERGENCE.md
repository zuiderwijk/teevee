# Teevee — Totaal production visual convergence

Status: **OWNER-APPROVED DESIGN → IMPLEMENTATION SPECIFICATION**
Date: 2026-09-21
Canonical visual approved: 2026-09-21

This document is the single production implementation handoff for the accepted **Totaal** Guide presentation. It replaces the stale pre-approval draft that previously occupied this path.

This is Accepted Design Refinement, not Design / UX Exploration. Development must implement this specification without reopening the accepted Totaal composition or changing the frozen Guide interaction/data architecture.

## 1. Authority and source-of-truth order

For Totaal production convergence, use this order:

1. `docs/PROJECT_STATE.md`;
2. `docs/PRODUCT.md`;
3. `docs/UX.md`;
4. `docs/VISUAL_BASELINE.md`;
5. this document;
6. `design/current/guide/TOTAAL.md`;
7. `design/current/guide/GUIDE_DAY_SELECTOR.md`;
8. `design/current/TYPOGRAPHY.md`;
9. `docs/DESIGN_SYSTEM.md`;
10. accepted ADRs, especially ADR 0007 and ADR 0008.

Canonical visual:
- `/Teevee/Totaal production design - light dark expanded condensed.png`
- Library file id: `file_00000000aafc8230b3218e6577a1d912`
- stable Library record: `libfile_1f6afbdcf8748191b5d524a7aad5e0df`

The visual board is authority for composition, hierarchy and overall visual language. Exact production metrics below supersede only the board details that were intentionally left open for production calibration.

Runtime values are implementation evidence only. Existing prototype-era values do not become canonical merely because they are already coded.

## 2. Frozen product / interaction contracts

Do not reopen in this increment:

- horizontal movement = time;
- vertical movement = channels;
- real programme start/duration determines horizontal geometry;
- native inertia, bounce and directional lock;
- proven partial-left programme-title/time-axis readability;
- bounded horizontal programme windowing and conservative overscan;
- D-2 through D+7 Guide horizon;
- television day = 06:00 Europe/Amsterdam → 06:00 next local day;
- midnight is not a Guide boundary;
- shared bounded day selector + separate `Nu`;
- Programme Detail opens directly;
- Programme Detail round-trip preserves Totaal day/time/channel/scroll context;
- fixture-first / hosted canonical runtime boundary;
- provider-independent data architecture;
- Instrument Sans;
- Light / Dark / System;
- substantive Dynamic Type;
- shared bottom navigation;
- physical Android validation may remain deferred until hardware exists.

No second Totaal implementation, no new scroll engine, no alternate schedule model and no eager full-horizon payload are authorised.

## 3. Current runtime evidence: preserve vs supersede

### Preserve

The current Totaal implementation provides proven evidence for:

- 2D nested native scrolling;
- native inertia/bounce/directional lock;
- exact time→X mapping;
- real-time current instant;
- D-2..D+7 and 06:00-aware day targeting;
- stable viewed-time anchor;
- programme-window bucket ownership and overscan;
- non-animated programme-window prealignment;
- partial-left title readability;
- Programme Detail direct open;
- mounted Guide context through Programme Detail;
- fixture-first / hosted replacement.

### Supersede

The following current runtime treatments are not production authority:

- standalone `TEEVEE / Gids` header;
- floating bottom Guide-presentation pill;
- Totaal using the older long `Vandaag · <datum>` copy;
- visible `ZENDER` corner heading;
- duplicate channel-name caption under a readable logo;
- permanent rounded/fill programme cards;
- in-cell progress bars;
- full-height red current-time line;
- 30-minute-only axis tick generation;
- system-font programme styling;
- strong whole-cell opacity press feedback;
- normal-flow header removal driven by a binary scroll threshold;
- the current fixed 2-pt subtraction from programme duration width as a visual gap.

Development converges those details while retaining the underlying interaction/performance architecture.

## 4. Production composition

### 4.1 Expanded / rest

From the top safe area downward:

1. shared Guide brand/action row;
2. shared Guide presentation tabs, Totaal selected;
3. Totaal day + `Nu` context;
4. sticky time axis;
5. open 2D schedule grid with logo-first channel rail;
6. shared bottom navigation outside the Guide content viewport.

There is no standalone `Gids` heading.

There is no floating Guide-presentation selector at the bottom.

### 4.2 Condensed / vertically scrolled

After the collapse settles:

1. top safe area;
2. day + `Nu` context;
3. time axis;
4. schedule/channel context.

The `tv.` mark, Search/secondary action row and Guide presentation tabs are fully gone from the functional stack.

Returning naturally to the top restores the expanded hierarchy.

## 5. Exact vertical geometry

### 5.1 Shared GuideChrome

Reuse the existing shared Guide metrics:

- horizontal screen inset: **20 pt**;
- brand top inset: **8 pt**;
- brand mark box: **56 × 44 pt**;
- presentation tabs: **48 pt / one line through fontScale 1.35**;
- presentation tabs: **64 pt / maximum two lines above 1.35**;
- compact tab-label cap: `maximumFontSizeMultiplier = 1.20`;
- expanded GuideChrome height:
  - **100 pt** through fontScale 1.35;
  - **116 pt** above 1.35.

Do not create a Totaal-only GuideChrome.

### 5.2 Persistent Totaal functional stack

The persistent stack is deliberately font-scale-stable compact chrome:

- day + `Nu` context: **52 pt**;
- time axis: **44 pt**;
- total persistent functional stack: **96 pt**.

This remains **96 pt at all supported font scales**. Programme content is substantive and scales independently; the compact temporal controls use the documented narrow cap.

### 5.3 Expanded / condensed totals

Excluding top safe area:

Standard text, fontScale <=1.35:
- expanded overlay bottom: **196 pt** = 100 GuideChrome + 52 context + 44 axis;
- condensed overlay bottom: **96 pt**;
- full visual contraction: **100 pt**.

Larger Text, fontScale >1.35:
- expanded overlay bottom: **212 pt** = 116 GuideChrome + 52 context + 44 axis;
- condensed overlay bottom: **96 pt**;
- full visual contraction: **116 pt**.

### 5.4 Schedule native viewport

The active vertical schedule ScrollView uses a fixed native viewport whose top is:

`safeAreaTop + 96 pt`

The viewport does **not** move while shared chrome visually collapses.

At rest, schedule content reserves a top inset equal to the expanded GuideChrome:
- **100 pt** standard;
- **116 pt** Larger Text.

The first visible schedule row therefore starts immediately below the expanded overlay without putting collapsing chrome in normal flow above the ScrollView.

### 5.5 Bottom navigation and safe areas

- top safe area is owned exactly once by the Guide screen;
- bottom safe area / tab-bar geometry is owned by the shared Expo tab navigator;
- Totaal does not add a second bottom safe-area inset;
- the last schedule row must be able to scroll fully clear of the bottom navigation;
- retain at least **16 pt** content clearance after the final row once the tab bar has taken its own space.

## 6. Collapse architecture

Totaal adopts the already proven fixed-native-viewport / collapse-isolation pattern. This is a shared architecture reuse, not a new scroll system.

### 6.1 Normal motion

- native collapse distance: **56 pt**;
- `progress = clamp(nativeScrollY / 56, 0, 1)`;
- disappearing GuideChrome opacity: `1 - progress`;
- max upward chrome translation: **12 pt**;
- no spring;
- no scroll-direction hide/reveal behaviour.

The active schedule ScrollView remains fixed below the 96-pt persistent stack.

During the first 56 pt of native scroll:
- standard visual compensation = **44 pt**;
- Larger Text visual compensation = **60 pt**.

Thus:
- standard total contraction = 56 + 44 = **100 pt**;
- Larger Text total contraction = 56 + 60 = **116 pt**.

Visual schedule compensation is:
- `-44 × progress` standard;
- `-60 × progress` Larger Text.

The row visible immediately below the sticky stack remains visually attached to that stack during collapse rather than jumping.

### 6.2 Semantic vertical offset

The first 56 native points are collapse ownership, not semantic channel progression.

After collapse:

`semanticScheduleY = max(0, nativeScrollY - 56)`

Restoring a semantic channel position must apply the inverse conversion before setting native offset.

Do not infer a time or channel from a normal-flow header height that is mutating during scroll.

### 6.3 Reduce Motion

With Reduce Motion:
- use the same expanded and condensed endpoint geometry;
- switch discretely at native schedule offset **28 pt**;
- no interpolated opacity/translation is required;
- user-driven native schedule scrolling remains native.

### 6.4 Prohibited collapse implementation

Do not reintroduce:

`contentOffset → collapse → normal-flow sibling-height mutation → native offset compensation → new collapse input`

Physical Per-zender evidence already proved that feedback topology can produce forward/back momentum oscillation. Totaal must use the isolated viewport pattern from the start.

## 7. Day + Nu context

### 7.1 Row geometry

- row height: **52 pt**;
- horizontal insets: **20 pt**;
- date control leading;
- `Nu` trailing;
- internal control gap is flexible; `Nu` stays at the trailing inset;
- vertical alignment: centred.

### 7.2 Date control

Use the shared `GuideDaySelector` interaction contract.

Visible label:
- **15/20 Instrument Sans Semibold**;
- compact cap: **1.20**;
- chevron: **14/16 Semibold**;
- text→chevron gap: **6 pt**;
- complete Pressable minimum: **48 pt high**.

Canonical wording:

From 06:00–23:59:
- current television day: **`Vandaag`**;
- next television day: **`Morgen`**;
- no suffix after either;
- other days: abbreviated weekday + date, e.g. **`Zo 20 sep`**.

From 00:00–05:59:
- all days use explicit abbreviated weekday + date;
- no `Vandaag` or `Morgen`.

The bounded sheet remains exactly D-2..D+7.

### 7.3 Nu

Totaal does not use `Nu` as a selected mode. The current-time marker already expresses actual Now spatially.

`Nu` is an idempotent action: jump to the actual instant and its containing television day.

Geometry:
- visible control height: **36 pt**;
- visible minimum width: **48 pt**;
- effective touch target: minimum **44 pt iOS / 48 dp Android**;
- horizontal padding: **12 pt**;
- radius: **18 pt**;
- outline: **1 pt semantic `border`**;
- label: **14/18 Instrument Sans Semibold**;
- compact cap: **1.20**.

State:
- enabled whenever the current instant can be targeted, which is normally always inside the product horizon;
- no persistent selected fill;
- pressed state uses semantic `surface`;
- disabled is reserved for a true runtime inability to resolve the current target;
- accessibility label: `Ga naar nu`.

Pressing `Nu`:
- selects the current television day;
- moves the horizontal target to the exact actual instant;
- preserves the current vertical channel position;
- uses the existing bounded programme-window prealignment/native-scroll ownership.

## 8. Time axis

### 8.1 Geometry

- axis height: **44 pt**;
- starts at the programme viewport X after the channel rail;
- channel-axis corner is blank: no `ZENDER` label;
- axis background uses the same Guide canvas as the schedule;
- bottom axis boundary: platform hairline using semantic `border`.

Horizontal scale:

`minuteWidth = 3 + 1.2 × (max(1, fontScale) - 1)`

rounded to two decimals.

Representative values:
- 1.00 → **3.00 pt/min**;
- 1.35 → **3.42 pt/min**;
- 1.50 → **3.60 pt/min**;
- 2.00 → **4.20 pt/min**;
- 2.50 → **4.80 pt/min**.

This retains the current proven readability strategy: Larger Text receives more horizontal programme space without changing real-time geometry.

### 8.2 Tick rhythm

Generate positions every **15 minutes**.

Whole/half hours:
- visible label;
- vertical tick **1 × 10 pt**;
- semantic `railTick`;
- opacity **0.70**.

Quarter hours (:15/:45):
- no text label;
- vertical tick **1 × 6 pt**;
- semantic `railTick`;
- opacity **0.45**.

No additional 5-minute/10-minute raster.

### 8.3 Time labels

- text: **11/14 Instrument Sans Medium**;
- tabular numerals where reliable;
- compact cap: **1.20**;
- label top inset: **6 pt**;
- only :00/:30 render text.

Time-label measuring width:

`tickLabelWidth = round(72 + (minuteWidth - 3) × 30)`

This preserves the existing left-edge masking calculation while allowing Larger Text horizontal expansion.

### 8.4 Current-time marker

Only actual Now uses the marker.

Marker:
- body: **46 × 20 pt**;
- radius: **10 pt**;
- horizontal internal padding: **6 pt**;
- body bottom inset from axis bottom: **4 pt**;
- centered notch: **6 pt wide × 4 pt high**;
- notch point lands on the axis baseline at the exact current-time X;
- background: semantic `currentTime`;
- label: exact local time `HH:MM`;
- label typography: **12/15 Instrument Sans Semibold**, tabular numerals;
- label colour: semantic `onCurrentTime`.

Production `onCurrentTime` token:
- light: **#000000**;
- dark: **#10100F**.

The marker is decorative/spatial orientation in addition to programme accessibility semantics; it is not the only indication that a programme is current.

### 8.5 Marker positioning / overlap

- pointer/notch X always represents the exact actual instant;
- body normally centres on the pointer;
- within **4 pt** of the horizontal programme viewport edges, body may clamp inward while the notch remains anchored to true X;
- if the pointer itself is outside the visible horizontal programme viewport, hide the marker rather than pinning it to an edge;
- marker z-index is above axis labels/ticks and below modal/sheet chrome;
- no red line continues through programme rows.

### 8.6 Left-edge readability

Keep the proven left-edge time-label masking:
- do not allow a half-visible stale `08:30` label to remain under the fixed channel rail;
- masking is visual only and does not change tick positions;
- masking uses the axis canvas colour and same bottom boundary.

## 9. Channel rail

### 9.1 Width

Totaal channel rail width follows:

`round(84 + 28 × (max(1, fontScale) - 1))`

Representative values:
- 1.00 → **84 pt**;
- 1.35 → **94 pt**;
- 1.50 → **98 pt**;
- 2.00 → **112 pt**.

The widening is reserved for substantive fallback identity and does not scale logo artwork indefinitely.

### 9.2 Logo-first identity

Create/use an explicit Totaal presentation variant for `ChannelIdentity`; do not change Per-zender or Nu & Straks behaviour to satisfy Totaal.

Readable logo:
- optical box max **52 × 40 pt**;
- resize mode: contain;
- preserve source aspect ratio;
- vertically centred in the channel row;
- no visible channel-name caption below it;
- no recolouring, stretching or fabricated tiles.

Missing/unusable logo:
- same rail geometry;
- full available identity area;
- **13/16 Instrument Sans Semibold** at base scale;
- substantive scaling, no global cap;
- maximum **2 lines**;
- centred;
- tail ellipsis only after two-line opportunity is exhausted.

The complete `displayName` remains the accessibility label.

### 9.3 Rail/schedule boundary

- channel rail and schedule use the same semantic `background` canvas;
- no separate card/sidebar fill;
- one vertical platform hairline using semantic `border` may separate rail from programme viewport;
- row separators align continuously across rail and schedule.

## 10. Schedule row geometry

### 10.1 Deterministic row height

Base row height: **76 pt**.

Responsive formula:

`rowHeight = round(76 + 40 × (max(1, fontScale) - 1))`

Representative values:
- 1.00 → **76 pt**;
- 1.10 → **80 pt**;
- 1.35 → **90 pt**;
- 1.50 → **96 pt**;
- 2.00 → **116 pt**;
- 2.50 → **136 pt**.

The accepted board explicitly left 76 pt open for final calibration. Production freezes **76 pt** rather than compacting further: it preserves the open premium rhythm, accommodates title + useful time at default size and avoids premature density tuning before physical convergence.

Every channel row uses the same height at a given font scale. Programme title length and programme duration never alter row height.

### 10.2 Row separators

- one row-bottom platform hairline;
- semantic `border`;
- runs across channel rail and programme area;
- no doubled boundary at the rail split;
- no alternating row fill.

### 10.3 Programme horizontal geometry

Programme X and width are derived only from real timestamps:

`left = minutesBetween(dayWindowStart, programme.start) × minuteWidth`

`width = max(1, minutesBetween(programme.start, programme.end) × minuteWidth)`

Do **not** subtract a cosmetic programme gap from the duration width.

Adjacent programme boundaries may be drawn as a line **inside/on the real end boundary**; they may not shorten either programme.

This explicitly supersedes the current `GUIDE_PROGRAMME_GAP = 2` visual-width subtraction for Totaal.

### 10.4 Programme boundary

At a programme end:
- one vertical platform hairline;
- semantic `border`;
- opacity **0.70**;
- full row height;
- no rounded gap;
- one timestamp owns one boundary: do not draw two lines where adjacent programmes meet.

No independent hourly grid is drawn through programme rows.

## 11. Programme typography and content hierarchy

### 11.1 Base typography

Normal title:
- **15/19 Instrument Sans Medium**;
- semantic `text`.

Actual-current title:
- **15/19 Instrument Sans Semibold**;
- same geometry; no size increase.

Secondary time:
- **13/18 Instrument Sans Regular**;
- tabular numerals where reliable.

Current programme time:
- text = **`tot HH:MM`**;
- semantic `textSecondary`.

Future / historical non-current programme:
- text = programme start `HH:MM`;
- semantic `textMuted`.

Historical programmes do not receive a special faded/past state.

### 11.2 Cell padding

Programme content is laid out inside the true frame.

Standard/comfortable:
- horizontal padding: **8 pt**;
- vertical content allowance: **9 pt top + 9 pt bottom**;
- title→time gap: **2 pt**.

Compact:
- horizontal padding: **4 pt**;
- same row ownership;
- no forced smaller title font.

There are no card margins, rounded corners or per-cell outer gaps.

### 11.3 Width-responsive content modes

Let:

`contentScale = max(1, fontScale)`

and use the currently visible remainder of the programme when the left edge is clipped.

#### Hidden visual content
If visible width < `28 × contentScale`:
- no visible title/time;
- keep the exact programme frame and action semantics;
- accessibility still exposes full programme information.

#### Compact
If visible width >= `28 × contentScale` and < `64 × contentScale`:
- title only;
- maximum 1 line;
- no visible secondary time.

#### Standard
If visible width >= `64 × contentScale` and < `96 × contentScale`:
- title maximum 1 line;
- secondary time is allowed only when visible width >= `72 × contentScale` and vertical fit also succeeds.

#### Comfortable
If visible width >= `96 × contentScale`:
- title maximum 2 lines;
- secondary time is allowed when vertical fit succeeds.

### 11.4 Vertical-fit degradation order

Never shrink substantive programme text to retain metadata.

Determine title lines from the width mode first. Then:

1. preserve title;
2. preserve the second title line in comfortable mode where row height permits;
3. render secondary time only if the following fits:
   `titleLineHeight × contentScale × titleLines + 2 + timeLineHeight × contentScale + 18 <= rowHeight`;
4. if it does not fit, remove visible secondary time;
5. never clip the title merely to keep time metadata.

Full start/end times remain available in accessibility semantics and Programme Detail.

## 12. Current programme

A programme is current only when:

`start <= actualNow < end`.

Do not derive current state from selected day, last action or viewport location.

Visible current treatment:
- title changes Medium → **Semibold**;
- secondary line changes to `tot HH:MM`;
- no progress bar;
- no permanent current fill;
- no border/radius/elevation change;
- no `Nu bezig` badge.

Accessibility label includes `nu bezig`.

If actual Now is outside the horizontally visible viewport, programme current semantics remain correct even though the compact current-time marker is hidden.

## 13. Programme pressed / focus state

Programme action owns its exact real-time frame.

Pressed:
- temporary semantic `surface` fill over the full programme frame;
- no radius;
- no shadow;
- no opacity-first treatment;
- clear immediately on release, cancellation or gesture takeover.

Keyboard/focus-capable environments:
- visible focus treatment may use a 2-pt inset semantic `accent` outline;
- must not alter frame geometry.

## 14. Partial-left programme readability

Preserve the proven partial-left title behaviour.

When the left viewport edge cuts through a programme:
- programme frame remains at its true start/duration;
- one pointer-events-none readability overlay may redraw the title inside the visible remainder;
- overlay starts **8 pt** inside the programme viewport edge;
- overlay background = semantic Guide `background`, not programme-card fill;
- title uses the same current/non-current title weight;
- maximum 1 visible overlay line;
- secondary time is omitted in the overlay;
- underlying programme remains the single interactive action;
- overlay switches only when the left edge crosses a programme boundary, not on every scroll frame.

Do not duplicate accessibility nodes.

## 15. Very short programmes and touch-target exception

Real programme duration is essential information and may create a visual frame narrower than the normal 44/48 touch recommendation.

Totaal must **not** solve this by:
- widening the visible programme;
- changing minute geometry;
- overlapping neighbouring hitSlop;
- assigning a neighbouring programme's visible area to the short programme.

Contract:
- the Pressable owns the exact programme frame;
- frames that are >=44 pt iOS / >=48 dp Android naturally meet the platform target;
- shorter spatial cells are an explicit essential-geometry exception;
- they remain reachable through VoiceOver/TalkBack as independent programme actions;
- no overlapping touch targets are permitted.

Physical validation must include representative 5-, 10- and 15-minute programmes. If direct touch proves materially unusable despite the essential-geometry exception, that is an **OWNER DECISION REQUIRED** for a future interaction pattern; Development may not invent zoom, expansion or overlapping targets locally.

## 16. Dynamic Type / Larger Text

### 16.1 Compact chrome

These controls use the existing **1.20** maximum multiplier:
- Guide presentation tabs;
- day selector label/chevron;
- `Nu`;
- time-axis labels;
- current-time marker label.

The shared tabs still grow from 48→64 pt above fontScale 1.35 to avoid truncation.

The Totaal day row stays **52 pt** and axis stays **44 pt** because their capped content fits without truncation.

### 16.2 Substantive content

No global cap:
- programme title;
- programme secondary time;
- channel fallback identity.

Responsive geometry comes from:
- row-height formula in §10;
- channel-width formula in §9;
- minute-width formula in §8;
- content modes/degradation in §11.

Do not switch to a smaller programme typeface at Larger Text.

### 16.3 Extreme accessibility fallback

At very high font scales:
- continue the same deterministic formulas;
- title may become the only visible programme content for many cells;
- secondary time disappears before title;
- narrow cells may have no visible copy but retain accessibility semantics;
- never flatten programme duration or disable font scaling to recover screenshot density.

## 17. Gestures and ownership

Frozen:
- horizontal gesture in programme/time area → time navigation;
- vertical gesture in schedule → channel navigation;
- directional lock remains;
- programme tap → Programme Detail;
- date selector tap → bounded bottom sheet;
- `Nu` tap → current instant;
- Guide presentation tab → presentation change;
- bottom navigation remains independent.

A diagonal gesture must not cause both horizontal time movement and vertical channel movement to commit semantic context simultaneously.

Shared collapse reads the native vertical schedule offset but does not introduce a second competing pan recogniser.

Programme press feedback must cancel cleanly when native scrolling takes ownership.

## 18. Programme Detail round-trip

Opening any Totaal programme leaves the Guide mounted.

Closing Programme Detail restores exactly:
- Guide presentation = Totaal;
- selected television day;
- exact viewed-time anchor;
- horizontal native scroll position;
- vertical semantic channel position;
- collapse state implied by that vertical position;
- current programme-window bucket/ownership.

Do not reset to `Nu`, top channel or 06:00 after closing Detail.

Personal-state changes in Programme Detail are not a reason to rebuild Totaal.

## 19. Date / 06:00 / DST behaviour

### 19.1 Continuous navigation

- midnight is continuous;
- crossing 00:00 does not change television-day context;
- crossing **06:00** changes the visible selected television day only when the stable viewed-time anchor crosses the boundary;
- a sliver of the following day appearing at the viewport edge is insufficient to switch the label.

### 19.2 Day selection

Selecting another day:
- preserves the viewed Amsterdam wall-clock time where practical;
- uses the existing DST-aware nearest-practical mapping;
- moves programme-window ownership before non-animated native repositioning when needed.

### 19.3 23-/25-hour days

Timeline width derives from the real elapsed interval between local 06:00 boundaries.

Do not assume 24 hours.

Tick positions and programme geometry use absolute timestamps; text labels use Europe/Amsterdam local time.

Repeated fall-DST wall-clock labels may occur because two distinct real instants share a local clock label; geometry remains real-time-correct.

### 19.4 Nu

`Nu` always:
- targets the real current instant;
- selects the containing television day;
- preserves vertical channel context.

## 20. Loading, hosted data and schedule availability

### 20.1 Fixture-first

The deterministic fixture remains a valid true-fixture startup source and must use the final production visual treatment.

Do not flash prototype Totaal styling while hosted data loads.

### 20.2 Established canonical catalogue

Once a hosted/canonical channel catalogue is established:
- day changes and refreshes retain that catalogue;
- do not transiently replace it with the generic deterministic channel catalogue;
- preserve channel order/identity unless authoritative data itself changes it.

### 20.3 Day loading

If a selected day has not arrived yet but the established channel catalogue is known:
- keep shell, date, `Nu`, axis and channel identities stable;
- do not fabricate programme rows;
- show one calm non-blocking `Gidsgegevens laden…` state in the schedule region;
- do not repeat loading copy per channel.

### 20.4 Hosted replacement

When hosted schedule replaces fixture/older content:
- preserve selected day;
- preserve viewed-time anchor;
- preserve horizontal native offset derived from that anchor;
- preserve top visible channel by canonical channel id where practical;
- preserve vertical semantic offset when channel order is unchanged;
- do not remount Totaal.

### 20.5 Refresh failure

If usable schedule data already exists:
- keep it visible;
- do not blank the Guide solely because a refresh failed.

If no usable authoritative schedule exists for the selected scope:
- retain known channel catalogue;
- keep shell/context/axis;
- show one calm `Geen gidsgegevens beschikbaar.` state;
- do not present uncovered scope as an authoritative empty schedule;
- do not repeat the same message in every row.

### 20.6 Partial coverage

Render only authoritative covered programme data.

An uncovered region is not equivalent to “nothing is on”. Do not fabricate programmes or “geen programma” cells.

When the entire visible programme viewport is uncovered, expose the single availability state above. Partial uncovered areas remain visually blank/open rather than inventing schedule facts.

## 21. Light / Dark / System tokens

Geometry is identical across appearance modes.

Use semantic tokens only.

### Canvas
- Guide canvas: `background`;
- channel rail: `background`;
- axis: `background`;
- no permanent programme `surface` fill.

### Text
- primary title: `text`;
- current `tot HH:MM`: `textSecondary`;
- non-current start time: `textMuted`;
- axis labels: `textMuted`.

### Structure
- row separator: `border`;
- channel rail boundary: `border`;
- programme boundary: `border @0.70`;
- axis baseline: `border`;
- axis ticks: `railTick`.

### Interaction
- programme pressed: `surface`;
- control pressed: existing shared Guide pressed treatment;
- current-time marker: `currentTime`;
- marker text: `onCurrentTime`:
  - light **#000000**;
  - dark **#10100F**.

Do not redefine global `border`, `railTick` or `currentTime` to make Totaal work.

System appearance follows the OS without remounting or losing Guide context.

## 22. Accessibility

### 22.1 Programme actions

Each programme is one button.

Accessible label contains:
- full channel display name;
- full programme title;
- start time;
- end time;
- `nu bezig` when actual-current.

Hint may say it opens programme details.

Visual truncation never truncates the accessibility label.

### 22.2 Channel rail

With programme actions present:
- channel logo/identity does not need a separate focus stop for every row;
- full channel name is already included in each programme label.

If a retained channel catalogue is shown without programme actions because schedule is unavailable:
- expose each visible retained channel identity with full `displayName` so VoiceOver/TalkBack users can still discover channel context.

### 22.3 Day selector / tabs / Nu

- Guide presentation selector: tablist/tabs with selected state;
- date control: button with selected day label and “Kies een dag” action context;
- bottom-sheet selected day: selected state plus visible non-colour indicator;
- `Nu`: button labelled `Ga naar nu`;
- compact controls keep platform-safe targets.

### 22.4 Current state

Current programme semantics never rely only on:
- red marker;
- title weight;
- time copy.

Accessibility label explicitly includes current/live state.

### 22.5 Focus order

Within the schedule viewport, focus follows visual programme order:
- channel order top→bottom;
- within a channel, chronological programme order.

Do not expose duplicate overlay-title accessibility nodes.

## 23. Performance / rendering constraints

Production convergence must preserve the PR #74 performance architecture:

- programme data indexed by channel;
- horizontally bounded programme rendering;
- coarse viewport buckets;
- conservative **1.5 viewport** overscan;
- native scroll frames stay on the UI thread;
- React receives coarse bucket changes, not per-frame horizontal positions;
- animated programme-window ownership follows the real native viewport;
- non-animated jumps may prealign the target render window;
- no eager rendering of the entire D-2..D+7 grid;
- no per-frame React state updates for vertical collapse.

Visual open-grid changes do not justify deleting windowing or rebuilding the schedule architecture.

## 24. Deterministic test contract for Development

Development must add/update tests for at least:

1. shared Guide tabs 48/64 responsive metrics remain unchanged;
2. Totaal context = 52 and axis = 44;
3. persistent stack = 96 at all font scales;
4. expanded overlay = 196 standard / 212 Larger Text;
5. collapse = 56 native with 44/60 visual compensation;
6. fixed viewport top = 96 below top safe area;
7. Reduce Motion endpoint switch = 28;
8. compact date labels: `Vandaag`, `Morgen`, explicit pre-06:00 labels;
9. Totaal no longer uses long `Vandaag · <datum>` copy;
10. `Nu` preserves vertical channel context and restores current day/instant;
11. 15-minute axis positions with labels only at :00/:30;
12. major/minor tick metrics and semantic `railTick`;
13. axis height44 and 3.00 base pt/min;
14. minute-width responsive formula;
15. current marker exact-minute X and no full-height current line;
16. marker hidden when actual Now is horizontally offscreen;
17. channel rail width responsive formula;
18. successful Totaal logo renders without visible duplicate channel caption;
19. missing-logo fallback exposes full display name;
20. row-height responsive formula;
21. exact programme frame width uses real duration with no 2-pt visual subtraction;
22. one boundary per programme end;
23. no programme cards/radii/progressbars;
24. normal/current 15/19 Medium/Semibold hierarchy;
25. `tot HH:MM` only for actual-current programme when visual time fits;
26. non-current time = start time;
27. title survives before secondary time;
28. hidden/compact/standard/comfortable width thresholds;
29. partial-left overlay keeps exact programme geometry and has no accessibility node;
30. programme pressed uses temporary semantic surface without opacity-first feedback;
31. programme-window bucket/overscan architecture remains unchanged;
32. programme-window ownership for animated vs non-animated jumps remains unchanged;
33. 06:00 anchor-driven date-context transition;
34. 23-/24-/25-hour television-day timeline width;
35. Programme Detail round-trip retains presentation/day/time/x/y context;
36. established canonical channel catalogue is not replaced by generic fixture during day loading;
37. hosted replacement preserves viewed/channel context where ids remain;
38. unavailable scope is not presented as an authoritative empty schedule;
39. retained channels become accessibility-discoverable when programme actions are absent;
40. light/dark/system semantic token mapping;
41. no floating Totaal Guide selector;
42. no standalone `Gids` heading.

Time-sensitive tests use fixed/injected instants. No wall-clock sleeps.

## 25. Physical iPhone validation checklist

After runtime implementation and exact-head CI, validate on physical iPhone against the canonical four-state board.

### Expanded / standard text
1. shared `tv.` brand/action row matches the accepted shell;
2. Totaal tab is selected in shared top tabs;
3. no standalone `Gids` heading;
4. date row is 52 pt and uses only `Vandaag` / `Morgen` where allowed;
5. `Nu` is separate, compact and reachable;
6. axis feels 44 pt and visually quiet;
7. :00/:30 labels and :15/:45 minor ticks scan cleanly;
8. current marker is compact, exact-minute and does not create a vertical red rail;
9. 84-pt base channel rail reads logo-first;
10. readable logos have no duplicate visible names;
11. open schedule reads as one canvas, not cards;
12. 76-pt rows feel calm but not wasteful;
13. title 15/19 hierarchy and 13/18 time are physically legible;
14. actual-current title + `tot HH:MM` is clear without a progressbar/card;
15. future cells use start time only where useful;
16. partial-left title stays readable during settled horizontal positions.

### Condensed / vertical scroll
17. brand/actions/tabs disappear fully;
18. no compact `tv.` remains;
19. date + Nu + axis remain as the 96-pt functional stack;
20. one slow drag through the 56-pt collapse region has no jump/oscillation;
21. one hard fling from rest has monotonic native momentum and no forward/back loop;
22. first visible channel/programme remains visually attached to the sticky stack;
23. scrolling back to top restores expanded chrome naturally.

### Horizontal interaction
24. slow horizontal pan remains native and smooth;
25. strong fling keeps programme windowing filled with no blank bucket transition;
26. reverse fling does not collapse partial-left titles;
27. day-context changes only when the stable anchor crosses 06:00;
28. crossing midnight is visually continuous;
29. `Nu` restores exact Now without moving the vertical channel context.

### Dynamic Type
30. representative ~135% setting: programme copy scales, row/channel/minute geometry responds;
31. >1.35: Guide tabs use accepted 64-pt/two-line shared mode;
32. date/Nu/axis chrome stays readable in fixed 52/44 rows;
33. title survives before time metadata;
34. no overlapping/truncated substantive programme text;
35. extreme accessibility setting remains operable even where secondary time disappears.

### Programme edge cases
36. long title;
37. 5-minute programme;
38. 10-minute programme;
39. 15-minute programme;
40. programme crossing the left viewport edge;
41. programme beginning/ending exactly on :00/:15/:30/:45;
42. missing logo fallback;
43. current programme partially left-clipped.

### Data / round-trip
44. fixture-first → hosted replacement causes no shell/style flash;
45. established hosted channel catalogue remains during another-day loading;
46. temporary refresh failure retains usable schedule;
47. unavailable day shows one calm state, not repeated row errors;
48. Programme Detail open/close preserves x/y/day/presentation;
49. light/dark/system switch preserves context.

### Accessibility / motion
50. VoiceOver programme labels include channel/title/start/end/current state;
51. retained channel identities are discoverable when no programme actions exist;
52. tabs/date/Nu expose correct roles/states;
53. partial-left overlay does not create duplicate VoiceOver stops;
54. Reduce Motion uses clean 28-pt endpoint switch;
55. short-programme touch behaviour is assessed explicitly; no overlapping hit areas.

## 26. Android validation items

Physical Android remains deferred until hardware is available, but later validation must cover separately:

1. 48-dp compact control targets;
2. TalkBack programme/channel semantics and focus order;
3. nested horizontal/vertical gesture arbitration;
4. collapse smoothness and no offset oscillation;
5. system Back from Programme Detail and day-selector sheet;
6. font rendering/line metrics for Instrument Sans;
7. Dynamic Type equivalent font scaling and row/channel geometry;
8. 5/10/15-minute programme direct-touch usability;
9. light/dark/system;
10. realistic channel/programme-volume performance.

Successful Android build/export is not physical Android acceptance.

## 27. Production calibration register

Development must treat these as implementation constraints:

1. shared screen inset **20**;
2. GuideChrome **100 standard /116 >1.35**;
3. day + Nu row **52**;
4. time axis **44**;
5. persistent stack **96**;
6. rest overlay **196 /212**, settled **96**;
7. collapse **56**, max translate **12**, Reduce Motion switch **28**;
8. visual compensation **44 /60**;
9. fixed native viewport top **96** below safe area;
10. date typography **15/20 Semibold**, compact cap1.20;
11. Nu **36 visible /48 min width /44 iOS-48 Android touch / radius18 /14/18 Semibold**;
12. axis base scale **3.00 pt/min**, formula §8.1;
13. axis ticks every15; labels only :00/:30;
14. major tick **1×10 railTick @0.70**; minor **1×6 @0.45**;
15. current marker **46×20**, radius10, notch6×4, time12/15 Semibold;
16. channel rail base **84**, responsive formula §9.1;
17. Totaal logo optical box max **52×40**;
18. channel fallback **13/16 Semibold**, max2;
19. row base **76**, responsive formula §10.1;
20. programme frame = exact duration × minuteWidth; no 2-pt width subtraction;
21. programme boundary = one `border` hairline @0.70;
22. title **15/19 Medium**; current **15/19 Semibold**;
23. time **13/18 Regular**; current `tot HH:MM`, non-current start `HH:MM`;
24. cell padding **8 horizontal /9 vertical**, compact horizontal4, title→time2;
25. width modes = **28 /64 /96 × fontScale**, time threshold **72 × fontScale** plus vertical-fit gate;
26. pressed programme = temporary semantic `surface`, no card/radius/opacity-first;
27. partial-left overlay inset **8**, title-only, pointer-events-none;
28. final row clearance **16** after shared bottom-nav ownership;
29. programme overscan remains **1.5 viewports**;
30. all date/time semantics remain ADR 0008;
31. Programme Detail round-trip context remains frozen.

Development must not substitute local alternatives without concrete physical/technical evidence and an owner-approved spec update.

## 28. Owner escalation status

No new fundamental owner decision is required to start Development after this specification is merged.

One explicit future evidence gate remains: very short real-time programme cells can be narrower than 44/48 because real duration geometry is frozen and essential. The production rule is no geometry falsification and no overlapping hitSlop. If physical iPhone/Android validation shows materially poor direct-touch usability, escalate a dedicated interaction solution to the owner rather than inventing one during implementation.

## 29. Development handoff

After this specification is canonical on `main`:

**Next step: Development — Totaal production visual convergence.**

The runtime increment is HIGH risk because it touches:
- Guide nested scrolling;
- collapse architecture;
- large schedule rendering;
- time-axis geometry;
- Programme Detail context;
- Dynamic Type;
- accessibility;
- fixture/hosted transition.

Required gate order:

**Development → exact-head CI → physical iPhone validation → Independent QA → Lead merge decision.**

Do not begin Phase 5 Search before this Totaal production convergence is complete.
