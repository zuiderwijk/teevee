# Teevee UX and Information Architecture

Status: Phase 0 baseline. Interaction principles are stronger constraints than the current visual references.

## Experience objective
Teevee should feel like a purpose-built mobile instrument for television schedules, not a desktop EPG compressed onto a phone and not a content portal with a guide attached.

## Information architecture
Working primary navigation:
- Guide
- Tonight
- Search

Settings/profile is secondary navigation. Saved programmes and reminders are reachable contextually from Guide/Tonight and through the secondary area. This remains revisable if usability evidence shows that saved content deserves primary navigation.

## Guide
The Guide is the default surface and the most important interaction in the product.

### Interaction model
- vertical gesture: move through channels;
- horizontal gesture: move through time;
- tap programme: open programme detail;
- Now action: return to current date/time;
- date control: switch guide day;
- current programmes show progress;
- current time is represented by a clear timeline marker;
- channel identity remains understandable while moving through time;
- time context remains understandable while moving through channels.

### Layout principle
The implementation should behave as a two-dimensional schedule surface with a sticky/fixed channel identity region and time axis where appropriate. It must not be implemented as a naive nested collection that becomes unstable under realistic schedule volume.

### Guide performance UX
- initial useful content appears quickly;
- gestures remain responsive while programme cells render;
- jumping to Now is immediate;
- programme widths accurately represent duration within practical display constraints;
- no unexpected scroll jumps after data refresh;
- schedule updates preserve user context where possible.

### States
Guide must define: loading, partial/stale cached data, offline cached data, empty channel, provider/data error and no schedule available.

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

A missing image must never make the page feel broken.

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
- respect platform text scaling within practical schedule constraints;
- accessible programme and channel labels;
- adequate touch targets;
- do not encode programme state using colour alone;
- support screen-reader navigation with meaningful programme summaries;
- maintain contrast in light and dark themes;
- respect reduced-motion preferences where animation is non-essential.

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
Phase 1 exists to validate the Guide interaction before building broad product scope. Evaluation should use realistic channel counts, programme durations and schedule density, not a hand-picked presentation dataset.
