# Teevee Development Logboek

Doel: een begrijpelijk en leesbaar overzicht van wat de autonome development-agent heeft gewijzigd, waarom dat is gedaan, wat daadwerkelijk is gecontroleerd en wat de volgende stap is.

`docs/PROJECT_STATE.md` is de canonieke actuele toestand. Dit logboek bewaart de chronologie. Historische vermeldingen zijn compact gehouden; technische details blijven ook terugvindbaar in commits, PR's en CI-runs.

## Logboekregels
- Voeg voor iedere substantiële development-increment een nieuwe vermelding bovenaan toe.
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst wat er voor product/gebruiker veranderde, daarna techniek/verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem fouten/blokkades expliciet.
- Sluit iedere vermelding af met de eerstvolgende developmentstap.

---

## 13 september 2026, 09:34 CEST — Titels bewegen nu tijdens de swipe; Vandaag/Morgen/Nu op één regel

### Toestelbewijs 09:20
De product owner hertestte de partial-left readability-oplossing van PR #5 op de iPhone met vergrote systeemtekst en leverde een screenshot met beeldtijd 09:20 plus drie concrete bevindingen:
- programmanaam kwam pas opnieuw in beeld nadat de swipe werd losgelaten; gewenst is dat de titel tijdens drag en momentum continu met het zichtbare restant meebeweegt;
- na een expliciete Today/next-day tap liep de zwarte actieve dagstatus niet betrouwbaar/direct mee;
- de primaire tijdnavigatie hoort altijd één regel te blijven: **Vandaag · Morgen · Nu**. `Morgen` vervangt de weekday/date als compact zichtbaar label. Alleen deze compacte labels mogen lokaal in font scaling worden begrensd om de rij intact te houden.

PR #5 is daarmee niet als finale fysieke interactie geaccepteerd, hoewel de geometry-safe basis behouden blijft.

### Wat is veranderd in PR #6
- de bestaande horizontale `onScroll` schrijft viewport-x direct naar een Reanimated shared value;
- per programme verschuift en verkleint alleen de innerlijke title/time-container via animated styles, zodat de titel tijdens de swipe en momentumbeweging blijft aansluiten op het zichtbare restant;
- de echte block-left en duration-width blijven onaangetast;
- starttijd wordt live verborgen zodra hij niet meer compleet past;
- een expliciete Vandaag/Morgen-tap zet de active state meteen en beschermt die tijdens de eigen geanimeerde jump tegen een tijdelijke scroll-driven terug-flip;
- `Vandaag`, `Morgen` en `Nu` renderen op één horizontale regel;
- alleen deze drie compacte control-labels gebruiken `maxFontSizeMultiplier=1.2`; Guide-content en programmageometrie blijven grotere systeemtekst ondersteunen;
- het accessibility-label van `Morgen` bevat de echte datum.

### CI-verloop
De eerste PR #6-run **CI #91 / `34745304913`** vond een test-harnessprobleem: de eerste variant gebruikte `useAnimatedScrollHandler`, maar de bestaande Reanimated testmock bood die export niet. Typecheck en lint waren al geslaagd; twee integratietests faalden puur op de mock. Er is geen check uitgezet.

De implementatie is daarna vereenvoudigd naar de bestaande RN-scroll-eventstroom plus een Reanimated shared value. De finale PR-head **`fd80c4d66cb6bab2b57f39f7ca12104fe9b419ce`** passeerde **CI #92 / run `34745389220`** volledig: installatie, strict TypeScript, lint, alle tests en iOS/Android/web Expo exports.

PR #6 is gesquasht naar main als **`dd01a36055e4f2f7841d4a1b9ecf8461e3820002`**. De exacte merge passeerde ook **main-CI #93 / run `34745481415`** volledig met dezelfde gates.

