# Vanavond / Tonight — Product Definition

Status: **CANONICAL PRODUCT CONTRACT — product semantics frozen**  
Defined: 2026-09-23  
Owner: Teevee product  
Implementation status: **NOT STARTED — no production code in this increment**

## Purpose

Vanavond answers a different question from Guide and Search:

- **Guide** — what is on television?
- **Vanavond** — what is relevant and interesting for my television evening?
- **Search** — I know what I am looking for; when and where is it on television?

Vanavond is a finite, calm decision-support surface for linear television. It is rooted in concrete canonical broadcasts and stops when the useful evening selection stops.

It is not:

- a second full Guide;
- an infinite discovery feed;
- a streaming catalogue;
- a news/article surface;
- a generic engagement feed.

## Product principles

1. **Concrete broadcasts remain the product object.** Every visible programme is an existing canonical `Programme` on a canonical `Channel`.
2. **Finite over exhaustive.** Vanavond helps the user choose; it does not reproduce the complete Guide.
3. **Explicit personal intent first.** The user's own saved evening plan comes before editorial and categorical discovery.
4. **No fake personalisation.** A future `Voor jou` module is only introduced after a separate recommendation contract exists.
5. **Chronology over invented ranking.** First-release Kijktips, Films, Series and Sport are chronological; Teevee does not invent a quality score.
6. **Data quality gates category claims.** Film/Series/Sport are not enabled from naive string matching.
7. **Artwork is enrichment.** The screen must remain useful and premium without programme imagery.
8. **Guide performance is protected.** Vanavond must not make Guide startup or the accepted Guide runtime heavier.

## First-release page hierarchy

The first implementation candidate is:

1. **Jouw gids**
2. **Onze Kijktips**
3. **Films vanavond**
4. **Series vanavond**
5. **Sport vanavond**

The page ends after the final available module.

`Films vanavond`, `Series vanavond` and `Sport vanavond` are first-release product candidates but each is individually gated by the empirical classification research defined below. A module that cannot be supported reliably is postponed rather than filled with weak heuristics.

There is no first-release:

- generic `Uitgelicht` item;
- `Verder vanavond` catch-all list;
- global `Nu / 20:30 / 21:00` time-chip selector;
- news/article content;
- streaming content;
- trending module without a trustworthy source;
- AI recommendation;
- filler content.

## Television-day ownership

Vanavond uses the existing canonical television-day model from ADR 0008:

**06:00 Europe/Amsterdam -> 06:00 the following local calendar day.**

The active Vanavond date is always the television day containing the actual current instant.

Consequences:

- at 10:00 on 23 September, Vanavond represents the evening of 23 September;
- at 01:00 on 24 September, Vanavond still represents the television evening labelled 23 September;
- at 05:59 the preceding television evening is still active;
- at exactly 06:00 Vanavond rolls to the new television day and therefore the coming evening.

There is no independent date selector in Vanavond v1. Future broadcasts may already be saved from Guide/Search, but Vanavond itself presents only the currently active television evening.

The UI should keep the screen title `Vanavond` and provide date context based on the television-day label. After midnight it must not misleadingly call the new civil date the active evening.

## Canonical Vanavond windows

Let `dayStart` be the canonical 06:00 start of the active television day.

Define:

- `eveningStart = 18:00` on that television day;
- `categoryStart = 19:00` on that television day;
- `eveningEnd = next television-day boundary at 06:00`.

These are product windows, derived with the existing `guideTime` primitives. They are not a competing time model.

### Jouw gids window

A saved broadcast belongs to the active Jouw gids when its real broadcast interval intersects:

`[18:00, 06:00)`

This deliberately allows an explicitly saved broadcast that starts shortly before 18:00 but continues into the evening to remain part of the user's plan.

### Onze Kijktips window

A Kijktip qualifies when its broadcast **starts** in:

`[18:00, 06:00)`

### Films / Series / Sport window

A category broadcast qualifies when its broadcast **starts** in:

`[19:00, 06:00)`

