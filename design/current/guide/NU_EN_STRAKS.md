# Nu & Straks — current accepted visual

Status: **ACCEPTED**
Accepted: 2026-09-13
Production refinement accepted: 2026-09-18
Owner refinement accepted: 2026-09-21
Kijktip refinement + production calibration accepted: 2026-09-22
Kijktip label direction + final production calibration accepted: 2026-09-22
Production specification: `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`

## Canonical asset
- Light/dark/live/Primetime reference: `/Teevee/Nu & Straks: Televiegids in beeld.png`
  - file id: `file_000000005b9c821080bc05914ea8c110`

## Preserve
- One shared reference instant across all channels.
- Reference/current programme is visually dominant.
- Exactly three following programme slots are shown more quietly.
- No programme artwork.
- No genre labels.
- No progress bars.
- No chevrons or repeated `Daarna` labels.
- Compact shared time rail with **15-minute navigation steps**; only whole and half hours carry visible time labels.
- Every quarter-hour position has a 1-pt vertical tick: whole/half-hour ticks are 10 pt, quarter-hour ticks 6 pt; both use the dedicated `railTick` semantic token, while the 2×12 `currentTime` selected/current marker remains visually strongest.
- `Primetime` is the explicit 20:30 shortcut; `Nu` restores live when browsing.
- Live mode always resolves programmes against the **actual current instant** and never rounds semantic `Nu` to a rail slot; there is no standalone visible reference-time copy because the rail provides temporal orientation.
- Horizontal movement changes the reference time; vertical movement changes channel context.
- Channel order and vertical position stay stable while the reference time changes.
- The physically accepted time-rail fling/settle behaviour remains frozen.
- `NowNextGuideView` remains behind its deferred import boundary.

## Current behaviour that overrides the screenshot
ADR 0008 defines the active television day as 06:00 to 06:00. Between 00:00 and 05:59, Nu & Straks remains in the preceding television-day context. It still has no independent date selector.

The accepted shared Guide shell also supersedes any standalone prototype header/floating-selector treatment visible in current runtime evidence. Nu & Straks uses the shared Guide chrome and keeps a **52-pt utility-only Primetime/Nu context + 52-pt time rail** as the 104-pt persistent functional stack at all font scales.

## Owner-accepted refinement — 2026-09-21

Physical iPhone evidence on the production-convergence candidates justified reopening a small set of Nu & Straks presentation details. The first refinement established the 15-minute rail and compact default density. A second physical review of PR #96 exact head `32db9459d265e8546c7137baf82e623f015ad652` rejected only rail-tick legibility, larger-text composition and the perceived rhythm of the three following programmes. These refinements are **OWNER ACCEPTED** and supersede the earlier production calibration only where listed:

