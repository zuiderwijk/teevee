# Teevee Development Logboek

Doel: chronologisch, begrijpelijk overzicht van substantiële milestones, verificatie en blokkades. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand. Granulaire oudere CI/device-details blijven daarnaast terugvindbaar in GitHub PR/commit-history en de timestamped evidence-docs.

## Logboekregels
- Datum/tijd in Europe/Amsterdam.
- Eerst product-/gebruikerseffect, daarna techniek/verificatie.
- Claim alleen checks die aantoonbaar geslaagd zijn.
- Benoem regressies/gates expliciet.
- Iedere substantieve entry eindigt met de volgende stap.

---

## 14 september 2026, 01:25 CEST — Canonical storage + veilige ingest/service-keten gemergd; echte backend/providergate bereikt

Phase 3 heeft nu de volledige **backend-onafhankelijke** dataketen bewezen zonder een provider, database of mobiel Guide-pad voortijdig vast te zetten.

### PR #38 — canonical schedule repository semantics
PR #38 is na volledig groene exacte PR-head-CI gesquasht naar `main` als `5d997e58cd86de75a7de83367cc0e47b783657a2`.

De belangrijkste correctness-regels zijn nu uitvoerbaar vastgelegd:
- reads gebruiken canonical `[from,to)` scope en programma-intersectie `start < to && end > from`;
- replacement writes declareren expliciet channel + tijdvenster;
- authoritative coverage/freshness bestaat per channel/time segment onafhankelijk van programme rows;
- een **covered but empty** window is geldige lege schedule; uncovered/partly covered scope is unavailable;
- samengestelde read-freshness is conservatief: de oudste coverage die aan de query bijdraagt;
- channel metadata en programmes buiten de replacement scope blijven onaangeraakt;
- een oudere overlapping wordt vóór mutatie atomair `ignored-stale` en kan nieuwere EPG niet terugrollen;
- kapotte canonical relaties/ranges falen hard.

De `InMemoryScheduleRepository` is alleen een executable contract/reference en is uitdrukkelijk geen production persistence-keuze.

Verificatie:
- exacte PR-head `b2d45175cc98fb7a1530692d76f9b8c715c2f8f9`;
- CI #272 / `34787934051`: `quality` en `android-native` volledig `completed/success`;
- exact-main CI #279 / `34788786630`: volledig `completed/success`.

### PR #39 — provider ingest + typed Teevee schedule service
PR #39 is vervolgens bewust opnieuw lineair opgebouwd op de echte #38-main, zodat de uiteindelijke diff één schone commit met alleen de ingest/API-slice bevat. Hij is gesquasht naar `main` als `a39f5e432f0f3dcba946f5e8ca49bdd060ad0928`.

Gebouwd/bewezen:
- gedeelde conservatieve provider→Teevee channel-mapping en data-quality diagnostics;
- provider batches classificeren coverage expliciet als `complete` of `partial`;
- alleen complete/authoritative batches mogen destructief canonical windows vervangen;
- partial batches worden wel genormaliseerd/gediagnosticeerd maar niet destructief geschreven;
- malformed records blokkeren alleen een veilig toe te wijzen affected channel; zonder channel attribution wordt de destructieve write geheel geblokkeerd;
- een authoritative lege providerbatch mag stale canonical data juist wél verwijderen;
- freshness wordt gemeten bij **provider request start**, niet bij response completion;
- een dedicated concurrencytest bewijst dat een ouder traag request dat later terugkomt als `ignored-stale` eindigt en nieuwere data intact laat;
- serialiseerbare `GuideScheduleApi` geeft alleen canonical Teevee-data of expliciet `unavailable`;
- transportinput wordt runtime gevalideerd, timestamps gaan naar UTC en channel IDs worden getrimd/gededupliceerd;
- provider IDs/databasevelden lekken niet naar mobile-facing output.

Verificatie:
- finale lineaire PR-head `518baf1ee764a9f661afe8435631fc4074f3222b`;
- CI #280 / `34788836524`: `quality` en `android-native` volledig `completed/success`;
- exact-main CI #281 / `34789673546` is gestart en liep nog bij deze documentatie-update; daaruit wordt nog geen succesclaim afgeleid.

Geen #38/#39 increment wijzigde Guide-scroll/layout/gestures, deferred Nu & Straks loading, dependencies of native configuratie. Een nieuwe iPhone Guide-pass is daarom niet vereist voor deze backend-onafhankelijke slices.

### Provider- en backendonderzoek
De volgende stap is nu echt extern/credential-gebonden, niet een excuus voor meer abstracties.

