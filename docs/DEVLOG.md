# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

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

De eerste CI-run `34761329960` werd rood doordat `app/index.tsx` aanvankelijk Totaal volledig verving. De bestaande Programme Detail-integratietest is bewust rondom de bevroren Totaal-renderboundary gebouwd; de testmock voor ScrollView heeft geen native `scrollTo`. Dit is **niet** opgelost door de oude test af te zwakken. Totaal blijft de initiële testweergave en er is een tijdelijke bottom-right `Per zender`/`Totaal` prototypeswitch toegevoegd. Daarmee blijven beide interactiemodellen direct vergelijkbaar en blijft de oude regressiegrens intact.

Verificatie:
- PR-head `67ad6133e84a632b0354721186f439858a49174f` passeerde PR CI #193 / `34761468823` volledig: `npm ci`, strict TypeScript, lint, **100/100 tests** en iOS/Android/web Expo exports;
- PR #20 is gesquasht naar `main` als `5f71cf30175a4c5686a058d86eda7f0873e99238`;
- exact die merge passeerde main CI #194 / `34761570305` volledig.

### PR #19 — native Android compile gate
Omdat fysieke Android-validatie niet beschikbaar is, is de technische Android-gate versterkt zonder hem als toestelacceptatie te presenteren:
- CI draait een schone Expo Android prebuild;
- Java 17 + Gradle worden geconfigureerd;
- `./gradlew :app:assembleDebug --no-daemon` compileert een echte debug-APK;
- gegenereerde `/android/` en `/ios/` directories zijn uitgesloten zodat Continuous Native Generation leidend blijft.

Verificatie:
- oorspronkelijke PR-head `60db410901e6a6607f6b049c8197c9593b36d251` passeerde PR CI #185 / `34760593076` volledig, inclusief native Android prebuild en Gradle debug-build;
- na PR #20 is de branch met current main verzoend als `3b72fafac09fafdc1e3a9c10134c08972301c83e`;
- PR #19 is gesquasht naar `main` als `eac7cae6df8083d4906a3ea1280c0add646dcc40`;
- op gecombineerde exact-main CI #196 / `34761643473` is de normale quality-job volledig groen; Android prebuild is groen en de Gradle debug-build liep nog op het moment van deze logentry.

Dit bewijst **niet** Android system/hardware Back, nested-gesturegedrag of realistische Android-performance. Die blijven fysiek onbewezen totdat een Android-toestel of geschikte interactieve Android-omgeving beschikbaar is.

### Volgende stap
Fysieke iPhone-acceptatie van **Per zender** op current `main`: via de tijdelijke bottom-right switch naar Per zender gaan en specifiek verticale scroll, één-zender-per-horizontale-swipe, behoud van tijd-anchor, browsable/direct-select zenderstrip, Vandaag/Morgen/Nu, Programme Detail round-trip en mixed-scroll stability beoordelen. Na acceptatie wordt **Nu & Straks** de volgende Phase 1B build.

---

## 13 september 2026, 15:38 CEST — PR #18 maakt CI-installaties reproduceerbaar

Teevee gebruikt in CI voortaan exact dezelfde vastgelegde npm-dependencygraph zolang `package-lock.json` niet bewust wordt gewijzigd. Daarmee kan een ongewijzigde `package.json` niet meer stilzwijgend tot een andere dependency-resolutie leiden tussen CI-runs.

Technisch:
- `package-lock.json` (lockfile v3) is nu committed;
- de CI-stap `npm install --package-lock-only` is verwijderd;
- CI installeert rechtstreeks met `npm ci` en gebruikt de npm-cache van `actions/setup-node`;
- er zijn geen applicatiebestanden of dependency-ranges in `package.json` gewijzigd;
- er is bewust geen `npm audit fix --force` uitgevoerd.

