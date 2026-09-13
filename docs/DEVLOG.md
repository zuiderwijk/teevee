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

## 13 september 2026, 07:36 CEST — Programmadetails naar beneden wegvegen

Vastlegging gestart om 07:36 CEST (Europe/Amsterdam). Eerste codecommit `4e450141`, testcorrectie `26a733d5`; uitbreiding van de bundelcontrole `762f0f46` vastgelegd om 07:35:24 CEST. Exacte documentatie- en integratietijden staan in GitHub, PR #2.

### Wat is veranderd
De product owner noemt de verbeterde detailrespons "perfect" en bevestigt dat zowel Sluiten als tikken buiten het paneel werkt. Dat akkoord is vastgelegd. De gevraagde derde manier om te sluiten is toegevoegd: het detailpaneel naar beneden wegvegen.

Het paneel volgt de vinger. Een kleine, afgebroken veeg laat het terugveren; een duidelijke neerwaartse veeg sluit. De knop en achtergrondtik blijven bestaan. Bij heropenen moet het paneel weer op de normale plek staan, terwijl de gids zijn tijd- en zenderpositie bewaart.

### Waarom
Wegvegen is een extra bediening voor hetzelfde detailpaneel, geen reden om het goedgekeurde scrollgedrag of de snellere detailrespons opnieuw te veranderen. We bewaken daarom ook annuleren, heropenen en de bestaande sluitroutes.

### Technische details
- Gebruik van reeds geïnstalleerde Gesture Handler 2, Reanimated 4 en Worklets. Geen packagewijziging en geen nieuwe gids-scrollbibliotheek.
- Alleen een neerwaartse gesture activeert; horizontale/opwaartse start, multitouch en systeemannulering sluiten niet. Afstand is in logische punten; snelheid in punten per seconde.
- Gedeelde animatiewaarden volgen de vinger zonder React-statusupdate per frame. De terugveer respecteert de systeeminstelling voor minder beweging.
- Een geslaagde swipe gebruikt de bestaande native Modal-slide voor de exit. De reeds verplaatste positie blijft staan tijdens sluiten; geen tweede animatie en niet eerst terugspringen.
- Een eigen GestureHandlerRootView binnen de modal ondersteunt Android's afzonderlijke modalvenster. Werkelijke Android-acceptatie blijft open.
- Knop, achtergrondtik, toegankelijkheids-escape en native terugactie blijven beschikbaar. De memo-grens met de gids is ongewijzigd.
- Pure drempeltests en React-integratietests uitgebreid voor volgen, annuleren, eenmaal sluiten, heropenen en behoud van de gidsrender/scrollhosts.
- CI controleert voortaan ook iOS- en Android-bundels naast web, om native imports/worklets mee te bouwen. Dit is geen ondertekende native appbuild.

Het huidige paneel heeft geen scrollbare tekstcontainer. Zodra die wordt toegevoegd, moet wegvegen op de header of de bovenrand van de tekstscroll worden afgestemd. Lezen mag niet onbedoeld tot sluiten leiden.

### Verificatie
Het eerdere detailwerk is geïntegreerd als `1211630` met geslaagde main-CI #56; daar is nu kwalitatief iPhone-akkoord bij gekomen. Er is nog geen native test van de nieuwe swipefunctie.

De eerste swipe-PR-run #57 faalde bij TypeScript. De callbacktypes in de nieuwe testmock zijn expliciet gemaakt onder strict optional typing. **CI #58 voor `26a733d5` is geslaagd**: installatie, TypeScript, lint, tests en webexport. De uitgebreide iOS/Android/web-export en de documentatie-/integratieruns hebben afzonderlijke resultaten, die vóór overdracht worden gecontroleerd.

De tests gebruiken echte React-componenten maar gemockte native hosts, shared values en gesture-events. Ze bewaken logica, niet het native veeggevoel, echte schermpositie, animatieduur of toegankelijkheid. De container kon GitHub niet klonen wegens DNS; er is geen lokale native runtime uitgevoerd.

Bronnen voor de implementatie: [Gesture Handler 2 pan](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/gestures/pan-gesture/), [modal-root setup](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/fundamentals/installation/), [Reanimated spring](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/), [Worklets scheduleOnRN](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN/) en [Expo Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/). Dit zijn API-bronnen, geen bewijs voor de gebruikerservaring van deze build.

