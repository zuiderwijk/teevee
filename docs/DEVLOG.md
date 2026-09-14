# Teevee Development Logboek

Doel: chronologisch, begrijpelijk overzicht van substantiële milestones, verificatie en blokkades. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand. Granulaire details blijven daarnaast terugvindbaar in GitHub PR/commit-history en timestamped evidence-docs.

## Logboekregels
- Datum/tijd in Europe/Amsterdam.
- Eerst product-/gebruikerseffect, daarna techniek/verificatie.
- Claim alleen checks die aantoonbaar geslaagd zijn.
- Benoem regressies/gates expliciet.
- Iedere substantieve entry eindigt met de volgende stap.

---

## 14 september 2026, 02:41 CEST — Hosted Supabase-store gemergd; EPGdata.tv geselecteerd als eerste externe development-route

De eerste echte hosted Phase 3-backend staat nu operationeel zonder de mobiele Guide direct aan Supabase of een provider te koppelen.

### PR #40 — Supabase-backed canonical schedule store
PR #40 is na volledig groene exacte PR-head CI gesquasht naar `main` als `da08c10e170ea8fe3843e16b76247eccd6c0502a`.

Verificatie:
- finale PR-head `efcd966c5998d2524e4b58f3304220a2a8c1e36c`;
- CI #283 / `34792237068`: `quality` en `android-native` beide `completed/success`;
- typecheck, lint, tests, iOS/Android/web exports en clean Android debug APK compile groen.

Supabase:
- project `teevee`, ref `eokszvpityhtysbwdduy`;
- organisatie `teevee`, Free plan, regio `eu-west-2`;
- canonical data in private `teevee` schema;
- `anon` en `authenticated` hebben geen toegang;
- server-only RPC bridges zijn `security invoker` en alleen voor `service_role`;
- geen service-role secret in app of Git.

Applied + exact geversioneerd in Git:
- `20260914001257_create_canonical_schedule_store`;
- `20260914001410_harden_default_rls_helper_permissions`;
- `20260914001538_create_schedule_rpc_bridge`.

De storage implementeert ADR 0007 transactioneel: scoped replacement, aparte coverage, covered-empty versus unavailable en stale-write rejection. Supabase security advisors zijn na hardening vrij van WARN/ERROR; resterende INFO betreft bewust private RLS-tabellen zonder client policies en ongebruikte indexen in de nog lege dataset.

### Tijdelijke externe EPG-keuze
Voor de real-data vertical slice is **EPGdata.tv** geselecteerd als eerste externe development-route. Argumenten: expliciete Nederlandse zenderdekking, focus op TV-gids/platformproducten, Nederlandse/Hilversumse leverancier en mogelijkheid tot klantgerichte exports. Gracenote blijft fallback.

Belangrijk: EPGdata vermeldt publiek dat levering van EPG-data op zichzelf geen publicatierecht inhoudt. Daarom moet de aanvraag expliciet toestemming vragen voor:
- development/pilotgebruik;
- display/redistributie van gelicenseerde programmadata in Teevee als betaalde advertentievrije iOS/Android-consumentenapp;
- separate rechten/voorwaarden voor logo's en artwork.

De eerste pilot moet bewust klein blijven: circa twaalf kernzenders (NPO 1/2/3, RTL 4/5/7/8/Z, SBS6, Net5, Veronica, SBS9 of actuele equivalenten), machine-readable feed/API, stable IDs waar beschikbaar, enkele dagen of normale production horizon en documentatie over updates/correcties.

**Volgende stap:** EPGdata benaderen voor pilot/sample/feed specification, credentials en rechtenbevestiging. Pas na ontvangst van het echte formaat de concrete adapter bouwen achter `EpgProvider`; geen speculatieve XML/JSON-parser vooraf.

---

## 14 september 2026, 01:25 CEST — Canonical storage/query + veilige ingest/service-keten compleet

Phase 3 bewees de volledige backend-onafhankelijke dataketen vóór een production database/provider werd gekozen.

### PR #38 — canonical schedule repository semantics
Merge `5d997e58cd86de75a7de83367cc0e47b783657a2`. Exact PR-head CI #272 en exact-main CI #279 volledig groen.

Vastgelegd:
- canonical `[from,to)` reads/replacement scope;
- independent authoritative coverage/freshness;
- covered-empty als geldig resultaat;
- conservative read freshness;
- scoped channel metadata/programme replacement;
- atomic `ignored-stale` voor oudere overlappingen.

### PR #39 — provider ingest + typed Teevee schedule service
Merge `a39f5e432f0f3dcba946f5e8ca49bdd060ad0928`. Exact PR-head CI #280 volledig groen.

Gebouwd/bewezen:
- provider batches `complete`/`partial`;
- alleen complete authoritative batches mogen destructief vervangen;
- malformed data blokkeert zo klein mogelijk;
- request freshness wordt vóór remote fetch gemeten;
- concurrencytest bewijst dat late oude responses nieuwere data niet terugrollen;
- typed `GuideScheduleApi` lekt geen provider/databasevelden.

