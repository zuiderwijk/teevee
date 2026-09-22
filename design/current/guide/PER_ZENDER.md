# Per zender — current accepted visual

Status: **ACCEPTED**
Accepted: 2026-09-13; day-selector and Primetime behaviour amended 2026-09-15; accepted visual refinement amended 2026-09-17; selected-channel-heading removal, current-programme spacing and compact temporal-context refinement accepted 2026-09-18; Kijktip editorial-disclosure refinement + production calibration accepted 2026-09-22; Kijktip label direction accepted 2026-09-22 (final label-surface calibration pending)

## Canonical asset
- Light + dark reference: `/Teevee/TV-gids app in licht en donker thema.png`
  - file id: `file_000000008b2481f4ad34bb1547fc813e`
- Accepted Guide day-selector states / bottom sheet:
  - `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - file id: `file_00000000390c8210b76256621721592b`
- Accepted sticky / condensed day-selector behaviour:
  - `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - file id: `file_00000000314481f69f6a34d18ece1c21`
- Accepted Per-zender Kijktip refinement:
  - `/Teevee/Per Zender Kijktip refinement - 12pt Medium textSecondary.png`
  - Library file id: `file_00000000dd7c8210a35769aada30424b`
  - stable Library record: `libfile_d161c6bed2a481919a917acdeaeeec41`

The 2026-09-17 owner-approved refinement in this document supersedes the older visual references only for the explicitly listed refined details below. The 2026-09-18 owner-approved refinements additionally remove duplicate selected-channel text, expand the current-programme treatment and compact the temporal context after physical iPhone validation. The 2026-09-22 owner-approved Kijktip label refinement supersedes the earlier text-only disclosure treatment only for Kijktip presentation: Per zender now uses one compact editorial label in the existing time-column zone containing both start time and `Kijktip`. It does not reopen any row, title-column, chrome, rail, gesture or current-programme metric. Exact label surface, padding and corner calibration remain pending one final Accepted Design Refinement. All other accepted composition remains unchanged.

Detailed shared day-selector contract: `design/current/guide/GUIDE_DAY_SELECTOR.md`.
Development-ready visual-convergence handoff: `docs/PER_ZENDER_VISUAL_CONVERGENCE.md`.

## Preserve
- Open vertical typographic schedule, not cards.
- No programme thumbnails.
- No genre labels.
- Persistent horizontally browsable channel-logo strip.
- Channel logo primary; channel name secondary/contextual.
- Horizontal swipe across the schedule changes adjacent channel.
- Changing channel preserves viewed time anchor where practical.
- No decorative previous/next arrow buttons around the channel strip.
- Deliberate whitespace between channel selector and programme list.
- Current programme may receive restrained live/current emphasis.
- Light/dark/system use the same quiet Guide shell.
- `Primetime` is a first-class Per-zender utility shortcut to the selected television day's 20:30 reference point.
- Programme rows remain open typographic rows; pressed feedback must never turn them into permanent cards.

## Accepted day/time navigation
- One compact typographic date selector plus separate `Primetime` and `Nu` actions.
- Tapping the date selector opens the bounded D-2..D+7 bottom sheet; no unrestricted calendar or horizontal ten-day rail.
- Changing day preserves the viewed wall-clock time where practical.
- `Primetime` keeps the selected television day and jumps the vertical schedule to 20:30 on that day.
- Between 00:00 and 05:59, `Primetime` therefore jumps back to 20:30 on the preceding television-day date.
- `Nu` is distinct from `Primetime`: it restores the actual current instant and corresponding television day.
- During vertical schedule scrolling, non-functional brand/header chrome condenses away.
- The channel-logo strip remains sticky and is followed by one compact sticky temporal-context row with date, `Primetime` and `Nu` available.
- Do not render a textual selected-channel label in either expanded/rest or condensed state; the persistently selected logo in the rail is sufficient visible channel identity.
- Full channel identity remains available through the channel item's accessibility label and the existing missing-logo text fallback.
- Date/time utilities must not intercept the accepted horizontal schedule swipe for adjacent channels.
- Do not reintroduce the earlier full time-picker (`Vanmiddag`, `Vooravond`, `Kies tijd…`) as part of this decision; only the direct `Primetime` shortcut is accepted.

## Accepted refinement — 2026-09-17

