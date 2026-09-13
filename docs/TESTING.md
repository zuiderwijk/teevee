# Teevee testen op een fysiek toestel

Status: Phase 2 development testpad. Current feature/device gates are governed by `PROJECT_STATE.md`.

Doel: de gidsinteractie zo vroeg mogelijk op echte iOS- en Android-hardware beoordelen zonder te wachten op TestFlight, Google Play of production-data.

## Snelste testpad in Phase 2: Expo Go

De huidige app gebruikt alleen Expo-compatible libraries en heeft nog geen custom native modules nodig. Daardoor kan de huidige App Shell voorlopig via Expo Go worden getest.

### Eenmalig op je telefoon
1. Installeer **Expo Go** uit de Apple App Store of Google Play Store.
2. Zorg dat telefoon en developmentcomputer op hetzelfde netwerk zitten.

### Eerste keer op de developmentcomputer
1. Clone de repository:
   `git clone https://github.com/zuiderwijk/teevee.git`
2. Ga naar de projectmap:
   `cd teevee`
3. Installeer dependencies:
   `npm ci`
4. Start de toestelmodus:
   `npm run start:device`
5. Scan de QR-code met de camera/Expo Go.

### Volgende testsessies
Na een `git pull` is meestal alleen nodig:

`npm run start:device`

Als Expo-cachegedrag vreemd lijkt:

`npm run start:clean`

De runtime-fixture wordt bij het starten rond de actuele tijd gelegd. Daardoor blijven `Nu`, programma-progress en vandaag/morgen bruikbaar, ook wanneer de test op een latere datum wordt uitgevoerd. De onderliggende testfixture blijft deterministisch voor CI.

## Actieve Phase 2 iPhone-acceptatiepass

Deze pass is bewust klein. Hij herhaalt niet de fysiek bevroren Phase 1/1B-scrollphysics, maar valideert de App Shell-, appearance- en accessibility-wijzigingen die daarna zijn toegevoegd. Noteer bij voorkeur iPhone-model, iOS-versie, Expo Go-versie en de gebruikte grotere-tekstinstelling.

### 1. Settings en appearance
1. Start op `Gids` en open `Instellingen`; Settings moet als secundaire route openen, niet als vierde tab.
2. Kies `Donker`; de zichtbare Settings-surface moet direct omschakelen. Sluit Settings en controleer ook Gids.
3. Kies `Licht` en herhaal dezelfde live-check.
4. Kies `Systeem`; verander daarna het iOS-systeemthema terwijl Teevee actief blijft. Teevee moet het systeem live volgen.
5. Kies vervolgens expliciet `Licht` of `Donker`, sluit de app volledig en start opnieuw. De expliciete keuze moet behouden blijven.
6. Open Programme Detail vanuit Gids; detail moet de actieve appearance volgen en normaal te sluiten zijn.

Stop en noteer als een theme-wissel een reload vereist, de verkeerde preference na restart terugkomt of een surface in het oude theme achterblijft.

### 2. Shared headers en safe areas
Controleer `Instellingen`, `Vanavond` en `Zoeken`:
- titel en action mogen elkaar niet overlappen;
- header/content mag niet onder notch/statusbar vallen;
- Settings openen/sluiten blijft logisch vanuit iedere primaire tab;
- bottom navigation blijft bruikbaar en stabiel.

### 3. Representatieve grotere systeemtekst
Kies in iOS één duidelijk grotere maar nog representatieve tekstinstelling en noteer welke. Een accessibility-maximum is voor deze smoke niet vereist; het doel is reflow en bereikbaarheid onder realistische grotere tekst.

Controleer vervolgens:

**Gids algemeen**
- de drie-weg selector `Totaal / Per zender / Nu & Straks` blijft volledig zichtbaar en tappable;
- geen header/action overlap of essentiële clipping;
- Programme Detail opent en sluit nog normaal vanuit alle drie presentaties.

**Per zender**
- de horizontale zenderstrip blijft beschikbaar;
- `Vandaag`, `Morgen` en `Nu` blijven goed bereikbaar en visueel intact;
- channel/date-context blijft leesbaar zonder de schedule-interactie kapot te drukken;
- een horizontale swipe naar een aangrenzende zender en een verticale schedulescroll blijven bruikbaar.

