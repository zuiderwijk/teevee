# Startup regression — 13 september 2026

Status: physically isolated; startup recovery and deferred Nu & Straks load confirmed on iPhone.

## Device evidence
Immediately after integrating PR #21 (Nu & Straks), the available iPhone showed a React Native redbox at startup with two identical secondary errors:

`Failed to call into JavaScript module method RCTEventEmitter.receiveEvent(). Module has not been registered as callable.`

The duplicate RCTEventEmitter messages did not expose the original JavaScript exception; they occurred after the JS runtime had already failed to complete normal registration.

## Isolation strategy
The last physically working main before PR #21 was `114a7849b2268e91c064e1375588995d9d89ea56`. PR #21 changed only:
- `app/index.tsx`;
- `features/guide/NowNextGuideView.tsx`;
- `features/guide/nowNext.ts` and tests;
- Phase 1B documentation.

The only new code added to the startup module graph was the static `NowNextGuideView` import from `app/index.tsx`.

PR #22 restored the previously proven Totaal + Per zender startup boundary by removing that static import. The owner then physically confirmed on the available iPhone that Teevee started normally again without the redbox.

PR #23 reintroduced Nu & Straks through deferred module loading. `NowNextGuideView` is evaluated only when the owner explicitly requests Nu & Straks from the temporary Phase 1B control. On current `main`, the owner physically confirmed that Nu & Straks successfully loads and opens on the iPhone.

## Conclusion
The Nu & Straks module is not generally unable to evaluate or render: it does so successfully after startup. The regression is therefore isolated to the earlier startup/module-evaluation path, or to a timing/cache interaction specific to that path.

Deferred loading remains the accepted Phase 1B integration boundary. Do not restore the static startup import without separate evidence.

## Remaining acceptance gate
The startup/module-load problem is no longer the active product gate. Remaining physical validation is interaction-level:
1. live mode opens around actual current time;
2. horizontal time-rail browse pins one shared reference instant for all channels;
3. vertical channel position stays stable while the reference time changes;
4. `Nu` restores live mode and recentres the rail;
5. `Primetime` moves to the prototype 20:30 value;
6. Programme Detail round-trip preserves Nu & Straks time/channel context;
7. mixed vertical/horizontal gestures remain stable;
8. dark mode and representative larger system text remain usable.

CI remains necessary but is not sufficient evidence for this class of regression because PR #21 passed typecheck, lint, tests and bundle export before the physical startup failure was found.
