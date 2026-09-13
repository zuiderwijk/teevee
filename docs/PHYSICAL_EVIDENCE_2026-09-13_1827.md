# Physical evidence — Phase 2 shell smoke

Date: 2026-09-13, approximately 18:27 CEST  
Device: available iPhone  
Recording: `ScreenRecording_09-13-2026 18-27-14_1.MP4`

## Scope
This smoke pass validates the first Phase 2 App Shell increment after PR #25 merged.

## Visible evidence from the recording
- Teevee starts normally in `Gids` without the earlier Nu & Straks startup redbox.
- The direct Guide selector moves between `Totaal`, `Per zender` and `Nu & Straks`.
- Deferred `Nu & Straks` loading still succeeds after startup.
- Primary bottom navigation moves `Gids → Vanavond → Zoeken → Gids` without a blank screen or crash.
- Returning to Gids preserves the selected Guide presentation in the mounted shell during the tested navigation round-trip.

## Owner confirmation after the recording
The owner separately confirmed that Programme Detail opens successfully from **all three Guide presentations** under the new shell.

## Conclusion
The PR #25 App Shell smoke gate is physically accepted on the available iPhone. This does not constitute Android-device acceptance and does not reopen the frozen Guide interaction mechanics.

The next Phase 2 increment may therefore build local preference persistence/settings foundations on top of the accepted shell.
