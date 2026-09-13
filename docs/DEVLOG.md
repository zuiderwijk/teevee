# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

---

## 13 september 2026, 14:16 CEST — PR #13 accessibility/theme technisch afgerond

### Product-/gebruikerseffect
Na de fysieke acceptatie van PR #12 is de volgende Phase 1-gate uitgevoerd: VoiceOver/screenreader-semantiek en live system-theme switching.

Voor screenreaders is de Guide nu minder redundant en ieder programma zelfstandig begrijpelijk:
- de vaste visuele zenderrail is uit accessibility-traversal gehaald; de gebruiker hoeft niet eerst 48 losse zendernamen te doorlopen;
- de visuele halfuur-tijdas is uit accessibility-traversal gehaald; programmebuttons bevatten hun eigen tijden;
- het decoratieve `TEEVEE`-eyebrow wordt niet apart aangekondigd; `Gids` blijft een header;
- programmebuttons spreken zender + titel + begin/eindtijd en voegen `nu bezig` toe wanneer relevant;
- de hint `Opent programmadetails` maakt de actie expliciet.

Programme Detail behoudt zijn bestaande modal-semantiek, accessibility escape/twee-vinger-scrub-route en expliciete close-label.

### Live theme switching
De productiehook hoefde niet aangepast te worden: `useTeeveeTheme()` gebruikt al React Native `useColorScheme()` en is daarmee op de live systeemscheme geabonneerd. Er is nu wel expliciete render-dekking toegevoegd die bewijst dat dezelfde gemounte component light → dark → light volgt zonder remount, plus een null→light fallback.

### Tests en CI
De bestaande Guide/detail-integratietest is uitgebreid om de verborgen visuele rails, self-contained programme-labels/hint en bestaande accessibility escape te bewaken. Een nieuwe `theme/useTeeveeTheme.test.tsx` test de live scheme-subscription.

PR-head **`766be594f6e8af193e3f9b364c7c6378a7c210df`** passeerde **PR CI #158 / `34756492990`** volledig: install, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

PR #13 is gesquasht naar main als **`a8651b26c2521b53d0077bbd499862c3b1b71ed2`**.

### Volgende stap
Eén kleine fysieke iPhone-gate: met VoiceOver controleren dat de vaste zenderrail/tijdas geen lange dubbele focusreeksen vormen, enkele programmebuttons laten uitspreken en Programme Detail één keer via accessibility escape sluiten. Daarna iOS Appearance Light → Dark → Light wisselen terwijl Teevee open blijft, inclusief één wissel met Programme Detail geopend. Geen scrollretour nodig.

---

## 13 september 2026, 14:07 CEST — PR #12 fysiek geaccepteerd; Guide-scroll/readabilitygate gesloten

### Toestelbewijs
De product owner leverde `ScreenRecording_09-13-2026 14-04-35_1.MP4` (10,93 s, 1170×2532). De opname is frame-voor-frame gecontroleerd op de regressie uit de 13:48-opname.

Resultaat:
- een sterke fling naar latere tijden en een sterke reverse fling terug naar eerdere tijden zijn zichtbaar;
- programmatitels blijven tijdens reverse drag/momentum gerenderd; het massale tijdelijk tekstloos worden van zichtbare blokken komt niet terug;
- de fysiek geaccepteerde PR #9 partial-left edge-title blijft coherent;
- de fysiek geaccepteerde PR #11 time-axis blijft vrij van losse `:30`/`30`-fragmenten;
- tickposities en programme `left`/`width` blijven visueel stabiel.

Daarmee is **PR #12 fysiek geaccepteerd**. De combinatie PR #9 native edge-readability, PR #11 single-mask time-axis en PR #12 stale settled-state correction is nu de bevroren Guide-scroll/readabilitybaseline.

### Technische status
PR #12 was al technisch groen op PR CI #150 / `34755583818` en gemerged als **`b76edfab972b1d6194b2cbf1460515256de0e5c4`**. De gedocumenteerde post-merge main-state passeerde daarna ook CI #154 / `34755760369` volledig.

### Volgende stap
Phase 1 gaat verder met **VoiceOver/screenreader + live system-theme switching**. Eerst technisch auditen en hardenen: decoratieve rails uit de accessibility tree waar ze dupliceren, programmebuttons self-contained maken met zender+titel+tijd, modal escape/close behouden en automatische dekking toevoegen voor live light↔dark scheme-wissels. Daarna volledige CI en alleen de minimaal noodzakelijke fysieke VoiceOver/theme-check.

---

## 13 september 2026, 13:55 CEST — PR #11 time-axis fysiek geaccepteerd; PR #12 reverse-scroll fix geïntegreerd

### Toestelbewijs
De product owner leverde `ScreenRecording_09-13-2026 13-48-10_1.MP4` (14,28 s, 1170×2532).

De PR #11 single-mask time-axisoplossing slaagt de fysieke doelstelling:
- bij de frame-voor-frame gecontroleerde overgang 13:30 → 14:00 verdwijnt 13:30 als geheel; er is geen tussenframe met alleen `:30` of `30`;
- hetzelfde whole-label gedrag is zichtbaar bij andere bemonsterde tijdsovergangen;
- verticale tickposities blijven stabiel; er is geen tijdlijnsprong;
- programmeblokken blijven geometrisch stabiel.

