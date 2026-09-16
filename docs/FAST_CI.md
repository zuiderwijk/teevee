# Teevee Fast CI

Status: proposed enforcement for the Fast-CI increment; becomes canonical when merged to `main`.

## Objective

CI should deliver the evidence required by the change, not mechanically run every available build. Risk classification (Low / Medium / High) remains a separate engineering decision; this document describes deterministic **change classification** used to select automated gates.

## Baseline before Fast CI

Measured immediately before this increment:

- docs-only PR #76 / CI #421 still ran the full quality job, including Expo export; wall-clock was about **1:47**;
- the quality job's representative step costs were roughly: `npm ci` 14 s, typecheck 4 s, lint 4 s, tests 12 s, Expo export 63 s;
- exact-main CI #422 for the docs-only merge ran from 21:50:33Z to 22:05:48Z, about **15:15**, because every push to `main` forced a clean Android prebuild plus full-ABI debug build;
- PR-side Android scope detection already skipped native compilation for docs/design-only diffs, but that logic was Android-specific and did not control quality/export or `main`.

The avoidable latency is therefore not the correctness suite itself; it is running bundle/native evidence for diffs that cannot affect those artifacts.

## Central classifier

`scripts/ci/ci-scope.mjs` is the single change classifier. For mixed diffs, the heaviest relevant class wins.

| Class | Typical repository paths | Quality (`npm ci`, TS, lint, tests) | Expo export | Android native |
| --- | --- | --- | --- | --- |
| `docs-design` | `docs/**`, `design/**`, Markdown | skip | skip | skip |
| `pure-code` | `server/**`, tests, explicitly whitelisted non-runtime tooling such as `eslint.config.*` and `expo-env.d.ts` | run | skip | skip |
| `runtime-ui` | `app/**`, `components/**`, `features/**`, `data/**`, `services/**`, `theme/**`, `tsconfig.json` | run | run | skip |
| `native-config` | dependencies/lockfile, Expo/app/native config, Android/iOS, CI workflow/classifier, unclassified scripts/build helpers | run | run | run |

Unknown files, new/unclassified script paths, empty diffs, diff failures and changes to CI/classifier infrastructure fall back to `native-config`.

The classifier is intentionally repository-specific. It should be updated when the repository gains a new path whose build impact is understood; until then that path receives the conservative gate.

## PR and main behaviour

PRs use the base/head merge-base diff and must still prove the required gates on the exact PR head SHA. Rename detection is disabled for classification so both the removed source path and added destination path contribute to the gate.

Pushes to `main` classify the exact `before` -> `after` tree delta rather than PR-style merge-base semantics. This remains correct for non-fast-forward updates and also disables rename collapsing so removed heavier paths cannot disappear from classification. Exact-main verification therefore remains mandatory, but a docs-only merge no longer rebuilds application bundles or Android native artifacts without a technical reason.

Native/config/dependency diffs run arm64 Android compilation on PRs and the complete ABI set on `main`.

## Concurrency

Obsolete PR runs are cancelled when a newer head for the same PR starts. `main` runs use a unique run key and are **not** cancelled by later merges, so exact-main evidence is not discarded.

## Release safety net

Manual `workflow_dispatch` forces `native-config` scope regardless of diff. This provides an explicit full bundle + clean prebuild + full-ABI native validation path for release/release-candidate evidence without making every development merge release-like.

## Deterministic boundaries

`ci-scope.test.mjs` covers docs-only, design-only, pure server code, tests, runtime/UI, `tsconfig.json`, package lock, Expo config, native/buildconfig, workflow changes, classifier self-changes, mixed diffs, unknown/new script paths, empty diffs, PR merge-base semantics, runtime/native-to-docs renames, exact non-fast-forward main tree deltas, invalid/missing SHA CLI fallback and forced release validation.

## Deferred optimization

The quality job remains a single job. Static checks and Expo export are not split into separate jobs in this increment because each split would repeat checkout/setup/`npm ci`; no measured wall-clock win currently justifies that complexity. Revisit only with timing evidence.

## Acceptance / measurement

The PR implementing Fast CI must demonstrate its own conservative `native-config` path because it changes `.github/workflows/**` and `scripts/ci/**`. After merge, the exact-main run must also be full native for the same reason.

The first subsequent representative docs/design-only, pure-code and runtime/UI changes should be recorded with wall-clock timings to confirm actual fast-path latency. The expected structural result is already deterministic: docs/design does classification only; pure code stops after quality; runtime/UI adds Expo export; native/config retains the full native safety net.
