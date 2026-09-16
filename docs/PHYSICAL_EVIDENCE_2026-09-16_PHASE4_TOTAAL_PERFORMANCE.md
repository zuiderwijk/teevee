# Phase 4 Totaal performance acceptance — 2026-09-16

Status: **ACCEPTED / CLOSED**

## Scope
This evidence closes the cold Totaal day-switch responsiveness observation originating in PR #66 / issue #67 and the production optimisation sequence through PR #71 and PR #74.

The work intentionally preserved frozen Guide gestures, programme geometry, D-2..D+7 / 06:00 television-day semantics, bounded schedule loading, provider/data contracts, Programme Detail navigation and deferred `NowNextGuideView`. It did not introduce persistent schedule caching, eager ten-day prefetch, a new dependency or full list virtualization.

## Baseline
Temporary physical instrumentation for issue #67 identified Totaal React reconciliation/render + large-grid mount work as the dominant cold-switch bottleneck.

Baseline medians:
- tap -> selection commit: ~1356 ms;
- tap -> first-frame proxy: ~3683 ms;
- fixture alignment: ~11 ms.

Per-zender control measurements were ~149 ms tap -> commit and ~170 ms tap -> first frame while bounded network requests were still in flight, supporting the conclusion that network was not the Totaal gate.

## PR #71
PR #71 removed repeated synchronous JS hot-path work:
- reuse one Amsterdam `Intl.DateTimeFormat`;
- index programmes by channel once per selected schedule.

Physical remeasurement medians:
- tap -> selection commit: ~1012 ms;
- selection commit -> first-frame proxy: ~1323 ms;
- tap -> first-frame proxy: ~2332 ms.

This was a meaningful improvement but remained perceptibly too slow, so the residual full Totaal component-tree mount/reconciliation cost was isolated as the next target.

## PR #74
PR #74 introduced bounded horizontal programme-cell windowing while retaining the existing outer ScrollView geometry and native gesture mechanics.

Focused physical proof on the windowed implementation measured:
- median tap -> selection commit: **290.7 ms**;
- median selection commit -> first-frame proxy: **179.9 ms**;
- median tap -> first-frame proxy: **475.1 ms**;
- aggressive horizontal flings/bounces exposed no blank programme-cell gaps.

Independent QA subsequently identified a blocking animated same-window `Nu` case: programmatic animation could advance the render bucket before the native viewport reached it. Development corrected the ownership rule so animated scrolling is driven by actual native scroll offsets; non-animated day/horizon/cross-day jumps retain explicit preselection where required.

## Final exact-head gates
Final PR #74 production head:
`0a6e98661ec3ca0af9722ab2786146101779cca2`

Final gates:
- independent QA re-review: PASS; previous animated `Nu` blocker closed;
- exact-head CI #418: success;
- focused physical iPhone acceptance: PASS, including cold Totaal date switches, multi-viewport animated same-window `Nu`, hard horizontal fling/bounce and normal Guide scrolling;
- PR #74 mergeable and merged after its PR #71 base was integrated.

PR #74 merge commit on `main`:
`e2efe46d140b4c56906ba75ef1c8d6d2f66c50b9`

Post-merge CI #420 on that exact `main` SHA completed successfully.

## Outcome
The original user-visible hesitation was reduced from a multi-second cold Totaal transition to a physically accepted interaction with the measured windowed implementation around 475 ms median tap -> first-frame proxy. The optimisation was achieved by reducing synchronous render/mount work rather than speculative caching or broader architecture changes.

Issues #67, #70 and #73 are complete. Further performance architecture changes require new regression evidence or measured MVP requirements.