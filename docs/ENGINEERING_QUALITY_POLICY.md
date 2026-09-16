# Teevee Engineering Quality Policy

Status: **ACTIVE** once merged to `main`.

This policy defines the minimum engineering-quality bar for Teevee. It applies to human and AI-authored changes alike. It complements `AGENTS.md`, the product/UX/architecture source-of-truth documents and feature-specific acceptance criteria.

The objective is not maximum test count or maximum code coverage. The objective is **high confidence that Teevee remains correct, maintainable, secure, performant and physically usable while development continues quickly**.

## 1. Core principles

1. **Evidence beats confidence.** A change is not correct because the author believes it is correct. Claims must be backed by code review, automated checks, deterministic tests and, where needed, physical-device evidence.
2. **Test risk, not implementation trivia.** Tests should protect product behaviour, domain rules, contracts and failure modes rather than mirror internal implementation details.
3. **The repository is the quality record.** Important acceptance evidence, regressions, exceptions and durable decisions belong in GitHub, not only in chat.
4. **Small complete increments are safer than broad rewrites.** Prefer the smallest coherent change that can be reviewed and tested independently.
5. **Simple explicit code is preferred.** Do not introduce abstraction, indirection, state systems or dependencies without a concrete problem that justifies them.
6. **A green CI run is necessary but not always sufficient.** Gestures, physical performance, lifecycle behaviour, accessibility and visual fidelity may require device validation.
7. **Production failures should improve the test suite.** A reproducible bug should normally gain a regression test before or with the fix.
8. **Do not weaken quality gates to make a change pass.** Fix the root cause or document and explicitly approve a justified exception.

## 2. Change-risk classification

Every substantive change should be treated as one of three risk levels. The author or Lead may classify it, but QA may raise the level when the diff warrants it.

### Low risk
Examples:
- documentation-only changes;
- isolated copy changes;
- non-behavioural style/token cleanup;
- test-only improvements that do not alter production behaviour.

Minimum gate:
- relevant static/CI checks;
- self-review of the exact diff.

Independent QA is optional unless the change touches a frozen visual baseline or source-of-truth contract.

### Medium risk
Examples:
- component state or navigation behaviour;
- API parsing/validation;
- domain/data transformations;
- loading, empty, error or offline handling;
- preference persistence;
- accessibility behaviour;
- refactors across existing production paths;
- CI enforcement/change-classification changes.

Minimum gate:
- automated tests for the changed behaviour;
- exact-head CI green;
- independent QA/review of the PR where practical;
- physical validation when automated evidence cannot credibly prove the behaviour.

### High risk
Examples:
- Guide gestures, scrolling or rendering architecture;
- television-day/date/time semantics;
- D-2..D+7 horizon logic;
- app startup, resume/background lifecycle or runtime schedule replacement;
- canonical EPG normalization, storage, freshness or destructive replacement;
- authentication, authorization, secrets or trust-boundary changes;
- persistent caching or migrations;
- subscription/payment/entitlement logic;
- notifications/reminders;
- fundamental navigation or shared state architecture;
- changes expected to affect real-device performance.

Minimum gate:
- deterministic automated coverage at the relevant boundaries;
- independent QA/review by a thread/agent other than the implementation author where practical;
- exact-head CI fully green;
- explicit physical-device acceptance for user-facing behaviour that CI cannot prove;
- ADR or source-of-truth update when a durable architectural/product contract changes.

A high-risk change must not be merged solely on the implementation author’s self-assessment.

## 3. Required automated quality gates

Every substantive PR must pass the **CI gates required by its deterministic change classification** for its exact head SHA before merge. Risk classification from section 2 remains separate: a High-risk product/runtime change can require independent/device evidence even when its automated change class does not require native compilation.

The central classifier is `scripts/ci/ci-scope.mjs`. Mixed diffs use the heaviest applicable class. Unknown paths, empty/unavailable diffs, classifier failures, and changes to the CI workflow/classifier itself fail safe to the heaviest `native-config` gate.

Current automated change classes:

