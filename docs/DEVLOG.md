# Teevee Development Logboek

## 23 september 2026 — PR #144 children audience/content-type certainty corrected

Technical Lead exact-head review #5795818040 found a second, narrowly scoped certainty conflation after blocker #5794926935 had been closed: `Kinderen` / `Kids En Familie` audience evidence still caused unresolved programme families to become `contentType: other / confidence: high`.

Development now keeps audience and content-type certainty independent:
- children-audience evidence alone yields `audience: primarily-children` without proving a content family;
- when no target family or strong positive non-scripted format is proven, content type/confidence fail closed to `unknown/unknown`;
- `Kinderen + Nieuws` remains `other/high + primarily-children` because `Nieuws` proves the non-scripted family;
- `Kinderen + Animatie + Sx Ey` and explicit scripted-form + children evidence remain semantic scripted Series/high and are excluded from `Series vanavond` by audience;
- strong scripted-vs-non-scripted conflict precedence, the previous broad-context fix, Film, Sport and live/repeat semantics are unchanged.

Deterministic tests add the ambiguous `Kinderen + Komedie + S1 E3` boundary, positive children+Nieuws evidence, explicit scripted children and a `Dramaseries + Reality` strong-conflict case while retaining the existing animated-children and previous Lead regressions.

Disposable exact-classifier live revalidation run #1 / `35868756695`, job `107206994998`, passed over the same 36,597,644-byte mapped source and 965 evening rows. Film/general-Series/semantic-Series/Sport remain **36 / 99 / 182 / 3**. Exactly one row moves from `other/high` to `unknown/unknown`: other **621→620**, unknown **117→118**. The 91 children-audience rows now split into 83 series/high, 7 other/high with independent positive non-scripted evidence, and 1 unknown/unknown. Bluey and an explicit-S/E Spidey row remain semantic children Series; NOS Jeugdjournaal remains children + other/high. The sole current children ambiguity is another Spidey broadcast with only `S3`, which now preserves its known children audience while content type fails closed.

Classifier blob under the successful live probe is `763b844db21c806415c7a3d877e709e4635842cd`. The classification migration remains untouched at `f39e728b2098806f31b237319396436fc0a4e618`; no new PostgreSQL execution is required. The temporary network workflow is removed from the final branch before exact-head CI.

**Next gate:** final exact-head CI on the no-probe head, then Technical Lead exact-head re-review. Do not merge, deploy or send to Independent QA before Lead PASS.

---

## 23 september 2026 — PR #144 Lead Series-confidence blocker corrected

Technical Lead review #5794926935 found a semantic certainty bug after the initial classification handoff: `GENERIC_SERIES_BLOCKER_CATEGORIES` correctly prevented unsafe generic scripted-Series inference, but the same broad set was also reused as positive `other/high` evidence. That violated ADR 0010's fail-closed contract because “Series not proven” does not imply “other proven”.

Development corrected only this Series confidence boundary:
- strong non-scripted format evidence remains eligible for `contentType: other / confidence: high`;
- broad context/subject categories remain generic-Series inference blockers only;
- ambiguous rows now stay `unknown/unknown`;
- strong explicit scripted categories still survive broad subject/context labels unless a strong non-scripted format conflict exists;
- Film, Sport, child-Series semantics, persistence, API boundaries and Guide isolation are unchanged;
- no title whitelist/blacklist was introduced.

Deterministic regression coverage now proves:
- a `Komedie + Entertainment + S5 E3` ambiguity is neither Series-eligible nor `other/high`;
- `Reality`, `Documentaire`, `Nieuws` and `Talkshow` remain positive `other/high` evidence;
- `Sitcoms + Politiek` and `Misdaaddrama + Entertainment` remain scripted/high.

Disposable exact-implementation live revalidation run #1 / `35862210491`, job `107184911263`, passed against the current mapped 12-channel XMLTV source. On 965 evening rows, Film eligible remains 36, general/mainstream Series 99, semantic Series 182 and Sport eligible 3. The confidence fix moves 112 row instances from `other/high` to `unknown/unknown`: other 733→621 and unknown 5→117. The five researched Series boundary examples remain eligible; `Sluipschutters`, `The Yorkshire Vet`, `LUBACH`, `Beste Kijkers` and `Top Gear` are now explicitly ambiguous rather than overclaimed as `other/high`.

The classification migration is untouched and remains the PostgreSQL-smoke-proven blob `f39e728b2098806f31b237319396436fc0a4e618`. The disposable network workflow has been removed from the final diff. Hosted production remains untouched.

**Next gate:** full exact-head CI on the no-probe head, then Technical Lead exact-head re-review. Do not send to Independent QA before Lead PASS.

---

## 23 september 2026 — PR #144 classification foundation Development-complete

The issue #142 implementation is now complete at Development level and awaits Lead + Independent QA. The accepted Vanavond visual runtime remains untouched; this PR contains no production `app/tonight.tsx` category population.

The central classifier now preserves complete XMLTV categories, structured episode numbers and minimal director-credit presence only at the provider boundary, maps them deterministically to provider-independent sibling semantics, persists those semantics atomically with canonical schedule replacement, and exposes a separate bounded semantic read API. Canonical `Programme`, Guide schedule transport and Guide render/runtime remain unchanged.

Required empirical failure modes are covered deterministically: Film first-category false negatives, generic-category scripted series, children scripted exclusion, non-scripted children, Sport event/highlights/talk/documentary/ambiguous cases, tri-state live/repeat and unknown fail-closed semantics. Production classifier source contains no research-title exceptions.

A disposable exact-implementation live probe then found an important defect before review: the first generic Series rule also admitted rows whose structured evidence was insufficient to prove Vanavond Series (`The Yorkshire Vet`, `Sluipschutters`, `LUBACH`, `Beste Kijkers`, `Het Interventie Team`, `Top Gear`). That probe did not establish that every one of those rows was high-confidence non-scripted; later Lead review #5794926935 explicitly corrected that certainty distinction. Raw-source evidence showed why actor/cast presence cannot solve generic scripted inference: presenters are frequently encoded as actors. The provider boundary was tightened to carry only minimal director-credit presence and the classifier now gives category-format conflicts precedence. Final live probe run #4 / `35857949057` passed over 965 evening rows: 36 Film, 99 general/mainstream Series and 3 Sport inclusions. Its only generic adult-Series recoveries were exactly `The Spencer Sisters`, `Best Medicine`, `Missie Aarde`, `Agatha Christie's Poirot` and `Aspe`; Sport resolved to 2 events + 1 highlights, with talk/documentary excluded.

Independent raw-source PR #145 evidence also measured 3,372 mapped rows: 60.47% multi-category, 69.25% with episode-number metadata, 83.13% with a credits block and 23.10% with director metadata, while live/repeat/new/premiere signals were absent. Teevee does not persist credit names/cast for classification.

Persistence lifecycle was executed against disposable PostgreSQL 17 in workflow run #1 / `35855629562`, job `107163296515` — SUCCESS. The actual classification migration loaded on top of the canonical schedule-store migrations; the smoke passed idempotent same-broadcast ingest, canonical start correction/rekey, cascade cleanup, stale-write protection, bounded getter and authoritative deletion cleanup, then rolled back.

The live provider-evidence probe remains documented in `docs/TONIGHT_CLASSIFICATION_SOURCE_EVIDENCE_2026-09-23.md`; its temporary network workflow and the temporary PostgreSQL workflow are removed before final exact-head CI so normal CI remains deterministic and network-free beyond the repository's existing gates.

Hosted deployment remains deliberately untouched. After Lead + Independent QA + merge, deployment order is migration → exact merged `epg-refresh` runtime → `programme-classifications` Edge Function → one authoritative `guide-horizon` refresh for backfill → bounded live verification and deployed-byte/schema comparison.

**Next step:** final exact-head CI, then Lead review. Do not merge and do not send to Independent QA before Lead handoff.

---

## 23 september 2026 — PR #144 starts central Vanavond classification foundation

Issue #142 moves Vanavond Film/Series/Sport classification out of raw canonical `Programme.genre` and into one provider-independent sibling enrichment owned by EPG ingest. Canonical Programme and Guide transport stay unchanged.