Verificatie:
- de eenmalige GitHub-run `34760223440` genereerde het lockbestand succesvol;
- PR #18 head `142a92d9ffdc836af063c91200a315832cff1071` passeerde PR CI #181 / `34760300933` volledig: `npm ci`, strict TypeScript, lint, tests en iOS/Android/web Expo exports;
- PR #18 is gesquasht naar `main` als `8ee173794d60cebf171b307400e5dcd21d48e488`;
- exact-main CI #182 / `34760389374` passeerde uiteindelijk volledig.

---

## 13 september 2026, 15:31 CEST — PR #15 fysiek geaccepteerd; PR #16 timing en PR #17 lifecycle afgerond

### PR #15 fysieke performanceacceptatie
De product owner leverde `ScreenRecording_09-13-2026 15-11-35_1.MP4` voor de gerichte A/B-gate.

Framevergelijking:
- direct na horizontale fling: press feedback circa **2,40 s**, eerste modal-dimming circa **2,42 s**;
- na stilstand: press feedback circa **5,72 s**, eerste modal-dimming circa **5,74 s**;
- het verschil ligt binnen ongeveer één videoframe;
- de bottom-sheetanimatie start in beide gevallen binnen grofweg twee tienden van een seconde;
- PR #9 partial-left titles blijven zichtbaar/coherent en PR #11 laat geen nieuw `:30`/`30`-fragment zien.

Conclusie: **PR #15 en daarmee de gecombineerde PR #14/#15 post-horizontal-scroll performancecorrectie zijn fysiek geaccepteerd en bevroren op iPhone.**

### PR #16 — current-time/progress accuracy
Na sluiting van de performancegate is de timinglogica gehard zonder gesture/layout-wijzigingen:
- één gedeelde `isProgrammeCurrent(programme, nowMs)` met `[start,end)` semantiek;
- progress gebruikt dezelfde `nowMs` snapshot en blijft exact geclamped;
- de progress-fill behoudt fractionele percentages in plaats van hele procenten;
- tests dekken exact begin/einde en sub-minute current-time pixelmapping.

PR-head `534b21dd1e14709553535638683078c5267f6e90` passeerde PR CI #173 / `34759584228`; merge `c65715886a81c932d6096e000a2e13aba12a1406` passeerde exact-main CI #174 / `34759721513` volledig.

### PR #17 — finite fixture lifecycle
De launch-anchored testfixture kon zonder correctie na middernacht aan gisteren blijven hangen. De lifecycle is nu kalendercorrect:
- fixture refresh wordt bepaald op Amsterdamse kalenderdag, niet op 24-uursduur;
- normale middernacht, spring-DST, autumn-DST en teruggezette toestelklok hebben tests;
- `useGuideClock` ververst onmiddellijk bij `AppState → active` en ruimt de listener op;
- GuideView bouwt bij dagwissel opnieuw `Vandaag + Morgen`, reset day state naar Vandaag en herankert de Guide naar de actuele tijd;
- `Nu` valideert eveneens eerst de fixture day.

PR-head `5ee42f8089cd2d4428c3f46e1da6cb609f78429c` passeerde PR CI #175 / `34759940178`; merge `0853cdebaccb4036ff6567c17ded444def8d5401` passeerde exact-main CI #176 / `34760047645` volledig.

### Android-audit
Programme Detail heeft al native React Native Modal `onRequestClose={requestClose}`, een Android `GestureHandlerRootView` en integratiedekking voor de native-request-close route. Dat is goede technische dekking, maar geen vervanging voor Android-devicebewijs.

---

## 13 september 2026, 15:00 CEST — PR #14 fysiek verbeterd maar niet voltooid; PR #15 geïntegreerd

### Toestelbewijs 14:49
De product owner leverde `ScreenRecording_09-13-2026 14-49-22_1.MP4` en rapporteerde:
- Programme Detail opent direct na een horizontale fling duidelijk sneller dan vóór PR #14;
- het blijft nog merkbaar trager dan een tap nadat de Guide circa twee seconden stil heeft gestaan;
- na een verticale fling opent Programme Detail wel even snel als in de still-case;
- Vandaag→Morgen blijft correct schakelen.

