# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

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
- PR #9 native-synced edge readability is geïntegreerd en technisch groen, maar wacht op fysieke iPhone-validatie.
- Het linker time-axis ticklabel kan gedeeltelijk worden afgeknipt; separaat readability-punt.
- Android gesture/back en release-achtige performance zijn nog niet fysiek gevalideerd.
- VoiceOver/screenreader, live theme switching en expliciete current-time/progress-validatie staan open.
- Finite fixture lifecycle rond resume na middernacht/expiry staat open.
- CI genereert nog een lockfile vóór `npm ci`; 15 moderate advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall en final visual design liggen buiten deze directe Phase 1-stabiliteitsstap.
