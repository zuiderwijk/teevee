# Per zender — physical test plan

Use this only for the Phase 1B Per zender prototype. Do not use observations here to retune the frozen Totaal inertia/geometry without separate evidence.

## Available-device gate — iPhone
1. Open the app. It should land in Per zender around the current time on Vandaag.
2. Scroll vertically both slowly and with a fling. Time labels and programme geometry should remain coherent and boundaries should retain native elasticity.
3. Swipe horizontally on the schedule. One adjacent channel should settle per swipe; the viewed time position must not jump.
4. Reverse direction repeatedly. There must be no stale channel label, blank schedule or accidental multi-channel jump.
5. Browse the channel strip horizontally, then tap a distant channel. The chosen channel should become active/visible while the schedule stays at the same time position.
6. Tap Morgen and then Vandaag. The approximate time position should be retained. Tap Nu; it should return to today/current time.
7. Open a programme, close Programme Detail, and confirm the same channel/day/time context remains.
8. Repeat horizontal channel swipes immediately before opening a programme. Detail onset should remain prompt.
9. Mix vertical flings, horizontal channel swipes and channel-strip browsing for at least a short session. No crash, white screen or obvious interaction collapse.
10. Inspect light and dark mode. If convenient, also sample a larger system text size for clipping or unusable controls.

## Deferred Android gate
A native Android compile can catch Gradle/native-module failures but cannot validate Back behaviour, nested-scroll gesture arbitration or realistic Android performance. Those remain deferred until a physical Android device or suitable interactive Android test environment is available.
