# Teevee — Canonical Project State

Last updated: 2026-09-24.
Status: ACTIVE — **Inter-phase Premium Artwork & Content Identity enrichment**.
Current implementation priority: **Issue #170 / PR #173 — Channel personalisation: one persisted `Mijn zenders` selection/order shared by all Guide presentations, with full-catalog Search recovery/education. Issue #167 / merged PR #172 remains independently pending only its normal six-hour production cron acceptance gate.**
Current broader product phase: **Phase 6 — Personal Features, intentionally deferred behind the owner-priority inter-phase enrichment**
Previous phase: **Phase 5 — Search and Discovery — CLOSED**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository. Historical implementation detail belongs in Git history, `DEVLOG.md`, accepted PRs/issues and timestamped evidence documents; this file stays focused on current canonical state and the single next step.

## Product and source-of-truth constraints
- Teevee is a premium, paid, ad-free TV-guide app for iOS and Android.
- Guide-first; no mandatory account for core Guide use.
- Expo SDK 57 / React Native 0.86 / React 19 / strict TypeScript.
- Light, dark and system appearance; accessibility and larger system text are product-quality requirements.
- Provider-independent Teevee EPG model; mobile never consumes/parses an external EPG provider directly.
- Deterministic fixtures remain mandatory after real data is introduced.
- Core Guide cannot depend on artwork/enrichment.
- `docs/VISUAL_BASELINE.md` plus `design/current/` select the accepted visual references. New visual exploration is not canonical until explicitly approved and merged.
- Accepted durable architecture contracts are ADR 0001 through ADR 0012. ADR 0010 is canonical for the classification sibling boundary, ADR 0011 for broadcast-keyed external-content identity and ADR 0012 for bounded durable EPG refresh orchestration. PR #173 proposes ADR 0013 for the local canonical channel-personalisation projection; it becomes canonical on merge.
- **Queued owner-approved next iteration:** expand the canonical channel catalog to the exact 49-channel set/order in `docs/CHANNEL_EXPANSION_TARGET_2026-09-24.md`. This is not the current implementation priority and must not interrupt the active external-content/artwork foundation.
- **Vanavond category discovery scope:** Films/Series/Sport are intentionally limited to the owner-approved 28-channel set in `docs/TONIGHT_PRODUCT_DEFINITION.md`; Jouw gids and Onze Kijktips are not channel-filtered, and no `populaire zenders / alle zenders` toggle is part of the accepted composition.
- **Active Search/channel-personalisation increment:** Issue #170 / PR #173 implements the separation between complete supported channel catalog and one shared persisted Mijn-zenders selection/order. Search remains full-catalog, opens hidden channels contextually without persistence mutation, exposes explicit add, and resolves only the approved finite channel-management intents. Contract: `docs/CHANNEL_PERSONALISATION.md`; evidence: `docs/TVGIDS_APP_SEARCH_CHANNEL_EVIDENCE_2026-09-24.md`. Phase 5A remains closed. The exact 49-channel production activation stays a separate next step.

## Phase status
1. **Phase 1A — Totaal interaction/technical baseline:** complete and physically accepted on iPhone. Totaal production visual design, implementation-ready specification and runtime production convergence are merged, owner-accepted and canonical.
2. **Phase 1B — Per zender / Nu & Straks:** complete and physically accepted on iPhone.
3. **Phase 2 — App Shell:** complete and physically accepted on iPhone.
4. **Phase 3 — Real Data Vertical Slice:** complete and physically accepted on iPhone. Real provider -> hosted ingest -> canonical persistence -> public typed read -> mobile canonical datasource is proven, including fixture-first startup, real-data transition, fallback and context retention.
5. **Phase 4 — Core Guide MVP hardening:** **CLOSED**. The 06:00 television-day foundation, television-day-aware runtime, D-2..D+7 navigation/date context, measured Totaal performance hardening, Per-zender production convergence, Programme Detail production convergence, Nu & Straks production convergence and Totaal production convergence are all merged. Totaal PR #114 completed the final open Guide convergence work: its runtime was owner-accepted on iPhone, independently QA-reviewed, its sole QA accessibility blocker was corrected and re-verified at the final Lead merge gate, exact-head CI #877 passed 72 test files / 538 tests plus iOS/Android/web exports, and merge commit `4cea66eca92b7224ff51940b30de09db11928427` landed on `main`. The cache decision remains **no persistent mobile schedule cache now** absent new measured evidence; true no-network cold start and any persistence technology decision remain a release-like Phase 9 gate. Physical Android interaction acceptance remains deferred until Android hardware is available and does not keep Phase 4 open.
6. **Phase 5 — Search and Discovery: CLOSED.** Kijktip, Guide Search and the first production Vanavond runtime are merged. PR #149 / issue #148 was accepted on exact head `4f1d29e2e1843adec33b2417ef14e312887545fd` after Technical Lead implementation review, owner **FINAL PHYSICAL REFINEMENT PASS** #5801613712 and **INDEPENDENT QA PASS** #5801947266; final Lead merge gate #5801975189 merged it as `f8df570b2dbf1c4fe35b35e02d9663252bb288b8`. The runtime preserves bounded active-evening reads, provider-independent classification, exact-broadcast Programme Detail ownership, the existing personal-state authority and production-usable no-artwork fallbacks. Physical Android interaction validation remains deferred under the project-wide hardware gate. TMDB/artwork remains future enrichment, not an unclosed Phase 5 blocker.

### Owner-priority inter-phase enrichment — Premium Artwork & Content Identity

Phase 5 remains **CLOSED**. This is not a Phase 5 reopen and does not change accepted Guide/Search/Vanavond product behavior.

Canonical research:
- PR #154 / `docs/PROGRAMME_EXTERNAL_IDENTITY_SOURCE_RESEARCH_2026-09-23.md` proves the current XMLTV source contains useful production year, episode and role-preserving credit evidence;
- PR #156 / `docs/TMDB_MATCHING_RESEARCH_2026-09-23.md` proves a narrow fail-closed matcher can resolve **44/45 Film** and **49/50 Series** reviewed broadcasts at high confidence, with zero known false-positive external IDs in the reviewed accepted tier;
- the product owner confirms the required commercial TMDB licensing for Teevee production use is arranged; the licensing gate is **CLOSED**. Production credential ownership, rate-limit/retry/caching design and compliance with the agreed TMDB contract terms remain implementation requirements.

PR #158 is merged on canonical main and supplies the minimum typed transient provider evidence needed by external matching without changing canonical `Programme`, Guide transport or mobile.

