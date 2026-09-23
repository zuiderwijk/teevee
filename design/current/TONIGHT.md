# Tonight / Vanavond — current accepted production design

Status: **ACCEPTED — OWNER-APPROVED PRODUCTION DESIGN**
Owner-approved: 2026-09-23

Canonical product authority:
- `docs/TONIGHT_PRODUCT_DEFINITION.md`

Production visual specification:
- `docs/TONIGHT_VISUAL_CONVERGENCE.md`

## Canonical visual asset

- `/Teevee/Vanavond production design - hoofdvariant.png`
  - Library file id: `file_00000000c6e081f4b4e0ed5e08a9c1fe`
  - stable Library record: `libfile_a7424f31c0d0819198f62d34ad3ad1d8`

The visual is canonical for the Vanavond module hierarchy, open-list/carousel composition, relative density and Film/Series poster direction. The programme titles, broadcaster mix, generated imagery and exact generated app-shell glyphs are illustrative; written product/specification rules and shared app-shell components remain authoritative.

The generated board is **not** pixel-authoritative for exact media aspect ratios or standalone-shell chrome. In particular, any wider-looking Series thumbnail in the raster is superseded by the frozen **96 × 144 pt (2:3)** Series geometry in `docs/TONIGHT_VISUAL_CONVERGENCE.md`, and the written screen-header/date-context rules remain authoritative if the generated board omits or approximates them.

## Frozen production composition

Vanavond is one finite vertical page:

1. **Jouw gids**
2. **Onze Kijktips**
3. **Films vanavond**
4. **Series vanavond**
5. **Sport vanavond**

Then the page ends.

Do not add hero content, `Uitgelicht`, `Verder vanavond`, `Voor jou`, filters, date picker, time chips, trending, news, streaming catalogue or filler.

## Jouw gids

- primary personal utility;
- open chronological list, not cards/carousel;
- start time + title + channel visible;
- current saved broadcast exposes literal `Nu`;
- ended saves remain quietly visible until 06:00 and expose `Afgelopen`;
- overlapping saves remain independent rows;
- no heading chevron or separate Jouw-gids destination;
- tap resolved row → exact-broadcast Programme Detail;
- unresolved stale local snapshots remain visible but never fabricate Detail.

Two empty states remain required:
- never used Bewaar: explanatory copy + primary `Bekijk de gids`;
- used before but none for this evening: quiet no-items message + route to Guide.

Save feedback from Programme Detail explicitly connects the action to this module: `Bewaard in Jouw gids` for the active evening.

## Onze Kijktips

- horizontal native carousel;
- partial next card is the continuation affordance;
- no section chevron, `Alles`, pager dots or arrow buttons;
- roughly two cards visible at standard iPhone density;
- 16:9 artwork when available;
- same-size premium channel/text fallback when artwork is absent;
- because the section already says `Onze Kijktips`, cards do not repeat a visible Kijktip label by default.

## Films vanavond

- horizontal carousel;
- standing **2:3 poster** imagery;
- roughly three items/continuation cue at base density;
- title + channel + start time remain visible;
- no section chevron;
- text/channel-identity fallback preserves the same poster geometry.

## Series vanavond

- denser horizontal carousel than Films;
- standing **2:3 poster** imagery;
- deliberately supports the measured ~12–17 general/mainstream scripted broadcasts per evening without ranking/deduplication;
- no section chevron;
- text/channel fallback preserves poster geometry.

## Sport vanavond

- horizontal landscape broadcast cards;
- optional artwork, same-size text/channel fallback;
- module omitted completely when zero eligible items;
- no section chevron.

## Category discovery scope

Films, Series and Sport use the owner-approved curated Vanavond discovery-channel scope from `docs/TONIGHT_PRODUCT_DEFINITION.md`.

This is not surfaced as a filter, chip, segmented control or `populaire zenders / alle zenders` toggle in the accepted production composition. The carousel remains visually unchanged: eligibility is resolved before presentation.

`Jouw gids` and `Onze Kijktips` are not constrained by this category scope.

## Artwork direction

Artwork is enhancement, never a structural dependency.

For Film/Series, preferred future poster enrichment is language-neutral/no-language 2:3 artwork. The owner intends TMDB no-language posters as the target source class, but this does **not** authorize direct mobile TMDB integration. Production artwork requires a central typed/provider-independent enrichment boundary plus matching/rights/provenance decisions.

No fake/generic posters are used as fallbacks.

## Carousel semantics

- native horizontal pan/inertia;
- native vertical page scroll remains primary;
- partial next item communicates horizontal continuation;
- no auto-play or automatic snapping by default;
- one programme action per card;
- tap → exact-broadcast Programme Detail.

## Television-evening context

Vanavond has no date selector. A quiet date line derives from the active television day's start date; between 00:00–05:59 this continues to identify the preceding evening rather than the new calendar date.

## Light/dark/system + Larger Text

- canonical Instrument Sans;
- shared theme tokens only;
- same information hierarchy in light/dark/system;
- substantive programme text respects Dynamic Type;
- Jouw-gids rows and carousel card widths/density adapt rather than shrinking/clipping essential text;
- accessibility/touch targets remain >=44 pt iOS / >=48 dp Android.

## Empty/availability behaviour

- Jouw gids always stays;
- Kijktips/Films/Series/Sport disappear entirely at zero eligible current/upcoming items;
- missing modules leave no visual holes;
- partial/unavailable discovery data uses one quiet page-level availability notice rather than per-module error boxes.

## Superseded reference

The previous provisional exploration is superseded as a production reference:
- `/Teevee/Vanavond: Teevee designvoorstel.png`
- Library file id: `file_00000000cc4c821099c97384e519c045`

That older composition is stale for hero content, filters, time-slot/date browsing, catch-all modules, section chevrons/`Alles` routes and non-poster Film/Series art treatment.

Git history remains the design archive.
