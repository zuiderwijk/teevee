# Teevee UX and Information Architecture

Status: accepted visual/UX baseline, amended through 18 September 2026 with frozen television-day/Guide-horizon semantics and accepted Guide presentation refinements. The repository remains the technical source of truth. This document records the owner-approved UX direction; implementation status may lag behind it.

## Experience objective
Teevee is a premium, advertising-free TV guide for iOS and Android. The Guide is the primary product. It should feel calm, modern, precise and purpose-built for television schedules: not a content portal, not a streaming catalogue, and not a desktop EPG compressed onto a phone.

Core principles:
- information hierarchy before decoration;
- generous breathing room rather than maximum information per viewport;
- restrained app chrome;
- channel logo primary, channel name secondary/contextual;
- light, dark and system appearance;
- substantive content remains usable with larger system fonts;
- no advertising surfaces;
- artwork is enrichment, never a dependency for Guide usability.

## Information architecture
Working primary navigation:
- Guide
- Tonight
- Search

Settings/profile is secondary. Saved programmes and reminders are contextual capabilities rather than reasons to overload primary navigation.

## Canonical Guide shell
Guide contains three presentations of the same schedule domain:
- Totaal
- Per zender
- Nu & Straks

They share one coherent app shell. The brand header may condense during vertical scrolling: the `tv.` identity is branding, not permanent functional chrome. Essential view-specific context remains available. Bottom navigation remains stable.

Returning from Programme Detail preserves the originating Guide view and its relevant channel, time and scroll context.

### Television-day model
Guide navigation follows a television day rather than a strict midnight calendar day.

- A television day runs from **06:00 Europe/Amsterdam to 06:00 the following calendar day**.
- Midnight does not split an evening. A viewer browsing at 21:00 can continue naturally into 00:00, 01:00 and later without an explicit day switch.
- Between 00:00 and 05:59, the active television day is still the preceding evening/date.
- `Nu` always means the actual current instant and selects the television day containing that instant.
- Totaal and Per zender support at least **D-2 through D+7**, where D is the current television day.
- The UI uses normal human-readable dates and relative labels; users are not required to understand the internal term `television day`.
- 06:00 is a semantic grouping boundary, not necessarily a hard visual scroll stop on continuous Guide surfaces.

### Guide day selector — accepted interaction baseline
Totaal and Per zender share one compact day-navigation model. Nu & Straks has no independent date selector.

- show one primarily typographic date selector rather than ten permanent date buttons;
- tapping the selector opens a bounded bottom sheet containing exactly the available D-2..D+7 television days in chronological order;
- do not expose an unrestricted calendar, disabled out-of-range dates or technical D-offset notation;
- use the same compact date wording in Totaal and Per zender: from 06:00–23:59 the current/next television days are simply `Vandaag` / `Morgen` with no extra date suffix, other days use abbreviated weekday + date, and from 00:00–05:59 **all** day labels use explicit weekday + date with no `Vandaag`/`Morgen`;
- `Nu` remains a separate, persistent action rather than being folded into the date selector;
- changing day preserves the currently viewed wall-clock time where practical (for example 20:35 -> another day around 20:35);
- `Nu` is the explicit reset that restores both the actual current instant and its television-day context;
- day selection must not introduce a competing horizontal gesture zone.

Sticky behaviour:
- essential day/time context remains available during vertical Guide scrolling while non-functional brand/header chrome may condense away;
- in Totaal, the date selector, `Nu` and time axis remain available;
- in Per zender, the horizontal channel-logo strip remains sticky and is followed by one compact sticky temporal row with date, `Primetime` and `Nu` available;
- Per-zender does not render selected-channel text outside the persistent logo rail in either expanded/rest or condensed state; the selected logo carries visible identity throughout;
- scrolling back to the top restores the full rest-state hierarchy naturally;
- reduced-motion mode may use a simpler non-interpolated transition.

Totaal date-context behaviour:
- horizontal time browsing remains continuous across midnight and the 06:00 grouping boundary;
- the visible date context updates when the Guide's stable time-navigation anchor crosses 06:00, not merely when a small sliver of the next television day enters the viewport;
- the label change should be visually quiet and must not interrupt native scrolling.

