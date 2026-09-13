# Physical evidence — 13 September 2026, 17:06 CEST

## Context
After PR #21, the app produced a React Native startup redbox on the available iPhone. PR #22 removed the static `NowNextGuideView` import from the startup module graph and restored the previously proven Totaal + Per zender startup boundary. The owner physically confirmed that Teevee then started normally again.

PR #23 reintroduced Nu & Straks through deferred module loading: `NowNextGuideView` is evaluated only when the owner explicitly switches from Per zender to Nu & Straks. The existing Guide stays usable if deferred loading fails.

## Physical result
On current `main`, the owner confirmed:
- Teevee starts normally without the earlier startup redbox;
- the temporary Phase 1B flow reaches Per zender;
- selecting Nu & Straks successfully loads and opens the Nu & Straks prototype on the physical iPhone.

## Conclusion
The Nu & Straks module itself is not proven to be the cause of the earlier startup regression: it evaluates and renders successfully when loaded after startup. The failure is therefore isolated to the earlier startup/module-evaluation path (or its runtime timing/cache interaction), not to a general inability to render Nu & Straks.

Deferred loading remains the accepted Phase 1B integration boundary for now. Do not restore a static startup import without separate evidence.

This result closes the physical **startup + deferred module-load** gate only. It does not yet accept the Nu & Straks interaction model. Live/browse time-rail behaviour, vertical-position stability, `Nu`, `Primetime`, Programme Detail round-trip, mixed gestures, dark mode and larger system text still require physical validation.