Daarmee is **PR #14 fysiek bevestigd als materiële performanceverbetering**, maar de latencydoelstelling is nog niet volledig gehaald. Het verschil tussen horizontale en verticale fling is sterk bewijs dat de resterende kost horizontaal-specifiek is en niet primair in Modal/Pressable zit.

### Tweede bottleneck
Code-audit wees op de oudere `readabilityViewportX` React state uit de PR #5-settled fallback. Die werd bij `onEndDrag` en nogmaals bij `onMomentumEnd` gezet. Iedere update kon de volledige realistische 48-zenders / >1000-programmacellen Guide opnieuw renderen vlak rond een programme-tap.

Sinds PR #9 volgt de edge overlay de zichtbare linker titel continu op de UI-thread, ook na settle. De oude settled state was daardoor dubbelop.

### PR #15
PR #15 verwijdert alleen die redundante zware laag:
- `readabilityViewportX` en alle setters zijn uit `GuideView` verwijderd;
- de horizontale `onEndDrag` JS callback is weg;
- `onMomentumEnd` doet alleen nog een lichte day-state eindcontrole;
- onderliggende programme content gebruikt weer de echte programme frame-breedte;
- PR #9 blijft verantwoordelijk voor partial-left readability;
- inertia, bounce, directional lock, programme `left`/`width`, PR #11 time-axis mask, PR #14 UI-thread scrollpad, Programme Detail en verticale sync zijn niet gewijzigd.

### CI en integratie
PR-head **`bf743618b3d062d8771d220fc94ae9f99cc01c87`** passeerde **PR CI #168 / `34758480218`** volledig: install, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

PR #15 is gesquasht naar main als **`48e54008d8925fe4533bdbfd44f8639c63e645bc`**.

---

## 13 september 2026, 14:42 CEST — PR #13 fysiek geaccepteerd; PR #14 eerste latencyfix geïntegreerd

VoiceOver: volgorde goed, programma self-contained uitgesproken (`NPO 1, titel, 14:00 tot 15:00`) en twee-vinger-scrub sluit Programme Detail. `ScreenRecording_09-13-2026 14-28-46_1.MP4` bevestigde daarnaast live light→dark→light in Guide en Programme Detail zonder reload. PR #13 is daarmee fysiek geaccepteerd.

Dezelfde sessie liet circa 0,7–0,9 s post-horizontal-scroll detailvertraging zien. PR #14 verwijderde de per-frame `scheduleOnRN(...)` uit horizontale `onScroll`; `scrollX` blijft UI-thread-native en day state bridge-t alleen bij echte grenswijziging. PR CI #163 en exact-main CI #164 waren volledig groen. Merge: `e7f45a04544106803b2f49fe4e086d304bf061c8`.

---

## 13 september 2026, 14:16 CEST — PR #13 accessibility/theme technisch afgerond

De vaste visuele zenderrail en tijdas zijn uit dubbele accessibility-traversal gehaald. Programmebuttons spreken zender + titel + begin/eindtijd (+ `nu bezig`) en hebben de hint `Opent programmadetails`. Programme Detail behoudt modal/escape/close-semantiek. `useTeeveeTheme()` bleek al correct live op `useColorScheme()` geabonneerd; nieuwe tests bewijzen light→dark→light zonder remount. PR CI #158 volledig groen; merge `a8651b26c2521b53d0077bbd499862c3b1b71ed2`.

---

## 13 september 2026, 14:07 CEST — PR #12 fysiek geaccepteerd

`ScreenRecording_09-13-2026 14-04-35_1.MP4` bevestigde dat programmatitels tijdens sterke reverse drag/momentum zichtbaar blijven. PR #9 partial-left readability en PR #11 time-axis bleven intact. PR #12 was technisch groen op CI #150 en main CI #154. De later door PR #15 verwijderde settled fallback was hiermee destijds veilig gecorrigeerd.

