# Teevee Phase 1 — Device Test Report

Vastlegging bijgewerkt op **13 september 2026, 07:36 CEST — Europe/Amsterdam**. Exacte committijden staan in GitHub.
Een groene CI of een test met gemockte gestures is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline kwalitatief akkoord na de hertest gevraagd voor `b13a7c5` / `0e9be91`.
- Detailrespons-hertest gevraagd na integratie `1211630` (PR #1); nu kwalitatief akkoord. Geen afzonderlijk bevestigde lokale SHA.
- Nieuwe swipefunctie: PR #2, `feat/detail-swipe-dismiss`. Nog niet op het toestel getest.

## Nieuwste feedback — detailrespons akkoord; extra sluitoptie gevraagd
Na het verzoek de rendercorrectie te hertesten antwoordt de gebruiker:
> perfect. Sluiten werk door de button, maar ook door buiten de programmadetails te klikken. Extra optie zou zijn door de details naar beneden weg te swipen.

Vastgelegd als kwalitatief akkoord op de verbeterde detailrespons en bevestiging van sluiten via Sluiten en via de achtergrond. Swipe-down is hier een **nieuw verzoek**, niet een al geslaagde test. Er zijn geen milliseconden, framerates of afzonderlijke nieuwe metingen aangeleverd.

## Eerder bewijs en aanleiding
De vorige detailtest meldde dat openen/sluiten werkte, de gidspositie behouden bleef, maar beide acties vertraagd voelden. Dat leidde tot scheiding van detailselectie en de zware gidsrender. De native slide is daarbij niet versneld of vervangen. Het nieuwe "perfect" sluit de kwalitatieve responsklacht voor die geteste versie.

De scrollbaseline was eerder akkoord: standaardinertie, een doorlopende tijdlijn voorbij de eerdere grens rond 16:00, dagovergangen en geanimeerde terugkeer via Nu. De oorspronkelijke vergelijking van ongeveer één tegenover twee schermen uitloop was subjectief, niet instrumenteel. Die goedgekeurde basis blijft behouden.

## Kerncheck
| Onderdeel | Toestelbewijs | Status |
|---|---|---|
| App opent in Gids | Opent en rendert via Expo Go. | Bevestigd. |
| Horizontaal bereik / dagovergang / Nu | Gerichte hertest met "perfect". | Kwalitatief akkoord. |
| Verticale inertie en bounce | Standaardinstellingen kwalitatief akkoord. | Ongewijzigd behouden. |
| Zenderkolom synchroon | Geen eerdere klacht; geen aparte meting. | Later instrumenteel controleren. |
| Programmadetail openen en respons | Nieuw antwoord "perfect" na gerichte update. | Kwalitatief akkoord op die versie. |
| Sluiten met knop | Gebruiker bevestigt werking. | Akkoord; regressiecheck na swipe. |
| Sluiten buiten het paneel | Gebruiker bevestigt werking. | Akkoord; regressiecheck na swipe. |
| Gidspositie behouden | Eerder expliciet bevestigd. | Opnieuw meenemen na swipewijziging. |
| Neerwaarts wegvegen | Nieuw verzoek, geen toestelresultaat. | Geïmplementeerd voor hertest. |
| Korte veeg annuleren / heropenen na swipe | Geen toestelresultaat. | Geautomatiseerd met mocks; native open. |
| Korte cellen / ontbrekende beschrijvingen | Geen apart toestelresultaat. | Open; fallback heeft geautomatiseerde checks. |
| Light/dark / grotere tekst / toegankelijkheid | Niet afzonderlijk beoordeeld. | Open. |
| Voortgang / tijdnauwkeurigheid | Eerste screenshot leek juist; geen aparte voortgangstest. | Open. |
| Android / release-achtige performance | Geen apparaatmeting. | Open. |

## Nieuwe implementatie — nog geen toestelacceptatie
Het detailpaneel volgt een neerwaartse veeg. Een korte veeg veert terug; voldoende afstand of een duidelijke neerwaartse flick sluit. Meerdere vingers, systeemonderbreking en duidelijke terugbeweging omhoog leiden niet tot sluiten. De bestaande native slide rondt de sluiting af vanaf de verplaatste paneelpositie. Geen extra exit-animatie of eerst terugschieten naar boven.

De knop, achtergrondtik, toegankelijkheids-escape en Android-terugactie blijven alternatieven. Een volgende opening begint weer op de normale positie. De gids blijft een afzonderlijke memoized component; geen verandering aan scrollinertie, bounce, tijdlijn of selectieregels.

De al geïnstalleerde Gesture Handler/Reanimated/Worklets worden gebruikt, met een eigen gestureroot binnen de modal. Er zijn geen packages toegevoegd. Het huidige korte detailpaneel heeft geen interne ScrollView. Bij latere lange scrollbare teksten moet lezen/scrollen van dismissing worden gescheiden.

## Technische controle
- Detailfix PR #1 geïntegreerd in `1211630`; main-CI #56 geslaagd. Nu ook kwalitatief iPhone-akkoord ontvangen.
- Swipe PR #2: eerste CI #57 faalde typecheck; callbacks in de testmock aangescherpt. Geen regels uitgezet.
- CI #58 voor `26a733d5` slaagt voor installatie, TypeScript, lint, tests en webexport.
- De CI-uitbreiding exporteert voortaan ook iOS- en Android-bundels. De actuele PR-/integratierun heeft een eigen resultaat dat vóór overdracht moet worden gecontroleerd.
- Pure tests controleren afstand, snelheidseenheden, begrenzing en ongeldige invoer. React-mocks controleren short-drag/cancellation, heropenen, slechts eenmaal sluiten, accessibility escape en geen extra Guide-render/verlies van de mock-scrollhosts.
- Dit bewijst geen native gesture-gevoel, touch-arbitrage, visuele overgang, schermlezerervaring, native build of latencywinst.

## Gerichte hertest
Stop Metro met Control+C. Voer in `~/projects/teevee` `git pull --ff-only` uit en start `npm run start:clean`. Open via Expo Go. Geen nieuwe dependency-installatie nodig voor deze wijziging.

1. Scroll naar een herkenbare tijd en zender, en open een programma.
2. Trek het paneel een klein stukje omlaag en laat rustig los: het hoort terug te veren zonder sluiten.
3. Veeg duidelijk omlaag, vanaf het handvat of de detailtekst: het paneel hoort te sluiten zonder terugschieten of een leeg tussenpaneel.
4. Open hetzelfde en daarna een ander programma. Beide moeten op de normale positie openen en direct reageren.
5. Sluit ook via knop en achtergrond. Controleer dat de tijd- en zenderpositie behouden blijft.

Deze stappen zijn een testplan, geen geregistreerd resultaat. Een screenshot of opname is alleen nodig wanneer iets niet goed voelt. Noteer model/OS wanneer beschikbaar.

## Samenvatting
**Scrollbaseline en detailrespons zijn kwalitatief akkoord.** Sluiten via knop en achtergrond is expliciet bevestigd. Swipe-down is als extra optie geïmplementeerd en vraagt nog een gerichte iPhone-hertest. Phase 1 blijft open voor die test plus leesbaarheid, toegankelijkheid, lifecycle, Android en release-performance.
