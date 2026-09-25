# 49-channel implementation evidence — 2026-09-24

Status: **RECONCILED ON MERGED #173 BASELINE — DRAFT PR #176 — NOT YET PRODUCTION-ACTIVATED**

Owning issue: #175  
Dependency: issue #170 / PR #173 — **SATISFIED; merged as `a23c5a434f237859b06112217433a12955cfa725`**  
Target contract: `docs/CHANNEL_EXPANSION_TARGET_2026-09-24.md`

## Architecture

PR #176 is reconciled onto canonical `main` after PR #173 merged. The 49-channel delta therefore exercises the canonical `knownChannelIds` / `selectedChannelIds` reconciliation contract without carrying or reverting any pre-merge drag/runtime implementation. The expansion does not change the personalisation contract.

The canonical catalogue contains exactly 49 provider-independent Teevee IDs in the owner-approved order. Provider vocabulary is split explicitly across the Netherlands and Belgian XMLTV sources:

- NL source: 36 canonical channels;
- BE source: 13 canonical channels;
- no canonical channel is owned by more than one refresh source;
- the bounded group size is 12 provider channels per work item, producing 5 jobs per television day / 60 jobs per D-3..D+8 run;
- hosted source-specific capacity for group size 12 is now measured PASS for all NL/BE groups on one complete Amsterdam television day; see `docs/CHANNEL_EXPANSION_CAPACITY_SMOKE_2026-09-25.md`. This closes only the capacity gate and does not activate production topology.

Existing canonical identity is preserved where it already shipped. In particular `nl-veronica-disney-xd` remains the canonical ID while the user-facing name becomes Veronica.

Provider legacy/rebrand vocabulary remains adapter-only:
- `FOX.nl` -> STAR Channel;
- `BBCFirst.nl` -> BBC NL;
- `VeronicaDisneyXD.nl` -> Veronica;
- `Play4.be` / `Play5.be` / `Play6.be` / `Play7.be` -> Play / Play Fictie / Play Actie / Play Reality.

## Exact mapping and local logo ownership

