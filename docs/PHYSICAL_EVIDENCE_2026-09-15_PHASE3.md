# Teevee Phase 3 physical iPhone evidence — 15 September 2026

## Scope
Focused physical acceptance of the Phase 3 real-data mobile boundary on iPhone through Expo Go. The purpose was to verify fixture-first startup, canonical hosted-data transition, accepted Guide interactions, Programme Detail round-trips, resume/context retention and graceful fallback behaviour without retuning the frozen Guide mechanics.

## Environment
- Physical iPhone.
- Expo Go / Metro development session.
- Mobile code from `main` with the Phase 3 canonical hosted schedule integration already merged.
- Hosted Teevee Supabase canonical schedule available for the current Amsterdam day and next-day window.
- Temporary development XMLTV source remains development-only and is not a production-rights claim.

## Evidence summary

### Test 1 — deterministic fallback and Guide interactions
Initial hosted coverage did not include the complete next-day window, so the today+tomorrow loader conservatively remained on the deterministic local fixture.

Physically observed:
- Guide remained usable rather than failing or emptying;
- Totaal horizontal and vertical interaction remained stable;
- Programme Detail opened and returned correctly;
- Per zender remained usable;
- deferred Nu & Straks loaded and remained usable;
- no crash, red error screen or corrupted Guide state.

Visible synthetic channel identities such as `Publiek 1`, `Publiek 2`, `Vier` and `Vijf` confirmed that the deterministic fixture was active.

Result: **PASS — unavailable hosted data preserves usable deterministic fallback.**

### Test 2 — background/resume context retention
Per zender was positioned on a recognizable channel/time context, the app was backgrounded for approximately ten seconds and then resumed.

Physically observed:
- no restart, blank screen or error;
- selected channel remained selected;
- vertical time context was retained;
- no visible remount or reset to `Nu`.

Result: **PASS — background/resume with unchanged data preserves Guide context.**

### Test 3 — runtime network loss
A true offline cold start cannot be meaningfully tested through Expo Go because Expo Go itself requires network access to load the development bundle from Metro after a force-quit. This is a development-container limitation, not a Teevee runtime failure.

A valid runtime network-loss test was therefore performed by keeping Teevee alive, disabling connectivity, backgrounding it and resuming it.

Physically observed:
- same Guide state returned;
- no reset, blank screen or crash;
- failed network refresh did not destroy the existing local schedule/context.

Result: **PASS — runtime network loss degrades safely.**

Standalone/dev-build cold-start-without-network remains a later release-like environment check; it is not a Phase 3 blocker under Expo Go.

### Test 4 — fixture to canonical hosted real-data transition
After hosted coverage was refreshed, the app was reloaded on the physical iPhone.

Physically observed:
- first frame appeared from the local fixture (`Publiek 1` visible);
- approximately two seconds later the Guide transitioned to canonical hosted data (`NPO 1` and real programme titles visible);
- transition completed without crash, blank state or visible layout corruption;
- Totaal remained horizontally navigable on real data;
- Per zender displayed real channels/programmes;
- deferred Nu & Straks loaded on real data;
- Programme Detail opened and returned correctly from Totaal, Per zender and Nu & Straks.

Result: **PASS — fixture-first startup and physical fixture -> hosted canonical transition proven.**

### Test 5 — remaining real-data interaction checks
A final short physical recording exercised the interaction details not fully visible in the preceding recording.

Physically observed:
- Per zender moved across adjacent channels in sequence `NPO 1 -> NPO 2 -> NPO 3` and back without losing the Guide;
- Nu & Straks reference time moved horizontally from `19:00` to `20:30` and back to `19:30` while the channel list remained coherent;
- vertical scrolling in Nu & Straks remained functional after the reference-time changes;
- the app was backgrounded from Nu & Straks at reference time `19:30` with the SBS6 / RTL 7 / RTL 8 context visible;
- on resume, reference time `19:30` and the same SBS6 / RTL 7 / RTL 8 vertical context were retained before further user scrolling.

Result: **PASS — adjacent-channel navigation, Nu & Straks rail/mixed gestures and real-data resume context retention proven.**

## Phase 3 exit-gate mapping
1. Stable launch and immediate local first frame — **PASS**.
2. Totaal transitions to real canonical data without gesture/readability regression — **PASS**.
3. Per zender retains direct channel context, adjacent navigation and time/context behaviour — **PASS**.
4. Deferred Nu & Straks loads and retains accepted rail/mixed-gesture behaviour — **PASS**.
5. Programme Detail opens/returns correctly from all three Guide presentations — **PASS**.
6. Background/resume with unchanged hosted content preserves context — **PASS**.
7. Offline/unavailable hosted data remains usable through deterministic fixture fallback — **PASS for unavailable and runtime network loss**; true offline cold-start is deferred to a standalone/dev build because Expo Go cannot load the development bundle with all networking disabled.

## Acceptance conclusion
The physical iPhone Phase 3 real-data boundary is accepted. No blocking Guide regression was observed. The remaining offline cold-start caveat is an Expo Go environment limitation and is deferred to release-like build validation; it does not invalidate the tested Teevee fallback semantics.

Phase 3 may close once the accompanying server-side development-EPG refresh PR has exact-head CI green, is merged, and the canonical project state is updated. Physical Android interaction acceptance remains separately deferred because no Android device is available.
