# Teevee Development Logboek

Doel: een begrijpelijk en leesbaar overzicht van wat de autonome development-agent heeft gewijzigd, waarom dat is gedaan, wat daadwerkelijk is gecontroleerd en wat de volgende stap is.

Dit document is bedoeld voor product- en engineeringstakeholders, niet alleen voor developers. Het vult `docs/PROJECT_STATE.md` aan: `PROJECT_STATE.md` beschrijft de canonieke actuele stand van het project; dit logboek beschrijft de geschiedenis van de ontwikkeling.

## Logboekregels
- Voeg voor iedere substantiële development-increment één nieuwe logboekvermelding toe.
- Plaats de nieuwste vermeldingen bovenaan.
- Noteer altijd datum én tijd in **Europe/Amsterdam**.
- Schrijf eerst in gewone taal wat er voor product of gebruiker is veranderd; geef daarna technische details.
- Meld alleen dat build, tests of CI zijn geslaagd wanneer dat aantoonbaar zo is.
- Benoem fouten en blokkades expliciet.
- Sluit iedere vermelding af met de eerstvolgende geplande development-increment.

> Historische vermeldingen zijn op 13 september compacter gemaakt om dit logboek scanbaar te houden. De chronologie, acceptatiestatussen, bekende fouten en verificatieclaims zijn behouden; `PROJECT_STATE.md` blijft de hogere bron van waarheid.

---

## 13 september 2026, 08:40 CEST — Totaal aangepast voor grotere systeemtekst

### Wat is veranderd
De eerste accessibility/layout-increment is gebouwd, via PR #3 gecontroleerd en geïntegreerd op main. Totaal leest nu de systeem-fontscale en laat de vaste gidsgeometrie meegroeien: rijen worden hoger, de zenderrail wordt breder en de tijdas krijgt meer hoogte. Bij grotere tekst krijgt de programmatitel voorrang boven secundaire metadata in het blok.

De zenderweergave is tegelijk voorbereid op de gekozen richting **logo primair, naam secundair**. Wanneer later een geschikt `logoUrl` beschikbaar is, kan het logo worden getoond met de zendernaam subtiel eronder en de volledige naam als accessibility label. Zonder logo of bij een mislukte afbeelding blijft een tekstfallback staan. De synthetische fixture bevat bewust nog geen echte zenderlogo's.

De eerdere screenshotbevinding waarbij lange namen midden in een woord braken wordt hierdoor structureel vermeden: de naam blijft één regel en ellipst zo nodig. `Nu` en de dagknoppen hebben minimaal 44 logische punten touchhoogte.

### Waarom
De product owner heeft expliciet aangegeven dat systeemtekst boven 100% geen randgeval mag zijn. Voor een gids is het daarom beter om bij grotere tekst wat dichtheid in te leveren dan essentiële titels af te knippen of font scaling uit te schakelen. Logoherkenning mag bovendien niet worden verondersteld voor iedere zender.

### Technische details
- Nieuwe pure `guideLayoutForFontScale()` met onbegrensde groei voor accessibility-sized font scales.
- Default fontscale houdt de eerder geaccepteerde geometrie intact.
- Unit tests voor 1.0, 1.5, 2.5 en ongeldige font scales.
- `Channel.logoUrl` toegevoegd als optioneel domeinveld; geen provider- of productieafhankelijkheid.
- Nieuwe `ChannelIdentity` met logo-errorfallback en toegankelijkheidslabel.
- Bestaande React-integratiemock uitgebreid met `useWindowDimensions` en `Image` zonder de detail/Guide render-isolatiechecks te verzwakken.
- Geen wijziging aan `decelerationRate`, bounce, continuous timeline, `Nu`, modal slide of swipe-dismiss-drempels.

### Verificatie
Exacte PR-head `4c67e6cfc369e0b0f54c93ecd26bfc457336f631` heeft **CI #69 succesvol afgerond**: installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports. PR #3 is daarna gesquasht naar main als **`da61b3cf10f8bf79e552f2b3eacdb289439810ce`**. **Main CI #70, run `34743172096`, is eveneens geslaagd** met dezelfde gates.

Dit is nog geen toestelbewijs voor grotere tekst. ProgrammeDetail heeft bovendien nog geen interne ScrollView; bereikbaarheid moet eerst op de iPhone worden getest voordat daar een nieuwe gesture/layoutwijziging voor wordt gemaakt.

