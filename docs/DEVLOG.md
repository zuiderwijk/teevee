# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

---

## 13 september 2026, 13:17 CEST — PR #10 fysiek afgewezen; PR #11 single-mask rebuild geïntegreerd

### Toestelbewijs
De product owner leverde `ScreenRecording_09-13-2026 13-09-16_1.MP4`. De opname is frame-voor-frame beoordeeld.

PR #10 faalt de fysieke gate op twee punten:
- rond **8,7 s** blijft links in de tijdas alleen `30` van een verder afgeknipt tijdlabel zichtbaar; exact het soort fragment dat de fix moest voorkomen;
- tijdens snelle horizontale beweging verdwijnen meerdere programmatitels tijdelijk terwijl de blokken zelf zichtbaar blijven, waarna de titels pas na settle terugkomen. Dat botst met de fysiek geaccepteerde PR #9-eis dat partial-left titels tijdens drag/momentum bruikbaar blijven.

De programmablokken zelf blijven in de opname wel visueel stabiel qua positie en breedte. Er is dus geen regressiebewijs tegen de bevroren native scrollphysics of programme geometry.

Conclusie: **PR #10 is fysiek afgewezen**. De per-tick Reanimated-opacityarchitectuur mag niet terugkomen. Dat de extra animated tijdlabels de PR #9 live-titlebeschikbaarheid onder druk zetten is aannemelijk, maar nog een hypothese en geen bewezen native root cause.

### PR #11 — nieuwe architectuur
PR #11 vervangt alleen de afgewezen tijdaslaag:
- alle halfuur-ticks en hun teksten zijn weer statische/native ScrollView-content;
- geen Reanimated style meer per tijdlabel;
- één kleine `TimeAxisLeftMask` staat vast aan de linker tijdasrand;
- op de UI-thread wordt alleen de breedte van dit masker aangepast aan het zichtbare restant van het ene label dat gedeeltelijk uit beeld is;
- zodra dat label volledig verdwenen is, wordt de maskerbreedte nul;
- de volgende halfuurtick ligt met de bestaande layout buiten het masker;
- de bestaande PR #9 `scrollX` shared value wordt hergebruikt;
- programme `left`/`width`, inertia, bounce, directional lock, PR #9 edge overlay, controls en detailinteracties zijn niet gewijzigd.

Gerichte pure tests dekken eerste en volgende labels, exacte boundaries, negatieve iOS-bounce en larger-text metrics.

### CI en integratie
PR-head **`8cba485c4c24bbf5160c652a13aba685c5520b3e`** passeerde **PR CI #145 / `34754026981`** volledig: installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

PR #11 is daarna succesvol gesquasht naar main als **`9ed7113bc114911218107263b6df224940d5dd09`**.

### Volgende stap
Current `main` op dezelfde iPhone binnenhalen en één korte screen recording maken met langzaam horizontaal scrollen én een duidelijke fling. Te bevestigen: geen enkel half tijdlabel links, tijdticks blijven stabiel, programmablokken blijven geometrisch gelijk en de bevroren PR #9 partial-left programmatitels blijven tijdens drag/momentum zichtbaar/coherent.

---

## 13 september 2026, 11:58 CEST — PR #9 fysiek geaccepteerd; PR #10 time-axisfix geïntegreerd

### Product-/gebruikerseffect
De 11:35-iPhone-screenrecording bevestigt dat de PR #9 partial-left programmatitel nu tijdens drag én momentum synchroon blijft met de native tijdlijn. Een oude edge verdwijnt bij het echte programma-einde en bedekt geen opvolgend programma. Programmablokken blijven visueel stabiel en het horizontale scrollgevoel blijft overeenkomen met de eerder geaccepteerde baseline.

Daarmee is PR #9 **fysiek geaccepteerd en bevroren**. Scrollinertie, bounce/directional lock, programme left/width en de PR #9 UI-thread synchronisatie worden niet meer aangepast zonder concreet regressiebewijs.

Dezelfde opname liet nog één los readabilitypunt zien: time-axis tekst kan links als gedeeltelijk `:30`/uurfragment zichtbaar blijven. Dat is nu geïsoleerd aangepakt in PR #10 zonder de tijdlijn of programmageometrie te verschuiven.

