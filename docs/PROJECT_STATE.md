# Teevee — Canonical Project State

Last updated: 2026-09-13 23:37 CEST.
Status: ACTIVE — **Phase 2 App Shell, final physical recheck**. Phase 1A/1B Guide interaction models are physically accepted on the available iPhone. Phase 2 is technically implemented through PR #35. The broad iPhone App Shell / appearance / larger-text pass is accepted except for one Per zender large-text channel-identity defect that was fixed in PR #35 and now needs only a focused device recheck. Physical Android interaction validation remains explicitly deferred because the owner currently has no Android device; native Android compilation is a CI gate but is not device acceptance.
Current phase: **Phase 2 — App Shell**
Next phase after closure: **Phase 3 — Real Data Vertical Slice**
Previous phase: **Phase 1B — Guide Presentation Prototypes: physically accepted on iPhone**

> Mandatory start point for every development-agent session. Read `AGENTS.md` and this file before changing the repository.

## Product
Teevee is a premium, paid, ad-free television-guide app for iOS and Android under Bindinc/TVgids.nl supervision. The Guide is the product: fast, calm, reliable and polished. Netherlands first; no mandatory account for core Guide use.

## Frozen product / technical decisions
- React Native / Expo SDK 57 and strict TypeScript for iOS and Android.
- Paid, ad-free and Guide-first; no mandatory account for core Guide use.
- Light, dark and system appearance.
- Provider-independent Teevee EPG model; mobile never consumes or parses an external EPG provider directly.
- Deterministic fixtures keep core development and tests independent of external services.
- Core Guide cannot depend on artwork/enrichment.
- Accessibility and system text scaling are product-quality requirements.
- `PROJECT_STATE.md` is canonical cross-session memory; detailed history lives in `docs/DEVLOG.md` and timestamped evidence docs.

Relevant ADRs: `0001` through `0006` in `docs/decisions/`.

## Phase sequence
1. **Phase 1A — Totaal:** complete and physically accepted on iPhone.
2. **Phase 1B — Guide presentations:** complete and physically accepted on iPhone for the interaction risks that motivated the phase.
3. **Phase 2 — App Shell:** active only for the final targeted physical recheck.
4. **Phase 3 — Real Data Vertical Slice.**
5. **Phase 4 — Core Guide MVP hardening.**

Phase 2 does not pull production EPG integration, subscriptions, mandatory accounts or production channel-management behaviour forward.

## Frozen Guide interaction baseline
Do not retune accepted Guide mechanics during App Shell work without concrete regression evidence.

### Totaal
- two-dimensional Guide with horizontal time and vertical channels;
- continuous timeline and real programme-duration geometry;
- `Vandaag · Morgen · Nu`;
- native inertia, bounce and directional lock;
- PR #9 partial-left title readability;
- PR #11 time-axis left mask;
- PR #13 VoiceOver and live system-theme response;
- PR #14/#15 post-horizontal-scroll performance architecture;
- direct Programme Detail path.

### Per zender
Accepted on the available iPhone:
- vertical position represents wall-clock time;
- horizontal schedule swipes change adjacent channel while preserving the viewed time anchor;
- top channel strip can be browsed and distant channels selected directly;
- `Morgen`, `Vandaag` and `Nu` behave coherently;
- Programme Detail round-trip preserves relevant channel/day/time context;
- no crash, white screen or nested-gesture collapse in acceptance evidence.

Physical evidence includes `ScreenRecording_09-13-2026 16-16-00_1.MP4`, `ScreenRecording_09-13-2026 17-43-36_1.MP4` and the Phase 2 larger-text pass `ScreenRecording_09-13-2026 23-10-50_1.MP4`.

### Nu & Straks
Accepted on the available iPhone:
- one reference instant applies across all channel rows;
- live and browse modes are coherent;
- horizontal rail flings settle without the former ping-pong/tug-of-war;
- `Nu` returns to current reference;
- `Primetime` uses 20:30 as a prototype value, not yet a frozen commercial/product decision;
- vertical channel context remains stable while reference time changes;
- Programme Detail round-trip preserves relevant reference/vertical context;
- mixed vertical/time-rail gestures remain controllable.

Key evidence:
- regression: `ScreenRecording_09-13-2026 17-07-22_1.MP4`;
- rail revalidation after PR #24: `ScreenRecording_09-13-2026 17-36-54_1.MP4`;
- final Phase 1B pass: `ScreenRecording_09-13-2026 17-43-36_1.MP4`;
- Phase 2 larger-text pass: `ScreenRecording_09-13-2026 23-10-50_1.MP4`.

## Nu & Straks startup rule
Do **not** restore a static `NowNextGuideView` startup import without separate physical evidence.