Issue #159 / PR #161 is **merged and deployment-complete at the database/runtime layer**. Final accepted head `708cb6f180c24755c9ff40b1b34cafabff6543b3` passed Independent QA (#5805450167) and the final Lead merge gate (#5805462778); merge commit `9188061d76e9a2f9a0a94e44e92323beffb823ef` passed exact-main CI #1244 with 112 test files / 875 tests, strict TypeScript/lint, iOS/Android/web exports and the main/release full-ABI Android build. ADR 0011 is now canonical: content identity remains a private broadcast-keyed sibling instead of changing `Programme.id` or introducing a generic catalogue.

Hosted persistence is deployed from reviewed migration blob `3cd8bbc2d0e6a1a7bb4320d0bc4510f0b543650e`; Supabase recorded remote migration `20260924010656_create_programme_external_content_reference`. `teevee.programme_external_content_references` is live with RLS enabled, service-role-only intended authority, SECURITY INVOKER/empty-search-path writers, exact-broadcast ownership triggers and 0 dangling rows at rollout. `epg-refresh` v10 is ACTIVE with the existing custom auth boundary; its returned deployed source bundle matches merge commit `9188061...` byte-for-byte. Full rollout evidence: `docs/EXTERNAL_CONTENT_IDENTITY_DEPLOYMENT_2026-09-24.md`.

Matching remains precision-first: Film requires year ±1 + director overlap and stronger people evidence for alternative/localized-title-only acceptance; Series uses full title first, cast support and coherent S/E when available, with only the empirically-proven stronger base-title/numbering-disagreement fallbacks. No TMDB episode ID is produced. Final QA also proved that malformed matching-critical TMDB schema cannot become deterministic positive or negative identity evidence, including full season-array validation before episode membership and exact non-padded Film `release_date` handling.

There is deliberately **no D0 historical bootstrap**. External identity forward-fills from authoritative complete current/future windows and remains attached as a broadcast ages into D0. Existing retained broadcasts may therefore have a temporary post-deploy warm-up gap. PR #152 remains owner-blocked evidence only: its dormant recovery migration/RPC is superseded for external-identity bootstrap and is not called by PR #161. Because that migration already exists in hosted history, any eventual retirement must be a separate forward cleanup after caller verification.

Issue #167 originally exposed a feed-wide XMLTV parsing blocker. Pre-#168 hosted evidence showed both full `guide-horizon` and an RTL4-only four-hour window dying at roughly the same CPU cost (2144/2165 ms) with ~182 MB memory. PR #168 is now **merged** as `6a9b601ae7e2cac8aa0c2c94302c5aa16411a76f` and its bounded streaming parser materially fixed that failure mode: the narrow RTL4 production path stores successfully at ~1279–1284 ms CPU and ~12–14 MB, and after the TMDB secret was configured the same scope resolved/persisted 3/3 eligible external identities with zero provider/persistence failures.

The required full-horizon smoke nevertheless exposed a second, distinct #167 blocker. Hosted v12 execution `e197a283-8494-4331-94a4-d89e10f52a32` reached the hard **2000 ms CPU** ceiling and returned HTTP 546 at only ~40.7 MiB memory after already committing 60 coverage rows (five complete television days × twelve channels). A realistic one-full-television-day/all-current-12-channel smoke then completed end-to-end at **1145 ms CPU / ~34.9 MiB**, stored 524 programmes, completed TMDB enrichment and persisted 33 references with zero persistence failures/orphans. This proves further parser rewriting is not the primary correction: one bounded day fits with meaningful headroom, while owning D-3..D+8 inside one Edge invocation does not.

PR #172 is the active server-only orchestration correction. Proposed ADR 0012 defines the candidate durable Guide unit as **provider source/feed × Amsterdam television-day × bounded channel group**. `guide-horizon` becomes a lightweight run planner; Postgres owns run/job identity, one common observation timestamp, source/day/group scope, attempts, retries and durable outcomes. Guide success is exact-scope: exact-set `stored` is direct success, while `ignored-stale` is only a stale-write signal. For stale results, the database-owned canonical child scope is verified atomically under the same per-channel advisory locks as ADR 0007: every expected channel must have gap-free full-window coverage at `generated_at >= parent observed_at`; otherwise the job is terminal `incomplete`. Same-observation earlier-attempt coverage and newer coverage are valid. Provider-partial, unattributed/no-safe input or a channel-local blocked subset is also terminal `incomplete`. Distinct six-hour request keys are always persisted rather than coalesced, Vault/dispatch-unavailable reasons are durable, and the **8-minute lease exceeds Supabase's current 400-second paid hosted worker maximum**.

ADR 0011 remains canonical and is preserved explicitly across the multi-invocation horizon: Guide children never call TMDB. A successful canonical stored observation may stage only its eligible current/future Film/Series tuple in the private orchestration row; the dispatcher gives all canonical Guide work priority and releases `external-content-work-item` only after Guide processing is terminal. A failed Guide run discards staged identity evidence without TMDB; a non-throwing `incomplete` run may later enrich only a safely stored authoritative subset.

Deferred external-content lifecycle is independently fail-open: durable `completed` now requires an available owner result with zero provider and persistence failures. Missing secret/owner unavailable, provider failures and persistence failures use the existing bounded retry machinery while keeping staged evidence. Retry success clears staging; three exhausted attempts produce external-content `failed` and clear staging. Guide authority is never rolled back or downgraded. Matcher thresholds, broadcast-keyed persistence and the 20 s per-attempt TMDB owner budget are unchanged.

The durable run envelope is **1024 work items**. The owner-approved worst case of 49 channels × 12 television days × group size one is **588 jobs**, now covered directly in both planner tests and the executable SQL lifecycle. Current NL capacity may still use all 12 channels in one group because that exact shape is production-measured; group size remains source-owned configuration. Source validation requires complete one-to-one canonical/provider mapping. Normal CI executes both the real canonical schedule-store migration and exact orchestration migration on disposable **PostgreSQL 17**, including mixed-scope stale rejection, partial newer overlap, same-observation retry acceptance only after full canonical proof, stale rollback safety and disjoint-group isolation, plus all previously established role, retry, Guide-before-TMDB, external-content and 588-job gates. PR #168 parser semantics, canonical Programme, classification and ADR 0007/0008/0010/0011 remain unchanged.

## Kijktip enrichment vertical slice — merged and deployed
The inter-phase Kijktip vertical slice is implementation-complete and merged. Do not reopen its accepted product, matching, persistence or Guide-presentation contracts without concrete regression evidence.

