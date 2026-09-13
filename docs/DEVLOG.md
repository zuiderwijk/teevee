# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

---

## 13 september 2026, 19:57 CEST — Work-intake en herstel Settings PR #27

De nieuwe development-thread heeft main, alle PR-records, remote branches, code en projectdocumentatie geïnspecteerd. Alleen PR #27 was open. PR #26 en zijn iPhone-herstartgate waren al gesloten; de update stond nog op de Settings-branch. Het intakeverslag staat in `INTAKE_2026-09-13.md`.

PR #27 faalde in CI #229 op TypeScript: React Native 0.86 kan `unspecified` als systeemthema teruggeven. De resolver gebruikt nu het native type en valt veilig terug naar licht. Tests bewaken expliciete voorkeuren, live systeemwissels, herinitialisatie en behoud van een tussentijds gewijzigde Guide-voorkeur. De bestaande detailintegratietest miste daarnaast een router-mock sinds de Settings-knop was toegevoegd; ook dat is hersteld.

De Settings-knop staat nu in de normale headerlayout via een stabiele action-slot, zodat hij bestaande labels niet overlapt en Programme Detail geen onnodige Guide-rerender veroorzaakt. Headers kunnen ombreken. Instellingen gebruikt cross-platform safe-area context; de sluitknop heeft een fallback naar Gids zonder history. Tab history bewaart de terugroute naar de oorspronkelijke primaire surface.

Verificatie: lokale strict TypeScript en lint slagen zonder lintwaarschuwingen; 125 tests in 20 suites slagen. iOS-, Android- en webexports slagen. De browsercontrole is niet uitgevoerd: de lokale browserlauncher startte niet en de beschikbare cloudbrowser blokkeerde localhost met `ERR_BLOCKED_BY_CLIENT`. Er is geen emulator/adb beschikbaar. Dit is geen claim van visuele of fysieke acceptatie.

Documentatie is gereconcilieerd: gesloten Phase 1B-/tijdrail-gates, huidige preference/default-selectie, CI-exports, werkelijk geïmplementeerde architectuur en nog ontbrekende Programme Detail-acties zijn expliciet gemaakt. Geen Guide-scroll- of momentumlogica aangepast.

Volgende stap: beide vereiste CI-jobs op de nieuwe PR-head controleren, daarna mergen en alleen de bestaande kleine iPhone appearance-smoke uitvoeren.

---

## 13 september 2026, 19:22 CEST — Guide-voorkeur fysiek geaccepteerd; Settings/appearance gestart

PR #26 is na volledig groene PR-head-CI gemerged naar `main` als `03b31f1ed4dfa3508ea9e1aeacb85cc19520aa9c`. Exact-main CI #228 / `34770761263` is daarna eveneens volledig groen geëindigd: zowel `quality` als `android-native` zijn `completed/success`, inclusief de native Android debug-APK compile.

### Fysiek toestelbewijs PR #26
De product owner bevestigde op de beschikbare iPhone:
- `Per zender` kiezen → app sluiten/herstarten → `Per zender` wordt hersteld;
- `Nu & Straks` kiezen → app sluiten/herstarten → `Nu & Straks` wordt hersteld;
- de persisted Nu & Straks-route introduceert de eerdere startup-redbox niet opnieuw.

Daarmee is lokale Guide-presentatiepersistence fysiek geaccepteerd op iPhone. Dit is geen Android-deviceacceptatie. Volledig bewijs staat in `docs/PHYSICAL_EVIDENCE_2026-09-13_1919.md`.

### Phase 2 increment 3 — Settings/appearance
Branch `feat/phase2-settings-appearance` bouwt nu voort op dezelfde versioned preference-laag:
- Settings blijft secundair en wordt geen vierde primaire tab;
- `Systeem`, `Licht` en `Donker` worden expliciete lokale voorkeuren;
- de gekozen appearance moet live doorwerken in shell en Guide;
- `Systeem` blijft het toestel live volgen;
- preference-resolutie krijgt unit coverage;
- Guide scroll-/gesturemechanica blijft onaangeraakt.