| # | Canonical ID | Display name | Source | Provider ID | Local mark |
| ---: | --- | --- | :---: | --- | --- |
| 1 | `nl-npo-1` | NPO 1 | NL | `NPO1.nl` | PNG → `nl-npo-1` |
| 2 | `nl-npo-2` | NPO 2 | NL | `NPO2.nl` | PNG → `nl-npo-2` |
| 3 | `nl-npo-3` | NPO 3 | NL | `NPO3.nl` | PNG → `nl-npo-3` |
| 4 | `nl-rtl-4` | RTL 4 | NL | `RTL4.nl` | PNG → `nl-rtl-4` |
| 5 | `nl-rtl-5` | RTL 5 | NL | `RTL5.nl` | PNG → `nl-rtl-5` |
| 6 | `nl-sbs-6` | SBS6 | NL | `SBS6.nl` | PNG → `nl-sbs-6` |
| 7 | `nl-rtl-7` | RTL 7 | NL | `RTL7.nl` | PNG → `nl-rtl-7` |
| 8 | `nl-veronica-disney-xd` | Veronica | NL | `VeronicaDisneyXD.nl` | PNG → `nl-veronica-disney-xd` |
| 9 | `nl-net-5` | Net5 | NL | `Net5.nl` | PNG → `nl-net-5` |
| 10 | `nl-rtl-8` | RTL 8 | NL | `RTL8.nl` | PNG → `nl-rtl-8` |
| 11 | `nl-star-channel` | STAR Channel | NL | `FOX.nl` | PNG → `nl-star-channel` |
| 12 | `nl-sbs-9` | SBS9 | NL | `SBS9.nl` | PNG → `nl-sbs-9` |
| 13 | `nl-paramount-network` | Paramount Network | NL | `ParamountNetwork.nl` | PNG → `nl-paramount-network` |
| 14 | `nl-ziggo-sport` | Ziggo Sport | NL | `ZiggoSport.nl` | PNG → `nl-ziggo-sport` |
| 15 | `nl-ziggo-sport-2` | Ziggo Sport 2 | NL | `ZiggoSport2.nl` | PNG → `nl-ziggo-sport-2` |
| 16 | `nl-ziggo-sport-3` | Ziggo Sport 3 | NL | `ZiggoSport3.nl` | PNG → `nl-ziggo-sport-3` |
| 17 | `nl-ziggo-sport-4` | Ziggo Sport 4 | NL | `ZiggoSport4.nl` | PNG → `nl-ziggo-sport-4` |
| 18 | `nl-ziggo-sport-5` | Ziggo Sport 5 | NL | `ZiggoSport5.nl` | PNG → `nl-ziggo-sport-5` |
| 19 | `nl-ziggo-sport-6` | Ziggo Sport 6 | NL | `ZiggoSport6.nl` | PNG → `nl-ziggo-sport-6` |
| 20 | `nl-espn` | ESPN | NL | `ESPN.nl` | PNG → `nl-espn` |
| 21 | `nl-espn-2` | ESPN 2 | NL | `ESPN2.nl` | PNG → `nl-espn-2` |
| 22 | `nl-espn-3` | ESPN 3 | NL | `ESPN3.nl` | PNG → `nl-espn-3` |
| 23 | `nl-espn-4` | ESPN 4 | NL | `ESPN4.nl` | PNG → `nl-espn-4` |
| 24 | `nl-viaplay-tv` | Viaplay TV | NL | `ViaplayTV.nl` | PNG → `nl-viaplay-tv` |
| 25 | `nl-rtl-z` | RTL Z | NL | `RTLZ.nl` | PNG → `nl-rtl-z` |
| 26 | `nl-tlc` | TLC | NL | `TLC.nl` | PNG → `nl-tlc` |
| 27 | `nl-comedy-central` | Comedy Central | NL | `ComedyCentral.nl` | PNG → `nl-comedy-central` |
| 28 | `nl-24kitchen` | 24Kitchen | NL | `24Kitchen.nl` | PNG → `nl-24kitchen` |
| 29 | `nl-eurosport-1` | Eurosport 1 | NL | `Eurosport1.nl` | PNG → `nl-eurosport-1` |
| 30 | `nl-eurosport-2` | Eurosport 2 | NL | `Eurosport2.nl` | PNG → `nl-eurosport-2` |
| 31 | `nl-discovery` | Discovery | NL | `Discovery.nl` | PNG → `nl-discovery` |
| 32 | `nl-national-geographic` | National Geographic | NL | `NationalGeographicChannel.nl` | PNG → `nl-national-geographic` |
| 33 | `nl-history` | History | NL | `History.nl` | PNG → `nl-history` |
| 34 | `nl-bbc-nl` | BBC NL | NL | `BBCFirst.nl` | PNG → `nl-bbc-nl` |
| 35 | `nl-bbc-one` | BBC One | NL | `BBCOne.nl` | PNG → `nl-bbc-one` |
| 36 | `nl-bbc-two` | BBC Two | NL | `BBCTwo.nl` | PNG → `nl-bbc-two` |
| 37 | `be-vrt-1` | VRT 1 | BE | `VRT1.be` | PNG → `be-vrt-1` |
| 38 | `be-vrt-canvas` | VRT Canvas | BE | `VRTCANVAS.be` | PNG → `be-vrt-canvas` |
| 39 | `be-vtm` | VTM | BE | `vtm.be` | PNG → `be-vtm` |
| 40 | `be-play` | Play | BE | `Play4.be` | PNG → `be-play` |
| 41 | `be-play-fictie` | Play Fictie | BE | `Play5.be` | PNG → `be-play-fictie` |
| 42 | `be-vtm-2` | VTM2 | BE | `VTM2.be` | PNG → `be-vtm-2` |
| 43 | `be-vtm-3` | VTM3 | BE | `VTM3.be` | PNG → `be-vtm-3` |
| 44 | `be-vtm-4` | VTM4 | BE | `VTM4.be` | PNG → `be-vtm-4` |
| 45 | `be-play-actie` | Play Actie | BE | `Play6.be` | PNG → `be-play-actie` |
| 46 | `be-play-reality` | Play Reality | BE | `Play7.be` | PNG → `be-play-reality` |
| 47 | `be-play-crime` | Play Crime | BE | `PlayCrime.be` | PNG → `be-play-crime` |
| 48 | `be-vtm-gold` | VTM Gold | BE | `VTMGOLD.be` | PNG → `be-vtm-gold` |
| 49 | `be-ketnet` | Ketnet | BE | `Ketnet.be` | PNG → `be-ketnet` |

## Personalisation migration

The expansion does not introduce a preference migration version.

- no stored personalisation -> the 49-channel canonical default is used directly;
- a stored 12-channel preference retains the user's existing selected relative order;
- previously known hidden channels remain hidden;
- the 37 genuinely new canonical IDs append as visible in canonical order;
- removed/unknown IDs keep the existing fail-safe reconciliation semantics.

This is covered by deterministic domain tests on PR #176.

## Logo implementation

The final runtime is raster-only:

- all 49 canonical IDs resolve to canonical-ID-keyed local base PNG files, with 17 owner-identified dark-contrast failures resolving to central broadcaster-specific dark-background variants;
- `channelLogoAssetManifest.ts` and `channelLogoRegistry.ts` are the only asset-resolution layer;
- `ChannelIdentity` remains the shared renderer;
- `assets/channels/SHA256SUMS` locks the final bytes;
- CI checks exact coverage, unique hashes, PNG validity and minimum intrinsic density;
- no runtime hotlink, runtime tint/recolour, per-screen require map or provider-specific logo dictionary is introduced;
- the earlier SVG-string/vector files, `react-native-svg`, one-shot ingest script/source manifest and write-enabled asset-generation workflows were intermediate development tooling and are removed before review.

