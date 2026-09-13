# Teevee testen op een fysiek toestel

Status: Phase 2 development testpad. Current feature/device gates are governed by `PROJECT_STATE.md`.

Doel: de gidsinteractie zo vroeg mogelijk op echte iOS- en Android-hardware beoordelen zonder te wachten op TestFlight, Google Play of production-data.

## Snelste testpad in Phase 1: Expo Go

De huidige app gebruikt alleen Expo-compatible libraries en heeft nog geen custom native modules nodig. Daardoor kan de Phase 1-prototype voorlopig via Expo Go worden getest.

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

## Wat in Phase 1 getest moet worden

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
- Let vooral op leesbaarheid, informatiedichtheid en rust; de huidige visuals zijn nog geen definitief design.

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

## Later: development build / TestFlight / Play Internal Testing
Expo Go is alleen bedoeld als snel Phase 1-testpad. Zodra native capabilities, notificaties, subscriptions of productieachtig distributiegedrag belangrijk worden, schakelt Teevee over naar een Expo development build en daarna TestFlight / Google Play Internal Testing.

Dat moment wordt expliciet in `docs/PROJECT_STATE.md` vastgelegd; we introduceren die distributiecomplexiteit niet eerder dan nodig.