ADR 0007 formaliseerde de duurzame storage/refresh-semantiek.

---

## 14 september 2026, 00:39 CEST — Phase 2 gesloten; Phase 3 normalisatiekern gemergd

De finale Per zender-recheck `ScreenRecording_09-13-2026 23-56-18_1.MP4` sloot de laatste Phase 2-devicegate. Onder larger text blijven `Publiek 1/2/3` onderscheidend; direct selecteren, adjacent paging en strip/context/schedule synchroniseren correct. Geen redbox/wit scherm/crash/gesture-regressie.

PR #36 formaliseerde Phase 2 closure / Phase 3 activation als `589ce9110419866439cd0e22e1c761687b48eb04`; exact PR-head CI #255 groen.

PR #37 introduceerde provider-onafhankelijke `GuideSchedule`, server-only `EpgProvider`, explicit channel mapping, UTC-normalisatie, deterministic programme identities en record-level diagnostics. Merge `491bc728adfb4ec70d060833d49d17bca25bbdc9`; exact PR-head CI #263 en exact-main CI #265 groen.

---

## 13 september 2026, 23:37 CEST — Phase 2 broad pass groen; larger-text channel defect gefixt

Broad iPhone-pass bewees Settings routing, Light/System/Dark live + persisted, shared headers/safe areas, alle Guide-presentaties en Programme Detail bij representatieve 135% iOS-tekst.

Defect: `Publiek 1/2/3` werden visueel hetzelfde afgekapt. PR #35 wijzigde alleen text-only truncatie naar middle ellipsis; geen geometry/gesture-aanpassing. Merge `f067cf8543921464dba70c3966b1870c1ac2666a`; exact PR-head CI #252 groen; 23:56 mini-recheck fysiek groen.

24pt Nu & Straks following rows bleven bewust non-blocking accessibility debt.

---

## 13 september 2026, 19:22–22:41 CEST — Phase 2 shell/resilience/accessibility hardening

PR #25–#35 leverden presentation state, persistence, Settings/System-Light-Dark, shared headers, navigator-level recovery, deferred Nu & Straks recovery, CI hardening en veilige 44pt compact controls. Guide schedule geometry, momentum, nested gestures en Nu & Straks deferred startup-boundary bleven behouden.

---

## 13 september 2026, 16:07–17:57 CEST — Phase 1B Guide-presentaties fysiek bewezen

Per zender werd bewezen met vertical wall-clock schedule, adjacent-channel swipe, channel strip, Vandaag/Morgen/Nu en Programme Detail. Nu & Straks werd bewezen met shared reference time, live/browse, Nu/Primetime en time rail. Een startup-regressie door statische module-evaluatie leidde tot de blijvende deferred `import()` boundary.

---

## 13 september 2026, 13:17–15:38 CEST — Phase 1 Guide quality/performance stabilization

PR #9–#19 stabiliseerden title/time-axis readability, VoiceOver/theme, fling/detail performance, current-programme semantics, Amsterdam/DST fixture lifecycle, lockfile/npm-ci reproducibility en clean Android native CI. Een high-volume per-programme Reanimated-architectuur was CI-groen maar crashte fysiek en werd teruggedraaid; blijft expliciet afgewezen.

---

## 11–13 september 2026 — Project bootstrap en Totaal baseline

Expo/React Native strict TypeScript projectfoundation, deterministic EPG fixture (uiteindelijk 48 synthetische zenders), eerste Totaal-grid, Programme Detail, current-time/progress, Amsterdam runtime fixture en CI zijn opgezet. Native inertia/bounce/directional lock, continuous timeline, Vandaag/Morgen/Nu, Programme Detail, larger text en logo-ready channel identity werden fysiek geaccepteerd.

---

## Doorlopende open technische/productpunten
- **Phase 3:** backend/persistence staat; volgende externe gate is EPGdata pilot/feed + explicit development/publication rights.
- **Provider:** EPGdata first; Gracenote fallback; Schedules Direct rejected; no scraper shortcut.
- **Hosted API:** thin transport voor `GuideScheduleApi` volgt na concrete provider ingest.
- **Mobile real-data cache/source:** pas kiezen na echte payload/refreshmeting; AppPreferences-storage is andere laag.
- **Guide interaction baseline:** fysiek geaccepteerd op iPhone; alleen heropenen met regressie-evidence.
- **Nu & Straks 24pt rows:** non-blocking accessibility/density debt.
- **Android:** physical Back/gestures/performance deferred wegens geen Android-device; CI-native compile is geen device acceptance.
- **Programme Detail:** `Herinner mij` + `Bewaar` nog niet geïmplementeerd.
- **Release-like performance:** later buiten Expo Go valideren.
- **Dependencies:** moderate advisories gericht analyseren; nooit `npm audit fix --force`.
- **Production rights:** EPG/logo/artwork/SLA expliciet bevestigen vóór paid release.
- Pricing/trial/paywall, production font licensing en definitieve Tonight composition blijven later.