### Temporal utility states and reduced button chrome
`Nu` and `Primetime` are no longer treated as visually static buttons only. They have explicit semantic states based on the actual schedule context.

- Date remains primarily typographic with disclosure chevron; no permanent date pill.
- `Primetime` uses a light secondary action treatment when inactive.
- `Nu` may use the stronger return-action treatment when the user is away from the actual current instant.
- When `Nu` is the current temporal context, it switches from return-action treatment to an explicit active/current state.
- When the stable schedule anchor corresponds to the programme/context containing the selected television day's 20:30 reference point, `Primetime` uses the active/current state.
- Active/current state is semantic, not determined by the last control tapped.
- Active/current state must not rely on colour alone; the accepted refinement uses a restrained short `currentTime` underline plus semantic selected/current accessibility state.
- `disabled` is reserved for an actually unavailable action; active/current is not disabled.
- Avoid three competing pill controls. Programme content remains visually dominant.

### Programme typography refinement
Per-zender programme titles are slightly quieter than the earlier production calibration:

- standard programme title: **17/21, weight 500**;
- current programme title: **19/23, weight 700**;
- programme time remains **16/20, weight 400**;
- current-description density from this refinement is superseded by the 2026-09-18 current-programme spacing refinement below.

This is a Per-zender surface-specific calibration. It does not change Instrument Sans as the accepted Teevee UI family or automatically change typography on other product surfaces.

### Condensed channel-strip efficiency
- Rest-state channel strip remains **72 pt** high.
- Settled condensed/sticky channel strip is **60 pt** high.
- Channel item remains **48 × 48**; touch target and logo geometry do not shrink.
- Normal motion may interpolate 72 → 60 during the existing collapse transition.
- Reduce Motion uses the accepted discrete rest/condensed transition.

### Channel strip as spatial navigation
After direct channel selection or adjacent-channel schedule swipe:

1. keep the selected channel fully visible;
2. move it toward a comfortable/optical centre where geometry allows;
3. clamp naturally at rail start/end;
4. where trailing channels remain and this does not conflict with selected visibility/centring, leave a small partial next-channel continuation cue visible.

Priority is: selected fully visible → selected comfortably centred → trailing continuation cue where practical.

Do not add arrows, fade masks, gradients, page dots or permanent swipe-help text.

### Programme-row pressed state
- Entire programme row remains tappable.
- On press only, apply a subtle temporary semantic `surface` fill across the full row.
- No permanent programme background.
- No card radius, chevron or additional border.
- Existing row separator remains intact.
- Press fill clears on release/cancel.
- Do not use strong whole-row opacity reduction as the primary pressed treatment.

## Accepted refinement — 2026-09-18

### Remove the large rest-state selected-channel heading
- The separate large textual selected-channel heading below the channel-logo strip (`NPO 1`, `NPO 3`, etc.) is removed completely from the expanded/rest state.
- The selected channel logo in the rail is the primary and sufficient channel identity in the expanded/rest state.
- Do not replace the removed heading with another large label, badge or duplicate identity treatment.
- This earlier refinement removed the large rest-state heading; the later compact temporal-context refinement below additionally removes the former compact condensed channel name.
- Channel identity remains available through the selected logo, accessibility label and missing-logo fallback.

### Current-programme spacing refinement
The current-programme row intentionally receives substantially more breathing room. This is owner-approved premium-density calibration, not a card treatment.

- current row base height: **176 pt** at fontScale 1.0;
- current title remains **19/23, weight 700**;
- title → description gap: **10 pt**;
- current description: **15/22, weight 400**, maximum **4 lines**;
- when four description lines are present, preserve at least **20 pt** clear space before the progressbar;
- current content top inset remains **14 pt**;
- progressbar remains **4 pt** high with **16 pt** bottom inset;
- standard non-current rows remain **52 pt** at fontScale 1.0;
- no permanent background, radius, card chrome or additional current indicator is introduced.

The accepted visual intent is deliberately more spacious and editorial: title, synopsis and progress must read as three distinct layers rather than one compressed block.

### Compact temporal-context refinement — physical iPhone validation
The physically validated refinement makes expanded and condensed temporal chrome the same calm one-row composition. A subsequent physical iPhone validation on PR #88 exact head `18c021b4ccfb36d599d6301dd04f9ec96ab6d66d` refined only the expanded/rest vertical spacing distribution.

