# Teevee Testing

Status: Phase 3 development test path. Phase 2 iPhone acceptance is closed. Current feature/device gates are governed by `PROJECT_STATE.md`.

CI and server/integration tests are technical proof; they do not replace physical-device acceptance when mobile interaction boundaries are changed.

## Local mobile test path
The current app still uses Expo-compatible libraries and can be run through Expo Go.

```bash
cd ~/projects/teevee
git checkout main
git pull --ff-only
npm ci
npm run start:device
```

For cache-sensitive checks:

```bash
npm run start:clean
```

## Phase 2 physical status — CLOSED
Evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`;
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

Accepted on the available iPhone:
- Gids / Vanavond / Zoeken + secondary Settings;
- persisted Light/Dark/System;
- shared headers/safe areas;
- Totaal, Per zender and Nu & Straks at representative larger iOS text;
- Programme Detail round-trip;
- Per zender channel identity/select/swipe synchronisation;
- no broad crash/white-screen/gesture regression.

Do not routinely reopen these interaction gates. Revalidate only when concrete changes touch them.

Nu & Straks following-programme rows remain known non-blocking accessibility/density debt at 24pt. Do not solve with overlapping `hitSlop` or blindly enlarge every row to 44pt; later remediation must be density-aware and physically checked.

## Automated quality gate
Every normal PR/main push runs:
- `npm ci`;
- strict TypeScript typecheck;
- lint;
- Vitest suite;
- Expo exports for iOS, Android and web;
- clean Android prebuild + Gradle debug APK compile.

A green CI run proves those checks only; it does not prove mobile scroll/gesture quality.

Never use `npm audit fix --force`.

## Phase 3 deterministic tests
Real data does not replace deterministic fixtures. Normal CI must not depend on the internet, external provider availability or provider credentials.

### Provider / normalisation
Tests cover:
- explicit provider-channel mappings;
- invalid/unknown/duplicate mapping diagnostics;
- malformed external records remain representable;
- UTC normalisation;
- provider-ID reuse across broadcasts;
- timezone-equivalent duplicate handling;
- overlap diagnostics;
- no provider-specific leakage into canonical/mobile output.

### XMLTV development adapter — PR #42
Deterministic sample tests cover:
- timestamps with explicit numeric offsets;
- DST-offset examples;
- rejection of ambiguous offset-less timestamps;
- XML entities and CDATA;
- title/subtitle/description/category;
- live/repeat flags;
- malformed timestamp pass-through for diagnostics;
- injected fetch boundary;
- `[from,to)` schedule intersection;
- continuous coverage -> `complete`;
- a schedule gap -> `partial`;
- upstream HTTP failure does not fabricate authoritative empty data.

The first PR #42 CI run found a real CDATA handling bug. It was fixed before merge; final exact-head CI #290 passed `quality` and `android-native` completely.

### Live feed evidence is separate from normal CI
Temporary PR #43 ran a one-off GitHub Actions fetch to inspect the public development feed and was closed without merge.

Observed:
- ~30.2 MB XML;
- 184 channels;
- 33,117 programme records;
- roughly a week of schedule data;
- real provider IDs including NPO/RTL/SBS/Net5/Veronica/sport channels.

No live external fetch remains in the normal CI workflow.

## Canonical repository — ADR 0007
Repository tests must preserve:
- `programme.start < to && programme.end > from`;
- explicit channel/time replacement scope;
- metadata/programmes outside refresh scope untouched;
- corrections remove stale rows only inside scope;
- coverage per channel/time segment;
- covered-empty valid;
- uncovered/partly covered unavailable;
- conservative combined freshness;
- older overlapping write atomically `ignored-stale`;
- invalid ranges/empty explicit scopes/broken canonical relations fail hard.

The in-memory repository is an executable reference, not production storage.

## Hosted Supabase persistence — PR #40
`SupabaseScheduleRepository` tests cover RPC mapping, stored/ignored-stale results, bounded reads, unavailable reads, malformed payload rejection and RPC errors.

Hosted security expectations:
- canonical tables stay private;
- `anon`/`authenticated` cannot access storage/RPC write/read bridges;
- service role stays server-side;
- RLS/no-policy on private tables is intentional;
- transactional stale-write behaviour must remain equivalent to ADR 0007.

Actual service-role end-to-end execution is part of the hosted transport/ingest slice, because the connected SQL inspection role cannot impersonate service role.

## Ingestion orchestration
Integration tests cover:
- `complete` provider coverage may replace a safe canonical window;
- `partial` coverage never destructively writes;
- complete empty batches may clear stale canonical data;
- attributable malformed data blocks only affected safe channel scope;
- unattributed malformed data blocks destructive replacement;
- repository `ignored-stale` is surfaced explicitly.

## Refresh concurrency
A dedicated test proves:
- freshness is captured at provider request start;
- a newer canonical schedule remains stored;
- a slow older response finishing later is `ignored-stale`.

## Typed schedule API
Tests cover:
- canonical-only output;
- fully covered scope -> `ok`, including zero programmes;
- missing/incomplete canonical coverage -> `unavailable`;
- runtime validation of serialized `from`/`to`;
- `to > from`;
- UTC canonicalisation;
- optional channel IDs must be non-empty strings and are trimmed/deduplicated.

## Next hosted real-data test slice
Before connecting mobile, prove one bounded server-side path:
1. explicit verified XMLTV provider IDs -> narrow Teevee canonical channel mapping;
2. provider fetch/parse for a bounded time window;
3. normalisation diagnostics;
4. authoritative safe write to Supabase;
5. canonical read back;
6. typed transport response;
7. measurement of feed fetch, parse, write/read and canonical response size.

Because the external source is ~30 MB, memory/latency and refresh cadence must be measured, not guessed.

## Mobile client gate
Only when real canonical data reaches the Guide:
- startup remains stable;
- loading/error/offline fallback is controlled;
- fixture mode remains available;
- refresh does not reset accepted presentation/channel/time context unnecessarily;
- all three Guide presentations still consume the same provider-independent domain;
- no provider/database details appear in mobile code;
- run a focused physical iPhone smoke.

If Guide scroll/layout/gesture code is untouched, do not rerun the entire Phase 1/2 acceptance matrix.

## Android
Physical Android validation remains open because no Android device is currently available. CI proves export/prebuild/compile only, not system Back, nested gesture feel or device performance.

When hardware becomes available, check at minimum:
1. startup;
2. all Guide presentations;
3. mixed horizontal/vertical Guide movement;
4. Programme Detail + Android system Back;
5. appearance/larger text;
6. short stability/performance session.

## Later distribution testing
Stay on Expo Go while current capabilities allow it. Move to Expo development builds, TestFlight and Google Play Internal Testing only when native capabilities or production-like distribution behaviour actually require it.