### Volgende stap
Na groene integratie dezelfde iPhone hertesten: kort trekken/annuleren, naar beneden sluiten, opnieuw openen en sluiten via knop/achtergrond, met behoud van de gidspositie. Daarna verder met de overige leesbaarheids- en toegankelijkheidschecks binnen Phase 1.

---

## 13 september 2026, 07:18 CEST — Detailweergave losgemaakt van het zware gidswerk

Codeversie `85e3d408cfbbe73c0f7402baadaae22089650f92` vastgelegd om **07:18:07 CEST (Europe/Amsterdam)**. De eerste implementatie staat in `7ab9b73`; het resultaat is hieronder aangevuld na de geslaagde PR-controle. De exacte tijd van de documentatiecommit staat in GitHub.

### Wat is veranderd
De product owner bevestigt dat programmadetail opent en sluit en dat de gidspositie behouden blijft. De wachttijd na zowel een programmat ik als de Sluiten-knop voelt echter traag; dit is niet gemeten.

Openen en sluiten zijn daarom losgemaakt van het opnieuw opbouwen van de gehele gids. De gids blijft op dezelfde plek staan en de detailweergave kan afzonderlijk veranderen. Programmablokken en Sluiten hebben ook visuele feedback tijdens indrukken. Tijdens het wegschuiven blijft de detailtekst behouden, in plaats van direct uit het paneel te verdwijnen.

### Waarom
In de vorige component veranderde detailselectie de status van hetzelfde scherm dat alle programma's doorliep. Dat is concreet onnodig renderwerk en een plausibele bijdrage aan de vertraging. Het is nog geen gemeten verklaring voor de volledige wachttijd op de iPhone.

De native schuifanimatie is bewust niet aangepast: eerst het onnodige renderwerk wegnemen, daarna op hetzelfde toestel vergelijken. De geaccepteerde scrollinertie, bounce, tijdlijn en `Nu`-beweging blijven hetzelfde.

### Technische details
- Kleine routecomponent voor detailstatus, met stabiele callbacks naar een memoized `GuideView` en een aparte `ProgrammeDetail`.
- Reducer houdt inhoud vast terwijl `visible=false` de native modal sluit; herhaalde sluitacties veranderen de status niet opnieuw.
- Backdrop en sheet zijn siblings, zodat tikken op tekst niet per ongeluk sluit.
- Activeren blijft op `onPress`, niet op `onPressIn`; een begonnen veegbeweging mag geen detail openen.
- Vier reducerchecks en vijf React/jsdom-integratiecases toegevoegd. Die controleren onder meer geen extra Guide-render bij openen/sluiten, behoud van gemounte hosts/offsets, vervolgselectie en ontbrekende/lege beschrijving.
- Geen nieuwe runtime/native dependency, geen scrollbibliotheek en geen kunstmatige animatieduur. Alleen testtooling toegevoegd: `jsdom` 29.1.1 en React DOM-types op de 19.2-reeks.
- Werk eerst op branch `fix/detail-render-isolation` / PR #1 gecontroleerd, zodat een falende eerste testsetup niet meteen de werkende `main` vervangt.

### Verificatie
De eerste PR-run **#52** stopte tijdens installeren: een te ruime versiegrens voor React DOM-types koos 19.3, terwijl Expo op React 19.2 staat. De grens is beperkt tot `~19.2.0`, zonder runtime-upgrade of `--force`.

**PR-CI #53 is geslaagd** voor `85e3d408`: installatie, TypeScript, lint, alle tests en Expo-webexport. De nieuwe React-test gebruikt de echte componenten en de 48-zenderfixture met gemockte native hosts en klok. Hij controleert rendergedrag, niet iPhone-animatie of milliseconden winst. Native tikrespons en de schuifanimatie zijn nog niet hertest. De agent kon de repository niet lokaal downloaden door netwerk/DNS-beperkingen; volledige checks zijn in GitHub Actions uitgevoerd, niet als lokale toesteltest.

De nieuwe documentatie en latere integratie hebben hun eigen CI-resultaat. Geen aanname dat een toekomstige run vanzelf slaagt. Het testverslag onderscheidt bevestigd positiebehoud op de vorige versie van nog te beoordelen respons in deze versie.