Merged foundations and implementation:
- **PR #120 — empirical TVgids.nl Kijktip matching research**, merged as `15261e3da8273efcb6e4e41d20ab3cb0f62acccf`. Canonical authority: `docs/TVGIDS_EDITORIAL_FEED_MATCHING_2026-09-22.md`. It establishes server-side deterministic fail-closed matching from `tips.rss` to canonical programmes and keeps editorial enrichment outside the provider-independent core `Programme` identity.
- **PR #126 — production editorial ingestion/transport foundation**, providing server-side RSS ingestion/matching, private `ProgrammeEditorialSignal` persistence, independent protected refresh, fail-open typed transport, selected-day signal ownership and separate mobile runtime editorial state without mutating canonical `Programme`.
- **PR #128 — owner-approved Kijktip editorial-label direction**, merged as `b0f2b458794741ad1e35b798120e50cecbfc43c3`.
- **PR #129 — final implementation-ready Kijktip label calibration**, merged as `0f43178382b8d313a668eabe4577e4c4ef303f29`; its semantic editorial tokens and Per-zender/Nu & Straks geometry remain the visual authority.
- **PR #127 — visible Guide wiring + persistence lifecycle correction**, exact accepted head `b9867105fdf331dcd6a920c71d0f5e637e3b232c`, merged to `main` as `6b11ee2fe4a5cbdf4012a680c2558b11b762d999`. Lead exact-head PASS, owner physical iPhone PASS and Independent QA PASS all applied to that same head.

PR #127 keeps the accepted Guide runtime frozen: Nu & Straks channel identity is bottom-aligned with unchanged reference/following geometry; Per-zender keeps time X24, surface X19/padding5/min48, standard Y2…50, current Y16…64 and title X100/right24; light/dark editorial surface tokens remain #EEECE7/#171715.

Persistence is deployed. The exact reviewed migration blob `c41b059f627406d12c684fa92a1e1179109d8dbe` is live in hosted project `eokszvpityhtysbwdduy`. The connected Supabase migration API recorded canonical remote version `20260922235737_preserve_started_editorial_signals`; repository closeout aligns the migration filename to that remote history. Live verification after deployment found **58 persisted TVgids signals**, matching `editorial_source_state.signal_count = 58`, **0 orphans**, and **exactly one** recovered signal for NPO 1 / `De slimste mens` / 22 September. Source freshness remained unchanged, and the live writer is SECURITY INVOKER with empty `search_path` and the reviewed pre-upsert reconciliation order. Evidence: `docs/EDITORIAL_PERSISTENCE_RECOVERY_2026-09-23.md`.

Rights status for this vertical slice is closed: the product owner confirms the intended Teevee Kijktip use of TVgids `tips.rss` is rights-cleared. That source is **not a Kijktip release blocker**. This does not change the separate Phase 8 production EPG-provider redistribution-rights gate or independent licensing/provenance requirements for channel logos and programme artwork.

Post-deployment physical iPhone verification is **PASS**: NPO 1 / 22 September / `De slimste mens` visibly shows the recovered `Kijktip` label from hosted data. The Kijktip vertical slice is therefore fully closed.

## Phase 5A — Guide Search — CLOSED
Canonical product contract: `docs/SEARCH_PRODUCT_DEFINITION.md`.

Frozen first-slice boundaries:
- direct retrieval of canonical programme broadcasts and channels;
- programme Search covers the exact D-2..D+7 television-day horizon;
- programme result answers what/where/when and opens exact-broadcast Programme Detail;
- channel result opens Guide → Per zender on that canonical channel;
- no universal streaming, people, genre, article, semantic/AI or fuzzy search in Phase 5A;
- repeats remain concrete broadcasts; do not create title-only catalogue identity;
- Kijktip may be shown as sibling metadata but is not a ranking signal;
- raw query text is not logged by default;
- full-horizon Search must not change the accepted Guide loading architecture by eagerly prefetching ten mobile schedule days.

Guide Search architecture is defined by ADR 0009 and merged in PR #132 as `3c7ebcf906ff64bb2b6b71c04d177a20519eb2a0`. The mobile Guide runtime remains unchanged: Search uses a dedicated hosted `GuideSearchApi` / `GuideSearchRepository` boundary, server-owned D-2..D+7 windows, one bounded canonical-store Search RPC, explicit `complete | partial | unavailable` programme coverage, bounded canonical broadcast/channel results, optional Kijktip enrichment and transient Programme Detail / Per-zender navigation intents. No full-horizon mobile prefetch or title-only catalogue identity is introduced.

The hosted boundary is **DEPLOYED AND LIVE VERIFIED**. Supabase recorded migration `20260923064120_create_guide_search_read_boundary` using the exact reviewed SQL blob `d232eacbf3b809d23ae9c4eeb9a15ea2ffc20380`. `guide-search` v1 and the shared-runtime `guide-schedule` v7 are ACTIVE and their deployed bundles match merge commit `3c7ebcf...` byte-for-byte. Production endpoint smoke CI #986 proved canonical channel Search (`NPO` → `nl-npo-1`) and concrete programme Search (`Goedemorgen Nederland` on NPO 1). Evidence: `docs/GUIDE_SEARCH_DEPLOYMENT_2026-09-23.md`.

Phase 5A is **CLOSED**. PR #134 implemented the mobile Search runtime and merged to `main` as `cbdf97ba09f59dd4ae4e019b2e60e51dc03bedde`. The accepted runtime uses one bounded live-query surface over the deployed `GuideSearchApi`: 220 ms debounce, AbortController + request-version stale-response ownership, explicit loading/partial/unavailable/complete-no-match semantics, concrete channel/broadcast results, quiet Kijktip sibling metadata, exact-broadcast Programme Detail reuse, process-local query/result continuity, 06:00 television-day rollover ownership and a one-shot Search → Per-zender handoff without rewriting the persisted Guide presentation.

Final acceptance evidence:
- owner physical iPhone PASS on the user-facing Search flows;
- Independent QA PASS on runtime head `0fe40bf96313903378d152a028136777b26d5d15`, including closure of the in-flight 06:00 rollover race;
- parallel Vanavond product-definition PR #136 was reconciled without any Search runtime/test delta;
- final reconciled PR head `742ed07ac156ae641560a08d62e99e4aaf3c996d` passed CI #1023 with **93 test files / 692 tests**, strict TypeScript, lint and iOS/Android/web exports;
- merge commit `cbdf97ba09f59dd4ae4e019b2e60e51dc03bedde` passed exact-main CI #1024 with the same **93 / 692** automated suite plus exports.