### Volgende stap
Op dezelfde iPhone en dezelfde grote tekststand controleren dat (1) partial-left programmatitels al tijdens drag én momentum continu meebewegen, (2) Vandaag/Morgen/Nu op één regel blijven, en (3) een tap op Morgen/Vandaag onmiddellijk de juiste zwarte geselecteerde state toont. `Nu` moet terugkeren naar vandaag/de actuele tijd. Alleen een concrete scrollregressie melden.

---

## 13 september 2026, 09:12 CEST — Begintekst van deels verborgen programmablokken leesbaar gemaakt

### Wat is veranderd
De aparte readability-increment voor programma's die links achter de vaste zenderrail beginnen is gebouwd in PR #5. De echte programmageometrie blijft onaangetast: startpositie en blokbreedte blijven rechtstreeks uit start- en eindtijd volgen.

Alleen de inhoud binnen het bestaande blok reageert op de horizontale viewport. Na het einde van een drag of momentum wordt berekend hoeveel van het blok links niet meer zichtbaar is. Titel en eventuele starttijd schuiven vervolgens binnen hetzelfde blok naar het zichtbare restant. De tekstcontainer krijgt alleen de resterende zichtbare breedte, zodat een titel eerlijk ellipst in plaats van aan een willekeurige viewportgrens hard te worden afgesneden. Is er te weinig ruimte om een starttijd volledig te tonen, dan wordt die tijd niet getoond; de volledige titel en tijden blijven wel in het accessibility-label beschikbaar.

De readability-offset wordt niet op ieder scrollframe in React-state gezet. Daarmee vermijden we een volledige render van de zware Guide op scrollfrequentie. Scrollinertie, bounce, directional lock, dag/Nu-semantiek en detail-dismissal zijn niet aangepast.

### Verificatie
De pure geometry-tests dekken volledig zichtbare blokken, gedeeltelijk links verborgen blokken en de drempel waaronder een volledige starttijd niet meer betrouwbaar past.

PR #5 exact head **`de308881e102b40d4f7739944b32c0c5e9e22888`** passeerde **CI #86 / run `34744460640`** volledig: installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

PR #5 is gesquasht naar main als **`1e8aa125819472eb6ac76b0a41c0243973c4a003`**. De daaropvolgende **main-CI #87 / run `34744549991` is eveneens geslaagd** met dezelfde gates.

### Nog te valideren
CI bewijst niet hoe het opnieuw verankeren van tekst na een horizontale swipe op het echte toestel aanvoelt. De increment is daarom technisch groen maar nog niet fysiek geaccepteerd.

### Volgende stap
Op de iPhone Totaal horizontaal verschuiven totdat een langer programmablok links gedeeltelijk achter de zenderrail ligt, de swipe volledig laten uitrollen en controleren dat titeltekst uit het zichtbare restant begint zonder de blokgeometrie te veranderen. Een starttijd moet volledig zichtbaar zijn of ontbreken, nooit als fragment. Meld ook alleen als de eerder geaccepteerde horizontale scroll ineens springerig aanvoelt.

---

## 13 september 2026, 09:01 CEST — Grote-tekstcorrectie fysiek geaccepteerd

### Toestelbewijs
De product owner leverde na de PR #4-correctie een nieuwe iPhone-screenshot aan met beeldtijd 08:59, op dezelfde duidelijk vergrote systeemtekststand.

De eerdere concrete chrome-defecten zijn opgelost:
- `Gids` is volledig zichtbaar en niet meer verticaal afgesneden;
- `Nu` is volledig zichtbaar;
- `Vandaag` en `Ma 14 Sep` zijn volledig leesbaar zonder ellipsis;
- tijdaslabels zoals `08:30`, `09:00` en `09:30` zijn volledig leesbaar;
- zenderrail en programmarijen blijven visueel uitgelijnd;
- programme-title tekst vertoont niet meer de eerdere line-height clipping.

Daarmee is de gerichte Dynamic Type/chrome-increment op deze iPhone **fysiek geaccepteerd**. De eerder geaccepteerde scroll- en dismissal-baselines zijn niet heropend.