- Er bestaat geen Teevee hosted backend/Supabaseproject.
- De verbonden Supabase-context bevat alleen een ongerelateerd `ReelWorthy`-project; dat wordt niet hergebruikt.
- Een nieuw Teevee-project vereist expliciete keuze van Supabase-organisatie, actuele cost lookup en owner-confirmatie vóór provisioning.
- Een geautoriseerde Bindinc/TVgids development-feed is voorkeursroute als die bestaat.
- Schedules Direct is afgewezen onder de huidige gepubliceerde personal/non-commercial voorwaarden.
- Gracenote On API is technisch relevant en documenteert Nederlandse (`NLD`) lineups, maar vereist geautoriseerde API/commerciële toegang.
- EPGdata.tv noemt Nederland, maar feed/API-specificatie, credentials en commerciële mobiele redistribution moeten eerst worden bevestigd.
- Scraper/public-guide feeds worden niet als shortcut gebruikt.

ADR 0007 legt de duurzame schedule storage/refresh-semantiek vast zonder een database te kiezen. `PHASE_3_PROVIDER_RESEARCH_2026-09-14.md` legt providerresearch/gates vast.

**Volgende stap:** human gate. Eerst Teevee Supabase-organisatie + expliciete projectkostenbeslissing én een geautoriseerde development-EPG bron/credentials. Daarna de kleinste hosted vertical slice: production repository → één provider adapter → hosted typed API → real schedule → measured mobile cache/source.

---

## 14 september 2026, 00:39 CEST — Phase 2 gesloten; Phase 3 normalisatiekern gemergd

