# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 13:17 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons, swipe-down dismissal en PR #9 live partial-left programme-readability zijn kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van standaard platforminertie, doorlopende tijdlijn/dagovergang/`Nu`, detailrespons en swipe-down dismissal. Heropen deze instellingen niet zonder concreet regressiesignaal.

PR #7 is fysiek geaccepteerd: normale startup, `Vandaag · Morgen · Nu` op één regel, directe selected-state, `Nu`-terugkeer en ongewijzigd/natuurlijk horizontaal scrollgevoel.

PR #9 is fysiek geaccepteerd voor de native/UI-thread gesynchroniseerde partial-left programmatitel tijdens drag, momentum en programmaboundaries. De programma-geometrie en scrollphysics uit die baseline zijn bevroren tenzij concreet regressiebewijs ontstaat.

## Dark mode en grotere systeemtekst
De eerder aangeleverde dark-mode Guide- en detailbeelden zijn beoordeeld; vraag ze niet opnieuw op. Dark mode is visueel bruikbaar, maar formele contrastmeting en screenreaderbewijs staan nog open.

Bij duidelijk vergrote systeemtekst vond de eerste test clipping in `Gids` en daglabels. PR #4 corrigeerde dit. De hertest om **08:59** bevestigde `Gids`, `Nu`, daglabels en tijdas volledig zichtbaar, zenderrail/programmarijen uitgelijnd en programmadetail plus `Sluiten` bereikbaar. Deze gerichte large-text/chrome-correctie is fysiek geaccepteerd.

## Partial-left programme-readability — historie
PR #5 maakte settled readability geometry-safe: de echte programmastart en duur-gebaseerde blokbreedte veranderen niet; na settle kan titel/tijd naar het zichtbare restant worden verankerd. De 09:20 iPhone-test bevestigde dat dit inhoudelijk werkte maar te laat kwam: de titel moest al tijdens drag en momentum leesbaar blijven.

PR #6 probeerde dit met per-programme Reanimated animated styles. PR/main CI waren groen, maar de eerste fysieke iPhone-start gaf een wit scherm gevolgd door een Expo Go-crash. De rollback naar **`f7c9f73568341d29e518be21e0de071e4ef7877d`** werd fysiek bevestigd als weer normaal startend. Daarmee is de PR #6-architectuur afgewezen voor deze fixture.

## PR #8 — technisch groen, fysiek afgewezen
PR #8 gebruikte één React-state overlay boven de programmeviewport. PR-head **`35282fffc558115f60eded7534c4eb03266cf4f7`** passeerde PR CI #120 / `34747825150`; merge **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`** passeerde exact-main CI #121 / `34747935259` eveneens volledig.

### Screen recording 10:49 — fysiek bewijs
`ScreenRecording_09-13-2026 10-49-27_1.MP4` liet zien:
- de native ScrollView liep tijdens drag/momentum voor op de React-state overlay;
- een oude edge kon zichtbaar blijven terwijl de onderliggende tijdlijn al verder was;
- opvolgende titel/tijd werd daardoor bedekt;
- de onderliggende programmablokken zelf bleven geometrisch stabiel.

Conclusie: **PR #8 fysiek afgewezen** ondanks groene CI.

## PR #9 — fysiek geaccepteerde native/UI-thread synchronisatie
PR #9 verplaatste edge-geometrie naar UI-thread shared values. React wisselt alleen edge-inhoud op programmaboundaries; een eventueel vertraagde oude edge stopt uiterlijk bij zijn echte programma-einde met tekenen. Slechts 48 kleine edge-rijen krijgen live animated geometry.

