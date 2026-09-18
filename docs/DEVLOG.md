# Teevee Development Logboek

Doel: chronologisch, begrijpelijk overzicht van substantiële milestones, verificatie en blokkades. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand. Granulaire CI/device-details blijven terugvindbaar in GitHub PR/commit-history en timestamped evidence-docs.

## Logboekregels
- Datum/tijd in Europe/Amsterdam waar praktisch.
- Eerst product-/gebruikerseffect, daarna techniek/verificatie.
- Claim alleen checks die aantoonbaar geslaagd zijn.
- Benoem regressies/gates expliciet.
- Iedere substantieve entry eindigt met de volgende stap.

---

## 18 september 2026 — Nu & Straks production design canonical via PR #93

De owner-approved Nu & Straks Accepted Design Refinement is canoniek gemergd. Finale exacte design-head: `18ee2b81357819b39ee35b9196d7f984ad59e9b7`; merge-commit op `main`: `21e1e61b950046fd0e77308be5a64d09721e6310`. Post-merge CI #654 is groen.

De nieuwe production handoff staat in `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`. De reeds geaccepteerde compositie blijft intact: één gedeeld reference instant, dominant reference programme, exact drie following-programme slots, Nu/Primetime, stabiele verticale channel-context, native rail fling/settle, direct Programme Detail en deferred `NowNextGuideView`.

De refinement maakt de bekende accessibility/density debt production-ready: echte niet-overlappende 44-pt iOS / 48-dp Android targets, deterministic row geometry, stacked following time/title boven fontScale 1.35, substantive Dynamic Type, Instrument Sans en expliciete light/dark/system, safe-area, VoiceOver/TalkBack en Reduce Motion-contracten. Daarnaast maakt de spec duidelijk dat strict-midnight day bounds, prototype standalone header/floating selector, 24-pt following rows, system-font styling en opacity-heavy pressed feedback runtime debt zijn en geen designauthority.

**Volgende stap:** implementeer deze production specification als één afzonderlijke HIGH-risk Nu & Straks runtime-convergence increment. Vereist: deterministic tests, exact-head CI, fysieke iPhone-validatie en daarna Independent QA. Geen nieuwe designexploration tenzij concrete implementatie-evidence een fundamentele product/UX-keuze noodzakelijk maakt.

---

## 18 september 2026 — PR #92 Programme Detail production convergence gesloten

PR #92 is na meerdere gerichte Independent QA-rondes gemergd. Finale exacte implementatie-head: `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf`; merge-commit op `main`: `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b`.

Productiegedrag is nu vastgelegd en geïmplementeerd: title-first Programme Detail vanuit alle drie Guide-presentaties, gemounte Guide/context-preserving modal boundary, `Herinner mij` met vaste vijf-minutenlead en immediate fallback, persisted `Bewaar`, contextual sticky action copies, Dynamic-Type-safe stacking, safe-area ownership en handle-zone swipe-to-dismiss.

De HIGH-risk reminderflow is tijdens QA gehard voor tijdgrenzen/resume, permission-await crossings, native reconciliation failures, cancellation-vs-`Bewaar` concurrency en Android 12+ exact-alarm special access. Android gebruikt bewust `SCHEDULE_EXACT_ALARM`, controleert `canScheduleExactAlarms()`, biedt de app-specifieke settings-route, failt gesloten bij ontbrekende/indeterminate capability en annuleert bij geverifieerde revocation eerst de native Expo scheduled request voordat lokale metadata wordt verwijderd. Bij onbevestigde cancellation blijft het notification-id inactief bewaard als cleanup-handle.

Fysieke iPhone-validatie en gerichte post-fix smoke zijn PASS. Independent QA gaf finale PASS op exact head `4a21b36c690aaa0df598dcc5ddf33ada1c790bcf`. Post-merge CI #650 op exact `main` `ba59ea72c41d0ee73c8fea30bb4de8b59454e00b` is volledig groen voor `classify`, `quality` en `android-native`, inclusief de main/release full-ABI Android build. Fysieke Android special-access interactie blijft conform projectstatus deferred wegens ontbreken van Android-hardware.

**Volgende stap:** geen nieuwe vrije designexploratie. Start Accepted Design Refinement voor de reeds geaccepteerde Nu & Straks-baseline en leg eerst de production implementation specification vast als `docs/NU_EN_STRAKS_VISUAL_CONVERGENCE.md`; daarna pas runtime Development.

---

## 18 september 2026 — PR #92 final QA fix: Android exact-alarm special-access lifecycle

Independent QA re-review bevestigde de eerdere vijf Programme Detail/reminder-fixes en vond nog één Android-blocker: `SCHEDULE_EXACT_ALARM` stond correct in de manifest, maar runtime kon niet bewijzen dat Android 12+ de speciale “Alarmen en herinneringen”-toegang daadwerkelijk had verleend voordat een reminder als actief werd opgeslagen.

De fix houdt bewust `SCHEDULE_EXACT_ALARM` aan. Teevee schakelt niet naar `USE_EXACT_ALARM`; deze reminderfunctie is een secundaire user-facing feature en de bredere, user-controlled special-access route past bij de Android/Play-policygrens. Een kleine lokale Android Expo-module exposeert exact twee platformprimitives: `AlarmManager.canScheduleExactAlarms()` en de app-specifieke `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` settings-intent. Er is geen brede native abstraction of database/state-framework toegevoegd.

