# Teevee testen op een fysiek toestel

Status: Phase 3 development testpad. Current feature/device gates are governed by `PROJECT_STATE.md`.

Doel: echte iOS- en Android-interactie vroeg bewijzen zonder te wachten op TestFlight, Google Play of production-data. CI blijft technisch bewijs, geen vervanging voor toestelacceptatie.

## Snelste testpad: Expo Go

De huidige app gebruikt alleen Expo-compatible libraries en heeft nog geen custom native modules nodig. Daardoor kan de huidige mobiele app voorlopig via Expo Go worden getest.

### Eenmalig op je telefoon
1. Installeer **Expo Go** uit de Apple App Store of Google Play Store.
2. Zorg dat telefoon en developmentcomputer op hetzelfde netwerk zitten.

### Eerste keer op de developmentcomputer
1. Clone de repository: `git clone https://github.com/zuiderwijk/teevee.git`
2. `cd teevee`
3. `npm ci`
4. `npm run start:device`
5. Scan de QR-code met de camera/Expo Go.

### Volgende testsessies
Werk eerst current `main` bij:

```bash
cd ~/projects/teevee
git checkout main
git pull --ff-only
```

Normaal starten:

```bash
npm run start:device
```

Bij vreemd cachegedrag of voor een gerichte acceptatiepass:

```bash
npm run start:clean
```

## Phase 2 fysieke status — CLOSED

Broad evidence: `ScreenRecording_09-13-2026 23-10-50_1.MP4` / `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`.
Final remediation evidence: `ScreenRecording_09-13-2026 23-56-18_1.MP4` / `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

De beschikbare iPhone heeft Phase 2 fysiek geaccepteerd:
- Settings als secundaire route;
- live Light/Dark/System;
- expliciete appearance-persistence na restart;
- shared headers/safe areas;
- Totaal, Per zender en Nu & Straks bij representatieve 135% iOS-tekst;
- Programme Detail onder grotere tekst;
- Per zender text-only kanaalidentiteiten blijven na PR #35 onderscheidend;
- directe zenderselectie en adjacent-channel swipe houden strip en schedule synchroon;
- geen redbox, wit scherm, crash of brede interaction-regressie.

Deze Phase 2-gates hoeven niet routinematig opnieuw te worden bewezen. Heropen een fysiek geaccepteerde interaction baseline alleen bij concrete regressie-evidence.

## Phase 3 — teststrategie voor real data

Phase 3 vervangt de deterministische fixtures **niet**. Real data wordt als aparte provider-/API-route toegevoegd terwijl fixtures de betrouwbare test- en offline-developmentbasis blijven.

Voor iedere Phase 3-slice moeten minimaal de relevante lagen afzonderlijk bewijs krijgen:

### Provider / ingestion
- geldige providerrecords worden correct geparsed;
- malformed records geven diagnostics in plaats van onverklaarde crashes;
- provider-specifieke IDs/velden lekken niet voorbij de adapter/normalisatielaag;
- timestamps worden canoniek opgeslagen en Amsterdam-rendering blijft correct;
- channel mappings zijn expliciet en onbekende mappings worden gedetecteerd;
- overlaps, ontbrekende titels, ongeldige tijden en verdachte volumes leveren data-quality diagnostics.

### Canonical storage / API
- dezelfde Teevee `Channel` / `Programme` semantiek blijft leidend;
- schedule-upserts/correcties kunnen bestaande items vervangen zonder willekeurige duplicaten;
- API-responses zijn getypeerd en provider-onafhankelijk;
- lege, gedeeltelijke en foutresponsen zijn gedefinieerd;
- secrets/providercredentials komen niet in de mobiele bundle of repository terecht.

### Mobile client
- real data komt binnen via een typed Teevee API/service boundary, nooit rechtstreeks vanaf de provider;
- loading/error/offline states laten de app gecontroleerd degraderen;
- fixturemode blijft beschikbaar voor deterministic tests/development;
- schedule refresh mag de fysiek geaccepteerde Guide-scroll-/channel-/time-context niet onnodig resetten;
- Totaal, Per zender en Nu & Straks blijven hetzelfde canonical domain consumeren.

### Cache / refresh
Wanneer Phase 3 caching toevoegt, test expliciet:
- cold load;
- warm cache;
- refresh met ongewijzigde data;
- refresh met schedulecorrectie;
- netwerkfout met bruikbare cache;
- stale-data communicatie wanneer relevant;
- app resume en Amsterdam-dagwissel.

## Fysieke device-checks tijdens Phase 3

Een backend/data-only wijziging vereist niet automatisch een volledige Guide-acceptatiepass. Gebruik risicogestuurde devicechecks:
- **geen UI/interaction boundary geraakt:** CI + integratietests kunnen voldoende zijn;
- **Guide krijgt een nieuwe data source/cache/refresh path:** korte iPhone smoke voor startup, actuele data, Nu, channel/time context en Programme Detail;
- **scroll/gesture/layout code geraakt:** de relevante fysiek bevroren baseline gericht opnieuw samplen;
- **native dependency/config gewijzigd:** iOS/Android buildpad en geschikt device opnieuw beoordelen.

## Historische Phase 1/1B-baseline
De volgende interaction models zijn al fysiek geaccepteerd:
- Totaal: tweedimensionale tijd/zender-guide, native inertia/bounce/directional lock, Vandaag/Morgen/Nu, Programme Detail;
- Per zender: verticale tijdpositie, horizontale adjacent-channel pager, browsable/direct-tap zenderstrip, contextbehoud;
- Nu & Straks: live/browse referentietijd, native tijdrail, Nu/Primetime, stabiele verticale context en Programme Detail round-trip.

## Open maar niet-blockerende accessibility debt
De compacte volgende-programma-rijen in Nu & Straks gebruiken momenteel 24pt minimumhoogte. Fysieke larger-text evidence leverde geen concrete tap failure op. Dit blijft latere Core Guide accessibility-hardening.

Niet oplossen met overlappende `hitSlop` en niet stilzwijgend alle rijen naar 44pt vergroten: beide keuzes kunnen respectievelijk tap-arbitrage of de geaccepteerde informatiedichtheid veranderen. Een latere oplossing moet density-aware zijn en fysiek worden gevalideerd.

## Geautomatiseerde kwaliteitscontrole
Iedere PR en iedere push naar `main` start GitHub Actions met:
- dependency-installatie;
- TypeScript typecheck;
- lint;
- tests;
- Expo exports voor iOS, Android en web;
- een schone Android prebuild en Gradle debug-APK compile.

Een groene CI zegt dat de code technisch door de afgesproken checks komt. Het zegt **niet** dat scrollgevoel en mobiele UX goed zijn.

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
