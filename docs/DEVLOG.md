# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

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
- op exact-main CI #182 / `34760389374` zijn `npm ci`, typecheck, lint en tests al geslaagd; de bundle-export liep nog op het moment van deze logentry en wordt daarom hier nog niet als geslaagd geclaimd.

### Volgende stap
De canonieke productgate blijft fysiek Android-testen op current `main`: startup, horizontale/verticale Guide-beweging, programme tap, system/hardware Back vanuit Programme Detail, swipe-down dismissal en een korte gemengde stability/performance-run. Security advisories worden later gericht beoordeeld; geen geforceerde audit-upgrades.

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

### Volgende stap
Fysieke Android-gate op current `main`: startup, horizontale/verticale Guide-beweging, programme tap, system/hardware Back vanuit Programme Detail, swipe-down dismissal en een korte gemengde stability/performance-run. De geaccepteerde iPhone-scrollbaseline niet retunen zonder apart regressiebewijs.

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
- Android system/hardware Back, gestures en realistische performance fysiek valideren.
- Release-like performance buiten Expo Go valideren wanneer een geschikte build/device beschikbaar is.
- De eerder gerapporteerde 15 moderate dependency-advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Per zender en Nu & Straks zijn gespecificeerd maar nog niet gebouwd.
- Productie-EPG/logo/artworkrechten, abonnement/paywall, productietokens/fontlicentie en definitieve Vanavond/Tonight-modules liggen buiten deze directe Phase 1-stabiliteitsstap.