Search adds no full-horizon Guide prefetch, Search history, raw-query logging, fuzzy/semantic search, artwork dependency or new external state/cache dependency. Physical Android interaction validation remains deferred to Android hardware.

## Vanavond classification gate — COMPLETE

PR #137 / issue #135 completed the mandatory empirical Film / Series / Sport classification research against the real hosted canonical `guide-schedule` boundary. The authoritative research population covered D-2 through D+5 across all 12 active canonical channels: **3,932 returned canonical rows** and **1,114 unique broadcasts starting in [19:00,06:00)**. D+6/D+7 were correctly reported as `unavailable`, not empty.

The evidence establishes that current raw canonical fields are not a sufficient direct production classification contract:
- **Film — GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**: exact `Film` was precise in review but missed proven feature films under `Drama`;
- **Serie — GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**: the explicit series genres were precise, but scripted series also occur under generic/audience genres; `Kinderen` contains a material scripted-series collision;
- **Sport — GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**: exact `Sport` mixes full events, highlights/summary and historical sport documentary/magazine;
- `isLive` and `isRepeat` were both undefined for all 1,114 researched evening broadcasts, so absence is not negative evidence.

The future classifier/enrichment must be centralized and provider-independent, prefer structured source evidence such as the full category set, preserve tri-state live/repeat semantics, and fail closed on unknown classification. No production category module may implement current provider vocabulary directly in UI code.

`Series vanavond` product scope is now frozen: **scripted episodic series for a general/mainstream audience**. Programming primarily intended for children, including the researched `Bluey` / `Marvel's Spidey and His Amazing Friends` examples, is excluded from this module in v1. This is a semantic product decision; implementation must not turn raw provider `Kinderen` into the classifier itself.

## Vanavond classification/enrichment foundation — MERGED, DEPLOYED AND LIVE VERIFIED

Issue #142 / PR #144 merged to canonical main as `ca738e3c80d714ad6f95833554c6319674647fdb` and remains intentionally foundation-only: no production Vanavond category UI, artwork/TMDB or recommendation runtime was added.

ADR 0010 is canonical and freezes the classification boundary:
- canonical `Programme` remains unchanged;
- server-only `ExternalProgramme` preserves the complete provider category set, structured episode-number evidence and only minimal director-credit presence before canonicalization;
- one central provider-specific evidence interpreter produces provider-independent `ProgrammeClassification` semantics;
- unknown/ambiguous classification fails closed;
- Film eligibility requires high-confidence film semantics;
- Series eligibility requires high-confidence scripted episodic + general/mainstream audience;
- Sport eligibility requires high-confidence event/highlights subtype;
- live/repeat are explicit tri-state `true | false | unknown`;
- private `teevee.programme_classifications` is keyed to concrete canonical `programme_id` with cascade lifecycle;
- classified replacement wraps the existing ADR-0007 schedule transaction so re-ingest, start-time correction/rekey, deletion and stale-write ownership stay atomic;
- Guide schedule transport remains unchanged;
- future Vanavond reads use a separate bounded `programme-classifications` semantic API rather than raw provider categories or eager Guide-horizon prefetch.

Current-provider evidence for the mapping is recorded in `docs/TONIGHT_CLASSIFICATION_SOURCE_EVIDENCE_2026-09-23.md`. Independent raw capture run `35856096847` proved 60.47% of 3,372 mapped rows carry multiple categories and 69.25% carry episode metadata, while live/repeat/new/premiere evidence remained absent. The first exact-classifier live run exposed an over-broad generic-Series inference; Lead review #5794926935 then caught a second confidence bug where broad inference blockers were reused as positive `other/high` evidence. That blocker remains closed. Lead review #5795818040 then caught one remaining orthogonal-certainty bug: children-audience evidence itself still promoted unresolved content to `other/high`.

The second correction keeps `Kinderen` / `Kids En Familie` as audience evidence only. Exact-live run #1 / `35868756695`, job `107206994998`, keeps Film 36 / general-mainstream Series 99 / semantic Series 182 / Sport 3 unchanged and moves exactly one further evening row from `other/high` to `unknown/unknown` (other 620, unknown 118). Of 91 children-audience rows, 83 are semantic Series/high, 7 are other/high from independent strong non-scripted evidence, and 1 is unknown/unknown. Bluey and a Spidey row with explicit S/E remain semantic children Series; NOS Jeugdjournaal remains children + `other/high` because `Nieuws` proves the non-scripted family. The researched `Spencer Sisters`, `Best Medicine`, `Missie Aarde`, `Poirot` and `Aspe` boundaries remain Series-eligible; `Sluipschutters` remains unknown. Normal CI remains deterministic/network-free after disposable probe removal. Disposable PostgreSQL 17 smoke run #1 / `35855629562`, job `107163296515`, executed the real base schedule migrations plus the new classification migration and passed the lifecycle assertion block before `ROLLBACK`.

Hosted rollout is complete. Exact-main CI #1072 passed 100 test files / 727 tests plus exports and the main/release full-ABI Android build. The reviewed migration blob `f39e728b2098806f31b237319396436fc0a4e618` is live; hosted history records `20260923144656_create_programme_classification_foundation`, which repository closeout aligns by filename. `epg-refresh` v7 and `programme-classifications` v1 are ACTIVE and their deployed runtime files match merge SHA byte-for-byte. Protected refresh request 118 returned HTTP 200 and authoritatively backfilled every source-complete D+1..D+5 television-day window: 2,358 distinct canonical programmes, 2,358 classification siblings, 0 missing, 0 outside-scope and 0 orphans. Temporary live-smoke run `35878911866`, job `107241960510`, proved the public typed read for real Film/Series/Sport rows and rejected a 257-ID request with HTTP 400. Full evidence: `docs/TONIGHT_CLASSIFICATION_DEPLOYMENT_2026-09-23.md`.

## Vanavond first production runtime — MERGED AND PHYSICALLY ACCEPTED

Issue #148 replaces the placeholder with one finite production Vanavond surface in the frozen order **Jouw gids → Onze Kijktips → Films vanavond → Series vanavond → Sport vanavond**. The runtime is deliberately independent from the accepted Guide runtime: it performs one bounded active 06:00→06:00 `guide-schedule` read, consumes the sibling Kijktip signals already returned with that bundle, and sends only current/future [19:00,06:00) broadcast IDs to the bounded `programme-classifications` API. It does not install data into `guideScheduleRuntime`, preload D-2..D+7, classify from mobile provider fields, or make per-card network requests.

