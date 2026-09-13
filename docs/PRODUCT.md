# Teevee Product

Status: product baseline, amended with owner-approved Guide and Programme Detail UX direction on 13 September 2026. These decisions do not claim that the current runtime already implements them.

## Product vision
Teevee is a new premium, ad-free television guide for iOS and Android, developed under supervision of Bindinc/TVgids.nl. It is a new product rather than a redesign of the existing TVgids.nl app.

## Product promise
**The fastest, calmest and most pleasant way to see what is on television now and next — without advertising or noise.**

The primary user question is: **What is on my television now and later?**

## Audience
Dutch television viewers who want a high-quality guide experience. The MVP targets the Netherlands first. Precise commercial segmentation is not required to build the core product.

## Product principles
1. **Guide first.** The EPG is the product and must be immediately accessible. Guide-first does not prescribe a single presentation.
2. **Speed is a feature.** Opening, scrolling, changing day and returning to Now must feel immediate.
3. **Calm over engagement.** No ads, clickbait, infinite feeds or commercial modules.
4. **Personal without complexity.** Channel ordering, saved programmes and reminders enhance the guide but are not prerequisites.
5. **Premium execution, not feature bloat.** Polish, performance and clarity matter more than feature count.
6. **No mandatory account for core use.** Identity must not block the guide.
7. **Data-provider independence.** The user experience is not coupled to a specific EPG supplier.

## MVP scope
### Included
- complete Dutch TV guide for supported channels;
- Totaal: touch-native timeline with horizontal time navigation and vertical channel navigation;
- Per zender: one-channel vertical day schedule with sticky channel-logo navigation and horizontal swipe to adjacent channels;
- Nu & Straks: today-only shared time reference across channels, showing the programme at that reference instant plus the next three programmes;
- Now indicator and jump-to-Now action;
- day selection in Totaal and Per zender; no date selector in Nu & Straks;
- direct Programme Detail from Guide;
- search for programmes and channels;
- channel selection, ordering and persistence;
- save/favourite functionality;
- programme reminders using push/local notifications as appropriate;
- light, dark and system appearance;
- local caching and graceful offline fallback;
- paid subscription/paywall and restore purchase before public launch;
- settings;
- privacy-conscious product analytics, crash reporting and operational monitoring.

### Explicitly outside initial MVP
- advertising;
- editorial news feed;
- full streaming catalogue;
- reviews;
- social features;
- AI recommendations;
- mandatory accounts;
- trailers;
- Chromecast/AirPlay;
- universal streaming search;
- engagement mechanics whose primary goal is session length.

## Primary product surfaces
- **Guide** — default destination, with Totaal, Per zender and Nu & Straks.
- **Tonight** — discovery presentation of the same programme domain. It may be more visual than Guide, but its final module composition remains provisional.
- **Search** — direct programme/channel retrieval answering when something is on television.

The working primary navigation baseline is Guide / Tonight / Search. Saved programmes/reminders do not require a permanent primary tab unless testing demonstrates a clear need.

## Guide presentations — accepted UX baseline, 13 September 2026
### Totaal
Multi-channel time grid. Horizontal movement navigates time; vertical movement navigates channels. Time and channel context remain understandable while moving through the grid. The visual direction prioritises open schedule geometry over card stacking.

### Per zender
One channel's scrollable day schedule, initially around the current programme. Channel navigation is primary and date navigation secondary.

Accepted interaction direction:
- horizontal channel-logo strip remains available while scrolling;
- tap a logo to select that channel;
- horizontal swipe across the schedule moves to previous/next channel;
- changing channel preserves the viewed time anchor where practical;
- channel name remains as context while the logo is the primary identifier;
- programme list prioritises time + title and avoids low-value genre/artwork clutter.

### Nu & Straks
Today-only compact channel list around one common reference time.

Accepted interaction direction:
- no date selector;
- horizontal time selector moves the shared reference time through today;
- `Nu` restores the actual current time;
- `Primetime` provides a direct television-specific jump from live mode to the key evening block;
- each channel shows the programme airing at the reference instant plus **three following programmes**;
- live/current mode uses concise end-time context; future/past reference mode must not look live;
- no progress bars, genres, artwork, chevrons or repeated `Daarna` labels in this view;
- channel order and vertical position stay stable while the reference time changes.

These decisions supersede the earlier open question about one versus two following programmes.

## Programme Detail — accepted UX baseline
Tap a Guide programme to open Programme Detail directly; no intermediate preview sheet is required.

Required hierarchy:
1. title;
2. channel and broadcast time;
3. useful current/status context when relevant;
4. `Herinner mij` and `Bewaar` actions;
5. available description;
6. optional secondary metadata/enrichment.

Artwork is optional enrichment and must never be required for a premium-feeling layout.

Current-phase action scope is deliberately limited to `Herinner mij` and `Bewaar`. Share, overflow actions, calendar actions and recommendation feedback are not required now.

For one-handed usability, once the canonical actions scroll out of view a compact sticky bottom copy may appear; it disappears when the original actions return to view. Larger system text may stack those actions rather than shrinking them.

## Visual product direction
The accepted Guide/Detail direction is premium utility rather than decorative media UI:
- restrained chrome;
- channel logo primary;
- open canvas rather than stacked programme cards;
- near-white neutral light canvas and dark-anthracite dark canvas;
- red used sparingly for meaningful selected/current/primary-action emphasis;
- Söhne is the preferred typography direction, subject to production licensing/technical verification;
- substantive content must scale for accessibility even if that reduces density.

Exact production design tokens and platform font delivery remain implementation details, not product promises.

## Onboarding
Maximum three functional steps: welcome, choose/reorder channels, done. No account wall.

## Monetisation
Teevee is intended to become a paid, ad-free app. Exact pricing, trial model and paywall timing are not frozen.

## Success hierarchy
1. Guide usability and perceived speed.
2. Reliability and schedule correctness.
3. Retention/value perception sufficient for a paid product.
4. Discovery and personal features.

The Phase 1 gate is qualitative and strict: **does the guide itself demonstrably feel better than the current conventional TV-guide experience?** If not, do not add scope; improve the guide.

## Frozen vs open
### Frozen / accepted direction
- iOS and Android;
- Netherlands first;
- paid and ad-free positioning;
- guide-first product;
- no mandatory account for core use;
- light, dark and system appearance;
- provider-independent programme-data architecture;
- autonomous-agent development model;
- three Guide presentations and their interaction roles as described above;
- Nu & Straks: reference programme + three following programmes;
- Programme Detail direct-open hierarchy and current two-action scope.

### Open
- final product/brand name;
- exact production design-token values and font licensing/delivery;
- initial default Guide presentation and long-term preference/restoration details where not yet proven;
- pricing and trial/paywall model;
- final production backend/data supplier;
- metadata enrichment source;
- final module composition/role of Tonight.