### Volgende stap
Settings/appearance door PR-head typecheck, lint, tests, exports en Android-native compile halen. Alleen mergen wanneer beide vereiste jobs expliciet groen zijn; daarna een kleine iPhone appearance-smoke doen.

---

## 13 september 2026, 17:57 CEST — Phase 1B fysiek geaccepteerd; Phase 2 App Shell gestart

De residual iPhone-pass `ScreenRecording_09-13-2026 17-43-36_1.MP4` sluit de resterende interactiegates van Phase 1B voldoende om door te gaan naar de App Shell. Daarmee zijn Totaal, Per zender en Nu & Straks als interaction models bewezen op het beschikbare iPhone-toestel.

### Phase 1B eindbewijs
In de residual pass blijft Nu & Straks de verticale zendercontext behouden terwijl de referentietijd verandert, blijft Programme Detail round-trip coherent en keert `Nu` terug naar de actuele referentie. De eerdere rail-oscillatie uit de 17:07-opname keert niet terug. Per zender toont bruikbare directe selectie uit een verder gebrowsede zenderstrip, werkende `Morgen/Vandaag/Nu`-controls en Programme Detail-contextbehoud rond zenderwissels.

De owner hoefde voor deze afsluitende opname dark mode en grotere systeemtekst niet apart opnieuw te samplen. Die checks blijven expliciet als quality/hardening-gates staan; de Phase 1B-interactierisico's zelf zijn gesloten.

PR #24 exact-main CI #216 / `34765990513`, die bij de vorige status nog liep, is inmiddels ook volledig groen: zowel `quality` als `android-native` eindigden `completed/success`.

### Phase 2 increment 1 — PR #25
Branch `feat/phase2-guide-shell` start de overgang van prototypes naar één appstructuur zonder de bewezen Guide-internals te retunen.

Gebouwd:
- één typed contract voor `Totaal`, `Per zender` en `Nu & Straks`;
- een directe drie-weg selector in plaats van de tijdelijke Phase 1B cycle-knop;
- bescherming tegen een late Nu & Straks dynamic import die een nieuwere gebruikerskeuze zou overschrijven;
- Expo Router tabs voor `Gids`, `Vanavond` en `Zoeken`;
- minimale placeholders voor Vanavond en Zoeken, zonder later featurewerk naar voren te trekken;
- unit tests voor het presentation contract.

Nu & Straks blijft bewust deferred geladen. De startup-regressie uit PR #21 is daarmee niet stilzwijgend opnieuw geïntroduceerd.

### Verificatie
De eerste PR-run #219 liet strict TypeScript slagen, maar `lint` faalde op één onescaped apostrof in de Search-placeholder. Dat is een concrete codekwaliteitfout, geen runtimebevinding. De tekst is direct gecorrigeerd op de PR-branch; een nieuwe CI-run moet de volledige quality- en Android-native-gates opnieuw bewijzen voordat merge is toegestaan.

### Volgende stap
PR #25 volledig door de actuele PR-head-CI laten lopen. Alleen als alle vereiste jobs expliciet `completed/success` zijn en de PR mergeable is, mergen. Daarna één korte iPhone shell smoke-test: startup, directe Guide-selector, deferred Nu & Straks, bottom tabs, terugkeer naar Gids en Programme Detail.

---

## 13 september 2026, 17:06 CEST — Startup hersteld; deferred Nu & Straks opent fysiek op iPhone

De eerdere Phase 1B-startupregressie is nu voldoende geïsoleerd om de productgate terug te brengen naar interactieacceptatie.

### Fysiek toestelbewijs
Na PR #22 bevestigde de product owner op de beschikbare iPhone dat Teevee weer normaal start zonder de eerdere React Native-redbox. Daarmee is de fysiek bewezen Totaal + Per zender startup boundary hersteld.

