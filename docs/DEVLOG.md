# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

---

## 13 september 2026, 09:56 CEST — PR #6 veroorzaakt iPhone-startcrash; main teruggezet naar runnable Guide

### Toestelbewijs
Na het binnenhalen en starten van de PR #6-versie meldde de product owner op de iPhone: Expo start, vervolgens een wit scherm en daarna een crash. Daarmee is PR #6 ondanks groene CI **niet fysiek geaccepteerd**.

### Actie
De PR #6-runtimewijzigingen zijn uit main gehaald door `GuideView.tsx`, `geometry.ts`, `layout.ts` en `layout.test.ts` terug te brengen naar de eerder op de iPhone draaiende PR #5-versies. Rollbackcommit: **`f7c9f73568341d29e518be21e0de071e4ef7877d`**.

De drie productrequirements uit de 09:20-test blijven geldig en moeten later veiliger worden herbouwd:
- partial-left programmatitel hoort tijdens drag/momentum mee te bewegen;
- Vandaag/Morgen-selectie moet direct visueel reageren;
- **Vandaag · Morgen · Nu** hoort op één regel te blijven, met begrensde scaling alleen voor deze compacte labels indien nodig.

### Diagnose
PR #6 introduceerde per-programme Reanimated animated styles over de volledige realistische 48-zenderfixture. Dat is een sterke kandidaat voor de native startregressie, maar zonder native foutlog is de oorzaak **nog niet bewezen**. Dezelfde architectuur wordt niet opnieuw ingevoerd zonder runtimebewijs.

### Verificatie
CI voor de rollback draait afzonderlijk; toestelstabiliteit moet opnieuw fysiek worden bevestigd. CI alleen kan deze regressie niet uitsluiten, omdat de eerdere PR #6 PR- en main-CI beide groen waren terwijl Expo Go op het echte toestel crashte.

### Volgende stap
Main schoon binnenhalen en alleen bevestigen dat Teevee weer normaal opent. Als de crash blijft bestaan: laatste Expo-/Terminalfout vastleggen voordat verdere UX-aanpassingen worden gedaan.

---

## 13 september 2026, 09:34 CEST — PR #6: live titelmotion en Vandaag/Morgen/Nu gebouwd, later teruggedraaid

De 09:20 iPhone-test van PR #5 vond drie UX-punten: titelverankering pas na loslaten, niet-directe actieve dagstatus en de wens om Vandaag/Morgen/Nu altijd op één regel te houden. PR #6 probeerde dit op te lossen met een gedeelde viewportwaarde en per-programme animated styles, plus compacte éénregelige controls.

Eerste CI #91 faalde alleen door een verouderde Reanimated-testmock; de implementatie werd vereenvoudigd zonder quality gates uit te zetten. Final PR-CI #92 en main-CI #93 waren groen. De fysieke iPhone-startcrash hierboven maakte die technische verificatie onvoldoende; de runtimewijzigingen zijn teruggedraaid.

---

## 13 september 2026, 09:12 CEST — PR #5: geometry-safe partial-left readability

Voor programmablokken waarvan de echte start links achter de vaste zenderrail ligt, kan de innerlijke titel/tijd na drag/momentum naar het zichtbare restant verschuiven zonder startpositie, duur of blokbreedte te vervalsen. Te krappe starttijdlabels worden verborgen in plaats van fragmentarisch getoond. PR #5 en main-CI waren groen.

De iPhone-test om 09:20 bevestigde dat dit inhoudelijk werkte, maar dat het opnieuw verankeren pas na loslaten gebeurde; daarom blijft continue beweging een open requirement.

---

## 13 september 2026, 09:01 CEST — Grote-tekstcorrectie fysiek geaccepteerd

Op dezelfde iPhone en duidelijk vergrote systeemtekst bleven `Gids`, `Nu`, daglabels en tijdas volledig leesbaar na PR #4. Zenderrail/programmarijen bleven uitgelijnd en programmadetail plus `Sluiten` bleven bereikbaar. Geen interne detail-ScrollView toegevoegd zonder concreet bereikbaarheidstekort.

---

## 13 september 2026, 08:40 CEST — Dynamic Type en logo-ready kanaalidentiteit

Totaal kreeg schaalbare rij-, zender- en tijdasgeometrie. Bij grotere tekst krijgt programmatitel voorrang boven secundaire metadata. Kanaalidentiteit is technisch voorbereid op **logo primair, naam secundair**, met volledige accessibility-naam en tekstfallback. PR #3 en main-CI waren groen.

---

## 13 september 2026, 08:05 CEST — Drie Guide-presentaties vastgelegd

PRODUCT/UX leggen vast:
- **Totaal** = 2D-grid;
- **Per zender** = verticale dagplanning van één zender;
- **Nu & Straks** = compacte all-channel lijst op één gedeeld referentietijdstip vandaag, zonder datumselector, met tijdselector en `Nu` voor live/current mode.

---

## 13 september 2026, 07:46 CEST — Swipe-down detail fysiek geaccepteerd

De product owner beoordeelde detailrespons en swipe-down dismissal als **"perfect"**. Button-close en outside-tap close blijven eveneens geaccepteerde routes. PR #2 en main-CI waren groen.

---

## 13 september 2026, 07:04 CEST — Scrollbaseline fysiek geaccepteerd

Standaard platforminertie, native bounce/directional lock, doorlopende tijdlijn, dagovergang en geanimeerde `Nu` zijn op iPhone kwalitatief als **"perfect"** beoordeeld. Niet retunen zonder concreet regressiesignaal.

---

## 11 september 2026 — Phase 1 bootstrap

Projectfoundation, deterministische EPG-fixture, Expo/React Native strict TypeScript, eerste 2D Guide, detailmodal, current-time/progress, runtime-aligned Amsterdamse fixture, CI en device-workflow zijn opgebouwd. De fixture is later uitgebreid naar 48 synthetische zenders voor realistischer scroll- en rendergedrag.

---

## Doorlopende open technische punten
- iPhone-startstabiliteit na rollback eerst opnieuw bevestigen.
- Daarna éénregelige Vandaag/Morgen/Nu-controls en directe selected-state veilig herintroduceren zonder de crashgevoelige per-programme animation-opzet.
- Continue partial-left title motion vereist een lager-overhead ontwerp vóór nieuwe implementatie.
- Android gesture/back en release-achtige performance zijn nog niet fysiek gevalideerd.
- VoiceOver/screenreader, live theme switching en expliciete current-time/progress-validatie staan open.
- Finite fixture lifecycle rond resume na middernacht/expiry staat open.
- CI genereert nog een lockfile vóór `npm ci`; 15 moderate advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall en final visual design liggen buiten deze directe Phase 1-stabiliteitsstap.
