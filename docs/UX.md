# Teevee UX and Information Architecture

Status: Phase 0 baseline, amended with owner guide-view and accessibility requirements on 13 September 2026. Interaction principles are stronger constraints than the current visual references. Only Totaal is implemented so far.

## Experience objective
Teevee should feel like a purpose-built mobile instrument for television schedules, not a desktop EPG compressed onto a phone and not a content portal with a guide attached.

## Information architecture
Working primary navigation:
- Guide
- Tonight
- Search

Settings/profile is secondary navigation. Saved programmes and reminders are reachable contextually from Guide/Tonight and through the secondary area. This remains revisable if usability evidence shows that saved content deserves primary navigation.

## Guide
The Guide is the default surface and the most important interaction in the product. It is not synonymous with the Totaal grid. The owner has requested Totaal, Per zender and Nu & Straks as different presentations of the same programme domain.

### View preference and context — working proposal
Keep the presentations within Guide rather than creating three primary tabs. Remember the chosen presentation locally. Retain shared channel choices/order and programme detail, while respecting that a time reference is not the same as a view-specific pixel offset. Returning from details must preserve the originating view, selected time/channel and scroll position.

Remembering a view preference must not make an old selected time look live on a later visit. Exact cross-view/session restoration, the initial default, selector placement and one versus two following programmes need the subsequent build specification. Do not treat preference stability or popularity as established user research.

### Shared channel identity
Across Guide presentations, the target treatment is **logo first, channel name second** when a licensed, readable logo is available. The name remains visible in a smaller/subtler form or otherwise directly available because not every channel mark can be assumed recognisable.

The full channel name must always be available to screen readers. If logo artwork is unavailable, delayed, illegible or not licensed, fall back cleanly to the channel name. Schedule use may never depend on artwork availability. The current text-only synthetic channel column is prototype scaffolding rather than the final visual treatment.

### Totaal — existing interaction model
- vertical gesture: move through channels;
- horizontal gesture: move through time;
- tap programme: open programme detail;
- Now action: return to current date/time;
- date control: navigate to a guide day within the continuous timeline;
- current programmes show progress;
- current time is represented by a clear timeline marker;
- channel identity remains understandable while moving through time;
- time context remains understandable while moving through channels.

The accepted platform-standard inertia, bounce, day transitions and detail interactions remain unchanged by this documentation amendment.

### Totaal layout principle
This presentation should behave as a two-dimensional schedule surface with a sticky/fixed channel identity region and time axis where appropriate. It must not be implemented as a naive nested collection that becomes unstable under realistic schedule volume. These grid-specific rules are not layout requirements for every other Guide view.

At larger platform text sizes, Totaal may increase row height, reflow labels and reduce secondary metadata density. It must not preserve default density by clipping essential channel/programme identity or disabling text scaling. Programme detail remains the reliable place for the full readable title and metadata when a compact cell cannot contain everything.

### Per zender — requested, not yet implemented
A vertical list shows one channel's schedule for the selected day, initially positioned at the current programme. Earlier and later programmes remain reachable by scrolling. Channel navigation is primary; date selection is secondary. A channel picker must make distant channels directly reachable, not require repeated swiping through the entire lineup.

Working proposal: preserve the viewed time when changing channel, and use the shared programme-detail behaviour without losing list position. The full day is scrollable content, not a requirement to fit every programme on one physical screen.

### Nu & Straks — today-only time selector
Owner correction of 13 September 2026: **there is no date selector in Nu & Straks**. Show a horizontal time selector for today. Moving it changes the reference time for all channel cards, not the channel selection and not the chosen day. The provided screenshot is an interaction reference only; its date dropdown is explicitly not part of the requested Teevee view.

At each reference time, each channel displays the programme airing at that instant, followed by its next scheduled programme(s). The number of following programmes is still open (initial proposal: one). Programme lengths do not become horizontally stretched grid cells: this remains a compact channel list, unlike Totaal.

