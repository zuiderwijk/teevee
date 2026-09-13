# Device evidence — startup recovery after PR #22

Date: 2026-09-13
Device: available physical iPhone via Expo Go

After merging PR #22, the owner pulled current `main`, started the clean Metro/Expo flow and reported that Teevee **starts correctly again**. The React Native redbox seen immediately after PR #21 no longer appears when the startup module graph contains the physically proven Totaal + Per zender boundary and does not statically import `NowNextGuideView`.

Conclusion:
- physical startup recovery is confirmed;
- the regression is isolated to eager/static integration of the Nu & Straks presentation path, not to Totaal or Per zender;
- Nu & Straks implementation remains in the repository and should be reintroduced only through deferred module evaluation so startup remains recoverable and the original runtime exception can be surfaced directly.