Programmes keep their real start/end timestamps. Nothing is shifted to fit these windows.

## Current-time behaviour inside Vanavond

Vanavond can be useful before the evening starts: the user may plan at any point during the active television day.

For **Onze Kijktips** and category modules:

- before their start window, show all qualifying upcoming broadcasts;
- once the evening is underway, keep currently airing and future qualifying broadcasts;
- remove a broadcast from these discovery modules after its real `endAt`;
- do not turn Vanavond into a catch-up surface for programmes that have already ended.

For **Jouw gids**, different semantics apply because it represents the user's explicit plan:

- future saved items remain visible;
- currently airing saved items show a meaningful `Nu` state;
- ended saved items remain visible, visually de-emphasised, until the 06:00 television-day rollover;
- at 06:00 they disappear from the visible Jouw gids because a new television evening becomes active.

This is a view-membership rule. Vanavond v1 does **not** automatically delete or unsave the persisted record at 06:00.

## 1. Jouw gids

### Role

Jouw gids is **explicit personal intent**.

> The user composes their own television evening by saving concrete broadcasts during the day.

It is not a recommendation module and it is not the same as future `Voor jou`.

### Existing `Bewaar` semantics

`Bewaar` remains broadcast-level.

The existing `ProgrammePersonalState` shape is already aligned with this direction: a saved record owns the canonical programme id plus channel, start/end and title snapshot.

Do not convert `Bewaar` into:

- follow this series;
- favourite this title forever;
- generic programme interest.

Those may be separate future concepts.

### Ordering

Jouw gids is chronological:

1. `startAt` ascending;
2. canonical channel `sortOrder`;
3. canonical `Programme.id` as deterministic final tie-breaker.

### Overlapping saved broadcasts

Overlaps are valid user intent.

- preserve every saved broadcast;
- do not choose a winner;
- do not collapse an overlap;
- do not block saving a second programme at the same time.

Design may communicate an overlap if it can do so quietly, but conflict resolution is not required in v1.

### Multiple broadcasts with the same title

Do not deduplicate by title.

If the user deliberately saved two different broadcasts with the same title, both remain separate rows because they are separate broadcast identities.

A consciously saved repeat also remains.

### Required visible information

Jouw gids must be usable without artwork.

Required:

- start time;
- title;
- channel identity;
- `Nu` when the broadcast is currently airing.

End time is optional when Design finds it useful. Artwork is not required.

Tap normally opens the existing Programme Detail for that exact canonical broadcast.

### Start-time corrections and stale saved ids

Current canonical programme identity includes broadcast start. A later EPG start-time correction may therefore create a new `Programme.id` while a local saved snapshot still references the old id.

Jouw gids must fail conservatively:

1. exact canonical id wins;
2. a future implementation may deterministically reconcile a stale saved record using its stored channel/title/start snapshot against one bounded canonical evening schedule;
3. any fallback must require one unique high-confidence broadcast match;
4. do not use title-only inference;
5. ambiguous/unresolved saves remain visible from their local snapshot rather than silently pointing at another broadcast;
6. an unresolved snapshot must not fabricate canonical Programme Detail.

The exact reconciliation tolerance is a technical/data decision and is not frozen here.

## Saving before Vanavond

A user may save any concrete future Guide/Search broadcast before its evening begins.

A saved broadcast is associated with the television day that contains that broadcast. It becomes visible in Jouw gids when that television day is the active Vanavond evening.

Saving a future-day broadcast must not imply that it was inserted into the currently visible evening.

## Empty states

Jouw gids is the one Vanavond module that remains visible when it has no items.

Two states must be distinguishable.

### A. The user has never used `Bewaar`

Goal: explain the value once, calmly.

Product intent:

> Bewaar programma's die je vanavond wilt zien. Dan staat je tv-avond hier overzichtelijk bij elkaar.

Primary route: **Bekijk de gids**.

A secondary `Zoek een programma` route may be used if Design can include it without turning the empty state into a menu.

### B. The user has used `Bewaar`, but has nothing for this evening