- **`docs-design`** — documentation, design references and Markdown-only changes. Required CI is classification/minimal validation only; Expo export, prebuild and native compilation add no relevant evidence and are skipped.
- **`pure-code`** — isolated non-runtime code/tooling and tests where bundling/native output cannot change. Required CI: `npm ci`, strict TypeScript, lint and automated tests. Expo export/native compilation are skipped.
- **`runtime-ui`** — React/React Native application/runtime code and other bundle-relevant mobile code. Required CI: `npm ci`, strict TypeScript, lint, automated tests and Expo export for iOS/Android/web. Native compilation is skipped unless native/config/dependency impact is also present.
- **`native-config`** — dependencies/lockfile, Expo/app/native/build config, native projects, CI/build tooling, classifier changes or unknown/ambiguous paths. Required CI: all quality/runtime checks plus clean Android Expo prebuild and Android debug APK compilation. PRs use arm64 where appropriate; exact-`main` and explicit release validation use the full ABI set.

CI status must be inspected from the workflow run and job conclusions for the exact PR head. A skipped job is acceptable only when the classifier does not require that gate; it is not evidence that a required gate passed.

After merge, exact-`main` CI remains a separate mandatory piece of evidence. Exact-main uses the same change-aware policy rather than automatically rerunning every expensive build. A docs-only merge therefore still requires a successful exact-main workflow, but not an unrelated Expo/native build.

A manual release-validation workflow invocation forces the full `native-config` gate. Development CI and release CI therefore need not have identical cost while the full native release safety net remains available.

Obsolete PR-head runs may be cancelled by a newer head for the same PR. `main` runs must not be cancelled merely because another merge lands shortly afterwards; each exact-main change still needs its own completed classification/relevant gate evidence.

## 4. Static code-quality rules

Production code must remain compatible with strict TypeScript.

Rules:
- avoid `any`; use it only at a clearly bounded external/unsafe edge with justification;
- do not add `@ts-ignore`, disabled lint rules or broad type assertions merely to silence a problem;
- prefer narrow runtime validation for untrusted/external data;
- unused code, unreachable branches and obsolete compatibility paths should be removed rather than left “just in case”;
- do not duplicate domain semantics in multiple UI layers;
- prefer pure functions for deterministic domain logic;
- prefer explicit dependency injection at test-sensitive external boundaries such as clock, fetch/provider or persistence;
- avoid hidden global mutable state unless the architecture explicitly requires it and provides deterministic reset/test behaviour;
- new dependencies require a concrete benefit that outweighs bundle, maintenance, native and security cost;
- never use `npm audit fix --force`.

Code should optimize for readability by a competent engineer who did not author the change. Cleverness is not a quality metric.

## 5. Testing model

Teevee uses multiple complementary test layers. No single layer is sufficient for every risk.

### 5.1 Domain/unit tests

Pure business/domain rules must be tested directly and deterministically.

For Teevee, this includes whenever relevant:
- `[start,end)` programme/current semantics;
- programme ordering and overlap rules;
- canonical IDs and normalization;
- television-day membership;
- `Nu` behaviour;
- 00:00, 05:59 and 06:00 boundaries;
- Europe/Amsterdam DST transitions and 23/25-hour days;
- D-2 through D+7 window calculation;
- stale/fresh data comparison;
- deduplication and coverage semantics;
- channel/date/time context preservation rules.

Time-sensitive tests must use fixed/injected instants. Do not make correctness tests depend on the wall clock or arbitrary sleeps.

### 5.2 Contract and integration tests

Important boundaries must be tested across components, not only in isolation.

Examples:
- provider input -> normalization -> canonical schedule;
- canonical schedule -> repository replacement/read semantics;
- repository/service -> serialized public API contract;
- hosted response -> runtime validation -> shared mobile schedule;
- fixture -> hosted replacement -> visible runtime state;
- unavailable/network failure -> existing usable state/fallback;
- persisted preference -> restored app state.

External live services must not be a normal CI dependency. Use deterministic fixtures/fakes for CI and separate live smoke evidence where live infrastructure itself is under test.

### 5.3 Behaviour/component tests

UI/component tests should focus on observable behaviour and accessibility rather than implementation structure.

