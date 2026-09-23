# Vanavond — production visual convergence specification

Status: **OWNER-APPROVED PRODUCTION DESIGN — IMPLEMENTATION-READY ON MERGE**
Owner-approved: 2026-09-23
Product authority: `docs/TONIGHT_PRODUCT_DEFINITION.md`
Classification evidence: `docs/TONIGHT_CLASSIFICATION_RESEARCH_2026-09-23.md`
Visual manifest: `design/current/TONIGHT.md`

This specification translates the owner-approved Vanavond design into a deterministic Development handoff. It does not authorize raw-provider classification in UI code and it does not authorize a direct mobile dependency on an artwork provider.

## 1. Canonical visual

Exact accepted visual asset:

- `/Teevee/Vanavond production design - hoofdvariant.png`
- Library file id: `file_00000000c6e081f4b4e0ed5e08a9c1fe`
- stable Library record: `libfile_a7424f31c0d0819198f62d34ad3ad1d8`

The image is canonical for module hierarchy, relative density, open-list versus carousel treatment, poster/landscape aspect-ratio direction and overall light-mode hierarchy.

The generated schedule titles, broadcaster choices, poster pixels, icon glyphs and exact app-shell rendering are illustrative. The written contracts in this specification and the shared app-shell components win for those details.

In particular:
- use the existing Teevee standalone-screen shell and canonical bottom navigation; do not create a Vanavond-only navigation/header system because the generated board centres the title differently;
- use the canonical broadcaster/logo registry rather than generated marks;
- use real canonical broadcasts rather than the illustrative schedule in the visual.

## 2. Product hierarchy — frozen

Vanavond is one finite vertically scrolling page. Module order is exactly:

1. **Jouw gids**
2. **Onze Kijktips**
3. **Films vanavond**
4. **Series vanavond**
5. **Sport vanavond**

The page ends after the last present module.

Do not add:
- `Uitgelicht`;
- `Verder vanavond`;
- `Voor jou` placeholder;
- filters;
- category chips;
- global time chips;
- date selector;
- trending;
- news/articles;
- streaming catalogue;
- AI/personalised recommendations.

`Jouw gids` always exists. Empty discovery/category modules are omitted completely.

## 3. Screen shell and television-evening context

Use the existing standalone-screen shell:
- existing `AppScreenHeader` semantics/components;
- title: **Vanavond**;
- existing Settings action;
- existing bottom navigation with `Vanavond` selected;
- safe-area ownership remains shared app-shell behaviour.

Vanavond has no date selector.

Immediately below the screen header expose one quiet television-evening context line:
- format: abbreviated weekday + day + abbreviated month, e.g. **`Wo 23 sep`**;
- 14/20 Instrument Sans Regular;
- semantic `textSecondary`;
- derive it from the start date of the active 06:00 television day;
- between 00:00–05:59 it therefore continues to show the preceding evening's date rather than the new calendar date.

No `Vandaag` / `Morgen` wording is needed on Vanavond.

## 4. Shared page geometry and typography

Baseline reference width: modern iPhone portrait around 390 pt. Layout must remain responsive; these values are production targets, not fixed-device assumptions.

Base geometry:
- horizontal screen/content inset: **20 pt**;
- module heading → module content: **12 pt**;
- completed module → next module heading: **28 pt**;
- horizontal carousel item gap: **12 pt**;
- carousel right content padding: **20 pt**;
- horizontal scroll indicators: hidden;
- vertical page scroll indicator: platform default may remain hidden to match current Teevee surfaces.

Typography:
- section heading: **22/28 Instrument Sans Semibold**;
- section support/count line: **14/19 Regular, textSecondary**;
- programme/card title: normally **15/19 Medium** unless a module-specific value below is stronger;
- metadata: **13–14/18 Regular, textSecondary**;
- use tabular numerals for visible times where supported.

No section heading gets a trailing chevron. A section heading is not an action in v1.

## 5. Jouw gids

### 5.1 Role

Jouw gids is the primary personal utility and uses an **open chronological list**, not cards and not a carousel.

Required visible information:
- start time;
- title;
- channel identity/name;
- current state when applicable.

End time is also shown in accessibility semantics and may be included visually only when it improves overlap comprehension; the base accepted visual keeps the visible row compact and start-time led.

Ordering remains the canonical product order:
1. `startAt`;
2. channel `sortOrder`;
3. programme id.

Do not deduplicate repeats or same-title broadcasts.

### 5.2 Section header

- heading: **Jouw gids**;
- support line when non-empty: **`N bewaarde uitzending(en)`** with correct singular/plural;
- no chevron;
- no `Alles` route.