Scheduling op Android 12+ is nu fail-closed: na notification-permission/channel setup moet exact-alarm capability aantoonbaar beschikbaar zijn. Ontbreekt de toegang, dan opent Teevee vanuit de expliciete `Herinner mij`-actie de relevante Android-instelling, wacht op app-resume en controleert opnieuw. Direct vóór `scheduleNotificationAsync` volgt nog een tweede capability-check tegen revocation/races. Alleen een succesvolle native schedule-call ná bewezen capability mag persisted/visible `Herinnering aan` state opleveren. iOS en de canonical vijf-minutentiming blijven ongewijzigd.

Reconciliation behandelt revocation eveneens expliciet. Voor een nog niet afgevuurde reminder met `canScheduleExactAlarms() == false` probeert Teevee eerst de onderliggende Expo scheduled notification via het bestaande notification-id te annuleren. Alleen bevestigde native cancellation levert `verified-invalid` op, waarna Programme Detail de lokale metadata mag verwijderen. Als cancellation niet bevestigd kan worden, blijft het notification-id als cleanup-handle bewaard in een inactieve `indeterminate` state; ook een indeterminate capability-check blijft metadata behouden zonder de reminder actief te presenteren. Programme Detail voert reconciliation opnieuw uit bij app-resume, zodat intrekking tijdens settings/background direct wordt verwerkt zonder een orphan native request bewust achter te laten.

Deterministische coverage dekt capability available/unavailable, settings round-trip na grant, native-boundary failure, revocation vlak vóór scheduling, confirmed native cancellation vóór lokale revocation-cleanup, cancellation failure met behoud van persisted notification-id, revocation bij reconciliation/resume, geen persisted/active reminder bij ontbrekende capability en ongewijzigde iOS scheduling. Native CI verifieert naast manifest-permission ook Expo autolinking van `TeeveeExactAlarmModule`, clean prebuild en Android APK compile.

**Volgende stap:** exact-head CI volledig groen; daarna alleen niet-Android fysieke smoke waar zinvol. Android exact-time delivery blijft conform projectstatus deferred totdat Android-hardware beschikbaar is. Independent QA moet de nieuwe exact head opnieuw beoordelen; niet mergen vóór QA PASS.

---

## 18 september 2026 — PR #92 Independent QA required-fix pass

Independent QA op Programme Detail head `22fa7a36de071a528da0192f91e7c615d37f060b` vond vijf blocking lifecycle/concurrency-contracten. De fix-pass verandert geen producttiming of Guide-architectuur: de Guide blijft gemount onder de modal en de reminder blijft exact vijf minuten vóór start, met immediate fallback binnen vijf minuten.

Android declareert nu expliciet `android.permission.SCHEDULE_EXACT_ALARM`; de native CI-gate controleert na een schone Expo prebuild dat deze permission daadwerkelijk in de gegenereerde AndroidManifest staat. Programme Detail gebruikt een boundary-driven clock die op programmastart, programma-einde en app-resume ververst, zodat `Herinner mij` en `Nu bezig` niet op een oude render bevriezen. De native reminder-service herberekent de actuele fire instant na permission/channel-awaits en weigert scheduling wanneer de programmastart inmiddels is gepasseerd.

Reminder reconciliation heeft voortaan drie expliciete uitkomsten: verified-valid, verified-invalid en indeterminate. Native query/cancel failures verwijderen het persistente notification-id niet; een aantoonbaar stale maar niet bevestigbaar gecancelde reminder wordt tegelijk niet als actief gepresenteerd. Bij async cancellation wordt na de native await altijd verse personal state gelezen en alleen de nog-identieke reminder compare-and-apply verwijderd, zodat een gelijktijdige `Bewaar`-mutatie behouden blijft.

Deterministische regressies dekken start/eind/resume, permission-prompt crossings van vijf-minutengrens en programmastart, native reconciliation failure paths en de reminder-cancel-versus-Bewaar interleaving. **Volgende stap:** exact-head CI; daarna gerichte fysieke revalidatie van de gewijzigde reminder/lifecyclepaden en Independent QA re-review. Niet mergen.

---

## 18 september 2026 — PR #88 rebased onto accepted PR #89 4/24 spacing calibration

Accepted Design Refinement PR #89 is merged on `main` and supersedes only the expanded/rest Per-zender gap distribution. PR #88 is rebased onto that canonical baseline rather than carrying its pre-#89 design documentation forward.

Runtime calibration changes only the expanded endpoints from 16/12 to **4 pt rail→temporal context** and **24 pt temporal context→schedule**. The sum remains 28 pt, so the frozen PR #81 geometry is unchanged: **140 pt** full visual contraction, **56 pt** native collapse, **84 pt** visual compensation, **112 pt** fixed viewport top and **140 pt** schedule content top inset. Condensed remains 0/52/0.

The previously accepted safe-area, collapse-isolation, programme-anchor, selected-schedule-height/trailing-whitespace, channel-switching, Nu/Primetime and theme fixes are preserved unchanged. The explicit opaque gap ownership introduced after physical validation also remains; only its accepted endpoint heights change.