Daarmee is de **PR #11 time-axis mechanism fysiek geaccepteerd** en wordt de single-mask aanpak bevroren tenzij nieuw regressiebewijs ontstaat.

### Nieuwe bevinding uit dezelfde opname
Rond **7,0–7,4 s** zijn tijdens een snelle reverse scroll meerdere zichtbare programmeblokken tijdelijk volledig zonder titeltekst. De titels keren daarna terug. Dit bleek geen PR #11-maskerprobleem en ook niet de eerder vermoede extra per-tick animated workload uit PR #10.

Root cause in de oudere PR #5 settled-readability fallback:
- `readabilityViewportX` wordt pas bij drag/momentum settle bijgewerkt;
- tijdens reverse scroll kan native content al naar links bewegen terwijl die remembered viewport nog verder rechts staat;
- `programmeVisibleContent` behandelde een programma dat volledig vóór die stale viewport lag als volledig verborgen en kon daardoor `visibleWidth` tot nul reduceren;
- dat verklaart de sterke asymmetrie: forward scroll bleef grotendeels leesbaar, reverse scroll kon tekst massaal blanken.

### PR #12 — gerichte correctie
PR #12 verandert alleen de pure settled-readabilityberekening:
- re-anchoring gebeurt uitsluitend wanneer de remembered viewport daadwerkelijk door het programmaframe snijdt;
- vóór het programma of op/voorbij het programma-einde blijft de normale volledige tekstgeometrie behouden;
- PR #9 blijft verantwoordelijk voor live partial-left edge readability;
- programme `left`/`width`, native inertia/bounce/directional lock, PR #11 time-axis mask, controls en Programme Detail zijn niet gewijzigd.

Nieuwe regressietests dekken een stale viewport voorbij het programma-einde en de exacte end boundary.

### CI en integratie
PR-head **`0f00e69b3fc7d5211e8522367a8217ce360b9649`** passeerde **PR CI #150 / `34755583818`** volledig: install, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

PR #12 is daarna succesvol gesquasht naar main als **`b76edfab972b1d6194b2cbf1460515256de0e5c4`**.

### Volgende stap
Current `main` op dezelfde iPhone binnenhalen en één korte opname maken met een stevige fling naar later en daarna een stevige reverse fling terug. Te bevestigen: titels blijven tijdens reverse drag/momentum zichtbaar, PR #9 edge-readability blijft coherent, PR #11 blijft vrij van afgesneden time-label-fragmenten en programmeframes blijven geometrisch stabiel.

---

## 13 september 2026, 13:17 CEST — PR #10 fysiek afgewezen; PR #11 single-mask rebuild geïntegreerd

De 13:09-iPhone-screenrecording wees PR #10 fysiek af: rond 8,7 s bleef links alleen `30` van een verder afgeknipt tijdlabel zichtbaar. Tijdens snelle horizontale beweging verdwenen bovendien meerdere programmatitels tijdelijk terwijl de blokken zichtbaar bleven.

PR #11 verving de per-tick Reanimated-opacityarchitectuur door één `TimeAxisLeftMask` aan de vaste linker tijdasrand. Alle ticks/labels werden weer statische ScrollView-content. PR-head **`8cba485c4c24bbf5160c652a13aba685c5520b3e`** passeerde PR CI #145 / `34754026981` volledig en merge **`9ed7113bc114911218107263b6df224940d5dd09`** landde op main.

De destijds gemaakte hypothese dat extra per-tick animated workload de titelblanking veroorzaakte is later door de 13:48-opname weerlegd; PR #12 documenteert en corrigeert de echte stale settled-state oorzaak.

---

## 13 september 2026, 11:58 CEST — PR #9 fysiek geaccepteerd; PR #10 time-axisfix geïntegreerd

De 11:35-iPhone-screenrecording bevestigde dat PR #9 partial-left programmatitels tijdens drag en momentum synchroon met de native tijdlijn houdt, dat een oude edge bij het echte programma-einde verdwijnt en geen opvolger bedekt, en dat programmeframes stabiel blijven.

PR #9 werd daarmee fysiek geaccepteerd en bevroren. Dezelfde opname liet nog het losse left-edge time-axisfragment zien, waarna PR #10 als geïsoleerde label-opacitycorrectie werd gebouwd. PR #10 was technisch groen maar werd later fysiek afgewezen; zie 13:17.

---

## 13 september 2026, 11:45 CEST — Visual/UX baseline gesynchroniseerd met GitHub-docs

De visual-designthread is als accepted target baseline vastgelegd in `docs/UX.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT.md`, `docs/BUILD_SPEC.md` en `docs/PROJECT_STATE.md`.

Vastgelegd zijn onder meer premium utility, restrained chrome, logo-first channel identity, de Totaal/Per zender/Nu & Straks-richtingen, Programme Detail met `Herinner mij` + `Bewaar`, grotere-text reflow en de sticky zenderlogobalk + horizontale channel swipe voor Per zender.

