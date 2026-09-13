# Physical evidence — Phase 2 final large-text recheck

Date: 2026-09-13, 23:56 CEST
Source: `ScreenRecording_09-13-2026 23-56-18_1.MP4`
Scope: the four-step Per zender remediation check after PR #35.

## Test context

This recording was supplied as the requested continuation of the 135% iOS text-size acceptance pass. The clip itself does not reopen iOS Settings, so the exact slider position is inherited from the preceding test context rather than independently visible in this recording.

Code under test includes PR #35, merged as `f067cf8543921464dba70c3966b1870c1ac2666a`. The current repository state before this evidence update was `56df58758c5a924468f237caff600940948b2568`.

## Observed results

1. **Channel identities are visually distinguishable — PASS**
   - The text-only strip shows distinct truncated identities for the first public channels: `Pu…k 1`, `Pu…k 2`, `Pu…k 3`.
   - The differentiating numeric suffix remains visible, resolving the earlier `Publie…` / `Publie…` / `Publie…` ambiguity.

2. **Direct channel selection — PASS**
   - Multiple non-adjacent channel changes are visible while the horizontal strip remains available, including jumps between the public channels and later synthetic channels.
   - The large channel-context heading updates to the selected channel and the active strip state follows it.

3. **Adjacent-channel schedule swipe — PASS**
   - The recording contains horizontal schedule transitions between adjacent channels, including a visibly in-progress paged transition near the end of the clip.
   - The schedule settles on the adjacent channel without white screen, crash or gesture collapse.

4. **Strip / pager synchronisation — PASS**
   - After adjacent schedule changes, the active item in the horizontal strip moves with the schedule channel.
   - The channel-context heading, schedule content and strip selection remain coherent.

## Stability

No redbox, white screen, crash or new Per zender interaction regression is visible in the recording.

## Conclusion

**Phase 2 App Shell physical iPhone gate is CLOSED.**

The broad 23:10 pass had already accepted Settings, Light/Dark/System behaviour, appearance persistence, safe areas/shared headers, all three Guide presentations, Programme Detail and representative 135% system text. This 23:56 recheck closes the only remaining defect from that pass.

Physical Android interaction validation remains deferred because no Android device is available. The 24pt Nu & Straks following-programme rows remain tracked non-blocking accessibility/density debt for later Core Guide hardening; this recording does not elevate that item into a Phase 2 blocker.
