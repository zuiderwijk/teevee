# Phase 3 provider research — 2026-09-14

Status: current research record for the Real Data Vertical Slice. This document does **not** approve a production supplier or production data rights.

## Goal
Use real schedule data during development without coupling Teevee to one supplier and without treating technical/public accessibility as permission for a paid production app.

## Current development decision
For the immediate Phase 3 real-data slice, Teevee uses the public Netherlands XMLTV feed from IPTV-EPG.org as a **temporary development source only**:

`https://iptv-epg.org/files/epg-nl.xml`

This source sits behind the server-side `EpgProvider` boundary. It is not a mobile dependency and is not a production-provider decision.

## Live feed evidence
A temporary GitHub Actions inspection in PR #43 fetched the real XMLTV file on 2026-09-14. PR #43 was closed without merge immediately after inspection.

Observed:
- content type `text/xml; charset=utf-8`;
- 30,237,192 bytes;
- 184 `<channel>` records;
- 33,117 `<programme>` records;
- minimum observed start `20260913000600 +0000`;
- maximum observed stop `20260919235500 +0000`.

Verified provider channel IDs include:
- `NPO1.nl`, `NPO2.nl`, `NPO3.nl`;
- `RTL4.nl`, `RTL5.nl`, `RTL7.nl`, `RTL8.nl`, `RTLZ.nl`;
- `SBS6.nl`, `SBS9.nl`, `Net5.nl`, `VeronicaDisneyXD.nl`;
- `ESPN.nl`, `ESPN2.nl`, `ESPN3.nl`, `ESPN4.nl`;
- `ZiggoSport.nl` and additional Ziggo Sport variants;
- `Discovery.nl`, `NationalGeographicChannel.nl`, BBC and VRT channels.

The provider's public Guides overview currently reports a different Netherlands total than the fetched XML payload. Teevee therefore never uses website counters as correctness or coverage evidence; the actual parsed feed controls technical behaviour.

## Development implementation
PR #42 merged as `4ea4a73bb38580cc8ab0acf454ccfc5849350bab` and provides `XmltvEpgProvider`.

The adapter:
- parses XMLTV server-side;
- requires explicit timezone offsets and normalises valid timestamps to UTC;
- preserves malformed raw timestamps for downstream diagnostics;
- filters schedule output using Teevee's `[from,to)` semantics;
- returns `complete` only if every requested provider channel continuously covers the requested range;
- otherwise returns `partial`, preventing destructive canonical replacement;
- has deterministic injected-fetch tests so CI never depends on the live feed.

## Temporary development-feed rules
- The external feed URL/provider implementation stays server-side.
- Mobile consumes only Teevee-owned canonical schedule data.
- Do not commit downloaded XMLTV files, provider logos or artwork to Git.
- Deterministic fixtures remain mandatory for CI and offline UI development.
- Do not infer commercial/publication rights from a successful development integration.
- Keep channel mapping explicit. Do not guess mappings from Teevee's synthetic mobile fixtures.
- Production EPG, channel-logo, programme-artwork and SLA rights remain a release gate.

## Production source remains open
Preferred order for production:
1. authorized Bindinc/TVgids.nl feed/API if available with paid-app rights;
2. another commercially licensed provider with Netherlands coverage and explicit redistribution rights, such as EPGdata.tv or Gracenote On API;
3. never a scraper/public-guide shortcut merely because it is technically accessible.

### EPGdata.tv
Publicly lists Netherlands and offers programme-data services. Production use still requires feed/API details, commercial redistribution rights, metadata/image scope and pricing/SLA confirmation.

References:
- https://www.epgdata.tv/en/content-discovery/channels/
- https://www.epgdata.tv/nl/

### Gracenote On API
Documents TV-guide APIs and Netherlands (`NLD`) lineup support. Production use still requires authorized access, commercial rights, rate-limit/horizon confirmation and image/metadata rights.

References:
- https://devportal.gracenote.com/
- https://developer.tmsapi.com/docs/read/data_v1_1/International_lineups

## Sources not approved for production
### EPG.PW
EPG.PW offers free XMLTV/testing feeds, but its published terms restrict use to personal/non-commercial use. It is not Teevee's selected development source and must not be used as the commercial production source without separate written rights.

### Schedules Direct
Schedules Direct's published subscriber terms limit licensed data to personal/non-commercial use and exclude commercial retail EPG/software applications. Do not use it for Teevee production without separate written commercial permission superseding those terms.

References:
- https://www.schedulesdirect.org/sagreement
- https://www.schedulesdirect.org/faq
- https://www.schedulesdirect.org/approvedsoftware

## Security / architecture rule
Provider credentials, privileged provider URLs and raw provider payloads never belong in the mobile bundle. The client eventually consumes only Teevee's typed canonical schedule API. The temporary free feed does not weaken this boundary.