A temporary live source-evidence probe (workflow run #9 / `35855124285`, job `107161659875`) inspected the current 36,654,822-byte XMLTV feed. It directly confirmed the research failure modes: e.g. `The Martian` is `Drama + Film`; `Best Medicine` and `The Spencer Sisters` have generic scripted categories plus structured S/E evidence; `Bluey` and `Spidey` combine `Kinderen + Animatie` with S/E evidence; `Andere Tijden Sport` adds `Documentaire`; `NOS Voetbal` adds `Sporttalkshow`; event/highlight broadcasts expose narrow description evidence. Evidence is retained in `docs/TONIGHT_CLASSIFICATION_SOURCE_EVIDENCE_2026-09-23.md`; the temporary network workflow will be removed before final handoff.

Implementation direction is recorded in proposed ADR 0010:
- preserve all XMLTV categories and episode numbers only in server-side `ExternalProgramme`;
- classify once during normalisation through the central provider mapping;
- output only Teevee semantics (film/series/sport; scripted/audience; sport subtype; tri-state live/repeat; high/unknown confidence);
- fail closed on ambiguity and never inspect programme titles in production classification;
- persist one classification row per canonical broadcast using FK cascade and an atomic wrapper around ADR-0007 schedule replacement;
- expose a separate 1..256 programme-ID classification API so Guide loading/payload remains untouched;
- after reviewed deployment, backfill retained broadcasts by one authoritative provider `guide-horizon` refresh rather than guessing from old first-category genre.

No production Vanavond UI, artwork/TMDB, recommendation engine or Guide redesign is included.

---

## 23 september 2026 — Vanavond production design accepted and merged

Owner approved the final Vanavond production design. PR #141 promoted the accepted visual and deterministic implementation specification to canonical authority.

Canonical visual:
- `/Teevee/Vanavond production design - hoofdvariant.png`
- Library file id `file_00000000c6e081f4b4e0ed5e08a9c1fe`.

Frozen composition:
- Jouw gids as an open chronological list;
- Onze Kijktips as 16:9 broadcast cards;
- Films and Series as standing 2:3 poster carousels;
- Sport as landscape cards, omitted at zero items;
- no hero, section chevrons, `Alles` destinations, pager dots or filler.

Lead review additionally made explicit that generated-raster proportions/header omissions are not implementation authority: the written spec owns Film 108×162 and Series 96×144 2:3 geometry plus the canonical standalone shell/date context.

PR #141 final head `54d9c08e24a8d3f16b110ce9d9cf9b110b3209ad` passed exact-head CI #1040 and merged as `ed4c84a339ab1979276a1d7719c0d57457573f2b`. Exact-main CI #1041 / run `35851540191` passed the docs/design gate.

**Next engineering gate:** issue #142 — central provider-independent programme classification/enrichment foundation. Production Film/Series/Sport population remains blocked until that foundation is authoritative and, if hosted changes are involved, deployed/live-verified.

---

## 23 september 2026 — Series vanavond product scope frozen

Owner selected the narrower general/mainstream scope for `Series vanavond` after the empirical PR #137 classification research exposed a material audience/category collision.

Canonical product decision:
- include scripted episodic series intended for a general/mainstream audience;
- exclude programming primarily intended for children from `Series vanavond` v1;
- do **not** implement that exclusion as a raw provider `genre === "Kinderen"` shortcut;
- central provider-independent classification/enrichment must own scripted-series identity plus audience intent;
- keep repeat filtering out of v1 until a trustworthy repeat signal exists.

The research sample indicates roughly **12–17** qualifying adult/general scripted-series broadcasts per evening after reviewed boundary corrections, versus 24–29 when children's scripted series are included. Dedicated Vanavond Design/UX convergence is now the next project gate; production category runtime remains blocked on central classification/enrichment.

---

## 23 september 2026 — Vanavond classification data gate complete

PR #137 completed issue #135 against the real hosted canonical Teevee `guide-schedule` boundary. The research captured D-2 through D+5 as authoritative across all 12 active canonical channels; D+6/D+7 were correctly `unavailable`. The usable population contained 3,932 returned canonical rows and 1,114 unique broadcasts starting in the [19:00,06:00) Vanavond category window.

Independent Lead review reproduced the live capture aggregates and verified the current XMLTV/canonical semantics: only the first XMLTV category survives into `Programme.genre`; `<live/>` and `<previously-shown>` currently provide positive-only signals; the public canonical transport preserves explicit false if supplied. In the researched 1,114 evening broadcasts both `isLive` and `isRepeat` were 100% undefined.

Final module decisions:
- Film — **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**;
- Serie — **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**;
- Sport — **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**.

Key evidence includes 100% reviewed precision but 78.0% bounded recall for exact `Film` due proven `Drama` films; 100% / 92.9% focused adult-scripted precision/recall for the conservative Series mapping but only 50.2% recall when the 96 reviewed scripted `Kinderen` broadcasts are included; and 50% precision for exact `Sport` under the intended event + same-day-highlights interpretation because historical `Andere Tijden Sport` broadcasts share the same genre. Independent authoritative sources also corroborated the `De pupil` feature-film boundary case and the researched `Andere Tijden Sport` rerun status.

PR #137 exact head `d19cf8b8204269612d4530bf14eca133b4024c3b` passed docs-only CI #1030 and final Lead review, then merged as `bb1115e2e44584abb25feacf85aded0beb4c0140`. Exact-main CI #1031 / run `35846674470` passed the expected docs-only gate.

**Next Product gate:** explicitly decide whether `Series vanavond` includes children's scripted series or is a narrower adult/mainstream scripted-series module. After that decision, dedicated Vanavond Design/UX convergence is next. Production Film/Series/Sport remain blocked on central provider-independent classification enrichment.

---

## 23 september 2026 — Phase 5A Guide Search closed

PR #134 completed the mobile half of Guide Search against the already deployed/live-verified `GuideSearchApi` boundary. The accepted runtime provides bounded live programme/channel retrieval, 220 ms debounce, AbortController plus request-version stale-response ownership, explicit complete/partial/unavailable semantics, exact-broadcast Programme Detail, transient channel → Per-zender navigation, process-local Search continuity and safe 06:00 Europe/Amsterdam television-day rollover ownership.

Independent QA first found one in-flight 06:00 rollover race on head `43c6ca1894b533e411a387e0845973793fdd05bc`. Development corrected it without changing the API or Guide-loading architecture: an active loading request is now aborted and superseded when the television day changes, and a deterministic regression test proves that a late old response cannot regain ownership. Independent QA then passed exact runtime head `0fe40bf96313903378d152a028136777b26d5d15`.

Parallel Vanavond product-definition PR #136 moved `main` while #134 was in final review. The Search branch was reconciled as `742ed07ac156ae641560a08d62e99e4aaf3c996d`; independent diff inspection confirmed the only post-QA delta was the already-canonical Vanavond documentation, with no Search runtime/test change. Reconciled-head CI #1023 passed strict TypeScript, lint, **93 test files / 692 tests** and iOS/Android/web exports.

PR #134 then merged as `cbdf97ba09f59dd4ae4e019b2e60e51dc03bedde`. Exact-main CI #1024 / run `35844172324` passed strict TypeScript, lint, **93 test files / 692 tests** and iOS/Android/web exports. Owner physical iPhone Search validation is PASS; physical Android interaction validation remains deferred until Android hardware is available.

**Phase 5A — Guide Search is CLOSED.**

The next active Phase 5 increment is issue #135: empirical Film / Series / Sport classification research for Vanavond against real canonical hosted schedule data. Production Vanavond UI must wait for that data gate and subsequent Design/UX acceptance.

---

## 2026-09-23 — Vanavond product definition
- Defined the first canonical product-contract candidate for `Vanavond` in `docs/TONIGHT_PRODUCT_DEFINITION.md`: finite linear-TV decision support with `Jouw gids`, `Onze Kijktips`, and empirically gated Film/Series/Sport modules.
- Froze the distinction between explicit broadcast-level `Jouw gids` saves and future learned `Voor jou` recommendations, active 06:00 television-day ownership, evening windows, chronological selection, per-module repeat principles and empty-module behaviour.
- Kept visual composition open for a dedicated Design/UX increment and explicitly protected the accepted Guide layouts from new permanent save controls.
- Recorded the mandatory real-canonical-data classification research as GitHub issue #135 before Film/Series/Sport can be implemented.
- No production runtime code changed and no physical/CI implementation acceptance is claimed.

## 23 september 2026 — Phase 5A mobile Guide Search implementation candidate

PR #134 implements the mobile half of Phase 5A against the already deployed/live-verified `GuideSearchApi` boundary. The former placeholder becomes one prominent Search field with concrete channel and programme-broadcast results. The runtime keeps query/result continuity only in process memory, uses a 220 ms candidate debounce plus AbortController and request-version ownership, bounds input to the frozen Search contract, retries availability failures, distinguishes complete no-match from partial/unavailable programme coverage and refreshes a retained result when the 06:00 Europe/Amsterdam television day rolls over.

Programme results expose title, actual civil date/time and canonical channel before tap, retain optional Kijktip as non-ranking sibling metadata and reuse the existing exact-broadcast Programme Detail modal so closing Detail preserves the Search context. Channel results publish one transient channel/reference-time intent to Guide → Per zender. The Guide consumes that intent without persisting a presentation preference; the handoff waits for canonical channel identity and positions Per zender at the requested current-time context.

Development self-review corrected three candidate defects before handoff: the first implementation synchronously changed Guide state inside an effect and failed lint; Per-zender acknowledgement could cancel its own scheduled positioning work; and an overlong normalized query could fall through to the generic availability state. Regression coverage now protects those cases, stale/out-of-order responses, abort propagation, 06:00 horizon rollover, result date/current semantics, accessibility content and Search-screen navigation/state semantics.

No product scope was broadened: no eager D-2..D+7 mobile Guide prefetch, title-only catalogue identity, recent-search history, raw-query logging, fuzzy/semantic/AI search, artwork dependency or new external state/cache dependency.

**Verification:** runtime candidate CI #1015 passed strict TypeScript, lint, 93 test files / 690 tests and iOS/Android/web exports. The final exact-head handoff run is recorded on PR #134 after this evidence-only documentation update. No physical-device acceptance is claimed. The 220 ms debounce remains a candidate calibration until physical iPhone evaluation.

**Next step:** exact-head Lead review after green CI, then focused physical iPhone Search validation; Independent QA only after physical PASS.

---

## 23 september 2026 — Guide Search hosted boundary merged, deployed and live-verified

PR #132 exact accepted head `8bdc679f28289a7ccf5b8445aa7f2c42e13b35df` passed exact-head CI #984, Independent QA (#5787177734) and final Lead merge gate (#5787185229), then merged to `main` as `3c7ebcf906ff64bb2b6b71c04d177a20519eb2a0`. Exact-main CI #985 subsequently passed strict TypeScript, lint, 89 test files / 670 tests, iOS/Android/web exports and the full-ABI Android build.

The reviewed Guide Search migration blob `d232eacbf3b809d23ae9c4eeb9a15ea2ffc20380` was applied to hosted project `eokszvpityhtysbwdduy`. Supabase recorded remote version `20260923064120_create_guide_search_read_boundary`; the deployment-closeout PR aligns the repository filename to that remote version without changing SQL bytes. Live verification confirmed `unaccent` in `extensions`, SECURITY INVOKER + empty search_path, EXECUTE denied to anon/authenticated and granted to service_role.

`guide-search` deployed as ACTIVE version 1 with `verify_jwt=false`; all 12 deployed files matched merge commit `3c7ebcf...` byte-for-byte. The existing `guide-schedule` public read was redeployed as ACTIVE version 7 for the shared hardened Edge runtime refactor; all 10 deployed files also matched the merge commit.

Because the local shell had no outbound DNS and the Supabase SQL connector is read-only for `pg_net`, the final public HTTP proof ran as a temporary network-enabled GitHub Actions job. CI #986 / run `35828454528`, job `107075306874`, POSTed to the real production `guide-search` endpoint and passed both: `NPO` returned canonical `nl-npo-1`; `Goedemorgen Nederland` returned a concrete canonical NPO 1 broadcast. The temporary CI job was removed immediately after the proof.

The hosted Search boundary is therefore complete end-to-end. The next active Phase 5A increment is the mobile Search UI/runtime against the frozen `GuideSearchApi` contract, including debounce/cancellation, stale-response protection, explicit loading/no-match/partial/unavailable states, exact Programme Detail / Per-zender navigation, accessibility, Dynamic Type, measured performance and physical iPhone validation.

Evidence: `docs/GUIDE_SEARCH_DEPLOYMENT_2026-09-23.md`.

**Next step:** implement the mobile Guide Search runtime/screen; do not reopen the hosted Search/Guide-loading architecture without concrete evidence.

---

## 23 september 2026 — Phase 5A Guide Search architecture established

PR #132 establishes the provider-independent hosted Search boundary required by `docs/SEARCH_PRODUCT_DEFINITION.md` and freezes the durable decision as ADR 0009. Search does not reuse mobile Guide window loading: the server owns the exact ADR 0008 D-2..D+7 windows and makes one bounded canonical-store Search call that returns only canonical programme/channel matches plus `complete | partial | unavailable` programme coverage.

The Supabase implementation remains behind that boundary: private `teevee.search_guide`, service-role-only `public.teevee_search_guide`, SECURITY INVOKER + empty `search_path`, `unaccent` in `extensions`, and a public `guide-search` Edge Function that keeps privileged credentials server-side. Programme availability is evaluated per active channel × television-day pair, so covered pairs can produce useful results without treating uncovered scope as a trustworthy no-match. Channel Search remains independently available. Results are bounded to 24 programmes / 24 channels; matching remains exact → prefix → substring and concrete repeats are never collapsed into title-only identity.

The first executable PostgreSQL-17 smoke caught an invalid schema-qualification of PostgreSQL conditional expressions before merge. Strict TypeScript separately caught an unsafe Edge secret-key narrowing, and the next test run caught a case-sensitive smoke-test assertion. All three defects were corrected rather than bypassed. Intermediate exact-head run #972 on `2fdfd812c9a7fb45b39f14fa7363039c12a9210a` then passed the real PostgreSQL migration smoke plus strict TypeScript, lint, 89 test files / 670 tests and iOS/Android/web export; its Android job was superseded by the documentation/final-head update. The temporary PR-only PostgreSQL CI job is removed again before the final review head while the reusable smoke SQL remains in-repo.

No hosted production migration or Edge deployment occurs before merge. After merge, deploy and live-verify the hosted Search boundary, then implement the mobile Search screen/runtime against the frozen `GuideSearchApi` contract. No physical-device gate is required for the architecture-only PR itself because it changes no user-facing layout/gesture/runtime presentation; Independent QA remains required because this is high-risk trust-boundary/migration work.

**Next step:** final exact-head CI + Independent QA for PR #132; after merge, deploy/live-verify the hosted Search boundary before mobile Search UI/runtime.

---

## 23 september 2026 — Kijktip post-deployment iPhone PASS; Phase 5A Guide Search activated

The final post-deployment Kijktip smoke is **PASS** on a physical iPhone: NPO 1 / 22 September / `De slimste mens` visibly shows the recovered `Kijktip` label from hosted data. This closes PR #127 end-to-end beyond database verification and proves the historical recovery through the public/runtime Guide presentation path.

The Kijktip vertical slice is therefore fully closed. Phase 5 — Search and Discovery is formally active with **Phase 5A — Guide Search** as the first slice.

Canonical Search product authority is now `docs/SEARCH_PRODUCT_DEFINITION.md`. It freezes Search as direct programme-broadcast/channel retrieval across the D-2..D+7 television-day horizon, explicitly excludes universal streaming/people/genre/article/AI/fuzzy search, keeps repeats as concrete canonical broadcasts, and requires exact-broadcast Programme Detail plus channel → Per-zender navigation.

Current runtime inspection found that mobile Guide intentionally owns only current/selected bounded windows and a small visited-window session cache. Search therefore must not be implemented by eager ten-day mobile prefetch or by indexing only visited Guide days. The next engineering increment is a provider-independent hosted Search read boundary over the canonical schedule store, preserving ADR 0007/0008 availability and horizon semantics.

**Next step:** define the Guide Search architecture contract, then implement Search UI/runtime against it. Tonight remains deferred/provisional.

---

## 23 september 2026 — PR #127 merged; editorial lifecycle migration deployed and live recovery verified

PR #127 exact accepted head `b9867105fdf331dcd6a920c71d0f5e637e3b232c` passed the Lead exact-head gate, owner physical iPhone validation and Independent QA on the same SHA, then merged to `main` as `6b11ee2fe4a5cbdf4012a680c2558b11b762d999`.

After merge, the reviewed editorial lifecycle SQL blob `c41b059f627406d12c684fa92a1e1179109d8dbe` was applied to hosted Teevee project `eokszvpityhtysbwdduy`. The connected Supabase migration API recorded remote version `20260922235737_preserve_started_editorial_signals`. The post-merge closeout therefore renames the repository migration to the same version without changing its SQL bytes, and updates the disposable PostgreSQL smoke/tests/evidence references accordingly. This keeps future migration replay aligned with hosted migration history without manually editing `supabase_migrations`.

Immediate live verification after deployment:
- 58 persisted TVgids editorial signals;
- `editorial_source_state.signal_count = 58`;
- 0 orphan editorial signals;
- exactly 1 recovered Kijktip for NPO 1 / `De slimste mens` / 22 September;
- `last_success_at = 2026-09-22T23:41:00.850Z` remained unchanged by recovery;
- live `teevee.replace_editorial_signal_snapshot` is SECURITY INVOKER with empty `search_path` and the reviewed rekey → orphan → future-omission → upsert order.

The backend recovery is therefore deployed and proven. The visible Kijktip runtime was already owner-accepted on iPhone before merge. One device-only post-deployment smoke remains: browse back to NPO 1 / 22 September / `De slimste mens` and confirm the recovered hosted signal is visible as a Kijktip label. Phase 5 Search remains formally paused only for that operational device check.

The GitHub connector available to this session does not expose `push`-triggered workflow runs, so no exact-main Actions result is claimed here. PR-head CI #963 remains the verified implementation CI; the post-merge closeout branch receives its own normal PR CI before merge.

**Next step:** complete the closeout PR CI/merge, then run the single historical iPhone browse-back smoke. After PASS, activate Phase 5 with Guide Search as the first slice.

---

## 23 september 2026 — PR #127 Lead persistence blockers closed without UI changes

Lead REQUIRED FIX #5785619629 accepted the current Guide UI/runtime and reopened only editorial persistence. The UI implementation is therefore untouched from reviewed head `c23609dc579438242c46fb5888ea0483b80b94e9`.

Two persistence defects are corrected in the still-unapplied forward migration `20260922235737_preserve_started_editorial_signals.sql`.

First, source reconciliation now occurs before incoming upsert. Because canonical programme identity includes broadcast start, an EPG time correction can rematch the same TVgids `sourceItemId` to a different `Programme.id`. The writer keeps the unique source-item constraint, advisory lock and stale guard, but now removes explicit source-item rekeys first, then orphans, then omitted future signals, and only then upserts incoming matches. A simple omission after programme start remains historical retention; an explicit same-source-item rematch safely moves the source identity to the corrected programme.

Second, the migration adds one conservative recovery allowlist for an already-deleted historical Kijktip. PR #120 live job `106846180653` directly captured `De slimste mens` / NPO 1 / 22 September 21:30 CEST in `tips.rss` with GUID/link `…de-slimste-mens-kiki-boreel…2026-09-22`. Matching job `106846829261` resolved that exact item to canonical `programme-0gh2ai605h9qyw` at 19:30 UTC with zero drift. The recovery does not hardcode that programme ID: it reruns the existing Tier-B evidence shape against retained storage — explicit channel, exact title, ±5 minutes, exactly one candidate — and otherwise does nothing. The news-looking URL is used only because it was the direct `tips.rss` GUID/link; general TVgids news remains excluded.

A temporary PR-only CI job executed `server/editorial/editorialMigrationSmoke.sql` against disposable **PostgreSQL 17** on head `e927eb320283742c5b1f403527b0bc33e7666f5f`. The real forward migration executed twice: first recovery `INSERT 0 1`, second idempotent pass `INSERT 0 0`. The smoke then passed future present, future omitted, started present, started omitted, same-source-item corrected-start rekey, orphan cleanup, stale refresh and historical getter assertions; PostgreSQL completed the assertion block with `DO` and the test transaction ended with `ROLLBACK`. Job `106974086358` succeeded. The temporary CI plumbing is removed again before final exact-head CI; the reusable smoke SQL remains in-repo.

The migration has **not** been applied to the hosted Teevee production project. Migration history therefore remains clean and deployment remains a later merge/deploy action, not part of this fix session.

Full evidence: `docs/EDITORIAL_PERSISTENCE_RECOVERY_2026-09-23.md`.

**Next step:** final exact-head CI, then return PR #127 to Lead. Do not merge and do not send to Independent QA.

---

## 23 september 2026 — PR #127 closes owner physical regressions and compact-label follow-up

Owner comments #5785161879 and #5785190676 reopen three narrow issues on exact head `aa5c947f5d9e44089a33cb4d5ae71d5a6b916ffd`.

Nu & Straks keeps all existing row/reference/following geometry but changes the 64-pt channel identity zone from centred to bottom-aligned ownership, matching the already bottom-aligned reference programme. Horizontal identity/programme geometry, logo max40×32, targets, accessibility and Kijktip reference/following layout are unchanged.

Per zender preserves the accepted structural grid and text positions — time text X24, title X100/right24, standard time Y7…27/Kijktip Y29…45 and current time Y21…41/Kijktip Y43…59 — while compacting only the editorial surface. Surface padding becomes 5 pt, surface-left X19, min width48 and width=max(48,max(intrinsic time,intrinsic Kijktip)+10). At S1 standard surface Y2…50 is 5/20/2/16/5 internally with 2-pt external row breathing; current surface is Y16…64. At scale S the surface height is 36S+12 inside the unchanged standard/current row authorities.

Editorial persistence gains a **forward migration** rather than rewriting applied history. A successful TVgids refresh still validates/deduplicates and uses the existing advisory-lock/stale-write guard, but now upserts current matches, retracts an omitted signal only while its canonical programme is future, preserves an omitted signal after programme start as historical broadcast metadata, and removes orphaned signals when the canonical programme leaves retained schedule storage. The public/mobile editorial signal contract is unchanged.

Deterministic UI, migration-contract and repository coverage is extended for these three fixes. Exact-head CI remains required before returning to Lead; no merge or Independent QA handoff occurs from Development.

---

## 23 september 2026 — PR #127 shared Kijktip surface-tone correction

Lead REQUIRED FIX #5784910137 applies the later owner-approved shared `editorialAccentSurface` calibration without reopening layout: light changes from `#E4ECEE` to **`#EEECE7`** and dark from `#1C2527` to **`#171715`**. `editorialAccent` foreground remains unchanged. Because this is one shared semantic token, both Per zender and Nu & Straks receive the warmer/neutral surface tone through the existing theme architecture; no Nu & Straks component, layout or metric changes are made.

The already Lead-approved Per-zender physical geometry remains exactly authoritative: time-text origin X24, surface-left X16, 8-pt horizontal inset, S1 standard 7/20/2/16/7, standard surface outer height equal to the existing scaled row height, current surface top14 with the same breathing, and title X100/right24. The remaining stale Per-zender production-summary wording that still described outer X24 / vertical padding0 / `36S+2` as surface height is corrected to distinguish intrinsic content height from surface outer height.

Deterministic token and Guide integration expectations are updated to the new shared surface values. **Next step:** exact-head CI, then return to Lead for final pre-physical review. Do not merge and do not send to Independent QA.

---

## 22 september 2026 — PR #127 owner physical Per-zender Kijktip time-grid refinement

Physical iPhone review of exact head `b385e9a8467361b521e613de567711c682728383` rejected only the Per-zender Kijktip label alignment/breathing. The editorial colour/radius/typography direction remains accepted and Nu & Straks is explicitly frozen.

The correction makes the time grid authoritative. `perChannel.timeTextX = 24` now means the visible start-time text origin for normal, standard-Kijktip and current-Kijktip rows. With the existing 8-pt horizontal label inset, the decorative/editorial surface therefore starts at X16. The outer surface no longer centres the time inside its minimum width; an intrinsic inner stack begins at X24, with Kijktip centred beneath the rendered time.

Vertical calibration now spends the existing standard-row slack inside the surface instead of outside it. At S1 the standard surface is exactly the frozen 52-pt row: 7 top + 20 time + fixed 2 gap + 16 Kijktip + 7 bottom. For Dynamic Type, `verticalBreathing = (round(52S) - (36S + 2)) / 2`; the surface height remains the existing `round(52S)` row authority. Current uses the same internal breathing and scaled surface height, anchored at the existing 14-pt current-content origin, while current title/description/progress remain unchanged.

This supersedes only PR #129's Per-zender `surface-left X24 / vertical padding0 / 36S+2 surface-height` box metrics. Editorial tokens, radius6, 8-pt horizontal padding, 2-pt internal gap, 52/176 base rows, X100/right24 title geometry, separators, programme Pressable/accessibility, editorial-signal ownership and all Nu & Straks runtime remain unchanged.

Deterministic coverage locks X24 text-origin parity, X16 surface-left, S1 7/20/2/16/7 composition, scaled S1.35/S1.5/S2 containment, width/min-width ownership, unchanged current content and multiple-Kijktip anchor/accessibility behaviour.

**Next step:** exact-head CI, then Lead exact-head review and a focused owner physical iPhone recheck. Do not merge and do not send to Independent QA before physical PASS.

---

## 22 september 2026 — PR #127 reconciled to final PR #129 Kijktip label calibration

PR #127 keeps its already-reviewed editorial-signal architecture and runtime ownership, but is reconciled against canonical main after PR #128/#129 superseded the earlier bare-text final styling. Current main wins unchanged for all six canonical design/spec authorities from PR #129.

Runtime convergence is deliberately narrow:
- adds semantic theme tokens `editorialAccent` (#315A63 light / #A9C9CF dark) and `editorialAccentSurface` (#E4ECEE light / #1C2527 dark) through the existing Light/Dark/System theme architecture;
- Per zender renders one compact time + Kijktip editorial label at X24 with 8-pt horizontal padding, radius6, minimum width56, fixed 2-pt internal gap and the frozen 36S+2 outer height; normal title-cell rhythm, 52/176 row ownership and current title/description/progress remain unchanged;
- Nu & Straks renders the calibrated Kijktip-only label with 6-pt horizontal padding, radius4 and 16S height; reference gap3/content-safe title formula and following reserve=(label outer width+8), 48-pt title floor, intrinsic short-title placement, Larger Text final-line ownership and >2.0/<180 fallback remain intact;
- visible label containers/children remain presentation-only while each programme stays one Pressable/focus/action with Kijktip announced exactly once;
- selected-day ownership, signal-only runtime reactivity, no duplicate hosted request/schedule replacement, Totaal, Programme Detail, Guide horizon/06:00/DST and gesture/scroll ownership are unchanged.

Deterministic tests are updated for semantic theme values, System appearance resolution, Per-zender label geometry/intrinsic-width contract, Nu & Straks reference/following outer-label geometry and all prior #127 data/accessibility/layout regressions.

**Gate:** exact-head CI is mandatory, then Lead exact-head runtime review and a new focused physical iPhone acceptance of the calibrated labels. Do not merge or send to Independent QA before those gates.

---

## 22 september 2026 — PR #126 first production Kijktip backend/transport increment

The first production-grade Kijktip vertical-slice implementation keeps editorial enrichment strictly optional and separate from core EPG identity/availability. No visible Kijktip UI is introduced.

Implemented:
- provider-independent `ProgrammeEditorialSignal` sibling domain; canonical `Programme` remains unchanged;
- raw-byte TVgids `tips.rss` decoding using the declared charset before XML parsing, with deterministic fixtures for ISO-8859-1/non-ASCII input;
- explicit TVgids channel mapping and PR #120 deterministic matching: future-only Tier A, Tier B exact normalized title + ±5-minute start, Tier C exact-start title-mismatch fallback, ambiguity/reject fail-closed;
- private service-role-only Supabase editorial snapshot store with no programme FK/cascade, source freshness/stale-write protection, deduplication and current-programme filtering;
- separate protected `editorial-refresh` Edge Function and independent hourly `:41` cron lifecycle;
- `guide-schedule` composes stored signals only after a valid schedule read and fails editorial reads open to `[]`;
- typed mobile transport/bounded D+D1 composition/runtime validation and a separate in-memory editorial state; no editorial-only Guide remount.

Hosted evidence after applying migrations and deploying `editorial-refresh` + `guide-schedule`:
- protected one-shot refresh: **100 feed items → 66 persisted Kijktip signals**;
- **57 Tier B / 9 Tier C / 0 Tier A / 0 ambiguous / 0 unmatched**;
- fail-closed residuals: **21 unsupported channels / 12 outside canonical coverage / 1 invalid-or-undecodable**;
- persisted store: 66 distinct programme IDs and 66 distinct source item IDs;
- public hosted smoke, editorial-absent covered window: **status ok / 12 channels / 412 programmes / 0 signals**;
- public hosted smoke, enriched covered window: **status ok / 12 channels / 519 programmes / 10 signals**.

This live evidence proves both directions of the optionality contract: persisted enrichment reaches the typed read, while a schedule window with no editorial signals remains a normal valid Guide response.

Rights status is now closed for this source: the product owner confirms the intended Teevee Kijktip use of `https://www.tvgids.nl/tips.rss` is rights-cleared, so this editorial source is **not a Kijktip release blocker**. The separate production EPG-provider redistribution-rights gate and the independent rights/provenance requirements for channel logos and programme artwork remain unchanged.

**Next gate:** exact-head Lead review of PR #126. Do not merge before Lead. Visible Per-zender/Nu & Straks Kijktip wiring remains a separate later increment using the already frozen PR #122/#123 visual contracts.

---

## 22 september 2026 — Owner reprioritisation: Kijktip vertical slice before Search

The owner changed the immediate implementation order after the Phase 4 closeout. Phase 4 remains CLOSED and Phase 5 Search and Discovery remains the next broader product phase, but **Search is paused until the already-prepared Kijktip enrichment vertical slice is fully implemented and accepted**. This supersedes the same-day administrative “Search first” next-step wording only; it does not reopen Phase 4 or change the Phase 5 product scope.

The required Kijktip foundations are already merged:
- **PR #120** — empirical TVgids.nl `tips.rss` matching research and fail-closed canonical matching contract;
- **PR #122** — owner-approved Per-zender Kijktip production calibration;
- **PR #123** — owner-approved Nu & Straks Kijktip production calibration.

No new Kijktip product/design decision is introduced here and no runtime implementation is part of this reprioritisation.

**Next step:** implement the Kijktip data/enrichment vertical slice end-to-end using PR #120/#122/#123 as canonical constraints; complete its verification and acceptance gates; only then resume Phase 5 with Search. Tonight remains deferred/provisional.

---

## 22 september 2026 — Phase 4 administratively closed after Totaal production merge

PR #114 merged to `main` as `4cea66eca92b7224ff51940b30de09db11928427`, closing the final open Phase 4 Guide production-convergence work.

Totaal production convergence is now canonical as merged, owner-accepted and QA-proven. The accepted runtime line passed focused physical iPhone/product acceptance. Independent QA reviewed the production candidate, identified one ChannelIdentity accessibility-subtree blocker, and that blocker was corrected before merge; the final Lead merge gate independently verified the fix closed without reopening the owner-approved visual/product runtime. Final exact PR head `b054aac298ca9cdb37240881172db5d2ac6a4cf6` passed CI #877 / run `35753152718`: strict TypeScript, lint, **72 test files / 538 tests**, and iOS/Android/web Expo exports.

Phase 4 is therefore closed. The existing decision to avoid a persistent mobile schedule cache remains unchanged; true offline cold-start/persistence and physical Android interaction validation remain later release/device gates rather than Phase 4 blockers.

The stale Totaal implementation `EXACT NEXT STEP` has been removed from `docs/PROJECT_STATE.md`. Phase 5 — Search and Discovery is now active. The canonical next step is **Search first**: build from the existing Search shell and provider-independent programme/channel domain, with one prominent search field targeting programmes and channels and prioritising useful upcoming broadcasts that answer when/where something airs. Tonight remains deferred until its product value and data requirements are clear.

PR #78 is superseded by the later canonical Per-zender/Totaal production design and convergence work and is closed unmerged as project maintenance.

**Next step:** begin the Phase 5 Search MVP slice; do not reopen accepted Phase 4 Guide convergence without concrete regression evidence.

---

## 22 september 2026 — PR #114 focused physical-runtime refinement after owner iPhone review

Owner iPhone review of exact head `90ae6df241babe172a91ab608708abf0e21ba5d2` confirmed the Totaal vertical endpoint no-overscroll policy and widened current-marker body, then exposed four narrow physical-runtime issues without reopening the production design.

- **Larger Text context allocation:** the 52-pt Totaal day/Nu row remains frozen. Totaal now opts the shared day selector into intrinsic non-shrinking one-line allocation, and its local `Nu` target/visible label cannot shrink. The existing 1.20 compact cap, touch targets and typography remain unchanged; Per zender and Nu & Straks are not retuned.
- **Wall-clock Guide clock:** `useGuideClock` no longer uses a mount-relative `setInterval`. One recursively scheduled timeout derives its next delay from `Date.now() % tickMs`; at the 30-second cadence refreshes align to real `:00`/`:30` boundaries. Background clears the pending timer, AppState→active refreshes immediately and schedules one newly aligned timeout, and unmount clears both timer and subscription.
- **Partial-left readability:** `EdgeReadabilityOverlay` separates masking from sticky-text visibility. The mask remains active for any positive partial-left remainder so an offscreen-positioned underlying title cannot leak a one-letter/bare-ellipsis fragment. Lead review of `2cc2153e5acc22007476a636c52a6ab7fd304bf9` found that the first text floor incorrectly reused the raw `48 × S` frame threshold; the final floor instead guarantees the scaled 48-pt base **inner** title budget after active 6/8/10-pt programme padding (60 pt outer at S=1; 80.8 pt at S=1.35). The real programme frame/boundary and per-frame Reanimated ownership remain unchanged.
- **Definitive microcell simplification:** the strict full-frame `frameWidth < 48 × S` classification remains canonical, but every individual microcell below it is now visually text-free. The previously introduced 27×S individual-glyph floor and individual ellipsis helpers/rendering have been removed. Repeated-title formation, full-schedule stable identity, exact adjacency/title rules, bounded programme-window presentation and per-programme actions/boundaries/accessibility remain unchanged. One shared Medium title is still allowed only when visible repeated-run width is at least `48 × S`; below that threshold the run remains text-free.

Deterministic coverage now includes intrinsic Larger Text day-selector allocation, phase-aligned `:30`/`:00` fake-timer progression, AppState resume realignment/no duplicate timers/cleanup, EdgeReadability mask-vs-text threshold and hard reversal, visually empty 5/10/15-minute microcells, exact 48-pt normal rendering, 3×5-minute text-free repeated runs, 4×5-minute shared-title runs, current-micro accessibility semantics and bounded repeated-run eligibility.

This refinement does not change 84/76/3.00 geometry, the 120-pt viewed-time anchor, 1.5× programme overscan, horizontal ownership/bounce, Totaal vertical endpoint policy, day/television-day semantics, D-2..D+7, provider/EPG/backend/migrations, Programme Detail, Per zender, Nu & Straks or bottom navigation.

Doel: chronologisch, begrijpelijk overzicht van substantiële milestones, verificatie en blokkades. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand. Granulaire CI/device-details blijven terugvindbaar in GitHub PR/commit-history en timestamped evidence-docs.

## Logboekregels
- Datum/tijd in Europe/Amsterdam waar praktisch.
- Eerst product-/gebruikerseffect, daarna techniek/verificatie.
- Claim alleen checks die aantoonbaar geslaagd zijn.
- Benoem regressies/gates expliciet.
- Iedere substantieve entry eindigt met de volgende stap.

---

## 21 september 2026 — Totaal physical refinement: ultra-micro density, vertical endpoint overscroll and current-time label

Owner physical iPhone validation of reconciled PR #114 head `36e1e3c27f475a5188bbc2950eb887f362344834` left three focused presentation defects while the broader Totaal convergence remained accepted: repeated very short broadcasts could create a barcode-like boundary/ellipsis pattern, top vertical rubber-banding moved only the schedule/channel canvas beneath the fixed functional stack, and the compact current-time marker could truncate a midnight label to `00:…`.

The microcell refinement keeps the existing full-frame micro classification (`frameWidth < 48 × S`) and every programme's real geometry, boundary, Pressable, accessibility label and Programme Detail destination. A second **presentation-only** floor now determines whether an individual microcell has enough room for the ellipsis glyph. The floor is derived from existing typography/geometry rather than a standalone magic constant: one 15-pt programme-title em plus the existing 6-pt micro inset on each side, scaled by `S`, giving **27 × S pt**. Below `27 × S` the microcell is visually empty; at and above `27 × S` the existing centred `…` remains. Repeated-title membership/identity and the existing `48 × S` visible-run shared-title threshold remain unchanged. The bounded repeated-run overlay applies the same individual-glyph floor only when it falls back from a shared title, so long-run windowing/1.5× overscan remains intact.

For vertical Totaal scrolling, the native schedule ScrollView now disables endpoint overscroll rather than making fixed Guide chrome imitate bounce. On iOS this sets `bounces={false}` and `alwaysBounceVertical={false}`, so the vertical schedule no longer rubber-bands at either top or bottom endpoint; normal native scrolling, fling/deceleration and the existing 56-pt collapse path remain unchanged. On Android `overScrollMode="never"` removes the platform edge-overscroll effect. Horizontal schedule/time-axis bounce and ownership are untouched, and Per-zender/Nu & Straks are not changed.

The current-time marker root cause was the body sizing contract: the body was fixed to the **38-pt minimum width** while also carrying 5-pt horizontal padding on both sides, leaving too little effective label space for five-character `HH:MM` text around midnight. The marker now reserves the frozen 38-pt minimum as the readable label box and adds the existing 5+5 pt padding outside it, giving a 48-pt base body. The body scales only with the existing compact 1.20 text cap (56 pt at the cap). The text is explicitly non-shrinking/centred. Edge clamping receives the actual body width, while the pointer continues to use the exact unchanged minute-X independently, so left/right body clamping never moves the semantic pointer.

Deterministic coverage now proves the exact `27 × S` ultra-micro boundary, a visually empty current 5-minute programme with full `nu bezig` accessibility and separate action/boundary, normal 15-minute ellipsis presentation, repeated-run shared-title/bounded-window behaviour, quiet ultra-micro run fallback, all four representative current-time strings (`00:00`, `00:04`, `09:09`, `23:59`), left/right marker-body clamping, the unchanged worklet helper and the Totaal-only native vertical endpoint policy. Code head `df3f30ea101a72c1a79019132a56735375b2efbe` passed CI #853 / run `35663036477`: strict TypeScript, lint, **71 test files / 522 tests**, and iOS/Android/web Expo export; the classifier correctly skipped the native/config Android job.

No Guide day-selector wording, 06:00 Europe/Amsterdam semantics, D-2..D+7 product horizon, selected-day/two-day hosted contract, EPG/provider/backend code, 84/76/3.00 geometry, 120-pt anchor, 1.5× overscan, horizontal ownership, first-open positioning, Nu policy, normal programme typography, Dynamic Type formulas or other frozen Totaal product metric was changed.

**Remaining physical gate:** validate exact final head on iPhone for (1) dense ultra-short rows staying calm while each cell remains tappable, (2) natural vertical scrolling/collapse with no partial-guide top pull-down state, including top and bottom endpoints, and (3) full current-time `HH:MM` readability near midnight and both horizontal viewport edges with the pointer still exactly on the current minute. Lead exact-head review precedes that physical gate. Do not merge or request Independent QA yet.

---

## 21 september 2026 — PR #114 reconciled with canonical main after EPG horizon closeout

PR #114 Totaal production visual convergence was reconciled with canonical `main` `c990ee5dcf757c88d7721ccccc82e6585402d185` after PR #116, PR #117 and PR #118 closed the Guide EPG horizon incident. The reconciliation uses a true merge commit with the prior PR #114 head and current main as parents. Main-only EPG/data/runtime files are inherited byte-identically from canonical main; the only overlapping path since the common base was `docs/DEVLOG.md`, which was merged additively so both the canonical EPG incident history and the existing Totaal convergence history remain intact.

No Totaal runtime conflict required product or metric reinterpretation. All owner-approved/frozen Totaal work remains unchanged: 120-pt viewed-time anchor, 1.5× programme overscan, horizontal single-source gesture ownership, worklet-safe current-time marker, first-open positioning, distance-aware `Nu`, micro-programme `…` treatment, repeated-title run identity and bounded repeated-run presentation, exact programme duration geometry and the accepted production shell/collapse metrics.

The reconciled client still uses `useSelectedGuideDaySchedule` with selected television-day loading; Totaal requests the selected day plus following day only when that following day is selectable, and `loadTwoTelevisionDayGuideSchedule` retains the all-or-nothing contract by returning `null` when either independent hosted canonical television-day read is unavailable. `HostedGuideScheduleClient` remains the client data source; no XMLTV/provider fallback or client-side horizon workaround was introduced.

Canonical PR #116/#117/#118 EPG files, including the server-side `guide-horizon` refresh, hosted transport policy, XMLTV provider fix, deployed Edge Function source and television-day horizon migration, are inherited unchanged from main. The live-proven 06:00 Europe/Amsterdam television-day semantics and D-2..D+7 product horizon therefore remain canonical.

**Next step:** exact-head CI, then Lead exact-head review followed by renewed owner physical iPhone acceptance. Do not merge and do not request Independent QA before those gates pass.

---

## 21 september 2026 — Guide EPG horizon incident operationally closed

PR #117 merged as `c875922225e27c825fa9b0c6cbde2d08b8d22205`; exact-main CI #839 succeeded. `epg-refresh` was redeployed as live version 6 and protected refresh request 88 completed with HTTP 200 in `guide-horizon` mode. Canonical storage now materialises true 06:00 Europe/Amsterdam television-day windows. Complete D0..D+5 windows were stored for all 12 development channels, while incomplete historical/future windows were correctly skipped without destructive replacement.

Remote Supabase migration history was reconciled to the repository timestamps through `20260921213000_refresh_guide_television_day_horizon.sql`.

Physical iPhone smoke on PR #114 exact head `4c3a2d97c67814d71861298ef8a8d341ad1924c2` passed the original regression: horizontal Vandaag→Morgen browsing and explicit Morgen selection both showed guide data. The first unavailable selected day was 26 September. That is expected with the current Totaal all-or-nothing two-day continuity loader: D+5 itself is complete, but its required following D+6 development-provider window is partial, so the composed Totaal read is unavailable.

Durable evidence: `docs/PHYSICAL_EVIDENCE_2026-09-21_EPG_HORIZON.md`.

**Next step:** continue the broader physical acceptance of open Totaal production-convergence PR #114; do not reopen the EPG horizon correction unless new regression evidence appears.

---

## 21 september 2026 — PR #116 live rollout exposed epg-refresh BOOT_ERROR

After PR #116 merged and exact-main CI #837 passed, the updated `epg-refresh` Edge Function was deployed as live version 5 and the guide-horizon migration was applied. The first protected one-shot refresh through `teevee.enqueue_development_epg_refresh()` returned request id 87, but `net._http_response` recorded HTTP 503 with `BOOT_ERROR`: the function failed before request-handler logging or EPG ingestion began. No new 06:00 television-day coverage was written; the canonical store therefore still contained the previous calendar-midnight windows.

The hotfix branch `hotfix/epg-refresh-edge-boot` removes the new horizon module's dependence on runtime alias/sloppy-import resolution by using explicit relative `.ts` module specifiers. A dedicated regression test walks the deployed `epg-refresh` runtime import graph with the TypeScript AST and rejects runtime `@/` aliases, extensionless relative imports and unsupported bare imports. This targets the only new boot-time module-resolution dependency introduced by the horizon refresh while leaving horizon semantics, provider coverage classification, canonical replacement rules, auth, cron and client behaviour unchanged.

The migration-history timestamp mismatch created by the Management API deployment remains operational cleanup only; do not run a normal `db push` until remote history is reconciled with canonical repo migration `20260921213000_refresh_guide_television_day_horizon.sql`.

**Verification:** hotfix exact-head CI, Independent QA and live redeployment/retry are still required. **Next step:** finish the hotfix PR gates, redeploy `epg-refresh`, re-trigger the protected guide-horizon refresh, prove 06:00 canonical coverage, then reconcile migration history and perform the focused physical iPhone smoke.

---

## 21 september 2026 — Totaal repeated-run overlay bounded to canonical programme window

Lead review of the first owner-approved micro-programme implementation found one performance-architecture blocker: repeated-title run **identity and geometry** were correctly full-schedule and bucket-stable, but the overlay still rendered `run.programmes.map(...)`. A sufficiently long repeated-title run could therefore mount ellipsis presentation nodes far outside the frozen coarse programme render window and partially bypass the accepted 1.5× overscan architecture.

The correction keeps the two responsibilities separate. Canonical run derivation remains based on the complete chronological channel schedule before viewport windowing, so run ID, membership, start/end geometry, shared-title threshold and partial-left/right behaviour remain unchanged across bucket transitions. A new bounded presentation layer is then derived from the already-windowed programmes for the current coarse render window. `TotaalMicroProgrammeOverlay` receives the full run plus only the intersecting member subset and renders per-cell `…` nodes from that bounded subset. Shared-title geometry still uses the complete run start/end, so the title remains sticky/clipped against the true run bounds rather than the current bucket.

Deterministic coverage now proves that a long 24-member repeated run keeps the same full run ID/membership while two distant programme windows expose only their six intersecting overlay members. Component coverage additionally verifies that a 20-member run can render a four-member bounded subset while the overlay width/visible layout still follows the full run geometry. Existing 4×5-minute / 3×5-minute behaviour, per-programme Pressables, boundaries, accessibility/Programme Detail ownership and normal EdgeReadabilityOverlay semantics are unchanged.

Code head `53c2f5da50a24934b383abef94a33ae59b828062` passed CI #834 / run `35649144128`: npm ci, strict TypeScript, lint, **69 test files / 515 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android job. No visual metric, micro threshold, scroll ownership, programme-window size/overscan, Guide geometry, EPG/data contract, Per-zender or Nu & Straks behaviour changed.

Physical iPhone acceptance remains open because the repeated-title overlay is native-scroll-coupled presentation. The device gate should additionally hard-fling across bucket transitions and confirm no duplicate/flashing shared title while the bounded member subset swaps underneath the same canonical run identity.

**Next step:** Lead exact-head review of the final PR #114 head, then owner physical iPhone validation. Do not merge and do not request Independent QA yet.

---

## 21 september 2026 — Totaal micro-programme refinement reconciled and implemented

PR #114 was first reconciled with canonical `main` `a6d57197b78d62ea3757f4be170f0a1181f11413`, which contains the owner-approved micro-programme design/spec merge from PR #115. The existing Totaal production runtime, horizontal ownership fix, mount-time Reanimated worklet fix, first-open positioning refinement and distance-aware long-range `Nu` navigation were preserved unchanged.

The runtime now classifies a programme as a microcell from its **full real frame width** using the canonical strict `frameWidth < 48 × S` rule, with `S = max(1, effectiveFontScale)`. Individual microcells keep their exact programme action/frame/boundary but suppress title fragments and secondary time in favour of one centred semantic-primary `…`; current microcells use the existing Semibold title weight while non-current microcells use Medium. No minimum width, gap, fill, radius, shadow or duration retuning was introduced.

Repeated-title runs are derived once from the complete chronological programmes-per-channel before viewport windowing. Membership requires at least two adjacent microcells, exact temporal abutment and exact/case-sensitive title equality after trim plus whitespace collapse. Run IDs and membership therefore remain stable across programme-window buckets. The underlying programme cells continue to own every hit target, press state, accessibility label and Programme Detail destination.

A dedicated non-interactive presentation overlay renders repeated-title runs without creating a second accessibility tree or gesture surface. It uses the existing Reanimated `scrollX` shared value to compute the visible run intersection on the UI thread, so the shared title can re-anchor inside true run bounds during partial-left scrolling without React state updates per frame. At a visible intersection of at least `48 × S`, per-cell ellipses are suppressed and one Medium, one-line shared title is drawn with the frozen 6-pt inset. Below that threshold, the overlay returns to individually centred ellipses. The overlay is pointer-transparent/accessibility-hidden and has no background, so canonical underlying programme boundaries remain visible except where glyphs naturally cross them. Normal/non-micro partial-left readability continues through the existing `EdgeReadabilityOverlay`; microcells are explicitly excluded from that normal-title duplication path.

Deterministic coverage was added for strict threshold/equality behaviour, Dynamic Type scaling, full-frame classification, individual/current microcells, run formation and all break conditions, whitespace normalization/case sensitivity, bucket-independent membership, exact shared-title threshold, four×5-minute and three×5-minute examples, partial-left/right run geometry, fallback to ellipses, action/boundary ownership, pointer/accessibility transparency, Medium shared-current typography, centred micro affordance and semantic primary text usage across appearance tokens. Existing Guide/windowing/detail/accessibility tests remain green.

Implementation code head `2a8401efa90c87e7a0cbc9eb61bbe83e3aa26061` passed CI #829 / run `35645887273`: npm ci, strict TypeScript, lint, **69 test files / 513 tests**, and iOS/Android/web Expo export; the runtime-ui classifier correctly skipped the native/config Android job.

This implementation does not claim physical acceptance. The remaining gate is owner iPhone validation of individual microcells, repeated-title runs, per-programme tap ownership, partial-left/right transitions, Larger Text, light/dark, programme-window transitions and regression checks for first-open positioning plus short/long `Nu` navigation.

**Next step:** Lead exact-head review, then owner physical iPhone validation on the final PR #114 head. Do not merge and do not request Independent QA yet.

---

## 21 september 2026 — Totaal initial-positioning and long-distance Nu polish

Further physical iPhone validation of PR #114 confirmed that the mount-time crash was gone, then exposed two non-crashing presentation/runtime defects: Totaal could visibly paint around the television-day start before jumping to the intended viewed-time position, and a long animated `Nu` return could temporarily outrun the coarse programme window and expose an empty schedule while the channel rail remained visible.

Development kept the accepted 120-pt viewed-time anchor, native horizontal ownership state machine, 1.5-viewport programme overscan, visual metrics, collapse/Reduce Motion and Guide data contracts unchanged. The first Totaal render now derives its authoritative horizontal offset and programme bucket synchronously from the initial viewed time. The mount/day positioning path was moved from a one-frame-delayed `requestAnimationFrame` effect to pre-paint `useLayoutEffect`, so the schedule and time axis are positioned together against an already-correct render bucket rather than first presenting the 06:00-side window.

Programmatic navigation now derives its animation policy from the existing programme-window overscan rather than adding another arbitrary timing/distance constant. Requested native animation is retained while the full travel is at most **1.5 programme viewports**, which is exactly the distance already covered safely by the source bucket's frozen overscan. Longer travel is converted to a direct two-phase jump: the target programme bucket commits first, then a layout effect positions the authoritative `scrollX`, schedule and time axis together. This prevents a long `Nu` animation from crossing more buckets than React windowing can guarantee while preserving native animation for nearby jumps. Reduce Motion continues to request direct positioning as before.

Deterministic windowing coverage now verifies target-bucket ownership on the first visible viewport, the exact 1.5-viewport animated boundary, long-distance target prealignment/direct navigation, and explicitly non-animated positioning. The existing horizontal ownership regression suite remains unchanged. Runtime head `89ff4294324feefbe40ee4c123d4cd47a39f39ba` passed CI #817 / run `35642921488`: npm ci, strict TypeScript, lint, **67 test files / 491 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android job.

No micro-programme rendering was implemented here; that remains intentionally deferred until the separate owner-approved Design/UX refinement is canonical. No Per-zender or Nu & Straks contract changed.

**Next step:** focused physical iPhone revalidation of initial Totaal presentation and both short/long `Nu` navigation on the final exact PR head, then continue the broader Totaal acceptance flow. Do not merge or request Independent QA yet.

---

## 21 september 2026 — Totaal mount-time Reanimated worklet contract fix

Focused physical iPhone revalidation still failed on exact head `3a50e2a39fefce80e7981f853735c85174593aff`: switching from another Guide presentation to Totaal continued to terminate the app immediately. The previously added horizontal single-source ownership state machine remains technically valid and is intentionally unchanged, but device evidence showed that reciprocal scroll ownership was not the direct mount-time termination cause.

Lead then identified a concrete Reanimated UI-thread contract violation on the unconditional Totaal mount path. `GuideView` creates `currentMarkerBodyStyle` with `useAnimatedStyle`, which synchronously calls `totaalCurrentTimeMarkerBodyX()`. That pure helper lacked an explicit `'worklet';` directive even though it executes on the UI thread. Development added only that directive; marker geometry and return values are unchanged. The existing deterministic marker-geometry test now also guards that the helper remains explicitly workletized.

The complete Totaal UI-thread call-chain audit covered `useAnimatedStyle`, `useAnimatedReaction` and `useAnimatedScrollHandler` paths in `GuideView`, `EdgeReadabilityOverlay`, `TimeAxisLeftMask` and shared `GuideChrome`. All other synchronous helper chains were already worklet-safe: `totaalStableScrollVisuals` → `guideChromeExpandedHeight` → `guidePresentationNavigationMetrics` → `guideUsesAccessibilityChrome`; `totaalCollapseProgressForScrollOffset`; `totaalChromeCondensedForProgress`; every horizontal-ownership helper including their nested idle-owner calls; `clippedTimeAxisLabelWidth` → `centredTimeAxisLabelLeft`; and `edgeBoundaryBucket`. Reanimated `scrollTo` and `scheduleOnRN` remain the intended UI/native and UI→RN bridges. No second non-worklet synchronous helper call was found.

Runtime/test head `cea16ddc551a80d30aa4b63d51e15106d34c2726` passed CI #814: npm ci, strict TypeScript, lint, **67 test files / 487 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android job. No visual metric, current-marker geometry, horizontal ownership behaviour, collapse/Reduce Motion, programme-windowing parameter, ChannelIdentity, Per-zender/Nu & Straks contract or canonical design/spec changed.

Green CI does not prove this native worklet failure class. Physical iPhone acceptance therefore remains **FAILED/CLOSED** until Lead reviews the exact final PR head and switching to Totaal is revalidated on-device. If termination persists after this targeted fix, the next diagnostic step is native crash-log capture rather than another speculative runtime change.

**Next step:** Lead exact-head review followed by focused physical iPhone revalidation; do not merge and do not request Independent QA before physical PASS.

---

## 21 september 2026 — Totaal physical iPhone crash: horizontal ownership fix candidate

Physical iPhone validation of PR #114 exact head `397fc54e3695a45d72442c0b7c15c38b5e29a1b7` failed immediately when switching to Totaal: the app terminated before visual validation could begin. Lead traced the highest-confidence runtime cause to reciprocal native horizontal mirroring between the independently draggable programme schedule and sticky time axis: each surface treated every `onScroll`, including the peer's programmatic mirror event, as authoritative and immediately scrolled the other surface back.

Development replaced that reciprocal path with a small worklet-safe single-source ownership state machine while preserving both native draggable surfaces. A schedule drag owns authoritative `scrollX` and mirrors only to the passive axis; an axis drag does the inverse. Passive mirror events are ignored, ownership survives the initiating surface's native momentum and is released only after settle, and only an idle surface may become the next gesture owner. Animated Nu movement uses the schedule as the temporary native programmatic owner so programme-window buckets continue to follow real native viewport movement. Initial positioning, day selection and other non-animated programmatic jumps set the authoritative offset and both native peers directly while ownership is idle, so their resulting native events cannot mirror back.

Deterministic regression coverage now exercises schedule→axis/no-back-mirror, axis→schedule/no-back-mirror, momentum retention, post-settle ownership transfer, loop-free direct positioning, animated Nu ownership, day-selection/120-pt-anchor alignment, authoritative programme-window bucket changes and non-momentum release. No visual metric, Reduce Motion geometry, programme-window parameter, ChannelIdentity, Per-zender or Nu & Straks contract changed. Final crash-fix candidate `eb1aaa24de68f0e69d53761901ab6dde9a94af9c` passed exact-head CI #812 / run `35636872975` with strict TypeScript, lint, **67 test files / 487 tests**, and iOS/Android/web Expo export; the runtime-ui classifier correctly skipped the native/config Android job.

Physical acceptance remains explicitly **FAILED/CLOSED** until Lead reviews the final exact head and switching to Totaal is revalidated on physical iPhone.

**Next step:** exact-head Lead review, then repeat physical iPhone validation; do not merge and do not request Independent QA before physical PASS.

---

## 21 september 2026 — Totaal production visual convergence implemented in PR #114

Development converged Totaal to the owner-approved production visual specification without replacing the proven 2D Guide architecture. The runtime now uses the shared GuideChrome/tabs, the fixed native schedule viewport with 56-pt collapse isolation, a persistent 52-pt day/Nu context plus 44-pt time axis, the 84-pt base logo-first channel rail and deterministic Dynamic Type geometry. Programme cells keep exact start/duration geometry at 3.00 pt/min base scale with zero permanent gap, no card fill/radius/progress treatment, Instrument Sans title hierarchy, current `tot HH:MM` copy, restrained temporal boundaries and semantic pressed-only elevation.

The time axis now uses real 15-minute positions with labels at :00/:30, production railTick hierarchy, a compact exact-minute current-time marker and no full-height now line. Totaal has an explicit ChannelIdentity presentation so successful logos do not duplicate visible names while retained channels remain accessible when programme actions are absent. Partial-left readability, viewport-bucketed programme windowing with 1.5-viewport overscan, D-2..D+7/06:00 television-day semantics, wall-clock-preserving day changes, Nu, native inertia/bounce/directional lock, fixture-first→hosted continuity and Programme Detail round-trip remain on the existing architecture.

A small runtime support refactor isolates Totaal programme rendering into `TotaalProgrammeCell` and adds deterministic helpers for collapse geometry, vertical channel-context preservation, unavailable-state presentation, axis/marker calibration and width-aware content degradation. No new dependency, provider/cache/Search/Tonight scope or parallel Guide implementation was introduced.

Deterministic coverage was expanded for geometry, no-gap programme widths, 15-minute axis hierarchy, typography/current copy, width degradation, current marker, logo/accessibility behaviour, 100/116 shared chrome with 196/212→96 collapse endpoints, compact date wording, 120-pt viewed-time anchor, television-day/day-switch/Nu semantics, Dynamic Type formulas, partial-left readability, programme windowing, Detail/runtime continuity, themes and shared Guide tabs. Lead review of exact head `ef8adb72f213917bb404c9fde30ee1742824b61b` then identified four deterministic production-spec mismatches before the physical gate: Reduce Motion did not compose to the same settled endpoint at the 28-pt discrete switch, :00/:30 axis labels were not geometrically centred on their ticks, the Totaal no-logo fallback used full `displayName` instead of `shortName ?? displayName`, and the required 16-pt clearance after the final row was missing. Those four issues were corrected on the existing PR without retuning any accepted metric or shared Per-zender/Nu & Straks contract.

Final implementation head `6985ed57625a2a9ea2520fb03b470c929e058752` passed PR CI #809: npm ci, strict TypeScript, lint, **66 test files / 478 tests**, and iOS/Android/web Expo export. The runtime-ui classifier correctly skipped the native/config Android compile job because no native/config files changed. Added deterministic coverage verifies composed Reduce Motion geometry at 27.99/28 pt for standard and Larger Text, semantic channel-offset continuity across that switch, centred axis-label/mask geometry, shortName/displayName fallback semantics and exact 16-pt trailing schedule clearance.

Physical acceptance is intentionally not claimed here. The next gate is renewed Lead exact-head review, then physical iPhone validation of expanded/condensed composition, Reduce Motion, horizontal/vertical gesture ownership, current-time marker/time-axis alignment, logo rail/fallback, final-row clearance, Dynamic Type, light/dark appearance, day/Nu transitions and Programme Detail round-trip before Independent QA.

**Next step:** renewed Lead exact-head review of PR #114; do not merge before the prescribed physical iPhone and Independent QA gates pass.

---

## 21 september 2026 — Totaal production visual specification canonical via PR #112

The owner-approved Totaal visual baseline from PR #110 is now converted into an implementation-ready production specification. PR #112 exact design/spec head `6c68202bce249c8eff2e198699e2a582bce55ede` passed docs-only CI #783 and merged as `4638f0574c60f3ad2f0d723c55a9291c9aff1e29`; post-merge CI #784 succeeded. The earlier one-file PR #111 review proposal was superseded and closed unmerged.

The canonical specification is now `docs/TOTAAL_VISUAL_CONVERGENCE.md`. It freezes the remaining production calibration without reopening the proven Guide architecture: 84-pt base channel rail, 76-pt base row, 3.00 pt/min horizontal scale, 52-pt day/Nu + 44-pt axis = 96-pt persistent functional stack, shared GuideChrome 100/116, native collapse56 with 44/60 compensation, deterministic Dynamic Type formulas, Instrument Sans programme hierarchy, logo-first rail, open no-card schedule treatment, 15-minute time axis, compact current-time marker, accessibility semantics, DST/loading/partial-left/short-programme edge cases and physical-device acceptance criteria.

No runtime code changed in PR #112. The owner-approved design/spec is now frozen Development authority; physical iPhone evidence remains required on the eventual implementation head.

**Next step:** Development performs Totaal production visual convergence on the existing proven Totaal architecture, followed by exact-head Lead review, physical iPhone validation and Independent QA. Phase 5 Search remains paused until this work closes.

---

## 21 september 2026 — Owner correction: Totaal production visual design is still open

The owner corrected an over-broad project closeout: Totaal has a proven and physically accepted **interaction/technical baseline** plus accepted shared day-navigation and typography contracts, but its **final production visual design has not yet been completed or owner-approved**.

This supersedes the Phase 4/Phase 5 status wording introduced by the earlier closeout. Per-zender, Programme Detail and Nu & Straks production convergence remain closed and accepted; Totaal performance/windowing, television-day semantics, gestures and Programme Detail context also remain frozen. What is reopened is specifically the **Totaal production visual design and subsequent visual convergence**.

The existing Totaal light/dark assets, `design/current/guide/TOTAAL.md` and `docs/TOTAAL_VISUAL_CONVERGENCE.md` are therefore demoted from an accepted production target to **provisional design direction / inactive candidate handoff**. They may inform exploration but must not trigger Development until the owner explicitly accepts the final Totaal design and the canonical spec is updated.

Phase 4 remains ACTIVE for this work. Phase 5 Search remains planned but is not the current next step.

**Next step:** Totaal Design / UX Exploration using the frozen interaction/data/day-selector/typography constraints; after owner acceptance, canonicalize the final production design/spec before Development.

---

## 21 september 2026 — Phase 4 closed; persistent schedule cache not selected

Phase 4 Core Guide MVP hardening is closed on iPhone after Totaal performance hardening, Per-zender production convergence, Programme Detail production convergence and Nu & Straks production convergence were merged and accepted. Nu & Straks PR #96 merged as `b0df0cc08f565aa1a36edf794e60ced0f391f67c`; exact-main CI #754 succeeded including the main/release full-ABI Android build. Canonical Nu & Straks closeout PR #105 merged as `958f0ebd68ffbc4e2ca7d4bc36816446ef451128`; exact-main docs CI #758 succeeded. PR #106 then clarified historical ledger wording without changing runtime or scope.

The final Phase 4 architecture decision is **not to add persistent mobile schedule caching now**. Issue #67 measured the cold Guide path before any cache/prefetch change and showed the dominant bottleneck was Totaal React/render + large-grid commit/mount work rather than network. Issues #70/#73 and the accepted bounded horizontal programme-windowing work resolved that performance path without persistent storage, eager horizon prefetch or a new dependency. No separate measured offline requirement was found that would justify SQLite, TanStack Query or another schedule-persistence layer during Phase 4.

Current graceful degradation remains deterministic fixture-first rendering plus preservation of usable in-memory runtime schedule state across failed refreshes. The PRODUCT MVP promise for local caching/graceful offline fallback is not deleted: true no-network cold-start behaviour and any concrete persistent-cache technology selection remain a Phase 9 release-like hardening gate, where standalone/dev-build evidence can actually prove the requirement outside Expo Go.

Physical Android interaction validation remains deferred because Android hardware is not available; native compilation is not physical acceptance.

**Next step:** Phase 5 Search and Discovery starts with Search. Tonight remains later in Phase 5 only after its value and data requirements are clear.

---

## 21 september 2026 — Nu & Straks production convergence merged through PR #96

Nu & Straks production convergence is merged to `main` through PR #96. Final exact implementation head `f7e88a4a2cb3a212d59a4827e7f28c1e2e665975` passed exact-head CI #753 with **64 test files / 448 tests**, strict TypeScript, lint, iOS/Android/web exports and the PR native Android/config gate. Owner physical iPhone validation passed on the final visual/product composition and, after Independent QA found two implementation-correctness blockers, a focused physical revalidation passed the corrected live rail ownership and unavailable-state VoiceOver behaviour on the final head. Independent QA then returned PASS on that exact head.

The final QA corrections keep live semantics on the exact clock minute while recentering the rail once when a live session crosses to a new nearest-quarter target; entering native browse/drag relinquishes that clock-driven rail ownership synchronously so momentum is never fought. During temporary schedule unavailability, an already established channel catalogue now remains semantically discoverable to VoiceOver/TalkBack; normal programme-present rows continue to avoid redundant channel focus stops because programme actions already carry the full channel name.

PR #96 merge commit: `b0df0cc08f565aa1a36edf794e60ced0f391f67c`. Exact-main CI #754 completed **SUCCESS**, including strict TypeScript, lint, the full test suite, iOS/Android/web exports and the main/release **full-ABI Android debug APK build**.

Physical Android interaction validation remains deferred because Android hardware is not available; successful native compilation is not represented as physical Android acceptance.

**Next step:** complete the canonical project-state closeout. The remaining Phase 4 decision is whether measured MVP/offline requirements justify local schedule persistence/cache; do not add it speculatively.

---

## 21 september 2026 — PR #96 Independent QA correctness fixes

Independent QA on exact head `ea2c45d65837903724684a7cd99c77314ef9a2d3` found two implementation correctness blockers without reopening any accepted Nu & Straks visual/layout contract.

Live mode now keeps the rail spatially coherent as the Guide clock advances. The exact semantic live reference continues to follow the actual minute, while a dedicated last-live-centred slot ref recentres the rail once when the nearest quarter-hour target changes. Repeated clock ticks inside the same target do not scroll again. Native drag switches live ownership off synchronously before state reconciliation, so clock advancement cannot fight a user drag or native momentum; direct slot/Nu/Primetime behaviour and the no-secondary-scrollTo settle contract remain unchanged. Nu tests freeze `Date.now()` to the injected Guide clock and now cover both same-television-day restore and a cross-06:00 restore deterministically.

When a previously established channel catalogue is retained during schedule unavailability, each retained channel identity now exposes its full `displayName` to VoiceOver/TalkBack because no programme actions are present to carry that identity. Normal schedule-present rows keep their existing non-redundant treatment: channel identity remains excluded as a separate accessibility focus stop while programme actions include the full channel name. The single calm unavailable-state message and no-fabricated-programme contract remain unchanged.

Regression coverage now includes live 20:17 -> 20:23 nearest-quarter recentering exactly once, no repeat recenter inside the same target, exact programme advancement while the target stays unchanged, live->browse cancellation before momentum settles, deterministic Nu restore, retained-channel accessibility in the unavailable state, absence of redundant channel focus stops in normal rows and the real `ChannelIdentity` accessible/non-accessible contract.

**Verification:** exact-head CI is required before re-gating. **Next step:** Lead exact-head review, focused physical iPhone validation of live boundary recentering and VoiceOver retained-channel discovery, then Independent QA re-review of these two blockers. Do not merge before those gates pass.

---

## 21 september 2026 — PR #96 implements final standard-text following density

Existing runtime PR #96 is reconciled with canonical `main` `957125a607dac7d69b46cdfb87618c568ed09044`, preserving the PR #104 design/docs baseline exactly.

Runtime changes are limited to the standard-text following-list content placement requested by the final Lead handoff. At fontScale <=1.35 the existing 44-pt iOS / 48-dp Android following Pressables remain adjacent and non-overlapping, while the one-line visible content uses `visibleSlack = targetHeight - 20` with progressive top offsets of 2/3, 1/3 and 0. This resolves to **16 / 8 / 0 pt on iOS** and **19 / 9 / 0 dp on Android**. The content remains inside its own target. Above fontScale 1.35 no offset is applied: the already physically accepted inline accessibility and extreme stacked fallback compositions remain vertically centred and keep their existing height formulas.

All other accepted Nu & Straks behaviour and geometry remain unchanged, including the 64-pt bottom-aligned reference block, 0-pt reference→following gap, 12-pt channel bottom padding, 216/228 base row totals, 52+52=104 functional stack, rail-bottom `railTick`, 15-minute rail semantics, native momentum ownership, vertical context preservation, Programme Detail round-trip, Per-zender shell reconciliation, unavailable-data behaviour and deferred loading.

Deterministic coverage now locks the 16/8/0 and 19/9/0 standard offsets, content containment through fontScale 1.35, adjacent 44/48-safe target rects, and centred Larger Text behaviour without changing the frozen row/layout formulas.

**Verification:** exact-head CI is required before handoff. **Next step:** Lead exact-head re-review, then one focused physical iPhone recheck of following-list density plus minimal regression smoke. Independent QA remains blocked until physical PASS.

---

## 21 september 2026 — Nu & Straks final standard-text following density micro-refinement

Physical iPhone review of PR #96 exact head `3cafcc6bee996eb1923549bb3b65fdabb6666262` accepted the final reference-time removal, rail-bottom treatment, dark mode, Larger Text, 15-minute rail/ticks, Nu/Primetime, vertical channel-position preservation and the tightened reference→first-following transition. One visual issue remained: at standard text, following #1→#2 and #2→#3 still read too loose because each one-line content block was centred in its independent 44-pt iOS / 48-dp Android Pressable.

The interaction geometry remains frozen. The final owner correction changes only standard-text content placement inside the existing targets. With `visibleSlack = followingTargetHeight - 20`, following #1 uses top offset `round(slack × 2/3)`, #2 uses `round(slack × 1/3)`, and #3 uses 0. This produces approximately 16-pt visible gaps on iOS and 18–19-dp gaps on Android while retaining separate, adjacent, non-overlapping targets and keeping all visible content inside its own Pressable. Larger Text (>1.35) remains physically accepted and vertically centred.

**Next step:** update the existing PR #96 only for this standard-text content-placement rule, add deterministic coverage, run exact-head CI and perform one final focused physical iPhone recheck. Independent QA remains blocked until physical PASS.

---

## 21 september 2026 — Nu & Straks final physical composition canonical via PR #102

Physical iPhone review of PR #96 exact head `224e7df1d47dbb5c42694cb36469de673496e7d5` produced a partial PASS: dark mode, Larger Text/Dynamic Type composition, vertical channel-position preservation, Nu, Primetime, 15-minute navigation and the vertical rail ticks were accepted. Three presentation details remained open and were owner-refined in design/spec PR #102.

PR #102 merged with exact design head `67a15db6e7f325247ca49bc95e34811449cd1729`; merge commit `778445acbf8f71b1383fdede4178f861e4074f62`. Post-merge docs/design CI #725 is green.

The final refinement removes all standalone visible reference-time copy in both live and browse modes and deletes the obsolete Larger Text reference-time lane. Nu & Straks now keeps a 52-pt utility-only Primetime/Nu context plus 52-pt rail = **104 pt persistent functional stack at every font scale**. Shared Guide Larger Text tabs remain unchanged at 64 pt/max two lines. The rail-bottom line becomes **exactly 1 pt semantic `railTick` @0.78**, matching the approved quarter-hour ticks rather than generic `border`/platform hairline treatment.

Reference/following density is tightened without changing hit geometry: reference minimum stays 64 pt but the title is bottom-aligned with 0 pt extra bottom inset; the dedicated transition becomes **0 pt**; channel bottom padding becomes **12 pt** so normal rows remain **216 pt iOS / 228 dp Android**; all three following visible content blocks are centred while the Pressables stay adjacent, independent and minimum 44/48. The already physically accepted Larger Text following layout/formulas remain frozen.

**Next step:** Development reconciles the existing PR #96 against this final canonical baseline, updates deterministic tests/PR body/DEVLOG and produces a new exact-head CI candidate. Then Lead re-review and focused physical iPhone revalidation; Independent QA only after physical PASS.

---

## 21 september 2026 — Nu & Straks physical accessibility refinement canonical via PR #100

The owner accepted the targeted refinement derived from physical iPhone rejection of PR #96 exact head `32db9459d265e8546c7137baf82e623f015ad652`. Design/spec PR #100 merged with exact design head `d2ece22771b35f369d40e58a51f8b85ffb461933`; merge commit `319e3caad758d0d7b511f2a01180ad91847a293f`. Post-merge docs/design CI #695 is green.

The refinement remains narrow. Rail ticks keep their 1-pt geometry but move from generic `border` to a dedicated `railTick` semantic: light `#80807A`, dark `#72726B`, major opacity 1.00 and quarter opacity 0.78. Larger-text shared Guide tabs become 64 pt / max two lines above fontScale 1.35 while retaining the 1.20 compact-label cap. Nu & Straks reference/utilities become an 88-pt 40+48 two-lane context above 1.35, producing a 140-pt persistent accessibility functional stack. Following programmes above 1.35 now use an inline time+title, maximum-two-line composition; stacked time-above-title is reserved for the extreme fontScale >2.0 plus programme-width <180 pt fallback. The three following touch targets remain independent 44/48 minimums, while visible content is clustered #1 bottom / #2 centre / #3 top to tighten perceived rhythm.

The shared presentation-tab accessibility rule also updates the Per-zender canonical shell geometry above fontScale 1.35, without changing its 52-pt temporal context or product/content model.

**Next step:** Development updates the existing PR #96 against the PR #100 canonical baseline, including deterministic tests for the new railTick, responsive shared shell and larger-text/density rules. Physical iPhone acceptance remains paused until Lead accepts the new exact runtime head for another physical pass; Independent QA remains after physical PASS.

---

## 21 september 2026 — Nu & Straks physical candidate not accepted

Runtime PR #96 was successfully reconciled to the PR #97 canonical baseline and reached exact head `32db9459d265e8546c7137baf82e623f015ad652`. Exact-head CI #691 was green with 62 test files / 424 tests, exports and native/config checks. Lead opened the physical iPhone gate.

Physical review did **not** accept this candidate. Dark mode as a whole is accepted, but three targeted issues remain: time-rail major/quarter hairlines are physically too low-contrast (especially dark mode); large-text/Dynamic Type composition produces material chrome truncation and excessive following-row growth; and the three following programmes still read visually too loose even though the runtime already meets the current 44/48 minimum-target and zero-extra-gap numeric spec.

This is therefore classified as a canonical refinement, not an ordinary implementation miss. Physical validation, Independent QA and merge of PR #96 remain paused. Next step is targeted Design / UX refinement of rail-tick contrast, large-text composition and visual density while preserving independent minimum touch targets and the rest of the accepted Nu & Straks interaction model.

---

## 21 september 2026 — Nu & Straks owner refinement canonical via PR #97

Fysieke iPhone-review van de open Nu & Straks production-convergence candidate leverde concrete UX/visual evidence op voor een kleine owner-approved refinement van de canonical baseline. Design/spec PR #97 is gemergd met exacte design-head `d0834ce2f25ec25c9e969354bc5241790960e10a`; merge-commit op `main`: `8b838fc71e2dd3aea601731defb11e9680a5d99b`. Post-merge docs/design CI #677 is groen.

De refinement supersedeert alleen expliciete Nu & Straks-calibraties: browse-rail van 30 naar **15 minuten**; tekstlabels alleen op hele/halve uren; langere hairline op hele/halve uren en kortere unlabeled kwartierhairline; live `Nu` blijft de exacte actuele minuut; zichtbaar `Referentietijd` en reference-programme `tot HH:MM` vervallen; reference block wordt minimaal **64 pt** met **4 pt** overgang naar de following list; drie following targets sluiten direct aan met behoud van **44 pt iOS / 48 dp Android** minimumtargets; active/current `Nu` en return-to-live `Nu` krijgen verschillende states; normale channel rows worden **216 pt iOS / 228 dp Android**.

Open runtime PR #96 was gebouwd tegen de eerdere calibratie. De lopende fysieke acceptatie is daarom **gestopt**. De eerdere runtimearchitectuur en fixes blijven behouden voor zover PR #97 ze niet supersedeert, inclusief 06:00 television-day semantics, native rail fling/settle ownership, stable vertical channel context, Programme Detail round-trip, unavailable-data catalogue preservation, deferred `NowNextGuideView` loading en de Expo Router route-tree test-isolationfix.

**Volgende stap:** Development reconcileert PR #96 tegen de nieuwe canonical spec op `main`, levert een nieuwe exact-head met volledige deterministic coverage en exact-head CI, daarna Lead re-review en opnieuw fysieke iPhone-validatie. Independent QA pas na nieuwe fysieke acceptance.

---

## 18 september 2026 — Nu & Straks production design canonical via PR #93

De owner-approved Nu & Straks Accepted Design Refinement is canoniek gemergd. Finale exacte design-head: `18ee2b81357819b39ee35b9196d7f984ad59e9b7`; merge-commit op `main`: `21e1e61b950046fd0e77308be5a64d09721e6310`. Post-merge CI #654 is groen.

De nieuwe production handoff staat in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`. De reeds geaccepteerde compositie blijft intact: één gedeeld reference instant, dominant reference programme, exact drie following-programme slots, Nu/Primetime, stabiele verticale channel-context, native rail fling/settle, direct Programme Detail en deferred `NowNextGuideView`.

De refinement maakt de bekende accessibility/density debt production-ready: echte niet-overlappende 44-pt iOS / 48-dp Android targets, deterministic row geometry, stacked following time/title boven fontScale 1.35, substantive Dynamic Type, Instrument Sans en expliciete light/dark/system, safe-area, VoiceOver/TalkBack en Reduce Motion-contracten. Daarnaast maakt de spec duidelijk dat strict-midnight day bounds, prototype standalone header/floating selector, 24-pt following rows, system-font styling en opacity-heavy pressed feedback runtime debt zijn en geen designauthority.

**Volgende stap:** implementeer deze production specification als één afzonderlijke HIGH-risk Nu & Straks runtime-convergence increment. Vereist: deterministic tests, exact-head CI, fysieke iPhone-validatie en daarna Independent QA. Geen nieuwe designexploration tenzij concrete implementatie-evidence een fundamentele product/UX-keuze noodzakelijk maakt.

---

## 18 september 2026 — PR #92 Programme Detail production convergence gesloten

PR #92 is na meerdere gerichte Independent QA-rondes gemergd. Finale exacte implementatie-head: `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf`; merge-commit op `main`: `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b`.

Productiegedrag is nu vastgelegd en geïmplementeerd: title-first Programme Detail vanuit alle drie Guide-presentaties, gemounte Guide/context-preserving modal boundary, `Herinner mij` met vaste vijf-minutenlead en immediate fallback, persisted `Bewaar`, contextual sticky action copies, Dynamic-Type-safe stacking, safe-area ownership en handle-zone swipe-to-dismiss.

De HIGH-risk reminderflow is tijdens QA gehard voor tijdgrenzen/resume, permission-await crossings, native reconciliation failures, cancellation-vs-`Bewaar` concurrency en Android 12+ exact-alarm special access. Android gebruikt bewust `SCHEDULE_EXACT_ALARM`, controleert `canScheduleExactAlarms()`, biedt de app-specifieke settings-route, failt gesloten bij ontbrekende/indeterminate capability en annuleert bij geverifieerde revocation eerst de native Expo scheduled request voordat lokale metadata wordt verwijderd. Bij onbevestigde cancellation blijft het notification-id inactief bewaard als cleanup-handle.

Fysieke iPhone-validatie en gerichte post-fix smoke zijn PASS. Independent QA gaf finale PASS op exact head `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf`. Post-merge CI #650 op exact `main` `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b` is volledig groen voor `classify`, `quality` en `android-native`, inclusief de main/release full-ABI Android build. Fysieke Android special-access interactie blijft conform projectstatus deferred wegens ontbreken van Android-hardware.

**Volgende stap:** geen nieuwe vrije designexploratie. Start Accepted Design Refinement voor de reeds geaccepteerde Nu & Straks-baseline en leg eerst de production implementation specification vast als `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`; daarna pas runtime Development.

---

## 18 september 2026 — PR #92 final QA fix: Android exact-alarm special-access lifecycle

Independent QA re-review bevestigde de eerdere vijf Programme Detail/reminder-fixes en vond nog één Android-blocker: `SCHEDULE_EXACT_ALARM` stond correct in de manifest, maar runtime kon niet bewijzen dat Android 12+ de speciale “Alarmen en herinneringen”-toegang daadwerkelijk had verleend voordat een reminder als actief werd opgeslagen.

De fix houdt bewust `SCHEDULE_EXACT_ALARM` aan. Teevee schakelt niet naar `USE_EXACT_ALARM`; deze reminderfunctie is een secundaire user-facing feature en de bredere, user-controlled special-access route past bij de Android/Play-policygrens. Een kleine lokale Android Expo-module exposeert exact twee platformprimitives: `AlarmManager.canScheduleExactAlarms()` en de app-specifieke `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` settings-intent. Er is geen brede native abstraction of database/state-framework toegevoegd.

Scheduling op Android 12+ is nu fail-closed: na notification-permission/channel setup moet exact-alarm capability aantoonbaar beschikbaar zijn. Ontbreekt de toegang, dan opent Teevee vanuit de expliciete `Herinner mij`-actie de relevante Android-instelling, wacht op app-resume en controleert opnieuw. Direct vóór `scheduleNotificationAsync` volgt nog een tweede capability-check tegen revocation/races. Alleen een succesvolle native schedule-call ná bewezen capability mag persisted/visible `Herinnering aan` state opleveren. iOS en de canonical vijf-minutentiming blijven ongewijzigd.

Reconciliation behandelt revocation eveneens expliciet. Voor een nog niet afgevuurde reminder met `canScheduleExactAlarms() == false` probeert Teevee eerst de onderliggende Expo scheduled notification via het bestaande notification-id te annuleren. Alleen bevestigde native cancellation levert `verified-invalid` op, waarna Programme Detail de lokale metadata mag verwijderen. Als cancellation niet bevestigd kan worden, blijft het notification-id als cleanup-handle bewaard in een inactieve `indeterminate` state; ook een indeterminate capability-check blijft metadata behouden zonder de reminder actief te presenteren. Programme Detail voert reconciliation opnieuw uit bij app-resume, zodat intrekking tijdens settings/background direct wordt verwerkt zonder een orphan native request bewust achter te laten.

Deterministische coverage dekt capability available/unavailable, settings round-trip na grant, native-boundary failure, revocation vlak vóór scheduling, confirmed native cancellation vóór lokale revocation-cleanup, cancellation failure met behoud van persisted notification-id, revocation bij reconciliation/resume, geen persisted/active reminder bij ontbrekende capability en ongewijzigde iOS scheduling. Native CI verifieert naast manifest-permission ook Expo autolinking van `TeeveeExactAlarmModule`, clean prebuild en Android APK compile.

**Volgende stap:** exact-head CI volledig groen; daarna alleen niet-Android fysieke smoke waar zinvol. Android exact-time delivery blijft conform projectstatus deferred totdat Android-hardware beschikbaar is. Independent QA moet de nieuwe exact head opnieuw beoordelen; niet mergen vóór QA PASS.

---

## 18 september 2026 — PR #92 Independent QA required-fix pass

Independent QA op Programme Detail head `22fa7a36de071a528da0192f91e7c615d37f060b` vond vijf blocking lifecycle/concurrency-contracten. De fix-pass verandert geen producttiming of Guide-architectuur: de Guide blijft gemount onder de modal en de reminder blijft exact vijf minuten vóór start, met immediate fallback binnen vijf minuten.

Android declareert nu expliciet `android.permission.SCHEDULE_EXACT_ALARM`; de native CI-gate controleert na een schone Expo prebuild dat deze permission daadwerkelijk in de gegenereerde AndroidManifest staat. Programme Detail gebruikt een boundary-driven clock die op programmastart, programma-einde en app-resume ververst, zodat `Herinner mij` en `Nu bezig` niet op een oude render bevriezen. De native reminder-service herberekent de actuele fire instant na permission/channel-awaits en weigert scheduling wanneer de programmastart inmiddels is gepasseerd.

Reminder reconciliation heeft voortaan drie expliciete uitkomsten: verified-valid, verified-invalid en indeterminate. Native query/cancel failures verwijderen het persistente notification-id niet; een aantoonbaar stale maar niet bevestigbaar gecancelde reminder wordt tegelijk niet als actief gepresenteerd. Bij async cancellation wordt na de native await altijd verse personal state gelezen en alleen de nog-identieke reminder compare-and-apply verwijderd, zodat een gelijktijdige `Bewaar`-mutatie behouden blijft.

Deterministische regressies dekken start/eind/resume, permission-prompt crossings van vijf-minutengrens en programmastart, native reconciliation failure paths en de reminder-cancel-versus-Bewaar interleaving. **Volgende stap:** exact-head CI; daarna gerichte fysieke revalidatie van de gewijzigde reminder/lifecyclepaden en Independent QA re-review. Niet mergen.

---

## 18 september 2026 — PR #88 rebased onto accepted PR #89 4/24 spacing calibration

Accepted Design Refinement PR #89 is merged on `main` and supersedes only the expanded/rest Per-zender gap distribution. PR #88 is rebased onto that canonical baseline rather than carrying its pre-#89 design documentation forward.

Runtime calibration changes only the expanded endpoints from 16/12 to **4 pt rail→temporal context** and **24 pt temporal context→schedule**. The sum remains 28 pt, so the frozen PR #81 geometry is unchanged: **140 pt** full visual contraction, **56 pt** native collapse, **84 pt** visual compensation, **112 pt** fixed viewport top and **140 pt** schedule content top inset. Condensed remains 0/52/0.

The previously accepted safe-area, collapse-isolation, programme-anchor, selected-schedule-height/trailing-whitespace, channel-switching, Nu/Primetime and theme fixes are preserved unchanged. The explicit opaque gap ownership introduced after physical validation also remains; only its accepted endpoint heights change.

Deterministic coverage proves visible rest rail→context = 4 pt, context = 52 pt, context→schedule = 24 pt, condensed gaps = 0/0, rest/settled overlay bottoms = 252/112 pt, total contraction = 140 pt and semantic native↔schedule anchor round-tripping. Full HIGH-risk exact-head CI remains required; do not merge or request Independent QA yet.

---

## 18 september 2026 — Per-zender required visual-convergence follow-up on PR #88

Physical iPhone validation of PR #88 head `75cd5f7148bab4583b335924100f2684e96b16bf` accepted the safe-area, scroll-isolation, programme-anchor, trailing-whitespace, channel-switching, Nu/Primetime and light/dark fixes. One required visual issue remained: the canonical 16-pt rail→context gap read visibly larger while the canonical 12-pt context→schedule gap read effectively absent.

The numeric 16/52/12 → 0/52/0 geometry and frozen 140/56/84 collapse math were already correct. The remaining defect was visual ownership: the two functional gaps were transparent overlay spacers while the independently scrolling schedule renders underneath the overlay. The context→schedule spacer therefore relied on the enclosing overlay background/bounds to mask schedule content, which physical iOS rendering did not preserve strongly enough as visible whitespace. Both canonical gap zones now render their own opaque semantic background while retaining the exact accepted dimensions. No metric, safe-area coordinate, programme-row geometry, semantic anchor or collapse architecture changed.

Deterministic coverage now models explicit rail, context and schedule-content boundaries and proves rest-state visible gaps of exactly 16 and 12 pt, fixed 52-pt context, and settled-condensed gaps of 0/0. Exact-head CI and renewed physical Lead validation remain required before Independent QA; do not merge yet.

## 18 september 2026 — Per-zender PR #86/#87 runtime convergence + iOS safe area + trailing whitespace

Deze HIGH-risk Guide candidate convergeert de Per-zender runtime naar de na PR #86/#87 canonical 52-only temporal context zonder de PR #81 fixed-native-viewport/collapse-isolation terug te draaien. De obsolete 88-pt wrap-state, wrap-detectie en wrap-anchorcompensatie verdwijnen; rest/condensed geometry gebruikt 16/12 → 0/0 gaps, 72→60 rail, 56 pt native collapse, 140 pt totale visuele contractie en 84 pt visual compensation. Per-zender datumlabels volgen de expliciete 06:00-regel en geselecteerde-zendertekst wordt nergens buiten de logo-rail geïnjecteerd.

De fysieke iOS-statusbar overlap kwam uit absolute Per-zender chrome/schedule-posities binnen de core React Native SafeAreaView: de safe-area padding was geen betrouwbare coordinate origin voor de absolute kinderen. De candidate gebruikt daarom de daadwerkelijke top inset uit react-native-safe-area-context één keer als origin voor zowel overlay als fixed schedule viewport; er is geen device-specifieke padding en geen tweede SafeAreaView-compensatie.

De enorme trailing whitespace kwam niet uit TV-day bounds of ontbrekende providerdata maar uit verticale ownership: scheduleHeight was het maximum van de vorige, geselecteerde en volgende horizontale pager-page. Een zender met weinig programma's erfde daardoor de scrollhoogte van een veel langere buur. De verticale contenthoogte volgt nu uitsluitend de geselecteerde zender. Een daadwerkelijk lege, authoritative selected schedule-page toont een expliciete empty state; er worden geen fictieve programma's of providerworkarounds toegevoegd.

Deterministische regressies dekken 52-only context/no-wrap, 140/56/84 geometry, safe-area coordinate calculation, geselecteerde-zender height ownership, empty-state basisgeometry en de Per-zender 06:00 Vandaag/Morgen/weekday+date-semantiek. **Volgende stap:** exact-head CI; daarna Lead fysieke iPhone product/visual validation. Nog geen Independent QA en niet mergen.

---

## 18 september 2026 — PR #81 QA required fix: 52/88 context-anchor invariant

Independent QA vond op exact head `ce030817ff64db570a0a78ec779824e7662fedd8` één blocking edge case in de verder stabiele fixed-native-viewport architectuur: `contextWrapped` kon live 52→88 of 88→52 schakelen zonder equivalente schedule-anchorcompensatie. Daardoor verschoof programme-content 36 pt wanneer bijvoorbeeld de condensed channel prefix wrapping veroorzaakte of channel/day/font/viewport-hermeting de wrap-mode wijzigde.

De required fix maakt native↔semantic schedule-offsetconversie wrap-aware en compenseert een echte wrap-mode transition éénmalig op de UI-thread: native schedule offset en collapse anchor bewegen samen ±36 pt, zodat zowel het semantic programme als zijn visuele screen anchor en de huidige collapse progress gelijk blijven. De actieve ScrollView-viewport blijft absoluut/fixed; er is geen per-frame normal-flow mutatie toegevoegd. Wrap-detectie observeert voortaan de natuurlijke flex-layout en reset de live wrap-mode niet meer kunstmatig bij channel/day/fontScale/viewport-width changes.

Deterministische regressies starten op non-zero schedule offsets en dekken 52→88→52 door condensed-prefix wrapping, channel/day remeasurement in wrapped state, Dynamic Type en viewport-width transitions, plus wrap-aware native↔semantic round-tripping en collapse-progress behoud.

**Volgende stap:** exact-head CI volledig groen krijgen, daarna alleen deze required-fix set terug naar Independent QA. Niet mergen.

---

## 18 september 2026 — PR #81 Per-zender scroll feedback root cause geïsoleerd

De blocking verticale post-swipe oscillatie is op fysieke iPhone met tijdelijke native-scrollinstrumentatie gereproduceerd en verklaard. Een control fling zonder collapse decelereerde monotonic; zodra collapse actief werd, volgden herhaaldelijk negatieve contentOffset-sprongen op positieve beweging. De limit-cycle bleef bestaan nadat de binaire React condensed-state niet meer wisselde. Daarmee was React commit-churn niet de primaire oorzaak.

Root cause: dezelfde native verticale ScrollView stuurde collapseProgress, terwijl die progress tot 148 pt normal-flow geometry boven de ScrollView wijzigde binnen 56 pt native collapse. iOS compenseerde die sibling-heightmutaties in contentOffset; die gecompenseerde offset stuurde vervolgens de tegenovergestelde collapse-state en sloot de feedbacklus.

De structurele fix houdt de native schedule-viewport vast op de settled functional-stack baseline. Guide chrome, 72→60 rail en 24→0 / 12→0 gaps blijven visueel scroll-coupled, maar staan in een absolute overlay. De schedule reserveert de 148-pt rest-inset statisch; 56 pt komt uit native scroll en de resterende 92 pt uit visual content compensation. Native↔semantic schedule-offsetconversie bewaart programme/timestamp anchors en geanimeerde Nu/Primetime-targets. Deterministische regressietests bewaken rest/mid/condensed alignment, wrapped context, de 148 = 56 + 92 contractie-invariant en semantic offset round-tripping.

De tijdelijke TEEVEE_SCROLL_* instrumentation is na het fysieke root-causebewijs volledig uit de production candidate verwijderd. De scroll-layout invariant staat duurzaam in docs/PER_ZENDER_VISUAL_CONVERGENCE.md.

**Volgende stap:** run exact-head CI op de production-clean PR #81 head en laat daarna exact die head fysiek op iPhone revalideren. Geen Independent QA en geen merge vóór owner physical acceptance.

---

## 18 september 2026 — PR #81 final Per-zender convergence: stable day-switch identity + 176-pt current row

Canonical main through PR #85 is geïntegreerd in PR #81 zonder de fixed-row runtime terug te draaien. De production spec verwijdert de grote selected-channel heading uit de rest state en vervangt de oude 120-pt current row door een ruimere 176-pt base row: current title 19/23, synopsis 15/22 maximaal vier regels, 10 pt title→description, minimaal 20 pt vrije ruimte voor de lokale 4-pt progressbar. Dynamic Type gebruikt de canonical content-safe minimumformule; standaardrows blijven uniform 52 × contentScale.

De fysieke day-switch bug had een concrete ownership-oorzaak: Per zender renderde bij een nog niet geladen non-current dag tijdelijk `buildRuntimeGuideFixture(selectedDayStartMs)`. Daardoor wisselde een reeds canonical NPO/RTL/SBS-kanaalcatalogus naar de 48-kanaals generieke fixture (`channel-1`, `Publiek 1`, `Vier`, enz.), verdwenen lokale logo-resolutions en werden rail/pager/rows plus scroll-anchor eerst voor fallback en daarna opnieuw voor canonical data opgebouwd. Dat verklaart de waargenomen structurele churn en is de primaire performance-root-cause die in deze pass is verwijderd.

De presentatie houdt broadcaster identity en programme ownership nu apart. Zodra canonical channels zijn vastgesteld, blijft die catalogus tijdens selected-day loading/unavailable staan en toont de programme-area alleen een rustige loading/unavailable state. De generieke deterministic fixture blijft uitsluitend actief in echte fixture mode. Zenderselectie wordt semantisch op channel-id bewaard in plaats van op array-index; de programma-anchor wordt pas opnieuw gezet wanneer de echte selected-day schedule beschikbaar is; pager keys blijven stabiel over dagwissels. Hiermee verdwijnen de fallback→real catalogue swap en dubbele programme-anchor reset uit de normale real-data day-switch path. Dit is deterministic/static evidence; vloeiendheid ná de fix moet nog fysiek op iPhone worden bewezen.

Dark-mode asset audit: de bestaande provenance-checked NPO-marks blijven bruikbaar. Voor RTL 4, RTL 5 en SBS6 is in de huidige geverifieerde assetbronnen geen afzonderlijke betrouwbare dark-background variant vastgesteld. Er is daarom bewust niet getint, gerecolour’d, op een generieke witte tegel geplaatst of een merkvariant nagetekend. Deze drie dark-mode marks blijven een expliciete asset-input/physical-acceptance blocker en staan ook in `docs/CHANNEL_LOGO_ASSETS.md`.

**Volgende stap:** exact-head CI op de finale PR #81 head volledig groen krijgen en daarna dezelfde head fysiek op iPhone revalideren: day switch, scrolljank, 176-pt current row, rest/condensed compositie en dark-mode logo’s. Pas na owner acceptance mag Independent QA worden aangevraagd.

---

## 17 september 2026 — PR #81 geïntegreerd met canonical Per-zender refinement en lokale channel-logo laag

PR #81 is veilig bijgewerkt met canonical `main` na Design PR #83. De nieuwe designbaseline wint voor de vier gewijzigde design/documentatiebestanden; de bestaande fixed-row runtime en eerder fysiek aangebrachte polish blijven behouden en zijn vervolgens aangepast aan de nieuwe accepted delta.

Gebouwd in de PR-branch:
- Per-zender titels 17/21 Medium en current 19/23 Bold, met 52/120 fixed-row geometry intact;
- 72-pt rest rail naar 60-pt settled condensed rail zonder 48×48 channel items te schalen;
- deterministic selected-channel recentering met rail-bounds als hoogste prioriteit en Reduce Motion zonder recenteranimatie;
- semantic Nu/Primetime current/action/disabled states op programme/timestamp anchors, inclusief Nu-precedence;
- full-row temporary `surface` press feedback zonder permanente card treatment;
- lokale provider-onafhankelijke logo registry voor NPO 1, NPO 2, NPO 3, RTL 4, RTL 5 en SBS6; provider `logoUrl` blijft secondary fallback input;
- provenance en ingest-hashes vastgelegd in `docs/CHANNEL_LOGO_ASSETS.md` en `assets/channels/SHA256SUMS`;
- deterministic coverage voor geometry/typography, rail targets, temporal-state precedence/unavailability, press surface, local-logo manifest en ChannelIdentity fallback/accessibility.

Deze entry claimt nog geen fysieke acceptatie of Independent QA. Exact-head CI-evidence hoort bij PR #81; iedere latere headwijziging maakt eerdere evidence ongeldig.

**Volgende stap:** exact-head CI voor PR #81 groen maken en daarna de owner de volledige fysieke iPhone Per-zender acceptance laten uitvoeren, inclusief minimaal één screenshot met presentation selector, echte logo's, selected channel, datum/Nu/Primetime en current programme. Pas daarna mag Independent QA worden aangevraagd.

---

## 15 september 2026 — Phase 4 television-day domain foundation gemergd

PR #62 is als eerste Phase 4 runtime-foundation increment gemergd naar `main` als `36468ed19eca7411079d2845763ca8de36c8d10f`. De wijziging legt de gedeelde productsemantiek voor televisiedagen in code vast, maar migreert bewust nog geen Guide UI, hosted loader of runtime lifecycle.

Gebouwd:
- 06:00 Europe/Amsterdam als expliciete television-day boundary;
- typed D-2..D+7 offsets en exact tien aaneengesloten television-day windows;
- DST-veilige `guideTelevisionDayStart()` en `guideTelevisionDayHorizon()` zonder canonical programme timestamps te verschuiven;
- gedeelde Amsterdam wall-clock resolver terwijl de tijdelijke Phase 3 `guideDayStart()` strict-midnight primitive behouden blijft.

De eerste onafhankelijke QA-review vond een blocking evidence-gap in de tests. Die is op de finale head `2d83c101b749083c39530ed2473103319f1311cf` gesloten met directe coverage voor exact 00:00, horizon-contiguïteit over beide 2026 DST-transities inclusief 23/25 uur, en out-of-range integer offsets. QA herbeoordeelde exact die head daarna zonder blocking of non-blocking findings. Exact-head CI run #362 was volledig groen voor `quality` en `android-native`.

Omdat deze PR alleen domain primitives/tests toevoegt en de bestaande runtime nog `guideDayStart()` + `loadTwoDayGuideSchedule()` gebruikt, was geen fysieke device-gate nodig voor deze increment.

**Volgende stap:** migreer de mobiele hosted schedule/runtime boundary van strict calendar `today + tomorrow` naar television-day-aware bounded loading/anchoring op de nieuwe 06:00 primitives, zonder in dezelfde increment de accepted Guide day-selector UI of frozen gestures te wijzigen.

---

## 15 september 2026 — Phase 3 fysiek gesloten; automatische development-EPG freshness

De volledige mobiele real-data boundary is op een fysieke iPhone geaccepteerd. De app toont eerst direct de deterministische fixture en schakelt daarna zonder crash of layoutbreuk over op canonical hosted EPG-data. Totaal, Per zender en deferred Nu & Straks blijven op echte data bruikbaar; Programme Detail opent en keert vanuit alle drie correct terug.

Aanvullende fysieke checks:
- Per zender adjacent-channel navigatie heen en terug blijft intact;
- Nu & Straks reference-time rail en verticale mixed gestures blijven coherent;
- background/resume behoudt reference time en zichtbare Guide-context;
- ontbrekende hosted coverage houdt de deterministische fixture actief;
- runtime netwerkuitval vernietigt de bestaande Guide-state niet.

Een echte no-network cold start is via Expo Go niet valide te testen omdat Expo Go na force-quit zelf Metro/netwerk nodig heeft. Dat blijft deferred naar een standalone/dev build en is geen Phase 3 blocker. Volledige evidence staat in `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE3.md`.

Om de tijdelijke development-EPG niet opnieuw handmatig te hoeven seeden, voegt PR #59 server-side automatische refresh toe:
- `pg_cron` + `pg_net` iedere zes uur;
- rolling Amsterdam-buffer voor vandaag, morgen en één rollover-dag;
- dedicated random cron-token encrypted in Supabase Vault;
- Supabase secret key blijft uitsluitend in de Edge Function omgeving;
- `epg-refresh` blijft voor `anon`/`authenticated` ontoegankelijk;
- partial current-day provider coverage wordt veilig overgeslagen in plaats van canonical coverage te beschadigen.

Live end-to-end smoke bewees de Vault-tokenroute tot en met canonical public read: 12 channels / 498 programma's vandaag, 12 / 485 morgen en 12 / 489 rollover. Anonymous direct refresh bleef 401. De tijdelijke smoke-helper is na verificatie weer inert (410) en JWT-protected.

**Verificatie:** fysieke iPhone Phase 3 gate volledig PASS. De PR moet nog exact-head CI groen hebben voordat hij mag mergen; daarna is Phase 4 de actieve fase. Physical Android blijft apart deferred.

**Volgende stap:** start Phase 4 met de shared television-day-aware D-2..D+7 schedule/day-selection foundation en wire die in Totaal en Per zender zonder de fysiek bewezen Guide gestures te retunen.

---

## 15 september 2026 — Televisiedag en minimale Guide-horizon frozen

De productowner heeft de definitieve dagsemantiek en minimale Guide-horizon vastgesteld. De Guide volgt voortaan niet een harde kalenderdaggrens om 00:00, maar een **televisiedag van 06:00 Europe/Amsterdam tot 06:00 de volgende kalenderdag**.

Producteffect:
- een gebruiker die om 00:05 opent blijft inhoudelijk in de televisieavond van de voorafgaande datum;
- iemand die om 21:00 bladert kan zonder expliciete datumwissel door naar programma's na 00:00;
- `Nu` blijft de echte actuele tijd, maar hoort tussen 00:00 en 05:59 bij de voorafgaande televisiedag;
- Totaal en Per zender moeten minimaal **D-2 t/m D+7** volledige televisiedagen ondersteunen;
- Nu & Straks blijft één actieve-dagpresentatie, maar gebruikt dezelfde 06:00-grens;
- gebruikers zien gewone datums/labels; `televisiedag` is een intern product- en architectuurbegrip.

Architectuur:
- canonical programme timestamps blijven echte UTC-instants; niets wordt verschoven om de televisiedag te simuleren;
- ADR 0008 legt de 06:00-grens, midnight continuity en D-2..D+7 vast;
- Phase 3 bewaakt dat de datalaag/query-contracten niet aan midnight of een permanente today+tomorrow-horizon worden gekoppeld;
- de huidige twee-daagse Phase 3 mobile loader blijft bewust slechts vertical-slice scope;
- Phase 4 implementeert en valideert de volledige multi-day UX, 06:00-rollover, historische/future navigatie, cache/refresh en contextbehoud;
- Phase 8 moet bewijzen dat de uiteindelijke productie-EPG de minimale horizon, historie, freshness en rechten kan leveren.

Documentatie bijgewerkt: `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md`, `DATA.md`, `BUILD_SPEC.md` en ADR 0008.

**Verificatie:** documentatie-only wijziging; er is nog geen runtimegedrag gewijzigd of fysiek gevalideerd. De bestaande Phase 3 physical real-data smoke blijft ongewijzigd de actieve exitgate.

**Volgende stap:** eerst de bestaande Phase 3 iPhone real-data smoke afronden; daarna in Phase 4 de television-day-aware D-2..D+7 Guide implementeren.

---

## 14 september 2026 — Mobile Guide aangesloten op canonical hosted EPG met fixture-first fallback

PR #50 is gemergd als `b60e2501ee757a20a080de393f618101b0970f90`. Daarmee accepteert de hosted transportlaag naast normale Amsterdamse kalenderdagen ook de 25-uurs wintertijd-dag. De exacte merge-commit op `main` had CI run #315 volledig groen voor zowel `quality` als `android-native`.

PR #51 is daarna gemergd als `0886cbe61272703323ba30cd2deb9cbc037754a8`. Dit is de eerste wijziging waarbij de mobiele Guide de provider-onafhankelijke canonical hosted schedule daadwerkelijk kan gebruiken.

Gebouwd:
- dependencyvrije `HostedGuideScheduleClient` naar alleen de publieke Teevee `guide-schedule` Edge Function;
- runtime-validatie van serialized canonical schedule responses;
- Amsterdam-correcte today+tomorrow loader, inclusief 23/25-uurs DST-dagen;
- deduplicatie van programma's die over de daggrens in beide reads voorkomen;
- kleine provider-onafhankelijke in-memory runtime schedule-store;
- fixture-first startup: de eerste frame blijft volledig lokaal/deterministisch;
- automatische hosted refresh na startup, bij app-resume en na Amsterdamse dagwissel;
- offline, `unavailable`, netwerkfout, invalid response of lege hosted data laat de fixture actief;
- freshness-only updates remounten de Guide niet, zodat scroll-/zendercontext behouden blijft;
- alleen user-visible schedulewijzigingen verhogen de app-shell data-version;
- Totaal, Per zender, Nu & Straks en Programme Detail mechanics zijn inhoudelijk niet gewijzigd;
- deferred `import()` voor Nu & Straks blijft intact;
- geen SQLite, TanStack Query, nieuwe dependency of native-config toegevoegd.

Exacte PR #51 head `08497e10ab65803c1ce91ca5b3b060fdfb0166f2` had CI run #323 volledig groen voor `quality` en `android-native` vóór merge.

Live hosted prerequisite is aanwezig: `guide-schedule` Edge Function v5 en `epg-refresh` v3 zijn actief. De publieke Guide-read bevat geen provider-ID's of privileged key; database/RPC en development-providerdetails blijven achter de servergrens.

**Gate:** omdat deze wijziging voor het eerst de mobiele Guide-boundary met real data kruist, is Phase 3 nog niet gesloten. Er is nu een gerichte fysieke iPhone smoke nodig voor Totaal, Per zender, Nu & Straks, Programme Detail, fixture→real transition en contextbehoud bij resume. Android-deviceacceptatie blijft apart deferred.

**Volgende stap:** voer de gerichte iPhone real-data smoke uit en leg bewijs vast. Alleen wanneer die regressievrij is, kan de mobile real-data vertical slice als fysiek bewezen worden beschouwd en kan Phase 3 richting exit/Phase 4 worden gesloten.

---

## 14 september 2026 — Hosted schedule-store + gratis development-EPG operationeel als Phase 3 foundation

Phase 3 is voorbij de oude backend/provider-intakegate. Teevee heeft nu een eigen hosted canonical schedule-store én een vervangbare adapter voor een echte gratis Nederlandse XMLTV-feed.

### PR #40 — Supabase canonical persistence
PR #40 is gemergd als `da08c10e170ea8fe3843e16b76247eccd6c0502a` nadat exact-head CI #283 zowel `quality` als `android-native` volledig groen afrondde.

Dedicated backend:
- Supabase project `teevee` (`eokszvpityhtysbwdduy`);
- organisatie `teevee`;
- Free plan;
- regio `eu-west-2`.

Gebouwd:
- private `teevee` schema voor channels, programmes en authoritative coverage;
- transactionele `[from,to)` replacement en stale-write protection conform ADR 0007;
- covered-empty versus unavailable;
- conservative freshness;
- private tables zonder `anon`/`authenticated` toegang;
- service-role-only public RPC bridges;
- `SupabaseScheduleRepository` achter het bestaande repositorycontract.

Security advisor WARN/ERROR is na hardening leeg. RLS/no-policy INFO voor de private Teevee-tabellen is bewust: clienttoegang is volledig dicht.

### PR #42 — development-only XMLTV provider
De eigenaar koos voor Phase 3 voorlopig een gratis externe EPG. PR #42 is gemergd als `4ea4a73bb38580cc8ab0acf454ccfc5849350bab`.

`XmltvEpgProvider` gebruikt standaard `https://iptv-epg.org/files/epg-nl.xml` en blijft server-side achter `EpgProvider`.

Correctnessregels:
- expliciete XMLTV timezone-offset vereist; geldige tijden gaan naar UTC;
- malformed tijden blijven diagnosable, geen timezone-guessing;
- title/subtitle/description/category/live/repeat parsing;
- `[from,to)` programme filtering;
- alleen continue coverage over iedere gevraagde provider-channel geeft `complete`;
- gaps geven `partial`, zodat ingest geen canonical data destructief overschrijft;
- injected `fetch` houdt tests/CI onafhankelijk van internet.

De eerste CI-run vond één echte CDATA-parserbug. Die is in de parser hersteld vóór merge. Exact finale head `2af9d6cc6afb8b0618b196eebdc33b1b940d25d9` had CI #290 volledig groen voor `quality` én `android-native`.

### Live feed-inspectie — tijdelijke PR #43, niet gemergd
Omdat de agent-runtime de raw feed niet direct kon uitlezen, is een tijdelijke GitHub Actions-inspectie gebruikt. PR #43 is na succesvolle inspectie gesloten zonder merge; er staat dus geen live-feed afhankelijkheid in normale CI.

Gemeten op 14 september 2026:
- 30,237,192 bytes XML;
- 184 channels;
- 33,117 programme records;
- feedrange `20260913000600 +0000` t/m `20260919235500 +0000`;
- kern-ID's bevestigd: `NPO1.nl`, `NPO2.nl`, `NPO3.nl`, `RTL4.nl`, `RTL5.nl`, `RTL7.nl`, `RTL8.nl`, `RTLZ.nl`, `SBS6.nl`, `SBS9.nl`, `Net5.nl`, `VeronicaDisneyXD.nl` plus sport/internationale zenders.

De publieke overview-teller van IPTV-EPG.org wijkt momenteel af van de werkelijk opgehaalde feed. Daarom worden websitecijfers niet gebruikt voor coverage/correctness.

### Rechtenboundary
Deze gratis feed is **alleen development input**. Publieke bereikbaarheid is geen bewijs van commerciële/publicatierechten. Geen raw XMLTV, logo's of artwork wordt in Git opgenomen en mobile krijgt nooit een directe providerdependency.

Production EPG/logo/artwork/SLA blijft een aparte release-gate. Een geautoriseerde Bindinc/TVgids bron blijft voorkeursroute; EPGdata.tv/Gracenote blijven mogelijke commerciële alternatieven.

**Volgende stap:** een kleine expliciete real-channel catalog/mapping op basis van de bevestigde provider-ID's, daarna één server-side ingest naar Supabase en typed canonical query terug. Meet eerst de echte ~30 MB feed-kosten voordat mobile caching wordt gekozen.

---

## 14 september 2026 — Canonical repository + veilige ingest/service-keten

PR #38 (`5d997e58cd86de75a7de83367cc0e47b783657a2`) legde backend-onafhankelijke canonical schedule-semantiek vast:
- expliciete channel/time replacement scope;
- `[from,to)` intersection;
- coverage onafhankelijk van programme presence;
- covered-empty vs unavailable;
- conservative freshness;
- atomair `ignored-stale` vóór mutatie.

PR #39 (`a39f5e432f0f3dcba946f5e8ca49bdd060ad0928`) voegde safe provider ingestion en `GuideScheduleApi` toe:
- complete vs partial provider coverage;
- attributable malformed data blokkeert alleen veilige affected channel scope;
- unattributed malformed data blokkeert destructive replacement;
- request-start freshness;
- concurrencytest voor late oudere providerresponse;
- typed canonical service-output zonder provider/database leakage.

**Volgende stap destijds:** echte hosted repository + provider — gerealiseerd in #40/#42.

---

## 14 september 2026 — Phase 2 gesloten; Phase 3 geactiveerd

De finale Per zender-recheck `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md` sloot de laatste Phase 2 devicegate. `Publiek 1/2/3` blijven onder larger text onderscheidend; directe zenderselectie, adjacent paging en strip/schedule-synchronisatie zijn fysiek geaccepteerd.

PR #36 sloot Phase 2 / activeerde Phase 3. PR #37 (`491bc728adfb4ec70d060833d49d17bca25bbdc9`) bouwde daarna de provider-onafhankelijke normalisatiekern: `GuideSchedule`, server-only `EpgProvider`, mapping, UTC-normalisatie, deterministic broadcast identities en record-level diagnostics.

---

## 13 september 2026 — App Shell en Guide interaction baseline fysiek geaccepteerd

Belangrijkste afgeronde mobiele foundation:
- Totaal: 2D time/channel Guide, native inertia/bounce/directional lock, Vandaag/Morgen/Nu, Programme Detail;
- Per zender: verticale wall-clock schedule, horizontal adjacent-channel pager, direct-tap zenderstrip en contextbehoud;
- Nu & Straks: shared reference time, live/browse, tijdrail, Nu/Primetime en detail round-trip;
- Nu & Straks startup blijft achter deferred `import()` na een fysiek aangetoonde eerdere startup-regressie;
- Gids / Vanavond / Zoeken tabs, Settings secundair;
- versioned preferences en live/persisted Light/Dark/System;
- navigator-level error recovery;
- shared headers/safe areas;
- representative 135% iOS text acceptance;
- Programme Detail targetacties later: `Herinner mij` + `Bewaar`, geen Share requirement.

Exacte device-evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`;
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

De 24pt Nu & Straks following rows blijven niet-blockerende accessibility/density debt.

---

## 11–13 september 2026 — Bootstrap en Phase 1 stabilization

Projectfoundation, Expo/React Native strict TypeScript, deterministic fixtures, Programme Detail, Amsterdam/DST runtime fixture, CI en device-workflow zijn opgebouwd.

Belangrijke stabilisatie:
- title/time-axis readability tijdens Guide-scroll;
- VoiceOver/self-contained labels;
- performanceverbeteringen door per-frame JS bridges/rerender-bottlenecks te verwijderen;
- `[start,end)` current-programme semantics;
- lockfile + `npm ci`;
- clean Android prebuild + Gradle debug APK in CI.

Een eerdere high-volume per-programme Reanimated-architectuur was CI-groen maar crashte fysiek en blijft expliciet afgewezen.

---

## Doorlopende open punten
- **Phase 4 active:** television-day domain primitives zijn gemergd; de runtime loader/store en daarna accepted day navigation moeten nog naar ADR 0008 D-2..D+7 + 06:00 semantics migreren.
- **Production provider/rights:** nog open; gratis XMLTV is development-only en uiteindelijke provider moet ook de minimale historische/future horizon bewijzen.
- **Offline cold start:** echte no-network cold start later in standalone/dev build; Expo Go kan die test niet zelfstandig dragen.
- **Guide interaction baseline:** fysiek geaccepteerd op iPhone; alleen heropenen met regressie-evidence.
- **Nu & Straks 24pt following rows:** Phase 4 density-aware accessibility-hardening.
- **Android:** fysieke Back/gestures/performance deferred wegens geen Android-device; CI-native compile is geen deviceacceptatie.
- **Programme Detail:** `Herinner mij` + `Bewaar` nog niet geïmplementeerd.
- **Release-like performance:** later buiten Expo Go valideren.
- **Dependencies:** moderate advisories gericht analyseren; nooit `npm audit fix --force`.
- **Production rights:** EPG/logo/artwork/SLA expliciet bevestigen vóór paid release.
- Pricing/trial/paywall, production font licensing en definitieve Tonight composition blijven later.