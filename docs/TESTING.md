# Teevee testen op een fysiek toestel

Status: Phase 2 final device gate. Current feature/device gates are governed by `PROJECT_STATE.md`.

Doel: echte iOS- en Android-interactie vroeg bewijzen zonder te wachten op TestFlight, Google Play of production-data. CI blijft technisch bewijs, geen vervanging voor toestelacceptatie.

## Snelste testpad: Expo Go

De huidige app gebruikt alleen Expo-compatible libraries en heeft nog geen custom native modules nodig. Daardoor kan de App Shell voorlopig via Expo Go worden getest.

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

De runtime-fixture wordt rond de actuele tijd gelegd. Daardoor blijven `Nu`, programma-progress en vandaag/morgen bruikbaar terwijl de onderliggende testfixture deterministisch blijft voor CI.

## Actieve Phase 2 mini-recheck — na PR #35

De brede Phase 2 iPhone-pass van `ScreenRecording_09-13-2026 23-10-50_1.MP4` is inhoudelijk geslaagd voor Settings, appearance-persistence, shared headers/safe areas, de drie Guide-presentaties, Programme Detail en 135% systeemtekst. Die brede pass hoeft **niet** opnieuw.

Hij bracht één concrete defect aan het licht: bij 135% tekst werden de text-only Per zender identities `Publiek 1`, `Publiek 2` en `Publiek 3` allemaal zichtbaar als `Publie…`. PR #35 verandert alleen de truncatie van text-only channel identities naar middle ellipsis, zodat het onderscheidende suffix zichtbaar blijft. Stripbreedte, pager, tijdanker en gestures zijn niet gewijzigd.

### Voorbereiding
1. Zorg dat `main` is bijgewerkt en start met `npm run start:clean`.
2. Laat iOS tekstgrootte op **135%** staan.
3. Open `Gids` → `Per zender`.

### Vier checks
1. Controleer dat `Publiek 1`, `Publiek 2` en `Publiek 3` in de horizontale zenderstrip visueel van elkaar te onderscheiden zijn. Een vorm als `Publ…1`, `Publ…2`, `Publ…3` is correct als de volledige namen niet passen.
2. Tik op minimaal twee van deze zenders en controleer dat de juiste zender direct geselecteerd wordt.
3. Veeg de schedule één keer horizontaal naar een aangrenzende zender.
4. Controleer dat de actieve state in de zenderstrip de nieuwe schedule-zender volgt.

### Pass/fail
**Pass:** alle vier checks slagen, zonder redbox, wit scherm, crash of nieuwe strip/pager-regressie. Dan is geen verdere brede Phase 2-devicepass nodig.

**Fail:** noteer alleen de concrete mislukte stap en lever bij voorkeur een korte screenrecording. Heropen geen andere fysiek geaccepteerde Guide-mechanica zonder bewijs.

## Reeds bewezen in de brede Phase 2-pass
Evidence: `ScreenRecording_09-13-2026 23-10-50_1.MP4`; repository record: `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`.

Op de beschikbare iPhone is bewezen dat:
- Settings als secundaire route werkt;
- `Licht`, `Systeem` en `Donker` live toepassen;
- een expliciete dark preference reload/restart overleeft;
- Settings en Vanavond shared headers/safe areas correct blijven;
- Totaal, Per zender en Nu & Straks bruikbaar blijven op 135% tekst;
- de 44pt Guide-controls bereikbaar blijven;
- Nu & Straks reference controls coherent reflowen;
- Programme Detail onder 135% tekst opent, leesbaar blijft en sluit;
- light mode na de grotere-tekstpass bruikbaar blijft;
- geen brede crash- of interaction-regressie optreedt.

## Open maar niet-blockerende accessibility debt
De compacte volgende-programma-rijen in Nu & Straks gebruiken momenteel 24pt minimumhoogte. De 23:10-pass leverde geen concrete tap failure op. Dit punt blijft daarom expliciet als latere Core Guide accessibility-hardening staan en blokkeert de huidige Phase 2-mini-recheck niet.

Niet oplossen met overlappende `hitSlop` en niet stilzwijgend alle rijen naar 44pt vergroten: beide keuzes kunnen respectievelijk tap-arbitrage of de geaccepteerde informatiedichtheid veranderen. Een latere oplossing moet density-aware zijn en fysiek worden gevalideerd.

## Historische Phase 1/1B-baseline
De volgende interaction models zijn al fysiek geaccepteerd en hoeven niet routinematig opnieuw te worden bewezen:
- Totaal: tweedimensionale tijd/zender-guide, native inertia/bounce/directional lock, Vandaag/Morgen/Nu, Programme Detail;
- Per zender: verticale tijdpositie, horizontale adjacent-channel pager, browsable/direct-tap zenderstrip, contextbehoud;
- Nu & Straks: live/browse referentietijd, native tijdrail, Nu/Primetime, stabiele verticale context en Programme Detail round-trip.

Heropen deze baselines alleen bij concrete regressie-evidence.

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
