# Teevee — Canonical Visual Baseline

Status: **ACTIVE VISUAL SOURCE OF TRUTH**
Last reconciled: 2026-09-15

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

## Canonical Guide baseline

### Totaal
Status: **ACCEPTED**
Owner-approved direction: 2026-09-13
Detailed manifest: `design/current/guide/TOTAAL.md`

Canonical visual assets in the user's Teevee Library:
- light: `/Teevee/Nederlandse tv-gids op smartphone.png`
  - Library file id: `file_0000000015ac81f4ab067e5473ed692d`
- dark: `/Teevee/Donkere Nederlandse tv-gidsinterface.png`
  - Library file id: `file_000000008448821095d8432693d09bd8`

Accepted visual characteristics:
- Söhne visual direction;
- near-white neutral light canvas and calm dark-anthracite dark canvas;
- open 2D schedule geometry, not stacked programme cards;
- channel logos form the left identity rail;
- programme block width/position reflects real schedule time;
- restrained separators and generous whitespace;
- compact red current-time marker; **no full-height red time line**;
- programme titles dominate; low-value metadata is absent;
- current cells may prioritise useful end-time context.

**Known stale area in the accepted image:** the exact date/day control shown in the 13 September mock-up predates ADR 0008. The visual hierarchy remains accepted, but day navigation must follow the current television-day semantics and D-2..D+7 requirement. Do not copy the old date-control behaviour as specification.

### Per zender
Status: **ACCEPTED**
Owner-approved direction: 2026-09-13
Detailed manifest: `design/current/guide/PER_ZENDER.md`

Canonical visual asset in the user's Teevee Library:
- light + dark reference: `/Teevee/TV-gids app in licht en donker thema.png`
  - Library file id: `file_000000008b2481f4ad34bb1547fc813e`

Accepted visual characteristics:
- open vertical typographic schedule;
- **no programme thumbnails** in the canonical direction;
- **no genre labels** in the canonical direction;
- persistent horizontally browsable channel-logo strip;
- no decorative previous/next arrows required around the strip;
- logo is primary channel identity; channel name is secondary/contextual;
- ample separation between channel selector and schedule;
- current programme can receive restrained live/current emphasis;
- programme rows prioritise time and title;
- light/dark/system follow the shared Guide shell;
- `Nu` / Primetime / date navigation are utility controls, not visual hero elements.

**Known stale area in the accepted image:** exact date choices predate ADR 0008. Totaal and Per zender must ultimately support the current television-day range D-2 through D+7. Preserve the accepted list/strip composition while redesigning the date-navigation control in Phase 4.

Superseded examples include earlier Per-zender variants with programme imagery, genre descriptions, card-heavy rows or explicit previous/next channel arrow buttons.

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
- channel order/vertical position remains stable while reference time changes.

ADR 0008 changes the meaning of the active day around midnight: 00:00–05:59 remains part of the preceding television day. Nu & Straks still has no independent date selector. The canonical visual hierarchy remains accepted.

Tracked non-blocking debt: compact following-programme rows at larger text sizes require density-aware Phase 4 hardening; do not solve this by reintroducing cards or low-value chrome.

## Programme Detail
Status: **ACCEPTED DIRECTION**

Current visual reference in the user's Teevee Library:
- `/Teevee/Teevee Programmadetail: Sticky acties.png`
  - Library file id: `file_00000000242481f4a0e772876f215342`

Canonical behavioural/visual rules remain those in `docs/UX.md` and `docs/DESIGN_SYSTEM.md`: title first, channel/time second, `Herinner mij` + `Bewaar`, optional artwork only, calm information surface, and contextual sticky bottom copies only after the canonical actions scroll away.

If this Library image conflicts with those written rules, the written accepted rules win until the visual reference is explicitly re-approved and this manifest is updated.

## Tonight / Vanavond
Status: **PROVISIONAL — NOT FROZEN**

Current exploration reference:
- `/Teevee/Vanavond: Teevee designvoorstel.png`
  - Library file id: `file_00000000cc4c821099c97384e519c045`

This is direction, not specification. A new design thread may explore it without treating the existing composition as owner-approved final UI.

## What counts as a new accepted visual baseline

A generated or edited design is **EXPLORATION** until the owner explicitly approves it.

After approval, the producing Design/Lead thread must, before handoff:
1. update the matching `design/current/...` manifest;
2. update this file if the canonical asset/file-id or accepted characteristics changed;
3. update `UX.md`, `DESIGN_SYSTEM.md` or an ADR when behaviour/system rules changed;
4. state which previous visual is superseded;
5. merge the change to `main`.

Only the version referenced by `main` is canonical. Branch-only designs are proposals.

## Historical designs

Do **not** create a `design/current/old`, `archive`, `previous` or `alternatives` folder. Git history is the design archive.

Historical Library images may remain in the user's Library, but agents must not use Library recency or visual similarity to choose a baseline. Start from the exact file-id named here.

## Library retrieval protocol for ChatGPT threads

The canonical pixels currently live in the user's persistent `/Teevee` Library and the exact Library file ids are recorded above. A thread with the Files connector should read the exact file id/path named here. If it cannot access that asset, it must continue from the written baseline and report the missing visual access instead of silently selecting an older image.

The long-term preferred state is to mirror approved visual binaries into `design/current/` when the available connector path permits exact binary transfer without recreation or quality loss. Until then, **GitHub is the authority that selects the canonical visual; the Library stores the exact pixels.**