### Afzonderlijk open readability-punt
De screenshot laat opnieuw zien dat programma-inhoud bij horizontale offset gedeeltelijk achter de vaste zenderrail kan verdwijnen. Dit bestond al vóór PR #4 en is geen regressie van de grote-tekstcorrectie. Een smal programmablok kan bovendien terecht ellipsen wanneer de echte duur weinig horizontale ruimte geeft; de oplossing mag de tijdgeometrie niet vervalsen.

De blauwe zwevende tandwielknop overlapt opnieuw de UI, maar de herkomst is nog steeds onbekend en hij wordt niet als Teevee-productchrome behandeld.

### Verificatie
De relevante appcode blijft de op main geïntegreerde PR #4: merge `4f4fa94c6b1968ca03bb551fde9bb7ed376b2113`, waarvoor main-CI #75 / run `34743812493` succesvol was. De nieuwe 08:59-screenshot levert het ontbrekende fysieke layoutbewijs.

### Volgende stap
Pak nu uitsluitend het afzonderlijke readability-probleem aan waarbij gedeeltelijk zichtbare programmablokken achter de vaste zenderrail hun begintekst verliezen. Behoud echte programma-start, duur en blokpositie; verander de geaccepteerde scrollinertie, bounce en detailinteracties niet.

---

## 13 september 2026, 08:55 CEST — Grote-tekstdefect op iPhone gevonden en gericht gecorrigeerd

### Toestelbewijs
De product owner testte Totaal op dezelfde iPhone met systeemtekst duidelijk groter dan normaal. De zenderkolom en programmarijen bleven volgens de gebruiker netjes uitgelijnd. Ook bleef een programmadetail inclusief `Sluiten` bereikbaar.

De aangeleverde screenshot van 08:44 liet tegelijk een concreet probleem zien: `Gids` werd afgesneden en de dagknoppen toonden geellipste labels zoals `Van...` en `Ma 1...`. De Guide-chrome en tijdgeometrie waren bij deze fontscale nog te krap.

### Wat is veranderd
PR #4 maakte de large-text variant responsiever zonder de eerder geaccepteerde interacties opnieuw af te stellen: vaste line-heights zijn verwijderd en de horizontale minuten-schaal/labelruimte groeide mee met systeemtekst. De toenmalige stacked-controloplossing is later door PR #6 vervangen door de expliciet gewenste éénregelige Vandaag/Morgen/Nu-navigatie.

Omdat de detailinhoud op het toestel bereikbaar bleef, is **geen interne ProgrammeDetail-ScrollView toegevoegd**. Dat voorkomt onnodige complexiteit rond reading-scroll versus swipe-to-dismiss zolang er geen concreet bereikbaarheidstekort is.

### Verificatie
PR #4 exact head `536de5b778725d2f91dba3f734c4efecd8d78028` passeerde CI #74 / run `34743728065`; merge `4f4fa94c6b1968ca03bb551fde9bb7ed376b2113` passeerde main-CI #75.

---

## 13 september 2026, 08:40 CEST — Totaal aangepast voor grotere systeemtekst

De eerste Dynamic Type/layout-increment is gebouwd via PR #3. Totaal leest `fontScale` en laat rijhoogte, zenderrail en tijdas meegroeien. Bij grotere tekst krijgt de programmatitel voorrang boven secundaire metadata. `Nu` en dagbediening hebben minimaal 44 logische punten touchhoogte.

Kanaalidentiteit is voorbereid op **logo primair, naam secundair** met een volledige accessibility-naam en tekstfallback wanneer logo-artwork ontbreekt/faalt. De synthetische fixture bevat bewust geen echte logo's.

