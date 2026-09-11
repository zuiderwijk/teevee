# Teevee Product

Status: Phase 0 baseline

## Product vision
Teevee is a new premium, ad-free television guide for iOS and Android, developed under supervision of Bindinc/TVgids.nl. It is a new product rather than a redesign of the existing TVgids.nl app.

## Product promise
**The fastest, calmest and most pleasant way to see what is on television now and next — without advertising or noise.**

The primary user question is: **What is on my television now and later?**

## Audience
Dutch television viewers who want a high-quality guide experience. The MVP targets the Netherlands first. Precise commercial segmentation is not required to build the core product.

## Product principles
1. **Guide first.** The EPG is the product and must be immediately accessible.
2. **Speed is a feature.** Opening, scrolling, changing day and returning to Now must feel immediate.
3. **Calm over engagement.** No ads, clickbait, infinite feeds or commercial modules.
4. **Personal without complexity.** Channel ordering, saved programmes and reminders enhance the guide but are not prerequisites.
5. **Premium execution, not feature bloat.** Polish, performance and clarity matter more than feature count.
6. **No mandatory account for core use.** Identity must not block the guide.
7. **Data-provider independence.** The user experience is not coupled to a specific EPG supplier.

## MVP scope
### Included
- complete Dutch TV guide for supported channels;
- touch-native timeline with horizontal time navigation and vertical channel navigation;
- Now indicator and jump-to-Now action;
- day selection;
- programme detail;
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
- **Guide** — default destination and core timeline.
- **Tonight** — optional discovery presentation of the same programme domain, not an editorial news feed. Its exact role remains subject to validation.
- **Search** — direct programme/channel retrieval answering when something is on television.

The working navigation baseline is three primary destinations: Guide, Tonight and Search. Saved programmes/reminders do not require a permanent primary tab unless testing demonstrates a clear need.

## Programme detail
At minimum: title, channel, date/time, duration and available description. Optional enrichment may include artwork, season/episode, genre, year and cast. Primary actions are Save and Remind me.

## Onboarding
Maximum three functional steps: welcome, choose/reorder channels, done. No account wall.

## Monetisation
Teevee is intended to become a paid, ad-free app. Exact pricing, trial model and paywall timing are not frozen in Phase 0.

## Success hierarchy
1. Guide usability and perceived speed.
2. Reliability and schedule correctness.
3. Retention/value perception sufficient for a paid product.
4. Discovery and personal features.

The Phase 1 gate is qualitative and strict: **does the guide itself demonstrably feel better than the current conventional TV-guide experience?** If not, do not add scope; improve the guide.

## Frozen vs open
### Frozen
- iOS and Android;
- Netherlands first;
- paid and ad-free positioning;
- guide-first product;
- no mandatory account for core use;
- light and dark appearance;
- provider-independent programme-data architecture;
- autonomous-agent development model.

### Open
- final product/brand name;
- exact visual design;
- exact navigation interaction details;
- pricing and trial/paywall model;
- final production backend/data supplier;
- metadata enrichment source;
- final role of Tonight.