Deterministic coverage proves visible rest rail→context = 4 pt, context = 52 pt, context→schedule = 24 pt, condensed gaps = 0/0, rest/settled overlay bottoms = 252/112 pt, total contraction = 140 pt and semantic native↔schedule anchor round-tripping. Full HIGH-risk exact-head CI remains required; do not merge or request Independent QA yet.

---

## 18 september 2026 — Per-zender required visual-convergence follow-up on PR #88

Physical iPhone validation of PR #88 head `75cd5f7148bab4583b335924100f2684e96b16bf` accepted the safe-area, scroll-isolation, programme-anchor, trailing-whitespace, channel-switching, Nu/Primetime and light/dark fixes. One required visual issue remained: the canonical 16-pt rail→context gap read visibly larger while the canonical 12-pt context→schedule gap read effectively absent.

The numeric 16/52/12 → 0/52/0 geometry and frozen 140/56/84 collapse math were already correct. The remaining defect was visual ownership: the two functional gaps were transparent overlay spacers while the independently scrolling schedule renders underneath the overlay. The context→schedule spacer therefore relied on the enclosing overlay background/bounds to mask schedule content, which physical iOS rendering did not preserve strongly enough as visible whitespace. Both canonical gap zones now render their own opaque semantic background while retaining the exact accepted dimensions. No metric, safe-area coordinate, programme-row geometry, semantic anchor or collapse architecture changed.

Deterministic coverage now models explicit rail, context and schedule-content boundaries and proves rest-state visible gaps of exactly 16 and 12 pt, fixed 52-pt context, and settled-condensed gaps of 0/0. Exact-head CI and renewed physical Lead validation remain required before Independent QA; do not merge yet.

## 18 september 2026 — Per-zender PR #86/#87 runtime convergence + iOS safe area + trailing whitespace

Deze HIGH-risk Guide candidate convergeert de Per-zender runtime naar de na PR #86/#87 canonical 52-only temporal context zonder de PR #81 fixed-native-viewport/collapse-isolation terug te draaien. De obsolete 88-pt wrap-state, wrap-detectie en wrap-anchorcompensatie verdwijnen; rest/condensed geometry gebruikt 16/12 → 0/0 gaps, 72→60 rail, 56 pt native collapse, 140 pt totale visuele contractie en 84 pt visual compensation. Per-zender datumlabels volgen de expliciete 06:00-regel en geselecteerde-zendertekst wordt nergens buiten de logo-rail geïnjecteerd.

De fysieke iOS-statusbar overlap kwam uit absolute Per-zender chrome/schedule-posities binnen de core React Native SafeAreaView: de safe-area padding was geen betrouwbare coordinate origin voor de absolute kinderen. De candidate gebruikt daarom de daadwerkelijke top inset uit react-native-safe-area-context één keer als origin voor zowel overlay als fixed schedule viewport; er is geen device-specifieke padding en geen tweede SafeAreaView-compensatie.

De enorme trailing whitespace kwam niet uit TV-day bounds of ontbrekende providerdata maar uit verticale ownership: scheduleHeight was het maximum van de vorige, geselecteerde en volgende horizontale pager-page. Een zender met weinig programma's erfde daardoor de scrollhoogte van een veel langere buur. De verticale contenthoogte volgt nu uitsluitend de geselecteerde zender. Een daadwerkelijk lege, authoritative selected schedule-page toont een expliciete empty state; er worden geen fictieve programma's of providerworkarounds toegevoegd.

Deterministische regressies dekken 52-only context/no-wrap, 140/56/84 geometry, safe-area coordinate calculation, geselecteerde-zender height ownership, empty-state basisgeometry en de Per-zender 06:00 Vandaag/Morgen/weekday+date-semantiek. **Volgende stap:** exact-head CI; daarna Lead fysieke iPhone product/visual validation. Nog geen Independent QA en niet mergen.

---

## 18 september 2026 — PR #81 QA required fix: 52/88 context-anchor invariant

Independent QA vond op exact head `ce030817ff64db570a0a78ec779824e7662fedd8` één blocking edge case in de verder stabiele fixed-native-viewport architectuur: `contextWrapped` kon live 52→88 of 88→52 schakelen zonder equivalente schedule-anchorcompensatie. Daardoor verschoof programme-content 36 pt wanneer bijvoorbeeld de condensed channel prefix wrapping veroorzaakte of channel/day/font/viewport-hermeting de wrap-mode wijzigde.

De required fix maakt native↔semantic schedule-offsetconversie wrap-aware en compenseert een echte wrap-mode transition éénmalig op de UI-thread: native schedule offset en collapse anchor bewegen samen ±36 pt, zodat zowel het semantic programme als zijn visuele screen anchor en de huidige collapse progress gelijk blijven. De actieve ScrollView-viewport blijft absoluut/fixed; er is geen per-frame normal-flow mutatie toegevoegd. Wrap-detectie observeert voortaan de natuurlijke flex-layout en reset de live wrap-mode niet meer kunstmatig bij channel/day/fontScale/viewport-width changes.

Deterministische regressies starten op non-zero schedule offsets en dekken 52→88→52 door condensed-prefix wrapping, channel/day remeasurement in wrapped state, Dynamic Type en viewport-width transitions, plus wrap-aware native↔semantic round-tripping en collapse-progress behoud.

