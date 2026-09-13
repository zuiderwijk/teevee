# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 13:55 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons, swipe-down dismissal en PR #9 live partial-left programme-readability zijn kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van standaard platforminertie, doorlopende tijdlijn/dagovergang/`Nu`, detailrespons en swipe-down dismissal. Heropen deze instellingen niet zonder concreet regressiesignaal.

PR #7 is fysiek geaccepteerd: normale startup, `Vandaag · Morgen · Nu` op één regel, directe selected-state, `Nu`-terugkeer en ongewijzigd/natuurlijk horizontaal scrollgevoel.

PR #9 is fysiek geaccepteerd voor de native/UI-thread gesynchroniseerde partial-left programmatitel tijdens drag, momentum en programmaboundaries. De programma-geometrie en scrollphysics uit die baseline zijn bevroren tenzij concreet regressiebewijs ontstaat.

PR #11 is fysiek geaccepteerd voor de afzonderlijke time-axis clippingcorrectie: vertrekkende tijdlabels verdwijnen als geheel, zonder losse `:30`/`30`-fragmenten, terwijl tickposities tijdgetrouw blijven.

## Dark mode en grotere systeemtekst
De eerder aangeleverde dark-mode Guide- en detailbeelden zijn beoordeeld; vraag ze niet opnieuw op. Dark mode is visueel bruikbaar, maar formele contrastmeting en screenreaderbewijs staan nog open.

Bij duidelijk vergrote systeemtekst vond de eerste test clipping in `Gids` en daglabels. PR #4 corrigeerde dit. De hertest om **08:59** bevestigde `Gids`, `Nu`, daglabels en tijdas volledig zichtbaar, zenderrail/programmarijen uitgelijnd en programmadetail plus `Sluiten` bereikbaar. Deze gerichte large-text/chrome-correctie is fysiek geaccepteerd.

## Partial-left programme-readability — historie
PR #5 maakte settled readability geometry-safe: de echte programmastart en duur-gebaseerde blokbreedte veranderen niet; na settle kan titel/tijd naar het zichtbare restant worden verankerd. De 09:20 iPhone-test bevestigde dat dit inhoudelijk werkte maar te laat kwam: de titel moest al tijdens drag en momentum leesbaar blijven.

PR #6 probeerde dit met per-programme Reanimated animated styles. PR/main CI waren groen, maar de eerste fysieke iPhone-start gaf een wit scherm gevolgd door een Expo Go-crash. De rollback naar **`f7c9f73568341d29e518be21e0de071e4ef7877d`** werd fysiek bevestigd als weer normaal startend. Daarmee is de PR #6-architectuur afgewezen voor deze fixture.

## PR #8 — technisch groen, fysiek afgewezen
`ScreenRecording_09-13-2026 10-49-27_1.MP4` liet zien dat de native ScrollView tijdens drag/momentum voorliep op de React-state overlay. Een oude edge kon zichtbaar blijven terwijl de tijdlijn al verder was en opvolgende content bedekken. De onderliggende programmablokken bleven geometrisch stabiel.

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
PR #10 gaf ieder halfuurlabel een Reanimated opacity-style. Final implementation head **`efeedc08d3a6c50f3ef3fc9f119e8da5e3860b2b`** passeerde PR CI #140 / `34750478071` volledig.

### Screen recording 13:09 — fysiek bewijs
`ScreenRecording_09-13-2026 13-09-16_1.MP4` liet zien:
- rond **8,7 s** blijft links alleen **`30`** van een tijdlabel zichtbaar;
- tijdens snelle horizontale beweging verdwijnen meerdere programmatitels tijdelijk terwijl de blokken zichtbaar blijven;
- programme frames blijven wel visueel stabiel.

Conclusie: **PR #10 fysiek afgewezen.** De per-tick Reanimated-opacityarchitectuur mag niet opnieuw worden ingevoerd.

De destijds aangenomen hypothese dat de extra animated tijdlabels de titelblanking veroorzaakten is door de latere PR #11-opname weerlegd: de titelblanking bleef bestaan nadat alle per-tick animaties waren verwijderd.

## PR #11 — single left-edge mask: time-axis fysiek geaccepteerd
PR #11 vervangt alleen de afgewezen PR #10-labelarchitectuur:
- ticklijnen en labelteksten zijn statische/native ScrollView-content;
- geen animated style per tijdlabel;
- één kleine `TimeAxisLeftMask` ligt vast aan de linker tijdasrand;
- de maskerbreedte volgt op de UI-thread het zichtbare restant van het ene label dat al gedeeltelijk uit beeld is;
- dezelfde bestaande PR #9 `scrollX` shared value wordt gebruikt;
- programme geometry en native scrollmechanica zijn niet gewijzigd.

Technische verificatie:
- PR-head **`8cba485c4c24bbf5160c652a13aba685c5520b3e`** passeerde PR CI #145 / **`34754026981`** volledig;
- PR #11 is gesquasht naar main als **`9ed7113bc114911218107263b6df224940d5dd09`**.

