# Phase 1B — Guide Presentation Prototypes

Status: active after owner approval on 13 September 2026.

## Goal
Validate the interaction models that were discovered during Phase 1 before App Shell and real-data architecture are hardened around Totaal alone.

## Order
1. **Per zender** — one channel schedule, vertical time movement, horizontal adjacent-channel swipe, persistent/browsable channel strip, date context and Nu.
2. **Nu & Straks** — one shared reference time today, live/browse modes, Nu/Primetime, current/reference programme plus three following programmes for each channel.
3. Only after both are interaction-credible: define the shared Guide shell/presentation-state contract for Phase 2.

## Per zender prototype gate
Use the deterministic runtime fixture and existing Programme Detail. Validate on the available physical iPhone:
- opens around the current time on Vandaag;
- vertical scrolling through the day feels native and stable;
- horizontal swipe across the schedule moves exactly one adjacent channel;
- horizontal browsing/tapping in the channel strip selects a channel directly;
- selected channel remains visible in the strip;
- channel changes preserve the viewed time anchor;
- Vandaag/Morgen preserve the schedule position; Nu returns to today/current time;
- programme tap opens the existing detail promptly and closing returns to unchanged Guide context;
- mixed vertical/horizontal interaction does not introduce white screens, obvious jank or accidental diagonal channel switches;
- light/dark and representative larger text remain usable.

The prototype may temporarily make Per zender the active development surface. This is not a final default-view decision and does not remove the frozen Totaal implementation.

## Nu & Straks prototype gate
To be implemented after Per zender is accepted. Validate the accepted UX in `docs/UX.md`, especially today-only reference time, live versus pinned browse state, stable channel order, gap semantics and three following programmes.

## Explicitly deferred
- production EPG/provider integration;
- persistent channel selection/reordering;
- final shared Guide presentation switcher and remembered default;
- offline/stale-cache production behaviour;
- production logo/artwork rights;
- paywall/subscriptions;
- release-level Android physical acceptance until a suitable Android device is available.
