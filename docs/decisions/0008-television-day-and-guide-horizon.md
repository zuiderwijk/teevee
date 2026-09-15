# ADR 0008 — Television-day and Guide-horizon semantics

Status: ACCEPTED / FROZEN
Date: 2026-09-15

## Context
Television viewing does not follow a strict midnight calendar boundary. A viewer opening Teevee at 00:05 is likely still looking for the previous evening's schedule, and a viewer browsing at 21:00 expects the Guide to continue naturally past 00:00 without an explicit day switch.

TVgids.nl exhibits the same broadcast-day behaviour by keeping after-midnight programmes on the preceding evening/day context until early-morning programming begins.

The Core Guide must also support a useful historical and future horizon: at least two television days back and seven television days forward.

## Decision
Teevee introduces a product-level **television day** for Guide grouping and navigation.

### Television-day boundary
- A television day runs from **06:00 Europe/Amsterdam** through **06:00 the following calendar day**.
- Between 00:00 and 05:59, `Nu` still belongs to the preceding television day.
- Midnight is not a Guide boundary and must not cause an automatic day switch.
- 06:00 is the semantic day boundary, but continuous Guide surfaces may scroll across it without a hard visual stop.

### Canonical timestamps remain real timestamps
- Programme `startAt` and `endAt` remain canonical UTC ISO timestamps.
- No broadcast timestamp is shifted or rewritten to fit the television-day concept.
- Television-day membership is derived in `Europe/Amsterdam` at the presentation/query layer.

### Minimum Guide horizon
Let `D` be the current television day.

The product must support at least:
- **D-2** and **D-1**;
- **D**;
- **D+1** through **D+7**.

That is a minimum of ten complete television days in the navigable Guide window.

The backend may retain a broader window and should prefer a safety buffer where practical.

### Presentation behaviour
- **Totaal** and **Per zender** use the D-2 through D+7 horizon.
- A user opening at 19:00 must be able to navigate back to the start of that same television day and continue forward past midnight.
- `Nu` always jumps to the actual current instant and selects the television day containing that instant.
- Date navigation should present human-friendly dates/labels; users do not need to understand the internal term `television day`.
- **Nu & Straks** remains a single active-day experience, but its active day is the current television day rather than the strict calendar day. `Primetime` after midnight may therefore return to the preceding evening's primetime until 06:00.

### Phase ownership
- **Phase 3 — Real Data Vertical Slice:** freeze and preserve data/query semantics that do not assume midnight or a fixed two-day horizon. Do not force the complete ten-day UX into the current physical real-data smoke gate.
- **Phase 4 — Core Guide MVP:** implement and physically validate the full D-2 through D+7 navigation, midnight continuity, 06:00 rollover, historical Guide access, forward Guide access and context-preserving refresh behaviour.
- **Phase 8 — Production Data Decision:** production EPG selection must prove sufficient forward horizon, historical retention/availability, freshness and redistribution rights. A provider that cannot reliably satisfy the minimum Guide horizon is not sufficient for the product promise.

## Consequences
- Existing today/tomorrow loading is a Phase 3 vertical-slice implementation detail, not the final Guide horizon.
- Day-based loaders/cache keys must be television-day aware before Phase 4 is considered complete.
- Tests must include 00:00, 05:59, 06:00, DST 23-hour days and DST 25-hour days.
- Offline/stale-cache behaviour should retain the last known historical/future window where available rather than collapsing to only the current day.
- Production data architecture must not destructively delete D-2/D-1 merely because they are in the past while they remain inside the product horizon.