Where practical, test:
- loading/empty/error/offline states;
- user actions and state transitions;
- navigation contracts;
- accessibility labels/roles/state;
- larger-text-safe logic when it can be tested deterministically;
- light/dark/system semantic behaviour when logic differs.

Snapshot tests may be used as supplementary evidence, but a snapshot alone must not be the only proof of a meaningful interaction or domain rule.

### 5.4 Regression tests

When a bug is reproducible in an automated environment, the fix should include a test that fails before the fix and passes after it.

Exceptions are acceptable when the defect is inherently physical/native/visual and cannot be meaningfully automated. In that case, record:
- what failed;
- why an automated regression test is not credible;
- the physical or manual evidence used instead.

Do not leave `test.only`, accidental skipped suites or temporary disabled assertions in merged code. A deliberately skipped test requires a tracked reason and owner.

## 6. Coverage policy

Coverage is a diagnostic and guardrail, not a target to game.

### Critical logic
Domain/data/runtime/server logic that encodes correctness must have strong meaningful coverage, especially branches and boundaries. Examples include time/date semantics, normalization, schedule coverage/freshness, authorization, serialization/validation and runtime replacement logic.

Once CI coverage reporting is enabled, the default target for these critical modules is:
- at least **90% line/function coverage**;
- at least **85% branch coverage**;
- no material coverage regression in touched critical code without an explicit documented reason.

### UI/gesture code
There is no blanket percentage target for gesture-heavy or presentation code. For these areas, behavioural assertions, realistic fixtures, native-build checks and physical acceptance are more valuable than synthetic line coverage.

A PR must not add meaningless tests purely to satisfy a numeric threshold.

Until coverage reporting is technically enforced in CI, reviewers must apply these expectations qualitatively and ensure changed critical logic has direct tests.

## 7. Physical-device acceptance

Physical testing is mandatory when the relevant risk cannot be established credibly through automated checks.

Typical triggers:
- Guide scroll/gesture changes;
- Reanimated/worklet/native interaction changes;
- startup or deferred-load changes;
- background/resume lifecycle behaviour;
- physical performance/jank/memory concerns;
- large system text where density/reachability matters;
- VoiceOver/TalkBack behaviour that depends on native interaction;
- visual-baseline changes where actual rendering matters;
- platform-specific iOS/Android behaviour.

Physical evidence must state exactly what was tested and on which environment. CI/native compilation must never be described as physical Android or iOS acceptance.

Lack of an Android test device may defer Android physical acceptance when the canonical project state explicitly allows it; the limitation must remain visible and must be closed before release.

## 8. Performance quality

Performance is part of correctness for the Guide.

Changes touching Guide rendering, large schedule transforms, date horizons, runtime data replacement or gesture architecture must be evaluated against realistic data volume.

For Phase 4 and later, realistic performance validation should represent:
- the full D-2..D+7 product window where relevant;
- realistic channel counts, not only a tiny happy-path fixture;
- realistic programme density;
- the accepted simultaneous horizontal/vertical gesture patterns.

Avoid optimizations without measurement, but do not merge an obviously less efficient architecture merely because functional tests pass.

For meaningful performance work, record before/after evidence or a clear reason why measurement is not yet available.

## 9. Accessibility and theme quality

For affected user-facing surfaces, Definition of Done includes appropriate validation of:
- Light, Dark and System appearance;
- representative larger system text;
- accessible labels/roles/states;
- touch target and focus behaviour;
- VoiceOver/TalkBack where interaction semantics changed.

Accessibility regressions are product regressions, not cosmetic defects.

The known Nu & Straks compact-row accessibility/density debt remains explicit technical/product debt and must not be “fixed” with overlapping hit targets or other unsafe shortcuts.

## 10. Security, privacy and data-boundary quality

Changes at a trust boundary require both positive and negative tests where practical.

Rules:
- privileged secrets never belong in the mobile bundle, public Expo config, Git history, fixtures or test output;
- mobile must not depend directly on an external EPG provider;
- public APIs return only canonical Teevee contracts, not provider/database implementation detail;
- protected write/refresh/admin paths must prove unauthorized callers are rejected;
- destructive schedule replacement must preserve stale-write and incomplete-coverage protections;
- test fixtures must not contain real credentials or sensitive user data;
- dependency or infrastructure changes must not silently weaken an existing authorization boundary.