De finale Per zender-recheck `ScreenRecording_09-13-2026 23-56-18_1.MP4` sloot de laatste Phase 2-devicegate. Onder de larger-text testcontext blijven `Publiek 1/2/3` onderscheidend, directe channel selection en adjacent paging werken en strip/context/schedule blijven synchroon. Geen redbox, wit scherm, crash of nieuwe gesture-regressie. Bewijs: `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

PR #36 formaliseerde Phase 2 closure / Phase 3 activation als `589ce9110419866439cd0e22e1c761687b48eb04`; exact PR-head CI #255 was volledig groen.

PR #37 introduceerde daarna de provider-onafhankelijke normalisatiekern en is gemergd als `491bc728adfb4ec70d060833d49d17bca25bbdc9`. De slice bracht `GuideSchedule`, server-only `EpgProvider`, expliciete channel mapping, UTC-normalisatie, deterministic programme identities en record-level data-quality diagnostics. Provider-ID-hergebruik voor verschillende broadcasts blijft gescheiden; timezone-equivalente duplicates worden na tijdnormalisatie herkend. Exact PR-head CI #263 en exact-main CI #265 zijn volledig groen.

**Volgende stap destijds:** canonical storage/query-semantiek vóór concrete backend/providercoupling — gerealiseerd in PR #38.

---

## 13 september 2026, 23:37 CEST — Phase 2 broad pass groen; large-text channel defect gefixt

De brede iPhone-pass `ScreenRecording_09-13-2026 23-10-50_1.MP4` bewees Settings secondary routing, Light/System/Dark live behaviour + persistence, shared headers/safe areas, alle drie Guide-presentaties en Programme Detail bij representatieve 135% iOS-tekst.

Enige concrete defect: `Publiek 1/2/3` werden bij grotere tekst visueel hetzelfde afgekapt. PR #35 wijzigde alleen de text-only truncatiestrategie naar middle ellipsis; geen strip/pager/gesture/tijdgeometrie veranderde. Exact PR-head CI #252 was volledig groen; merge `f067cf8543921464dba70c3966b1870c1ac2666a`. De 23:56 mini-recheck bevestigde de fix fysiek.

De 24pt Nu & Straks following-programme rows bleven bewust als aparte, niet-blockerende accessibility debt staan.

---

## 13 september 2026, 22:41 CEST — Phase 2 resilience/accessibility hardening #30–#34

PR #30 voegde navigator-level themed screen error recovery toe. PR #31 maakte de deferred Nu & Straks-importfout inline recoverable terwijl Totaal/Per zender bruikbaar blijven. PR #32 hardende CI-runtime/permissions. PR #33 maakte error fallback large-text-safe en Guide-presentation selector minimaal 44pt. PR #34 verhoogde veilige compacte Per zender/Nu & Straks controls naar 44pt en maakte de Nu & Straks control-row wrapbaar.

Guide schedule geometry, momentum, nested gestures, persistence en deferred startup-boundary bleven onaangeraakt. Exact PR-head #34 CI #247 en exact-main #33 CI #246 waren volledig groen.

**Volgende stap destijds:** gefocuste Phase 2 iPhone-pass — later groen afgerond.

---

## 13 september 2026, 19:22–20:47 CEST — Phase 2 app shell/preferences/appearance/header

- PR #25 bouwde typed Totaal/Per zender/Nu & Straks presentation state, directe selector en Gids/Vanavond/Zoeken tabs zonder de Nu & Straks deferred boundary te verliezen.
- PR #26 voegde versioned lokale Guide-presentation persistence toe; fysiek bewezen op iPhone na restart.
- PR #27 voegde secundaire Settings en System/Light/Dark toe; CI/main technisch groen.
- PR #29 introduceerde gedeelde `AppScreenHeader` voor Settings/Vanavond/Zoeken en safe-area handling zonder Guide-internals te refactoren.

**Volgende stap destijds:** resilience/accessibility hardening — gerealiseerd in #30–#35.

---

## 13 september 2026, 16:07–17:57 CEST — Phase 1B Guide presentations fysiek bewezen

Per zender werd gebouwd rond echte tijdgeometrie, verticale schedule-scroll, horizontale adjacent-channel pager, browsable/direct-tap channel strip, Vandaag/Morgen/Nu en Programme Detail. Een iPhone-recording bewees de kern vertical-time/horizontal-channel gesture-architectuur.

Nu & Straks werd gebouwd met één shared reference time, live/browse mode, `Nu`, prototype `Primetime` 20:30, native 30-minuten rail en reference programme + drie volgende programmes. Een startup-regressie door statische module-evaluatie leidde tot de blijvende deferred `import()` boundary; daarna werd startup + Nu & Straks fysiek bewezen.

Residual devicepass bewees contextbehoud, tijdrail, Nu/Primetime en Programme Detail voldoende om Phase 1B te sluiten.

---

## 13 september 2026, 13:17–15:38 CEST — Phase 1 Guide quality/performance stabilization

Belangrijkste fysiek bewezen increments:
- PR #9: UI-thread partial-left programme-title readability;
- PR #11: whole-label time-axis mask zonder los `30`-fragment;
- PR #12: reverse-scroll title blanking opgelost;
- PR #13: VoiceOver/self-contained labels/accessibility escape + live system theme;
- PR #14/#15: per-frame horizontal JS bridges/settled rerender-bottlenecks verwijderd; detail response na horizontal fling fysiek terug op baseline;
- PR #16: `[start,end)` current-programme semantics en sub-minute progress;
- PR #17: Amsterdam calendar/DST fixture lifecycle en app-resume refresh;
- PR #18: committed lockfile + `npm ci` reproducibility;
- PR #19: clean Android prebuild + Gradle debug APK compile als technische Android CI-gate.

Een eerdere high-volume per-programme Reanimated-architectuur (PR #6) was CI-groen maar crashte fysiek en werd teruggedraaid; dit blijft expliciet afgewezen.

---

## 13 september 2026, ochtend — Phase 1 Totaal interaction baseline

Native scroll inertia/bounce/directional lock, continuous timeline, Vandaag/Morgen/Nu, Programme Detail, larger system text en logo-ready channel identity zijn in gerichte iPhone-rondes opgebouwd en geaccepteerd. Deze kerninteracties zijn sindsdien een frozen regression baseline.

---

## 11 september 2026 — Project bootstrap

Projectfoundation, Expo/React Native strict TypeScript, deterministic EPG fixture, eerste Totaal-grid, Programme Detail, current-time/progress, Amsterdam runtime fixture, CI en device-workflow zijn opgezet. Fixture later uitgebreid naar 48 synthetische zenders.

---

## Doorlopende open technische/productpunten
- **Phase 3 hosted vertical slice:** geblokkeerd op expliciete backend organization/cost + authorized provider/credentials gate; backend-independent contracts zijn compleet t/m PR #39.
- **Provider:** Bindinc/TVgids internal preferred if authorized; Schedules Direct rejected; Gracenote/EPGdata candidates pending rights/access.
- **Mobile real-data cache/source:** nog niet bouwen vóór echte API payload/refreshmeting; AppPreferences-storage is expliciet een andere laag.
- **Guide interaction baseline:** fysiek geaccepteerd op iPhone; alleen heropenen met regressie-evidence.
- **Nu & Straks 24pt following rows:** non-blocking accessibility/density debt; later density-aware fysiek hardenen.
- **Android:** physical Back/gestures/performance deferred wegens geen Android-device; CI-native compile is geen device acceptance.
- **Programme Detail:** `Herinner mij` + `Bewaar` nog niet geïmplementeerd.
- **Release-like performance:** later buiten Expo Go valideren.
- **Dependencies:** moderate advisories gericht analyseren; nooit `npm audit fix --force`.
- **Production rights:** EPG/logo/artwork/SLA expliciet bevestigen vóór paid release.
- Pricing/trial/paywall, production font licensing en definitieve Tonight composition blijven later.
