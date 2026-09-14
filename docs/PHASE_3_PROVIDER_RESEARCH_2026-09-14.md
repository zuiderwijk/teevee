# Phase 3 provider research — 2026-09-14

Status: current research record for the Real Data Vertical Slice. This document selects a **temporary development-provider path**, not a final production supplier or blanket data-rights approval.

## Goal
Identify development-provider options that are technically suitable for Teevee without treating public accessibility as permission to use or redistribute TV-guide data.

## Current conclusion
For the Phase 3 real-data slice, **EPGdata.tv is the selected first external provider route**. The choice is pragmatic and reversible: it has explicit Netherlands channel coverage, is aimed at TV services/guides, is based in Hilversum, and can export data to customer platforms in requested formats.

Teevee remains on deterministic fixtures until EPGdata supplies an authorized development feed/sample and confirms the relevant usage rights. Gracenote remains the fallback if EPGdata cannot provide suitable access/terms quickly.

Provider order for the current development phase:
1. **EPGdata.tv** — first external access request for a compact Netherlands development/pilot feed;
2. **Gracenote On API** — fallback if EPGdata onboarding, format, coverage or rights are unsuitable;
3. an authorized Bindinc/TVgids.nl feed may replace either later without changing the Teevee client contract;
4. no scraper/public-guide shortcut merely to make Phase 3 look complete.

## Selected development route: EPGdata.tv
EPGdata.tv publicly lists a broad Netherlands channel set including NPO, RTL, SBS/Net5/Veronica and many thematic channels. It positions its service as enriched EPG data for customer platforms and states that its exporter can deliver data in requested formats.

References:
- https://www.epgdata.tv/nl/
- https://www.epgdata.tv/nl/content-discovery/channels/
- https://www.epgdata.tv/nl/content-discovery/services/
- https://www.epgdata.tv/contact-us/
- https://www.epgdata.tv/disclaimer/

Important legal constraint: EPGdata's public disclaimer explicitly states that delivery of EPG data **does not itself imply a right to publish the data**. Therefore Teevee must request development use and paid consumer-app publication/redistribution rights explicitly; receiving a feed or sample alone is not sufficient rights clearance.

### Requested pilot scope
Ask EPGdata for the smallest useful development package rather than a production-scale commitment:
- a compact Dutch channel set sufficient to exercise Teevee end-to-end, initially NPO 1/2/3, RTL 4/5/7/8/Z, SBS6, Net5, Veronica and SBS9 (or their current equivalents);
- at least several days of forward schedule, preferably the normal production horizon;
- stable channel and programme identifiers where available;
- start/end times, title and optional subtitle/description/genre/live/repeat metadata;
- one machine-readable delivery path: native API/JSON if available, otherwise XML/XMLTV or another documented feed;
- update/correction semantics and recommended polling cadence;
- development credentials/sample plus production-commercial pricing indication;
- explicit permission for development and for display of licensed programme data in Teevee, a paid ad-free iOS/Android consumer TV-guide app;
- separate statement of rights for channel logos, programme images and other artwork, because Phase 3 core EPG must not depend on those rights.

### Integration rule
Do not implement an EPGdata-specific parser until EPGdata provides the actual feed/API specification or sample. Once received, implement the smallest adapter behind the existing `EpgProvider` boundary and keep raw credentials/URLs server-side.

## Fallback: Gracenote On API
Gracenote's current developer portal explicitly presents On API for TV-guide applications using linear schedules, channel lineups and programme metadata. Current developer material covers international TV-guide use and requires API access/credentials.

References:
- https://devportal.gracenote.com/
- https://documentation.gracenote.com/on-api/html/Content/dev-guide/Schedules%20Endpoint.htm
- https://developer.sports.gracenote.com/member/register

If EPGdata is unsuitable:
- register Bindinc/Teevee through the authorized Gracenote developer/commercial route;
- request Netherlands schedule/lineup entitlement;
- confirm rate limits, schedule horizon, metadata/image rights and redistribution terms;
- keep credentials server-side.

## Rejected: Schedules Direct
Schedules Direct is not suitable for Teevee's commercial paid-app path under its published subscriber terms.

The published Subscription Agreement limits licensed data to personal, non-commercial use and explicitly excludes commercial retail EPG/software applications. Its approved-software model is likewise aimed at non-commercial/free/open-source applications.

References:
- https://www.schedulesdirect.org/sagreement
- https://www.schedulesdirect.org/faq
- https://www.schedulesdirect.org/approvedsoftware

Conclusion: do not build a Teevee adapter against Schedules Direct unless Schedules Direct separately grants written commercial rights that supersede the published terms.

## Not selected for now: EPG Service
EPG Service advertises a development sandbox/free tier and a REST/OpenAPI EPG product, but its strongest documented coverage is Russia/CIS/international and its commercial operation is Russia-based. It is therefore not preferred over the Netherlands-focused EPGdata route for Teevee. Re-evaluate only if EPGdata and Gracenote are unavailable and legal/procurement review explicitly accepts it.

## Bindinc/TVgids.nl path
An authorized internal development feed remains architecturally attractive if it later becomes available. The existing provider boundary means switching from EPGdata to an internal source must not require Guide-level changes.

Required handoff if available:
- endpoint/feed or sample file;
- format/schema documentation;
- authentication method/credentials through a secure channel;
- channel identifier mapping information;
- expected schedule horizon and refresh/correction behaviour;
- explicit confirmation of development and eventual paid-app usage rights, including logos/artwork where applicable.

## Security / architecture rule
Provider credentials, raw provider URLs that expose privileged access, and provider-specific payloads never belong in the mobile bundle. The mobile client consumes only Teevee's typed canonical schedule API.