### PR #10 implementatie
De ticklijn blijft exact op zijn echte tijdpositie. Alleen de labeltekst krijgt een kleine Reanimated opacity-style die de bestaande PR #9 `scrollX` shared value volgt. Zodra het tekstbegin de linker viewportgrens passeert, verdwijnt het label als geheel. Er is geen React-state-per-scroll-frame toegevoegd en er zijn geen programmablokken geanimeerd.

Gerichte tests dekken de exacte left-edge boundary en negatieve iOS-bounce. De 48-zender Guide/detail-integratietest is alleen testtechnisch uitgebreid zodat de Reanimated-mock ook `Animated.Text` aanbiedt.

### CI en integratie
- PR CI #139 / `34750401708`: installatie, strict TypeScript, lint en de nieuwe time-axis tests waren groen; de Guide-integratietest faalde uitsluitend omdat de testmock `Animated.Text` niet kende. Expo export werd daarom overgeslagen.
- Na de gerichte mockcorrectie passeerde final implementation head **`efeedc08d3a6c50f3ef3fc9f119e8da5e3860b2b`** PR CI #140 / **`34750478071`** volledig: installatie, strict TypeScript, lint, **75 tests** en iOS/Android/web Expo exports.
- De GitHub merge-call time-outte aan connectorzijde, maar de squash-write zelf is aantoonbaar op main geland als **`b18e0b0e153f17b417dd13dd4a3ff02a45157b45`**. De achtergebleven open PR-status is administratieve metadata en wordt apart opgeruimd; de code staat op main.

### Volgende stap
Current `main` op dezelfde iPhone binnenhalen en één korte opname maken die vooral de linker tijdas toont: normaal starten, langzaam horizontaal scrollen en daarna met momentum. Een uit beeld schuivend tijdlabel moet als geheel verdwijnen, de tick/tijdlijn mag niet springen, programmablokken moeten stabiel blijven en de bevroren PR #9 titelreadability moet ongewijzigd natuurlijk blijven.

---

## 13 september 2026, 11:45 CEST — Visual/UX baseline gesynchroniseerd met GitHub-docs

### Product-/gebruikerseffect
De aparte visual-designthread heeft de Guide en Programme Detail voldoende uitgewerkt om de gekozen richting expliciet als **accepted UX/visual baseline** vast te leggen. Dit voorkomt dat vervolgdevelopment terugvalt op oudere open vragen of op Visual Direction 01 alsof die nog de actuele specificatie is.

Vastgelegd zijn onder meer:
- premium utility, weinig chrome, open gids-canvas, kanaallogo primair en bijna-witte/donker-antraciete thema-richting;
- Söhne als voorkeursrichting voor typografie, onder voorbehoud van productie-licentie/technische levering;
- Totaal als horizontale tijd/verticale zenderweergave met terughoudende tijdmarkering en zonder lage-waarde celmetadata;
- Per zender met sticky horizontale zenderlogobalk, verticale daglijst, horizontale swipe naar vorige/volgende zender en contextual `Primetime`/`Nu`;
- Nu & Straks als today-only gedeelde tijdreferentie met programma op dat moment plus **drie volgende programma's** per zender; geen progressbars, genres, artwork, chevrons of herhaalde `Daarna`-labels;
- Programme Detail opent direct vanuit de gids, met alleen `Herinner mij` en `Bewaar` als fase-acties; wanneer die acties buiten beeld scrollen verschijnt contextueel een compacte sticky bottom copy voor bereikbaarheid met één hand;
- grotere systeemtekst mag de dichtheid verminderen en acties laten reflowen in plaats van content af te knijpen.

Vanavond/Tonight heeft wel een sterke voorlopige richting gekregen, maar de exacte modulesamenstelling is bewust nog niet bevroren.

### Documentatie
Bijgewerkt op main:
- `docs/UX.md` — commit **`c0f30a1354fe59a7ce783b1bb90e3600d41c04a1`**;
- `docs/DESIGN_SYSTEM.md` — **`5de5eee993fabf14e19a10f246622f4af0ea8514`**;
- `docs/PRODUCT.md` — **`af6208e5be94f308a4905bcf111ec349845b3019`**;
- `docs/BUILD_SPEC.md` — **`8cd40d59614b88853d24f7e850911e3bf4bebee4`**;
- `docs/PROJECT_STATE.md` — **`5298175e02a072102cc4332c89b8c8b265ed287b`**.