---

## 13 september 2026, 13:55 CEST — PR #11 fysiek geaccepteerd; reverse-scroll bug geïsoleerd

`ScreenRecording_09-13-2026 13-48-10_1.MP4` bevestigde whole-label time-axis disappearance zonder `:30`/`30`-fragmenten. Dezelfde opname bracht een aparte reverse-scroll titelblanking aan het licht, veroorzaakt door stale settled-readability state. Dat leidde tot PR #12.

---

## 13 september 2026, 13:17 CEST — PR #10 fysiek afgewezen; PR #11 rebuilt

De 13:09-opname liet nog een los `30`-fragment zien met per-tick Reanimated opacity. PR #10 werd fysiek afgewezen. PR #11 verving dit door één vaste UI-thread `TimeAxisLeftMask`; PR CI #145 groen, merge `9ed7113bc114911218107263b6df224940d5dd09`.

---

## 13 september 2026, 11:58 CEST — PR #9 fysiek geaccepteerd

De 11:35-opname bevestigde dat de UI-thread edge overlay partial-left programmatitels tijdens drag/momentum synchroon met de native tijdlijn houdt, bij echte programme boundaries stopt en programme geometry/scrollfeel niet wijzigt. Deze architectuur blijft de frozen readabilitybaseline.

---

## 13 september 2026, 11:08–11:45 CEST — scroll/recovery en visual baseline

PR #8 werd fysiek afgewezen omdat een React-state overlay achter native ScrollView liep. PR #9 herbouwde dit met slechts 48 kleine UI-thread edge rows. De geaccepteerde visual/UX-richting werd daarnaast vastgelegd in `UX.md`, `DESIGN_SYSTEM.md`, `PRODUCT.md`, `BUILD_SPEC.md` en `PROJECT_STATE.md`.

---

## 13 september 2026, 09:56 CEST — PR #6 crash; rollback

Een high-volume per-programme Reanimated-architectuur (>1000 worklets/styles) was CI-groen maar gaf fysiek wit scherm/Expo Go-crash. Rollback herstelde startup. Deze architectuur blijft afgewezen.

---

## 13 september 2026, 07:04–10:20 CEST — Phase 1 interaction baseline

Native scrollinertie/bounce/directional lock, doorlopende tijdlijn, `Vandaag · Morgen · Nu`, Programme Detail response/close/swipe-down, grotere systeemtekst en logo-ready kanaalidentiteit zijn in gerichte iPhone-rondes opgebouwd en geaccepteerd. De product owner beschreef de kern scroll/detailinteracties als **"perfect"** vóór de later geïsoleerde post-horizontal-scroll latencybevinding.

---

## 11 september 2026 — Phase 1 bootstrap

Projectfoundation, deterministische EPG-fixture, Expo/React Native strict TypeScript, eerste Totaal-grid, Programme Detail, current-time/progress, runtime-aligned Amsterdam fixture, CI en device-workflow zijn opgebouwd. Fixture later uitgebreid naar 48 synthetische zenders.

---

## Doorlopende open technische punten
- **Per zender:** technisch geïntegreerd; fysieke iPhone interaction acceptance is de actuele gate.
- **Nu & Straks:** volgende Phase 1B build na Per zender-acceptatie.
- Android system/hardware Back, nested gestures en realistische performance fysiek valideren zodra een geschikt Android-toestel/interactive environment beschikbaar is; native compile-CI is geen toestelacceptatie.
- Release-like performance buiten Expo Go valideren wanneer een geschikte build/device beschikbaar is.
- De eerder gerapporteerde 15 moderate dependency-advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall, productietokens/fontlicentie en definitieve Vanavond/Tonight-modules blijven latere gates.
