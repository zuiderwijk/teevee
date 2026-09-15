# Teevee UX and Information Architecture

Status: accepted visual/UX baseline, amended 15 September 2026 with frozen television-day and Guide-horizon semantics. The repository remains the technical source of truth. This document records the owner-approved UX direction; implementation status may lag behind it.

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

### Shared channel identity
Use the channel logo as the primary visual identifier when licensed/readable artwork exists. Channel name is secondary/contextual and remains available to accessibility APIs. Provide an intentional text fallback when artwork is unavailable. Never distort channel marks merely to fit the UI.

## Totaal — accepted interaction baseline
Purpose: compare multiple channels across time.

- vertical movement: channels;
- horizontal movement: time;
- time axis remains available/sticky where needed for orientation;
- channel identity rail remains available while moving through time;
- tap programme: open Programme Detail directly;
- current time uses a restrained indicator; do not add a redundant full-height red line when the time marker itself gives sufficient orientation;
- current programme information prioritises the useful end time; avoid duplicating a start time that is already spatially evident;
- future programmes prioritise start time; end time is normally unnecessary in the grid;
- avoid genres and other low-value metadata inside compact schedule cells;
- Phase 1 prototype navigation used `Vandaag · Morgen · Nu`; Phase 4 must evolve date navigation to cover D-2..D+7 without turning the header into ten permanent date buttons;
- `Nu` returns to the actual current instant and corresponding television day;
- browsing through midnight is continuous and does not require selecting the next calendar day;
- when crossing 06:00, date context updates to the next television day while the timeline may remain continuous;
- platform-standard inertia and elastic/bounce behaviour are part of the intended tactile quality; avoid hard unnatural scroll stops.

Programme geometry continues to represent real schedule time. Text may adapt within the visible part of a programme cell, but the programme block itself must not move away from its real start/duration geometry.

At larger system text sizes, adapt row height, geometry and secondary metadata density rather than clipping essential information or globally disabling text scaling.

## Per zender — accepted interaction baseline
Purpose: inspect the schedule of one channel while making adjacent-channel comparison effortless.

- vertical movement: programme schedule through the television day;
- horizontal swipe across the schedule: previous/next channel;
- direction locking prevents diagonal gestures from accidentally switching channel;
- a horizontal channel-logo strip remains available/sticky during vertical scrolling;
- the logo strip itself can be horizontally browsed; tapping a logo selects that channel directly;
- no previous/next arrow buttons are required around the logo strip when swipe/scroll affordance is clear;
- active channel remains visible and may be centred automatically after a channel change;
- channel logo is primary; channel name is contextual/secondary;
- changing channel preserves the viewed time anchor rather than blindly preserving a pixel offset;
- date remains available as secondary context/navigation across D-2..D+7;
- the schedule continues naturally through midnight within the same television-day context;
- give deliberate visual breathing room between the channel selector and schedule content;
- programme rows remain open and typographic rather than stacked cards;
- do not add genre chips or thumbnails merely to increase information density.

## Nu & Straks — accepted interaction baseline
Purpose: answer quickly what is on now/at a chosen time and what follows on each channel.

- single active television-day experience; no independent multi-day date selector;
- before 06:00 the active television day is still the preceding evening/date;
- vertical movement: channels;
- horizontal movement/time selector: reference time within the active television day;
- common reference time applies to every channel row;
- time selector remains available/sticky while browsing vertically;
- live mode follows the actual current time;
- moving away from live pins the selected time (browse mode); clock ticks do not pull it back;
- a clear `Nu` affordance returns to live mode;
- `Primetime` is the explicit shortcut to the evening/prime-time reference point. Between midnight and 05:59 this may refer back to the preceding evening's primetime because that is still the active television day;
- each channel shows the programme airing at the reference instant plus **three following programmes**;
- the current/reference programme is visually dominant; the three following programmes use lower typographic weight/contrast;
- for a programme currently airing, show the useful end-time context (`tot …`) rather than redundantly repeating both start and end;
- following programmes show their start times; their end times are unnecessary;
- no progress bars in this view: the shared time context and hierarchy are sufficient and removing bars improves scanning;
- no genre labels, artwork, chevrons, `Daarna` labels or card-heavy treatment;
- keep channel order and vertical position stable when the reference time changes;
- schedule semantics are `startAt <= referenceTime < endAt`;
- at gaps, show an honest no-schedule state rather than pretending the last programme is still current;
- the selector is bounded to the active television day, while following programmes may naturally cross its 06:00 boundary.

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

## Tonight / Vanavond — provisional visual direction
This surface is intentionally less frozen than Guide and Programme Detail.

Purpose: help the user choose what to watch tonight. It may be more image-led than Guide but must not become an endless content feed or streaming catalogue.

Current direction:
- title and date;
- compact time choices such as `Nu · 20:30 · 21:00 · 22:00`;
- one visually stronger highlighted programme;
- a restrained `Verder vanavond` selection;
- optional useful television groupings such as Films, Series and Sport;
- channel and start time remain immediately visible;
- no news/article feed;
- artwork is progressive enrichment and the screen must degrade gracefully without it.

Do not treat the exact Tonight module composition as frozen yet.

## Search
One prominent search field. MVP search targets programmes and channels, prioritising useful upcoming broadcasts and answering when/where something airs.

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

## Phase 4 television-day acceptance
The Core Guide MVP is not complete until physical validation confirms at least:
- opening around 19:00 lands around `Nu` while the same television day remains navigable backward;
- a user can browse continuously from evening through midnight into the early morning;
- opening at 00:05 still uses the preceding television-day context;
- 05:59 remains in the preceding television day and 06:00 enters the new television day;
- Totaal and Per zender can navigate D-2, D-1, D and D+1..D+7;
- `Nu` correctly restores the actual instant from any selected historical/future day;
- Programme Detail opens/returns correctly for historical and future broadcasts;
- refresh/day rollover preserves meaningful channel/time/date context;
- 23-hour and 25-hour DST cases remain correct.

## Visual/interaction principle
Teevee should achieve **more utility with less interface**. Avoid card stacking, gratuitous separators, repeated metadata, decorative controls and UI that exists only because other media apps contain it.

## Validation status
The decisions above marked accepted are owner-approved UX baselines from the visual-design process. They are not claims that every item is already implemented. Implementation should be checked against the repository and validated on representative iOS and Android devices before being considered technically complete.