Dit zijn documentatie-updates. Er is geen runtime-code gewijzigd en er wordt geen CI- of toestelacceptatie geclaimd voor de nog niet geïmplementeerde visuals/views.

### Volgende stap
De **bestaande Phase 1 EXACT NEXT STEP blijft ongewijzigd**: PR #9 fysiek valideren op dezelfde iPhone met één korte opname van startup, horizontale drag/momentum, edge-title synchronisatie, programme-boundarygedrag en ongewijzigd scrollgevoel. Pas daarna de afzonderlijke left-edge time-axis clipping aanpakken.

---

## 13 september 2026, 11:19 CEST — PR #9 geïntegreerd; nieuwe iPhone-gate klaar

### Technische afronding
Na de 10:49-screenrecording is de PR #8 React-state overlay fysiek afgewezen en vervangen door PR #9 met UI-thread-gesynchroniseerde edge-geometrie.

De eerste PR #9 implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`** passeerde CI #125 volledig. Na het vastleggen van PROJECT_STATE, DEVICE_TEST_REPORT en DEVLOG passeerde ook de definitieve PR-head **`8a37cef550e0558a03d0876a356e295ff4ac424b`** **PR CI #128 / `34749068020`** volledig: installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

De standaard GitHub merge-call gaf tweemaal een upstream 502 zonder de PR te wijzigen. Omdat main nog exact op de PR-base stond en de definitieve PR-head groen was, is main vervolgens non-force fast-forward naar **`8a37cef550e0558a03d0876a356e295ff4ac424b`** gezet. GitHub markeert PR #9 sindsdien als **merged**. De exacte main-SHA passeerde daarna **main CI #129 / `34749225666`** volledig.

### Fysieke status
Dit is nog geen toestelacceptatie. Zowel PR #6 als PR #8 hebben eerder aangetoond dat een volledig groene CI native/runtimeproblemen kan missen.

### Volgende stap
Op dezelfde iPhone current main binnenhalen en één korte screen recording maken waarin normale startup plus horizontale drag en momentum zichtbaar zijn. Te beoordelen: titel volgt de linker rand zonder lag, een oude edge stopt uiterlijk op zijn echte programma-einde en bedekt nooit de volgende uitzending, blokgeometrie blijft stabiel en scrollgevoel blijft natuurlijk.

---

## 13 september 2026, 11:08 CEST — PR #8 fysiek afgewezen; PR #9 rebuilt met UI-thread synchronisatie

### Toestelbewijs uit screen recording
De product owner leverde een iPhone-screenrecording van PR #8. Daarin is zichtbaar dat de live partial-left titel wel verschijnt tijdens horizontale beweging, maar niet synchroon blijft met de native ScrollView.

Tijdens drag en vooral momentum kan de React-state overlay achterlopen. Een oude programmanaam blijft dan tijdelijk als opaque edge-laag staan terwijl de onderliggende tijdlijn al bij volgende programma's is, waardoor delen van opvolgende titels en tijden worden bedekt. De onderliggende programmablokken lijken zelf stabiel te blijven en de native horizontale scroll oogt vloeiend.

De opname begint nadat Teevee al open staat. Daardoor levert deze opname geen zelfstandig bewijs voor cold-startstabiliteit, al crasht de app gedurende de opname niet.

Conclusie: **PR #8 is fysiek afgewezen**, ondanks volledig groene PR- en main-CI. De PR-titel/body zijn aangepast zodat de repositorygeschiedenis deze status expliciet weergeeft.

### PR #9 — nieuwe synchronisatie-aanpak
De edge-readability is opnieuw gebouwd in PR #9, nu met een andere verantwoordelijkheidsscheiding:
- horizontale en verticale ScrollViews schrijven hun actuele positie naar UI-thread shared values;
- edge-breedte, zichtbaarheid, verticale verplaatsing en de herhaalde current-time line volgen die waarden direct op de UI-thread;
- React wisselt alleen de edge-programmanaam wanneer een programmastart/eindegrens wordt gepasseerd;
- als die inhoudswissel op JavaScript zou vertragen, stopt de oude edge op de UI-thread exact buiten zijn eigen programmaframe met tekenen en kan hij dus geen volgende uitzending afdekken;
- de live animatielaag bestaat uit maximaal 48 kleine edge-rijen in plaats van animated styles op de volledige >1000-cell Guide zoals in de crashgevoelige PR #6-aanpak;
- tijdens beweging toont de edge alleen de titel; na settle blijft PR #5 de uitgebreidere titel/tijd-readability afhandelen;
- programmastart/duur, inertia, bounce, directional lock, Vandaag/Morgen/Nu en detailinteracties zijn niet bewust gewijzigd.

