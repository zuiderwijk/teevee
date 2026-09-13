# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 11:08 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons en swipe-down dismissal zijn eerder kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van standaard platforminertie, doorlopende tijdlijn/dagovergang/`Nu`, detailrespons en swipe-down dismissal. Heropen deze instellingen niet zonder concreet regressiesignaal.

PR #7 is eveneens fysiek geaccepteerd: normale startup, `Vandaag · Morgen · Nu` op één regel, directe juiste selected-state plus `Nu`-terugkeer en ongewijzigd/natuurlijk horizontaal scrollgevoel.

## Dark mode en grotere systeemtekst
De eerder aangeleverde dark-mode Guide- en detailbeelden zijn beoordeeld; vraag ze niet opnieuw op. Dark mode is visueel bruikbaar, maar formele contrastmeting en screenreaderbewijs staan nog open.

Bij duidelijk vergrote systeemtekst vond de eerste test clipping in `Gids` en daglabels. PR #4 corrigeerde dit. De hertest om **08:59** bevestigde `Gids`, `Nu`, daglabels en tijdas volledig zichtbaar, zenderrail/programmarijen uitgelijnd en programmadetail plus `Sluiten` bereikbaar. Deze gerichte large-text/chrome-correctie is fysiek geaccepteerd.

## Partial-left programme-readability — historie
PR #5 maakte settled readability geometry-safe: de echte programmastart en duur-gebaseerde blokbreedte veranderen niet; na settle kan titel/tijd naar het zichtbare restant worden verankerd. De 09:20 iPhone-test bevestigde dat dit inhoudelijk werkte maar te laat kwam: de product owner wil dat de titel al tijdens drag en momentum leesbaar blijft.

PR #6 probeerde dit met per-programme Reanimated animated styles. PR/main CI waren groen, maar de eerste fysieke iPhone-start gaf een wit scherm gevolgd door een Expo Go-crash. De rollback naar **`f7c9f73568341d29e518be21e0de071e4ef7877d`** werd fysiek bevestigd als weer normaal startend. Daarmee is de PR #6-architectuur afgewezen voor deze fixture.

## PR #8 — technisch groen, fysiek afgewezen
PR #8 gebruikte één React-state overlay boven de programmeviewport. PR-head **`35282fffc558115f60eded7534c4eb03266cf4f7`** passeerde PR CI #120 / `34747825150`; merge **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`** passeerde exact-main CI #121 / `34747935259` eveneens volledig.

### Screen recording 10:49 — fysiek bewijs
De product owner leverde `ScreenRecording_09-13-2026 10-49-27_1.MP4`. De opname begint met Teevee al geopend; daardoor is normale **cold startup niet zelfstandig bewezen** door deze opname. De app blijft tijdens de zichtbare opname wel stabiel zonder crash.

Frame-voor-frame beoordeling:
- de titel wordt tijdens horizontale beweging wel opnieuw aan de linker rand getoond; het productconcept is dus zichtbaar;
- de overlay volgt de echte native ScrollView echter niet synchroon;
- tijdens drag en vooral momentum loopt de overlay achter op de tijdlijn;
- een verouderd programma blijft soms als opaque edge-laag staan terwijl het onderliggende schema al bij volgende programma's is;
- hierdoor worden opvolgende titels en tijden zichtbaar afgedekt/afgekapt;
- de onderliggende programmablokken zelf lijken hun echte positie en breedte te behouden en de native horizontale scroll oogt vloeiend.

Concrete visuele voorbeelden uit de opname zijn onder meer een oude `De Grote Keuken`-edge die blijft staan terwijl de tijdlijn al verder is, en opvolgende tekst/tijd die daardoor slechts gedeeltelijk zichtbaar wordt. Dit is een functionele fout; PR #8 is daarom **fysiek afgewezen**, ondanks groene CI.

De opname toont daarnaast opnieuw gedeeltelijk afgesneden tijdaslabels aan de linker viewportgrens. Dat is een separaat readability-punt en geen oorzaak van de PR #8-afwijzing.

## PR #9 — vervangende native/UI-thread synchronisatie
PR #9 (`fix: native-sync partial-left programme titles`) is gebouwd om specifiek het desynchronisatieprobleem uit de opname te verwijderen:
- de echte horizontale/verticale scrollpositie wordt op de UI-thread als shared value bijgehouden;
- edge-breedte, zichtbaarheid en verticale positie volgen die waarden direct;
- React wisselt de edge-inhoud alleen wanneer een programmagrens wordt gepasseerd;
- een eventueel vertraagde oude edge kan vanaf zijn echte einde direct niet meer tekenen, zodat hij een opvolgend programma niet kan bedekken;
- slechts 48 kleine edge-rijen krijgen live animated geometry, niet alle >1000 programmablokken;
- de live overlay toont alleen de titel; na settle blijft PR #5 de uitgebreidere titel/tijdweergave verzorgen.

Implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`** passeerde PR CI #125 / `34748926153` volledig. Na documentatie-updates is nog een finale PR-head CI vereist en daarna exact-main CI na merge. PR #9 is dus op dit moment **nog niet fysiek gevalideerd**.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Bevestigd t/m PR #7; PR #8-opname begint na startup** |
| Horizontale scroll/inertie/bounce | **Geaccepteerde baseline lijkt intact in PR #8-opname; PR #9 regressiecheck nodig** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| PR #5 settled partial-left readability | Fysiek waargenomen/geometry-safe |
| PR #8 live edge readability | **Fysiek afgewezen: stale overlay tijdens drag/momentum** |
| PR #9 native-synced edge readability | **Technisch in PR; fysieke validatie na merge nodig** |
| Tijdaslabel aan gedeeltelijk zichtbare linker tick | **Open afzonderlijk punt** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| Actieve dag direct na tap | **Fysiek bevestigd in PR #7** |
| VoiceOver/screenreader | Open |
| Live theme switching | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende fysieke validatie
Nog **niet uitvoeren** totdat PR #9 definitief naar main is gemerged en de exact-main CI groen is.

Daarna is één korte screen recording voldoende waarin zichtbaar is:
1. Teevee start/opent normaal; als de opname pas na openen start, dit punt apart mondeling bevestigen.
2. Een langer programma wordt horizontaal achter de vaste zenderrail geschoven; de titel blijft tijdens de vingerbeweging aan de linker rand gekoppeld.
3. Na loslaten met momentum blijft de titel synchroon volgen.
4. Een oude titel/edge verdwijnt uiterlijk op zijn echte programma-einde en bedekt nooit het volgende programma.
5. Programmablokken springen niet/veranderen niet zichtbaar van breedte en horizontaal scrollen voelt nog als de geaccepteerde baseline.

`Vandaag/Morgen/Nu` en detailgedrag hoeven niet opnieuw getest te worden tenzij spontaan een regressie opvalt.

## Samenvatting
**De 10:49-screenrecording bewijst dat PR #8 tijdens drag/momentum visueel achter de native tijdlijn loopt en opvolgende programma's kan afdekken; PR #8 is daarom fysiek afgewezen. PR #9 vervangt alleen deze synchronisatielaag door UI-thread-gedreven geometrie met beperkte edge-rows. De eerste code-CI is groen; finale PR/main-CI moeten nog volgen voordat opnieuw toestelbewijs wordt gevraagd.**
