# EPG horizon investigation — 2026-09-21

Status: **runtime/data correction proposed**

## Scope

This investigation addresses the observed Guide asymmetry where Totaal can horizontally browse from Vandaag into Morgen, while explicitly selecting Morgen through the day selector can return `geen gidsinformatie`.

Canonical contracts remain unchanged:
- television day = 06:00 Europe/Amsterdam → 06:00 next local day;
- selectable Guide horizon = D-2..D+7;
- canonical storage uses ADR 0007 all-or-nothing coverage semantics;
- Totaal composes two independent television-day reads when its required following day is still inside D-2..D+7.

No client-side fabricated programmes, provider-ID leakage or partial-window relaxation is introduced.

## Live canonical storage before the correction

Supabase project `teevee` was inspected directly on 2026-09-21.

For all 12 mapped development channels:
- earliest stored coverage: **2026-09-14 00:00 CEST**;
- latest stored coverage end: **2026-09-24 00:00 CEST**;
- coverage consisted of calendar-midnight-aligned daily segments;
- programme rows themselves extended beyond the authoritative coverage boundary, to approximately **2026-09-24 01:10 CEST**.

At the time of inspection, current television day D was 2026-09-21 06:00 → 2026-09-22 06:00. The stored coverage therefore fully satisfied D-2, D-1, D0 and D+1, but not D+2 because the final 00:00 → 06:00 portion on 2026-09-24 was missing.

Programme rows beyond a coverage boundary do not make the scope authoritative. ADR 0007 deliberately keeps programme data and coverage proof separate.

## Root cause

The scheduled development refresh derived three **calendar-day** windows around Amsterdam midnight:
- today 00:00 → tomorrow 00:00;
- tomorrow 00:00 → day-after 00:00;
- one additional rollover calendar day.

The Guide client correctly derives **06:00 television-day** windows.

For explicit Morgen in Totaal on 2026-09-21:
1. selected D+1 = 2026-09-22 06:00 → 2026-09-23 06:00;
2. required following D+2 = 2026-09-23 06:00 → 2026-09-24 06:00.

The first read was fully covered. The second read was covered only through 2026-09-24 00:00. `teevee_get_schedule` therefore correctly returned unavailable for D+2, and `loadTwoTelevisionDayGuideSchedule` correctly returned unavailable for the composed Totaal window.

Horizontal browsing from current-day Totaal can still expose Morgen programmes because the shared current-day runtime already owns its D + D+1 continuity window. That path is not evidence that the independently selected D+1 + D+2 canonical scope is fully covered.

## Actual development-provider horizon

A one-off GitHub Actions inspection fetched the live development XMLTV feed at **2026-09-21 21:19 CEST** and checked continuous coverage for all 12 mapped provider channels against the same 06:00 Europe/Amsterdam windows used by Guide.

Result:
- D-3: incomplete;
- D-2: incomplete;
- D-1: incomplete;
- **D0: complete**;
- **D+1: complete**;
- **D+2: complete**;
- **D+3: complete**;
- **D+4: complete**;
- **D+5: complete**;
- D+6: incomplete;
- D+7: incomplete;
- D+8: incomplete.

The payload contained 40,399 programme records globally. Across the mapped channels, latest programme ends were on 2026-09-27 UTC; that is insufficient to cover the full D+6 television day through 2026-09-28 06:00 CEST.

Therefore the temporary development provider itself currently supplies only **D0..D+5 as complete forward television days**. It does not provide current-payload historical D-2/D-1, and it cannot satisfy D+6/D+7. Retained canonical history can preserve D-2/D-1 when previously ingested, but missing future provider data cannot be manufactured.

## Correction

The hosted refresh is changed to:
- accept a protected `guide-horizon` mode;
- derive D-3..D+8 as independent 06:00 Amsterdam television-day windows server-side;
- keep D-2..D+7 as the product horizon, with D-3/D+8 only as storage safety buffers;
- fetch/parse the ~30 MB XMLTV document once per horizon refresh and reuse that snapshot across all window checks;
- evaluate and ingest each window independently;
- store only windows whose provider scope is explicitly `complete`;
- preserve existing canonical coverage for partial windows;
- use one refresh-start `generatedAt` across the batch for deterministic stale-write ordering;
- retain the existing explicit-window protected refresh for diagnostics/manual repair.

The cron remains every six hours but now enqueues one horizon refresh instead of three independent calendar-day refresh requests.

## Expected effect

After the first corrected refresh, provider-complete future windows D0..D+5 can become canonical 06:00-aligned coverage. Existing historical coverage remains available where already retained.

For the 2026-09-21 failure case, D+2 is provider-complete and will be materialised as 2026-09-23 06:00 → 2026-09-24 06:00, so explicit Morgen in Totaal no longer fails because of the midnight/06:00 mismatch.

The development provider still cannot make every selectable future day authoritative:
- Per zender can only use future days for which one complete window exists;
- Totaal additionally requires its following day when that following day is inside the selectable horizon;
- D+6/D+7 remain provider-limited with the observed feed.

The accepted all-or-nothing selected-window contract is intentionally unchanged. Resolving the remaining full-horizon gap requires a provider with sufficient source coverage, not a client relaxation.

## Deterministic regression coverage

The correction adds tests for:
- D-3..D+8 refresh-window generation;
- exact 06:00 Amsterdam boundaries;
- 25-hour fall-DST television day;
- independent storage of complete windows while partial provider windows remain unavailable;
- one shared refresh timestamp across the batch;
- hosted `guide-horizon` request validation;
- reuse of one XMLTV fetch/parse snapshot across multiple window reads.

Existing Guide loader tests continue to protect the all-or-nothing two-window Totaal contract.