Nieuwe pure tests dekken programmaboundaries en exacte switching-semantiek. De bestaande 48-zender Guide/detail-integratietest blijft actief met aangepaste Reanimated/workletmocks.

### Technische verificatie op dit moment
PR #9 implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`** passeerde **CI #125 / `34748926153`** volledig. De finale integratie staat in de entry hierboven.

### Apart open punt
De recording toont ook opnieuw een gedeeltelijk afgesneden tijdaslabel wanneer een tick precies aan de linker viewportgrens ligt. Dit is separaat van de stale-overlayfout en wordt pas aangepakt nadat PR #9 fysiek is beoordeeld.

---

## 13 september 2026, 10:35 CEST — PR #8: live partial-left titelbeweging herbouwd zonder per-programme worklets

### Wat verandert voor de gebruiker
De nog openstaande 09:20-eis — een programmanaam moet al **tijdens horizontaal draggen en momentum** leesbaar blijven wanneer de echte programmastart achter de vaste zenderrail verdwijnt — is opnieuw geïmplementeerd.

De programmablokken zelf blijven volledig tijdgetrouw: hun echte startpositie en duur-gebaseerde breedte veranderen niet. Alleen een kleine visuele laag aan de linker rand toont de titel opnieuw in het zichtbare restant.

### Architectuur
De crashgevoelige PR #6-aanpak is niet hergebruikt. PR #8 gebruikt één geïsoleerde `EdgeReadabilityOverlay` boven de programmeviewport:
- scrollposities worden via een kleine imperative ref aan de overlay doorgegeven;
- meerdere scroll-events worden maximaal één keer per animation frame tot overlay-state verwerkt;
- alleen zichtbare zenders plus één overscanrij worden voor edge-content bekeken;
- de zware 48-zender Guide-tree blijft buiten deze frame-update;
- geen nieuwe Reanimated/workletstyles per programma;
- PR #5-settled readability blijft als onderliggende fallback;
- de overlay is pointer-transparent en uit de accessibility-traversal gehaald; echte programmebuttons behouden hun volledige labels;
- de current-time line wordt boven de overlay herhaald zodat een edge-mask hem niet kan afdekken.

### Tests en CI
Nieuwe pure tests dekken het programma dat de linker viewportgrens kruist, de werkelijk resterende zichtbare breedte en de visible-row windowing/clamping. De bestaande Guide-integratietests mounten daarnaast de volledige 48-zender Guide inclusief de overlay.

De eerste PR-run **CI #119 / `34747757890`** stopte bij strict TypeScript omdat de huidige React Native-typing `StyleSheet.absoluteFillObject` niet exposeert. Dit is opgelost met expliciete absolute bounds; er is geen quality gate uitgezet.

Final PR-head **`35282fffc558115f60eded7534c4eb03266cf4f7`** passeerde **CI #120 / `34747825150`** volledig: installatie, typecheck, lint, tests en iOS/Android/web Expo exports.

PR #8 is gesquasht naar main als **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`**. De exacte merge passeerde ook **main-CI #121 / `34747935259`** volledig met dezelfde gates.

### Latere fysieke uitkomst
Zie de 11:08-entry: de 10:49-screenrecording toonde runtime-desynchronisatie tussen native scroll en React-overlay. PR #8 is daardoor alsnog fysiek afgewezen.

---

## 13 september 2026, 10:20 CEST — PR #7 volledig fysiek geaccepteerd

### Toestelbewijs
Op dezelfde iPhone en dezelfde vergrote systeemtekst bevestigde de product owner alle vier de gerichte PR #7-punten:
1. Teevee opent normaal;
2. `Vandaag`, `Morgen` en `Nu` blijven op één horizontale regel;
3. Morgen/Vandaag reageren direct met de juiste zwarte selected-state en `Nu` keert terug naar de actuele tijd;
4. horizontaal scrollen voelt nog hetzelfde/natuurlijk als de eerder geaccepteerde baseline.