Do not repeat onboarding copy.

The state should simply communicate that nothing has been saved for this evening and provide a quiet path back to Guide.

To support this distinction correctly, implementation needs durable local `hasUsedSave` / save-history semantics. Do not infer “never used” solely from the current `saved` map, because a user may have removed all saved items.

No account is required.

## Save activation and feedback

The first release should strengthen the connection between `Bewaar` and Jouw gids without adding permanent controls to the frozen Guide layouts.

Product requirement:

- after saving a broadcast that belongs to the active Vanavond evening, feedback should make clear that it is now in **Jouw gids**;
- the persistent action may remain `Bewaard`; the exact confirmation treatment is a Design/UX decision;
- a future-day save needs date-aware or neutral feedback and must not claim immediate placement in the current evening.

Current activation surfaces:

- Programme Detail;
- Programme Detail reached from Search.

A direct permanent save affordance in Totaal, Per zender or Nu & Straks is **not** part of this product contract and requires separate Design/UX validation because those Guide layouts are frozen.

## 2. Voor jou — future feature only

`Voor jou` is deliberately different from Jouw gids.

- **Jouw gids:** explicit broadcasts selected by the user.
- **Voor jou:** broadcasts Teevee selects from learned user interests.

`Voor jou` is not implemented in the first Vanavond release and no placeholder module is shown.

Potential future signals may include:

- Programme Detail opens;
- saved broadcasts;
- reminders;
- channel interactions;
- repeated programme interest;
- recency/frequency;
- other relevant app behaviour.

None of these is a frozen recommendation contract yet.

A separate future increment must research:

- signal quality;
- ranking;
- cold start;
- negative signals;
- local vs server-side personalisation;
- privacy;
- transparency;
- retention;
- any need for programme/series identity beyond concrete broadcasts.

## 3. Onze Kijktips

### Source

Use the existing canonical Kijktip editorial enrichment only.

No direct RSS read belongs in mobile Vanavond.

### Eligibility

- exact canonical broadcast has the existing `kijktip` editorial signal;
- broadcast starts from 18:00 up to but not including the 06:00 end of the active television evening;
- after the evening starts, only currently airing or future broadcasts remain in this discovery module.

### Ordering

Chronological by `startAt`.

Deterministic tie-breakers:

1. canonical channel `sortOrder`;
2. canonical `Programme.id`.

No quality score, engagement score or recommendation ranking is introduced.

### Card content

Required:

- title;
- channel;
- start time.

Artwork may enrich the card but is not structural.

Because the section heading already says `Onze Kijktips`, cards do not need a second visible `Kijktip` label by default. Accessibility semantics may still expose editorial status where useful.

## 4. Films vanavond

Eligibility target:

- concrete canonical film broadcasts;
- start in `[19:00, 06:00)`;
- after 19:00, currently airing or future only;
- chronological ordering;
- exact-broadcast Programme Detail destination.

A film is not excluded merely because `isRepeat === true`. A repeated film can still be a valid evening choice.

The module is enabled only when the empirical classification gate proves that Teevee can classify films reliably enough.

## 5. Series vanavond

### Product scope — frozen

`Series vanavond` means **scripted episodic series for a general/mainstream audience**.

Programming that is primarily intended for children is outside this module in v1. This is a product-scope decision, not a provider-taxonomy shortcut: implementation must **not** equate a raw provider genre such as `Kinderen` with the classification rule. The central provider-independent classification/enrichment layer must own both scripted-series identity and audience intent.