Canonical visual/interaction details live in `design/current/guide/GUIDE_DAY_SELECTOR.md`.

### Mijn zenders — accepted personal channel model

Teevee separates the complete supported channel catalog from the subset/order the user wants in their everyday Guide.

- one persisted selected-channel set and order is shared across Guide presentations;
- Per zender's persistent channel-logo rail uses that selected set/order;
- Totaal and Nu & Straks consume the same selected set/order rather than maintaining independent personal channel lists;
- a hidden channel is removed from everyday Guide navigation, not deleted from Teevee;
- Search always searches the complete canonical catalog, including hidden channels;
- opening a hidden channel from Search is contextual and must not silently add it to the persisted Guide selection;
- when Search exposes a hidden channel, provide a quiet explicit personalisation affordance so the user can add it to the selected set;
- after explicit addition, channel-order management may be offered as a secondary next step;
- deterministic channel-management intents such as `zenders`, `zenderoverzicht` and `mijn zenders` may route directly to the management surface instead of producing a dead no-result state.

This makes Search both a recovery path and a contextual learning surface for personalisation. Avoid generic interruptive tutorials when the user's own query already creates a better teaching moment.

Evidence and product boundary: `docs/TVGIDS_APP_SEARCH_CHANNEL_EVIDENCE_2026-09-24.md`.

### Shared channel identity
Use the channel logo as the primary visual identifier when licensed/readable artwork exists. Channel name is secondary/contextual and remains available to accessibility APIs. Provide an intentional text fallback when artwork is unavailable. Never distort channel marks merely to fit the UI.

## Totaal — accepted interaction baseline
Purpose: compare multiple channels across time.

- vertical movement: channels;
- horizontal movement: time;
- time axis remains available/sticky where needed for orientation;
- channel identity rail remains available while moving through time;
- tap programme: open Programme Detail directly;
- current time uses one compact marker anchored to the time axis; its full `HH:MM` must remain readable, with 38 pt reserved as label space + existing 5-pt X padding outside it (48-pt base /56-pt compact-cap outer body), while the 6×4 pointer remains at exact current-minute X even when the body clamps at a viewport edge; do not add a full-height red line through channel rows;
- current programme information prioritises the useful end time (`tot HH:MM`) without an in-cell progress bar or heavy permanent current card;
- future/non-current programmes prioritise start time; end time is normally unnecessary in the grid;
- programme cells use the accepted open-grid language: no permanent rounded/fill card treatment merely to define every cell;
- title is the primary programme signal; avoid genres and other low-value metadata inside compact schedule cells;
- genuine microcells use the unchanged classification `full frame width < 48 × S`, with `S = max(1, effectiveFontScale)`, and show no visible title/time/ellipsis glyph individually;
- a visually empty microcell remains a complete programme action with its real boundary, Pressable/pressed semantics, accessibility label/current state and Programme Detail destination;
- >=2 directly adjacent same-title microcells may share one visual title when their visible combined run width is at least `48 × S`; below that threshold the run remains text-free and the shared label is bounded/sticky within the run only;
- repeated-title sharing is presentation-only: internal boundaries, exact duration frames, hit targets, accessibility actions and Programme Detail destinations remain programme-by-programme;
- use the accepted shared Guide day selector for D-2..D+7 navigation;
- in Totaal's frozen 52-pt one-line context, date+chevron and `Nu` keep intrinsic readable width within the compact 1.20 cap when horizontal room exists; `Nu` never ellipsizes;
- `Nu` returns to the actual current instant and corresponding television day;
- browsing through midnight is continuous and does not require selecting the next calendar day;
- when crossing 06:00, date context updates to the next television day while the timeline may remain continuous;
- platform-standard tactile scrolling remains the default: Totaal horizontal schedule/time-axis inertia and bounce stay native, and normal vertical scrolling/fling/deceleration stay native;
- **Totaal alone intentionally disables vertical endpoint overscroll/rubber-band** because the fixed date/Nu/time-axis/Guide chrome stack does not move with the schedule/channel canvas; physical iPhone validation rejected the resulting partial-content displacement. Do not generalise this exception to Per zender or Nu & Straks.