### Volgende stap
Dezelfde iPhone bij een duidelijk grotere systeemtekst gebruiken om Totaal-alignment, tekstclipping en bereikbaarheid van een programmadetail inclusief `Sluiten` te controleren. Alleen concrete regressies oplossen; de geaccepteerde scroll- en dismissalbaseline niet opnieuw afstellen.

---

## 13 september 2026, 08:23 CEST — Logo-eerst en Dynamic Type als producteis vastgelegd

De product owner kiest als richting: zenderlogo primair, zendernaam kleiner/secundair, maar niet logo-only. De volledige naam blijft beschikbaar omdat niet ieder zenderlogo vanzelfsprekend herkenbaar is. Bij ontbrekende of niet-gelicentieerde logo's moet de UI netjes terugvallen op tekst.

Grotere systeemtekst is expliciet onderdeel van de productkwaliteit. Totaal mag bij hogere fontscale minder compact worden: hogere rijen, meer ruimte en het weglaten van secundaire metadata zijn toegestaan. Essentiële informatie mag niet worden gered door scaling uit te zetten. Programme detail moet volledig bereikbaar blijven.

Deze eisen zijn vastgelegd in UX/design/projectdocumentatie. CI #65 en #66 voor die documentatie-increments zijn geslaagd. De aanname dat lineaire tv relatief veel oudere kijkers heeft is motivatie/hypothese en niet als bewezen onderzoeksfeit vastgelegd.

### Volgende stap
De eisen vertalen naar een kleine, testbare Totaal-increment zonder geaccepteerde scroll- of detailinteractie te wijzigen.

---

## 13 september 2026, 08:11 CEST — Dark-modebeelden beoordeeld

De reeds aangeleverde Teevee-screenshots van de gids en geopende details zijn als device-evidence vastgelegd. Donkere modus vormt visueel een bruikbare basis, maar lange synthetische zendernamen braken midden in woorden en gedeeltelijk uit beeld geschoven programmablokken verloren hun begintekst/tijd achter de vaste zenderkolom. Het detailhandvat was subtiel. Het gedimde gidsbeeld achter de modal is niet gebruikt om normaal gidscontrast te beoordelen.

Het bestaande TVgids.nl Nu & Straks-beeld blijft alleen een interaction reference. Geen algemene accessibility-acceptatie is uit screenshots afgeleid. Documentatiecommit `9099ec...` had groene CI #64.

### Volgende stap
Gerichte leesbaarheidscorrecties uitvoeren en grotere systeemtekst op een echt toestel valideren.

---

## 13 september 2026, 08:05 CEST — Nu & Straks: tijd kiezen binnen vandaag, geen datumkeuze

De drie Guide-presentaties zijn productmatig vastgelegd: **Totaal**, **Per zender** en **Nu & Straks**. Alleen Totaal is nu gebouwd.

Nu & Straks krijgt geen datumselector. Een horizontale tijdselector beweegt binnen vandaag en laat alle zenders op hetzelfde referentietijdstip zien. In live mode volgt de view de actuele tijd; na handmatig kiezen blijft de tijd gepind en `Nu` keert terug naar live. Een past/future snapshot mag niet als live worden gepresenteerd. Intervalgrens is `startAt <= referenceTime < endAt`; gaten worden eerlijk getoond. Kanaalvolgorde en verticale positie blijven stabiel. Amsterdamse kalenderdaggrenzen zijn leidend.

Eén Guide-bestemming met een lokaal onthouden voorkeursweergave is het werkvoorstel. Eerste default, selectorplaatsing en één versus twee volgende programma's blijven open. Het TVgids.nl-voorbeeld is geen visueel ontwerpmandaat.

### Verificatie
Alleen product/UX/statusdocumentatie gewijzigd; geen runtimecode. CI #63 voor deze documentatiecommit is later als succesvol gecontroleerd.

### Volgende stap
Eerst de nog open Phase 1-leesbaarheids-/accessibilitygate afronden; daarna Per zender en Nu & Straks expliciet in een volgende buildspec plannen.

---

## 13 september 2026, 07:46 CEST — Swipe-down dismissal kwalitatief akkoord

Na de gerichte iPhone-hertest antwoordt de product owner **"perfect"** op de gevraagde wijzigingenset: neerwaarts sluiten, korte trek/terugveren, heropenen en behoud van bestaande sluitroutes. Dit is kwalitatief akkoord op de set, niet een afzonderlijke meting van ieder gesture-randgeval.