PR #23 introduceerde Nu & Straks vervolgens opnieuw via deferred module loading: `NowNextGuideView` wordt pas geëvalueerd wanneer de tijdelijke Phase 1B-control expliciet naar Nu & Straks schakelt. De owner bevestigde daarna op current `main` dat **Nu & Straks daadwerkelijk opent op de iPhone**.

Daarmee is aangetoond dat de Nu & Straks-module niet algemeen onbruikbaar is: hij kan na startup succesvol evalueren en renderen. De eerdere fout blijft geïsoleerd tot de startup/module-evaluation route of een timing/cache-interactie daarin. Om die reden blijft deferred loading voorlopig de geaccepteerde Phase 1B-integratiegrens; de statische startup-import wordt niet hersteld zonder apart bewijs.

### PR #22 en #23
- PR #22: statische `NowNextGuideView`-import uit de startup-modulegraph gehaald; clean startup fysiek bevestigd.
- PR #23: Nu & Straks deferred geladen en load failure diagnostisch inline gemaakt zonder Totaal/Per zender onbruikbaar te maken.
- PR #23 quality was vóór merge volledig groen: `npm ci`, strict TypeScript, lint, tests en iOS/Android/web exports.
- PR #23 is gemerged naar `main` als `c3ee101ea29e60d0b5b1ae88cde86191f5ba4bab`.
- Exact-main CI #209 liep nog op het moment van deze entry; geen Android-deviceacceptatie wordt hieruit afgeleid.

### Conclusie
De **startup + deferred module-load gate is gesloten op iPhone**. Nu & Straks zelf is nog niet als interaction model geaccepteerd. De actieve gate bestaat uit live/browse tijdrail, stabiele verticale zenderpositie, `Nu`, `Primetime`, Programme Detail round-trip, mixed gestures, dark mode en representatieve grotere tekst. De resterende Per zender-controls/detail/theme checks kunnen in dezelfde sessie mee.

### Volgende stap
Eén gerichte iPhone-interactiesessie in Nu & Straks. Alleen op concrete toestelbevindingen itereren. Als Nu & Straks én de resterende Per zender-checks overtuigend zijn, kan Phase 1B worden afgesloten en volgt Phase 2 App Shell.

---

## 13 september 2026, 16:34 CEST — Per zender kern fysiek bewezen; Nu & Straks gebouwd en gemerged

De product owner leverde `ScreenRecording_09-13-2026 16-16-00_1.MP4` van de eerste **Per zender**-sessie op iPhone. De opname sluit de belangrijkste architectuur-/gesturevraag voldoende om Phase 1B door te zetten zonder eerst ieder secundair controlepunt af te wachten.

### Per zender — zichtbaar toestelbewijs
In de opname:
- opent Per zender rond de actuele tijd;
- blijft sterke verticale beweging door de dag coherent en stabiel;
- wisselen horizontale schedule-swipes Publiek 1 → Publiek 2 → Publiek 3 telkens één aangrenzende zender;
- volgt de actieve staat in de bovenste zenderstrip de schedule-pagina;
- blijft de bekeken wall-clock tijd bij zenderwissels materieel behouden;
- is geen white screen, crash of duidelijke gesture-collapse zichtbaar.

Daarmee is de **kern van de nested vertical-time / horizontal-channel architectuur fysiek bewezen op de beschikbare iPhone**. De opname was niet bedoeld als volledige acceptatietest. Direct browsen/tappen in de zenderstrip, `Vandaag/Morgen/Nu`, Programme Detail round-trip, dark mode en representatieve grotere tekst blijven expliciete restchecks. Ze blokkeren de tweede Phase 1B-prototypebouw niet en worden gecombineerd met de volgende toestelsessie.

### PR #21 — Nu & Straks Phase 1B prototype
Nu & Straks is daarop autonoom gebouwd op dezelfde fixture-, tijd- en Programme Detail-basis.

