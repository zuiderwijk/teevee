# Per zender — current accepted visual

Status: **ACCEPTED**
Accepted: 2026-09-13; day-selector and Primetime behaviour amended 2026-09-15; accepted visual refinement amended 2026-09-17; selected-channel-heading removal, current-programme spacing and compact temporal-context refinement accepted 2026-09-18; Kijktip editorial-disclosure refinement accepted 2026-09-22

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

The 2026-09-17 owner-approved refinement in this document supersedes the older visual references only for the explicitly listed refined details below. The 2026-09-18 owner-approved refinements additionally remove duplicate selected-channel text, expand the current-programme treatment and compact the temporal context after physical iPhone validation. The 2026-09-22 owner-approved Kijktip refinement adds only a quiet editorial-disclosure line inside the existing time column; it does not reopen any row, chrome, rail, gesture or current-programme metric. All other accepted composition remains unchanged.

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

## Accepted Kijktip editorial-disclosure refinement — 2026-09-22

This is a targeted Per-zender refinement only. A programme may expose a boolean editorial state `isKijktip = true`; the exact feed/matching implementation is not a visual contract.

Canonical visual:
- `/Teevee/Per Zender Kijktip refinement - 12pt Medium textSecondary.png`
- Library file id: `file_00000000dd7c8210a35769aada30424b`

### Placement and hierarchy

For a Kijktip programme:
- keep the programme title column and its width completely unchanged;
- keep the existing programme start time in the time column;
- add the literal label **`Kijktip`** as a quiet second line directly below the time;
- time and programme title share the same first baseline;
- the `Kijktip` line is left-aligned exactly to the time text;
- vertical time→Kijktip gap: **2 pt**;
- use the existing time-column width and programme-column X; do not steal horizontal space from the title;
- no badge, pill, icon, accent colour, underline or additional current/Now label;
- `Kijktip` has no independent interaction or hit target.

### Typography and colour

- base size: **12 pt**;
- Instrument Sans **Medium**;
- semantic **`textSecondary`**;
- monochrome in light/dark/system;
- no special Kijktip colour token.

The label is intentionally quieter than both programme title and current-programme treatment. Do not use 13 pt, Semibold or a stronger text token without new owner-approved physical evidence.

### Standard 52-pt rows

- normal non-Kijktip rows remain exactly unchanged and retain their existing vertically centred time/title composition;
- a Kijktip row keeps the same **52-pt** base height;
- within a Kijktip row, the time/title first line is positioned as one aligned top content line with the `Kijktip` label directly below in the time column;
- do not vertically centre `Kijktip` as an independent label;
- do not change programme title typography, line count, separator geometry or pressed state merely because Kijktip is present.

### Current programme + Kijktip

The existing current-programme treatment remains dominant and unchanged:
- current row base height remains **176 pt**;
- current title/description/progress geometry is unchanged;
- no extra visible `Nu` label is added;
- the time column uses the same two-line time + `Kijktip` treatment;
- `Kijktip` remains **12 pt Medium textSecondary** even when the programme is current; do not strengthen it to compete with the current title.

### Multiple Kijktips

Multiple editorial tips in one evening use the exact same treatment independently. Do not cluster, number, colour-code or otherwise create a second editorial navigation system.

### Dynamic Type

`Kijktip` is programme metadata, not compact Guide chrome:
- it follows substantive system font scaling and is not capped at 1.20;
- existing standard/current row Dynamic-Type formulas remain authoritative;
- **do not add row height solely because `Kijktip` exists**;
- no Kijktip-specific wrap state is introduced;
- at supported Larger Text sizes, preserve the same hierarchy: time/title first line, Kijktip directly below time, title column unchanged.

### Accessibility

Kijktip is editorial disclosure and must not be visual-only:
- keep the programme row as the single action/focus target;
- when `isKijktip = true`, include **`Kijktip`** once in the programme action accessibility label/description;
- do not expose the visual Kijktip text as a second focusable element;
- full channel, title, start/end time and current-state semantics remain unchanged.

### Frozen around this refinement

Do not change for Kijktip:
- standard/current row heights or their scaling formulas;
- time/programme column X positions;
- title sizes/weights;
- current title, description or progressbar treatment;
- channel rail;
- date/Primetime/Nu context;
- Guide chrome/collapse;
- row separators/pressed state;
- horizontal adjacent-channel swipe or vertical scrolling;
- Programme Detail interaction;
- light/dark/system theme architecture.

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