**Volgende stap:** exact-head CI volledig groen krijgen, daarna alleen deze required-fix set terug naar Independent QA. Niet mergen.

---

## 18 september 2026 — PR #81 Per-zender scroll feedback root cause geïsoleerd

De blocking verticale post-swipe oscillatie is op fysieke iPhone met tijdelijke native-scrollinstrumentatie gereproduceerd en verklaard. Een control fling zonder collapse decelereerde monotonic; zodra collapse actief werd, volgden herhaaldelijk negatieve contentOffset-sprongen op positieve beweging. De limit-cycle bleef bestaan nadat de binaire React condensed-state niet meer wisselde. Daarmee was React commit-churn niet de primaire oorzaak.

Root cause: dezelfde native verticale ScrollView stuurde collapseProgress, terwijl die progress tot 148 pt normal-flow geometry boven de ScrollView wijzigde binnen 56 pt native collapse. iOS compenseerde die sibling-heightmutaties in contentOffset; die gecompenseerde offset stuurde vervolgens de tegenovergestelde collapse-state en sloot de feedbacklus.

De structurele fix houdt de native schedule-viewport vast op de settled functional-stack baseline. Guide chrome, 72→60 rail en 24→0 / 12→0 gaps blijven visueel scroll-coupled, maar staan in een absolute overlay. De schedule reserveert de 148-pt rest-inset statisch; 56 pt komt uit native scroll en de resterende 92 pt uit visual content compensation. Native↔semantic schedule-offsetconversie bewaart programme/timestamp anchors en geanimeerde Nu/Primetime-targets. Deterministische regressietests bewaken rest/mid/condensed alignment, wrapped context, de 148 = 56 + 92 contractie-invariant en semantic offset round-tripping.

De tijdelijke TEEVEE_SCROLL_* instrumentation is na het fysieke root-causebewijs volledig uit de production candidate verwijderd. De scroll-layout invariant staat duurzaam in docs/PER_ZENDER_VISUAL_CONVERGENCE.md.

**Volgende stap:** run exact-head CI op de production-clean PR #81 head en laat daarna exact die head fysiek op iPhone revalideren. Geen Independent QA en geen merge vóór owner physical acceptance.

---

## 18 september 2026 — PR #81 final Per-zender convergence: stable day-switch identity + 176-pt current row

Canonical main through PR #85 is geïntegreerd in PR #81 zonder de fixed-row runtime terug te draaien. De production spec verwijdert de grote selected-channel heading uit de rest state en vervangt de oude 120-pt current row door een ruimere 176-pt base row: current title 19/23, synopsis 15/22 maximaal vier regels, 10 pt title→description, minimaal 20 pt vrije ruimte voor de lokale 4-pt progressbar. Dynamic Type gebruikt de canonical content-safe minimumformule; standaardrows blijven uniform 52 × contentScale.

De fysieke day-switch bug had een concrete ownership-oorzaak: Per zender renderde bij een nog niet geladen non-current dag tijdelijk `buildRuntimeGuideFixture(selectedDayStartMs)`. Daardoor wisselde een reeds canonical NPO/RTL/SBS-kanaalcatalogus naar de 48-kanaals generieke fixture (`channel-1`, `Publiek 1`, `Vier`, enz.), verdwenen lokale logo-resolutions en werden rail/pager/rows plus scroll-anchor eerst voor fallback en daarna opnieuw voor canonical data opgebouwd. Dat verklaart de waargenomen structurele churn en is de primaire performance-root-cause die in deze pass is verwijderd.

De presentatie houdt broadcaster identity en programme ownership nu apart. Zodra canonical channels zijn vastgesteld, blijft die catalogus tijdens selected-day loading/unavailable staan en toont de programme-area alleen een rustige loading/unavailable state. De generieke deterministic fixture blijft uitsluitend actief in echte fixture mode. Zenderselectie wordt semantisch op channel-id bewaard in plaats van op array-index; de programma-anchor wordt pas opnieuw gezet wanneer de echte selected-day schedule beschikbaar is; pager keys blijven stabiel over dagwissels. Hiermee verdwijnen de fallback→real catalogue swap en dubbele programme-anchor reset uit de normale real-data day-switch path. Dit is deterministic/static evidence; vloeiendheid ná de fix moet nog fysiek op iPhone worden bewezen.

Dark-mode asset audit: de bestaande provenance-checked NPO-marks blijven bruikbaar. Voor RTL 4, RTL 5 en SBS6 is in de huidige geverifieerde assetbronnen geen afzonderlijke betrouwbare dark-background variant vastgesteld. Er is daarom bewust niet getint, gerecolour’d, op een generieke witte tegel geplaatst of een merkvariant nagetekend. Deze drie dark-mode marks blijven een expliciete asset-input/physical-acceptance blocker en staan ook in `docs/CHANNEL_LOGO_ASSETS.md`.

**Volgende stap:** exact-head CI op de finale PR #81 head volledig groen krijgen en daarna dezelfde head fysiek op iPhone revalideren: day switch, scrolljank, 176-pt current row, rest/condensed compositie en dark-mode logo’s. Pas na owner acceptance mag Independent QA worden aangevraagd.

---

## 17 september 2026 — PR #81 geïntegreerd met canonical Per-zender refinement en lokale channel-logo laag

