# Nu & Straks tijdrail-regressie — 13 september 2026

Status: OPEN — physical blocker for Phase 1B acceptance.

## Device evidence
In `ScreenRecording_09-13-2026 17-07-22_1.MP4` the time rail enters a visible tug-of-war around 00:08–00:09 and again around 00:18. The selected reference time oscillates between slots and the user temporarily loses effective control of the rail.

This is a serious interaction defect, not cosmetic polish. Phase 1B cannot close while it is present.

## Root cause in current implementation
The rail commits selection from both `onScrollEndDrag` and `onMomentumScrollEnd`. `commitRailOffset()` calls `chooseSlot()`, which in turn calls `scrollTo()`. In addition, an effect re-centres whenever `selectedSlotIndex` changes.

During a fling this allows React/state-driven programmatic scrolling to fight the native momentum + snap animation. The recording is consistent with that feedback loop.

## Fix direction
- native momentum/snap must own the rail until it settles;
- a rail-originated commit updates reference state but must not call `scrollTo()` again;
- `onScrollEndDrag` may commit only when there is effectively no momentum;
- `onMomentumScrollEnd` is the authoritative fling commit;
- remove the broad `selectedSlotIndex` recenter effect; explicit actions (`Nu`, `Primetime`, direct slot tap) may still programmatically centre.

Acceptance requires a physical iPhone retest with repeated fast flings and reversals, especially reproducing the 8–9 s and ~18 s patterns from the failing recording.
