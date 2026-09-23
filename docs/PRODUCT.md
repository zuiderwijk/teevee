# Teevee Product

Status: product baseline, amended with owner-approved television-day, Guide-horizon, compact Guide day-selector semantics and Per-zender Primetime shortcut on 15 September 2026, and owner-approved Instrument Sans UI typography on 17 September 2026. These decisions do not claim that the current runtime already implements them.

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
8. **Television time, not calendar bureaucracy.** The Guide follows viewing behaviour across midnight rather than forcing a calendar-day break.

## MVP scope
### Included
- complete Dutch TV guide for supported channels;
- Totaal: touch-native timeline with horizontal time navigation and vertical channel navigation;
- Per zender: one-channel vertical schedule with sticky channel-logo navigation, horizontal swipe to adjacent channels and a direct Primetime shortcut;
- Nu & Straks: one active television-day shared time reference across channels, showing the programme at that reference instant plus the next three programmes;
- Now indicator and jump-to-Now action;
- compact television-day selection in Totaal and Per zender; no independent date selector in Nu & Straks;
- minimum Guide horizon of **D-2 through D+7 television days** in Totaal and Per zender;
- television day defined as **06:00 Europe/Amsterdam through 06:00 the following calendar day**;
- seamless evening browsing through midnight without an explicit day switch;
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
- **Tonight / Vanavond** — finite decision-support for the active television evening, rooted in concrete linear-TV broadcasts. Product contract: `docs/TONIGHT_PRODUCT_DEFINITION.md`; accepted production visual/specification: `design/current/TONIGHT.md` + `docs/TONIGHT_VISUAL_CONVERGENCE.md`.
- **Search** — direct programme-broadcast/channel retrieval answering when and where something is on television. Phase 5A canonical contract: `docs/SEARCH_PRODUCT_DEFINITION.md`.

The working primary navigation baseline is Guide / Tonight / Search. Saved programmes/reminders do not require a permanent primary tab unless testing demonstrates a clear need.

## Next channel expansion target and default order

Owner decision, 24 September 2026. The next dedicated channel-expansion iteration targets **49 channels** and fixes their first-run/default order. This supersedes the earlier provisional 30-channel ordering from 23 September 2026.

1. NPO 1
2. NPO 2
3. NPO 3
4. RTL 4
5. RTL 5
6. SBS6
7. RTL 7
8. Veronica
9. Net5
10. RTL 8
11. STAR Channel
12. SBS9
13. Paramount Network
14. Ziggo Sport
15. Ziggo Sport 2
16. Ziggo Sport 3
17. Ziggo Sport 4
18. Ziggo Sport 5
19. Ziggo Sport 6
20. ESPN
21. ESPN 2
22. ESPN 3
23. ESPN 4
24. Viaplay TV
25. RTL Z
26. TLC
27. Comedy Central
28. 24Kitchen
29. Eurosport 1
30. Eurosport 2
31. Discovery
32. National Geographic
33. History
34. BBC NL
35. BBC One
36. BBC Two
37. VRT 1
38. VRT Canvas
39. VTM
40. Play
41. Play Fictie
42. VTM2
43. VTM3
44. VTM4
45. Play Actie
46. Play Reality
47. Play Crime
48. VTM Gold
49. Ketnet

A persisted user-defined order overrides this default. All Guide presentations must consume the same canonical default order; provider channel numbers and raw feed ordering are not product semantics.

The source/mapping evidence, known alias/rename caveats and later implementation boundary are canonical in `docs/CHANNEL_EXPANSION_TARGET_2026-09-24.md`. In particular, STAR Channel and BBC NL still require explicit provider-identity verification, while the Belgian Play family is available under legacy provider names Play4/5/6/7.

This is a queued product target, not a claim that the current 12-channel development runtime already implements the expanded catalog.

## Guide day and horizon
Teevee uses a television-day model because television evenings routinely continue after midnight.

- The television day starts at **06:00 Europe/Amsterdam** and ends at 06:00 the next calendar day.
- Between 00:00 and 05:59, `Nu` still belongs to the preceding television day.
- Midnight never requires the user to switch dates simply to see what follows later that night.
- Let `D` be the current television day. Totaal and Per zender must expose at least D-2, D-1, D and D+1 through D+7.
- Users see ordinary dates/relative labels; `television day` is an internal product concept.
- `Nu` always restores the actual current instant and the television-day context containing that instant.

### Accepted compact day-selection model
Totaal and Per zender use one shared compact day selector:
- one primarily typographic date label rather than ten permanent day buttons;
- tapping opens a bounded chronological list of the available D-2..D+7 television days;
- no unrestricted calendar or out-of-range disabled dates;
- `Nu` remains a separate action;
- selecting another day preserves the viewed wall-clock time where practical;
- `Nu` restores both the actual current time and its television-day context;
- essential date/time context remains available during vertical Guide browsing while non-functional header chrome may condense;
- the exact state/sticky behaviour is defined canonically in `design/current/guide/GUIDE_DAY_SELECTOR.md` and `docs/UX.md`.