Technische verificatie:
- implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`**: PR CI #125 / `34748926153` volledig geslaagd;
- definitieve PR-head **`8a37cef550e0558a03d0876a356e295ff4ac424b`**: PR CI #128 / `34749068020` volledig geslaagd;
- exact-main CI #129 / `34749225666` volledig geslaagd.

### Screen recording 11:35 — fysiek bewijs
`ScreenRecording_09-13-2026 11-35-40_1.MP4` liet frame-voor-frame zien:
- stabiele sessie zonder white-screen/crash;
- partial-left programmatitel volgt de zichtbare linker rand tijdens drag;
- relatie blijft coherent tijdens momentum;
- oude edge verdwijnt bij het echte programma-einde en bedekt geen opvolger;
- programmaframes ogen stabiel en scrollgevoel blijft overeenkomen met de eerder geaccepteerde baseline.

Conclusie: **PR #9 fysiek geaccepteerd en bevroren.**

## PR #10 — technisch groen, fysiek afgewezen
PR #10 probeerde het afzonderlijke time-axisprobleem op te lossen door ieder halfuurlabel een kleine Reanimated opacity-style te geven. Het label zou atomair verdwijnen zodra zijn tekstbegin de linker viewportgrens passeert.

Technische verificatie:
- final implementation head **`efeedc08d3a6c50f3ef3fc9f119e8da5e3860b2b`** passeerde PR CI #140 / `34750478071` volledig: installatie, strict TypeScript, lint, **75 tests** en iOS/Android/web Expo exports;
- de squash-write landde op main als **`b18e0b0e153f17b417dd13dd4a3ff02a45157b45`**;
- latere main-CI bleef groen.

### Screen recording 13:09 — fysiek bewijs
De product owner leverde `ScreenRecording_09-13-2026 13-09-16_1.MP4` (20,3 s, 1170×2532). Frame-voor-frame beoordeling:
- de app blijft tijdens de zichtbare sessie stabiel;
- rond **8,7 s** is aan de linker tijdas nog alleen **`30`** van een tijdlabel zichtbaar: exact het fragment dat PR #10 moest voorkomen;
- tijdens snelle horizontale beweging, onder meer grofweg 6,5–7,8 s en opnieuw 9,5–12 s, verdwijnen meerdere programmatitels tijdelijk terwijl de blokken zelf zichtbaar blijven; de titels keren na settle terug;
- dit botst met de bevroren PR #9 producteis dat partial-left programmatitels tijdens drag/momentum bruikbaar blijven;
- programme frames zelf blijven visueel op hun echte positie/breedte; er is geen bewijs dat de geometrie of native scrollphysics gewijzigd moet worden.

Conclusie: **PR #10 is fysiek afgewezen.** De per-tick Reanimated-opacityarchitectuur mag niet opnieuw worden ingevoerd.

De extra animated workload van circa twee time-label nodes per elapsed hour is een plausibele verklaring voor de verslechterde live-titlebeschikbaarheid, maar dit is een hypothese en geen bewezen native root cause.

## PR #11 — single left-edge mask, technisch groen
PR #11 vervangt uitsluitend de afgewezen PR #10-labelarchitectuur:
- ticklijnen en labelteksten zijn weer statische/native ScrollView-content;
- er is geen animated style per tijdlabel meer;
- één kleine `TimeAxisLeftMask` ligt vast aan de linker tijdasrand;
- de maskerbreedte volgt op de UI-thread exact het zichtbare restant van het ene label dat al gedeeltelijk uit beeld is;
- zodra dat label volledig weg is, gaat de breedte terug naar nul;
- de volgende halfuurtick ligt met de huidige layout altijd buiten het masker;
- dezelfde bestaande PR #9 `scrollX` shared value wordt gebruikt;
- programme geometry en native scrollmechanica zijn niet gewijzigd.

Technische verificatie:
- PR-head **`8cba485c4c24bbf5160c652a13aba685c5520b3e`** passeerde PR CI #145 / **`34754026981`** volledig: install, strict TypeScript, lint, tests en iOS/Android/web Expo exports;
- PR #11 is gesquasht naar main als **`9ed7113bc114911218107263b6df224940d5dd09`**.

Deze technische verificatie vervangt geen toestelbewijs. PR #11 is **nog niet fysiek geaccepteerd**.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Fysiek bevestigd t/m PR #9; PR #11 regressiecheck nodig** |
| Horizontale scroll/inertie/bounce | **Fysiek geaccepteerde en bevroren baseline** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| PR #5 settled partial-left readability | Fysiek waargenomen/geometry-safe |
| PR #8 live edge readability | **Fysiek afgewezen** |
| PR #9 native-synced edge readability | **Fysiek geaccepteerd / frozen baseline** |
| PR #10 time-axis per-tick opacity | **Fysiek afgewezen** |
| PR #11 single left-edge mask | **Technisch groen op main; fysieke validatie nodig** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| VoiceOver/screenreader | Open |
| Live theme switching | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende fysieke validatie — nu uitvoeren
Gebruik current `main` en maak één korte screen recording waarin vooral horizontale Guide-beweging zichtbaar is:
1. Teevee blijft stabiel/open.
2. Scroll langzaam over meerdere halfuur-ticks. Een label dat links uit beeld schuift mag nooit als los `:30`, `30`, uurfragment of andere halve tijd zichtbaar blijven.
3. Herhaal met duidelijke momentum; hetzelfde moet tijdens uitrollen gelden.
4. Verticale ticks blijven op hun echte tijdpositie; geen tijdlijnsprong.
5. Programmeblokken blijven op hun echte positie/breedte.
6. De fysiek geaccepteerde PR #9 partial-left programmatitels blijven tijdens **drag én momentum** zichtbaar/coherent en verdwijnen niet langdurig totdat de scroll settle bereikt.

`Vandaag/Morgen/Nu` en Programme Detail hoeven niet opnieuw getest te worden tenzij spontaan een regressie opvalt.

## Samenvatting
**PR #10 is door de 13:09-screenrecording fysiek afgewezen: een `30`-fragment bleef zichtbaar en live programmatitels verdwenen tijdens snelle horizontale beweging. PR #11 verwijdert alle per-tick animaties en gebruikt één UI-thread masker aan de linker tijdasrand. Die vervanger is technisch groen en op main geïntegreerd; alleen de gerichte iPhone-hertest staat nog open.**
