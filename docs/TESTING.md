# Teevee testen op een fysiek toestel

Status: Phase 3 development testpad. Phase 2 iPhone acceptance is closed. Current feature/device gates are governed by `PROJECT_STATE.md`.

Doel: echte iOS- en Android-interactie vroeg bewijzen zonder te wachten op TestFlight, Google Play of production-data. CI en server/integration tests blijven technisch bewijs, geen vervanging voor toestelacceptatie wanneer mobiele interaction boundaries worden geraakt.

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

## Phase 3 — deterministic real-data contract tests

Phase 3 vervangt de deterministische fixtures **niet**. Real data wordt via aparte provider/repository/API boundaries toegevoegd terwijl fixtures de betrouwbare test- en offline-developmentbasis blijven.

De backend-onafhankelijke Phase 3-kern heeft nu expliciete tests voor de onderstaande lagen.

### Provider / normalisatie
Bewijs minimaal:
- provider-channel mappings zijn expliciet;
- invalid/unknown/duplicate mappings worden conservatief gediagnosticeerd;
- malformed raw records zijn representabel en worden bij de trust boundary afgewezen, niet in adapters verzonnen;
- timestamps worden canoniek UTC;
- provider-ID-hergebruik voor verschillende broadcasts blijft gescheiden;
- timezone-equivalente duplicate broadcasts worden na timestampnormalisatie gededupliceerd;
- overlaps blijven bruikbare data maar geven diagnostics;
- provider-specifieke IDs/velden lekken niet in canonical/mobile output.

### Canonical repository — ADR 0007
Repositorytests bewaken:
- query-intersectie `programme.start < to && programme.end > from`;
- expliciete channel/time replacement scope;
- een partial-channel refresh raakt programmes én metadata van andere channels niet;
- corrections verwijderen stale rows alleen binnen het refreshed window;
- authoritative coverage wordt per channel/time segment bijgehouden;
- **covered but empty** geeft een geldige lege schedule terug;
- **uncovered/partly covered** geeft `null`/unavailable terug;
- gecombineerde query freshness is conservatief: de oudste coverage die bijdraagt;
- een oudere overlappende write wordt atomair `ignored-stale` en verandert canonical data niet;
- invalid ranges, lege expliciete scopes en kapotte canonical relations falen hard.

De `InMemoryScheduleRepository` is alleen een executable reference/test implementation. Een latere PostgreSQL/Supabase repository moet dezelfde tests/semantiek reproduceren.

### Ingestion orchestration
Integratietests bewaken provider -> mapping -> normalisation -> repository:
- `complete` provider coverage mag een safe canonical window vervangen;
- `partial` coverage schrijft niet destructief;
- een complete lege providerbatch mag stale canonical data verwijderen voor veilige channel scope;
- malformed data die veilig aan één channel toe te wijzen is blokkeert alleen die channel terwijl andere veilige channels kunnen updaten;
- een malformed record zonder channel attribution blokkeert de destructieve write;
- repository `ignored-stale` wordt expliciet doorgegeven en niet als stored gerapporteerd.

### Refresh concurrency
Een dedicated concurrencytest start een ouder providerrequest, schrijft daarna een nieuwere refresh en laat vervolgens het oude request pas terugkomen.

Acceptatie:
- freshness wordt vastgelegd bij **request start**;
- de nieuwere canonical schedule blijft bewaard;
- de late oudere response eindigt als `ignored-stale`.

Dit voorkomt dat netwerk/completion order de chronologische freshness omdraait.

### Typed schedule API
De repository-backed `GuideScheduleApi` en serialized requestparser bewaken:
- public output bevat alleen canonical Teevee data;
- fully covered scope geeft `ok`, ook wanneer programmes leeg zijn;
- ontbrekende/incomplete canonical coverage geeft `unavailable`;
- runtime input is een object met geldige `from`/`to` timestamps en `to > from`;
- timestamps worden gecanoniseerd naar UTC ISO;
- optionele `channelIds` moeten bij aanwezigheid een niet-lege string-array zijn, worden getrimd en gededupliceerd;
- TypeScript-types worden niet als vervanging voor transport-runtimevalidatie gebruikt.

## Live provider tests — pas na authorized providerkeuze
Een concrete live adapter moet aanvullende provider-specifieke contracttests krijgen voor:
- daadwerkelijke response parsing;
- pagination/chunking/rate limits indien relevant;
- requested-scope versus returned-scope behaviour;
- correct bepalen van `complete` versus `partial`;
- channel mapping coverage;
- schedule horizon;
- provider corrections;
- freshness/volume diagnostics op realistische data.

Normale PR-CI mag niet van een live externe provider, internetbeschikbaarheid of providercredential afhangen. Gebruik captured/licensed fixtures of adapter-level deterministic samples.

## Hosted repository/API tests — pas na backendkeuze
Wanneer PostgreSQL/Supabase of een andere backend wordt geïmplementeerd:
- run dezelfde repository semantics tegen de echte implementation;
- prove transactional stale-write protection under concurrent refreshes;
- verify coverage/freshness persistence apart van programme rows;
- verify provider/service secrets are server-only;
- verify exposed API/RLS/permissions match the intended public read model;
- verify typed transport preserves `ok` versus `unavailable` semantics.

## Mobile client
Wanneer Phase 3 de Guide daadwerkelijk op de Teevee API/cache aansluit, test:
- loading/error/offline states laten de app gecontroleerd degraderen;
- fixturemode blijft beschikbaar voor deterministic tests/development;
- schedule refresh reset de fysiek geaccepteerde Guide-scroll-/channel-/time-context niet onnodig;
- Totaal, Per zender en Nu & Straks blijven hetzelfde canonical domain consumeren;
- provider/database details komen niet in mobile code terecht.

## Cache / refresh
Wanneer mobiele schedule caching wordt toegevoegd, test expliciet:
- cold load;
- warm cache;
- refresh met ongewijzigde data;
- refresh met schedulecorrectie;
- netwerkfout met bruikbare cache;
- stale-data communicatie wanneer relevant;
- app resume en Amsterdam-dagwissel;
- incomplete API coverage wordt niet als authoritative empty cache opgeslagen.

## Fysieke device-checks tijdens Phase 3
Een backend/data-only wijziging vereist niet automatisch een volledige Guide-acceptatiepass. Gebruik risicogestuurde devicechecks:
- **geen UI/interaction boundary geraakt:** CI + unit/integratietests kunnen voldoende zijn;
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