PR #81 is veilig bijgewerkt met canonical `main` na Design PR #83. De nieuwe designbaseline wint voor de vier gewijzigde design/documentatiebestanden; de bestaande fixed-row runtime en eerder fysiek aangebrachte polish blijven behouden en zijn vervolgens aangepast aan de nieuwe accepted delta.

Gebouwd in de PR-branch:
- Per-zender titels 17/21 Medium en current 19/23 Bold, met 52/120 fixed-row geometry intact;
- 72-pt rest rail naar 60-pt settled condensed rail zonder 48×48 channel items te schalen;
- deterministic selected-channel recentering met rail-bounds als hoogste prioriteit en Reduce Motion zonder recenteranimatie;
- semantic Nu/Primetime current/action/disabled states op programme/timestamp anchors, inclusief Nu-precedence;
- full-row temporary `surface` press feedback zonder permanente card treatment;
- lokale provider-onafhankelijke logo registry voor NPO 1, NPO 2, NPO 3, RTL 4, RTL 5 en SBS6; provider `logoUrl` blijft secondary fallback input;
- provenance en ingest-hashes vastgelegd in `docs/CHANNEL_LOGO_ASSETS.md` en `assets/channels/SHA256SUMS`;
- deterministic coverage voor geometry/typography, rail targets, temporal-state precedence/unavailability, press surface, local-logo manifest en ChannelIdentity fallback/accessibility.

Deze entry claimt nog geen fysieke acceptatie of Independent QA. Exact-head CI-evidence hoort bij PR #81; iedere latere headwijziging maakt eerdere evidence ongeldig.

**Volgende stap:** exact-head CI voor PR #81 groen maken en daarna de owner de volledige fysieke iPhone Per-zender acceptance laten uitvoeren, inclusief minimaal één screenshot met presentation selector, echte logo's, selected channel, datum/Nu/Primetime en current programme. Pas daarna mag Independent QA worden aangevraagd.

---

## 15 september 2026 — Phase 4 television-day domain foundation gemergd

PR #62 is als eerste Phase 4 runtime-foundation increment gemergd naar `main` als `36468ed19eca7411079d2845763ca8de36c8d10f`. De wijziging legt de gedeelde productsemantiek voor televisiedagen in code vast, maar migreert bewust nog geen Guide UI, hosted loader of runtime lifecycle.

Gebouwd:
- 06:00 Europe/Amsterdam als expliciete television-day boundary;
- typed D-2..D+7 offsets en exact tien aaneengesloten television-day windows;
- DST-veilige `guideTelevisionDayStart()` en `guideTelevisionDayHorizon()` zonder canonical programme timestamps te verschuiven;
- gedeelde Amsterdam wall-clock resolver terwijl de tijdelijke Phase 3 `guideDayStart()` strict-midnight primitive behouden blijft.

De eerste onafhankelijke QA-review vond een blocking evidence-gap in de tests. Die is op de finale head `2d83c101b749083c39530ed2473103319f1311cf` gesloten met directe coverage voor exact 00:00, horizon-contiguïteit over beide 2026 DST-transities inclusief 23/25 uur, en out-of-range integer offsets. QA herbeoordeelde exact die head daarna zonder blocking of non-blocking findings. Exact-head CI run #362 was volledig groen voor `quality` en `android-native`.

Omdat deze PR alleen domain primitives/tests toevoegt en de bestaande runtime nog `guideDayStart()` + `loadTwoDayGuideSchedule()` gebruikt, was geen fysieke device-gate nodig voor deze increment.

**Volgende stap:** migreer de mobiele hosted schedule/runtime boundary van strict calendar `today + tomorrow` naar television-day-aware bounded loading/anchoring op de nieuwe 06:00 primitives, zonder in dezelfde increment de accepted Guide day-selector UI of frozen gestures te wijzigen.

---

## 15 september 2026 — Phase 3 fysiek gesloten; automatische development-EPG freshness

De volledige mobiele real-data boundary is op een fysieke iPhone geaccepteerd. De app toont eerst direct de deterministische fixture en schakelt daarna zonder crash of layoutbreuk over op canonical hosted EPG-data. Totaal, Per zender en deferred Nu & Straks blijven op echte data bruikbaar; Programme Detail opent en keert vanuit alle drie correct terug.

Aanvullende fysieke checks:
- Per zender adjacent-channel navigatie heen en terug blijft intact;
- Nu & Straks reference-time rail en verticale mixed gestures blijven coherent;
- background/resume behoudt reference time en zichtbare Guide-context;
- ontbrekende hosted coverage houdt de deterministische fixture actief;
- runtime netwerkuitval vernietigt de bestaande Guide-state niet.

Een echte no-network cold start is via Expo Go niet valide te testen omdat Expo Go na force-quit zelf Metro/netwerk nodig heeft. Dat blijft deferred naar een standalone/dev build en is geen Phase 3 blocker. Volledige evidence staat in `docs/PHYSICAL_EVIDENCE_2026-09-15_PHASE3.md`.

