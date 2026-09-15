# Per zender — current accepted visual

Status: **ACCEPTED**
Accepted: 2026-09-13; day-selector and Primetime behaviour amended 2026-09-15

## Canonical asset
- Light + dark reference: `/Teevee/TV-gids app in licht en donker thema.png`
  - file id: `file_000000008b2481f4ad34bb1547fc813e`
- Accepted Guide day-selector states / bottom sheet:
  - `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - file id: `file_00000000390c8210b76256621721592b`
- Accepted sticky / condensed day-selector behaviour:
  - `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - file id: `file_00000000314481f69f6a34d18ece1c21`

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

## Accepted day/time navigation
- One compact typographic date selector plus separate `Primetime` and `Nu` actions.
- Tapping the date selector opens the bounded D-2..D+7 bottom sheet; no unrestricted calendar or horizontal ten-day rail.
- Changing day preserves the viewed wall-clock time where practical.
- `Primetime` keeps the selected television day and jumps the vertical schedule to 20:30 on that day.
- Between 00:00 and 05:59, `Primetime` therefore jumps back to 20:30 on the preceding television-day date.
- `Nu` is distinct from `Primetime`: it restores the actual current instant and corresponding television day.
- During vertical schedule scrolling, non-functional brand/header chrome condenses away.
- The channel-logo strip remains sticky and is followed by one compact sticky channel/date context row with `Primetime` and `Nu` available.
- Do not keep a duplicate large channel heading in the condensed state.
- Date/time utilities must not intercept the accepted horizontal schedule swipe for adjacent channels.
- Do not reintroduce the earlier full time-picker (`Vanmiddag`, `Vooravond`, `Kies tijd…`) as part of this decision; only the direct `Primetime` shortcut is accepted.

## Screenshot authority note
The exact historical date choices shown in the original 13 September image are **SUPERSEDED** by `GUIDE_DAY_SELECTOR.md` and the two accepted day-selector assets above. The rest of the Per-zender list/strip composition remains canonical.

The `Primetime` shortcut visible in the original Per-zender visual is **ACCEPTED** again by owner decision on 2026-09-15. The historical expanded time-picker is not accepted. The sticky/condensed day-selector board predates this amendment and is stale only where its Per-zender condensed row omits `Primetime`; the written rule above wins for that detail.

## Superseded
Earlier Per-zender mock-ups with programme imagery, genre descriptions, card-heavy programme rows or explicit previous/next channel arrows are not current and must not be used as a starting point.

Also superseded for day/time navigation:
- prototype permanent `Vandaag` / `Morgen` controls;
- unrestricted calendar treatments;
- horizontal ten-day date rails;
- previous/next-day arrow chrome;
- the expanded historical time-picker with `Vanmiddag`, `Vooravond` and arbitrary `Kies tijd…` navigation.
