# Teevee Development Logboek

Doel: een begrijpelijk en leesbaar overzicht van wat de autonome development-agent heeft gewijzigd, waarom dat is gedaan, wat daadwerkelijk is gecontroleerd en wat de volgende stap is.

Dit document is bedoeld voor product- en engineeringstakeholders, niet alleen voor developers. Het vult `docs/PROJECT_STATE.md` aan: `PROJECT_STATE.md` beschrijft de canonieke actuele stand van het project; dit logboek beschrijft de geschiedenis van de ontwikkeling.

## Logboekregels
- Voeg voor iedere substantiële development-increment één nieuwe logboekvermelding toe.
- Plaats de nieuwste vermeldingen bovenaan.
- Noteer altijd **datum én tijd** waarop de wijziging is vastgelegd.
- Gebruik de lokale tijdzone **Europe/Amsterdam**.
- Schrijf eerst in gewone taal wat er voor product of gebruiker is veranderd; geef daarna pas technische details.
- Meld alleen dat build, tests of CI zijn geslaagd wanneer dat aantoonbaar zo is.
- Benoem fouten en blokkades expliciet, inclusief de status van de oplossing.
- Sluit iedere vermelding af met de eerstvolgende geplande development-increment.

---

## 11 september 2026, 19:05 CEST — Gids gebruikt nu de echte actuele tijd

### Wat is veranderd
De gids is niet langer gekoppeld aan een vast demo-tijdstip. De rode huidige-tijdlijn, de voortgang van het lopende programma en de `Nu`-actie worden nu gevoed door de echte klok van het toestel.

Daardoor gedraagt de Phase 1-prototype zich tijdens een fysieke test veel realistischer: de actuele positie schuift mee en voortgang verandert zonder dat de app opnieuw hoeft te worden gestart.

### Waarom
Een vaste demo-klok was nuttig om de eerste layout voorspelbaar te bouwen, maar is ongeschikt voor echte device-validatie. De `Nu`-ervaring is een kernonderdeel van het product en moet daarom voor de eerste mobiele test al realistisch werken.

### Technische details
- Een kleine `useGuideClock`-hook toegevoegd.
- De klok ververst elke 30 seconden; dat is frequent genoeg voor gidsprogressie zonder onnodige continue renders.
- De current-time-lijn en programma-progress gebruiken nu dezelfde live tijdbron.
- De `Nu`-actie gebruikt de actuele tijd en scrollt alleen naar een current-time positie wanneer die binnen het zichtbare fixture-venster valt.
- Geen nieuwe native of externe dependency toegevoegd.

### Verificatie
De voorgaande Phase 1-increments, inclusief narrow-programme rendering en het fysieke testpad, hebben inmiddels een groene GitHub Actions-run. De CI-run voor deze live-klokwijziging moet nog afronden voordat deze increment als volledig geverifieerd geldt.

### Volgende stap
CI van deze wijziging controleren en eventuele fouten autonoom oplossen. Daarna de Phase 1-gids geschikt maken voor een eerste daadwerkelijke fysieke toesteltest en de resultaten gebruiken om te beslissen of standaard React Native-scrollprimitives voldoende performant zijn.

---

## 11 september 2026, 19:00 CEST — Programmadetail, voortgang en dagwissel toegevoegd

### Wat is veranderd
De gids is nu voor het eerst echt interactief als productprototype. Een gebruiker kan op een programmablok tikken en krijgt een rustige detailweergave met zender, uitzendtijd, titel en beschikbare beschrijving. Lopende programma's tonen voortgang en de huidige-tijdlijn blijft zichtbaar op de relevante dag.

Ook is een minimale dagwissel toegevoegd tussen vandaag en de volgende dag. De `Nu`-actie brengt de gebruiker vanuit een andere dag terug naar vandaag en naar het actuele punt in de tijdlijn.

### Waarom
Na de eerste 2D-viewport moesten we valideren of de gids niet alleen technisch als raster werkt, maar ook als bruikbare mobiele interactie. Programma selecteren, begrijpen waar je in de tijd bent en eenvoudig naar een andere dag bewegen zijn daarvoor minimale voorwaarden.

### Technische details
- Programmablokken zijn nu aanklikbaar.
- Een eenvoudige bottom-sheet-achtige detailmodal toegevoegd zonder extra UI-dependency.
- Lopende programma's krijgen een voortgangsbalk op basis van de bestaande domeinhelper.
- Current-time-lijn wordt alleen getoond wanneer `Nu` binnen het gekozen tijdvenster valt.
- Dagselectie voor vandaag en morgen toegevoegd.
- `Nu` reset de dagselectie en scrollt terug naar het actuele punt.
- Nog steeds uitsluitend deterministische fixture-data; geen externe EPG-integratie.

### Verificatie
De eerdere repositorystand had een volledig groene CI. Latere CI-runs voor de daaropvolgende Phase 1-increments zijn eveneens groen geworden.

### Volgende stap
De Guide technisch aanscherpen voor realistische mobiele performance en de eerste testbare device-build voorbereiden, zonder scope uit latere fases naar voren te halen.

---

## 11 september 2026, 18:41 CEST — Eerste 2D-gidsviewport geïmplementeerd

