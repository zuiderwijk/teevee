# Startup regression — 13 september 2026

Status: isolated pending device recheck.

## Device evidence
Immediately after integrating PR #21 (Nu & Straks), the available iPhone showed a React Native redbox at startup with two identical secondary errors:

`Failed to call into JavaScript module method RCTEventEmitter.receiveEvent(). Module has not been registered as callable.`

The duplicate RCTEventEmitter messages do not expose the original JavaScript exception; they occur after the JS runtime has already failed to complete normal registration.

## Isolation strategy
The last physically working main before PR #21 was `114a7849b2268e91c064e1375588995d9d89ea56`. PR #21 changed only:
- `app/index.tsx`;
- `features/guide/NowNextGuideView.tsx`;
- `features/guide/nowNext.ts` and tests;
- Phase 1B documentation.

The only new code added to the startup module graph is the static `NowNextGuideView` import from `app/index.tsx`. The hotfix therefore restores the previously proven Totaal + Per zender startup boundary while leaving the Nu & Straks implementation files in the repository for controlled re-integration.

## Acceptance gate
1. Current main must start normally again on the available iPhone.
2. Totaal and Per zender must still open.
3. Only after startup recovery is physically confirmed may Nu & Straks be reintroduced behind a more isolated development entry point or after the underlying runtime exception is reproduced with useful diagnostics.

CI is necessary but is not sufficient evidence for this regression because PR #21 passed typecheck, lint, tests and bundle export before the physical startup failure was found.