### 5.3 Standard row

Base row:
- minimum height: **60 pt**;
- separator: existing semantic `border`, 1 physical pixel / platform hairline where supported;
- no row card, radius or permanent fill;
- pressed state may use the shared subtle `surface` feedback.

Horizontal composition at ordinary text sizes:
- time column width: **64 pt**;
- time → content gap: **16 pt**;
- title/content origin therefore targets **X100** on a 20-pt screen inset;
- right inset: **20 pt**;
- vertical content inset: approximately **10 pt** balanced around the title/channel stack.

Time:
- **16/21 Regular**, `textSecondary`, tabular.

Title:
- **16/21 Medium**, `text`;
- may wrap as required; do not shrink text to preserve density.

Channel:
- **14/18 Regular**, `textSecondary`;
- canonical full display name remains available to accessibility even when a logo/short name is used visually.

Tap opens Programme Detail for that exact resolved canonical broadcast.

### 5.4 Upcoming

Upcoming saved broadcast uses the standard row treatment. No explicit `Straks` label is added.

### 5.5 Current / Nu

A saved broadcast with `startAt <= now < endAt`:
- retains the same row geometry;
- title may use Semibold to strengthen current hierarchy;
- expose literal **`Nu`** at the trailing edge as a non-interactive state capsule;
- `Nu` text: **13/16 Semibold** using `currentTime`;
- capsule minimum height **24 pt**, horizontal padding **8 pt**, radius **8 pt**;
- background: a low-opacity local use of `currentTime` (target ~10–14% perceived fill), not a new saturated token;
- reserve trailing space so title never renders beneath the capsule.

The word `Nu` makes the state non-colour-only.

### 5.6 Ended / Afgelopen

An ended saved broadcast remains until the 06:00 rollover:
- keep start time, title and channel visible;
- de-emphasise the row with semantic `textMuted` for time/channel and a quieter title;
- include literal **`Afgelopen`** in the secondary metadata line;
- no strike-through;
- no disabled-card styling.

If the exact canonical broadcast can still resolve, Programme Detail remains available. If a stale local snapshot cannot resolve safely, keep the snapshot visible but do **not** fabricate a Programme Detail destination; expose `Details tijdelijk niet beschikbaar` in accessibility semantics instead.

### 5.7 Overlap

Overlapping saved broadcasts remain separate chronological rows.

Do not add a conflict badge or warning in v1. Visible start/end context and chronological ordering are sufficient; accessibility semantics include each full real time range.

## 6. Jouw gids empty states

Jouw gids never disappears.

### 6.1 Never used Bewaar

Copy:
> Bewaar programma's die je vanavond wilt zien. Dan staat je tv-avond hier overzichtelijk bij elkaar.

Primary action:
- **Bekijk de gids**
- 48-pt minimum touch target;
- calm outlined/secondary Teevee action treatment using existing surface/border/text tokens.

Do not add a second `Zoek een programma` action in v1; the persistent Zoeken tab already provides that route.

### 6.2 Bewaar used before, nothing for active evening

Copy:
> Je hebt voor vanavond nog niets bewaard.

Provide a quiet **Bekijk de gids** action with a platform-safe touch target. Do not repeat onboarding copy.

The implementation must use durable `hasUsedSave` semantics and must not infer this state only from an empty current saved map.

## 7. Save feedback from Programme Detail

Do not add permanent save affordances to frozen Guide surfaces.

When `Bewaar` succeeds for a broadcast belonging to the active Vanavond evening:
- persistent Programme Detail action becomes/stays **Bewaard**;
- show transient inline feedback in the existing Programme Detail action-message region: **Bewaard in Jouw gids**;
- 14/20 Regular `textSecondary`;
- `accessibilityLiveRegion="polite"` / equivalent;
- visual message may clear after approximately **4 seconds** or when Detail closes.

For a saved broadcast belonging to another television evening, use date-aware feedback such as:
- **Bewaard voor zaterdagavond**

Do not claim placement in the currently visible Jouw gids when it belongs to another evening.

Removing an active-evening save may analogously announce **Niet meer in Jouw gids** without introducing a new permanent control.

## 8. Carousel interaction contract

`Onze Kijktips`, Films, Series and Sport are horizontal native carousels embedded in the vertical Vanavond scroll.

All carousels:
- native horizontal pan/inertia;
- no autoplay;
- no pager dots;
- no arrow/chevron control;
- no `Alles` action in v1;
- discoverability comes from a **partially visible next item** at the right edge;
- preserve native vertical-vs-horizontal gesture discrimination;
- whole card is the one programme action;
- minimum interaction target remains >=44 pt iOS / >=48 dp Android;
- tap opens Programme Detail for the exact broadcast.