- time navigation settles in **15-minute** increments instead of 30-minute increments;
- whole and half hours show text labels plus a thin vertical tick; quarter hours show only a shorter thin vertical tick;
- the selected/current rail marker remains the strongest temporal marker;
- all standalone visible reference-time copy is removed, including `Referentietijd`, live `Nu · HH:MM` and browse `HH:MM`; the rail itself carries visible temporal orientation;
- visible reference-programme `tot HH:MM` metadata is removed because the following programme start time normally communicates the same boundary; full start/end times remain available to accessibility and Programme Detail;
- the reference programme block remains minimum 64 pt but its title is bottom-aligned; the channel identity zone uses the same bottom ownership inside that unchanged reference block so logo/fallback identity stays optically associated with the reference programme; the dedicated reference→following gap is **0 pt**, with the former 4 pt moved to row-bottom padding so base row height remains unchanged;
- the three following programme rows remain directly adjacent with no additional interaction gap while retaining independent minimum 44 pt iOS / 48 dp Android touch targets; at standard text, visible content uses the accepted progressive target-slack offsets (#1 = 2/3, #2 = 1/3, #3 = 0) while Larger Text remains centred;
- rail ticks keep 1-pt thickness but use dedicated `railTick` contrast: light `#80807A`, dark `#72726B`; major opacity 1.00, quarter opacity 0.78;
- above font scale 1.35, shared Guide tabs remain 64 pt / max two lines; Nu & Straks itself stays on the same **52-pt utility-only context** because the reference-time lane has been removed;
- above font scale 1.35, following programmes use an inline time+title composition with at most two visible lines; stacked time-above-title is reserved for the extreme >2.0 / <180-pt width fallback;
- the three normal following targets keep their 44/48 interaction geometry; standard-text visible content is progressively lifted through the available target slack (#1 2/3, #2 1/3, #3 0), while Larger Text remains centred; compact continuation also retains reference-title bottom alignment plus the 0-pt reference→following spacer;
- active/current `Nu` and return-to-live `Nu` must be visually and semantically distinct. The same control treatment may not represent both states.

Exact production metrics and acceptance criteria are frozen in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`.

## Owner-accepted Kijktip label refinement + final production calibration — 2026-09-22

This refinement supersedes the earlier **text-only** Kijktip presentation while preserving the accepted role-responsive placement, geometry and progressive-disclosure semantics.

### Shared final semantic colours

Production-frozen:

- **`editorialAccent`**
  - light: **#315A63**
  - dark: **#A9C9CF**
- **`editorialAccentSurface`**
  - light: **#EEECE7**
  - dark: **#171715**

Kijktip text uses `editorialAccent`; the compact label uses `editorialAccentSurface`.

Contrast:
- Kijktip text on label surface: **6.32:1 light / 8.89:1 dark**;
- surface vs Guide canvas: about **1.12:1 light / 1.22:1 dark**.

The label is editorial metadata, not interaction or advertising. No border, shadow, underline, icon or independent pressed state. During programme press the label retains its normal editorial colours while the parent programme uses its existing temporary `surface` fill.

### Shared Kijktip-only label box

Text:
- literal **`Kijktip`**;
- **12/16 Instrument Sans Medium**;
- letterSpacing 0;
- substantive/uncapped Dynamic Type.

Box:
- horizontal padding: **6 pt** each side;
- vertical padding: **0 pt**;
- radius: **4 pt**;
- outer height: **16 × S**, where `S = max(1, effectiveFontScale)`;
- outer width: `intrinsicKijktipTextWidth + 12 pt`;
- no minimum width beyond intrinsic text + padding;
- no border/shadow.

Because vertical padding is 0, the label occupies exactly the already accepted 16×S Kijktip line box and adds **0 pt** to reference/following height.

### Reference programme

- Kijktip-only label remains above the dominant title;
- label→title gap stays **3 pt fixed**, non-scaling;
- reference/title hierarchy and deterministic reference height remain frozen;
- no Kijktip-specific reference-height growth.

Final content-safe title formula therefore remains:

`maxReferenceKijktipTitleLines = clamp(1, 2, floor((H - (16 × S) - 3) / (22 × S)))`

where `H = nowNextReferenceBlockHeight(S)`.

Representative results remain:
- S1.00 / H64 → max 2 title lines;
- S1.35 / H64 → max 1;
- S1.50 / H66 → max 1;
- S2.00 / H88 → max 1.

At S1:
- one-line title: label Y23…39, title Y42…64;
- two-line title: label Y1…17, title Y20…64.

### Following programme

- Kijktip-only label remains inline after the visible programme title;
- title→label gap stays **8 pt fixed**, non-scaling;
- no right-aligned/global label column;
- no Kijktip-only second line;
- no following-target height change.

Final width reservation:

`labelOuterWidth = intrinsicKijktipTextWidth + 12`

`protectedReserve = labelOuterWidth + 8`

The **48-pt minimum final-line title readability floor remains frozen**.

Behaviour:
1. short titles use intrinsic width and label starts 8 pt after the visible title;
2. long titles tail-ellipsize inside the protected title budget;
3. if final title budget falls below 48 pt, use a deliberate single `…`;
4. label itself remains fully visible.

For the existing >1.35 max-two-line layout, the reserve applies only to the final visible title line. The first line may use the full title lane.

For the existing >2.0 / <180 extreme fallback, time remains stacked first and the Kijktip label stays inline with the title below it. The label adds no height term.

### Accessibility, multiples and progressive disclosure

- one programme focus target only;
- semantic order remains **channel → full title → Kijktip → start/end → current state when applicable**;
- visible label is not a separate VoiceOver/TalkBack node;
- one/two/three following Kijktips repeat independently;
- reference + following labels may coexist;
- the same programme intentionally moves from `Titel  [Kijktip]` while following to `[Kijktip]` above `Titel` when reference;
- no grouping, numbering, colour coding or shared editorial rail.

### Frozen geometry

Remain unchanged:
- 44-pt iOS / 48-dp Android following targets;
- zero interaction gap;
- standard progressive target-slack offsets;
- Larger Text inline-two-line composition;
- >2.0/<180 stacked fallback;
- reference/following Pressable ownership;
- reference/channel-row heights;
- vertical channel-position preservation.

## Accepted production density/accessibility refinement
The former compact following-row debt is resolved by the owner-approved production specification:

- each following programme owns a real, non-overlapping platform-safe target: minimum **44 pt on iOS / 48 dp on Android**;
- three following **slot geometries** remain reserved per channel even when programme data is missing, so reference-time changes do not shift vertical channel context;
- at effective font scale `<= 1.35`, following time + title remain on one row;
- above `1.35`, following content remains substantive and uncapped but uses the accepted inline time+title two-line composition to avoid excessive vertical expansion;
- stacked time/title is only the extreme-width fallback when font scale >2.0 and programme width <180 pt;
- compact functional chrome keeps the documented 1.20 cap; shared presentation tabs still use the accepted 64-pt Larger Text state while Nu & Straks utility context remains 52 pt at all scales;
- standard-text following content uses the canonical progressive slack offsets inside unchanged non-overlapping 44/48 touch geometry; Larger Text content remains centred;
- reference/following hierarchy remains typographic and open: no cards, artwork, progress, chevrons or extra labels are introduced.

Exact metrics, safe-area rules, shell condensation, Nu/Primetime states, time-rail geometry, pressed states, empty-data behaviour, Programme Detail round-trip and physical validation criteria live in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`.

## Superseded
Earlier Nu & Straks designs with progress bars, fewer following programmes, artwork, genres, card-heavy treatment or a calendar-day-only interpretation are not current.

The following prototype/runtime treatments are also non-canonical:
- 30-minute-only rail navigation;
- rail labels without positional quarter/half-hour ticks;
- generic `border` colour for rail ticks instead of the dedicated `railTick` semantic token;
- fixed one-line 48-pt presentation tabs above font scale 1.35;
- 88-pt/two-lane Nu & Straks reference-time context above font scale 1.35;
- standalone visible reference-time copy (`Nu · HH:MM` / browse `HH:MM`) or an empty lane reserved for it;
- automatic stacked following layout for every font scale above 1.35;
- the older fixed #1 bottom / #2 centre / #3 top bias; the current standard-text rule is the proportional 2/3, 1/3, 0 target-slack progression;
- a 4-pt dedicated reference→following spacer;
- generic `border`/hairline treatment for the rail-bottom line;
- rounding live `Nu` semantics to the nearest rail slot;
- a visible `Referentietijd` caption;
- visible reference-programme `tot HH:MM` metadata;
- identical visual treatment for active/current `Nu` and return-to-live `Nu`;
- strict-midnight day bounds;
- standalone `TEEVEE / Gids / Nu & Straks` production header;
- floating bottom presentation selector for this view;
- 24-pt interactive following rows;
- overlapping hitSlop as an accessibility workaround;
- system-font styling that bypasses Instrument Sans;
- opacity-heavy programme press feedback as the primary interaction state;
- any rail-settle path that starts a second `scrollTo()` after native snap;
- the earlier text-only Kijktip treatment without the owner-approved editorial label surface;
- a separate or right-aligned following Kijktip column;
- Kijktip-specific reference/following height growth;
- long-title truncation that causes the Kijktip label to disappear.
