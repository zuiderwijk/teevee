# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 11:19 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

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

Technische verificatie:
- implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`**: PR CI #125 / `34748926153` volledig geslaagd;
- definitieve PR-head **`8a37cef550e0558a03d0876a356e295ff4ac424b`**: PR CI #128 / `34749068020` volledig geslaagd;
- PR #9 is door GitHub als merged geregistreerd op main met dezelfde SHA **`8a37cef550e0558a03d0876a356e295ff4ac424b`**;
- exact-main CI #129 / `34749225666` volledig geslaagd: installatie, strict TypeScript, lint, tests en iOS/Android/web exports.

Deze technische verificatie vervangt geen toestelbewijs. PR #9 is nu **klaar voor fysieke validatie**, maar nog niet fysiek geaccepteerd.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Bevestigd t/m PR #7; PR #9 startupcheck nodig** |
| Horizontale scroll/inertie/bounce | **Geaccepteerde baseline; PR #9 regressiecheck nodig** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| PR #5 settled partial-left readability | Fysiek waargenomen/geometry-safe |
| PR #8 live edge readability | **Fysiek afgewezen: stale overlay tijdens drag/momentum** |
| PR #9 native-synced edge readability | **Technisch groen op main; fysieke validatie nodig** |
| Tijdaslabel aan gedeeltelijk zichtbare linker tick | **Open afzonderlijk punt** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| Actieve dag direct na tap | **Fysiek bevestigd in PR #7** |
| VoiceOver/screenreader | Open |
| Live theme switching | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende fysieke validatie — nu uitvoeren
Gebruik current main. De vergrote tekststand mag blijven staan.

Maak bij voorkeur één korte screen recording vergelijkbaar met de 10:49-opname waarin zichtbaar is:
1. Teevee opent normaal. Als je de recording pas na het openen start, bevestig startup dan apart met `ja`.
2. Scroll horizontaal zodat de start van een langer programma achter de vaste zenderrail verdwijnt. De titel hoort **tijdens de vingerbeweging** aan de zichtbare linker rand te blijven volgen zonder merkbare lag.
3. Laat los met voldoende momentum. De titel hoort ook tijdens het uitrollen synchroon te blijven.
4. Wanneer het echte programma-einde de linker rand passeert, moet de oude edge uiterlijk daar verdwijnen; hij mag nooit over de opvolgende uitzending heen tekenen.
5. Programmablokken mogen niet springen of zichtbaar van breedte veranderen en horizontaal scrollen moet nog natuurlijk voelen.

Already accepted `Vandaag/Morgen/Nu` en detailgedrag hoeven niet opnieuw getest te worden tenzij spontaan een regressie opvalt.

## Samenvatting
**De 10:49-screenrecording bewees dat PR #8 tijdens drag/momentum achter de native tijdlijn liep en opvolgende programma's kon afdekken. PR #9 vervangt die synchronisatielaag door UI-thread-gedreven edge-geometrie, is op de definitieve PR-head en exact main volledig groen, en staat nu uitsluitend nog achter een gerichte iPhone-validatiegate.**