### Screen recording 13:48 — fysiek bewijs
De product owner leverde `ScreenRecording_09-13-2026 13-48-10_1.MP4` (14,28 s, 1170×2532).

Framecontrole van de tijdas:
- bij de overgang **13:30 → 14:00** blijft 13:30 volledig zichtbaar tot vlak voor de grens en is het in het volgende relevante frame volledig verdwenen;
- er is geen tussenframe met alleen `:30`, `30` of een ander afgesneden restant;
- hetzelfde whole-label gedrag is terug te zien bij andere bemonsterde tijdsovergangen tijdens snelle beweging;
- verticale tickposities blijven visueel stabiel; er is geen tijdlijnsprong;
- programme blocks blijven qua positie en breedte stabiel.

Conclusie voor de geïsoleerde PR #11-doelstelling: **de single-mask time-axis correctie is fysiek geaccepteerd.**

### Tegelijk blootgelegd: reverse-scroll title blanking
Dezelfde opname laat rond **7,0–7,4 s** een ander probleem zeer duidelijk zien: meerdere zichtbare programmeblokken zijn tijdelijk volledig zonder titeltekst tijdens een snelle scroll terug naar eerdere tijden. Rond 7,6–9,4 s keren titels geleidelijk/na settle weer terug.

Dit is geen time-axis-maskerfout. Analyse van de bestaande PR #5 settled-readabilityberekening wees op een stale `readabilityViewportX`: bij reverse scroll kan de laatst gesettelde viewport nog rechts van een nu opnieuw zichtbaar programma liggen. De helper behandelde zo'n programma alsof het volledig links van de viewport lag en reduceerde de interne tekstbreedte tot nul.

## PR #12 — reverse-scroll title blanking fix
PR #12 wijzigt alleen de pure settled-readability helper:
- re-anchoring wordt alleen toegepast wanneer de remembered viewport daadwerkelijk door het programmaframe snijdt;
- als de remembered viewport vóór het programma ligt of al op/voorbij het programma-einde is, blijft de normale volledige tekstgeometrie intact;
- PR #9 blijft verantwoordelijk voor live partial-left edge readability;
- programme `left`/`width`, native inertia/bounce/directional lock en PR #11 time-axis mask blijven ongewijzigd.

Regressietests dekken expliciet een stale viewport voorbij het programma-einde en de exacte end boundary.

Technische verificatie:
- PR-head **`0f00e69b3fc7d5211e8522367a8217ce360b9649`** passeerde PR CI #150 / **`34755583818`** volledig: install, strict TypeScript, lint, tests en iOS/Android/web Expo exports;
- PR #12 is gesquasht naar main als **`b76edfab972b1d6194b2cbf1460515256de0e5c4`**.

Deze technische verificatie vervangt geen toestelbewijs. PR #12 vereist nog één gerichte reverse-scroll hertest.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Fysiek bevestigd t/m PR #11; PR #12 regressiecheck nodig** |
| Horizontale scroll/inertie/bounce | **Fysiek geaccepteerde en bevroren baseline** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| PR #5 settled partial-left readability | **Fysiek waargenomen; PR #12 corrigeert reverse-scroll stale-state edge case** |
| PR #8 live edge readability | **Fysiek afgewezen** |
| PR #9 native-synced edge readability | **Fysiek geaccepteerd / frozen baseline** |
| PR #10 time-axis per-tick opacity | **Fysiek afgewezen** |
| PR #11 single left-edge time-axis mask | **Fysiek geaccepteerd** |
| PR #12 reverse-scroll title blanking | **Technisch groen op main; fysieke validatie nodig** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| VoiceOver/screenreader | Open |
| Live theme switching | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende fysieke validatie — nu uitvoeren
Gebruik current `main` en maak één korte screen recording met duidelijke beweging in **beide richtingen**:
1. Teevee blijft stabiel/open.
2. Geef een stevige fling naar latere tijden.
3. Geef daarna een stevige reverse fling terug naar eerdere tijden.
4. Programme-titels mogen tijdens reverse drag/momentum niet meer massaal verdwijnen uit zichtbare blokken.
5. De fysiek geaccepteerde PR #9 partial-left edge-title blijft coherent.
6. De fysiek geaccepteerde PR #11 time-axis blijft vrij van losse `:30`/`30`-fragmenten en ticks springen niet.
7. Programmeblokken blijven op hun echte positie/breedte.

`Vandaag/Morgen/Nu` en Programme Detail hoeven niet opnieuw getest te worden tenzij spontaan een regressie opvalt.

## Samenvatting
**De 13:48-opname accepteert PR #11 fysiek voor de time-axis: tijdlabels verdwijnen atomair en tickposities blijven stabiel. Diezelfde opname legt een oudere reverse-scroll bug bloot in de settled-readabilityberekening, waardoor zichtbare programmeblokken tijdelijk tekstloos konden worden. PR #12 corrigeert precies dat stale-state geval, is technisch volledig groen en op main geïntegreerd; alleen de gerichte iPhone-hertest staat nog open.**
