# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 14:42 CEST — Europe/Amsterdam**. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie en Expo Go-versie zijn nog niet canoniek genoteerd.

## Fysiek geaccepteerde baseline
De volgende gedragingen zijn op de iPhone gericht gevalideerd en mogen niet zonder concreet regressiebewijs worden heropend:
- standaard platforminertie, native bounce/directional lock en doorlopende tijdlijn;
- `Vandaag · Morgen · Nu` op één regel, directe dagselected-state en `Nu`-terugkeer;
- Programme Detail openen/sluiten, button/backdrop close en deliberate swipe-down dismissal;
- grote systeemtekst/chrome alignment;
- PR #9 live partial-left programmatitel tijdens drag/momentum en programme boundaries;
- PR #11 single-mask time-axis: geen losse `:30`/`30`-fragmenten;
- PR #12 reverse-scroll title correction: geen massale blanking van zichtbare programmatitels;
- PR #13 VoiceOver traversal/labels + accessibility escape;
- PR #13 live system-theme switching in Guide en Programme Detail.

De product owner beschreef eerdere gerichte scroll/detail/swipe-dismiss hertests als **"perfect"**. De performancebevinding uit de 14:28-sessie hieronder kwalificeert alleen de respons van een Programme Detail-tap kort na horizontaal scrollen.

## Belangrijkste fysieke historie
### PR #6 — afgewezen
Een high-volume per-programme Reanimated-architectuur (>1000 cells) gaf ondanks groene CI een wit scherm/Expo Go-crash. Niet opnieuw invoeren zonder nieuwe evidence.

### PR #8 — afgewezen
React-state edge overlay liep achter native ScrollView tijdens drag/momentum en kon opvolgende content bedekken.

### PR #9 — geaccepteerd
`ScreenRecording_09-13-2026 11-35-40_1.MP4` bevestigde native/UI-thread partial-left edge readability zonder geometry jump of successor overlap.

### PR #10 — afgewezen
`ScreenRecording_09-13-2026 13-09-16_1.MP4` liet rond 8,7 s een los `30`-fragment op de tijdas zien. Per-tick Reanimated opacity blijft afgewezen.

### PR #11 — geaccepteerd
`ScreenRecording_09-13-2026 13-48-10_1.MP4` bevestigde whole-label disappearance op de tijdas met stabiele ticks/programme geometry. Dezelfde opname legde de afzonderlijke reverse-scroll titelblanking bloot.

### PR #12 — geaccepteerd
`ScreenRecording_09-13-2026 14-04-35_1.MP4` bevestigde bij sterke forward/reverse swipes dat programmatitels zichtbaar blijven en PR #9/PR #11 intact blijven.

## PR #13 — VoiceOver + live theme: fysiek geaccepteerd
Evidence: geschreven ownerobservatie plus `ScreenRecording_09-13-2026 14-28-46_1.MP4` (43,75 s, 1170×2532).

VoiceOver ownerobservatie:
- **volgorde goed**;
- programma wordt uitgesproken als **`NPO 1, titel, 14:00 tot 15:00`**;
- VoiceOver twee-vinger-scrub sluit Programme Detail.

Frame-review theme switching:
- Guide wisselt live licht → donker → licht zonder reload;
- Programme Detail blijft tijdens system Appearance-wissel geopend en volgt de nieuwe theme-state;
- status-bar behandeling schakelt visueel mee.

Conclusie: **PR #13 fysiek geaccepteerd voor de gerichte VoiceOver- en live-theme-gate.**

## Nieuwe bevinding uit de 14:28-sessie — post-scroll detail latency
De product owner meldt:
- direct na horizontaal tijdscrollen voelt een tik op een programma opnieuw trager;
- wanneer het scherm even stil staat, opent dezelfde detailinteractie snel.

Frame-review van de opname ondersteunt dat verschil als echte performancegate. In bemonsterde post-scroll openingsmomenten is er grofweg **0,7–0,9 s** tussen duidelijke press-reactie in de Guide en het zichtbaar starten van de Programme Detail-presentatie.

Code-audit wees op een plausibele JS-queuebron: horizontale `onScroll` draaide met `scrollEventThrottle={16}` en bridge-te ieder frame via `scheduleOnRN(handleHorizontalScroll, viewportX)` naar JS, terwijl de programme-tap/detail-state ook JS nodig heeft.

## PR #14 — per-frame horizontal JS bridge verwijderd
PR #14 verandert alleen het schedulingpad:
- iedere horizontale scrollframe-update van `scrollX` blijft op de UI-thread;
- geen JS-call meer op elk horizontaal scrollframe;
- `Vandaag/Morgen` wordt op de UI-thread afgeleid en bridge-t alleen wanneer de echte daggrens wijzigt;
- `onEndDrag` en `onMomentumEnd` bridge-en nog eenmaal voor settled readability/end-state;
- `Vandaag`, `Morgen` en `Nu` blijven React state direct bijwerken;
- scrollphysics, programme geometry, PR #9/#11/#12, detailmodal/gestures en verticale synchronisatie zijn niet gewijzigd.

Technische verificatie:
- PR-head **`33bcb83381f575a0f1a22cc4a571f4325a957582`**: PR CI #163 / `34757663408` volledig groen;
- merge **`e7f45a04544106803b2f49fe4e086d304bf061c8`**;
- exact merged code: main CI #164 / `34757796962` volledig groen.

Conclusie: **PR #14 technisch geaccepteerd, fysieke latencyvalidatie nog open.**

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Fysiek bevestigd** |
| Horizontale scroll/inertie/bounce | **Fysiek geaccepteerde/frozen baseline** |
| PR #9 edge readability | **Fysiek geaccepteerd** |
| PR #11 time-axis mask | **Fysiek geaccepteerd** |
| PR #12 reverse-scroll readability | **Fysiek geaccepteerd** |
| Vandaag/Morgen/Nu | **Fysiek bevestigd** |
| Programme Detail gestures/close | **Fysiek bevestigd** |
| VoiceOver/screenreader | **Fysiek geaccepteerd — PR #13** |
| Live theme switching | **Fysiek geaccepteerd — PR #13** |
| Post-scroll Programme Detail response | **PR #14 technisch groen; fysieke hertest nodig** |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |
| Midnight/fixture lifecycle | Open |

## Volgende fysieke validatie
Gebruik current `main` en vergelijk in één korte opname:
1. Geef de tijdlijn een duidelijke horizontale fling en tik vrijwel direct daarna op een programma zodra dat praktisch tappable is.
2. Sluit Programme Detail.
3. Laat de Guide ongeveer 2 seconden volledig stilstaan en tik een ander programma.
4. De detailpresentatie van stap 1 mag geen duidelijke extra wachttijd meer hebben ten opzichte van stap 3.
5. Scroll één keer handmatig over de Vandaag→Morgen-grens en bevestig dat de selected day correct wisselt.
6. Alleen bij spontane regressie opnieuw naar algemene scroll/readability kijken.

## Samenvatting
**PR #13 is fysiek gesloten: VoiceOver-volgorde/labels/escape en live system-theme switching werken op de iPhone. Dezelfde 14:28-sessie bracht een post-horizontal-scroll latencyprobleem bij Programme Detail aan het licht. PR #14 verwijdert de per-frame UI→JS bridge uit het horizontale scrollpad en is volledig technisch groen; alleen de gerichte iPhone latencyvergelijking staat nog open.**