PR-head `4c67e6cfc369e0b0f54c93ecd26bfc457336f631` passeerde CI #69. De merge `da61b3cf10f8bf79e552f2b3eacdb289439810ce` passeerde main-CI #70. De documentatiestatus `a858525ac40c4c4807a6e1a9e0afa6fc77eadf9f` passeerde CI #71.

---

## 13 september 2026, 08:23 CEST — Logo-eerst en Dynamic Type als producteis

Vastgelegd dat het zenderlogo primair mag zijn, met zendernaam kleiner/secundair maar niet verwijderd. De volledige naam blijft beschikbaar voor toegankelijkheid en als fallback. Grotere systeemtekst is expliciet productkwaliteit: de Guide mag minder compact worden om essentiële inhoud leesbaar te houden.

---

## 13 september 2026, 08:11 CEST — Dark-modebeelden beoordeeld

De reeds aangeleverde dark-mode Guide- en detailbeelden zijn vastgelegd in DEVICE_TEST_REPORT. Visueel bruikbare basis, maar geen formele contrastgoedkeuring. Concrete open bevindingen waren willekeurige woordbreuk in lange synthetische zendernamen en gedeeltelijk verborgen programme-/tijdtekst bij horizontaal scrollen achter de vaste zenderrail. Het blauwe zwevende tandwiel in een screenshot heeft onbekende herkomst en is niet als Teevee-UI aangemerkt.

---

## 13 september 2026, 08:05 CEST — Drie Guide-presentaties en Nu & Straks-semantiek

PRODUCT/UX/projectstatus leggen vast:
- **Totaal** = huidige 2D-grid;
- **Per zender** = verticale dagplanning van één zender met datumkeuze;
- **Nu & Straks** = compacte lijst over alle gekozen zenders op één gedeeld referentietijdstip.

Belangrijkste correctie: Nu & Straks heeft **geen datumselector**, maar een tijdselector binnen vandaag. Start is live/current; na bewegen is de tijd gepind; `Nu` herstelt live. Alle zenders gebruiken hetzelfde `referenceTime`. Gaps worden eerlijk getoond en een geselecteerd verleden/toekomstmoment wordt niet als live gelabeld. Geen nieuwe primary tabs geautoriseerd.

---

## 13 september 2026, 07:46 CEST — Swipe-down detail op iPhone geaccepteerd

Na de gerichte hertest antwoordde de product owner **"perfect"**. Daarmee is de swipe-dismiss change set kwalitatief geaccepteerd naast button/outside-tap close. Dit is geen individuele meting van ieder gesture-randgeval en geen toegankelijkheids-/Androidgoedkeuring.

---

## 13 september 2026, 07:36 CEST — Programmadetails naar beneden wegvegen

Swipe-down dismissal toegevoegd met bestaande Gesture Handler 2 + Reanimated 4/Worklets. Kleine/afgebroken drags veren terug; een duidelijke neerwaartse drag/flick sluit. Upward reversal, multitouch en annulering worden afgevangen. Bestaande button, backdrop, accessibility escape en Android back blijven bestaan. Native Modal-slide blijft exitmechanisme.

