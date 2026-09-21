# Totaal — current provisional visual direction

Status: **PROVISIONAL — PRODUCTION VISUAL DESIGN NOT YET OWNER-APPROVED**
Owner correction: 2026-09-21. Earlier repository wording incorrectly promoted the current reference direction to a completed production design.

Accepted sub-decisions that remain constraints: shared Guide day-selector behaviour (2026-09-15) and Instrument Sans typography (2026-09-17). Proven Totaal interaction/data/performance mechanics remain frozen unless concrete regression evidence requires change.

## Current exploration references
- Light: `/Teevee/Nederlandse tv-gids op smartphone.png`
  - file id: `file_0000000015ac81f4ab067e5473ed692d`
- Dark: `/Teevee/Donkere Nederlandse tv-gidsinterface.png`
  - file id: `file_000000008448821095d8432693d09bd8`
- Accepted Guide day-selector states / bottom sheet:
  - `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - file id: `file_00000000390c8210b76256621721592b`
- Accepted sticky / condensed day-selector behaviour:
  - `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - file id: `file_00000000314481f69f6a34d18ece1c21`

Detailed shared day-selector contract: `design/current/guide/GUIDE_DAY_SELECTOR.md`.
Shared typography contract: `design/current/TYPOGRAPHY.md`.
`docs/TOTAAL_VISUAL_CONVERGENCE.md` is currently a **draft/inactive candidate handoff**. Do not use it to start production implementation until the owner has accepted the final Totaal production design and that specification is explicitly reactivated.

## Frozen constraints
- Instrument Sans as the accepted UI typeface; historical Söhne-like screenshot typography is superseded for family choice only.
- Near-white neutral light canvas / dark-anthracite dark canvas.
- Open 2D time/channel grid.
- Channel logos in the left identity rail.
- Programme geometry represents real schedule duration.
- Restrained separators and whitespace instead of card stacking.
- Compact red current-time marker only; no full-height red line.
- Programme title first; no genre/artwork clutter.
- Bottom navigation stays quiet and stable.

## Accepted day navigation sub-contract
- One compact typographic date selector plus a separate `Nu` action.
- Tapping the date selector opens the bounded D-2..D+7 bottom sheet; no unrestricted calendar or horizontal ten-day rail.
- Changing day preserves the viewed wall-clock time where practical.
- `Nu` restores the actual current instant and corresponding television day.
- During vertical Guide scrolling, date + `Nu` + time axis remain available while non-functional brand/header chrome condenses away.
- During horizontal browsing, date context follows the stable time-navigation anchor and updates when that anchor crosses the 06:00 television-day boundary.

## Reference authority note
The exact historical date control visible in the 13 September light/dark references is **SUPERSEDED** by `GUIDE_DAY_SELECTOR.md`, and their typeface family is superseded by `design/current/TYPOGRAPHY.md`. The remaining visual hierarchy/composition is **not frozen production design**; it is input for the next Totaal design round.

## Superseded
Earlier Totaal explorations with card-like programme blocks, a full-height red current-time line, dense metadata, more decorative chrome or a different typography direction are not current.

Also superseded for day navigation:
- prototype permanent `Vandaag` / `Morgen` buttons;
- unrestricted calendar treatments;
- horizontal ten-day date rails;
- previous/next-day arrow chrome.
