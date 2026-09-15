# Teevee Testing

Status: Phase 4 development test path. Phase 1A, 1B, 2 and 3 iPhone acceptance are closed. Current feature/device gates are governed by `PROJECT_STATE.md` and `ENGINEERING_QUALITY_POLICY.md`.

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

## Closed physical acceptance
Phase 2 evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`;
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

Phase 3 evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE3.md`.

Accepted on the available iPhone includes:
- app shell and appearance persistence;
- Totaal, Per zender and deferred Nu & Straks;
- Programme Detail round-trips;
- Per zender channel identity/select/adjacent-swipe synchronisation;
- Nu & Straks mixed horizontal/vertical interaction;
- fixture-first startup and fixture -> hosted canonical transition;
- controlled fallback when hosted data is unavailable;
- background/resume context retention;
- runtime network-loss degradation without destroying Guide state.

Do not routinely reopen these interaction gates. Revalidate only when concrete changes touch them or a regression gives evidence to do so.

Nu & Straks following-programme rows remain known non-blocking accessibility/density debt at 24pt. Do not solve with overlapping `hitSlop` or blindly enlarge every row to 44pt; Phase 4 remediation must be density-aware and physically checked.

## Automated quality gate
The `quality` job runs on every pull request and push to `main`:
- `npm ci` from the committed lockfile;
- strict TypeScript typecheck;
- lint;
- Vitest suite;
- Expo exports for iOS, Android and web.

The separate `android-native` job is risk-scoped:
- documentation/design-only PRs (`docs/**`, `design/**` and root Markdown files) run native-scope detection but skip Java/Gradle setup, the second `npm ci`, Expo Android prebuild and APK compilation;
- PRs that touch runtime/configuration code build a clean Android debug APK for `arm64-v8a` only;
- pushes to `main` run the full Android debug build across the repository's normal ABI set as the release-like safety net;
- an unexpected empty PR diff falls back conservatively to the arm64 build.

PR scope uses the merge-base/three-dot Git diff (`base...head`), so a docs-only branch remains docs-only even when `main` advances with unrelated runtime changes after the branch point.

Deterministic regression coverage for this policy lives in `scripts/ci/android-native-scope.test.mjs` and proves:
- docs/design-only -> native compile skipped;
- runtime/config -> arm64 native compile required;
- stale docs-only branch after base advancement -> still docs-only;
- unexpected empty diff -> conservative arm64.

A PR is not CI-green until every required job for the exact PR head SHA is `completed` with conclusion `success`. After merge, exact-`main` CI is separate evidence and must be checked independently.

A green CI run proves these automated checks only; it does not prove mobile scroll/gesture quality, native accessibility or real-device performance.

Never use `npm audit fix --force`.

## Engineering Quality Policy
`docs/ENGINEERING_QUALITY_POLICY.md` is the binding quality policy once merged to `main`.

Important test rules:
- risk classification is Low / Medium / High;
- automated evidence must protect product/domain behaviour rather than implementation trivia;
- reproducible bugs should normally gain regression coverage;
- high-risk changes require independent QA/review where practical;
- physical device evidence is required when CI cannot credibly prove gestures, lifecycle, accessibility, visual fidelity or performance;
- do not weaken types, lint rules or assertions merely to make a change green;
- critical domain/data/runtime/server coverage targets are introduced only when CI coverage reporting is enabled; do not manufacture low-value UI tests to hit a percentage.

## Deterministic data tests
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

Observed at the time:
- ~30.2 MB XML;
- 184 channels;
- 33,117 programme records;
- roughly a week of schedule data;
- real provider IDs including NPO/RTL/SBS/Net5/Veronica/sport channels.

No live external fetch belongs in the normal deterministic CI suite.

## Canonical repository — ADR 0007
Repository tests preserve:
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

## Hosted Supabase persistence and transport
`SupabaseScheduleRepository` tests cover RPC mapping, stored/ignored-stale results, bounded reads, unavailable reads, malformed payload rejection and RPC errors.

Hosted security expectations:
- canonical tables stay private;
- `anon`/`authenticated` cannot access storage/RPC write/read bridges;
- service role stays server-side;
- RLS/no-policy on private tables is intentional;
- transactional stale-write behaviour remains equivalent to ADR 0007;
- public mobile transport exposes canonical data only;
- refresh/write remains protected server-side.

The Phase 3 hosted path is already proven end-to-end; do not reintroduce live external-provider dependency into normal CI.

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

## Phase 4 television-day and horizon gate
ADR 0008 is high-risk domain behaviour. Phase 4 tests must deterministically cover, before physical acceptance where relevant:
- the 06:00 Europe/Amsterdam television-day boundary;
- 00:00–05:59 belonging to the preceding television day;
- `Nu` selecting the television day containing the actual current instant;
- D-2 through D+7 day selection;
- midnight continuity within one television day;
- both Europe/Amsterdam DST transitions, including 23-hour and 25-hour civil-time effects;
- historical and forward schedule windows;
- context-preserving refresh/day change behaviour;
- fixture fallback remaining deterministic when hosted windows are unavailable.

For Guide UI changes, keep the physically accepted interaction mechanics frozen unless regression evidence justifies retuning them.

## Mobile client gate
When runtime schedule/day-selection behaviour changes:
- startup remains stable;
- loading/error/offline fallback is controlled;
- fixture mode remains available;
- refresh does not reset accepted presentation/channel/time context unnecessarily;
- all three Guide presentations still consume the same provider-independent domain;
- no provider/database details appear in mobile code;
- run focused physical iPhone acceptance for behaviour CI cannot prove.

If Guide scroll/layout/gesture code is untouched, do not rerun the entire historical Phase 1/2/3 acceptance matrix.

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
