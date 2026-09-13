# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 15:31 CEST — Europe/Amsterdam**. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie en Expo Go-versie zijn nog niet canoniek genoteerd.
- Android is nog niet fysiek gevalideerd.

## Fysiek geaccepteerde iPhone-baseline
De volgende gedragingen zijn gericht gevalideerd en mogen niet zonder concreet regressiebewijs worden heropend:
- standaard platforminertie, native bounce/directional lock en doorlopende tijdlijn;
- `Vandaag · Morgen · Nu` op één regel, directe day selected-state en `Nu`-terugkeer;
- Programme Detail openen/sluiten, button/backdrop close en deliberate swipe-down dismissal;
- grote systeemtekst/chrome alignment;
- PR #9 live partial-left programmatitel tijdens drag/momentum/settle en programme boundaries;
- PR #11 single-mask time-axis zonder losse `:30`/`30`-fragmenten;
- reverse-scroll readability zonder massale blanking;
- PR #13 VoiceOver traversal/labels + accessibility escape;
- PR #13 live system-theme switching in Guide en Programme Detail;
- PR #14/#15 post-horizontal-scroll Programme Detail response.

## Belangrijkste fysieke historie
### PR #6 — afgewezen
High-volume per-programme Reanimated (>1000 cells) gaf ondanks groene CI een wit scherm/Expo Go-crash. Niet opnieuw invoeren zonder nieuwe evidence.

### PR #8 — afgewezen
React-state edge overlay liep achter native ScrollView tijdens drag/momentum en kon opvolgende content bedekken.

### PR #9 — geaccepteerd
`ScreenRecording_09-13-2026 11-35-40_1.MP4` bevestigde native/UI-thread partial-left edge readability zonder geometry jump of successor overlap.

### PR #10 — afgewezen
`ScreenRecording_09-13-2026 13-09-16_1.MP4` liet een los `30`-fragment op de tijdas zien. Per-tick Reanimated opacity blijft afgewezen.

### PR #11 — geaccepteerd
`ScreenRecording_09-13-2026 13-48-10_1.MP4` bevestigde whole-label disappearance op de tijdas met stabiele ticks/programme geometry.

### PR #12 — geaccepteerd
`ScreenRecording_09-13-2026 14-04-35_1.MP4` bevestigde bij sterke forward/reverse swipes dat programmatitels zichtbaar blijven en PR #9/PR #11 intact blijven. De settled-readability state die PR #12 destijds corrigeerde is later door PR #15 volledig uit `GuideView` verwijderd.

## PR #13 — VoiceOver + live theme: fysiek geaccepteerd
Evidence: geschreven ownerobservatie plus `ScreenRecording_09-13-2026 14-28-46_1.MP4`.

VoiceOver:
- volgorde goed;
- programma wordt uitgesproken als `NPO 1, titel, 14:00 tot 15:00`;
- twee-vinger-scrub sluit Programme Detail.

Theme:
- Guide wisselt live licht → donker → licht zonder reload;
- Programme Detail volgt een system Appearance-wissel terwijl het geopend blijft;
- status-bar treatment schakelt mee.

## Post-horizontal-scroll detail performance
### 14:28 — probleem vastgelegd
`ScreenRecording_09-13-2026 14-28-46_1.MP4` liet na recente horizontale beweging grofweg 0,7–0,9 s zien tussen duidelijke press feedback en het zichtbaar starten van Programme Detail.

### PR #14 — eerste bottleneck verwijderd
De per-frame horizontal UI→JS bridge werd verwijderd. `ScreenRecording_09-13-2026 14-49-22_1.MP4` plus owner feedback bevestigde duidelijke winst, maar de post-horizontal-fling case bleef trager dan een tap na circa twee seconden stilstand. Een verticale fling was wel direct, waarmee resterend horizontaal settle-werk als oorzaak sterk werd geïsoleerd.