### Wat is veranderd
De app heeft nu de eerste echte versie van het tv-gidsscherm in plaats van alleen een eenvoudige lijst. Programmablokken worden op een tijdas geplaatst, de breedte van een blok weerspiegelt de programmaduur, de zenderkolom staat los van de tijdlijn en horizontaal en verticaal scrollen worden op elkaar afgestemd.

Ook zijn een huidige-tijdindicator en een `Nu`-actie toegevoegd, zodat de gebruiker kan terugkeren naar het actuele punt in de programmering.

### Waarom
De tweedimensionale gids is de belangrijkste interactie van Teevee en tegelijk het grootste technische en UX-risico. Daarom wordt deze eerst gevalideerd voordat bredere productfeatures worden toegevoegd.

### Technische details
- Pure functies toegevoegd voor het omrekenen van tijd naar pixels op de gids-tijdlijn.
- Geautomatiseerde tests toegevoegd voor de geometrie van de gids.
- Vaste zenderkolom gecombineerd met een horizontaal scrollbare programma-tijdlijn.
- Zenderlabels gesynchroniseerd met verticaal scrollen in de gids.
- Nog steeds uitsluitend gebruik van deterministische fixture-data.

### Verificatie
CI was op dit moment nog in stabilisatie. Het eerste dependencyprobleem was opgelost. Daarna kwam een TypeScript 6-configuratiefout naar voren door het gebruik van de verouderde `baseUrl`-optie; ook die fout is gecorrigeerd. Latere runs zijn groen geworden.

### Volgende stap
De gidsinteractie, programmaselectie en performance verder verfijnen voordat scope uit latere fases wordt toegevoegd.

---

## 11 september 2026, 18:40 CEST — Expo/React Native-basis opgezet

### Wat is veranderd
Teevee heeft nu een uitvoerbare cross-platform basis voor iOS en Android. De applicatie opent direct op een minimale gidsroute en ondersteunt al semantische light- en dark-mode theming.

### Waarom
Dit vormt de kleinste bruikbare runtime-basis voor Phase 1 en houdt de codebase tegelijk eenvoudig genoeg om grotendeels autonoom door agents te laten onderhouden.

### Technische details
- Expo / React Native / Expo Router-bootstrap.
- Strict TypeScript-configuratie.
- Semantische light- en dark-theme tokens.
- Resolver voor het systeemthema.
- Minimale gidsroute.
- Linting en GitHub Actions CI-configuratie.

### Verificatie
De eerste CI-runs brachten dependencyconflicten tussen Expo-gerelateerde packages aan het licht. Deze configuratiefouten zijn niet genegeerd, maar opgelost door de dependencies uit te lijnen met de Expo SDK 57-stack.

### Volgende stap
Typecheck, lint en tests verifiëren en vervolgens de echte 2D-gidsinteractie bouwen.

---

## 11 september 2026, 18:35 CEST — Deterministische gidsdatalaag toegevoegd

### Wat is veranderd
Er is nu een development-only tv-programmeringsdataset beschikbaar waarmee de gids gebouwd en getest kan worden zonder afhankelijk te zijn van een externe EPG-provider.

### Waarom
Autonome ontwikkeling mag niet stilvallen wanneer een externe feed onbeschikbaar is of zijn formaat wijzigt. De fixture-laag zorgt bovendien dat geautomatiseerde tests reproduceerbaar blijven.

### Technische details
- Teevee-eigen domeintypes toegevoegd voor `Channel`, `Programme` en `GuideFixture`.
- 16 synthetische zenders toegevoegd.
- 49 uur deterministische programmadata toegevoegd.
- Edge cases opgenomen, waaronder korte en lange programma's, lange titels, ontbrekende metadata, live/herhaling en een bewuste onderbreking in het schema.
- Helpers voor programmaduur en voortgang toegevoegd, inclusief tests.

### Verificatie
Tests voor fixtures en domeinlogica zijn toegevoegd. Volledige CI-verificatie was op dat moment nog niet afgerond.

### Volgende stap
De fixture-laag gebruiken voor schedule geometry en de eerste echte gidsviewport.

---

## 11 september 2026, 18:33 CEST — Project Foundation afgerond

### Wat is veranderd
Het project is omgezet van een concept naar een repository die door autonome development-agents kan worden bestuurd, met een vaste product-, UX-, architectuur-, data- en buildbaseline.

### Waarom
Iedere autonome agentsessie moet met dezelfde bron van waarheid starten. Zonder die basis zou iedere nieuwe sessie het product of de architectuur opnieuw kunnen interpreteren.

### Product- en technische onderdelen
Aangemaakt:
- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/UX.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/BUILD_SPEC.md`
- `docs/PROJECT_STATE.md`
- ADR's voor guide-first positionering, Expo, provider-onafhankelijke EPG en canoniek projectgeheugen.

### Verificatie
Phase 0 is pas als afgerond gemarkeerd nadat `docs/PROJECT_STATE.md` en de belangrijkste ADR's daadwerkelijk in de repository stonden.

### Volgende stap
Phase 1 starten: de gidsinteractie bouwen en valideren met deterministische fixture-data.