Bronnen voor de aanpak: [React memo](https://react.dev/reference/react/memo), [React useCallback](https://react.dev/reference/react/useCallback), [React Native performance](https://reactnative.dev/docs/performance) en [Modal](https://reactnative.dev/docs/modal). Deze bronnen beschrijven het mechanisme; ze bewijzen geen latencyverbetering in onze app.

### Volgende stap
Na groene integratie dezelfde iPhone gericht hertesten op openen/sluiten en positiebehoud. Bij blijvende vertraging eerst JS-render/commit en native presentatie onderscheiden; niet op gevoel animatieparameters veranderen. De overige leesbaarheids-, toegankelijkheids- en Androidchecks blijven open binnen Phase 1.

---

## 13 september 2026, 07:04 CEST — iPhone-scrollhertest akkoord

Vastlegging gestart om 07:04 CEST (Europe/Amsterdam). De exacte committijd staat in GitHub.

### Wat is veranderd
De product owner antwoordt **"perfect"** na het verzoek de nieuwe standaardinertie, doorlopende tijdlijn en geanimeerde terugkeer met `Nu` te testen. Dit is als kwalitatief akkoord op die gerichte wijzigingenset vastgelegd. Het scrollgedrag wordt de werkbaseline; we veranderen het niet opnieuw zonder een concreet probleem.

### Waarom
De eerdere blokkades bij uitrollen, het tijdsbereik en terugkeren over de daggrens hoeven niet steeds opnieuw ter discussie te staan. Tegelijk betekent akkoord op scrollen niet dat ook programmadetail, leesbaarheid, toegankelijkheid of Android zijn gevalideerd.

### Technische details
- Alleen `DEVICE_TEST_REPORT.md`, `PROJECT_STATE.md` en dit logboek aangepast.
- Geen wijziging aan appcode, dependencies, inertie, bounce of scrollarchitectuur.
- Standaard `normal` op beide assen en één doorlopende gids blijven behouden.
- De volgende stap verschuift naar programmadetail en leesbaarheid, binnen Phase 1.

### Verificatie
De eerdere codecommit `b13a7c5` is technisch geverifieerd met CI #49; documentatie-opvolger `0e9be91` met CI #50. Daar komt nu het kwalitatieve iPhone-akkoord bij. Geen exacte swipeafstand, framerate, toestelmodel of afzonderlijke deelresultaten zijn aangeleverd; die worden niet ingevuld op basis van aannames. Een eventuele CI-run voor deze nieuwe documentatiecommit heeft een eigen resultaat.

### Volgende stap
Programmadetail en leesbaarheid gericht valideren: openen/sluiten zonder verlies van gidspositie, ontbrekende metadata, korte programmablokken, grotere tekst en light/dark. Android, lifecycle en release-achtige performance blijven open voordat Phase 1 kan worden afgesloten.

---

## 13 september 2026, 06:58 CEST — Standaardinertie als uitgangspunt en controle van de doorlopende gids

Code vastgelegd om **06:56:33 CEST**, commit `b13a7c5263cd663ed1d7ea35e3cfb46d70a8988a`. Deze vermelding is om 06:58 CEST opgesteld na controle van CI.

### Wat is veranderd
Ook verticaal gebruikt Teevee nu de normale platforminertie: geen extra snelle afremming en geen zelfgekozen tussenwaarde. Horizontaal stond die instelling al op normaal. De eerder gewenste bounce blijft behouden.

De doorlopende tijdlijn uit de vorige stap is gecontroleerd. De app gebruikt niet meer twee afzonderlijke vensters van twaalf uur. Dagknoppen en `Nu` bewegen binnen dezelfde tijdlijn; de actieve dag volgt de scrollpositie in plaats van vooraf naar een ander scherm te wisselen.

### Waarom
Met 48 zenders meldt de product owner een duidelijke te korte uitloop: ongeveer één scherm na een harde swipe, tegenover circa twee in zijn vergelijking met TVgids.nl. Dat is geen instrumentele meting, maar wel reden om de standaard als referentie te testen. De eerdere keuze om verticaal sneller af te remmen was een hypothese, geen bewezen verbetering. De tussenwaarde `0.995` was evenmin onderbouwd als beter dan de standaard.

Ook werden een stop rond 16:00 en een reload-achtige terugkeer vanaf maandag gemeld. Die punten moeten in dezelfde hertest worden meegenomen.

### Technische details
- Beide interactieve ScrollViews gebruiken `decelerationRate="normal"`; geen nieuwe dependency of scrollbibliotheek.
- `Nu` vraagt een geanimeerde scroll naar de actuele kloktijd binnen dezelfde gemounte tijdlijn.
- De 48-zenderfixture blijft 49 uur lang en begint op de Amsterdamse kalenderdag van het openingsmoment.
- Een gedeelde kalenderhelper zorgt dat dagstart en volgende dag dezelfde tijdzone gebruiken als de tijdlabels. Zomer-/wintertijd worden niet als vaste dagen van 24 uur behandeld.
- Tests toegevoegd voor expliciete verwachte daggrenzen, jaarwisseling, de overgangsdagen van 23 en 25 uur, data na 16:00 op beide dagen en behoud van alle programma-identiteiten, metadata en duur.
- De codewijzigingen zijn samen in één commit vastgelegd.

Bron voor de standaardparameter: [React Native ScrollView — decelerationRate](https://reactnative.dev/docs/scrollview#decelerationrate). Het uiteindelijke scrollgevoel blijft een toesteltest, geen gevolgtrekking uit alleen de documentatie.

### Verificatie
De vorige CI-run **#48 faalde** omdat een test nog het oude startpunt van negentien uur vóór nu verwachtte. Die test is niet uitgezet: hij is vervangen door controles op de nieuwe kalenderdagafspraak en uitgebreid met randgevallen. Ook het verschil tussen toestel-tijdzone en Amsterdam is gecorrigeerd.

**CI-run #49 is geslaagd** voor commit `b13a7c5`: installatie, TypeScript, lint, tests en Expo-webexport. De kalenderhelper is daarnaast lokaal uitgevoerd met expliciete verwachte tijdstippen onder vier proces-tijdzones. Dit bewijst geen iPhone-performance: de nieuwe inertie en de animatie over de daggrens zijn nog niet opnieuw op een toestel beoordeeld.

Het apparaatrapport en de canonieke projectstatus zijn bijgewerkt zonder de nieuwe wijzigingen al als geaccepteerde toesteltest te markeren. Een documentatiecommit na de geverifieerde code heeft zijn eigen CI-run.

### Volgende stap
Dezelfde iPhone hertesten met de bijgewerkte lokale checkout: langere verticale swipes, voorbij 16:00 op beide dagen, door middernacht en vanaf de volgende dag via `Nu` terug. Alleen op basis van die observaties opnieuw aan de inertie sleutelen. De app blijft in Phase 1.

---

## 13 september 2026, 06:28 CEST — Gids verlengd voor realistische verticale scrolltest

### Wat is veranderd
De testgids bevat nu 48 synthetische zenders in plaats van 16. Daardoor is de verticale gids lang genoeg om de inertie van een flinke swipe op een echte telefoon betrouwbaar te beoordelen.

### Waarom
De eerste iPhone-retest was akkoord, maar een swipe omlaag voelde mogelijk wat traag. Met slechts 16 zenders was er te weinig scrollafstand om daar een betrouwbare conclusie aan te verbinden. In plaats van de scrollsnelheid op gevoel te wijzigen, is eerst de testconditie realistischer gemaakt.

### Technische details
- de deterministische kanaalfixture is uitgebreid naar 48 zenders;
- de bestaande programma-generator en edge cases blijven intact;
- er is geen nieuwe scrollbibliotheek of virtualisatie toegevoegd;
- de huidige verticale `decelerationRate` blijft voorlopig ongewijzigd.

### Verificatie
De volledige CI is groen voor deze increment: dependency-installatie, TypeScript, lint, tests en Expo-webexport zijn allemaal geslaagd.

### Volgende stap
De langere gids op dezelfde iPhone testen met één of meer lange verticale swipes. Alleen wanneer de verticale travel dan nog duidelijk te kort voelt, wordt de verticale deceleration verder getuned.

---

## 11 september 2026, 19:46 CEST — Scrollgedrag aangepast op basis van eerste iPhone-test

### Wat is veranderd
De eerste fysieke iPhone-test leverde drie concrete UX-punten op. Bij wisselen naar morgen ging de horizontale tijdpositie verloren, horizontaal en verticaal scrollen voelden te veel hetzelfde en de gids stopte boven en onder te hard zonder natuurlijke iOS-bounce.

De Guide bewaart nu de horizontale tijdpositie bij dagwissel. Horizontale tijdnavigatie gebruikt de normale, langere native inertie; verticale zendernavigatie gebruikt de snellere afremming zodat kanaalnavigatie preciezer stopt. Verticale bounce is weer ingeschakeld voor een kleine natuurlijke bump aan boven- en onderzijde.

### Waarom
Een tv-gids heeft twee verschillende navigatie-intenties: horizontaal wil je relatief veel tijd kunnen overbruggen, verticaal wil je snel maar gecontroleerd tussen zenders bewegen. Die twee assen hoeven daarom niet identiek aan te voelen. Daarnaast hoort een iOS-scrollvlak aan de rand niet dood aan te voelen.

### Technische details
- horizontale offset wordt tijdens scrollen bijgehouden;
- dagwissel behoudt die offset in plaats van terug te springen naar het begin;
- horizontale `ScrollView`: `decelerationRate="normal"`;
- verticale `ScrollView`: `decelerationRate="fast"`;
- verticale `bounces` en `alwaysBounceVertical` ingeschakeld;
- horizontale bounce eveneens toegestaan;
- bestaande directional lock blijft actief.

### Verificatie
De wijziging is gecommit, maar moet nog via CI en opnieuw op de iPhone worden gevalideerd. De onderliggende keuze voor inertie sluit aan op de native React Native/iOS scrollparameters; het uiteindelijke gevoel moet op device worden beoordeeld.

### Volgende stap
CI controleren en daarna dezelfde iPhone-test opnieuw uitvoeren, specifiek op terugscrollen, behoud van tijdpositie bij Vandaag/Morgen en het verschil in horizontale versus verticale inertie.

---

## 11 september 2026, 19:16 CEST — Testdata tijdrelatief gemaakt en toesteltest vereenvoudigd

### Wat is veranderd
De Phase 1-gids gebruikt voor handmatige toesteltests niet langer een fixture die alleen op 11 september 2026 bruikbaar is. Bij het starten van de app wordt dezelfde deterministische dataset rond het actuele tijdstip gelegd. Daardoor blijven `Nu`, programma-progress en vandaag/morgen ook op een later testmoment logisch werken.

Het fysieke testpad is daarnaast teruggebracht tot één duidelijk startcommando (`npm run start:device`) en er is een vast `DEVICE_TEST_REPORT.md` toegevoegd voor concrete UX- en performancebevindingen.

### Waarom
Een testprototype dat alleen op één vaste datum realistisch werkt, is onnodig fragiel. Tegelijk moeten CI-tests reproduceerbaar blijven. Daarom blijven de bronfixtures deterministisch en wordt alleen de runtime-kopie verschoven voor handmatige tests.

### Technische details
- `buildRuntimeGuideFixture()` toegevoegd: verschuift alleen timestamps en bewaart ids, volgorde, programmaduur en edge cases.
- Tests toegevoegd die bewaken dat de verschuiving deterministisch is en programmaduur intact blijft.
- De Guide gebruikt een runtime-fixture die één keer bij appstart wordt opgebouwd.
- Het zichtbare tijdvenster wordt relatief aan het startmoment geplaatst.
- `npm run start:device` en `npm run start:clean` toegevoegd.
- `docs/TESTING.md` vereenvoudigd en `docs/DEVICE_TEST_REPORT.md` toegevoegd.

### Verificatie
De uitgebreidere CI met typecheck, lint, tests én Expo-webexport was vóór deze wijziging groen. De eerste implementatie van de runtime-fixture faalde daarna terecht op de React purity/refs-lintregels. De implementatie is daarop aangepast naar lazy React-state-initialisatie in plaats van de lintregel te onderdrukken. De CI-run voor deze fix loopt nog en is daarom nog niet als geslaagd geregistreerd.

### Volgende stap
CI van de purity-fix volledig groen krijgen. Daarna is de repository technisch klaar voor de eerste fysieke Phase 1-toesteltest; de uitkomst daarvan bepaalt of de huidige standaard React Native-scrolloplossing behouden kan blijven of dat gespecialiseerde virtualisatie nodig is.

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
