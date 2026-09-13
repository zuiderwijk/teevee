# ADR 0005 — Validate all Guide presentations before App Shell

Status: Accepted — 13 September 2026

## Context
The original phased build specification placed Per zender and Nu & Straks in Phase 4. Those presentations were defined later, during Phase 1, after the Totaal interaction prototype had already become the primary technical risk surface.

All three presentations are now accepted expressions of the same Guide domain rather than unrelated later screens. Delaying the two newer interaction models until after App Shell and real-data work would risk hardening navigation, context state and data-selection assumptions around Totaal alone.

## Decision
Split Phase 1 conceptually into:
- **Phase 1A — Totaal interaction prototype:** prove the two-dimensional mobile EPG interaction and Programme Detail path. This is the existing physically accepted iPhone baseline.
- **Phase 1B — Guide presentation prototypes:** prove Per zender first, then Nu & Straks, using deterministic fixture data and the existing Programme Detail path.

Phase 1B validates interaction architecture, state semantics and device behaviour only. It does not pull production EPG integration, channel management, offline behaviour, account work or subscription work forward from later phases.

After Phase 1B, Phase 2 App Shell can be designed around three known Guide interaction models rather than one assumed model.

## Consequences
- Per zender and Nu & Straks move forward as prototypes; their production hardening remains Phase 4 work.
- Totaal's physically accepted interaction implementation remains frozen unless concrete regression evidence justifies change.
- Shared shell/presentation switching may remain deliberately minimal while each interaction prototype is being proven.
- Guide context must eventually represent presentation-specific channel/time/reference state without making the schedule domain presentation-specific.
- Physical Android validation remains required before release, but lack of an Android handset does not block iPhone-based Phase 1B interaction development. Automated Android native compilation provides only build confidence, not gesture/performance acceptance.