Examples from the 2026-09-23 research:
- programmes such as `The Resident`, `The Big Bang Theory`, `Flikken Gent`, `The Spencer Sisters` and comparable scripted episodic series belong in scope;
- children's scripted series such as `Bluey` and `Marvel's Spidey and His Amazing Friends` do not belong in `Series vanavond` v1.

This does not state that children's series are not series. They are deliberately excluded because this Vanavond module serves the general/mainstream evening decision context. A future dedicated Kids/Family discovery module would be a separate product decision.

Eligibility target:

- concrete canonical scripted episodic series broadcasts within the general/mainstream scope;
- start in `[19:00, 06:00)`;
- after 19:00, currently airing or future only;
- chronological ordering;
- exact-broadcast Programme Detail destination.

Do not filter repeats in v1 merely from current canonical `isRepeat`: the empirical classification research found that signal undefined for the complete researched evening population. A trustworthy repeat rule requires better structured evidence before it can become product behaviour.

The module requires the central provider-independent classification mapping/enrichment established by the empirical data gate; raw `Programme.genre` matching is not a production contract.

## 6. Sport vanavond

Eligibility target:

- concrete canonical sport broadcasts;
- start in `[19:00, 06:00)`;
- after 19:00, currently airing or future only;
- chronological ordering;
- exact-broadcast Programme Detail destination.

The label `Sport vanavond` does not itself mean “live only”.

Before implementation, empirical research must distinguish where possible:

- live sporting events;
- non-live/full-event broadcasts;
- explicit repeats;
- highlights/summaries;
- sport magazines/talk programmes;
- other ambiguous sport-labelled content.

Do not use `isLive` absence as proof that a programme is not live.

The module is enabled only after a defensible product classification can be derived from canonical data.

## Repeat semantics by module

There is intentionally no global repeat rule.

- **Jouw gids:** a deliberately saved repeat stays.
- **Onze Kijktips:** editorial selection wins; do not remove a Kijktip solely because it is a repeat.
- **Films:** repeats remain eligible.
- **Series:** data research decides whether an explicit-repeat exclusion improves usefulness.
- **Sport:** data research decides which repeat/summary/magazine classes belong.

The current development XMLTV adapter emits `isRepeat: true` when `<previously-shown>` is present and otherwise leaves it undefined. Absence is therefore not proof of first-run status.

Similarly, `isLive: true` is positive evidence only; an undefined value is not proof that a programme is not live.

## Module-empty behaviour

### Jouw gids

Always render the module.

If empty, render the appropriate personal empty state described above.

### Onze Kijktips / Films / Series / Sport

If a module has zero current/upcoming qualifying items, omit the module completely.

Never render:

- an empty carousel;
- a disabled module shell;
- “coming soon” filler;
- arbitrary programmes just to occupy the space.

The page may therefore contain fewer modules late at night or on a data-sparse evening.

## Artwork

Canonical `Programme` currently has no structural artwork field.

Vanavond must therefore be designed and implemented text-first.

If an authorized artwork enrichment becomes available later:

- it remains sibling enrichment;
- missing artwork must have a deliberate premium fallback;
- artwork failure cannot make a programme disappear;
- artwork fetch must not become part of Guide startup critical path;
- artwork rights/provenance remain independent acceptance gates.

## Data and architecture constraints

Vanavond reuses the existing Teevee domain:

- canonical `Programme`;
- canonical `Channel`;
- canonical 06:00 television-day primitives;
- existing Kijktip sibling enrichment;
- existing local `ProgrammePersonalState`;
- existing Programme Detail.

Do not create:

- a second programme identity model;
- a second EPG store;
- a title-only catalogue entity;
- a client-side external-provider parser;
- a full-horizon eager mobile prefetch.

A future Vanavond read foundation may introduce a dedicated bounded read boundary if that proves cleaner than composing existing reads, but it must be scoped to the active television evening and return provider-independent canonical data.

Personal save state remains separate from schedule data and is joined by canonical broadcast identity.

Category classification, if a mapping/enrichment layer is required, should be provider-independent and centralized rather than repeated as UI `genre.includes(...)` rules.

## Current-data caveats that are already known

The current canonical `Programme` has:

- `genre?: string`;
- `isLive?: boolean`;
- `isRepeat?: boolean`.

The development XMLTV adapter currently maps only the first XMLTV `category` text into `genre`.

That is not enough evidence to declare Film/Series/Sport production-safe. The empirical gate below is mandatory.

## Accessibility

Vanavond must support:

- Dynamic Type / larger system text for substantive programme content;
- logical VoiceOver/TalkBack traversal by section and item;
- full title/channel/time semantics without depending on artwork;
- no status encoded by colour alone;
- platform-safe touch targets;
- light, dark and system appearance;
- readable Jouw-gids rows at large text sizes;
- accessible horizontal-carousels whose content is not discoverable only through swipe gestures.

Design may adapt card density/height as text grows; it must not solve Larger Text by globally suppressing text scaling.

## Performance

Vanavond must not degrade Guide startup or Guide interaction performance.

Requirements:

- do not eagerly fetch the full D-2..D+7 schedule merely for Vanavond;
- bound Vanavond reads to the active television evening;
- use realistic programme/card volumes in performance tests;
- lazy/deferred artwork work must remain outside the Guide critical path;
- horizontal modules should virtualize when measured volumes justify it;
- avoid expensive repeated classification/transforms on every render.

The empirical data research must record nightly item-volume distribution so implementation can be sized from real data rather than assumptions.

## Analytics / privacy

No recommendation profiling is required for v1.

If product analytics are added later, prefer aggregate events such as:

- Vanavond opened;
- module visible;
- programme opened;
- save action used.

Do not log raw personal recommendation profiles or repurpose local saved state for `Voor jou` until the separate recommendation/privacy contract exists.

## Frozen product decisions

The following are frozen for subsequent Design/Development unless concrete evidence justifies reopening them:

1. Guide / Vanavond / Search have distinct jobs-to-be-done.
2. Vanavond is finite linear-TV evening decision support, not a feed/catalogue.
3. Concrete broadcasts remain the canonical item identity.
4. First hierarchy: Jouw gids -> Onze Kijktips -> Films -> Series -> Sport.
5. Jouw gids is explicit saved-broadcast intent.
6. Voor jou is a separate future learned-recommendation feature and has no v1 placeholder.
7. Vanavond uses the active canonical 06:00 television day and has no v1 date selector.
8. Jouw gids uses the 18:00-06:00 evening window by interval intersection.
9. Kijktips start at 18:00; Film/Series/Sport start at 19:00.
10. Jouw gids keeps ended saved items visible until 06:00; discovery modules remove ended items.
11. Saved overlaps and same-title broadcasts remain separate.
12. Jouw gids always renders; other empty modules are omitted.
13. Kijktips and category modules are chronological; no invented ranking.
14. No global repeat rule.
15. Artwork is optional enrichment, never structural.
16. Guide visual layouts remain frozen; no new permanent Guide save control in this increment.
17. Film/Series/Sport require central provider-independent classification mapping/enrichment before production category implementation.
18. `Series vanavond` is scripted episodic series for a general/mainstream audience; programming primarily intended for children is excluded from this module in v1.
19. The Series audience rule is semantic product classification, not a direct raw-provider `Kinderen` filter.
20. No production implementation starts from naive `genre.includes(...)`.

## Open questions / gates

These are the remaining substantive gates.

### Empirical data gate — COMPLETE

The mandatory research is complete in `docs/TONIGHT_CLASSIFICATION_RESEARCH_2026-09-23.md`.

Final decisions:
- Film — **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**;
- Series — **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**;
- Sport — **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**.

The post-research Series product scope is now also frozen: general/mainstream scripted episodic series are in scope; programming primarily intended for children is excluded from `Series vanavond` v1.

The remaining classification work is implementation design for the central provider-independent mapping/enrichment boundary, not further raw-genre product inference.

### Saved-broadcast reconciliation

Development must choose and test a conservative mechanism for EPG start-time corrections so Jouw gids never silently associates a save with the wrong broadcast.

This is a technical/data rule, not a reason to reopen broadcast-level `Bewaar`.

### Artwork

No first-release blocker. Design must work without it. A later authorized enrichment source may improve the cards.

### Voor jou

Separate future research; not a first-release blocker because the module is absent.

## Empirical Film / Series / Sport research contract

Run this against real **canonical hosted Teevee schedule data**, not synthetic fixtures or raw provider rows.

### Scope

Use at least the complete currently available D-2..D+7 product horizon and all active canonical channels.

Include both weekday and weekend evenings. If the available canonical horizon does not contain enough variety, repeat the capture over additional days without changing production schema.

### Extract

For every canonical broadcast relevant to the active/evening windows, capture at minimum:

- programme id;
- channel id/name/order;
- start/end;
- title/subtitle/description when present;
- raw canonical `genre`;
- `isLive`;
- `isRepeat`;
- television-day label;
- whether it starts after 18:00 / 19:00.

### Measure

1. every distinct genre/category value;
2. frequency per value;
3. missing/blank genre rate;
4. distribution by channel;
5. distribution by television day;
6. candidate Film count per evening;
7. candidate Series count per evening;
8. candidate Sport count per evening;
9. min / median / p95 / max nightly volume per module;
10. `isRepeat === true` rate and undefined rate;
11. `isLive === true` rate and undefined rate;
12. sport split between live event / other event / summary-highlights / magazine-talk / repeat / ambiguous where evidence permits.

### Validate classification quality

Create a manually reviewed, stratified ground-truth sample from canonical rows.

For each proposed category mapping measure:

- precision;
- recall/coverage;
- false positives;
- false negatives;
- ambiguous cases.

Wrong category inclusion is more damaging than omission. As a default launch gate, target approximately **>=95% precision** and **>=85% recall/coverage** on the supported canonical channel set; if the data cannot meet that without title-specific hacks, introduce a provider-independent classification enrichment or postpone the module.

These percentages are decision gates, not permission to overfit. Report confidence/sample size.

### Research deliverable

Create:

`docs/TONIGHT_CLASSIFICATION_RESEARCH_2026-09-23.md`

The conclusion must classify each module as one of:

- **GO WITH CURRENT CANONICAL DATA**
- **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**
- **POSTPONE**

No production UI/runtime implementation is part of that research increment.

## Design / UX handoff constraints

Design starts only after reading this product definition and the classification research outcome.

Design owns:

- Jouw gids visual hierarchy;
- the two Jouw-gids empty states;
- save confirmation treatment;
- ended/current/upcoming personal-row treatment;
- carousel composition;
- text-first fallback and optional artwork treatment;
- spacing and module hierarchy;
- horizontal-carousel affordance;
- Larger Text;
- VoiceOver/TalkBack focus/traversal;
- light/dark/system.

Design does **not** reopen:

- module jobs;
- Jouw gids vs Voor jou semantics;
- time-window ownership;
- broadcast identity;
- Guide layout;
- generic ranking;
- category data gates.

## Development sequence

Do not begin production UI from this document alone.

After product + data + Design/UX acceptance, use this sequence:

1. **Vanavond domain/read foundation**
   - shared active-evening window primitives built from existing `guideTime`;
   - bounded canonical read ownership;
   - category classification contract if required;
   - conservative saved-broadcast reconciliation;
   - deterministic tests around 00:00 / 05:59 / 06:00 / DST.
2. **Jouw gids**
   - local save-state read;
   - active-evening filtering/order;
   - two empty-state semantics;
   - current/ended states;
   - exact Programme Detail navigation.
3. **Onze Kijktips**
   - existing sibling editorial signals;
   - chronological current/upcoming evening selection.
4. **Classification-backed Film / Series / Sport**
   - only modules that passed the empirical gate.
5. **Visual convergence**
   - implement accepted Design/UX baseline;
   - text-first; optional artwork enrichment only if available.
6. **Physical iPhone validation**
   - standard + Larger Text;
   - light/dark/system;
   - scrolling/carousels;
   - 00:00/06:00 semantic states.
7. **Independent QA**
   - exact-head review;
   - iOS/Android divergence;
   - accessibility;
   - performance;
   - loading/empty/error/offline;
   - frozen-contract regression check.

`Voor jou` remains outside this sequence until a separate recommendation research/product contract is accepted.