Accepted integration boundary:
- Totaal and Per zender may be in the startup module graph;
- Nu & Straks loads through `import()` only when requested or when restoring a persisted Nu & Straks preference after the shell has started;
- a late dynamic import may never override a newer user selection;
- load failure must leave the rest of Guide usable and surface a recoverable user-facing state.

## Programme Detail
- Direct from every Guide presentation; no intermediate preview sheet.
- Native React Native Modal presentation.
- Close/backdrop, `onRequestClose`, accessibility escape and deliberate swipe-down dismissal.
- Accepted target actions: `Herinner mij` + `Bewaar`; no share action. These actions and the contextual sticky action bar are **not implemented yet**; the current prototype exposes only `Sluiten`. Delivery remains later MVP hardening work.
- Returning from detail preserves the originating Guide presentation and relevant context.
- Under the Phase 2 shell, Programme Detail is physically proven from all three Guide presentations; it also remained readable/closable at 135% iOS text size in the 23:10 pass.

## Phase 2 implementation ledger
- **PR #25 — app shell** → `2a5686c6d170ac0eb3b7206d152f3e2f358da204`: typed Totaal/Per zender/Nu & Straks contract, direct selector, stale deferred-import protection, Gids/Vanavond/Zoeken tabs. Physically accepted on iPhone.
- **PR #26 — local preferences** → `03b31f1ed4dfa3508ea9e1aeacb85cc19520aa9c`: versioned small JSON preferences, Guide-presentation persistence, native FileSystem + web localStorage. Physically accepted on iPhone including restart persistence.
- **PR #27 — Settings / appearance** → `61785994632ce397afbebf1f7c82f677719c1d23`: secondary Settings route; `Systeem`, `Licht`, `Donker`; live cross-screen application and persistence. Physically accepted in the 23:10 Phase 2 pass.
- **PR #29 — shared app-shell header** → `68f60bae8ac5888054bf92973ef92041694a19f8`: shared `AppScreenHeader` for Settings, Vanavond and Zoeken, safe-area-context and wrapping layout. Physically accepted in the 23:10 Phase 2 pass.
- **PR #30 — screen error recovery** → `9e2fe2035626c28ccb36f228cc907848034d5581`: navigator-level themed screen fallback with retry.
- **PR #31 — deferred Nu & Straks recovery** → `93f06c154087a14971f0ab1fcedfafeb82f40bdf`: generic recoverable import-failure state while other Guide presentations remain usable.
- **PR #32 — CI hardening** → `3650f15fd70d37088940d292ae3422aca7b450a9`: supported checkout/setup-node v7 action runtimes and read-only workflow permissions; project runtime remains Node 22.
- **PR #33 — shell accessibility** → `4516ce280ff2e274fb4f7df42570cc7ff5d2801e`: scrollable screen-error fallback and 44pt Guide presentation selector.
- **PR #34 — compact Guide controls** → `62a50754ce71fc19606770a002152ee2e62c8b7f`: 44pt Per zender day/now controls, 44pt Nu & Straks shortcuts, wrapping reference/control row. No Guide geometry or gesture changes.
- **PR #35 — large-text channel identity** → `f067cf8543921464dba70c3966b1870c1ac2666a`: text-only `ChannelIdentity` uses middle ellipsis so differentiating suffixes remain visible when truncated; logo-backed identities retain tail ellipsis. No strip dimensions, pager geometry or gestures changed.

## Phase 2 physical acceptance — 23:10 pass
Evidence: `ScreenRecording_09-13-2026 23-10-50_1.MP4`; repository record: `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`.

Physically proven on the available iPhone:
- Teevee starts and remains stable while switching Guide presentations;
- Settings behaves as secondary navigation;
- Light / System / Dark apply live;
- an explicit dark preference survives reload/restart and is restored;
- Settings and Vanavond shared headers respect safe areas and remain readable;
- 135% iOS text size keeps Totaal, Per zender and Nu & Straks operational;
- the hardened 44pt day/now/shortcut controls remain usable at 135%;
- Nu & Straks reference controls reflow coherently at 135%;
- Programme Detail opens from Per zender under larger text and remains readable/closable;
- light mode remains usable after the larger-text pass;
- no redbox, white screen, crash or broad interaction regression was observed.

One concrete defect was found: at 135% text size the text-only Per zender strip rendered `Publiek 1`, `Publiek 2` and `Publiek 3` as the same visible `Publie…`. PR #35 fixes only that fallback presentation. **This fix still needs the tiny physical recheck below; the rest of the broad Phase 2 pass does not need repeating.**

## Open accessibility boundary — Nu & Straks following rows
The compact interactive following-programme rows currently use a 24pt minimum height. This remains an explicitly tracked accessibility/UX debt, but the 23:10 pass did not produce a concrete tap failure or interaction regression for these rows.