Section headings are not tappable.

## 9. Onze Kijktips

### 9.1 Section

- heading: **Onze Kijktips**;
- support line: **`N tips voor vanavond`**;
- no visible per-card `Kijktip` label by default because the section already establishes editorial meaning.

Eligibility/order remain defined in `TONIGHT_PRODUCT_DEFINITION.md`.

### 9.2 Card

Base width: **168 pt**.
Gap: **12 pt**.

Artwork-enriched card:
- media aspect ratio **16:9**;
- width 168 / height **94.5 pt**;
- top corners radius **10 pt**;
- card uses a quiet `surface` plus subtle `border`, no heavy shadow;
- title below image: **15/19 Medium**, up to two visual lines at base density;
- metadata: **14/18 Regular**, normally `HH:MM · Channel`.

No-artwork fallback:
- retain the exact same 16:9 media frame;
- use `editorialAccentSurface` or neutral `surface` as the media field;
- show canonical channel identity/logo centrally where available;
- no generic fake poster, gradient illustration or invented artwork;
- title/metadata geometry below is identical, so image failure never shifts layout.

The section itself provides the editorial identity. `editorialAccent` may be used sparingly in the fallback/channel treatment but does not need to recolour all programme text.

## 10. Films vanavond

### 10.1 Card density

Films use standing poster cards.

Base:
- card width **108 pt**;
- poster ratio **2:3**;
- poster frame **108 × 162 pt**;
- poster radius **8 pt**;
- gap **12 pt**;
- on ~390-pt iPhone portrait this intentionally shows roughly three items plus a continuation cue.

Title:
- **15/19 Medium**;
- normal compact tail/wrap behaviour; full title remains accessibility/Detail content.

Metadata:
- **13/18 Regular textSecondary**;
- display **Channel · HH:MM**.

No enclosing filled card is required around poster + typography; keep the module open.

## 11. Series vanavond

Series deliberately uses a denser version of the Film card because measured volume is approximately 12–17 qualifying broadcasts per evening.

Base:
- card width **96 pt**;
- poster ratio **2:3**;
- poster frame **96 × 144 pt**;
- poster radius **8 pt**;
- gap **12 pt**;
- roughly three-plus items should be visible/partially visible on a standard iPhone.

Typography:
- title **14/18 Medium**;
- metadata **13/17 Regular textSecondary**;
- display **Channel · HH:MM**.

Do not introduce ranking, deduplication, paging or a second screen merely because the module is denser. Horizontal continuation is the v1 browsing mechanism.

## 12. Film / Series artwork direction

The approved visual direction for Film and Series is a **standing 2:3 poster**, not landscape/quasi-square artwork.

Preferred future artwork enrichment:
- language-neutral / no-language poster artwork where available;
- the owner's intended enrichment source is TMDB, with the no-language/textless poster class (the current TMDB UI exposes this as the `xx` image-language filter).

This is a **visual/data enrichment direction, not a direct-client integration authorization**.

Production constraints:
- mobile Vanavond must not call TMDB directly;
- artwork must enter through a central typed/provider-independent enrichment boundary;
- matching confidence, API terms, caching, attribution and image redistribution/provenance must be resolved before production artwork is enabled;
- absence of poster art must never exclude a broadcast or collapse the card.

Poster fallback:
- preserve the exact 2:3 poster frame;
- neutral `surface` + subtle `border`;
- canonical channel identity/logo centred;
- no invented movie poster;
- no layout shift when an image load fails.

When no-language art is unavailable, Development must not silently invent a language-preference ladder in UI code. That selection policy belongs to the future enrichment contract.

## 13. Sport vanavond

Sport remains optional and is omitted entirely on zero-item evenings.

Base landscape card:
- width **220 pt**;
- height **112 pt**;
- radius **10 pt**;
- gap **12 pt**.

Artwork state:
- artwork fills the frame with cover crop;
- programme title + `Channel · HH:MM` may sit in a local bottom text panel/scrim;
- use a simple semantic/local translucent overlay sufficient for contrast; no new gradient dependency is required.

No-artwork state:
- same 220 × 112 frame;
- `surface` + `border`;
- canonical channel identity plus title/time;
- no fake stadium/image.

Do not display a Sport empty shell or `geen sport vanavond` state.

## 14. Artwork loading behaviour

Artwork is optional enrichment across discovery/category modules.

Required:
- layout geometry is known before image success/failure;
- no layout shift when artwork loads;
- image failure swaps to the same-size fallback;
- partial artwork availability within one carousel is valid;
- do not hide items lacking artwork;
- use sensible image prefetch/windowing, but do not block first meaningful content on all artwork downloads.