Discovery uses only concrete canonical broadcasts and the deployed provider-independent classification helpers. Missing/ambiguous classifications fail closed. Discovery items disappear after real `endAt`; Jouw gids is local-first, keeps ended saved broadcasts through 06:00 with `Afgelopen`, shows `Nu` for current broadcasts, resolves Programme Detail only by exact canonical `Programme.id`, and leaves unresolved local snapshots visible but non-actionable. The shared 30-second Guide clock drives current/ended transitions while request-version + television-day ownership rejects late old-day responses after the exact 06:00 rollover.

`ProgrammePersonalState` is upgraded **in the existing store** from schema v1 to v2 by adding durable `hasUsedSave`. Existing valid saves/reminders are preserved. A retained v1 save proves prior Bewaar usage and migrates to `hasUsedSave=true`; an empty v1 record cannot prove historical usage and conservatively migrates false. Every successful new Bewaar action permanently sets true; later unsave-all and reminder changes never reset it. Corrupt/unsupported records still fail safely. No second personal-state store or storage key/file is introduced.

The runtime deliberately ships with the frozen no-artwork fallbacks only: Kijktip 168×94.5, Film 108×162, Series 96×144 and Sport 220×112 at base scale. No TMDB/artwork provider is present. Acc Design Refinement comment #5799845708 previously corrected Sport Dynamic Type: `fontScale <= 1.35` stays fixed 220×112 with a compact two-line title, while `>1.35` treats the landscape height as a minimum and removes the Sport title cap.

Physical review comments #5800174670 and #5800351843 add two narrow convergence corrections without changing production eligibility/runtime architecture. Kijktip now follows the written base-density contract exactly: `fontScale <= 1.35` keeps 168×94.5 media, 15/19 title and 14/18 metadata with at most two title lines using tail truncation; `>1.35` removes that compact cap. Development-only refinement tooling now also owns typed semantic overlays on concrete active-day broadcasts before the normal `buildTonightViewModel` path: **Series ≥12** seeds concrete schedule broadcasts as dev-only scripted/mainstream Series and deterministically repeats normal Series cards to density only when fewer than 12 exist, while **Alle modules** guarantees a concrete Kijktip + Film + Series + Sport for physical inspection. Live/Primetime remain real runtime data; Zonder Sport and Geen discovery remain explicit omission states. These overlays never mutate hosted/runtime source arrays, production classification, API/backend data or Programme Detail ownership.

Final acceptance is complete on exact head `4f1d29e2e1843adec33b2417ef14e312887545fd`: exact-head CI #1125 passed **106 test files / 770 tests**, strict TypeScript, lint and iOS/Android/web exports; owner final physical iPhone acceptance is recorded in #5801613712; Independent QA PASS is #5801947266; final Lead merge gate is #5801975189. PR #149 merged as `f8df570b2dbf1c4fe35b35e02d9663252bb288b8`. No hosted/backend deployment is required for this mobile runtime increment because it consumes the already-deployed schedule/editorial/classification boundaries. Post-merge exact-main CI #1126 / run `35912892341` is **SUCCESS** on merge commit `f8df570b2dbf1c4fe35b35e02d9663252bb288b8`: classify PASS, quality PASS, **106 test files / 770 tests PASS**, strict TypeScript/lint PASS and iOS/Android/web exports PASS; Android native was correctly skipped for the runtime-ui change class.

## Frozen television-day and Guide-horizon semantics
ADR 0008 is canonical:
- television day = **06:00 Europe/Amsterdam -> 06:00 next local day**;
- midnight is not a Guide boundary;
- 00:00–05:59 belongs to the preceding television day;
- canonical programme timestamps remain UTC instants;
- Totaal and Per zender support **D-2 through D+7**: ten complete television days;
- `Nu` restores the actual instant and the television day containing it;
- Nu & Straks uses the current television day and has no independent date selector;
- hosted schedule reads remain independently bounded; do not replace them with an eager ten-day payload;
- Phase 8 production-provider selection must prove horizon, history/retention, freshness and redistribution rights.

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics without concrete regression evidence.

### Totaal
- two-dimensional horizontal-time / vertical-channel Guide;
- real schedule-duration geometry;
- compact shared D-2..D+7 day selector and separate `Nu` action;
- visible date context derives from the stable viewed-time/scroll anchor;
- native horizontal inertia/bounce and directional lock; normal Totaal vertical scrolling/fling/deceleration remain native, but Totaal vertical endpoint overscroll/rubber-band is intentionally disabled so only the schedule/channel canvas cannot displace beneath fixed functional chrome; this exception does not apply to Per zender or Nu & Straks;
- accepted partial-left-title and time-axis readability behaviour;
- programme cells are horizontally windowed around the actual viewport with conservative overscan; programme-window ownership during animated scrolling follows the native viewport rather than jumping ahead of it.

### Per zender
- chronological fixed-row programme list: standard rows 52 pt and actual-current row 176 pt at base scale; programme duration never changes row height or Y position;
- selected rail logo is the sufficient visible channel identity in both expanded/rest and condensed states; no selected-channel text is rendered outside the persistent rail;
- horizontal adjacent-channel paging preserves the semantic viewed-time anchor where practical;
- persistent/browsable 48×48 channel strip with direct selection; rest rail 72 pt and settled condensed rail 60 pt;
- temporal context is always one 52-pt date + `Primetime` + `Nu` row: expanded gaps are **4 pt** strip→context and **24 pt** context→schedule, settled condensed gaps are 0/0; Per-zender date/Primetime/Nu are one line with `maximumFontSizeMultiplier = 1.20`, while programme content keeps substantive Dynamic Type;
- PR #81 fixed-native-viewport/collapse-isolation is frozen: full visual contraction 140 pt, native collapse distance 56 pt and visual compensation 84 pt; no per-frame normal-flow mutation above the active vertical schedule ScrollView;
- canonical local channel-logo registry is wired for NPO 1/2/3, RTL 4/5 and SBS6, with identical text fallback geometry for channels without a local asset;
- once canonical broadcaster identity is established, non-current day loading/unavailability preserves that channel catalogue and never transiently replaces it with the generic deterministic fixture; the generic catalogue remains valid only in true fixture mode;
- shared date context plus semantic `Primetime` and `Nu` controls; active/current state derives from the stable programme/timestamp anchor and Nu wins on overlap;
- `Primetime` = 20:30 on the selected television day;
- Programme Detail round-trip preserves relevant context.