A security-related test may not expose the secret it is intended to protect.

## 11. Independent QA / review policy

For medium/high-risk work, independent review is expected where practical. For high-risk work it is the default requirement.

The QA/review role must independently inspect:
- exact PR diff;
- acceptance criteria and source-of-truth documents;
- added/changed tests and what they do **not** prove;
- architecture and trust-boundary effects;
- loading/error/offline states;
- iOS/Android divergence;
- accessibility and themes where relevant;
- performance risk;
- exact-head CI state;
- any remaining physical/human gates.

The reviewer must not merely repeat the Development thread’s summary.

AI-specific rule: an implementation agent may write and run its own tests, but it must not be the sole source of assurance for a high-risk change. The independent reviewer should reason from the diff, tests and canonical requirements afresh.

## 12. PR quality contract

A substantive code PR should make it easy for a reviewer to answer:
- **What changed?**
- **Why is this the smallest appropriate change?**
- **What risks exist?**
- **What automated tests cover those risks?**
- **What was physically tested, if anything?**
- **What remains unproven or deferred?**
- **Did architecture/product/UX documentation change?**

Do not hide known limitations behind a generic “tests pass” statement.

Before merge:
1. acceptance criteria are met;
2. relevant tests exist and pass;
3. exact-head required CI jobs are completed successfully;
4. PR is mergeable;
5. required independent review has no unresolved blocking finding;
6. required physical/human product gate is complete;
7. docs reflect durable reality;
8. no secrets or temporary smoke/debug infrastructure are unintentionally included.

After merge, verify exact-`main` CI separately.

## 13. Test-quality anti-patterns

Do not use these as substitutes for real quality:
- asserting internal implementation details that can change without affecting behaviour;
- excessive mocking that bypasses the contract being tested;
- real-time sleeps to make async tests “usually pass”;
- live external network dependencies in normal CI;
- giant end-to-end tests as the only coverage of domain logic;
- snapshots with no behavioural assertions;
- reducing assertions because a change broke them without establishing that the old expectation was wrong;
- broad try/catch or swallowed errors solely to make tests green;
- disabling lint/type rules project-wide to accommodate one implementation;
- chasing repository-wide coverage percentages while critical boundary cases remain untested.

Flaky tests are defects. Fix, replace or explicitly quarantine them with a tracked reason; do not normalize rerunning CI until it happens to pass.

## 14. Exceptions

A quality-policy exception is allowed only when all of the following are true:
- the normal requirement is impractical or disproportionate for a concrete reason;
- the risk is understood;
- alternative evidence/mitigation is documented;
- the exception is visible in the PR/evidence record;
- the exception does not silently redefine a product, security or rights boundary.

High-risk exceptions require Lead/human-owner approval when they materially reduce confidence or defer a release-relevant gate.

## 15. Current enforcement and next hardening

Already enforced once Fast CI is merged:
- central deterministic change classification with conservative fallback;
- strict TypeScript, lint and Vitest for code classes that can affect executable behaviour;
- iOS/Android/web Expo export for runtime/bundle-relevant changes;
- clean Android prebuild and debug APK compilation for native/config/dependency-impacting changes;
- exact-head PR CI and separate exact-main CI using the relevant classified gates;
- explicit manual full release validation;
- obsolete PR-run cancellation without cancelling exact-main runs;
- physical gates recorded in project state when required.

Engineering-quality hardening to add during Phase 4:
- CI coverage reporting for critical domain/data/runtime/server logic;
- technical protection of `main` so required checks cannot be bypassed accidentally;
- broader automated behavioural coverage as final multi-day Guide semantics are implemented;
- realistic D-2..D+7 performance fixtures/benchmarks;
- release-like offline cold-start validation outside Expo Go when a standalone/dev build is available.

Further job parallelization is intentionally not part of Fast CI until timings show that duplicated checkout/setup/`npm ci` overhead produces a real wall-clock win.

These hardening items strengthen the system; they do not weaken the requirements in this policy while tooling is being added.
