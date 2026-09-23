# Belgian EPG target-channel check — 2026-09-24

Status: **EMPIRICAL LIVE-SOURCE CHECK**  
Source: `https://iptv-epg.org/files/epg-be.xml`  
Observed: 2026-09-23T22:35:28.665Z (00:35 Europe/Amsterdam on 24 September 2026)  
Research PR: #163

## Purpose

Check whether the owner-requested Belgian channels missing from the Netherlands feed are available in the provider's Belgian XMLTV feed.

This is source evidence only. Presence in `epg-be.xml` does not by itself approve a channel for Teevee, prove production redistribution rights, or define canonical Teevee identity.

## Snapshot

Direct live fetch observed:
- XML bytes: **36,989,949**;
- **282** unique provider channel IDs;
- **44,470** programme rows.

The provider's public guide index may report a different aggregate channel count; for matching/mapping work, use the directly observed XML payload and explicit provider IDs rather than the website summary count.

## Requested Flemish channels

| Requested current channel | Present in Belgian feed? | Provider record observed | Notes |
| --- | :---: | --- | --- |
| VRT 1 | yes | `VRT1.be` / `BE - VRT 1` | direct current-name match |
| VRT Canvas | yes | `VRTCANVAS.be` / `BE - VRT CANVAS` | direct current-name match |
| VTM | yes | `vtm.be` / `BE - vtm` | direct match, casing differs |
| Play | yes, under legacy source name | `Play4.be` / `BE - Play4` | Play4 was renamed to Play in October 2025 |
| Play Fictie | yes, under legacy source name | `Play5.be` / `BE - Play5` | Play5 was renamed to Play Fictie |
| VTM2 | yes | `VTM2.be` / `BE - VTM 2` | direct match |
| VTM3 | yes | `VTM3.be` / `BE - VTM 3` | direct match |
| VTM4 | yes | `VTM4.be` / `BE - VTM 4` | direct match |
| Play Actie | yes, under legacy source name | `Play6.be` / `BE - Play6` | Play6 was renamed to Play Actie |
| Play Reality | yes, under legacy source name | `Play7.be` / `BE - Play7` | Play7 was renamed to Play Reality |
| Play Crime | yes | `PlayCrime.be` / `BE - Play Crime` | direct current-name match |
| VTM Gold | yes | `VTMGOLD.be` / `BE - VTM GOLD` | direct match |
| Ketnet | yes | `Ketnet.be` / `BE - Ketnet` | direct match |

## Important mapping implication

All owner-requested channels are therefore represented in the Belgian feed, but four Play-family records still use pre-October-2025 provider naming.

Do **not** create canonical Teevee channels named Play4/5/6/7. Before production mapping:
1. verify programme-level continuity/currentness for `Play4.be` through `Play7.be`;
2. map those opaque provider IDs to current canonical Teevee names **Play, Play Fictie, Play Actie, Play Reality** only after that verification;
3. preserve provider IDs as adapter vocabulary so future source renames do not mutate Teevee canonical channel identity.

External naming evidence: Telenet documents the 14 October 2025 rebrand Play4 → Play, Play5 → Play Fictie, Play6 → Play Actie and Play7 → Play Reality.
