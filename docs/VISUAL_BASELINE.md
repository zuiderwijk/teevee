# Teevee — Canonical Visual Baseline

Status: **ACTIVE VISUAL SOURCE OF TRUTH**
Last reconciled: 2026-09-17

This document answers one question unambiguously: **which visual design is the current accepted Teevee design for each product surface?**

It exists so a new Visual Design, Development or QA thread never has to infer the answer from chat history, Library recency, generated-image timestamps or memory.

## Mandatory rule

Before changing an existing Teevee surface, a thread must:
1. read `AGENTS.md` and `docs/PROJECT_STATE.md`;
2. read `docs/PRODUCT.md`, `docs/UX.md` and `docs/DESIGN_SYSTEM.md` as relevant;
3. read this file;
4. read the matching file under `design/current/`;
5. inspect the **exact canonical visual asset named there**, not a visually similar or newer-looking historical mock-up;
6. check current implementation and relevant ADRs before proposing a material interaction change.

Chat images, old generated mock-ups, Library search ranking and historical PR attachments are **not** canonical unless this manifest points to them.

## Authority and conflict rules

Different sources answer different questions:
- `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md` and accepted ADRs define current product/interaction behaviour;
- **this file + `design/current/` define the accepted current visual composition/reference**;
- `DESIGN_SYSTEM.md` defines reusable visual-system rules;
- current code defines what is actually implemented, not automatically what is visually approved.

If a canonical image contains a control that has since been superseded by a higher-priority UX/ADR decision, the newer behaviour wins. The affected image remains useful for the rest of its visual composition only when this file explicitly marks that part as stale.

## Canonical shared typography

Status: **ACCEPTED**
Owner-approved direction: 2026-09-17
Detailed manifest: `design/current/TYPOGRAPHY.md`

**Instrument Sans** is the canonical primary UI typeface for Teevee across Guide, Programme Detail, Tonight/Vanavond, Search, Settings and secondary product surfaces.

Accepted characteristics:
- one coherent UI family rather than Instrument Sans plus a second sans-serif;
- Regular / Medium / Semibold form the default hierarchy; Bold is exceptional;
- programme titles remain stronger than times and secondary metadata;
- schedule numerals use tabular numerals where the production build supports them reliably;
- substantive text continues to respect platform font scaling;
- a future final wordmark may use separate approved custom lettering without changing the UI family.

Any Söhne/Söhne-like typography visible in previously accepted screenshots is **SUPERSEDED only for the typeface family**. Those screenshots remain canonical for their accepted composition, spacing, hierarchy, controls and other visual relationships unless another written rule says otherwise.

Older surface-specific handoff text that still names Söhne is stale for the family name only. `design/current/TYPOGRAPHY.md` and `docs/DESIGN_SYSTEM.md` define the current choice. Exact font-source/licence verification, weight files and platform delivery remain implementation concerns.

## Canonical Guide baseline

### Shared Guide day selector — Totaal + Per zender
Status: **ACCEPTED**
Owner-approved direction: 2026-09-15; Per-zender Primetime amendment 2026-09-15; Per-zender temporal-state refinement 2026-09-17
Detailed manifest: `design/current/guide/GUIDE_DAY_SELECTOR.md`

Canonical visual assets in the user's Teevee Library:
- states / bounded bottom sheet:
  - `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - Library file id: `file_00000000390c8210b76256621721592b`
- sticky / condensed scroll behaviour:
  - `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - Library file id: `file_00000000314481f69f6a34d18ece1c21`

Accepted characteristics:
- one compact primarily typographic date selector, not ten permanent day buttons;
- tapping opens the bounded D-2..D+7 list; no unrestricted calendar;
- `Nu` remains a separate persistent action;
- changing day preserves the viewed wall-clock time where practical;
- between 00:00 and 05:59, show the preceding television-day date without falsely calling it `Vandaag`;
- vertical scrolling preserves essential day/time context while non-functional brand/header chrome condenses;
- Totaal keeps date + `Nu` + time axis available;
- Per zender keeps the channel-logo strip plus one compact channel/date context row with `Primetime` and `Nu` available;
- in Per zender, `Nu` and `Primetime` use semantic action versus active/current states based on the actual schedule context; active/current is not disabled;
- in settled condensed Per zender, the channel strip is 60 pt while the 48×48 channel item remains unchanged;
- larger text adapts height/wrapping instead of forcing tiny labels;
- Nu & Straks has no independent day selector.