Implementation rules derived from this requirement, to validate in the later prototype:
- **Live mode:** on initial entry use the actual current time; programme selection/progress may follow the clock. The Nu action returns to this mode.
- **Browse mode:** moving the selector pins a chosen time today. Display that time prominently, for example "Vandaag 20:30". Clock ticks must not pull the selection back to now. Schedule corrections may still refresh the underlying data at the pinned time.
- Keep the time selector visible while vertically browsing channels. All visible channel cards must correspond to the same reference time; update while selecting, without a screen reload or reset to the first channel.
- Keep channel order and vertical reading position stable as programmes change. Do not re-sort channels by the next programme's start time.
- Use "Op dat moment" / "Daarna" or equivalent clear labels for a non-live reference. Do not use "nu live", a real-time countdown or a live-looking progress indicator for a future/past snapshot. Actual broadcast start/end times remain visible.
- Use schedule interval semantics `startAt <= referenceTime < endAt`. At an exact programme boundary show the programme that starts, not the one that has just ended. This is not a list of only programmes starting after the selected time.
- During a schedule gap show "Geen uitzending bekend op dit tijdstip" or an equivalent honest state, with the next known start time. Do not display the last ended programme as current or invent a start time.
- Bound time selection to the current Amsterdam calendar day, not a fixed assumption of 24 elapsed hours. Moving past the end does not navigate into tomorrow. A relevant next programme may start after midnight and must then show its day; the selector itself remains today-only.
- On resume/day rollover, an old pinned selection must not silently be labelled today. The lifecycle implementation must explicitly rebase to the new day's live mode and make the selected time clear.
- Provide an accessible alternative to dragging, such as adjustable time steps or a time picker, and expose the chosen time to assistive technology. The exact control treatment is not frozen.

A worked, fictional example: at 20:30 channel A may still show a programme that began at 20:00, followed by one at 21:00. Channel B may show a programme from 20:25, followed by one at 20:55. The selector changes the common reference instant; channels do not all acquire identical start times.

This means Nu & Straks supports both choosing something immediately and comparing what is on later today, without becoming a multi-day planner. Totaal and Per zender retain date navigation. No production data or programme rights are implied by the illustrative example.

### Guide performance UX
- initial useful content appears quickly;
- gestures remain responsive while programme cells render;
- jumping to Now is immediate;
- programme widths accurately represent duration in Totaal within practical display constraints;
- no unexpected scroll jumps after data refresh;
- schedule updates preserve user context where possible.

### States
Guide must define: loading, partial/stale cached data, offline cached data, empty channel, provider/data error and no schedule available. A selected time with missing data must not look like a valid live answer.

## Tonight
Tonight is an alternative discovery presentation of programme data, not a news feed. It may be more visual than Guide and may use optional artwork/enrichment.

Potential groupings include Now, prime time, films, series, sport and later tonight. These are hypotheses, not frozen modules. The screen must degrade gracefully when enrichment or artwork is unavailable.

## Programme detail
Required hierarchy:
1. title;
2. channel and broadcast time;
3. duration/status;
4. available description;
5. Save and Remind actions;
6. optional metadata/enrichment.

A missing image must never make the page feel broken. Programme detail must remain fully reachable at larger system text sizes; if content exceeds the viewport, the content must scroll independently without breaking swipe-to-dismiss semantics.

## Search
One prominent search field. Search targets programmes and channels in the MVP. The core programme answer is when/where the programme airs. Results should prioritise upcoming broadcasts.

## Channel management
Users can choose and reorder channels. A sensible default lineup is provided so onboarding can be skipped or completed quickly. Channel choices persist locally.

## Onboarding
At most three functional steps:
1. welcome/value proposition;
2. choose or confirm channels;
3. enter Guide.

Subscription onboarding/paywall behaviour is intentionally not frozen yet.

## Accessibility
Accessibility is a core quality requirement, not a later specialist mode. The product owner specifically calls out users who increase system font size above 100%; Teevee must remain usable under that real-world setting. A possible older linear-TV audience is motivation to test this well, not an assumed demographic fact.

- respect platform text scaling rather than forcing fixed visual sizes;
- test representative larger Dynamic Type / font-scale settings on physical devices;
- adapt row heights, wrapping and information density where necessary instead of clipping essential content;
- accessible programme and channel labels, including the full textual channel name when a logo is shown;
- adequate touch targets that remain usable when text grows;
- do not encode programme state using colour alone;
- support screen-reader navigation with meaningful programme summaries and time context;
- maintain contrast in light and dark themes;
- respect reduced-motion preferences where animation is non-essential;
- ensure programme detail and long descriptions remain reachable and scrollable at larger text sizes;
- treat default-density screenshots as one layout mode, not as a layout that must be preserved at all accessibility sizes.

## Visual direction
Existing light and dark concept visuals are registered as **Visual Direction 01 — reference, not specification**.

Useful qualities to preserve during exploration:
- clean and modern;
- strong hierarchy;
- restrained chrome;
- premium typography;
- functional guide density;
- richer imagery away from the core timeline.

No exact colour, typography, spacing, component or navigation treatment from those concepts is frozen.

## UX validation gate
Phase 1 exists to validate the Guide interaction before building broad product scope. Evaluation should use realistic channel counts, programme durations and schedule density, not a hand-picked presentation dataset. Recording the new views is not acceptance of their implementation and does not close outstanding Phase 1 checks. Before the Guide layout is frozen, representative larger system text must be included in device validation.