Programme geometry continues to represent real schedule time. Text may adapt within the visible part of a programme cell, but the programme block itself must not move away from its real start/duration geometry. For a partially-left normal programme, keep the masking surface active even when sticky title text is hidden. Reveal sticky title text only when the **usable inner width after the active programme padding** reaches the scaled base readability budget (48 pt at S=1, derived from the existing 64-pt standard threshold minus 8/8 pt padding). The outer remainder is therefore padding-aware rather than the microcell/repeated-run 48 × S frame threshold, so the left edge never reintroduces one-letter or bare-ellipsis fragments.

The Totaal Guide clock is wall-clock aligned: with its 30-second cadence refreshes target `:00` and `:30`, AppState→active refreshes immediately, and the next tick is realigned after resume.

At larger system text sizes, adapt row height, geometry and secondary metadata density rather than clipping essential information or globally disabling text scaling.

Accepted Totaal visual composition (owner-approved 2026-09-21):
- expanded/rest uses the shared Guide shell with `tv.` branding, shared Guide presentation tabs and shared Search/secondary action chrome;
- condensed/scrolled removes non-functional brand/actions and Guide presentation tabs entirely; do not retain a compact `tv.` mark in the functional stack;
- persistent functional context is date selector + separate `Nu` + time axis;
- time axis labels whole and half hours; quarter hours are unlabeled minor ticks;
- channel rail is logo-first, has no visible `ZENDER` heading and does not duplicate a readable logo with a visible channel-name caption;
- channel rail and schedule share one calm canvas with restrained separators rather than card/sidebar surfaces;
- bottom navigation uses the same shared app-shell structure as Per zender;
- exact production metrics, responsive rules and physical acceptance criteria are owner-approved in `docs/TOTAAL_VISUAL_CONVERGENCE.md` and become canonical Development authority when that specification is merged to `main`.

## Per zender — accepted interaction baseline
Purpose: inspect the schedule of one channel while making adjacent-channel comparison effortless.

- vertical movement: programme schedule through the television day;
- horizontal swipe across the schedule: previous/next channel;
- direction locking prevents diagonal gestures from accidentally switching channel;
- a horizontal channel-logo strip remains available/sticky during vertical scrolling;
- the logo strip itself can be horizontally browsed; tapping a logo selects that channel directly;
- no previous/next arrow buttons are required around the logo strip when swipe/scroll affordance is clear;
- active channel remains visible and may be centred automatically after a channel change;
- channel logo is primary; channel name remains available contextually through accessibility and missing-logo fallback;
- do not duplicate the selected channel logo with textual selected-channel identity outside the persistent rail in either expanded/rest or condensed state;
- changing channel preserves the viewed time anchor rather than blindly preserving a pixel offset;
- use the accepted shared Guide day selector for D-2..D+7 navigation;
- date remains secondary to channel context;
- `Primetime` is a persistent fast-navigation shortcut within Per zender;
- `Primetime` **keeps the currently selected television day** and jumps the schedule to **20:30 Europe/Amsterdam** on that day;
- selecting another day and then choosing `Primetime` therefore goes to 20:30 on that selected historical/future television day rather than returning to today;
- between 00:00 and 05:59, when the selected/current television day is the preceding date, `Primetime` jumps back to 20:30 on that preceding evening;
- `Nu` remains semantically distinct: it restores both the actual current instant and the television day containing it;
- date, `Primetime` and `Nu` remain available in one compact sticky temporal row during vertical schedule browsing;
- Per-zender date/Primetime/Nu labels use a hard `maximumFontSizeMultiplier = 1.20` and remain one line; programme content continues to follow its substantive Dynamic Type rules;
- do not reintroduce the older expanded time picker with `Vanmiddag`, `Vooravond` or arbitrary `Kies tijd…` options; the accepted requirement is the direct Primetime shortcut only;
- the schedule continues naturally through midnight within the same television-day context;
- use **4 pt** channel rail→temporal context and **24 pt** temporal context→schedule in expanded/rest; both gaps collapse to **0 pt** in settled condensed state while the temporal context itself remains exactly **52 pt**. This deliberately keeps temporal navigation optically closer to the selected-logo rail and gives the programme list more breathing room;
- programme rows remain open and typographic rather than stacked cards;
- when programme context exposes `isKijktip = true`, Per zender shows a quiet non-interactive `Kijktip` second line in the existing time column directly below the start time; no badge/pill/icon/accent colour and no title-column width loss;
- Kijktip does not change standard/current row heights, current-programme treatment, channel/temporal chrome or gesture ownership; it is included once in the existing programme accessibility semantics and is not a separate focus target;
- do not add genre chips or thumbnails merely to increase information density.