The sticky/condensed visual predates the Per-zender Primetime amendment and the owner-approved refinement of 17 September. It remains canonical for overall condensation, stickiness and structural intent, but its Per-zender state is **SUPERSEDED** where it omits `Primetime`, implies static utility-button treatment, or implies a permanently 72-pt settled condensed channel strip. The written rules in `PER_ZENDER.md`, `GUIDE_DAY_SELECTOR.md` and `docs/PER_ZENDER_VISUAL_CONVERGENCE.md` win for those details.

These assets **supersede only the stale date/day controls** in the earlier Totaal and Per-zender canonical screenshots. They do not replace the accepted schedule composition, gestures, logo treatment or general visual character of those surfaces. Typography follows the canonical Instrument Sans rule above.

### Totaal
Status: **ACCEPTED**
Owner-approved direction: 2026-09-13; day-navigation amendment 2026-09-15; typography amendment 2026-09-17
Detailed manifest: `design/current/guide/TOTAAL.md`

Canonical visual assets in the user's Teevee Library:
- light: `/Teevee/Nederlandse tv-gids op smartphone.png`
  - Library file id: `file_0000000015ac81f4ab067e5473ed692d`
- dark: `/Teevee/Donkere Nederlandse tv-gidsinterface.png`
  - Library file id: `file_000000008448821095d8432693d09bd8`
- day-navigation states / bottom sheet: `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - Library file id: `file_00000000390c8210b76256621721592b`
- sticky day-navigation behaviour: `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - Library file id: `file_00000000314481f69f6a34d18ece1c21`

Accepted visual characteristics:
- **Instrument Sans** UI typography; the historical screenshot's Söhne-like family is superseded for family choice only;
- near-white neutral light canvas and calm dark-anthracite dark canvas;
- open 2D schedule geometry, not stacked programme cards;
- channel logos form the left identity rail;
- programme block width/position reflects real schedule time;
- restrained separators and generous whitespace;
- compact red current-time marker; **no full-height red time line**;
- programme titles dominate; low-value metadata is absent;
- current cells may prioritise useful end-time context;
- accepted day selector follows `GUIDE_DAY_SELECTOR.md`.

The date/day control in the original 13 September Totaal images is **SUPERSEDED**. Preserve the rest of their visual hierarchy and use the accepted shared day-selector assets for date navigation. Their typeface family is also superseded by `design/current/TYPOGRAPHY.md` without reopening their composition.

### Per zender
Status: **ACCEPTED**
Owner-approved direction: 2026-09-13; day-navigation and Primetime amendments 2026-09-15; visual refinement 2026-09-17
Detailed manifest: `design/current/guide/PER_ZENDER.md`
Production specification: `docs/PER_ZENDER_VISUAL_CONVERGENCE.md`

Canonical visual assets in the user's Teevee Library:
- light + dark reference: `/Teevee/TV-gids app in licht en donker thema.png`
  - Library file id: `file_000000008b2481f4ad34bb1547fc813e`
- day-navigation states / bottom sheet: `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - Library file id: `file_00000000390c8210b76256621721592b`
- sticky day-navigation behaviour: `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - Library file id: `file_00000000314481f69f6a34d18ece1c21`

Accepted visual characteristics:
- open chronological fixed-row typographic schedule; programme duration does not determine vertical row geometry;
- **no programme thumbnails** in the canonical direction;
- **no genre labels** in the canonical direction;
- persistent horizontally browsable channel-logo strip;
- no decorative previous/next arrows required around the strip;
- logo is primary channel identity; channel name is secondary/contextual;
- selected channel remains fully visible, centres comfortably where geometry permits and may retain a small trailing continuation cue where practical;
- rest channel strip is 72 pt; settled condensed strip is 60 pt while channel items remain 48×48;
- ample separation between channel selector and schedule;
- current programme uses a restrained local progress treatment without current card, red left rail, global current-time line or now-dot;
- programme rows prioritise time and title and use a temporary semantic `surface` fill only while pressed;
- light/dark/system follow the shared Guide shell;
- date remains primarily typographic;
- `Primetime` and `Nu` use action versus active/current visual/semantic states rather than static permanent button treatments;
- `Primetime` is **required** and jumps to 20:30 on the currently selected television day without changing that selected day;
- `Nu` remains distinct and restores the actual current instant/day;
- active/current state is based on semantic schedule context, is not disabled and is not colour-only;
- Per-zender title calibration is 17/21 weight 500 for standard titles and 19/23 weight 700 for current titles;
- accepted day selector follows `GUIDE_DAY_SELECTOR.md`;
- shared typography follows `design/current/TYPOGRAPHY.md`: Instrument Sans replaces any historical Söhne reference for family choice only.