Swipe PR #2 was geïntegreerd als `1242f7d64f8abc594f11f043459e07893a25e5b6`; main CI #61 was groen. Dark mode, grotere tekst, screenreader, Android en productieperformance vielen niet onder dit akkoord.

### Volgende stap
Leesbaarheid en toegankelijkheid valideren zonder de geaccepteerde dismissal opnieuw te tunen.

---

## 13 september 2026, 07:36 CEST — Programmadetails naar beneden wegvegen

Na akkoord op de snellere detailrespons is swipe-down dismissal toegevoegd met bestaande Gesture Handler 2, Reanimated 4 en Worklets. Het paneel volgt de vinger; een korte/cancelled drag veert terug en voldoende neerwaartse afstand of velocity sluit. Upward reversal, multitouch en cancellation sluiten volgens implementatie/tests niet.

Button, backdrop, accessibility escape en Android back blijven alternatieven. De native Modal slide blijft de exit-animatie en de verplaatste sheet springt bij committed dismissal niet eerst terug naar boven. Een aparte gesture root in de modal ondersteunt Android-modalcontext.

Eerste CI #57 faalde op strict TypeScript callbacktypes in de nieuwe testmock. De types zijn aangescherpt zonder checks uit te zetten; CI #58 slaagde. Later werd bundlecontrole uitgebreid naar iOS/Android/web; PR-CI #60 slaagde vóór merge.

Belangrijke grens: de detailbody was en is geen interne ScrollView. Als lange tekst later scrollbaar wordt, moet reading-scroll met dismissal worden gecoördineerd.

### Volgende stap
Native iPhone-hertest van swipe change set en vervolgens overige accessibilitychecks.

---

## 13 september 2026, 07:18 CEST — Detailweergave losgemaakt van zware gidsrender

De eerdere toesteltest bevestigde openen/sluiten en positiebehoud, maar beide voelden traag. Detailselectie is daarom buiten de zware memoized Guide gezet. Stabiele callbacks voorkomen dat openen/sluiten de 48-zendergrid opnieuw opbouwt. De geselecteerde tekst blijft tijdens native dismissal staan en Pressables houden visuele feedback.

PR #1 had eerst install failure CI #52 doordat React DOM-types te ruim naar 19.3 konden resolven; versiegrens is naar 19.2 begrensd zonder force-upgrade. PR-CI #53 en latere main-CI #56 slaagden. De product owner reageerde daarna **"perfect"** en bevestigde sluiting via knop en achtergrond.

### Volgende stap
Swipe-down dismissal als aanvullende sluitroute toevoegen zonder scrollbaseline te wijzigen.

---

## 13 september 2026, 07:04 CEST — iPhone-scrollhertest akkoord

Na hertest van standaardinertie, doorlopende tijdlijn, dagovergang en geanimeerde `Nu` antwoordde de product owner **"perfect"**. Dit wordt de scrollbaseline: geen nieuwe tuning zonder concreet probleem.

De onderliggende code had CI #49 en documentatie-opvolger CI #50. Geen exacte framerate of swipeafstand gemeten.

### Volgende stap
Programmadetail en leesbaarheid valideren.

---

## 13 september 2026, 06:58 CEST — Normale platforminertie en doorlopende gids

Ook verticaal is de gids teruggezet naar `decelerationRate="normal"`; horizontaal stond al op normal. Native bounce en directional lock blijven. De 48-zenderfixture beslaat 49 uur vanaf Amsterdamse dagstart. `Nu` beweegt geanimeerd binnen één gemounte tijdlijn en dagstatus volgt de horizontale positie.

Tests zijn uitgebreid voor daggrenzen, jaarwisseling en 23/25-uursdagen. Een eerdere CI #48 faalde omdat een test nog het oude relatieve tijdvenster verwachtte; de test is inhoudelijk aangepast en timezonegedrag gecorrigeerd. **CI #49 slaagde.**

### Volgende stap
Op dezelfde iPhone langere swipes, dagovergang en `Nu` hertesten.

---

## 13 september 2026, 06:28 CEST — 48 zenders voor realistische verticale scrolltest

De synthetische fixture is van 16 naar 48 zenders uitgebreid zodat verticale inertie niet tegen een te korte lijst wordt beoordeeld. Programme-generator en edge cases bleven intact; geen nieuwe virtualisatie of scrollbibliotheek toegevoegd. CI was groen.