Om de tijdelijke development-EPG niet opnieuw handmatig te hoeven seeden, voegt PR #59 server-side automatische refresh toe:
- `pg_cron` + `pg_net` iedere zes uur;
- rolling Amsterdam-buffer voor vandaag, morgen en één rollover-dag;
- dedicated random cron-token encrypted in Supabase Vault;
- Supabase secret key blijft uitsluitend in de Edge Function omgeving;
- `epg-refresh` blijft voor `anon`/`authenticated` ontoegankelijk;
- partial current-day provider coverage wordt veilig overgeslagen in plaats van canonical coverage te beschadigen.

Live end-to-end smoke bewees de Vault-tokenroute tot en met canonical public read: 12 channels / 498 programma's vandaag, 12 / 485 morgen en 12 / 489 rollover. Anonymous direct refresh bleef 401. De tijdelijke smoke-helper is na verificatie weer inert (410) en JWT-protected.

**Verificatie:** fysieke iPhone Phase 3 gate volledig PASS. De PR moet nog exact-head CI groen hebben voordat hij mag mergen; daarna is Phase 4 de actieve fase. Physical Android blijft apart deferred.

**Volgende stap:** start Phase 4 met de shared television-day-aware D-2..D+7 schedule/day-selection foundation en wire die in Totaal en Per zender zonder de fysiek bewezen Guide gestures te retunen.

---

## 15 september 2026 — Televisiedag en minimale Guide-horizon frozen

De productowner heeft de definitieve dagsemantiek en minimale Guide-horizon vastgesteld. De Guide volgt voortaan niet een harde kalenderdaggrens om 00:00, maar een **televisiedag van 06:00 Europe/Amsterdam tot 06:00 de volgende kalenderdag**.

Producteffect:
- een gebruiker die om 00:05 opent blijft inhoudelijk in de televisieavond van de voorafgaande datum;
- iemand die om 21:00 bladert kan zonder expliciete datumwissel door naar programma's na 00:00;
- `Nu` blijft de echte actuele tijd, maar hoort tussen 00:00 en 05:59 bij de voorafgaande televisiedag;
- Totaal en Per zender moeten minimaal **D-2 t/m D+7** volledige televisiedagen ondersteunen;
- Nu & Straks blijft één actieve-dagpresentatie, maar gebruikt dezelfde 06:00-grens;
- gebruikers zien gewone datums/labels; `televisiedag` is een intern product- en architectuurbegrip.

Architectuur:
- canonical programme timestamps blijven echte UTC-instants; niets wordt verschoven om de televisiedag te simuleren;
- ADR 0008 legt de 06:00-grens, midnight continuity en D-2..D+7 vast;
- Phase 3 bewaakt dat de datalaag/query-contracten niet aan midnight of een permanente today+tomorrow-horizon worden gekoppeld;
- de huidige twee-daagse Phase 3 mobile loader blijft bewust slechts vertical-slice scope;
- Phase 4 implementeert en valideert de volledige multi-day UX, 06:00-rollover, historische/future navigatie, cache/refresh en contextbehoud;
- Phase 8 moet bewijzen dat de uiteindelijke productie-EPG de minimale horizon, historie, freshness en rechten kan leveren.

Documentatie bijgewerkt: `PROJECT_STATE.md`, `PRODUCT.md`, `UX.md`, `DATA.md`, `BUILD_SPEC.md` en ADR 0008.

**Verificatie:** documentatie-only wijziging; er is nog geen runtimegedrag gewijzigd of fysiek gevalideerd. De bestaande Phase 3 physical real-data smoke blijft ongewijzigd de actieve exitgate.

**Volgende stap:** eerst de bestaande Phase 3 iPhone real-data smoke afronden; daarna in Phase 4 de television-day-aware D-2..D+7 Guide implementeren.

---

## 14 september 2026 — Mobile Guide aangesloten op canonical hosted EPG met fixture-first fallback

PR #50 is gemergd als `b60e2501ee757a20a080de393f618101b0970f90`. Daarmee accepteert de hosted transportlaag naast normale Amsterdamse kalenderdagen ook de 25-uurs wintertijd-dag. De exacte merge-commit op `main` had CI run #315 volledig groen voor zowel `quality` als `android-native`.

PR #51 is daarna gemergd als `0886cbe61272703323ba30cd2deb9cbc037754a8`. Dit is de eerste wijziging waarbij de mobiele Guide de provider-onafhankelijke canonical hosted schedule daadwerkelijk kan gebruiken.

Gebouwd:
- dependencyvrije `HostedGuideScheduleClient` naar alleen de publieke Teevee `guide-schedule` Edge Function;
- runtime-validatie van serialized canonical schedule responses;
- Amsterdam-correcte today+tomorrow loader, inclusief 23/25-uurs DST-dagen;
- deduplicatie van programma's die over de daggrens in beide reads voorkomen;
- kleine provider-onafhankelijke in-memory runtime schedule-store;
- fixture-first startup: de eerste frame blijft volledig lokaal/deterministisch;
- automatische hosted refresh na startup, bij app-resume en na Amsterdamse dagwissel;
- offline, `unavailable`, netwerkfout, invalid response of lege hosted data laat de fixture actief;
- freshness-only updates remounten de Guide niet, zodat scroll-/zendercontext behouden blijft;
- alleen user-visible schedulewijzigingen verhogen de app-shell data-version;
- Totaal, Per zender, Nu & Straks en Programme Detail mechanics zijn inhoudelijk niet gewijzigd;
- deferred `import()` voor Nu & Straks blijft intact;
- geen SQLite, TanStack Query, nieuwe dependency of native-config toegevoegd.

