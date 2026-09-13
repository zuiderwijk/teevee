# Physical evidence — Phase 2 Guide preference persistence

Date: 2026-09-13, approximately 19:19 CEST  
Device: available iPhone

## Scope
This check validates the local Guide-presentation persistence introduced by PR #26 after the PR was merged to `main`.

## Owner-confirmed device behaviour
- Select `Per zender`, close/restart Teevee: the app restores `Per zender`.
- Select `Nu & Straks`, close/restart Teevee: the app restores `Nu & Straks`.
- Restoring `Nu & Straks` does not reintroduce the earlier startup redbox.

## Conclusion
The Guide presentation preference is physically accepted on the available iPhone. The persisted Nu & Straks path preserves the required deferred-load startup boundary in the tested restart flow.

This is not Android-device acceptance. Physical Android interaction validation remains deferred until a suitable device is available.
