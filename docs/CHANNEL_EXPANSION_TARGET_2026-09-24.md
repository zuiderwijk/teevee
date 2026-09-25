# Next channel expansion target — 2026-09-24

Status: **OWNER-APPROVED PRODUCT TARGET — IMPLEMENTATION IN DRAFT PR #176; NOT YET PRODUCTION-ACTIVATED**

This document fixes the channel set and default ordering for the next dedicated Teevee channel-expansion iteration. It is a product decision, not a claim that the current runtime, current development provider mapping or production EPG rights already support every channel.

It supersedes the earlier provisional 30-channel ordering recorded on 23 September 2026.

## Target lineup and default order

The next expansion iteration targets exactly these **49 channels**, in this default order:

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

## Product semantics

- This is the **first-run/default channel order** for the expanded catalog.
- A persisted user-defined channel selection/order remains authoritative once it exists.
- If Teevee later introduces a genuinely new canonical channel, it is automatically added as visible at the **end** of an existing customised Mijn-zenders order. Existing relative order and hidden-channel choices remain unchanged. Multiple new channels append in canonical/default order.
- The expanded catalog is distinct from the user's **Mijn zenders** subset: hidden channels remain supported/searchable, while the selected subset/order drives everyday Guide channel presentation.
- Search remains full-catalog and may explicitly offer to add a hidden channel to Mijn zenders; opening a Search result must not silently alter selection/order. Detailed evidence/contract: `docs/TVGIDS_APP_SEARCH_CHANNEL_EVIDENCE_2026-09-24.md`.
- The order is shared product semantics across Guide surfaces; Totaal, Per zender and Nu & Straks must not invent different default channel rankings.
- Search and other channel-selection surfaces should consume the same canonical channel catalog rather than maintaining a separate ordering table.
- This decision fixes inclusion and order. It does **not** fix provider IDs, feed URLs, logo source, entitlement/package availability or production redistribution rights.
- Do not re-rank this list from raw pageviews or provider channel numbers during implementation without a new owner-level product decision.
- Vanavond category-discovery modules intentionally use a narrower curated subset of this catalog. That scope is canonical in `docs/TONIGHT_PRODUCT_DEFINITION.md`; it does not change the Guide default order or channel availability.

## Source evidence and mapping constraints

Current source research establishes that the target spans more than the current 12-channel development mapping:

- Netherlands feed inventory: `docs/RAW_EPG_CHANNEL_INVENTORY_2026-09-24.md`.
- Belgian target-channel check: `docs/BELGIAN_EPG_TARGET_CHANNEL_CHECK_2026-09-24.md`.

The current development source evidence contains most Dutch/international targets in `epg-nl.xml`, while the complete requested Flemish set is available in `epg-be.xml`.

Implementation must therefore preserve Teevee's provider-independent architecture and use explicit source/channel mappings. Do not infer canonical identity from provider names or channel numbers.

Known mapping caveats that must be resolved before productionizing the expansion:

- **STAR Channel:** the current Netherlands source exposes `FOX.nl` / `FOX`, not a source record named STAR Channel. Verify programme-level continuity/current identity before mapping it to canonical STAR Channel.
- **BBC NL:** no exact `BBC NL` source record was observed in the current Netherlands inventory. Determine the correct provider record explicitly; do not silently substitute BBC First or another BBC service.
- **Veronica:** the current Netherlands source record is `VeronicaDisneyXD.nl` / `Veronica / Disney XD`. Preserve canonical Teevee channel identity independently from that provider/timeshare naming.
- **Play family:** the Belgian provider still exposes `Play4.be`, `Play5.be`, `Play6.be`, `Play7.be`; canonical Teevee names for this target are respectively **Play, Play Fictie, Play Actie, Play Reality** after programme-level continuity verification.
- **VRT aliases:** multiple VRT/legacy-labelled records exist across the raw source inventories. Map exactly one canonical VRT 1 and one canonical VRT Canvas; never expose duplicate alias channels.

## Implementation boundary for the later iteration

The later development increment should:
- add stable Teevee-owned canonical IDs and `sortOrder` values for all 49 target channels;
- explicitly map provider records from the required source feed(s);
- prove that apparent aliases/renames resolve to one canonical channel rather than duplicate channels;
- preserve provider IDs and legacy names at the adapter boundary;
- keep mobile/public Guide contracts provider-independent;
- verify the required Guide television-day coverage and failure semantics for the expanded catalog;
- keep unavailable/partial provider coverage from corrupting otherwise valid channels;
- preserve or migrate any existing user-defined channel selection/order without destructive reset;
- reconcile later catalog additions by distinguishing genuinely new channel IDs from previously known hidden IDs; append genuinely new channels as visible at the end, never resurrect previously hidden channels;
- treat channel-logo provenance/licensing and production EPG redistribution rights as separate release requirements.

No runtime/provider implementation is part of this decision record.

## Implementation status

Issue #175 / draft PR #176 implements this exact catalogue, explicit 36-NL/13-BE provider mapping, personalisation migration coverage and local logo ownership. Production activation remains gated by PR #173 merge/reconciliation, exact-head review/QA, source-specific hosted CPU capacity proof and physical logo validation. Implementation evidence: `docs/CHANNEL_EXPANSION_IMPLEMENTATION_2026-09-24.md`.
