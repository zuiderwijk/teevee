# Teevee Agent Operating Model

Every agent must begin by reading `docs/PROJECT_STATE.md`.

Teevee is designed for autonomous AI-agent development under human product supervision. Agents may make ordinary technical implementation decisions autonomously, but may not materially change the product promise, paid/ad-free positioning, primary navigation, programme-data rights/provider strategy, mandatory account policy, monetisation model, or fundamental architecture without human approval.

## Source-of-truth order
1. `docs/PROJECT_STATE.md`
2. `docs/PRODUCT.md`
3. `docs/UX.md`
4. `docs/VISUAL_BASELINE.md`
5. `docs/ARCHITECTURE.md`
6. `docs/ENGINEERING_QUALITY_POLICY.md`
7. `docs/DATA.md`
8. `docs/DESIGN_SYSTEM.md`
9. `docs/BUILD_SPEC.md`
10. `docs/decisions/*`

`docs/DEVLOG.md` is the human-readable history of substantive development work. It is not a higher source of truth than PROJECT_STATE; when they differ, PROJECT_STATE wins and the DEVLOG should be corrected.

If documents conflict, resolve the conflict before proceeding and update the lower-priority document.

For visual work, `docs/VISUAL_BASELINE.md` plus `design/current/` select the exact accepted current visual references. Do not infer the current design from chat history, Library recency, generated-image timestamps or visual similarity. Behaviour in `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md` and accepted ADRs still overrides a stale control visible in an otherwise accepted screenshot.

## Specialised ChatGPT threads
Teevee may use separate Lead, Visual Design / UX, Development and QA / Review threads. These threads do not treat one another's chat history as a source of truth: the repository is their collaboration bus. Role boundaries, handoff rules, parallel-work guidance and reusable start prompts live in `docs/THREAD_PLAYBOOK.md`.

Development and QA / Review work must also follow `docs/ENGINEERING_QUALITY_POLICY.md`, including its risk classification, test expectations, independent-review requirements and physical-device gates.

When a conclusion from one thread matters to another, write the durable conclusion to the appropriate repository document, visual manifest, ADR, PR or evidence record before handoff. Avoid concurrent edits to `docs/PROJECT_STATE.md`; the Lead role owns reconciliation of shared project state when multiple threads are active.

## Working rules
- Prefer simple explicit code over abstraction.
- Keep all EPG providers behind typed adapters.
- The mobile client must never depend directly on an external EPG provider.
- Deterministic fixture data must keep core development and tests independent of external services.
- Apply the Engineering Quality Policy to every substantive code change; risk level determines the required evidence, not author confidence.
- Avoid microservices, Kubernetes, speculative infrastructure and premature abstraction.
- Treat visual references as direction rather than specification unless `docs/VISUAL_BASELINE.md` / `design/current/` explicitly marks them accepted.
- Never replace an accepted visual baseline with an older Library/chat design because it appears more complete.
- New visual exploration becomes canonical only after explicit owner approval and a merged update to the visual baseline on `main`.
- Work in small complete vertical increments.
- Record long-lived architectural decisions as ADRs.
- Update `docs/PROJECT_STATE.md` after every substantive milestone with completed work, known issues and exactly one next step.
- Add a concise, understandable entry to `docs/DEVLOG.md` after every substantive development increment. Explain what changed, why, verification status and what comes next. Never claim a check passed unless it actually did.

## PR and CI status protocol
When the owner asks for a status update, or when an agent is deciding whether a PR may be merged, do **not** infer CI state from PR metadata alone.

Always verify in this order:
1. Read the PR metadata and confirm open/closed, draft state, mergeability and exact head SHA.
2. Fetch the GitHub Actions workflow run for that exact PR head SHA.
3. Fetch the jobs for that workflow run and inspect the actual job conclusions/steps.
4. Treat CI as green only when every required job is explicitly `completed` with conclusion `success`.
5. If all required checks are green, the PR is mergeable, and there is no explicit physical-device or human-product gate that must happen before merge, merge it immediately rather than reporting a stale "still running" status.
6. After merge, distinguish clearly between PR-head CI and exact-main CI. Do not claim the merge commit is green until the exact-main workflow has actually completed successfully.

A 404 or missing result from a job lookup is not evidence that CI is still running or failed. Recover by resolving the current workflow run and its job IDs, then inspect those jobs directly.

## Definition of Done
A feature is DONE only when acceptance criteria are met; the applicable `docs/ENGINEERING_QUALITY_POLICY.md` gates are satisfied; relevant loading, empty, error and offline states are handled; light and dark themes work; accessibility is acceptable; strict TypeScript, lint and tests pass; critical flows have automated coverage; performance is acceptable at realistic EPG volume; required observability exists; no secrets are committed; and documentation reflects reality.

## Product restraint
Teevee is guide-first. Do not introduce advertising, news feeds, social mechanics, engagement loops, AI recommendations, streaming-catalogue complexity or mandatory accounts unless product scope is explicitly changed.