## Nu & Straks — accepted interaction baseline
Purpose: answer quickly what is on now/at a chosen time and what follows on each channel.

- single active television-day experience; no independent multi-day date selector;
- before 06:00 the active television day is still the preceding evening/date;
- vertical movement: channels;
- horizontal movement/time selector: reference time within the active television day, settling on **15-minute browse increments**;
- whole and half hours are text-labelled on the rail; quarter hours remain unlabeled but have a shorter thin positional tick, while whole/half hours use a longer thin tick;
- common reference time applies to every channel row;
- time selector remains available/sticky while browsing vertically;
- live mode follows the **actual current instant** and is never semantically rounded to a 15-minute rail position; there is no standalone visible reference-time copy because the rail itself provides temporal orientation;
- moving away from live pins the selected time (browse mode); clock ticks do not pull it back;
- a clear `Nu` affordance returns to live mode; active/current `Nu` and return-to-live `Nu` must use visibly and semantically distinct states;
- `Primetime` is the explicit shortcut to the evening/prime-time reference point. Between midnight and 05:59 this may refer back to the preceding evening's primetime because that is still the active television day;
- each channel shows the programme airing at the reference instant plus **three following programmes**;
- the reference-programme block and its transition to the following list are deliberately compact: the reference title sits toward the bottom of its deterministic block and the dedicated reference→following spacer is 0 pt; the three following programme targets sit directly adjacent without extra inter-row spacing while retaining separate platform-safe touch targets; at standard text their visible content progressively uses the available target slack (#1 2/3, #2 1/3, #3 0) so the three lines read as one compact sequence, while Larger Text keeps the physically accepted centred composition;
- the current/reference programme is visually dominant; the three following programmes use lower typographic weight/contrast;
- the reference programme does **not** show visible `tot …` end-time metadata; in normal continuous schedules the next programme's start time already communicates that boundary. Full start/end time remains part of accessibility semantics and Programme Detail;
- following programmes show their start times; their end times are unnecessary;
- no progress bars in this view: the shared time context and hierarchy are sufficient and removing bars improves scanning;
- no genre labels, artwork, chevrons, `Daarna` labels or card-heavy treatment;
- keep channel order and vertical position stable when the reference time changes;
- schedule semantics are `startAt <= referenceTime < endAt`;
- at gaps, show an honest no-schedule state rather than pretending the last programme is still current;
- the selector is bounded to the active television day, while following programmes may naturally cross its 06:00 boundary;
- each following programme owns a real, non-overlapping platform-safe touch target: minimum **44 pt on iOS / 48 dp on Android**;
- the three following slot geometries remain reserved even when programme data is incomplete, so changing reference time does not shift the user's vertical channel context;
- at effective font scale above **1.35**, following-programme content uses the accepted inline time+title composition with up to two visible lines; stacked time-above-title is reserved for the extreme >2.0 / <180-pt programme-width fallback;
- substantive programme content keeps Dynamic Type; only compact functional chrome may use the documented narrow scaling cap. Nu & Straks keeps a **52-pt utility-only Primetime/Nu context at all font scales**; the shared Guide tabs independently use their accepted 64-pt/max-two-line Larger Text state;
- production shell/detail metrics and physical validation criteria are defined in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`.

The design intentionally differentiates itself from TVgids.nl by showing three following programmes while using less interface and lower visual density.

## Programme Detail — accepted interaction baseline
Tap a programme in any Guide presentation to open Programme Detail directly. Do **not** insert an intermediate preview/action sheet.

Information hierarchy:
1. title;
2. channel logo/name and broadcast date/time;
3. relevant status such as `Nu bezig` only when useful;
4. `Herinner mij` and `Bewaar`;
5. description;
6. optional secondary metadata/enrichment.

Artwork is optional enrichment, not structural. A detail screen without artwork must still feel complete and premium.

Current phase actions are deliberately limited to:
- Herinner mij;
- Bewaar.

No share action, overflow menu, calendar action or recommendation feedback is required in this phase.

### One-handed action behaviour
The canonical actions live naturally in the content near the programme identity. They are not permanently duplicated at the bottom.

When both original actions have clearly scrolled out of view, a compact sticky bottom action bar appears with `Herinner mij` and `Bewaar`. When the original actions become substantially visible again, the sticky copy disappears. Use hysteresis so it does not flicker around the threshold.

Rules:
- action targets remain platform-appropriate and safe-area aware;
- `Herinner mij` may receive primary accent emphasis; `Bewaar` remains quieter;
- state changes give immediate feedback (`Herinnering aan`, `Bewaard`, or equivalent state treatment);
- if accessibility text no longer allows comfortable side-by-side labels, stack the actions vertically rather than shrinking text;
- reserve enough bottom content padding so the sticky actions never obscure content;
- short detail pages where the original actions never leave the viewport never show the sticky bar;
- swipe-to-dismiss behaviour must remain usable without turning the action bar into a gesture trap.

## Tonight / Vanavond — product + production visual frozen

Canonical product authority: `docs/TONIGHT_PRODUCT_DEFINITION.md`.
Canonical production visual/specification: `design/current/TONIGHT.md` + `docs/TONIGHT_VISUAL_CONVERGENCE.md`.

Vanavond is a finite decision-support surface for the active television evening, rooted in concrete canonical linear-TV broadcasts. It is more visual than Guide where that improves discovery, but it is not an endless feed, streaming catalogue or news/article surface.

First-release hierarchy is fixed:
1. `Jouw gids` — explicit broadcast-level saves;
2. `Onze Kijktips` — canonical editorial Kijktips;
3. `Films vanavond`;
4. `Series vanavond`;
5. `Sport vanavond`.

Then the page ends.

### Jouw gids
- always present;
- open chronological list, not cards/carousel;
- visible start time, title and channel;
- literal `Nu` for a current saved broadcast;
- ended saves remain quietly visible with `Afgelopen` until the 06:00 rollover;
- overlapping or same-title saves remain independent;
- row tap opens exact-broadcast Programme Detail when canonical resolution exists;
- stale unresolved local snapshots remain visible but never fabricate a Detail destination;
- no section chevron or separate Jouw-gids screen in v1.

Two empty states remain distinct:
- never used Bewaar: explanatory onboarding + `Bekijk de gids`;
- used Bewaar before but no items for the active evening: quiet no-items message + route to Guide.

After a successful active-evening save from Programme Detail, confirmation explicitly says `Bewaard in Jouw gids`; the persistent action may remain `Bewaard`. Future-evening saves use date-aware feedback and do not claim current-evening placement.

### Discovery/category carousels
- Onze Kijktips, Films, Series and Sport are native horizontal carousels embedded in the vertical page;
- no section chevrons, `Alles` destinations, pager dots or arrow controls;
- continuation is communicated by a partially visible next item;
- one programme action per card;
- ended discovery items disappear after their real `endAt`;
- current cards expose textual `Nu`.

Onze Kijktips uses a 16:9 card family and does not need a repeated visible Kijktip label per card because the section establishes editorial context.

Films and Series use standing 2:3 poster geometry. Series is intentionally denser than Films because measured real volume is ~12–17 qualifying general/mainstream scripted broadcasts per evening. No ranking/deduplication is introduced.

Sport uses landscape broadcast cards and its module is fully omitted when empty.

Artwork is optional enrichment. Missing/failed art retains the same media geometry with a premium channel/text fallback; no fake posters are created. Preferred future Film/Series art is language-neutral/no-language 2:3 poster art. The owner's intended TMDB source remains a central enrichment/data-rights concern, never a direct mobile UI dependency.

Vanavond has no date selector. A quiet date context derives from the active 06:00 television-day start date so 00:00–05:59 remains visibly associated with the preceding evening.

Light/dark/system and substantive Dynamic Type preserve the same hierarchy. Larger Text adapts Jouw-gids rows and carousel widths/density rather than shrinking or clipping essential content.

Film/Series/Sport population remains blocked on the central provider-independent classification/enrichment contract identified by the empirical research. The accepted visual must never be populated through raw-provider genre heuristics in presentation code.

## Search
Canonical Phase 5A contract: `docs/SEARCH_PRODUCT_DEFINITION.md`.

One prominent search field. Search targets **concrete programme broadcasts and channels**, prioritising useful current/upcoming broadcasts while retaining recent D-2/D-1 history inside the canonical Guide horizon. Every programme result answers what / where / when before tap and opens Programme Detail for that exact canonical broadcast. Channel results open Guide → Per zender on that channel.

Phase 5A intentionally excludes universal streaming, people, genres, articles, recommendations, AI/semantic search and fuzzy/typo correction. Repeats remain separate broadcasts rather than title-only catalogue entities.

## Channel management
Users can choose and reorder channels. Provide a sensible default lineup so onboarding can be skipped or completed quickly. Choices persist locally.

## Accessibility
Accessibility is a core quality requirement.

- support larger platform text sizes for substantive content;
- adapt density, row height and wrapping instead of clipping essential information;
- narrow font-scaling caps are allowed only for documented compact controls where a critical grouping must remain intact;
- provide full channel names and meaningful programme/time context to screen readers;
- keep touch targets usable as text grows;
- do not encode state using colour alone;
- maintain contrast in light and dark themes;
- respect reduced-motion preferences;
- validate representative larger text sizes on physical devices.

For the Guide day selector specifically:
- Totaal may wrap/increase header height where its accepted layout requires it; **Per zender is the explicit exception**: date, `Primetime` and `Nu` remain one line at `maximumFontSizeMultiplier = 1.20` inside the fixed 52-pt temporal context and must not recreate an 88-pt wrapped state;
- the complete date control, `Primetime` where present, and `Nu` remain platform-appropriate touch targets;
- screen readers receive the full selected date and `Dag kiezen`/equivalent action semantics;
- Per-zender `Primetime` exposes a meaningful jump-to-20:30 action label;
- selected day in the bottom sheet has a non-colour selected indicator/state.

## Phase 4 television-day acceptance
The Core Guide MVP is not complete until physical validation confirms at least:
- opening around 19:00 lands around `Nu` while the same television day remains navigable backward;
- a user can browse continuously from evening through midnight into the early morning;
- opening at 00:05 still uses the preceding television-day context and does not misleadingly label that preceding date as `Vandaag`;
- 05:59 remains in the preceding television day and 06:00 enters the new television day;
- Totaal and Per zender can navigate D-2, D-1, D and D+1..D+7 through the accepted day selector;
- changing day preserves the viewed wall-clock anchor where practical;
- in Per zender, `Primetime` jumps to 20:30 on the selected television day without changing that selected day;
- in Per zender between 00:00 and 05:59, `Primetime` returns to 20:30 on the preceding television-day evening;
- `Nu` remains distinct from Primetime and restores the actual current instant/day;
- Totaal date context updates coherently when the stable time-navigation anchor crosses 06:00;
- vertical scrolling preserves the accepted sticky day/time context in Totaal and the fixed 52-pt date/Primetime/Nu temporal context beneath the persistent channel rail in Per zender;
- `Nu` correctly restores the actual instant from any selected historical/future day;
- Programme Detail opens/returns correctly for historical and future broadcasts;
- refresh/day rollover preserves meaningful channel/time/date context;
- 23-hour and 25-hour DST cases remain correct.

## Visual/interaction principle
Teevee should achieve **more utility with less interface**. Avoid card stacking, gratuitous separators, repeated metadata, decorative controls and UI that exists only because other media apps contain it.

## Validation status
The decisions above marked accepted are owner-approved UX baselines from the visual-design process. They are not claims that every item is already implemented. Implementation should be checked against the repository and validated on representative iOS and Android devices before being considered technically complete.
