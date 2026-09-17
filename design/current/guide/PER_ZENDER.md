# Per zender — current accepted visual

Status: **ACCEPTED**
Accepted: 2026-09-13; day-selector and Primetime behaviour amended 2026-09-15; accepted visual refinement amended 2026-09-17; selected-channel-heading removal accepted 2026-09-18

## Canonical asset
- Light + dark reference: `/Teevee/TV-gids app in licht en donker thema.png`
  - file id: `file_000000008b2481f4ad34bb1547fc813e`
- Accepted Guide day-selector states / bottom sheet:
  - `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - file id: `file_00000000390c8210b76256621721592b`
- Accepted sticky / condensed day-selector behaviour:
  - `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - file id: `file_00000000314481f69f6a34d18ece1c21`

The 2026-09-17 owner-approved refinement in this document supersedes the older visual references only for the explicitly listed refined details below. The 2026-09-18 owner-approved refinement additionally removes the large textual selected-channel heading from the expanded/rest state. All other accepted composition remains unchanged.

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
- The channel-logo strip remains sticky and is followed by one compact sticky channel/date context row with `Primetime` and `Nu` available.
- Do not render a large textual selected-channel heading in the expanded/rest state; the selected channel is identified there by the selected logo in the rail.
- In the condensed channel/date context, retain the compact textual channel name for orientation; this is not the removed large rest-state heading.
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
- current description remains **15/18, weight 400**.

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
- The compact textual channel name in the condensed channel/date context (`NPO 3 · Do 17 sep`, etc.) remains accepted and required for orientation.
- This refinement removes only the large rest-state heading; it does not reopen spacing, channel-strip, temporal-control, programme-list or gesture decisions.

## Explicitly not accepted in this refinement
- No one-time horizontal swipe nudge/peek is canonical yet; it remains a separate interaction refinement requiring explicit acceptance after physical/interaction validation.
- No `•••` overflow entry is added here; that remains a future shared-header/application-IA decision rather than a Per-zender-only refinement.

## Screenshot authority note
The exact historical date choices shown in the original 13 September image are **SUPERSEDED** by `GUIDE_DAY_SELECTOR.md` and the two accepted day-selector assets above. The rest of the Per-zender list/strip composition remains canonical except for the explicit 2026-09-17 refinements and the 2026-09-18 removal of the large rest-state selected-channel heading documented above.

The `Primetime` shortcut visible in the original Per-zender visual is **ACCEPTED** again by owner decision on 2026-09-15. The historical expanded time-picker is not accepted. Any accepted historical Per-zender visual that shows a separate large textual selected-channel heading in expanded/rest state is stale for that element only. The sticky/condensed day-selector board also predates later amendments and is stale where its Per-zender condensed row omits `Primetime`, and for the 72-pt condensed channel-strip height and old static utility treatments; the written rules above win for those details.

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
- the separate large textual selected-channel heading in expanded/rest state. The compact textual channel name in condensed context remains accepted.