Rights/provenance remain a release gate independent from this design approval.

## 15. Current and ended discovery items

For Onze Kijktips / Films / Series / Sport:
- currently airing items remain eligible;
- show literal `Nu` in card metadata for a current broadcast, e.g. **`Nu · RTL 4`**, using `currentTime` plus text so state is not colour-only;
- ended items disappear from discovery/category modules after their real `endAt`;
- do not show an `Afgelopen` discovery card.

Jouw gids intentionally retains ended items under §5.6.

## 16. Empty/omitted module behaviour

- Jouw gids: always rendered, using one of the two explicit empty states if needed;
- Onze Kijktips: omitted when zero current/upcoming qualifying items;
- Films: omitted when zero;
- Series: omitted when zero;
- Sport: omitted when zero.

Vertical spacing collapses naturally. Do not reserve empty module height, show disabled headings or insert filler.

The page ends after the final present module.

## 17. Loading, partial, error and offline presentation

Vanavond must remain useful under partial data.

Principles:
- render local Jouw-gids snapshots immediately where available;
- do not show fake category content while classification/schedule data is pending;
- avoid skeleton poster walls that imply items exist before canonical broadcasts are known.

When discovery/category data is temporarily loading after Jouw gids is available:
- a single quiet page-level status such as **Vanavond laden…** may appear below Jouw gids;
- remove it as soon as module eligibility is known.

When some schedule/classification coverage is partial:
- render trustworthy available modules/items;
- show one page-level semantic notice: **Niet alle programma's voor vanavond zijn beschikbaar.**
- do not add per-module error boxes.

When discovery data is unavailable/offline and no trustworthy cached/in-memory data exists:
- keep Jouw gids available from local snapshots;
- show **Kijktips en categorieën zijn tijdelijk niet beschikbaar.**
- provide one **Opnieuw** action when retry is technically available.

Do not introduce persistent schedule caching solely for Vanavond; follow the canonical cache/hosted-read architecture.

## 18. Light / dark / system

Use shared theme tokens only.

Light:
- background `#F7F7F5`;
- surface `#FFFFFF`;
- text `#171717`;
- textSecondary `#565656`;
- border `#E4E4E0`.

Dark:
- background `#10100F`;
- surface `#191918`;
- text `#F4F4F1`;
- textSecondary `#C2C2BD`;
- border `#30302D`.

Use existing `currentTime`, `editorialAccent` and `editorialAccentSurface` semantics where specified. Do not create Vanavond-only hard-coded colours.

Poster/artwork treatment does not change aspect ratio or information hierarchy in dark mode.

## 19. Dynamic Type / Larger Text

Substantive programme text is uncapped.

### 19.1 Jouw gids

At ordinary sizes through approximately fontScale 1.35:
- use the two-column time + programme composition in §5.3;
- row height grows naturally if title/channel wraps.

Above ~1.35:
- switch to a stacked row composition rather than crushing the 64-pt time column;
- first line: time + trailing state (`Nu` where applicable);
- title below;
- channel/status below title;
- preserve minimum 48-dp Android / 44-pt iOS target height.

### 19.2 Carousels

Do not preserve three-card density by shrinking text.

Suggested production widths:
- <=1.35: use base widths in §§9–13;
- >1.35 to <=1.7:
  - Kijktips: target ~72% of content width;
  - Film: ~142 pt;
  - Series: ~132 pt;
  - Sport: ~82% of content width;
- >1.7:
  - Kijktips/Sport: ~86% of content width;
  - Film/Series: increase enough to keep metadata comfortably readable; preserve 2:3 poster ratio and allow the carousel height to grow.

Programme titles may wrap to additional lines at Larger Text. Never reduce font size or cap Dynamic Type solely to preserve the base screenshot density.

The horizontal carousel interaction remains unchanged.

## 20. Accessibility

Screen:
- `Vanavond` is the screen heading;
- module headings expose header semantics;
- evening date context is announced after the screen heading.

Jouw gids:
- each resolved broadcast is one button/action;
- accessibility label includes full title, channel, start/end time and `Nu bezig` / `Afgelopen` when relevant;
- visual `Nu` capsule is not a second focus target;
- unresolved stale snapshots remain readable but must not expose a false Detail action.

Discovery/category cards:
- each exact broadcast is one button;
- label includes title, channel, start/end time/current state;
- Onze Kijktips may prefix **Kijktip** semantically even though the card does not repeat the word visually;
- poster image is decorative when the programme action already announces the title; do not add a duplicate image focus stop.