### PR #15 — tweede bottleneck verwijderd en fysiek geaccepteerd
PR #15 verwijderde legacy `readabilityViewportX` React state en daarmee de full-Guide rerenders bij horizontal finger-up/momentum settle. PR #9 verzorgt sindsdien als enige laag de partial-left readability.

Evidence: `ScreenRecording_09-13-2026 15-11-35_1.MP4`.

Framevergelijking:
- **post-horizontal-fling:** duidelijke press feedback circa **2,40 s**, modal-dimming circa **2,42 s**;
- **still Guide:** press feedback circa **5,72 s**, modal-dimming circa **5,74 s**;
- het verschil ligt binnen ongeveer één opgenomen videoframe;
- de native bottom-sheetanimatie start in beide gevallen binnen grofweg twee tienden van een seconde;
- geen terugkeer van PR #9 title blanking of PR #11 `:30`/`30`-fragmenten zichtbaar.

Conclusie: **PR #15 en de gecombineerde PR #14/#15 latencycorrectie zijn fysiek geaccepteerd op iPhone.**

## Technisch afgerond zonder nieuwe toestelgate
### PR #16 — current-time/progress accuracy
Pure timing/precision hardening:
- gedeelde start-inclusive/end-exclusive current-programme semantiek;
- exact boundarytests;
- één `nowMs` snapshot voor current/progress;
- fractionele progress-fill;
- sub-minute current-time geometry test.

PR CI #173 en exact-main CI #174 volledig groen.

### PR #17 — finite fixture lifecycle
- runtimefixture herankert bij een nieuwe Amsterdamse kalenderdag;
- same-day resume houdt dezelfde fixture;
- normal midnight + beide DST-overgangen getest;
- Guide-klok ververst onmiddellijk op `AppState → active`;
- `Nu` controleert stale fixture day voordat het scrollt.

PR CI #175 en exact-main CI #176 volledig groen. Dit is deterministische lifecyclelogica; er is geen claim dat een echte overnight-device-run is uitgevoerd.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go iPhone | **Fysiek bevestigd** |
| Horizontale scroll/inertie/bounce | **Fysiek geaccepteerde/frozen baseline** |
| PR #9 edge readability | **Fysiek geaccepteerd** |
| PR #11 time-axis mask | **Fysiek geaccepteerd** |
| Reverse-scroll readability | **Fysiek geaccepteerd** |
| Vandaag/Morgen/Nu | **Fysiek bevestigd** |
| Programme Detail gestures/close iPhone | **Fysiek bevestigd** |
| VoiceOver/screenreader | **Fysiek geaccepteerd — PR #13** |
| Live theme switching | **Fysiek geaccepteerd — PR #13** |
| Post-horizontal-scroll Programme Detail response | **Fysiek geaccepteerd — PR #14/#15** |
| Current-time/progress semantics | **Technisch groen — PR #16** |
| Midnight/resume finite fixture lifecycle | **Technisch groen — PR #17** |
| Android native back/gestures/performance | **Open — fysiek toestel nodig** |
| Release-like performance buiten Expo Go | **Open** |

## Volgende fysieke validatie
Op een fysiek Android-toestel met current `main`:
1. App opent normaal.
2. Horizontale en verticale Guide-beweging blijven bruikbaar en stabiel.
3. Tik een programma; Programme Detail opent prompt.
4. Gebruik Android system/hardware Back; Detail sluit één keer en de Guide blijft op dezelfde positie.
5. Open opnieuw en sluit met een deliberate swipe-down.
6. Doe een korte gemengde scrollsessie; geen crash, wit scherm of duidelijke performance collapse.

De iPhone-scrollphysics hoeven hierbij niet opnieuw ontworpen of geretuned te worden.

## Samenvatting
**De volledige gerichte iPhone Phase 1-interactie-/performancegate is nu gesloten. PR #15 brengt post-horizontal-fling detailrespons op praktisch hetzelfde niveau als de still-case en houdt PR #9/PR #11 intact. PR #16 en PR #17 hardenen vervolgens timing/progress en midnight/resume deterministisch. De resterende native productgate is Android.**