Technisch:
- één gedeelde referentietijd geldt voor alle 48 zenders;
- live mode volgt de actuele tijd;
- horizontale interactie met de tijdrail verlaat live mode en pint browse time;
- de rail gebruikt 30-minutenslots en native snapping, terwijl live schedule-semantiek de echte actuele minuut behoudt;
- `Nu` herstelt live mode en centreert de rail opnieuw;
- `Primetime` gebruikt voorlopig **20:30** als prototypewaarde; dit is nog geen bevroren product-/commerciële keuze;
- ieder zenderblok toont het referentieprogramma en maximaal drie volgende programma's;
- het referentieprogramma is typografisch dominant; volgende programma's tonen alleen starttijd + titel;
- live programma's tonen nuttige `Nu · tot …`-context;
- schedule-gaps tonen eerlijk `Geen programma` in plaats van een oud programma kunstmatig door te trekken;
- geen progress bars, genres, artwork, chevrons of `Daarna`-labels;
- `[start,end)`-semantiek is expliciet getest;
- tests dekken ook drie volgende programma's, gap-gedrag, dagclamping, nearest-slot en een 23-uurs DST-dag zonder 24-uursaanname;
- bestaande Programme Detail-route wordt hergebruikt;
- Totaal en Per zender zijn structureel niet gewijzigd.

De tijdelijke Phase 1B-switch in `app/index.tsx` loopt nu **Totaal → Per zender → Nu & Straks → Totaal**. Dit blijft testscaffolding en is niet de finale presentatiekeuze of persistencelogica.

Verificatie:
- finale PR-head `fb388f1fefbc9dd64891bd69e70e4b79d7bb574d` passeerde in PR CI #200 / `34762548963` `npm ci`, strict TypeScript, lint, alle tests en iOS/Android/web Expo exports;
- de Android-native prebuild in dezelfde run is groen; de langlopende Gradle debug-compile liep nog toen de mergebeslissing werd genomen;
- omdat PR #21 geen dependency- of native-configuratiewijziging bevat en alle relevante JS/TS/export-gates groen waren, is PR #21 risicogestuurd gesquasht naar `main` als `dccc02d635cb9b3189a4ea7a857b56100e2e3ab9`;
- exact-main CI #201 / `34762970766` is gestart; op het moment van deze entry zijn `npm ci`, typecheck, lint en tests groen, bundle-export en Gradle debug-compile lopen nog.

Deze CI-status bewijst geen Android-interactie. Fysieke Android-validatie blijft uitgesteld wegens ontbreken van een Android-toestel.