Exacte PR #51 head `08497e10ab65803c1ce91ca5b3b060fdfb0166f2` had CI run #323 volledig groen voor `quality` en `android-native` vóór merge.

Live hosted prerequisite is aanwezig: `guide-schedule` Edge Function v5 en `epg-refresh` v3 zijn actief. De publieke Guide-read bevat geen provider-ID's of privileged key; database/RPC en development-providerdetails blijven achter de servergrens.

**Gate:** omdat deze wijziging voor het eerst de mobiele Guide-boundary met real data kruist, is Phase 3 nog niet gesloten. Er is nu een gerichte fysieke iPhone smoke nodig voor Totaal, Per zender, Nu & Straks, Programme Detail, fixture→real transition en contextbehoud bij resume. Android-deviceacceptatie blijft apart deferred.

**Volgende stap:** voer de gerichte iPhone real-data smoke uit en leg bewijs vast. Alleen wanneer die regressievrij is, kan de mobile real-data vertical slice als fysiek bewezen worden beschouwd en kan Phase 3 richting exit/Phase 4 worden gesloten.

---

## 14 september 2026 — Hosted schedule-store + gratis development-EPG operationeel als Phase 3 foundation

Phase 3 is voorbij de oude backend/provider-intakegate. Teevee heeft nu een eigen hosted canonical schedule-store én een vervangbare adapter voor een echte gratis Nederlandse XMLTV-feed.

### PR #40 — Supabase canonical persistence
PR #40 is gemergd als `da08c10e170ea8fe3843e16b76247eccd6c0502a` nadat exact-head CI #283 zowel `quality` als `android-native` volledig groen afrondde.

Dedicated backend:
- Supabase project `teevee` (`eokszvpityhtysbwdduy`);
- organisatie `teevee`;
- Free plan;
- regio `eu-west-2`.

Gebouwd:
- private `teevee` schema voor channels, programmes en authoritative coverage;
- transactionele `[from,to)` replacement en stale-write protection conform ADR 0007;
- covered-empty versus unavailable;
- conservative freshness;
- private tables zonder `anon`/`authenticated` toegang;
- service-role-only public RPC bridges;
- `SupabaseScheduleRepository` achter het bestaande repositorycontract.

Security advisor WARN/ERROR is na hardening leeg. RLS/no-policy INFO voor de private Teevee-tabellen is bewust: clienttoegang is volledig dicht.

### PR #42 — development-only XMLTV provider
De eigenaar koos voor Phase 3 voorlopig een gratis externe EPG. PR #42 is gemergd als `4ea4a73bb38580cc8ab0acf454ccfc5849350bab`.

`XmltvEpgProvider` gebruikt standaard `https://iptv-epg.org/files/epg-nl.xml` en blijft server-side achter `EpgProvider`.

Correctnessregels:
- expliciete XMLTV timezone-offset vereist; geldige tijden gaan naar UTC;
- malformed tijden blijven diagnosable, geen timezone-guessing;
- title/subtitle/description/category/live/repeat parsing;
- `[from,to)` programme filtering;
- alleen continue coverage over iedere gevraagde provider-channel geeft `complete`;
- gaps geven `partial`, zodat ingest geen canonical data destructief overschrijft;
- injected `fetch` houdt tests/CI onafhankelijk van internet.

De eerste CI-run vond één echte CDATA-parserbug. Die is in de parser hersteld vóór merge. Exact finale head `2af9d6cc6afb8b0618b196eebdc33b1b940d25d9` had CI #290 volledig groen voor `quality` én `android-native`.

### Live feed-inspectie — tijdelijke PR #43, niet gemergd
Omdat de agent-runtime de raw feed niet direct kon uitlezen, is een tijdelijke GitHub Actions-inspectie gebruikt. PR #43 is na succesvolle inspectie gesloten zonder merge; er staat dus geen live-feed afhankelijkheid in normale CI.

Gemeten op 14 september 2026:
- 30,237,192 bytes XML;
- 184 channels;
- 33,117 programme records;
- feedrange `20260913000600 +0000` t/m `20260919235500 +0000`;
- kern-ID's bevestigd: `NPO1.nl`, `NPO2.nl`, `NPO3.nl`, `RTL4.nl`, `RTL5.nl`, `RTL7.nl`, `RTL8.nl`, `RTLZ.nl`, `SBS6.nl`, `SBS9.nl`, `Net5.nl`, `VeronicaDisneyXD.nl` plus sport/internationale zenders.

De publieke overview-teller van IPTV-EPG.org wijkt momenteel af van de werkelijk opgehaalde feed. Daarom worden websitecijfers niet gebruikt voor coverage/correctness.

### Rechtenboundary
Deze gratis feed is **alleen development input**. Publieke bereikbaarheid is geen bewijs van commerciële/publicatierechten. Geen raw XMLTV, logo's of artwork wordt in Git opgenomen en mobile krijgt nooit een directe providerdependency.

Production EPG/logo/artwork/SLA blijft een aparte release-gate. Een geautoriseerde Bindinc/TVgids bron blijft voorkeursroute; EPGdata.tv/Gracenote blijven mogelijke commerciële alternatieven.

