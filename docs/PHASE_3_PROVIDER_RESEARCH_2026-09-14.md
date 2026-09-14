# Phase 3 provider research — 2026-09-14

Status: current research record for the Real Data Vertical Slice. This document does not approve a production supplier or production data rights.

## Goal
Identify development-provider options that are technically suitable for Teevee without treating public accessibility as permission to use or redistribute TV-guide data.

## Current conclusion
For the immediate real-data development slice, use a free public XMLTV feed only as a temporary engineering source behind Teevee's server-side `EpgProvider` boundary. This is not a production-provider decision and must not be shipped as an external dependency of the mobile app.

Current temporary development source:
- IPTV-EPG.org Netherlands XMLTV feed: `https://iptv-epg.org/files/epg-nl.xml`.
- The provider publicly lists a Netherlands feed and currently reports roughly 154 channels / 40k schedule items.
- The feed is suitable to exercise real XMLTV parsing, channel mapping, ingestion, canonical storage, payload measurement and mobile API integration.
- Usage/licensing provenance is not strong enough to treat it as Teevee's production data source. No production redistribution conclusion is inferred from public accessibility.

Fallback development source:
- EPG.PW publishes free XMLTV feeds intended for testing, but its published terms restrict use to personal/non-commercial purposes. Do not use it as Teevee's commercial production source.

## Production provider remains open
Teevee still requires a provider with explicit commercial/publication rights before release. Current candidates remain:
1. authorized Bindinc/TVgids.nl development/production feed if available;
2. EPGdata.tv;
3. Gracenote On API.

No scraper/public-guide shortcut may become the production provider merely because it is technically accessible.

## Rejected as production source: Schedules Direct
Schedules Direct is not suitable for Teevee's commercial paid-app path under its published subscriber terms.

The published Subscription Agreement limits licensed data to personal, non-commercial use and explicitly excludes commercial retail EPG/software applications. Its approved-software model is likewise aimed at non-commercial/free/open-source applications.

References:
- https://www.schedulesdirect.org/sagreement
- https://www.schedulesdirect.org/faq
- https://www.schedulesdirect.org/approvedsoftware

Conclusion: do not build a production Teevee dependency against Schedules Direct unless Schedules Direct separately grants written commercial rights that supersede the published terms.

## Candidate: Gracenote On API
Gracenote's current developer portal explicitly presents On API for TV-guide applications using linear schedules, channel lineups and programme metadata. Its international lineup documentation explicitly includes `NLD — The Netherlands`, and schedule/lineup endpoints require API access/credentials.

References:
- https://devportal.gracenote.com/
- https://developer.tmsapi.com/docs/read/data_v1_1/International_lineups
- https://developer.tmsapi.com/docs/read/data_v1_1/lineups
- https://developer.tmsapi.com/docs/read/data_v1_1/lineups/Lineup_Airings_TV_Grid

Open before production implementation:
- obtain authorized development/commercial access and contractual permission;
- confirm the current Netherlands lineup/channel set matches Teevee's intended scope;
- confirm rate limits, schedule horizon, metadata/image rights and redistribution terms;
- keep credentials server-side.

## Candidate: EPGdata.tv
EPGdata.tv publicly lists Netherlands among its channel offerings and positions its service as enriched programme data for customer platforms. The site directs prospective customers to request a personal offer rather than exposing a public development feed suitable for immediate Teevee use.

References:
- https://www.epgdata.tv/en/content-discovery/channels/
- https://www.epgdata.tv/nl/

Open before production implementation:
- obtain API/feed specification or sample;
- verify commercial licensing and permitted paid-mobile-app redistribution;
- verify freshness, corrections, schedule horizon, identifiers and metadata/image rights;
- obtain credentials through an authorized channel.

## Temporary development feed rules
The free XMLTV feed is permitted only as a replaceable engineering input:
- provider URL remains server-side/configurable and is never embedded as a mobile data source;
- mobile consumes only Teevee's canonical typed schedule API;
- do not commit downloaded XMLTV payloads or provider artwork/logos to Git;
- deterministic fixtures remain mandatory for tests/CI;
- the adapter must parse only the provider-neutral schedule fields needed by Phase 3;
- absence/failure of the free feed must not make local tests or CI non-deterministic;
- production release remains blocked on explicit EPG/logo/artwork/SLA rights.

## Bindinc/TVgids.nl path
Because Teevee is developed under Bindinc/TVgids.nl supervision, an authorized internal development/production feed remains architecturally preferred when available. The provider adapter boundary keeps any temporary development source replaceable.

Required handoff if available:
- endpoint/feed or sample file;
- format/schema documentation;
- authentication method/credentials through a secure channel;
- channel identifier mapping information;
- expected schedule horizon and refresh/correction behaviour;
- explicit confirmation of development and eventual paid-app usage rights, including logos/artwork where applicable.

## Security / architecture rule
Provider credentials, raw provider URLs that expose privileged access, and provider-specific payloads never belong in the mobile bundle. The mobile client consumes only Teevee's typed canonical schedule API.