Daarmee is de veilige non-Reanimated controlherimplementatie volledig fysiek geaccepteerd. De PR #6-startcrash is niet teruggekeerd en de scrollbaseline is niet verslechterd.

---

## 13 september 2026, 09:56 CEST — PR #6 veroorzaakt iPhone-startcrash; main teruggezet naar runnable Guide

Na de PR #6-versie meldde de product owner een wit scherm gevolgd door een Expo Go-crash. PR #6 had per-programme Reanimated animated styles over de realistische 48-zenderfixture geïntroduceerd. Dat is een sterke kandidaat voor de regressie, maar zonder native foutlog niet bewezen.

Main is teruggezet naar PR #5 met **`f7c9f73568341d29e518be21e0de071e4ef7877d`**. De product owner bevestigde daarna normale startup. De drie 09:20-producteisen bleven geldig; twee zijn later veilig opgelost in PR #7, de derde wordt via PR #9 opnieuw aangepakt.

---

## 13 september 2026, 09:12 CEST — PR #5: geometry-safe partial-left readability

Voor programmablokken waarvan de echte start links achter de vaste zenderrail ligt, kan de innerlijke titel/tijd na drag/momentum naar het zichtbare restant verschuiven zonder startpositie, duur of blokbreedte te vervalsen. Te krappe starttijdlabels worden verborgen in plaats van fragmentarisch getoond. De iPhone-test bevestigde dat dit pas na settle gebeurde; continue beweging bleef open.

---

## 13 september 2026, 09:01 CEST — Grote-tekstcorrectie fysiek geaccepteerd

Op dezelfde iPhone en duidelijk vergrote systeemtekst bleven `Gids`, `Nu`, daglabels en tijdas volledig leesbaar na PR #4. Zenderrail/programmarijen bleven uitgelijnd en programmadetail plus `Sluiten` bleven bereikbaar.

---

## 13 september 2026, 08:40 CEST — Dynamic Type en logo-ready kanaalidentiteit

Totaal kreeg schaalbare rij-, zender- en tijdasgeometrie. Bij grotere tekst krijgt programmatitel voorrang boven secundaire metadata. Kanaalidentiteit is technisch voorbereid op **logo primair, naam secundair**, met volledige accessibility-naam en tekstfallback.

---

## 13 september 2026, 08:05 CEST — Drie Guide-presentaties vastgelegd

PRODUCT/UX leggen vast:
- **Totaal** = 2D-grid;
- **Per zender** = verticale dagplanning van één zender;
- **Nu & Straks** = compacte all-channel lijst op één gedeeld referentietijdstip vandaag, zonder datumselector, met tijdselector en `Nu` voor live/current mode.

---

## 13 september 2026, 07:46 CEST — Swipe-down detail fysiek geaccepteerd

De product owner beoordeelde detailrespons en swipe-down dismissal als **"perfect"**. Button-close en outside-tap close blijven eveneens geaccepteerde routes.

---

## 13 september 2026, 07:04 CEST — Scrollbaseline fysiek geaccepteerd

Standaard platforminertie, native bounce/directional lock, doorlopende tijdlijn, dagovergang en geanimeerde `Nu` zijn op iPhone kwalitatief als **"perfect"** beoordeeld. Niet retunen zonder concreet regressiesignaal.

---

## 11 september 2026 — Phase 1 bootstrap

Projectfoundation, deterministische EPG-fixture, Expo/React Native strict TypeScript, eerste 2D Guide, detailmodal, current-time/progress, runtime-aligned Amsterdamse fixture, CI en device-workflow zijn opgebouwd. De fixture is later uitgebreid naar 48 synthetische zenders.

---

## Doorlopende open technische punten
- PR #11 single-mask time-axiscorrectie staat op main en is technisch groen; één gerichte iPhone-validatie staat nog open.
- Android gesture/back en release-achtige performance zijn nog niet fysiek gevalideerd.
- VoiceOver/screenreader, live theme switching en expliciete current-time/progress-validatie staan open.
- Finite fixture lifecycle rond resume na middernacht/expiry staat open.
- CI genereert nog een lockfile vóór `npm ci`; 15 moderate advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall, exacte productietokens/fontlicentie en de definitieve Vanavond/Tonight-modules liggen buiten deze directe Phase 1-stabiliteitsstap.