**Volgende stap:** een kleine expliciete real-channel catalog/mapping op basis van de bevestigde provider-ID's, daarna één server-side ingest naar Supabase en typed canonical query terug. Meet eerst de echte ~30 MB feed-kosten voordat mobile caching wordt gekozen.

---

## 14 september 2026 — Canonical repository + veilige ingest/service-keten

PR #38 (`5d997e58cd86de75a7de83367cc0e47b783657a2`) legde backend-onafhankelijke canonical schedule-semantiek vast:
- expliciete channel/time replacement scope;
- `[from,to)` intersection;
- coverage onafhankelijk van programme presence;
- covered-empty vs unavailable;
- conservative freshness;
- atomair `ignored-stale` vóór mutatie.

PR #39 (`a39f5e432f0f3dcba946f5e8ca49bdd060ad0928`) voegde safe provider ingestion en `GuideScheduleApi` toe:
- complete vs partial provider coverage;
- attributable malformed data blokkeert alleen veilige affected channel scope;
- unattributed malformed data blokkeert destructive replacement;
- request-start freshness;
- concurrencytest voor late oudere providerresponse;
- typed canonical service-output zonder provider/database leakage.

**Volgende stap destijds:** echte hosted repository + provider — gerealiseerd in #40/#42.

---

## 14 september 2026 — Phase 2 gesloten; Phase 3 geactiveerd

De finale Per zender-recheck `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md` sloot de laatste Phase 2 devicegate. `Publiek 1/2/3` blijven onder larger text onderscheidend; directe zenderselectie, adjacent paging en strip/schedule-synchronisatie zijn fysiek geaccepteerd.

PR #36 sloot Phase 2 / activeerde Phase 3. PR #37 (`491bc728adfb4ec70d060833d49d17bca25bbdc9`) bouwde daarna de provider-onafhankelijke normalisatiekern: `GuideSchedule`, server-only `EpgProvider`, mapping, UTC-normalisatie, deterministic broadcast identities en record-level diagnostics.

---

## 13 september 2026 — App Shell en Guide interaction baseline fysiek geaccepteerd

Belangrijkste afgeronde mobiele foundation:
- Totaal: 2D time/channel Guide, native inertia/bounce/directional lock, Vandaag/Morgen/Nu, Programme Detail;
- Per zender: verticale wall-clock schedule, horizontal adjacent-channel pager, direct-tap zenderstrip en contextbehoud;
- Nu & Straks: shared reference time, live/browse, tijdrail, Nu/Primetime en detail round-trip;
- Nu & Straks startup blijft achter deferred `import()` na een fysiek aangetoonde eerdere startup-regressie;
- Gids / Vanavond / Zoeken tabs, Settings secundair;
- versioned preferences en live/persisted Light/Dark/System;
- navigator-level error recovery;
- shared headers/safe areas;
- representative 135% iOS text acceptance;
- Programme Detail targetacties later: `Herinner mij` + `Bewaar`, geen Share requirement.

Exacte device-evidence:
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2310.md`;
- `docs/PHYSICAL_EVIDENCE_2026-09-13_2356.md`.

De 24pt Nu & Straks following rows blijven niet-blockerende accessibility/density debt.

---

## 11–13 september 2026 — Bootstrap en Phase 1 stabilization

Projectfoundation, Expo/React Native strict TypeScript, deterministic fixtures, Programme Detail, Amsterdam/DST runtime fixture, CI en device-workflow zijn opgebouwd.

Belangrijke stabilisatie:
- title/time-axis readability tijdens Guide-scroll;
- VoiceOver/self-contained labels;
- performanceverbeteringen door per-frame JS bridges/rerender-bottlenecks te verwijderen;
- `[start,end)` current-programme semantics;
- lockfile + `npm ci`;
- clean Android prebuild + Gradle debug APK in CI.

Een eerdere high-volume per-programme Reanimated-architectuur was CI-groen maar crashte fysiek en blijft expliciet afgewezen.

---

## Doorlopende open punten
- **Phase 4 active:** television-day domain primitives zijn gemergd; de runtime loader/store en daarna accepted day navigation moeten nog naar ADR 0008 D-2..D+7 + 06:00 semantics migreren.
- **Production provider/rights:** nog open; gratis XMLTV is development-only en uiteindelijke provider moet ook de minimale historische/future horizon bewijzen.
- **Offline cold start:** echte no-network cold start later in standalone/dev build; Expo Go kan die test niet zelfstandig dragen.
- **Guide interaction baseline:** fysiek geaccepteerd op iPhone; alleen heropenen met regressie-evidence.
- **Nu & Straks 24pt following rows:** Phase 4 density-aware accessibility-hardening.
- **Android:** fysieke Back/gestures/performance deferred wegens geen Android-device; CI-native compile is geen deviceacceptatie.
- **Programme Detail:** `Herinner mij` + `Bewaar` nog niet geïmplementeerd.
- **Release-like performance:** later buiten Expo Go valideren.
- **Dependencies:** moderate advisories gericht analyseren; nooit `npm audit fix --force`.
- **Production rights:** EPG/logo/artwork/SLA expliciet bevestigen vóór paid release.
- Pricing/trial/paywall, production font licensing en definitieve Tonight composition blijven later.