- Do **not** add the selected channel name in condensed state. The persistent selected logo is sufficient visible identity.
- Expanded/rest rail → temporal utilities spacing is **4 pt** and temporal utilities → schedule spacing is **24 pt**, superseding the physically rejected 16/12 distribution. The total expanded gap sum remains 28 pt.
- From **06:00 through 23:59**, the current television day is shown as **`Vandaag`** and the next television day as **`Morgen`**, with no redundant weekday/date suffix.
- Other television days use an explicit localized weekday + date label such as **`Zo 20 sep`**.
- From **00:00 through 05:59**, Per zender uses **only explicit weekday + date labels** for the day selector and day-sheet options; `Vandaag` and `Morgen` are not shown in that window. This preserves the canonical 06:00 television-day boundary without ambiguous calendar-day wording.
- Date remains **15/20 600**, Primetime/Nu remain **14/18 600**. For these Per-zender compact temporal controls, `maximumFontSizeMultiplier = 1.20` is a **hard cap**.
- At the cap, date is at most 18/24 and Primetime/Nu at most 16.8/21.6. Visible temporal labels remain one line; the 88-pt wrapped Per-zender context is no longer an accepted Dynamic-Type state.
- Touch targets remain minimum 44 pt iOS / 48 dp Android, and full date/channel semantics remain exposed to VoiceOver/TalkBack.
- Programme times, titles and current description keep their existing substantive Dynamic Type behaviour; this cap applies only to compact functional chrome.
- With the fixed 72-pt rail, centred 48×48 item, 52-pt context and centred 36-pt visible controls, the accepted 4/24 calibration yields approximately **24 pt visible logo→controls whitespace** and **32 pt controls→schedule whitespace**, intentionally grouping temporal navigation with the channel rail while giving programme content more breathing room.

## Owner-accepted Kijktip label refinement — 2026-09-22

This targeted refinement supersedes the earlier **text-only** Kijktip presentation from PR #122 while preserving its product semantics, programme ownership and frozen Per-zender geometry.

### Accepted visual direction

For a programme with canonical `isKijktip = true`:

- the **existing time-column zone** becomes one compact, editorial, more-square label;
- the label contains **both the programme start time and the literal `Kijktip`**;
- start time remains the first line; `Kijktip` remains the quiet second line;
- the programme-title column remains exactly where it is and does not lose width;
- the label has no independent interaction, focus target or selected state;
- no icon, badge glyph, underline or extra current/Now signal is added;
- standard/current row heights and all scrolling/paging mechanics remain unchanged.

The label is an editorial information container, not a button or promotional badge.

### Accepted editorial colour family

Variant C / Petrol Ink is the owner-approved editorial foreground direction:

- conceptual semantic token: **`editorialAccent`**;
- light: **`#315A63`**;
- dark: **`#A9C9CF`**.

For Per zender, both time and `Kijktip` belong to the same accepted editorial label treatment. Exact internal foreground hierarchy, if any, is part of the final label calibration; Development must not invent a second colour locally.

The label also receives a low-emphasis theme surface that separates it slightly from the Guide canvas. The semantic role is conceptually **`editorialAccentSurface`**, but the exact light/dark values and final token name are **not yet production-frozen**.

Surface direction:
- light: subtly darker/more defined than the near-white Guide canvas;
- dark: perceptually equivalent subtle separation from the dark canvas, normally requiring a slightly lighter surface rather than literal further darkening;
- never a saturated petrol fill;
- never a button-like/high-contrast chip.

### Typography preserved inside the label

The accepted text metrics remain the starting point for final calibration:
- start time: existing **16/20 Instrument Sans Regular**;
- `Kijktip`: **12/16 Instrument Sans Medium**;
- `Kijktip` letterSpacing **0**;
- internal time→Kijktip relationship remains the accepted **2-pt** structural gap unless physical calibration proves the box needs a tiny optical adjustment.

Kijktip remains substantive/uncapped programme metadata. Do not apply the compact 1.20 chrome cap.

### Geometry that remains frozen

The new label must fit the already accepted schedule geometry:
- standard row base height **52 pt**;
- current row base height **176 pt**;
- time-column origin X **24**;
- programme title X **100**;
- right inset **24**;
- no Kijktip-specific row-height term;
- no title-column shift or width reduction;
- no change to standard/current Dynamic Type row formulas.