Dit was documentatie; geen runtime-acceptatieclaim.

---

## 13 september 2026, 11:19 CEST — PR #9 geïntegreerd; iPhone-gate geopend

PR #9 verving de afgewezen PR #8 React-state overlay door UI-thread-gesynchroniseerde edge-geometrie. Definitieve PR-head **`8a37cef550e0558a03d0876a356e295ff4ac424b`** passeerde PR CI #128 / `34749068020`; exact main passeerde CI #129 / `34749225666`.

---

## 13 september 2026, 11:08 CEST — PR #8 fysiek afgewezen; PR #9 rebuilt

De 10:49-screenrecording toonde dat PR #8 tijdens drag/momentum achter de native ScrollView liep. Een stale opaque edge kon opvolgende programma-inhoud bedekken. Onderliggende programmeframes en native scroll bleven stabiel. PR #8 werd fysiek afgewezen ondanks groene CI.

---

## 13 september 2026, 10:35 CEST — PR #8 live partial-left titelbeweging

PR #8 bouwde de live edge-readability opnieuw met één React-state overlay in plaats van >1000 per-programme worklets. PR CI #120 en exact-main CI #121 waren groen. De latere fysieke opname wees deze architectuur alsnog af wegens synchronisatielag.

---

## 13 september 2026, 10:20 CEST — PR #7 volledig fysiek geaccepteerd

Op dezelfde iPhone bevestigde de product owner normale startup, `Vandaag · Morgen · Nu` op één regel, directe selected-state/`Nu`-terugkeer en ongewijzigd/natuurlijk horizontaal scrollgevoel.

---

## 13 september 2026, 09:56 CEST — PR #6 veroorzaakt iPhone-startcrash; rollback

PR #6 introduceerde per-programme Reanimated styles over de >1000-cell fixture. CI was groen, maar Expo Go gaf een wit scherm gevolgd door crash. Main werd teruggezet naar PR #5 (`f7c9f73568341d29e518be21e0de071e4ef7877d`), waarna startup weer normaal was. De exacte native oorzaak is niet bewezen; de high-volume workletarchitectuur blijft afgewezen.

---

## 13 september 2026, 09:12 CEST — PR #5 geometry-safe partial-left readability

Na settle kan titel/tijd binnen een gedeeltelijk links verborgen programmablok naar het zichtbare restant verschuiven zonder echte start of duur-gebaseerde breedte te vervalsen. De latere PR #12-correctie voorkomt dat een stale settled viewport deze content tijdens reverse scroll tot nul breedte reduceert.

---

## 13 september 2026, 09:01 CEST — Grote-tekstcorrectie fysiek geaccepteerd

Bij vergrote systeemtekst bleven `Gids`, `Nu`, daglabels, tijdas, zender/programmarijalignment en Programme Detail + `Sluiten` zichtbaar/bereikbaar.

---

## 13 september 2026, 08:40 CEST — Dynamic Type en logo-ready kanaalidentiteit

Totaal kreeg schaalbare rij-, zender- en tijdasgeometrie. Kanaalidentiteit is voorbereid op logo primair, naam secundair, met accessibility-naam en tekstfallback.

---

## 13 september 2026, 08:05 CEST — Drie Guide-presentaties vastgelegd

- **Totaal** = 2D-grid.
- **Per zender** = verticale dagplanning per zender, zenderlogobalk blijft beschikbaar en horizontale swipe kan naar vorige/volgende zender.
- **Nu & Straks** = compacte all-channel lijst op één gedeeld referentietijdstip vandaag.

---

## 13 september 2026, 07:46 CEST — Swipe-down detail fysiek geaccepteerd

Detailrespons en swipe-down dismissal werden door de product owner als **"perfect"** beoordeeld. Button-close en outside-tap blijven geaccepteerd.

---

## 13 september 2026, 07:04 CEST — Scrollbaseline fysiek geaccepteerd

Standaard platforminertie, native bounce/directional lock, doorlopende tijdlijn, dagovergang en geanimeerde `Nu` werden op iPhone als **"perfect"** beoordeeld. Niet retunen zonder concreet regressiesignaal.

---

## 11 september 2026 — Phase 1 bootstrap

Projectfoundation, deterministische EPG-fixture, Expo/React Native strict TypeScript, eerste 2D Guide, detailmodal, current-time/progress, runtime-aligned Amsterdamse fixture, CI en device-workflow zijn opgebouwd. De fixture is later uitgebreid naar 48 synthetische zenders.

---

## Doorlopende open technische punten
- PR #13 VoiceOver/live-theme is technisch groen; alleen de gerichte native iPhone-gate staat open.
- Android gesture/back en release-achtige performance zijn nog niet fysiek gevalideerd.
- Expliciete current-time/progress-validatie staat open.
- Finite fixture lifecycle rond resume na middernacht/expiry staat open.
- CI genereert nog een lockfile vóór `npm ci`; 15 moderate advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall, exacte productietokens/fontlicentie en de definitieve Vanavond/Tonight-modules liggen buiten deze directe Phase 1-stabiliteitsstap.