### Nu & Straks
- canonical production specification is `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`, established through PR #93, refined by PR #97 and PR #100, and finalized from physical iPhone evidence through owner-approved PR #102;
- shared reference instant across channels; live mode uses the exact actual instant/minute and is never semantically rounded to a rail target;
- browse navigation settles in **15-minute** increments across the canonical 06:00–06:00 television day; whole/half hours show labels plus **1×10 pt** `railTick` marks, quarter hours use unlabeled **1×6 pt** `railTick` marks, and the **2×12 pt** `currentTime` marker remains strongest;
- semantic `railTick` is light **#80807A** / dark **#72726B**; whole/half opacity **1.00**, quarter opacity **0.78**;
- the horizontal rail-bottom line is **1 pt `railTick` at opacity 0.78**, exactly matching the approved quarter-hour ticks; generic `border` is not used for that line;
- there is **no standalone visible reference-time copy** in live or browse mode and no empty lane reserved for it; the rail carries visible temporal orientation while the exact reference instant remains semantic state;
- `Nu` active/current and return-to-live are materially distinct states; `Primetime` remains the 20:30 shortcut on the active television day;
- shared Guide tabs remain **48 pt / one line through fontScale 1.35** and **64 pt / max two lines above 1.35**, retaining the 1.20 compact-label cap;
- Nu & Straks keeps one **52-pt utility-only Primetime/Nu context + 52-pt rail = 104-pt persistent functional stack at all font scales**; Larger Text does not reintroduce a reference-time lane;
- native collapse distance remains **56 pt**; responsive GuideChrome compensation remains **44 pt standard / 60 pt Larger Text** and stable visible channel/list anchors are preserved;
- while Nu & Straks remains live, crossing to a new nearest-quarter rail target recentres the rail exactly once while the semantic reference continues to follow the actual minute; entering native browse/drag relinquishes live recenter ownership synchronously so clock updates never fight drag or momentum;
- when an established channel catalogue is retained during temporary schedule unavailability, retained channel identities expose their full display names to VoiceOver/TalkBack because no programme actions carry that identity; normal schedule-present rows keep channel identity out of the accessibility focus order to avoid redundant stops;
- stable vertical channel context while reference time changes;
- reference programme + exactly three following programme slots; no visible reference-programme `tot HH:MM` metadata, while full times remain in accessibility/Programme Detail;
- default reference block remains minimum **64 pt**, but the title is bottom-aligned with **0 pt extra bottom inset**; dedicated reference→following gap is **0 pt**;
- channel bottom padding is **12 pt**, preserving normal channel-row totals of **216 pt iOS / 228 dp Android**;
- following programme targets remain directly adjacent, non-overlapping minimum **44 pt iOS / 48 dp Android**; at standard text, visible content uses proportional target-slack offsets **#1 = 2/3 / #2 = 1/3 / #3 = 0**, yielding ~16-pt iOS / ~18–19-dp Android visible gaps, while Larger Text remains vertically centred;
- above fontScale 1.35, following content remains substantive/uncapped and uses the physically accepted inline time+title composition with maximum two visible lines; stacked time-above-title is only the extreme fallback when **fontScale >2.0 AND programme width <180 pt**;
- dark mode, Larger Text composition, 15-minute rail/ticks, Nu/Primetime, vertical-position preservation and the accepted native rail fling/settle interaction are physically accepted and frozen;
- Nu & Straks uses the shared Guide shell;
- `NowNextGuideView` stays behind deferred `import()`; do not restore a static startup import without separate physical evidence.

## Programme Detail
- production convergence is merged and closed through PR #92;
- direct from all three Guide presentations; no intermediate preview sheet; the originating Guide remains mounted and round-trip context is preserved;
- action scope is `Herinner mij` + `Bewaar`; Share is not required;
- `Herinner mij` uses the canonical five-minute lead time, with immediate fallback inside the final five minutes and no reminder after programme start;
- local personal state is provider-independent; reminder scheduling/cancellation is isolated behind the notification boundary;
- Android 12+ exact-alarm scheduling uses `SCHEDULE_EXACT_ALARM`, verifies special-access capability before scheduling, fails closed when capability is unavailable/indeterminate, and preserves cleanup metadata when native cancellation cannot be confirmed;
- contextual sticky action copies, measured hysteresis, Dynamic-Type-safe action stacking, safe-area ownership and handle-zone swipe-to-dismiss are production behaviour.