For the current programme, the existing title/description/progress hierarchy remains dominant and unchanged. The editorial label must fit without moving the current title from its accepted top position.

### Accessibility and multiple Kijktips

- the entire programme row remains the single programme action/focus target;
- Kijktip is announced exactly once in the existing semantic order: **channel → title → Kijktip → start/end → current state when applicable**;
- the visible label container and its child texts are not separate VoiceOver/TalkBack actions;
- multiple Kijktips repeat the same treatment independently;
- no grouping, numbering, special colour escalation or separate editorial navigation system.

### Production calibration still required

The owner-approved direction above is canonical on merge, but the following values remain deliberately **pending physical production calibration**:

- exact label outer width/height behaviour inside the existing time-column zone;
- horizontal and vertical padding;
- corner radius / squareness;
- exact `editorialAccentSurface` light/dark values;
- pressed-surface interaction with the label;
- any optical adjustment needed to preserve the accepted 2-pt internal text relationship across Dynamic Type.

Until that calibration is owner-approved and merged, Development must **not** implement a guessed label box from screenshots or re-use the superseded text-only treatment as the target visual.

### Frozen around this refinement

Do not change:
- standard/current row heights or scaling formulas;
- programme title sizes/weights/X/width;
- current title/description/progress treatment;
- channel rail;
- date/Primetime/Nu context;
- Guide chrome/collapse;
- row separators/pressed ownership;
- horizontal adjacent-channel swipe or vertical scrolling;
- Programme Detail interaction;
- light/dark/system architecture.

## Explicitly not accepted in this refinement
- No one-time horizontal swipe nudge/peek is canonical yet; it remains a separate interaction refinement requiring explicit acceptance after physical/interaction validation.
- No `•••` overflow entry is added here; that remains a future shared-header/application-IA decision rather than a Per-zender-only refinement.

## Screenshot authority note
The exact historical date choices shown in the original 13 September image are **SUPERSEDED** by `GUIDE_DAY_SELECTOR.md` and the accepted written refinements above. The rest of the Per-zender list/strip composition remains canonical except for the explicit 2026-09-17 refinements and the 2026-09-18 identity, current-programme and compact temporal-context refinements documented above.

The `Primetime` shortcut visible in the original Per-zender visual is **ACCEPTED** again by owner decision on 2026-09-15. The historical expanded time-picker is not accepted. Historical references are stale where they show selected-channel text outside the logo rail, the old long `Vandaag/Morgen · weekday date` labels, the superseded 24-pt or 16/12 expanded spacing calibrations, a wrapped 88-pt Per-zender temporal context, a 72-pt settled condensed channel strip, or old static utility treatments; the written rules above win for those details.

## Superseded
Earlier Per-zender mock-ups with programme imagery, genre descriptions, card-heavy programme rows or explicit previous/next channel arrows are not current and must not be used as a starting point.

Also superseded for day/time navigation:
- prototype permanent `Vandaag` / `Morgen` controls;
- unrestricted calendar treatments;
- horizontal ten-day date rails;
- previous/next-day arrow chrome;
- the expanded historical time-picker with `Vanmiddag`, `Vooravond` and arbitrary `Kies tijd…` navigation.

Also superseded by the 2026-09-17 refinement:
- treating `Nu` and `Primetime` only as static button visuals regardless of temporal context;
- a permanently 72-pt channel strip in settled condensed state;
- 18/22 standard programme-title calibration and 20/24 current-title calibration for Per zender;
- programme-row interaction feedback that relies only on generic opacity rather than the accepted temporary surface fill;
- any separate selected-channel text outside the persistent logo rail, including the former compact channel name in condensed context;
- the earlier 24-pt rail→utilities spacing and the later physically rejected 16/12 expanded spacing distribution;
- long Per-zender relative labels such as `Vandaag · vr 18 sep` / `Morgen · za 19 sep`;
- Per-zender use of `Vandaag` or `Morgen` between 00:00 and 05:59;
- Per-zender temporal chrome wrapping to the former 88-pt context because of Dynamic Type;
- the former compressed current-programme calibration: 120-pt base row, 15/18 description capped at 3 lines, 2-pt title→description gap and the resulting minimal description→progress clearance.
