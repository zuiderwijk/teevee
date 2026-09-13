# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 11:57 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons, swipe-down dismissal en PR #9 live partial-left programme-readability zijn kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van standaard platforminertie, doorlopende tijdlijn/dagovergang/`Nu`, detailrespons en swipe-down dismissal. Heropen deze instellingen niet zonder concreet regressiesignaal.

PR #7 is eveneens fysiek geaccepteerd: normale startup, `Vandaag · Morgen · Nu` op één regel, directe juiste selected-state plus `Nu`-terugkeer en ongewijzigd/natuurlijk horizontaal scrollgevoel.

PR #9 is nu aanvullend fysiek geaccepteerd voor de native/UI-thread gesynchroniseerde partial-left programmatitel tijdens drag, momentum en programmaboundaries. De programma-geometrie en scrollphysics uit die baseline zijn bevroren tenzij concreet regressiebewijs ontstaat.

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

## PR #9 — fysiek geaccepteerde native/UI-thread synchronisatie
PR #9 (`fix: native-sync partial-left programme titles`) vervangt specifiek het desynchronisatieprobleem uit de 10:49-opname:
- de echte horizontale/verticale scrollpositie wordt op de UI-thread als shared value bijgehouden;
- edge-breedte, zichtbaarheid en verticale positie volgen die waarden direct;
- React wisselt de edge-inhoud alleen wanneer een programmagrens wordt gepasseerd;
- een eventueel vertraagde oude edge kan vanaf zijn echte einde direct niet meer tekenen, zodat hij een opvolgend programma niet kan bedekken;
- slechts 48 kleine edge-rijen krijgen live animated geometry, niet alle >1000 programmablokken;
- de live overlay toont alleen de titel; na settle blijft PR #5 de uitgebreidere titel/tijdweergave verzorgen.

Technische verificatie:
- implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`**: PR CI #125 / `34748926153` volledig geslaagd;
- definitieve PR-head **`8a37cef550e0558a03d0876a356e295ff4ac424b`**: PR CI #128 / `34749068020` volledig geslaagd;
- exact-main CI #129 / `34749225666` volledig geslaagd: installatie, strict TypeScript, lint, tests en iOS/Android/web exports.

### Screen recording 11:35 — fysiek bewijs
De product owner leverde `ScreenRecording_09-13-2026 11-35-40_1.MP4`. Frame-voor-frame beoordeling laat zien:
- Teevee blijft normaal en stabiel zichtbaar; geen white-screen/crash tijdens de geteste sessie;
- de partial-left programmatitel volgt de zichtbare linker rand tijdens horizontale drag zonder de PR #8-lag;
- dezelfde relatie blijft coherent tijdens momentum na loslaten;
- een oude edge verdwijnt bij het echte programma-einde en blijft niet als opaque laag over de opvolger staan;
- programmaframes ogen stabiel; er zijn geen zichtbare sprongen of breedtewijzigingen;
- het horizontale scrollgevoel oogt consistent met de eerder geaccepteerde native baseline.

Conclusie: **PR #9 is fysiek geaccepteerd en de bijbehorende scroll/readabilitymechanica is bevroren.**

De opname laat nog wel het afzonderlijke time-axisprobleem zien: een tijdlabel kan aan de linker viewportgrens als gedeeltelijk tekstfragment zichtbaar blijven. Dat is nu het enige directe visual-readabilitypunt in deze flow.

## PR #10 — time-axis left-edge label fix
PR #10 houdt de ticklijn op de exacte echte tijdpositie en verandert uitsluitend de zichtbaarheid van de labeltekst. De bestaande PR #9 `scrollX` shared value wordt hergebruikt. Zodra het tekstbegin de linker viewportgrens passeert, gaat de label-opacity op de UI-thread in één stap naar nul; de tijdlijn zelf verschuift niet.

Technische verificatie:
- PR CI #139 / `34750401708`: installatie, typecheck, lint en de nieuwe pure time-axis tests waren groen; de bestaande Guide-integratietest faalde alleen omdat de testmock geen `Animated.Text` exposeerde. Expo export werd daardoor terecht overgeslagen.
- De mock is uitsluitend testtechnisch uitgebreid met `Animated.Text`.
- Final implementation head **`efeedc08d3a6c50f3ef3fc9f119e8da5e3860b2b`** passeerde PR CI #140 / `34750478071` volledig: installatie, strict TypeScript, lint, **75 tests** en iOS/Android/web Expo exports.
- De squash-write naar main is ondanks een connector-timeout aantoonbaar geland als **`b18e0b0e153f17b417dd13dd4a3ff02a45157b45`**.

Deze technische verificatie vervangt geen toestelbewijs. PR #10 is **nog niet fysiek geaccepteerd**.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Fysiek bevestigd t/m PR #9; PR #10 startup-regressiecheck nodig** |
| Horizontale scroll/inertie/bounce | **Fysiek geaccepteerde en bevroren baseline** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| PR #5 settled partial-left readability | Fysiek waargenomen/geometry-safe |
| PR #8 live edge readability | **Fysiek afgewezen: stale overlay tijdens drag/momentum** |
| PR #9 native-synced edge readability | **Fysiek geaccepteerd** |
| PR #10 gedeeltelijk time-axislabel links | **Technisch groen op main; fysieke validatie nodig** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| Actieve dag direct na tap | **Fysiek bevestigd in PR #7** |
| VoiceOver/screenreader | Open |
| Live theme switching | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende fysieke validatie — nu uitvoeren
Gebruik current `main`. De vergrote tekststand mag blijven staan.

Maak bij voorkeur één korte screen recording waarin vooral de **linkerzijde van de tijdas** zichtbaar is:
1. Teevee opent normaal.
2. Scroll horizontaal langzaam over meerdere halfuur-ticks. Een label dat links uit beeld schuift moet als geheel verdwijnen; er mag geen los `:30`, uurfragment of halve tijd zichtbaar blijven.
3. Herhaal met duidelijke momentum na loslaten; hetzelfde gedrag moet tijdens uitrollen gelden.
4. De verticale tick blijft op zijn echte tijdpositie; er mag geen sprong of verschuiving van de tijdlijn optreden.
5. Programmablokken blijven op hun echte positie/breedte en de al geaccepteerde PR #9 partial-left programmatitel blijft tijdens drag/momentum natuurlijk volgen.

Already accepted `Vandaag/Morgen/Nu` en detailgedrag hoeven niet opnieuw getest te worden tenzij spontaan een regressie opvalt.

## Samenvatting
**De 11:35-screenrecording accepteert PR #9 fysiek: de partial-left programmatitel blijft synchroon tijdens drag/momentum en een oude edge bedekt geen opvolgend programma. PR #10 is daarna als geïsoleerde UI-thread time-axislabelcorrectie technisch volledig groen en op main geïntegreerd; alleen de gerichte iPhone-validatie van die labelcorrectie staat nog open.**