Do not paper this over with overlapping `hitSlop`: adjacent sibling hit areas can compete, and React Native hit regions remain bounded by parent layout. Do not silently enlarge all rows to 44pt either, because that materially changes the accepted information density and visible channel count.

For Phase 2 closure this is treated as **tracked non-blocking hardening debt unless new physical evidence shows an actual usability failure**. Revisit deliberately during Core Guide MVP accessibility hardening with a density-aware design, potentially including text-size-aware row treatment, and validate physically.

## Local preference architecture — ADR 0006
- Small app preferences use a versioned JSON contract.
- Storage failure is non-fatal and falls back to defaults.
- No global state library is added merely for preferences.
- The preference layer is separate from future server state and EPG/offline cache.
- Real schedule caching remains a Phase 3/4 measured decision and may use SQLite or another appropriate store.

## Data / time baseline
- Teevee-owned `Channel`, `Programme` and `GuideFixture` types.
- 48 synthetic channels and deterministic runtime schedule fixture aligned to Amsterdam calendar days.
- Calendar helpers cover normal days, 23-hour / 25-hour DST transitions and year rollover.
- Shared `[start,end)` current-programme semantics.
- Guide clock refreshes immediately on app resume.
- Finite fixture rebuilds when the Amsterdam calendar day changes.

## CI / reproducibility baseline
- `package-lock.json` v3 is committed.
- CI installs with `npm ci` and uses npm cache.
- `quality` runs strict TypeScript, lint, tests and iOS / Android / web Expo exports.
- `android-native` performs a clean Expo Android prebuild and Gradle `:app:assembleDebug`.
- GitHub Actions checkout/setup-node use the supported v7 action runtimes while Teevee project commands remain on Node 22.
- Workflow permissions are explicitly read-only (`contents: read`) for the build/test pipeline.
- Never run `npm audit fix --force`; dependency advisories require targeted review.

Recent proof:
- PR #34 exact-head CI #247 / `34780762055`: fully green;
- #34 exact-main CI #248 / `34781494594`: fully green;
- reconciled pre-device-pass main CI #249 / `34781668104`: fully green;
- PR #35 exact-head CI #252 / `34783450317`: fully green, including the new ChannelIdentity tests and Android debug APK compile;
- PR #35 merge exact-main CI #253 / `34784323448` started on `f067cf8543921464dba70c3966b1870c1ac2666a`; completion is not claimed at this document update.

## Android validation status
Physical Android interaction acceptance remains **OPEN / DEFERRED** because no Android device is available.

Automated confidence covers Android JS/native bundle export, clean Expo Android prebuild and Gradle debug APK compilation. Still physically unproven: Android Back arbitration, nested-scroll/gesture feel, realistic device frame pacing and device-specific defects.

## Remaining Phase 2 deliverable
Only the PR #35 large-text remediation needs a focused iPhone recheck at **135% iOS text size**:
1. open Per zender;
2. confirm `Publiek 1`, `Publiek 2` and `Publiek 3` are visually distinguishable in the horizontal strip;
3. tap at least two of those channels and confirm direct selection;
4. swipe the schedule once to an adjacent channel and confirm the active strip selection follows.

No broad Settings/appearance/header/Totaal/Nu & Straks/Programme Detail retest is required unless this mini pass exposes a regression.

Deferred but tracked:
- physical Android validation when a suitable device becomes available;
- release-like performance outside Expo Go;
- the Nu & Straks compact following-row accessibility/density question described above;
- targeted review of moderate dependency advisories;
- production EPG/logo/artwork rights and reliability;
- pricing/trial/paywall;
- production font licensing;
- final Tonight composition.

## EXACT NEXT STEP
**On current `main`, perform only the four-step Per zender 135% large-text recheck above. If it passes, record the evidence, close Phase 2, update this file/DEVLOG, and proceed to Phase 3 Real Data Vertical Slice. If it fails, iterate only on the concrete regression.**

The reproducible commands/checklist are in `docs/TESTING.md`.

Owner checkout: `~/projects/teevee`.

## Resume instruction
> Read `AGENTS.md` and `PROJECT_STATE.md`. Phase 2 App Shell is technically implemented through PR #35 and the broad iPhone acceptance pass is complete. Preserve frozen Guide mechanics and the deferred Nu & Straks startup boundary. The only blocking Phase 2 gate is the focused 135% Per zender channel-identity recheck after PR #35. The 24pt Nu & Straks following-row issue remains tracked non-blocking accessibility debt unless concrete device evidence elevates it. Never infer Android physical acceptance from CI. Update PROJECT_STATE and the Dutch timestamped DEVLOG after substantive increments.