Per zender adds one further sibling utility beside this shared day selector: `Primetime`. It is not a second date-navigation model and does not change the selected television day.

## Guide presentations — accepted UX baseline
### Totaal
Multi-channel time grid. Horizontal movement navigates time; vertical movement navigates channels. Time and channel context remain understandable while moving through the grid. The visual direction prioritises open schedule geometry over card stacking.

The timeline may run continuously through midnight and across the 06:00 grouping boundary; date context updates without fabricating or shifting programme times. The accepted shared day selector provides direct D-2..D+7 navigation without adding a competing horizontal date rail.

### Per zender
One channel's scrollable television-day schedule, initially around the current programme. Channel navigation is primary and date navigation secondary.

Accepted interaction direction:
- horizontal channel-logo strip remains available while scrolling;
- tap a logo to select that channel;
- horizontal swipe across the schedule moves to previous/next channel;
- changing channel preserves the viewed time anchor where practical;
- channel logo is the visible selected-channel identity; channel name remains available through accessibility semantics and the missing-logo fallback, not as separate selected-channel text outside the rail;
- programme list prioritises time + title and avoids low-value genre/artwork clutter;
- D-2 through D+7 television-day navigation uses the accepted shared compact day selector;
- `Primetime` is a direct fast-navigation shortcut to **20:30 Europe/Amsterdam on the currently selected television day**;
- `Primetime` never switches the selected day: after choosing a historical/future day, it goes to 20:30 on that day;
- between 00:00 and 05:59 it can therefore jump back to 20:30 on the preceding television-day evening;
- `Nu` remains distinct from Primetime and restores the actual current instant plus its television-day context;
- during vertical schedule browsing, the sticky channel strip plus one compact date/Primetime/Nu temporal context preserve orientation; no selected-channel text is injected outside the rail;
- the older expanded time picker (`Vanmiddag`, `Vooravond`, `Kies tijd…`) is not part of the accepted MVP interaction.

### Nu & Straks
Compact channel list around one common reference time within the active television day.

Accepted interaction direction:
- no independent date selector;
- horizontal time selector moves the shared reference time through the active television day;
- `Nu` restores the actual current time;
- before 06:00, active-day context remains the preceding evening/date;
- `Primetime` provides a direct television-specific jump to the key evening block and may therefore refer to the preceding evening after midnight until 06:00;
- each channel shows the programme airing at the reference instant plus **three following programmes**;
- live/current mode uses concise end-time context; future/past reference mode must not look live;
- no progress bars, genres, artwork, chevrons or repeated `Daarna` labels in this view;
- channel order and vertical position stay stable while the reference time changes.

These decisions supersede the earlier strict calendar-day interpretation of Nu & Straks.

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
- **Instrument Sans is the accepted primary UI typeface across Teevee**; use one coherent UI family rather than pairing it with a second sans-serif by default;
- substantive content must scale for accessibility even if that reduces density.

Exact production design tokens, Instrument Sans font-file selection/licensing verification and platform delivery remain implementation details, not product promises.

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
- **Instrument Sans as the primary Teevee UI typeface**;
- three Guide presentations and their interaction roles as described above;
- television day = 06:00 Europe/Amsterdam to 06:00 next day;
- Totaal/Per zender minimum horizon = D-2 through D+7 television days;
- compact shared Guide day selector for Totaal/Per zender, with bounded D-2..D+7 bottom sheet and separate `Nu` action;
- changing day preserves viewed wall-clock time where practical;
- Per zender direct `Primetime` shortcut = 20:30 on the selected television day, without changing that selected day;
- essential date/time context remains sticky while non-functional Guide header chrome may condense;
- midnight does not split the evening Guide context;
- Nu & Straks: active television day, reference programme + three following programmes;
- Programme Detail direct-open hierarchy and current two-action scope.
- Vanavond product role, first module hierarchy, active-evening time semantics and Jouw gids / Voor jou distinction as defined in `docs/TONIGHT_PRODUCT_DEFINITION.md`; Film/Series/Sport remain individually gated by empirical classification research.

### Open
- final product/brand name;
- exact production design-token values and Instrument Sans font-file/licensing/delivery details;
- initial default Guide presentation and long-term preference/restoration details where not yet proven;
- pricing and trial/paywall model;
- final production backend/data supplier;
- metadata enrichment source;
- empirical Film/Series/Sport classification quality and resulting Vanavond module enablement;
- future `Voor jou` recommendation/personalisation contract.