Eerste nieuwe CI (#57) faalde op strikte callbacktypes in de testmock. Dat is opgelost zonder checks uit te schakelen. CI #58 en latere PR-CI #60 slaagden. PR #2 is geïntegreerd als `1242f7d64f8abc594f11f043459e07893a25e5b6`; main-CI #61 (`34740881328`) slaagde.

---

## 13 september 2026, 07:18 CEST — Programmadetail losgemaakt van zware Guide-render

Detailselectie verhuisde naar een kleine route-state met stabiele callbacks en memoized GuideView. ProgrammeDetail werd afzonderlijk gerenderd; geselecteerde tekst blijft staan tijdens native dismissal. Button/backdrop blijven afzonderlijke sluitroutes. Geen wijziging aan Guide-scrollinstellingen.

Eerste PR-run #52 vond een React DOM-types versieconflict; versiegrens is gecorrigeerd zonder force-upgrade. PR-CI #53 slaagde. PR #1 is geïntegreerd als `1211630a424f61b83079d695df0cefa24c80c5d6`; main-CI #56 slaagde. De product owner beoordeelde de respons daarna als **"perfect"** en bevestigde button/outside-tap close.

---

## 13 september 2026, 07:04 CEST — Scrollbaseline op iPhone geaccepteerd

De product owner antwoordde **"perfect"** na de hertest van standaardinertie, doorlopende tijdlijn, dagovergang en geanimeerde `Nu`. Deze scrollinstellingen zijn sindsdien een geaccepteerde baseline en worden niet op gevoel opnieuw getuned.

---

## 13 september 2026, 06:58 CEST — Standaardinertie en doorlopende tijdlijn

Beide interactieve assen gebruiken `decelerationRate="normal"`, native bounce en directional lock. De runtime Guide gebruikt één doorlopende tijdlijn en 49 elapsed hours. Amsterdamse kalenderhelpers met DST/23-/25-uursdagen en jaarwisseling kregen tests. Codecommit `b13a7c5263cd663ed1d7ea35e3cfb46d70a8988a` passeerde CI #49; opvolgende documentatie passeerde CI #50.

---

## 13 september 2026, 06:28 CEST — Fixture uitgebreid naar 48 zenders

De testgids ging van 16 naar 48 synthetische zenders zodat verticale inertie op een fysiek toestel voldoende scrollafstand heeft. Geen nieuwe scrollbibliotheek/virtualisatie toegevoegd.

---

## 11 september 2026 — Phase 1 bootstrap en eerste Guide

Belangrijkste milestones van de eerste implementatiedag:

| Tijd / increment | Resultaat |
|---|---|
| 18:33 Project Foundation | AGENTS, PRODUCT, UX, ARCHITECTURE, DATA, DESIGN_SYSTEM, BUILD_SPEC, PROJECT_STATE en ADR's vormen de agent-baseline. |
| 18:35 Deterministische datalaag | Teevee Channel/Programme/GuideFixture, reproduceerbare synthetic fixture en domeintests. |
| 18:40 Expo basis | Expo/React Native, Expo Router, strict TypeScript, system-aware themes en CI-bootstrap. |
| 18:41 Eerste 2D Guide | Tijd-naar-pixel geometrie, vaste zenderkolom, horizontale tijdlijn en gesynchroniseerde verticale scroll. |
| 19:00 Detail/progress/dagwissel | Programme selecteren, detailmodal, current progress, today/tomorrow en `Nu`. |
| 19:05 Live klok | Guide current-time/progress gevoed door toestelklok, refresh elke 30 seconden. |
| 19:16 Runtime fixture | Deterministische brondata worden bij appstart relatief naar actuele Amsterdamse datum/tijd verschoven; `start:device`/`start:clean` en DEVICE_TEST_REPORT toegevoegd. |
| 19:46 Eerste iPhone-feedback | Dagpositie/scrollgedrag/bounce aangepast; latere 13-septemberincrement verving tijdelijke verschillende deceleration-instellingen door de geaccepteerde standaardinertie op beide assen. |

---

## Doorlopende open technische punten
- CI maakt nog een lockfile vóór `npm ci`; reproduceerbaarheid verdient een aparte cleanup.
- Er worden nog 15 moderate dependency-advisories gerapporteerd. Niet automatisch/gefroceerd upgraden; nooit `npm audit fix --force` zonder impactanalyse.
- Android gesture/back en release-achtige performance zijn nog niet fysiek gevalideerd.
- De finite launch-anchored fixture heeft nog lifecyclewerk rond resume na middernacht/expiry.
- PR #6 live partial-left readability en primary-controlgedrag zijn technisch groen; de gerichte iPhone-hertest staat nog open.
- Production EPG/logo/artwork rights/reliability, abonnement/paywall en final visual design liggen buiten de huidige Phase 1-validatiestap.