## Phase 4 accepted implementation ledger
- **PR #62** — television-day domain foundation. Merged and CI-proven.
- **PR #64** — mobile television-day runtime boundary. Merged, independently QA-reviewed, physically accepted on iPhone; post-merge CI green.
- **PR #66** — D-2..D+7 Guide day navigation. Merged, independently QA-reviewed, physically accepted on iPhone; post-merge CI green.
- **Issue #67** — cold Guide day-switch measurement. Completed. Measurement identified Totaal React/render + large-grid commit/mount work as the dominant bottleneck, not network, fixture alignment or the native selector modal.
- **PR #71 / issue #70** — removed repeated synchronous Totaal hot-path work by reusing the Amsterdam formatter and indexing programmes by channel. Merged; issue #70 completed.
- **PR #74 / issue #73** — bounded horizontal Totaal programme-cell windowing. Final exact production head `0a6e98661ec3ca0af9722ab2786146101779cca2` passed independent QA and focused physical iPhone acceptance. Merge commit on `main`: `e2efe46d140b4c56906ba75ef1c8d6d2f66c50b9`. Post-merge CI #420 completed successfully. Issue #73 completed.
- **PR #81** — Per-zender fixed-row convergence and scroll-jank hardening. Merged after physical iPhone validation and independent QA. Established 52-pt standard rows, 176-pt current row, semantic anchor preservation, stable canonical channel identity and the fixed-native-viewport/collapse-isolation architecture.
- **PR #86** — accepted Per-zender compact temporal-context refinement. Merged documentation/design baseline: no selected-channel text outside the rail; fixed 52-pt temporal context; one-line 1.20-capped date/Primetime/Nu; 72→60 rail; 140/56/84 contraction architecture endpoints. Its initial expanded spacing calibration was later superseded by PR #89.
- **PR #89** — owner-approved final Per-zender expanded spacing after physical iPhone calibration: **4 pt rail→context / 52 pt context / 24 pt context→schedule**, condensed 0/52/0. The 28-pt expanded gap sum and frozen 140/56/84 collapse geometry remain unchanged.
- **PR #88** — Per-zender runtime convergence to the accepted compact temporal context plus iOS safe-area and selected-channel schedule-height/trailing-whitespace fixes. Final exact implementation head `0f3ccb3f00fecc3229f32dae9521d1bb6254f830` passed physical iPhone validation and Independent QA. Merge commit `6521da61159583d39dc55fe1e1cccabf5176251a`; post-merge CI #596 completed successfully.
- **PR #91** — owner-approved canonical Programme Detail production design specification. Merged before runtime implementation.
- **PR #92** — Programme Detail production convergence. Final exact implementation head `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf` passed physical iPhone validation and Independent QA after reminder lifecycle/concurrency hardening. Merge commit `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b`; post-merge CI #650 completed successfully, including the main/release full-ABI Android build. Physical Android exact-alarm special-access interaction remains deferred to Android hardware.
- **PR #93** — owner-approved Nu & Straks production design specification. Exact design head `18ee2b81357819b39ee35b9196d7f984ad59e9b7`; merge commit `21e1e61b950046fd0e77308be5a64d09721e6310`; post-merge docs/design CI #654 completed successfully. Runtime implementation remains a separate HIGH-risk increment.
- **PR #97** — owner-approved Nu & Straks temporal/density refinement after physical iPhone review evidence. Exact design head `d0834ce2f25ec25c9e969354bc5241790960e10a`; merge commit `8b838fc71e2dd3aea601731defb11e9680a5d99b`; post-merge docs/design CI #677 completed successfully. It supersedes the earlier Nu & Straks production calibration only for the explicit 15-minute rail/tick, reference-copy, Nu-state and default-density metrics recorded in the canonical specification. At that point, open runtime PR #96 still required reconciliation before physical acceptance could resume.
- **PR #100** — owner-approved Nu & Straks physical accessibility refinement after rejection of PR #96 exact head `32db9459d265e8546c7137baf82e623f015ad652`. Exact design head `d2ece22771b35f369d40e58a51f8b85ffb461933`; merge commit `319e3caad758d0d7b511f2a01180ad91847a293f`; post-merge docs/design CI #695 completed successfully. It introduces dedicated `railTick` contrast, responsive shared Guide tabs/reference-context geometry, inline larger-text following composition and clustered visible following rhythm while preserving minimum touch targets and the frozen Nu & Straks interaction model. At that point, PR #96 required another reconciliation before physical acceptance could resume.
- **PR #102** — owner-approved final Nu & Straks physical-composition refinement after partial physical acceptance of PR #96 exact head `224e7df1d47dbb5c42694cb36469de673496e7d5`. Exact design head `67a15db6e7f325247ca49bc95e34811449cd1729`; merge commit `778445acbf8f71b1383fdede4178f861e4074f62`; post-merge docs/design CI #725 completed successfully. It removes all standalone visible reference-time copy, fixes the rail-bottom line to 1-pt `railTick` @0.78, and tightens reference→following composition through bottom-aligned reference titles plus a 0-pt dedicated transition while preserving 216/228 row totals and independent 44/48 following targets.
- **Final standard-text density micro-refinement (owner physical evidence on PR #96 head `3cafcc6bee996eb1923549bb3b65fdabb6666262`)** — the remaining standard-text following-density issue was resolved with proportional target-slack offsets #1=2/3, #2=1/3, #3=0 while Larger Text remained frozen and centred. The resulting implementation was carried through the final PR #96 production convergence.
- **PR #96** — Nu & Straks production convergence. Final exact implementation head `f7e88a4a2cb3a212d59a4827e7f28c1e2e665975` passed exact-head CI #753 (64 test files / 448 tests), full owner physical iPhone acceptance and Independent QA after the two final correctness fixes: live nearest-quarter rail advancement without fighting native browse/momentum, and accessibility-preserving retained channel identities during schedule unavailability. Merge commit `b0df0cc08f565aa1a36edf794e60ced0f391f67c`; exact-main CI #754 completed successfully, including the main/release full-ABI Android build. Physical Android interaction remains deferred to Android hardware.
- **PR #110** — owner-approved Totaal production visual baseline. Canonical board: `/Teevee/Totaal production design - light dark expanded condensed.png` (Library file id `file_00000000aafc8230b3218e6577a1d912`). It freezes Totaal production composition/hierarchy while preserving the already proven interaction/data/performance architecture.
- **PR #112** — owner-approved Totaal implementation-ready production visual-convergence specification. Exact design/spec head `6c68202bce249c8eff2e198699e2a582bce55ede`; merge commit `4638f0574c60f3ad2f0d723c55a9291c9aff1e29`; post-merge docs/design CI #784 succeeded. It freezes the exact 84/76/3.00 schedule calibration, 52+44=96 persistent functional stack, 100/116 shared GuideChrome, 56 native collapse with 44/60 compensation, Dynamic Type formulas, Totaal channel/time-axis/current-marker/programme typography contracts, edge cases and physical acceptance criteria. PR #111 was an earlier superseded review proposal and was closed unmerged.
- **PR #114** — Totaal production convergence. Final PR head `b054aac298ca9cdb37240881172db5d2ac6a4cf6` preserved the owner-approved visual/interaction/data contracts and closed the final production-refinement/accessibility blockers. Owner physical/product iPhone acceptance is recorded on the accepted runtime line; Independent QA reviewed the production candidate and identified one ChannelIdentity subtree blocker, which was corrected before merge and independently verified closed by the final Lead merge gate. Exact-head CI #877 / run `35753152718` passed strict TypeScript, lint, **72 test files / 538 tests** and iOS/Android/web exports. Merge commit `4cea66eca92b7224ff51940b30de09db11928427` closes the remaining Phase 4 Guide production-convergence work.
- **PR #78** — superseded early Guide visual-convergence implementation proposal. Closed unmerged after later canonical Per-zender/Totaal production design and convergence work replaced its calibration and gate path.

- **PR #116 / PR #117 — Guide EPG television-day horizon correction + Edge boot hotfix.** PR #116 corrected the development refresh to independent 06:00 Europe/Amsterdam D-3..D+8 television-day windows while preserving D-2..D+7 as the product horizon and keeping partial provider windows non-authoritative. Its first live Edge deployment exposed a pre-handler `BOOT_ERROR`; PR #117 hardened the new runtime module-resolution path and merged as `c875922225e27c825fa9b0c6cbde2d08b8d22205`. Exact-main CI #839 succeeded; live `epg-refresh` v6 request 88 returned HTTP 200; canonical D0..D+5 coverage was materialised for all 12 development channels; incomplete surrounding provider windows were safely skipped; Supabase migration history was reconciled to canonical repo timestamps. Physical iPhone smoke closed the original Totaal regression: horizontal Vandaag→Morgen and explicit Morgen selection both show data. On the observed provider snapshot, 26 September is the first unavailable Totaal selected day because Totaal requires D+5 plus following D+6 continuity and D+6 is provider-partial; this does not change the production D-2..D+7 requirement. Evidence: `docs/PHYSICAL_EVIDENCE_2026-09-21_EPG_HORIZON.md`.

## Phase 4 performance evidence
Original issue #67 physical baseline for cold Totaal day switches:
- median tap -> selection commit: ~1356 ms;
- median tap -> first-frame proxy: ~3683 ms.

After PR #71:
- median tap -> selection commit: ~1012 ms;
- median tap -> first-frame proxy: ~2332 ms.

Focused PR #74 physical proof before the final animated-`Nu` correction:
- median tap -> selection commit: **290.7 ms**;
- median selection commit -> first-frame proxy: **179.9 ms**;
- median tap -> first-frame proxy: **475.1 ms**;
- aggressive horizontal fling/bounce showed no blank programme-cell gaps.

Independent QA then found one blocking animated same-window `Nu` ownership case. Development corrected it so animated programmatic scrolling leaves programme-window ownership tied to actual native scroll offsets. QA re-reviewed the final exact head with the blocker closed. Final focused physical iPhone acceptance passed Totaal day-switch responsiveness, animated same-window `Nu` continuity, hard horizontal fling/bounce and normal Guide scrolling. No persistent cache, eager horizon prefetch, provider/data-contract change, new dependency or full FlatList/FlashList virtualization was introduced.

## Phase 4 closeout
- **Phase 4 is CLOSED.** PR #114 merged the last open Guide production-convergence increment after owner physical/product acceptance, Independent QA evidence plus closure of its sole accessibility blocker, and final Lead merge approval. No Guide production-convergence implementation remains open.
- no persistent mobile schedule cache is selected for Phase 4; issue #67/#70/#73 evidence identified render/mount work rather than network/cache as the dominant cold Guide bottleneck, and the accepted bounded-rendering fixes resolved that path without cache/prefetch architecture;
- current graceful degradation remains deterministic fixture-first rendering plus preservation of usable in-memory runtime schedule state across failed refreshes;
- PRODUCT's MVP-level local caching/graceful-offline requirement remains a release requirement, but true no-network cold start and the concrete persistence technology decision are deferred to release-like Phase 9 evidence outside Expo Go;
- physical Android interaction acceptance remains open/deferred until an Android device is available and is not represented as passed.

## Canonical visual handoff
`docs/VISUAL_BASELINE.md`, `design/current/` and the accepted Guide visual-convergence documentation are the source of truth for visual implementation. Current runtime appearance is not automatically the accepted visual target. Do not mix unapproved brand explorations into production implementation.

For Totaal, the **production visual design, production specification and production runtime are owner-approved, merged and canonical**. PR #114 is the accepted runtime convergence; canonical composition is `/Teevee/Totaal production design - light dark expanded condensed.png` (`file_00000000aafc8230b3218e6577a1d912`); `design/current/guide/TOTAAL.md` is the accepted design manifest and `docs/TOTAAL_VISUAL_CONVERGENCE.md` is the exact implementation authority. Frozen interaction/data constraints remain intact: 2D time/channel navigation, real programme geometry, shared day selector + `Nu`, native horizontal inertia/bounce/directional lock, normal native vertical scrolling/fling/deceleration with Totaal-only endpoint overscroll disabled, Programme Detail context, Instrument Sans and the proven performance/windowing architecture. Canonical physical refinements also include text-free individual microcells throughout the unchanged `< 48 × S` classification, shared repeated-run titles only from visible `48 × S`, the current marker's 38-pt readable label box + 5/5 padding (48-pt base outer body /56 pt at compact cap) with exact-minute pointer independence, wall-clock-aligned Guide clock ticks, intrinsic one-line Totaal date/Nu allocation, and left-edge masking that keeps sticky title text hidden until a padding-aware outer remainder leaves at least the scaled 48-pt base inner readability budget after active programme padding.

## Android status
Physical Android interaction acceptance remains OPEN/DEFERRED because no Android device is available. CI proves Android JS/native export, clean prebuild and debug APK compilation, not system Back, nested-gesture feel or device performance.

## Deferred / later gates
- true offline cold-start validation in a standalone/dev build rather than Expo Go;
- release-like performance outside Expo Go;
- production EPG/artwork rights/SLA and D-2..D+7 horizon proof; channel-logo provenance is repository-managed in `docs/CHANNEL_LOGO_ASSETS.md`;
- provenance-checked dark-background variants for RTL 4, RTL 5 and SBS6 remain required before those marks can pass final dark-mode visual acceptance; do not recolour or fabricate them;
- pricing/trial/paywall and subscription implementation;
- production typography licensing;
- optional future Vanavond artwork enrichment only after a central typed/provider-independent artwork contract resolves matching, rights, provenance and caching;
- physical Android validation.

## Current next step
**Complete Development, Technical Lead review and Independent QA for issue #167 / PR #172 — durable bounded EPG refresh orchestration.** No hosted migration/cron/Edge mutation is allowed during Development. After merge and exact-main CI, apply the reviewed orchestration migration first (safe with existing v12), then deploy the exact merged `epg-refresh`; trigger one protected `guide-horizon` run and prove every source/day/group Guide job reaches the expected terminal authority, no TMDB work starts before Guide completion, the deferred external-content lifecycle reaches terminal state with staging cleared, and there is zero stale/dangling corruption; finally require the next normal six-hour cron run to complete independently. Do not resume artwork-selection/transport work until this production path is closed.

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md`, this file, `docs/PROGRAMME_EXTERNAL_IDENTITY_SOURCE_RESEARCH_2026-09-23.md`, `docs/TMDB_MATCHING_RESEARCH_2026-09-23.md`, `docs/TONIGHT_PRODUCT_DEFINITION.md`, `docs/TONIGHT_VISUAL_CONVERGENCE.md`, `design/current/TONIGHT.md`, `docs/SEARCH_PRODUCT_DEFINITION.md`, `docs/PRODUCT.md`, `docs/UX.md`, `docs/ARCHITECTURE.md`, `docs/DATA.md`, `docs/ENGINEERING_QUALITY_POLICY.md` and `docs/BUILD_SPEC.md` before changing the repository. Phase 4 and Phase 5 are CLOSED. Owner priority is the inter-phase Premium Artwork & Content Identity enrichment before Phase 6 Personal Features. Preserve the accepted Guide/Search/Vanavond architecture, the 06:00 television-day model, provider-independent domain boundaries and the existing ProgrammePersonalState authority. Do not introduce direct mobile TMDB/raw-provider category logic, broad content-catalogue abstractions or duplicate save/reminder persistence. Physical Android interaction validation remains deferred until Android hardware is available.