**Nu & Straks**
- referentietijd en shortcuts mogen naar meerdere regels reflowen zonder overlap;
- `Primetime` en `Nu` blijven goed bereikbaar;
- de tijdrail blijft bruikbaar;
- verticaal scrollen door zenders en wisselen van referentietijd blijven coherent.

De compacte volgende-programma-rijen in Nu & Straks zijn nog een expliciet open accessibility/UX-vraagstuk. Deze pass moet registreren hoe ze zich bij grotere tekst gedragen; verander hun informatiedichtheid niet impliciet zonder aparte beslissing.

### 4. Pass/fail voor deze sessie
De Phase 2 fysieke gate kan worden gesloten wanneer:
- Light/Dark/System live correct werken;
- een expliciete appearance na restart behouden blijft;
- gedeelde headers/safe areas geen overlap of clipping tonen;
- representatief grotere tekst de kerncontrols in Per zender en Nu & Straks bereikbaar houdt;
- de drie Guide-presentaties en Programme Detail bruikbaar blijven;
- geen redbox, wit scherm, crash of duidelijke interaction-regressie optreedt.

Bij een visuele of interaction-regressie: maak bij voorkeur één korte screenrecording en noteer de exacte stappen. Itereer daarna alleen op die concrete bevinding; heropen fysiek geaccepteerde Guide-mechanica niet zonder bewijs.

## Historische Phase 1-baseline

### Gids
- Start de app direct in de gids.
- Scroll horizontaal door de tijd.
- Scroll verticaal door de zenders.
- Controleer of de zenderkolom synchroon blijft lopen.
- Tik op `Nu` en controleer of de gids terugkeert naar het actuele punt.
- Wissel naar morgen en terug.
- Tik programma's met verschillende lengtes aan.
- Controleer dat zeer korte programma's compact maar niet kapot worden weergegeven.
- Open en sluit de programmadetailweergave.

### Visueel
- Test light mode.
- Test dark mode.
- Verander het systeemthema terwijl de app draait.
- Let vooral op leesbaarheid, informatiedichtheid en rust.

### Performance
Let op:
- haperingen bij horizontaal scrollen;
- haperingen bij verticaal scrollen;
- achterlopende zenderlabels;
- scrollsprongen;
- vertraagde respons bij het openen van programma-details;
- duidelijk verschil tussen oudere en nieuwere toestellen.

Noteer toestelmodel + OS-versie bij performancefeedback. Gebruik `docs/DEVICE_TEST_REPORT.md` als compact rapportformat. Een korte screenrecording is bij scroll- of synchronisatieproblemen waardevoller dan alleen een omschrijving.

## Geautomatiseerde kwaliteitscontrole
Iedere PR en iedere push naar `main` start GitHub Actions met:
- dependency-installatie;
- TypeScript typecheck;
- lint;
- tests;
- Expo exports voor iOS, Android en web;
- een schone Android prebuild en Gradle debug-APK compile.

Een groene CI zegt dat de code technisch door de afgesproken checks komt. Het zegt **niet** dat scrollgevoel en mobiele UX goed zijn; daarvoor blijft testen op echte hardware noodzakelijk.

## Android
Fysieke Android-validatie is nog open omdat momenteel geen Android-toestel beschikbaar is. CI bewijst Android export/prebuild/compile, niet system Back, nested gestures, device-performance of device-specifieke defects.

Zodra een geschikt toestel beschikbaar is, test op current `main` minimaal:
1. App opent normaal.
2. Alle drie Guide-presentaties zijn bruikbaar.
3. Horizontale en verticale Guide-beweging blijven stabiel.
4. Programme Detail opent en Android system/hardware Back sluit het precies één keer.
5. Appearance en grotere tekst vertonen geen device-specifieke regressie.
6. Een korte gemengde scrollsessie geeft geen crash, wit scherm of duidelijke performance collapse.

## Later: development build / TestFlight / Play Internal Testing
Expo Go is alleen bedoeld als snel development-testpad. Zodra native capabilities, notificaties, subscriptions of productieachtig distributiegedrag belangrijk worden, schakelt Teevee over naar een Expo development build en daarna TestFlight / Google Play Internal Testing.

Dat moment wordt expliciet in `docs/PROJECT_STATE.md` vastgelegd; we introduceren die distributiecomplexiteit niet eerder dan nodig.