The exact date choices in the original 13 September Per-zender image are **SUPERSEDED**. Preserve the rest of the accepted channel-strip/list composition while using the accepted shared day-selector assets and the written 17 September refinement.

The `Primetime` shortcut visible in the original Per-zender visual is canonical in concept and placement priority. Do not infer from that board that the full `Vanmiddag` / `Vooravond` / `Kies tijd…` sheet is required; that expanded time picker is superseded. The later sticky/condensed board remains useful for structural condensation only: for Per zender it is stale where it omits `Primetime`, shows the old static utility treatment or implies a 72-pt settled condensed strip.

Superseded examples include earlier Per-zender variants with programme imagery, genre descriptions, card-heavy rows, explicit previous/next channel arrow buttons, the expanded time picker, static temporal-button-only treatment or a permanently 72-pt settled condensed channel strip.

### Nu & Straks
Status: **ACCEPTED**
Owner-approved direction: 2026-09-13
Detailed manifest: `design/current/guide/NU_EN_STRAKS.md`

Canonical visual asset in the user's Teevee Library:
- light/dark/live/Primetime reference: `/Teevee/Nu & Straks: Televiegids in beeld.png`
  - Library file id: `file_000000005b9c821080bc05914ea8c110`

Accepted visual characteristics:
- one shared reference instant across every channel;
- current/reference programme is visually dominant;
- **exactly three following programmes** are shown more quietly;
- no programme artwork;
- no genre labels;
- no progress bars;
- no chevrons or repeated `Daarna` labels;
- compact shared time rail;
- `Primetime` from live mode; `Nu` when browsing away from live;
- horizontal movement changes reference time, vertical movement changes channel context;
- channel order/vertical position remains stable while reference time changes;
- shared typography follows the accepted Instrument Sans system.

ADR 0008 changes the meaning of the active day around midnight: 00:00–05:59 remains part of the preceding television day. Nu & Straks still has no independent date selector.

Tracked non-blocking debt: compact following-programme rows at larger text sizes require density-aware Phase 4 hardening; do not solve this by reintroducing cards or low-value chrome.

## Programme Detail
Status: **ACCEPTED DIRECTION**

Current visual reference in the user's Teevee Library:
- `/Teevee/Teevee Programmadetail: Sticky acties.png`
  - Library file id: `file_00000000242481f4a0e772876f215342`

Canonical behavioural/visual rules remain those in `docs/UX.md` and `docs/DESIGN_SYSTEM.md`: title first, channel/time second, `Herinner mij` + `Bewaar`, optional artwork only, calm information surface, contextual sticky bottom copies only after the canonical actions scroll away, and Instrument Sans as the shared UI typeface.

If this Library image conflicts with those written rules, the written accepted rules win until a new visual is explicitly approved and this manifest is updated.

## Tonight / Vanavond
Status: **PROVISIONAL — NOT FROZEN**

Current exploration reference:
- `/Teevee/Vanavond: Teevee designvoorstel.png`
  - Library file id: `file_00000000cc4c821099c97384e519c045`

This is direction, not specification. A new design thread may explore its module composition without treating the existing composition as owner-approved final UI. The shared Instrument Sans typeface choice **is** accepted and applies to future Tonight exploration.

## What counts as a new accepted visual baseline

A generated or edited design is **EXPLORATION** until the owner explicitly approves it.

After approval, the producing Design/Lead thread must, before handoff:
1. update the matching `design/current/...` manifest;
2. update this file if the canonical asset/file-id or accepted characteristics changed;
3. update `UX.md`, `DESIGN_SYSTEM.md` or an ADR when behaviour/system rules changed;
4. state which previous visual is superseded;
5. merge the change to `main`.

Only the version referenced by `main` is canonical. Branch-only designs are proposals unless the owner has explicitly accepted a pending design PR that is being converged before Lead merge.

## Historical designs

Do **not** create a `design/current/old`, `archive`, `previous` or `alternatives` folder. Git history is the design archive.

Historical Library images may remain in the user's Library, but agents must not use Library recency or visual similarity to choose a baseline. Start from the exact file-id named here.

## Library retrieval protocol for ChatGPT threads

The canonical pixels currently live in the user's persistent `/Teevee` Library and the exact Library file ids are recorded above. A thread with the Files connector should read the exact file id/path named here. If it cannot access that asset, it must continue from the written baseline and report the missing visual access instead of silently selecting an older image.

The long-term preferred state is to mirror approved visual binaries into `design/current/` when the available connector path permits exact binary transfer without recreation or quality loss. Until then, **GitHub is the authority that selects the canonical visual; the Library stores the exact pixels.**
