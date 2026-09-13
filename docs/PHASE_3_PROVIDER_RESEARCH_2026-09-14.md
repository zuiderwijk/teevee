# Phase 3 provider research — 2026-09-14

Status: current research record for the Real Data Vertical Slice. This document does not approve a production supplier or data rights.

## Goal
Identify development-provider options that are technically suitable for Teevee without treating public accessibility as permission to use or redistribute TV-guide data.

## Current conclusion
No live provider is selected yet. Teevee remains on deterministic fixtures until an authorized development source and credentials are available.

Preferred order:
1. an authorized Bindinc/TVgids.nl development feed or API, if available;
2. a commercially licensed external TV-listings provider with Netherlands coverage;
3. no scraper/public-guide shortcut merely to make Phase 3 look complete.

## Rejected: Schedules Direct
Schedules Direct is not suitable for Teevee's commercial paid-app path under its published subscriber terms.

The published Subscription Agreement limits licensed data to personal, non-commercial use and explicitly excludes commercial retail EPG/software applications. Its approved-software model is likewise aimed at non-commercial/free/open-source applications.

References:
- https://www.schedulesdirect.org/sagreement
- https://www.schedulesdirect.org/faq
- https://www.schedulesdirect.org/approvedsoftware

Conclusion: do not build a Teevee adapter against Schedules Direct unless Schedules Direct separately grants written commercial rights that supersede the published terms.

## Candidate: Gracenote On API
Gracenote's current developer portal explicitly presents On API for TV-guide applications using linear schedules, channel lineups and programme metadata. Its international lineup documentation explicitly includes `NLD — The Netherlands`, and schedule/lineup endpoints require API access/credentials.

References:
- https://devportal.gracenote.com/
- https://developer.tmsapi.com/docs/read/data_v1_1/International_lineups
- https://developer.tmsapi.com/docs/read/data_v1_1/lineups
- https://developer.tmsapi.com/docs/read/data_v1_1/lineups/Lineup_Airings_TV_Grid

Open before implementation:
- obtain authorized development/commercial access and contractual permission;
- confirm the current Netherlands lineup/channel set matches Teevee's intended scope;
- confirm rate limits, schedule horizon, metadata/image rights and redistribution terms;
- keep credentials server-side.

## Candidate: EPGdata.tv
EPGdata.tv publicly lists Netherlands among its channel offerings and positions its service as enriched programme data for customer platforms. The site directs prospective customers to request a personal offer rather than exposing a public development feed suitable for immediate Teevee use.

References:
- https://www.epgdata.tv/en/content-discovery/channels/
- https://www.epgdata.tv/nl/

Open before implementation:
- obtain API/feed specification or sample;
- verify commercial licensing and permitted paid-mobile-app redistribution;
- verify freshness, corrections, schedule horizon, identifiers and metadata/image rights;
- obtain development credentials through an authorized channel.

## Bindinc/TVgids.nl path
Because Teevee is developed under Bindinc/TVgids.nl supervision, an authorized internal development feed is architecturally the preferred source when available. It minimizes unnecessary provider migration work while Teevee's adapter boundary still keeps the app independent of the production supplier.

Required handoff if available:
- endpoint/feed or sample file;
- format/schema documentation;
- authentication method/credentials through a secure channel;
- channel identifier mapping information;
- expected schedule horizon and refresh/correction behaviour;
- explicit confirmation of development and eventual paid-app usage rights, including logos/artwork where applicable.

## Security / architecture rule
Provider credentials, raw provider URLs that expose privileged access, and provider-specific payloads never belong in the mobile bundle. The mobile client consumes only Teevee's typed canonical schedule API.