Carousels:
- focus order follows visual chronological order;
- horizontal scrollability must remain discoverable to assistive technology;
- no section chevron/fake button exists.

State:
- current/ended/availability states are never colour-only.

## 21. Motion and gestures

- vertical page scroll uses native inertia;
- horizontal carousels use native horizontal inertia;
- do not auto-snap unless physical validation proves it materially improves card browsing;
- no autoplay;
- no decorative entrance animation;
- respect Reduced Motion;
- horizontal carousel gesture handling must not trap normal vertical page scrolling.

## 22. What the canonical visual supersedes

The owner-approved 23 September visual and this specification supersede the previous provisional reference:

- `/Teevee/Vanavond: Teevee designvoorstel.png`
- Library file id `file_00000000cc4c821099c97384e519c045`

Specifically superseded from that exploration:
- hero programme treatment;
- filter/category chips;
- time-slot browsing;
- date picker;
- old `Onze tips` / `Populair vanavond` composition;
- generic catch-all discovery;
- section chevrons/`Alles` actions without real destinations;
- landscape/quasi-square Film/Series imagery;
- any assumption that artwork is structural.

The old asset remains historical Library content only.

## 23. Development dependencies and sequencing

The visual design is implementation-ready, but production enablement still respects existing data gates.

Already usable:
- local broadcast-level `Bewaar` state for Jouw gids foundation;
- canonical Kijktip enrichment for Onze Kijktips;
- existing Programme Detail;
- shared app shell/theme/typography.

Blocked before production category population:
- Film / Series / Sport require the central provider-independent classification/enrichment contract proven necessary by `TONIGHT_CLASSIFICATION_RESEARCH_2026-09-23.md`.

Artwork:
- Film/Series poster enrichment is optional;
- desired TMDB no-language poster direction requires a separate central enrichment/rights/provenance increment;
- runtime must ship a premium text/channel-identity fallback regardless.

Development must not implement raw-provider genre heuristics in Vanavond UI just to populate the approved visual.

## 24. Implementation acceptance criteria

Development must demonstrate at minimum:

1. module order exactly Jouw gids → Kijktips → Film → Series → Sport;
2. no unsupported hero/filter/time-chip/date-selector/feed modules;
3. Jouw gids chronological list with upcoming/current/ended states;
4. both Jouw-gids empty states;
5. save confirmation connection from Programme Detail to Jouw gids;
6. overlap and duplicate-title saves remain separate;
7. section headings have no chevrons or hidden destinations;
8. horizontal carousels expose a partial next item and use native swipe;
9. Kijktips text-first fallback with unchanged geometry;
10. Film/Series use 2:3 poster geometry plus same-size no-art fallback;
11. Series handles realistic 12–17-item volume without ranking/deduplication;
12. Sport module omits cleanly at zero items;
13. modules disappear after zero eligible current/future items without gaps;
14. current discovery items use textual `Nu`; ended discovery items disappear;
15. 00:00–05:59 Vanavond context still identifies the preceding television evening;
16. light/dark/system hierarchy matches;
17. Larger Text follows §19 without clipped essential content or overlapping targets;
18. VoiceOver/TalkBack traverses headings and programme actions without decorative-image duplicates;
19. partial/unavailable/offline states follow §17;
20. artwork failure does not cause layout shift;
21. no direct mobile raw-provider category logic or direct TMDB dependency is introduced.

## 25. Physical validation gate

This is a new substantial product surface. Physical iPhone validation is required before final acceptance, covering:
- standard text, light;
- dark;
- Larger Text around 1.35 and representative accessibility size;
- Jouw gids with upcoming/current/ended/overlap;
- both Jouw-gids empty states;
- save → Jouw gids confirmation;
- Kijktip carousel;
- Film/Series 2:3 posters and mixed/no-artwork fallback;
- Series with at least 12 real/fixture items;
- Sport present and omitted;
- multiple missing modules in sequence;
- current-time transition while page remains open;
- 00:00–05:59 television-evening context;
- horizontal carousel swipes mixed with vertical page scroll;
- Programme Detail round-trip;
- offline/partial notice.

Android physical interaction validation follows the project-wide hardware gate and must not be falsely claimed from iPhone/CI evidence.

## 26. Implementation authority

After this docs/design specification is merged to `main`, Development must use:
1. `docs/PROJECT_STATE.md`;
2. `docs/TONIGHT_PRODUCT_DEFINITION.md`;
3. this document;
4. `design/current/TONIGHT.md`;
5. `docs/VISUAL_BASELINE.md`;

and must treat the old Vanavond exploration as superseded.

No production UI/runtime code is part of this design PR.
