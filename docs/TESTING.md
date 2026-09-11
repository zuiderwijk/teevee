# Teevee testen op een fysiek toestel

Status: Phase 1 development testpad.

Doel: de gidsinteractie zo vroeg mogelijk op echte iOS- en Android-hardware kunnen beoordelen zonder te wachten op TestFlight, Google Play of production-data.

## Snelste testpad in Phase 1: Expo Go

De huidige app gebruikt alleen Expo-compatible libraries en heeft nog geen custom native modules nodig. Daardoor kan de Phase 1-prototype voorlopig via Expo Go worden getest.

### Eenmalig op je telefoon
1. Installeer **Expo Go** uit de Apple App Store of Google Play Store.
2. Zorg dat telefoon en developmentcomputer op hetzelfde netwerk zitten.

### Op de developmentcomputer
1. Clone de repository:
   `git clone https://github.com/zuiderwijk/teevee.git`
2. Ga naar de projectmap:
   `cd teevee`
3. Installeer dependencies:
   `npm ci`
4. Start Expo:
   `npm start`
5. Scan de QR-code met de camera/Expo Go.

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

Noteer toestelmodel + OS-versie bij performancefeedback.

## Geautomatiseerde kwaliteitscontrole
Iedere push naar `main` start GitHub Actions met:
- dependency-installatie;
- TypeScript typecheck;
- lint;
- tests.

Een groene CI zegt dat de code technisch door de afgesproken checks komt. Het zegt **niet** dat scrollgevoel en mobiele UX goed zijn; daarvoor blijft testen op echte hardware noodzakelijk.

## Later: development build / TestFlight / Play Internal Testing
Expo Go is alleen bedoeld als snel Phase 1-testpad. Zodra native capabilities, notificaties, subscriptions of productieachtig distributiegedrag belangrijk worden, schakelt Teevee over naar een Expo development build en daarna TestFlight / Google Play Internal Testing.

Dat moment wordt expliciet in `docs/PROJECT_STATE.md` vastgelegd; we introduceren die distributiecomplexiteit niet eerder dan nodig.