Provenance and byte hashes for all 49 base PNGs plus 17 dark variants are recorded directly in `docs/CHANNEL_LOGO_ASSETS.md`. Physical dark/system re-acceptance remains required; automated byte integrity is not a visual PASS. The dark alternates come from a pinned curated dark-background logo source and are copied byte-for-byte; they are not generated or recoloured by Teevee.

## Required physical iPhone validation

Physical testing is an acceptance gate, not a substitute for automated checks. Use the final reconciled exact head.

### Mijn zenders
- fresh install/no preference: exactly 49 visible in canonical order;
- existing 12-channel preference: preserved relative order/hidden choices and 37 new channels appended visible in canonical order;
- scroll the full 49-row surface without visible jank;
- hide/show and verify the hidden zone remains canonical/default ordered;
- reorder upward and downward, including first/last legal positions;
- top/bottom drag auto-scroll and hidden-zone clamp;
- management-local Search while both zones contain results;
- immediate vertical scroll after changed drop, no-op release and interrupted/cancelled drag;
- restart and verify persistence;
- Larger Text;
- light, dark and system appearance.

### Guide
- Per zender exposes all 49 identities in owner order;
- Nu & Straks and Totaal use the same selected-order projection;
- channel switching remains stable across newly added NL and BE identities;
- a hidden channel is absent from Guide projection without mutating canonical data;
- no missing, wrong, obviously cropped or boxed mark in accepted identity bounds;
- explicitly inspect Ziggo Sport 2–6 in dark mode, Play Fictie/Actie/Reality/Crime in light mode, Net5's opaque source canvas, STAR Channel, BBC NL, VRT/VTM/Play families and Ketnet.

### Search
- newly added channel is searchable;
- hidden channel remains searchable and opens contextually without persistence mutation;
- explicit add appends the hidden channel to Mijn zenders;
- current and historical/rebrand aliases resolve to the intended canonical channel;
- no duplicate source identity is presented.

## Production activation gates

Before activating the 49-channel hosted refresh:
1. PR #173 physical/QA/merge dependency is satisfied by merge `a23c5a434f237859b06112217433a12955cfa725`;
2. PR #176 is reconciled onto canonical main while preserving the merged #173 runtime and #174/#172 production-closeout facts;
3. exact-head CI and Independent QA must pass on the reconciled #176 candidate;
4. **capacity gate satisfied:** hosted source-specific smoke establishes group size 12 for every NL/BE group with complete coverage, zero diagnostics and measured CPU/memory headroom; evidence: `docs/CHANNEL_EXPANSION_CAPACITY_SMOKE_2026-09-25.md`;
5. the full 49-channel experience and logo appearance must be physically checked on iPhone in light/dark/system and Larger Text contexts;
6. exact merged Edge/runtime deployment must be followed by a protected horizon proof and the next normal six-hour cron.

Public development-feed presence is not evidence of EPG redistribution rights; that existing release gate is unchanged.

## Non-production 49-channel physical acceptance boundary

PR #176 exposes one explicit development-only transport mode for owner/QA physical acceptance:

```bash
npm run start:physical49
```

This sets `EXPO_PUBLIC_TEEVEE_PHYSICAL_49=1`. The selector is additionally hard-gated by `__DEV__`, so the mode cannot activate in a production bundle.

The mode replaces only the data-provider implementation behind the existing interfaces:

- `GuideScheduleApi` -> deterministic canonical 49-channel schedule client;
- `GuideSearchApi` -> deterministic canonical full-catalog channel-search client.

It does **not** introduce alternate screen/product logic. Requests and responses still run through the same Guide/Search contracts and parsers, and the runtime continues through the same:

- Search session/debounce/navigation;
- canonical channel IDs and aliases;
- ChannelPersonalisationProvider;
- shared Totaal / Per zender / Nu & Straks projection;
- hidden-channel contextual Search navigation;
- explicit `Toevoegen` persistence;
- production Guide/Search renderers.

The deterministic schedule creates bounded one-hour test programmes inside the exact requested client window for each canonical channel. Search derives channel matches from the canonical catalogue after the normal shared request canonicalisation, including the accepted current/rebrand aliases.

This boundary is intentionally **not** a staging production-data substitute. It proves the complete mobile 49-channel identity, personalisation, projection and channel-Search journeys before production topology activation; production XMLTV/provider capacity is proven separately by `docs/CHANNEL_EXPANSION_CAPACITY_SMOKE_2026-09-25.md`.

