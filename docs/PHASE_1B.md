# Phase 1B — Guide Presentation Prototypes

Status: interaction gates accepted on the available iPhone on 13 September 2026. Historical prototype criteria follow; current status and residual accessibility/Android gates are in `PROJECT_STATE.md`.

## Goal
Validate the interaction models that were discovered during Phase 1 before App Shell and real-data architecture are hardened around Totaal alone.

## Order
1. **Per zender** — one channel schedule, vertical time movement, horizontal adjacent-channel swipe, persistent/browsable channel strip, date context and Nu.
2. **Nu & Straks** — one shared reference time today, live/browse modes, Nu/Primetime, current/reference programme plus three following programmes for each channel.
3. Only after both are interaction-credible: define the shared Guide shell/presentation-state contract for Phase 2.

## Per zender prototype evidence
`ScreenRecording_09-13-2026 16-16-00_1.MP4` physically demonstrates the core interaction architecture on iPhone:
- the view opens around the actual current time on Vandaag;
- strong vertical movement through the day remains native and stable;
- horizontal schedule swipes move Publiek 1 → Publiek 2 → Publiek 3 one adjacent channel at a time;
- the active channel state in the top strip follows the schedule page;
- horizontal channel changes preserve the viewed wall-clock anchor;
- no white screen, crash or obvious gesture collapse is visible.

This closes the main Per zender architecture/gesture risk. The recording did not deliberately exercise every acceptance item. Direct strip tap/browse, Vandaag/Morgen/Nu and Programme Detail return context were subsequently accepted in the final 17:43 iPhone pass. Representative larger text and broader theme validation remain explicit Phase 2/4 checks.

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

## Nu & Straks prototype gate
The prototype may proceed once the Per zender core gesture architecture is evidenced, while residual Per zender checks remain explicit.

Validate the accepted UX in `docs/UX.md`:
- today only; no date selector;
- one shared reference time applies to every channel row;
- live mode follows actual current time;
- moving the horizontal time rail leaves live mode and pins browse time;
- `Nu` restores live mode;
- `Primetime` provides the explicit evening shortcut; 20:30 is a prototype value, not yet a frozen commercial/product decision;
- each channel shows the reference programme plus three following programmes when available;
- reference programme is visually dominant and following programmes are quieter;
- current/live programme shows useful `tot …` context;
- no progress bars, genres, artwork, chevrons or `Daarna` labels;
- channel order and vertical position remain stable while reference time changes;
- gaps show an honest no-programme state;
- time selection remains bounded to the current Amsterdam calendar day;
- Programme Detail opens directly and returns to unchanged Nu & Straks context;
- light/dark and representative larger text remain usable.

## Explicitly deferred
- production EPG/provider integration;
- persistent channel selection/reordering;
- final shared Guide presentation switcher and remembered default (subsequently implemented by Phase 2 PR #25/#26);
- offline/stale-cache production behaviour;
- production logo/artwork rights;
- paywall/subscriptions;
- release-level Android physical acceptance until a suitable Android device is available.
