# Phase 3 intake — Real Data Vertical Slice

Date: 2026-09-14 CEST
Status: technical intake for the first provider-independent real-data increment.

## Repository reality at start

The mobile product has a strong canonical EPG domain and deterministic fixtures, but no real-data transport/backend path yet.

Present:
- Teevee-owned `Channel`, `Programme` and fixture schedule types in `data/domain`;
- deterministic 48-channel fixture and Amsterdam runtime alignment in `data/fixtures`;
- three physically accepted Guide presentations consuming that domain;
- small AppPreferences storage under `services/storage`;
- strict TypeScript, Vitest and cross-platform/native Android CI gates.

Not present:
- `services/api` or another typed schedule client;
- mobile schedule cache;
- server/provider adapter implementation;
- XMLTV/feed parser;
- canonical server database/schema;
- Teevee backend/API deployment;
- Supabase client dependency or repository configuration;
- TanStack Query, Zod or SQLite dependencies.

The three Guide presentations currently construct their deterministic runtime fixture locally. Real-data integration must eventually centralise the schedule source so the presentations do not independently fetch the same network schedule, but that runtime refactor is deliberately not part of the first Phase 3 increment.

## Backend / credentials gate

No Teevee Supabase project is currently configured in the repository. The connected Supabase account visible during intake exposes only an unrelated `ReelWorthy` project. It must not be reused for Teevee.

Creating a new hosted project has organization/cost implications and therefore remains a human/credential gate. Provider credentials likewise do not exist in the repository and must never be committed or placed in the mobile bundle.

This does **not** block the provider-independent ingestion core below.

## Provider research boundary

No current development feed has yet been accepted as both technically useful and appropriate from a rights/source perspective. Public XMLTV tooling proves the interchange format is common, but scraper-oriented guide repositories are not an acceptable default merely because they are easy to access. Historical NPO guide APIs and commercial guide vendors also do not establish a current free/cleared Teevee source.

Therefore the first increment does not hard-code any provider or XML parser. The concrete adapter/parser will be selected only after its current access method and terms are verified.

## First Phase 3 increment

Build the smallest reusable ingestion core before backend or mobile coupling:

1. name the provider-independent runtime shape `GuideSchedule` while retaining `GuideFixture` as a compatibility alias;
2. define a server-only `EpgProvider` contract and neutral external channel/programme records;
3. require explicit provider-channel -> Teevee-channel mapping;
4. normalise provider programmes into canonical Teevee `Programme` values;
5. convert valid timestamps to canonical ISO/UTC values;
6. keep programme IDs deterministic without exposing provider fields to Guide components;
7. diagnose and safely skip unusable provider records instead of crashing an entire ingest;
8. retain valid overlapping records but emit diagnostics so schedule corrections remain possible;
9. cover the boundary with deterministic unit tests;
10. add no runtime dependency and make no Guide interaction/layout change.

## Data-quality diagnostics in this slice

The normalisation boundary detects:
- invalid/ambiguous channel mappings;
- mappings to unknown canonical channels;
- programmes on unmapped provider channels;
- missing titles;
- invalid start/end timestamps;
- end <= start;
- duplicate provider programmes;
- overlapping programmes on a canonical channel.

Internal canonical configuration defects such as duplicate Teevee channel IDs fail fast; malformed provider data remains record-level diagnostic input so a partially usable ingest can continue.

## Deliberately deferred

Until this core is green:
- hosted backend/Supabase project creation;
- database migrations;
- public API endpoint/auth model;
- live XMLTV/network fetching;
- mobile API client;
- schedule cache selection;
- Guide data-source refactor;
- UI loading/offline/stale-data presentation.

The next slice after this core should choose/provision the backend and one verified development provider, then persist/query a small real schedule through a typed Teevee API. Only after that boundary works should the mobile Guide switch from local fixtures to an injectable/shared schedule source.
