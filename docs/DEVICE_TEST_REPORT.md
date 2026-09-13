# Teevee Phase 1 — Device Test Report

Vastlegging gestart op **13 september 2026, 07:46 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub.
Een groene CI of een test met gemockte gestures is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline kwalitatief akkoord na hertest gevraagd voor `b13a7c5` / `0e9be91`.
- Detailrespons kwalitatief akkoord na hertest gevraagd voor `1211630` (PR #1); geen afzonderlijk bevestigde lokale SHA.
- Nieuwste swipehertest gevraagd voor **`1242f7d64f8abc594f11f043459e07893a25e5b6`**, geïntegreerde PR #2. De gebruiker antwoordt **"perfect"**. Werkelijk geïnstalleerde lokale SHA niet afzonderlijk bevestigd.

## Nieuwste feedback — swipehertest akkoord
Na het verzoek een korte trekbeweging/terugveren, neerwaarts sluiten, heropenen en bestaande sluitroutes met behoud van gidspositie te testen, antwoordde de gebruiker:
> perfect

Dit is **kwalitatief akkoord op de gerichte swipe-dismiss-wijzigingenset**. Geen afzonderlijke meetwaarden of uitslagen voor iedere subtest invullen. Er zijn geen nieuwe timings, framerates, schermopnames of toestelgegevens aangeleverd. Dark mode, grotere tekst, screenreader, Android en productieperformance vallen niet onder dit akkoord.

## Eerder bewijs en aanleiding
De vorige detailtest meldde dat openen/sluiten werkte, de gidspositie behouden bleef, maar beide acties vertraagd voelden. Dat leidde tot scheiding van detailselectie en de zware gidsrender, zonder de native slide te versnellen.

Na die correctie meldde de gebruiker:
> perfect. Sluiten werk door de button, maar ook door buiten de programmadetails te klikken. Extra optie zou zijn door de details naar beneden weg te swipen.

Dat bevestigde detailrespons en knop/achtergrond als sluitroutes. De toen nieuwe swipewens is vervolgens geïmplementeerd en nu apart kwalitatief geaccepteerd.

De scrollbaseline was eerder akkoord: standaardinertie, een doorlopende tijdlijn voorbij de eerdere grens rond 16:00, dagovergangen en geanimeerde terugkeer via Nu. De oorspronkelijke vergelijking van ongeveer één tegenover twee schermen uitloop was subjectief, niet instrumenteel. Die goedgekeurde basis blijft behouden.

## Kerncheck
| Onderdeel | Toestelbewijs | Status |
|---|---|---|
| App opent in Gids | Opent en rendert via Expo Go. | Bevestigd. |
| Horizontaal bereik / dagovergang / Nu | Gerichte hertest met "perfect". | Kwalitatief akkoord. |
| Verticale inertie en bounce | Standaardinstellingen kwalitatief akkoord. | Ongewijzigd behouden. |
| Zenderkolom synchroon | Geen eerdere klacht; geen aparte meting. | Later instrumenteel controleren. |
| Programmadetail openen en respons | "Perfect" na rendercorrectie. | Kwalitatief akkoord. |
| Sluiten met knop | Eerder expliciet bevestigd. Geen nieuwe klacht in swipehertest. | Akkoord behouden. |
| Sluiten buiten het paneel | Eerder expliciet bevestigd. Geen nieuwe klacht in swipehertest. | Akkoord behouden. |
| Gidspositie behouden | Eerder expliciet bevestigd; onderdeel laatste gerichte hertest. | Geen nieuwe regressie gemeld; geen afzonderlijke nieuwe meting. |
| Neerwaarts wegvegen | Nieuw "perfect" na verzoek swipehertest. | Gerichte wijzigingenset kwalitatief akkoord. |
| Korte veeg / terugveren / heropenen | Onderdeel gevraagde swipehertest; alleen gezamenlijk antwoord. | Geen afzonderlijke deeluitslagen claimen. |
| Korte cellen / ontbrekende beschrijvingen | Geen apart toestelresultaat. | Open; fallback heeft geautomatiseerde checks. |
| Light/dark / grotere tekst / toegankelijkheid | Niet afzonderlijk beoordeeld. | Open, volgende validatie. |
| Voortgang / tijdnauwkeurigheid | Eerste screenshot leek juist; geen aparte voortgangstest. | Open. |
| Android / release-achtige performance | Geen apparaatmeting. | Open. |

## Implementatie en grenzen
Het paneel volgt een neerwaartse veeg. Een korte veeg veert terug; voldoende afstand of een duidelijke neerwaartse flick sluit. Meerdere vingers, systeemonderbreking en duidelijke terugbeweging omhoog leiden volgens implementatie/tests niet tot sluiten; niet ieder randgeval heeft een afzonderlijke toestelbevestiging. De native slide rondt de sluiting af vanaf de verplaatste paneelpositie.

Knop, achtergrondtik, toegankelijkheids-escape en Android-terugactie blijven alternatieven. De gids is een afzonderlijke memoized component. Geen wijziging aan scrollinertie, bounce, tijdlijn of selectieregels. Reeds geïnstalleerde Gesture Handler/Reanimated/Worklets worden gebruikt met een eigen gestureroot in de modal.

Het huidige paneel heeft geen interne ScrollView. Bij lange scrollbare tekst moet lezen/scrollen van sluiten worden gescheiden. Het swipe-akkoord verklaart lange tekst, grotere letters of accessibility niet automatisch correct.

## Technische controle
- Detailfix PR #1 geïntegreerd als `1211630`; main-CI #56 geslaagd en kwalitatief iPhone-akkoord ontvangen.
- Swipe PR #2: eerste CI #57 faalde op callbacktypes in de testmock; daarna aangescherpt. Geen regels uitgezet. CI #58 slaagde.
- PR-CI #60 op `6e87b769` geslaagd vóór merge. Integratie **`1242f7d6`** heeft geslaagde **main-CI #61**, run `34740881328`, zoals gecontroleerd in de voorafgaande implementatiesessie: installatie, TypeScript, lint, tests en iOS/Android/web-bundels.
- Pure tests controleren afstand, snelheidseenheden, begrenzing en ongeldige invoer. React-mocks controleren annulering, heropenen, eenmaal sluiten, accessibility escape en geen extra Guide-render/verlies van mock-scrollhosts.
- Dit zijn geen native gesture-/latency-/screenreadermetingen. Het nieuwste gebruikersakkoord is afzonderlijk kwalitatief bewijs.
- Deze vastlegging wijzigt alleen documentatie. Een nieuwe documentatie-CI heeft een eigen resultaat; niet als geslaagd aannemen.

## Volgende gerichte validatie — leesbaarheid
Gebruik de huidige app: voor deze documentatie-update geen `git pull`, herladen of installatie nodig.

Begin met donkere modus op de iPhone. Bekijk de gids en open een programmadetail: blijven titels, tijden, beschrijving, Sluiten en het handvat duidelijk leesbaar? Blijft de overgang bij systeemthemawisseling consistent? Vraag een screenshot en eventuele concrete problemen; niet opnieuw dezelfde scrollacceptatie laten uitvoeren.

Daarna volgen grotere systeemtekst, bereikbaarheid van lange detailinhoud, korte cellen, ontbrekende beschrijvingen en accessibility. Dit zijn geplande controles, geen resultaten. Noteer toestelmodel/OS wanneer beschikbaar.

## Samenvatting
**Scrollbaseline, detailrespons en de gerichte swipe-dismiss-wijzigingenset zijn kwalitatief akkoord op de geteste iPhone.** Laat die basis staan. Phase 1 blijft open voor leesbaarheid, toegankelijkheid, lifecycle, Android en release-performance.
