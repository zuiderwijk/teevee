# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 15:00 CEST — Europe/Amsterdam**. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie en Expo Go-versie zijn nog niet canoniek genoteerd.

## Fysiek geaccepteerde baseline
De volgende gedragingen zijn gericht op iPhone gevalideerd en mogen niet zonder concreet regressiebewijs worden heropend:
- standaard platforminertie, native bounce/directional lock en doorlopende tijdlijn;
- `Vandaag · Morgen · Nu` op één regel, directe day selected-state en `Nu`-terugkeer;
- Programme Detail button/backdrop close en deliberate swipe-down dismissal;
- grote systeemtekst/chrome alignment;
- PR #9 live partial-left programmatitel tijdens drag/momentum/settle en programme boundaries;
- PR #11 single-mask time-axis zonder losse `:30`/`30`-fragmenten;
- reverse-scroll readability zonder massale blanking;
- PR #13 VoiceOver traversal/labels + accessibility escape;
- PR #13 live system-theme switching in Guide en Programme Detail.

De performancebevindingen hieronder kwalificeren alleen de respons van een Programme Detail-tap kort na horizontaal scrollen; ze heropenen de geaccepteerde scrollphysics of detailgestures niet.

## Belangrijkste fysieke historie
### PR #6 — afgewezen
High-volume per-programme Reanimated (>1000 cells) gaf ondanks groene CI een wit scherm/Expo Go-crash. Niet opnieuw invoeren zonder nieuwe evidence.

### PR #8 — afgewezen
React-state edge overlay liep achter native ScrollView tijdens drag/momentum en kon opvolgende content bedekken.

### PR #9 — geaccepteerd
`ScreenRecording_09-13-2026 11-35-40_1.MP4` bevestigde native/UI-thread partial-left edge readability zonder geometry jump of successor overlap.

### PR #10 — afgewezen
`ScreenRecording_09-13-2026 13-09-16_1.MP4` liet rond 8,7 s een los `30`-fragment op de tijdas zien. Per-tick Reanimated opacity blijft afgewezen.

### PR #11 — geaccepteerd
`ScreenRecording_09-13-2026 13-48-10_1.MP4` bevestigde whole-label disappearance op de tijdas met stabiele ticks/programme geometry.

### PR #12 — geaccepteerd
`ScreenRecording_09-13-2026 14-04-35_1.MP4` bevestigde bij sterke forward/reverse swipes dat programmatitels zichtbaar blijven en PR #9/PR #11 intact blijven. De settled-readability state die PR #12 destijds corrigeerde is later door PR #15 volledig uit `GuideView` verwijderd; PR #9 is nu de enige partial-left readabilitylaag.

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

Conclusie: **PR #13 fysiek geaccepteerd.**

## 14:28 — post-horizontal-scroll detail latency
Dezelfde sessie bracht een aparte performancebevinding aan het licht:
- direct na horizontaal tijdscrollen voelt een programme-tap duidelijk trager;
- na korte stilstand opent dezelfde detailinteractie snel;
- frame-review liet in bemonsterde gevallen ongeveer **0,7–0,9 s** zien tussen press feedback en zichtbaar starten van Programme Detail na recente horizontale beweging.

Code-audit wees als eerste bron op een per-frame UI→JS bridge vanuit horizontale `onScroll`.

## PR #14 — per-frame horizontal JS bridge verwijderd
PR #14 houdt iedere `scrollX` frame-update op de UI-thread. `Vandaag/Morgen` bridge-t alleen wanneer de echte daggrens verandert; scrollphysics en programme geometry zijn niet gewijzigd.

Technische verificatie:
- PR-head `33bcb83381f575a0f1a22cc4a571f4325a957582`: PR CI #163 / `34757663408` volledig groen;
- merge `e7f45a04544106803b2f49fe4e086d304bf061c8`;
- exact merged code: main CI #164 / `34757796962` volledig groen.

### 14:49 device result — duidelijke winst, nog niet gelijk aan stilstand
Evidence: ownerobservatie plus `ScreenRecording_09-13-2026 14-49-22_1.MP4`.