### Volgende stap
Eén gecombineerde iPhone-sessie op current `main`: primair **Nu & Straks** valideren (live → browse, tijdrail, `Nu`, `Primetime`, stabiele verticale zenderpositie, drie volgende programma's en Programme Detail round-trip) en in dezelfde sessie de resterende Per zender-checks meenemen. Daarna alleen nog itereren op concreet toestelbewijs; als beide presentaties geloofwaardig zijn, volgt Phase 2 App Shell met de gedeelde Guide presentation-state/navigation/persistence-architectuur.

---

## 13 september 2026, 16:07 CEST — Phase 1B gestart; Per zender geïntegreerd en Android-native CI toegevoegd

De product owner heeft geen Android-toestel beschikbaar. De fysieke Android-gate wordt daarom expliciet uitgesteld in plaats van vervangen door schijnzekerheid. Tijdens de herbeoordeling van de fasering bleek bovendien dat **Per zender** en **Nu & Straks** tijdens Phase 1 zijn gedefinieerd, nadat de oorspronkelijke fasering deze Guide-varianten nog pas in Phase 4 had geplaatst. De owner heeft de technisch logischere volgorde goedgekeurd: **Phase 1A Totaal → Phase 1B Per zender en Nu & Straks → Phase 2 App Shell**. ADR 0005 en `BUILD_SPEC.md` leggen dit vast; productiehardening blijft Phase 4.

### PR #20 — Per zender Phase 1B prototype
De eerste Per zender interaction slice is gebouwd zonder de fysiek geaccepteerde Totaal-implementatie te retunen.

Technisch:
- verticale positie vertegenwoordigt echte tijd en geen programme-row index;
- programmeblokken behouden echte start-/duur-geometrie en worden aan de Amsterdamse daggrenzen geclipped;
- één native verticale schedule-ScrollView bewaart de tijdpositie;
- een horizontale pager mount alleen vorige/huidige/volgende zender, zodat een zenderwissel dezelfde verticale tijd-anchor behoudt zonder 48 volledige pagina's tegelijk te mounten;
- de horizontale zenderstrip blijft beschikbaar, kan zelf worden gebrowsed en ondersteunt directe selectie van een zender;
- `Vandaag`, `Morgen` en `Nu` zijn aanwezig;
- Programme Detail wordt hergebruikt;
- er is geen per-frame verticale scrollbridge naar React/JS;
- fixturezenders hebben nog geen gelicenseerde logo-URL's, dus de bedoelde tekstfallback wordt getoond.

De eerste CI-run `34761329960` werd rood doordat `app/index.tsx` aanvankelijk Totaal volledig verving. De bestaande Programme Detail-integratietest is bewust rondom de bevroren Totaal-renderboundary gebouwd; de testmock voor ScrollView heeft geen native `scrollTo`. Dit is **niet** opgelost door de oude test af te zwakken. Totaal blijft de initiële testweergave en er is een tijdelijke prototypeswitch toegevoegd. Daarmee blijven interactiemodellen direct vergelijkbaar en blijft de regressiegrens intact.

Verificatie:
- PR-head `67ad6133e84a632b0354721186f439858a49174f` passeerde PR CI #193 / `34761468823` volledig: `npm ci`, strict TypeScript, lint, **100/100 tests** en iOS/Android/web Expo exports;
- PR #20 is gesquasht naar `main` als `5f71cf30175a4c5686a0586a058d86eda7f0873e99238`;
- exact die merge passeerde main CI #194 / `34761570305` volledig.

### PR #19 — native Android compile gate
Omdat fysieke Android-validatie niet beschikbaar is, is de technische Android-gate versterkt zonder hem als toestelacceptatie te presenteren:
- CI draait een schone Expo Android prebuild;
- Java 17 + Gradle worden geconfigureerd;
- `./gradlew :app:assembleDebug --no-daemon` compileert een echte debug-APK;
- gegenereerde `/android/` en `/ios/` directories zijn uitgesloten zodat Continuous Native Generation leidend blijft.

Verificatie:
- oorspronkelijke PR-head `60db410901e6a6607f6b049c8197c9593b36d251` passeerde PR CI #185 / `34760593076` volledig, inclusief native Android prebuild en Gradle debug-build;
- PR #19 is later gesquasht naar `main` als `eac7cae6df8083d4906a3ea1280c0add646dcc40`.

Dit bewijst **niet** Android system/hardware Back, nested-gesturegedrag of realistische Android-performance. Die blijven fysiek onbewezen totdat een geschikt Android-toestel of interactieve omgeving beschikbaar is.

---

## 13 september 2026, 15:38 CEST — PR #18 maakt CI-installaties reproduceerbaar

Teevee gebruikt in CI exact dezelfde vastgelegde npm-dependencygraph zolang `package-lock.json` niet bewust wordt gewijzigd.

Technisch:
- `package-lock.json` (lockfile v3) is committed;
- `npm install --package-lock-only` is uit normale CI verwijderd;
- CI installeert met `npm ci` en gebruikt npm-cache;
- geen dependency-ranges of applicatiegedrag zijn gewijzigd;
- geen `npm audit fix --force`.

Verificatie:
- eenmalige lockfile-run `34760223440` slaagde;
- PR #18 head `142a92d9ffdc836afc91200a315832cff1071` passeerde CI #181 / `34760300933` volledig;
- merge `8ee173794d60cebf171b307400e5dcd21d48e488` passeerde exact-main CI #182 / `34760389374` volledig.

---

## 13 september 2026, 15:31 CEST — PR #15 fysiek geaccepteerd; PR #16 timing en PR #17 lifecycle afgerond

### PR #15 fysieke performanceacceptatie
`ScreenRecording_09-13-2026 15-11-35_1.MP4` sloot de post-horizontal-scroll Programme Detail performancegate:
- direct na horizontale fling: press feedback circa 2,40 s, modal-dimming circa 2,42 s;
- still-Guide: circa 5,72 s / 5,74 s;
- verschil binnen ongeveer één captured frame;
- geen regressie van PR #9 partial-left titles of PR #11 time-axis clipping.

Conclusie: PR #14/#15 performancecorrectie fysiek geaccepteerd en bevroren op iPhone.

### PR #16 — current-time/progress accuracy
- gedeelde `isProgrammeCurrent(programme, nowMs)` met `[start,end)`;
- exact boundary-tests;
- één `nowMs` snapshot voor progress;
- fractionele progress-fill en sub-minute geometrytests.

PR-head `534b21dd1e14709553535638683078c5267f6e90` passeerde CI #173 / `34759584228`; merge `c65715886a81c932d6096e000a2e13aba12a1406` passeerde main CI #174 / `34759721513`.

### PR #17 — finite fixture lifecycle
- Amsterdam kalenderdag bepaalt fixture-refresh;
- tests voor normale middernacht, spring/autumn DST en teruggezette toestelklok;
- `useGuideClock` refresht op `AppState → active`;
- Guide rebuildt `Vandaag + Morgen` bij dagwissel en `Nu` valideert eerst fixture-freshness.

PR-head `5ee42f8089cd2d4428c3f46e1da6cb609f78429c` passeerde CI #175 / `34759940178`; merge `0853cdebaccb4036ff6567c17ded444def8d5401` passeerde main CI #176 / `34760047645`.

---

## 13 september 2026, 15:00 CEST — PR #14 verbeterd; PR #15 verwijdert tweede horizontale rerender-bottleneck

`ScreenRecording_09-13-2026 14-49-22_1.MP4` liet na PR #14 een duidelijke verbetering zien, maar nog verschil tussen post-horizontal-fling en still/vertical cases. Code-audit vond de resterende legacy `readabilityViewportX` React-state die op finger-up en momentum-settle de >1000-cel Guide kon rerenderen.

PR #15 verwijderde die redundante state/callbacks; PR #9 bleef volledig verantwoordelijk voor live partial-left readability. Inertia, geometry, time-axis mask, Programme Detail en verticale sync veranderden niet. PR-head `bf743618b3d062d8771d220fc94ae9f99cc01c87` passeerde CI #168; merge `48e54008d8925fe4533bdbfd44f8639c63e645bc`.

---

## 13 september 2026, 14:42 CEST — PR #13 fysiek geaccepteerd; PR #14 eerste latencyfix

VoiceOver-volgorde, self-contained programmalabels, accessibility escape en live light↔dark switching zijn fysiek bevestigd. Dezelfde sessie legde circa 0,7–0,9 s post-horizontal-scroll detailvertraging bloot.

PR #14 verwijderde de per-frame horizontale UI→JS bridge; `scrollX` bleef op de UI-thread en day-state bridgede alleen bij echte grenswijziging. PR CI #163 en main CI #164 groen; merge `e7f45a04544106803b2f49fe4e086d304bf061c8`.

---

## 13 september 2026, 14:16 CEST — PR #13 accessibility/theme technisch afgerond

Vaste visuele rail/tijdas uit dubbele accessibility-traversal gehaald. Programmebuttons spreken zender + titel + begin/eindtijd (+ nu bezig). `useTeeveeTheme()` volgt live `useColorScheme()`. PR CI #158 groen; merge `a8651b26c2521b53d0077bbd499862c3b1b71ed2`.

---

## 13 september 2026, 14:07 CEST — PR #12 fysiek geaccepteerd

`ScreenRecording_09-13-2026 14-04-35_1.MP4` bevestigde dat sterke reverse scrolling geen titels meer blankt. PR #9 en PR #11 bleven intact. De later door PR #15 verwijderde settled fallback was hiermee destijds veilig gecorrigeerd.

---

## 13 september 2026, 13:55 CEST — PR #11 fysiek geaccepteerd

`ScreenRecording_09-13-2026 13-48-10_1.MP4` bevestigde whole-label time-axis disappearance zonder losse `:30`/`30`-fragmenten. Dezelfde opname bracht een aparte reverse-scroll titelbug aan het licht, die naar PR #12 leidde.

---

## 13 september 2026, 13:17 CEST — PR #10 afgewezen; PR #11 rebuilt

Per-tick animated opacity liet nog een los `30`-fragment zien. PR #10 fysiek afgewezen. PR #11 verving dit door één vaste UI-thread `TimeAxisLeftMask`; PR CI #145 groen, merge `9ed7113bc114911218107263b6df224940d5dd09`.

---

## 13 september 2026, 11:58 CEST — PR #9 fysiek geaccepteerd

De 11:35-opname bevestigde de UI-thread edge overlay voor partial-left programme titles tijdens drag, momentum en programme boundaries. Slechts 48 edge rows dragen live animated geometry; dit blijft de frozen readabilitybaseline.

---

## 13 september 2026, 11:08–11:45 CEST — scroll/recovery en visual baseline

PR #8 fysiek afgewezen omdat React-state achter native ScrollView liep. PR #9 herbouwde dit met 48 kleine UI-thread edge rows. De geaccepteerde visual/UX-richting werd vastgelegd in `UX.md`, `DESIGN_SYSTEM.md`, `PRODUCT.md`, `BUILD_SPEC.md` en `PROJECT_STATE.md`.

---

## 13 september 2026, 09:56 CEST — PR #6 crash; rollback

Een high-volume per-programme Reanimated-architectuur (>1000 worklets/styles) was CI-groen maar gaf fysiek wit scherm/Expo Go-crash. Rollback herstelde startup. Deze architectuur blijft afgewezen.

---

## 13 september 2026, 07:04–10:20 CEST — Phase 1 interaction baseline

Native scrollinertie/bounce/directional lock, doorlopende tijdlijn, `Vandaag · Morgen · Nu`, Programme Detail response/close/swipe-down, grotere systeemtekst en logo-ready kanaalidentiteit zijn in gerichte iPhone-rondes opgebouwd en geaccepteerd. De kernscroll/detailinteracties waren stabiel vóór de later geïsoleerde post-horizontal-scroll latencybevinding.

---

## 11 september 2026 — Phase 1 bootstrap

Projectfoundation, deterministische EPG-fixture, Expo/React Native strict TypeScript, eerste Totaal-grid, Programme Detail, current-time/progress, runtime-aligned Amsterdam fixture, CI en device-workflow zijn opgebouwd. Fixture later uitgebreid naar 48 synthetische zenders.

---

## Doorlopende open technische punten
- **Phase 2 App Shell:** Settings/appearance is de actieve increment; daarna gedeelde shell/chrome, loading/error boundaries en accessibility shell-hardening.
- **Guide presentation persistence:** fysiek geaccepteerd op iPhone na PR #26; Android-devicevalidatie blijft open.
- **Theme/accessibility:** explicit System/Light/Dark preference wordt nu gebouwd; Per zender en Nu & Straks representatieve grotere tekst fysiek samplen tijdens Phase 2/4 hardening.
- Android system/hardware Back, nested gestures en realistische performance fysiek valideren zodra een geschikt Android-toestel/interactive environment beschikbaar is; native compile-CI is geen toestelacceptatie.
- Release-like performance buiten Expo Go valideren wanneer een geschikte build/device beschikbaar is.
- De 15 moderate dependency-advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall, productietokens/fontlicentie en definitieve Vanavond/Tonight-modules blijven latere gates.