### Volgende stap
Op het toestel lange verticale swipes beoordelen voordat er opnieuw aan scrollparameters wordt gesleuteld.

---

## 11 september 2026, 19:46 CEST — Eerste device-feedback verwerkt

Op de eerste iPhone-test ging de horizontale tijdpositie bij dagwissel verloren, beide scrollassen voelden te gelijk en randen stopten onnatuurlijk hard. Tijdpositie werd bewaard, horizontaal kreeg `normal`, verticaal aanvankelijk `fast`, en native bounce/directional lock werden aangezet. Deze verticale `fast`-keuze is later na realistischer testing vervangen door de huidige `normal`-baseline.

### Volgende stap
Hertesten op toestel en alleen op basis van observaties verder tunen.

---

## 11 september 2026, 19:16 CEST — Runtime-fixture tijdrelatief en toesteltestpad vereenvoudigd

De deterministische bronfixture blijft reproduceerbaar, maar `buildRuntimeGuideFixture()` verschuift timestamps éénmalig rond het appstartmoment. Daardoor werken `Nu`, progress en daglabels ook na de oorspronkelijke fixturedatum. `npm run start:device`, `npm run start:clean` en `DEVICE_TEST_REPORT.md` zijn toegevoegd.

De eerste implementatie faalde terecht op React purity/refs-lint; lazy state initialization verving de problematische constructie in plaats van lint uit te zetten.

### Volgende stap
CI groen krijgen en eerste fysieke Phase 1-test uitvoeren.

---

## 11 september 2026, 19:05 CEST — Gids gebruikt echte actuele tijd

Een kleine Guide clock ververst iedere 30 seconden. Current-time-lijn, programme-progress en `Nu` gebruiken daarmee dezelfde live tijdbron in plaats van een vaste demo-klok. Geen nieuwe dependency toegevoegd.

### Volgende stap
CI afronden en de prototype geschikt maken voor devicevalidatie.

---

## 11 september 2026, 19:00 CEST — Programmadetail, progress en dagwissel

Programmablokken zijn aanklikbaar gemaakt; detail toont zender, tijd, titel en beschikbare beschrijving. Lopende programma's tonen progress. Vandaag/morgen en `Nu` zijn toegevoegd rond de bestaande fixture. Nog steeds geen externe EPG.

### Volgende stap
Guide technisch verfijnen en eerste devicebuild voorbereiden.

---

## 11 september 2026, 18:41 CEST — Eerste 2D-gidsviewport

De eerste echte Totaal-grid is gebouwd: vaste zenderkolom, horizontale tijdas, duration-based programme cells, gesynchroniseerde verticale scroll en current-time indicator. Pure geometryhelpers en tests zijn toegevoegd.

Tijdens CI-stabilisatie zijn dependencyproblemen en een TypeScript 6-configuratiefout rond verouderde `baseUrl` opgelost; latere runs werden groen.

### Volgende stap
Gidsinteractie, programmaselectie en performance verfijnen.

---

## 11 september 2026, 18:40 CEST — Expo/React Native-basis

Expo/React Native/Expo Router, strict TypeScript, semantische light/dark theming, lint en GitHub Actions CI zijn opgezet. Eerste dependencyconflicten binnen de Expo SDK 57-stack zijn opgelost door versies uit te lijnen in plaats van force-installatie.

### Volgende stap
De echte 2D-gidsinteractie bouwen.

---

## 11 september 2026, 18:35 CEST — Deterministische gidsdatalaag

Teevee-eigen `Channel`, `Programme` en `GuideFixture` zijn toegevoegd met een development-only fixture, programmaduur/progresshelpers en edge cases voor korte/lange programma's, lange titels, ontbrekende metadata, live/herhaling en een schemagat. De fixture is later van 16 naar 48 zenders uitgebreid.

### Volgende stap
Schedule geometry en de eerste Guideviewport bouwen.

---

## 11 september 2026, 18:33 CEST — Project Foundation afgerond

`AGENTS.md`, PRODUCT, UX, ARCHITECTURE, DATA, DESIGN_SYSTEM, BUILD_SPEC, PROJECT_STATE en ADR 0001–0004 vormen de gedeelde basis voor autonome agents. Phase 0 is pas als compleet gemarkeerd nadat de canonieke status en beslissingen daadwerkelijk in de repository stonden.

### Volgende stap
Phase 1 starten: Guide-interactie bouwen en valideren met deterministische fixture-data.