De product owner bevestigt:
- direct na een horizontale fling opent Programme Detail **sneller dan in de vorige versie**;
- het is nog **niet zo snel als na ongeveer twee seconden stilstand**;
- na een **verticale fling** opent Programme Detail wel even snel als in de still-case;
- de overgang Vandaag→Morgen blijft correct.

Conclusie: **PR #14 is fysiek gevalideerd als materiële verbetering, maar sluit de latencygate niet volledig.** De verticale controle maakt algemene Modal/Pressable-performance als primaire oorzaak onwaarschijnlijk en wijst naar resterend horizontaal settle-werk.

## PR #15 — settled full-grid rerenders verwijderd
Vervolgaudit vond de resterende horizontale kost:
- legacy `readabilityViewportX` React state werd bij `onEndDrag` én `onMomentumEnd` bijgewerkt;
- iedere update kon de volledige 48-channel / >1000-programme-cell Guide opnieuw renderen vlak rond een programme-tap;
- PR #9 levert partial-left readability al continu, ook na settle.

PR #15 verwijdert daarom:
- `readabilityViewportX` en zijn setters;
- de horizontale `onEndDrag` JS callback;
- de zware readability-state update op `onMomentumEnd`.

`onMomentumEnd` houdt alleen een lichte day-state eindcontrole. Onderliggende programme content gebruikt de echte programme frame-breedte; de PR #9 edge overlay verzorgt partial-left readability. Native inertia/bounce/directional lock, programme `left`/`width`, PR #11 time-axis mask, PR #14 UI-thread scrollpad, Programme Detail en verticale synchronisatie zijn niet veranderd.

Technische verificatie:
- PR-head `bf743618b3d062d8771d220fc94ae9f99cc01c87` passeerde PR CI #168 / `34758480218` volledig;
- PR #15 is gesquasht naar main als `48e54008d8925fe4533bdbfd44f8639c63e645bc`.

Conclusie: **PR #15 technisch geaccepteerd; fysieke latency- en regressievalidatie staat open.**

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Fysiek bevestigd** |
| Horizontale scroll/inertie/bounce | **Fysiek geaccepteerde/frozen baseline** |
| PR #9 edge readability | **Fysiek geaccepteerd** |
| PR #11 time-axis mask | **Fysiek geaccepteerd** |
| Reverse-scroll readability | **Fysiek geaccepteerd** |
| Vandaag/Morgen/Nu | **Fysiek bevestigd, incl. 14:49 transition** |
| Programme Detail gestures/close | **Fysiek bevestigd** |
| VoiceOver/screenreader | **Fysiek geaccepteerd — PR #13** |
| Live theme switching | **Fysiek geaccepteerd — PR #13** |
| Post-horizontal-scroll Programme Detail response | **PR #14 verbeterde fysiek; PR #15 technisch groen, hertest nodig** |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |
| Midnight/fixture lifecycle | Open |

## Volgende fysieke validatie
Gebruik current `main` en vergelijk in één korte opname:
1. Geef de tijdlijn een stevige horizontale fling en tik een programma zodra dat praktisch tappable is.
2. Sluit Programme Detail.
3. Laat de Guide ongeveer twee seconden volledig stilstaan en tik een ander programma.
4. Beoordeel of de start van Programme Detail in stap 1 nu praktisch gelijk voelt aan stap 3.
5. Controleer tijdens/na de fling alleen als regressiegate dat de PR #9 partial-left titel natuurlijk blijft en de tijdas geen afgesneden `:30`/`30` toont.

Vandaag→Morgen hoeft niet opnieuw bewust getest te worden; de 14:49-test heeft die overgang al bevestigd.

## Samenvatting
**PR #14 leverde op iPhone aantoonbaar snellere detailrespons na horizontaal scrollen, maar nog geen gelijkheid met de still-case. Het contrast met de snelle verticale-fling-case leidde tot de tweede horizontale bottleneck: twee redundante full-grid settled-readability renders. PR #15 verwijdert die renders en is volledig technisch groen; één gerichte iPhone A/B-hertest resteert.**
