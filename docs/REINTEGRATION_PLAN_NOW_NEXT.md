# Nu & Straks controlled reintegration

The static import of `NowNextGuideView` in `app/index.tsx` caused a physical iPhone startup regression after PR #21 even though CI was green. PR #22 restored startup by removing that static import.

Reintegration rule for Phase 1B:
- Teevee startup must not evaluate the Nu & Straks module.
- `NowNextGuideView` is loaded only after the user explicitly requests the prototype.
- A failed deferred import must leave Totaal/Per zender usable and surface the original JavaScript error message in-app instead of collapsing startup into secondary `RCTEventEmitter.receiveEvent()` redboxes.
- Once the deferred path is physically proven, the underlying Nu & Straks interaction can be validated normally.
