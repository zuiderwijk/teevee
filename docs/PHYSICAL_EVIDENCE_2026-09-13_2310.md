# Physical evidence — Phase 2 iPhone acceptance pass

Date: 2026-09-13
Device: available iPhone
Evidence: `ScreenRecording_09-13-2026 23-10-50_1.MP4`
Status: **PARTIAL ACCEPTANCE — one large-text channel-strip defect found**

## Proven in this pass

- Teevee starts successfully and remains stable while switching Guide presentations.
- Settings opens as secondary navigation.
- `Licht`, `Systeem` and `Donker` apply live.
- An explicit dark appearance survives an Expo reload/restart path and is restored afterwards.
- Settings and Vanavond shared headers remain readable and respect the visible safe area.
- At 135% iOS text size, the Guide remains operational in Totaal, Per zender and Nu & Straks.
- The hardened 44pt day/now/shortcut controls remain usable at 135% text size.
- Nu & Straks reference controls remain laid out coherently at 135% text size.
- Programme Detail opens from Per zender under the larger-text setting and remains readable/closable.
- Light mode remains usable after the larger-text pass.

## Concrete defect found

At 135% iOS text size, the Per zender horizontal channel strip truncates the text-only fallback identities `Publiek 1`, `Publiek 2` and `Publiek 3` to the same visible `Publie…`. The controls remain accessible by their full accessibility labels, but sighted users using larger system text cannot visually distinguish those adjacent channels in the strip.

This is treated as an accessibility/large-text defect, not as a reason to retune the accepted Per zender pager or schedule geometry.

## Scoped remediation

Branch `fix/phase2-large-text-channel-strip` changes text-only channel identity truncation from tail ellipsis to middle ellipsis. This preserves differentiating suffixes such as the channel number while leaving logo-backed identities, channel-strip dimensions, pager geometry, nested gestures and time anchoring unchanged.

## Remaining gate

After the remediation is CI-green and merged, perform one very small iPhone recheck at 135% text size:

1. open Per zender;
2. confirm `Publiek 1`, `Publiek 2` and `Publiek 3` are visually distinguishable in the horizontal strip;
3. tap at least two of them and confirm direct selection still works;
4. swipe the schedule once to an adjacent channel and confirm the strip follows the active channel.

No broad Phase 2 retest is required unless this focused recheck exposes a regression.
