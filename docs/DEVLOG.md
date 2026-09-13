# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

---

## 13 september 2026, 10:20 CEST — PR #7 volledig fysiek geaccepteerd

### Toestelbewijs
Op dezelfde iPhone en dezelfde vergrote systeemtekst bevestigde de product owner nu alle vier de gerichte PR #7-punten:
1. Teevee opent normaal;
2. `Vandaag`, `Morgen` en `Nu` blijven op één horizontale regel;
3. Morgen/Vandaag reageren direct met de juiste zwarte selected-state en `Nu` keert terug naar de actuele tijd;
4. horizontaal scrollen voelt nog hetzelfde/natuurlijk als de eerder geaccepteerde baseline.

Daarmee is de veilige non-Reanimated controlherimplementatie volledig fysiek geaccepteerd voor haar bedoelde scope. De PR #6-startcrash is niet teruggekeerd en de scrollbaseline is niet verslechterd.

### Nog open
De continue partial-left titelbeweging tijdens drag/momentum is bewust nog niet opnieuw gebouwd; PR #5-settled readability blijft actief. De PR #6-aanpak met per-programme Reanimated/workletstyles wordt niet opnieuw gebruikt zonder sterkere runtimebasis.

### Volgende stap
Bouw de continue partial-left titelbeweging opnieuw via een geïsoleerde, lager-overhead overlay/update-route die alleen de zichtbare randinhoud bijwerkt en de echte programmegeometrie, geaccepteerde scrollinstellingen, PR #7-controls en detailinteracties intact laat.

---

## 13 september 2026, 10:14 CEST — PR #7 fysiek bevestigd voor startup, éénregelige controls en directe selected-state

### Toestelbewijs
Op dezelfde iPhone en dezelfde vergrote systeemtekst bevestigde de product owner drie van de vier gevraagde PR #7-punten:
1. Teevee opent normaal;
2. `Vandaag`, `Morgen` en `Nu` blijven op één horizontale regel;
3. Morgen/Vandaag reageren direct met de juiste zwarte selected-state en `Nu` keert terug naar de actuele tijd.

Dit bevestigt dat de veilige non-Reanimated controlherimplementatie de eerdere PR #6-startcrash niet opnieuw introduceert en dat de twee bedoelde controlrequirements fysiek werken.

### Nog open
De vierde observatie — of horizontaal scrollen op deze PR #7-build nog exact hetzelfde aanvoelt als de eerder geaccepteerde baseline — is nog niet beantwoord. Dat wordt niet stilzwijgend als akkoord geïnterpreteerd.

De continue partial-left titelbeweging tijdens drag/momentum is bewust nog niet opnieuw gebouwd; PR #5-settled readability blijft actief.

### Volgende stap
Alleen nog bevestigen of horizontaal scrollen ongewijzigd/natuurlijk aanvoelt. Bij akkoord is PR #7 fysiek afgerond en kan het lagere-overhead ontwerp voor continue partial-left titelbeweging worden uitgewerkt.

---

## 13 september 2026, 10:08 CEST — Rollback fysiek hersteld; controls veilig opnieuw opgebouwd

### Toestelbewijs
Na de rollback van PR #6 bevestigde de product owner op dezelfde iPhone dat Teevee **weer normaal opent**. Daarmee is de rollback naar de PR #5-runtimebaseline fysiek bevestigd; de white-screen/startcrash is op die baseline verdwenen.

### Veilige vervolgstap
PR #7 herintroduceert uitsluitend de twee controlwijzigingen uit de 09:20-feedback, zonder Reanimated/worklets of nieuwe per-programme animated styles:
- Vandaag, Morgen en Nu staan op één horizontale regel;
- alleen deze compacte labels begrenzen scaling tot 1.2x;
- Morgen is het zichtbare label, met werkelijke datum in accessibility-context;
- expliciete Vandaag/Morgen-selectie wordt direct actief en wordt tijdens de eigen animated jump niet tijdelijk door tussenliggende scroll-events teruggezet;
- Nu zet de dagstatus terug naar vandaag/current time.

De live tijdens-swipe titelverplaatsing uit PR #6 blijft bewust uitgeschakeld. PR #5 blijft de veilige geometry-safe settled-update leveren totdat een lager-overhead ontwerp is gekozen.

### Verificatie
PR #7 head **`67925d17913f5eac1aa00417f17bbf880e3724a9`** passeerde CI #104 / run `34746652205` volledig. PR #7 is gesquasht naar main als **`c697c4e7b9bb026409962f319d26cebad75a3a56`**.

Main-CI #105 attempt 1 faalde al bij `npm install --package-lock-only` op een externe npm `ETARGET` voor `@csstools/css-calc@^3.4.0`; er draaide nog geen projectcode of test. De rerun van exact dezelfde SHA, attempt 2, passeerde installatie, strict TypeScript, lint, alle tests en iOS/Android/web exports volledig.

### Volgende stap
Op dezelfde iPhone met dezelfde grotere systeemtekst alleen controleren dat de nieuwe main nog normaal opent, Vandaag/Morgen/Nu op één regel blijven, Vandaag/Morgen direct de juiste zwarte selected-state tonen, Nu teruggaat naar current time en de geaccepteerde horizontale scroll ongewijzigd aanvoelt.

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
De rollbackcode passeerde CI #101. De fysieke bevestiging dat de app daarna weer normaal opende staat in de entry hierboven.

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
- Continue partial-left title motion vereist een lager-overhead ontwerp en implementatie; de PR #6 per-programme worklet-opzet blijft uitgesloten.
- Android gesture/back en release-achtige performance zijn nog niet fysiek gevalideerd.
- VoiceOver/screenreader, live theme switching en expliciete current-time/progress-validatie staan open.
- Finite fixture lifecycle rond resume na middernacht/expiry staat open.
- CI genereert nog een lockfile vóór `npm ci`; 15 moderate advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall en final visual design liggen buiten deze directe Phase 1-stabiliteitsstap.
