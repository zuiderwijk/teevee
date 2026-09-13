# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 08:11 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. De hieronder genoemde beeldtijden zijn opnametijden, niet de tijd van deze beoordeling.
Een groene CI of een test met gemockte gestures is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline kwalitatief akkoord na hertest gevraagd voor `b13a7c5` / `0e9be91`.
- Detailrespons kwalitatief akkoord na hertest gevraagd voor `1211630` (PR #1); geen afzonderlijk bevestigde lokale SHA.
- Swipehertest gevraagd voor **`1242f7d64f8abc594f11f043459e07893a25e5b6`**, geïntegreerde PR #2. De gebruiker antwoordt **"perfect"**. Werkelijk geïnstalleerde lokale SHA niet afzonderlijk bevestigd.

## Nieuwste bewijs — dark-modebeelden ontvangen en beoordeeld
De gebruiker heeft beide gevraagde beelden aangeleverd: de gids met geopende details (beeldtijd 07:49) en de gids zonder details/dimlaag (beeldtijd 07:51). Het opnieuw aangeleverde bestand `Schermafbeelding 2026-09-13 om 07.51.19(1).png` toont dezelfde tweede toestand; dit is geen bewijs van een nieuwe build of aparte hertest. De beelden staan in de ontwikkelthread, niet als bestanden in deze repository. Vraag deze screenshots niet opnieuw op.

### Visuele observaties van de agent
- Donkere modus is zichtbaar in zowel de gids als de detailweergave. De witte hoofdtitels en actieknoppen zijn op de beelden goed te onderscheiden; de programmavlakken zijn zichtbaar tegen de donkerdere achtergrond.
- De tijden en secundaire tekst zijn duidelijk terughoudender dan de hoofdtitels. Dit is een visuele constatering, geen gemeten contrastconformiteit of gebruikersakkoord op alle leesbaarheid.
- In de geopende details zijn titel, beschrijving en Sluiten volledig zichtbaar. Het handvat is zeer subtiel. De gids achter de details is gedimd; die toestand is geen bruikbare maat voor het normale gidscontrast.
- Lange zendernamen breken midden in een woord af, bijvoorbeeld `Internation` / `aal 2` en `Internation` / `aal 3`. Dit is een concreet leesbaarheidspunt, niet alleen een kleurkwestie.
- Bij gedeeltelijk uit beeld geschoven programmablokken verdwijnen beginletters en delen van tijden achter de vaste zenderkolom. Ook de linkerste tijdasmarkering is gedeeltelijk afgesneden. Daardoor kunnen tijden onvolledig lijken en titels lastiger herkenbaar zijn. Dit bewijst geen fout in de onderliggende uitzendtijd.
- De schermafbeelding toont circa 11:00–12:30 terwijl de statusbalk 07:51 aangeeft. Het ontbreken van een Nu-lijn in dit zichtbare toekomstige tijdvak is op zichzelf geen defect; de huidige-tijdindicator is hiermee niet afzonderlijk getest.
- Een blauw zwevend tandwiel bedekt een deel van de zenderkolom. De herkomst is in deze beoordeling niet vastgesteld. Niet als Teevee-bediening of als leesbaarheidsbewijs voor het bedekte gebied aanmerken.

### Vervolgcriteria — nog niet geïmplementeerd
Maak de zenderidentiteit herkenbaar zonder willekeurige woordbreuk. Bij horizontaal gedeeltelijk zichtbare programma's moet de informatie waar mogelijk binnen het resterende zichtbare blok leesbaar blijven, zonder programmaduur, blokpositie of de betekenis van de tijdas te vervalsen. Een halve tijdnotatie mag niet voor een volledige worden aangezien. Los dit als gerichte tekst-/layoutcorrectie op; heropen de geaccepteerde inertie en dismissal niet.

Deze screenshotinspectie is afgerond als **visuele beoordeling met open bevindingen**. Grotere systeemtekst, lange detailinhoud, themawisseling tijdens gebruik, schermlezers en formele contrastcontrole zijn niet door de beelden bewezen. De gebruiker heeft met alleen het aanleveren van de beelden geen nieuw algemeen ontwerp- of toegankelijkheidsakkoord gegeven.

Het TVgids.nl-referentiebeeld van 08:02 voor Nu & Straks is een afzonderlijke productreferentie, geen dark-modetest van Teevee. De nieuwe drie-weergavenafspraken blijven van kracht; Nu & Straks krijgt tijdkeuze binnen vandaag en geen datumselector.

## Eerder akkoord — swipehertest
Na het verzoek een korte trekbeweging/terugveren, neerwaarts sluiten, heropenen en bestaande sluitroutes met behoud van gidspositie te testen, antwoordde de gebruiker:
> perfect

Dit is **kwalitatief akkoord op de gerichte swipe-dismiss-wijzigingenset**. Geen afzonderlijke meetwaarden of uitslagen voor iedere subtest invullen. Er zijn geen timings, framerates of toestelgegevens aangeleverd. Grotere tekst, screenreader, Android en productieperformance vallen niet onder dit akkoord. De later ontvangen dark-modebeelden zijn hierboven apart beoordeeld.

## Eerder bewijs en aanleiding
De vorige detailtest meldde dat openen/sluiten werkte, de gidspositie behouden bleef, maar beide acties vertraagd voelden. Dat leidde tot scheiding van detailselectie en de zware gidsrender, zonder de native slide te versnellen.

Na die correctie meldde de gebruiker:
> perfect. Sluiten werk door de button, maar ook door buiten de programmadetails te klikken. Extra optie zou zijn door de details naar beneden weg te swipen.

Dat bevestigde detailrespons en knop/achtergrond als sluitroutes. De toen nieuwe swipewens is vervolgens geïmplementeerd en apart kwalitatief geaccepteerd.

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
| Gidspositie behouden | Eerder expliciet bevestigd; onderdeel gerichte hertest. | Geen regressie gemeld; geen afzonderlijke nieuwe meting. |
| Neerwaarts wegvegen | "Perfect" na verzoek swipehertest. | Gerichte wijzigingenset kwalitatief akkoord. |
| Korte veeg / terugveren / heropenen | Onderdeel gevraagde swipehertest; alleen gezamenlijk antwoord. | Geen afzonderlijke deeluitslagen claimen. |
| Zendernamen / gedeeltelijk zichtbare labels | Woordbreuken en afgeknipte begintitels/tijden zichtbaar op screenshot. | Gerichte leesbaarheidscorrectie open. |
| Korte cellen / ontbrekende beschrijvingen | Korte, afgekorte cellen zichtbaar; geen apart bedieningsresultaat. | Open; fallback heeft geautomatiseerde checks. |
| Dark-modegids en detail | Beide beelden ontvangen en door agent visueel beoordeeld. | Visueel bruikbare basis met open leesbaarheidspunten; geen volledig gebruikersakkoord. |
| Themawisseling / grotere tekst / toegankelijkheid | Niet afzonderlijk getest. | Open. |
| Voortgang / tijdnauwkeurigheid | Eerdere screenshot leek juist; nieuwe beelden tonen een ander tijdvak. | Voortgang en live nauwkeurigheid niet afzonderlijk getest. |
| Android / release-achtige performance | Geen apparaatmeting. | Open. |

## Implementatie en grenzen
Het paneel volgt een neerwaartse veeg. Een korte veeg veert terug; voldoende afstand of een duidelijke neerwaartse flick sluit. Meerdere vingers, systeemonderbreking en duidelijke terugbeweging omhoog leiden volgens implementatie/tests niet tot sluiten; niet ieder randgeval heeft een afzonderlijke toestelbevestiging. De native slide rondt de sluiting af vanaf de verplaatste paneelpositie.

Knop, achtergrondtik, toegankelijkheids-escape en Android-terugactie blijven alternatieven. De gids is een afzonderlijke memoized component. Geen wijziging aan scrollinertie, bounce, tijdlijn of selectieregels. Reeds geïnstalleerde Gesture Handler/Reanimated/Worklets worden gebruikt met een eigen gestureroot in de modal.

Het huidige paneel heeft geen interne ScrollView. Bij lange scrollbare tekst moet lezen/scrollen van sluiten worden gescheiden. Het swipe-akkoord verklaart lange tekst, grotere letters of accessibility niet automatisch correct.

## Technische controle
- Detailfix PR #1 geïntegreerd als `1211630`; main-CI #56 geslaagd en kwalitatief iPhone-akkoord ontvangen.
- Swipe PR #2: eerste CI #57 faalde op callbacktypes in de testmock; daarna aangescherpt. Geen regels uitgezet. CI #58 slaagde.
- PR-CI #60 op `6e87b769` geslaagd vóór merge. Integratie **`1242f7d6`** heeft geslaagde **main-CI #61**, run `34740881328`, zoals gecontroleerd in de implementatiesessie: installatie, TypeScript, lint, tests en iOS/Android/web-bundels.
- Pure tests controleren afstand, snelheidseenheden, begrenzing en ongeldige invoer. React-mocks controleren annulering, heropenen, eenmaal sluiten, accessibility escape en geen extra Guide-render/verlies van mock-scrollhosts.
- Dit zijn geen native gesture-/latency-/screenreadermetingen. Gebruikersakkoorden en screenshots zijn afzonderlijk kwalitatief bewijs.
- Deze screenshotbeoordeling wijzigt alleen dit rapport. Geen appcode of dependency aangepast, geen nieuwe testuitvoering en geen claim over de actuele CI-status. Een eventuele documentatie-CI heeft een eigen resultaat.

## Volgende gerichte validatie — leesbaarheid
De gevraagde dark-modebeelden zijn ontvangen en beoordeeld; geen herhaalde upload nodig. Voor deze rapportwijziging hoeft de gebruiker niets te herladen of te installeren.

De volgende implementatie moet de herkenbaarheid van zendernamen en gedeeltelijk zichtbare programma-informatie gericht verbeteren, zonder de tijdgeometrie of goedgekeurde interacties te veranderen. Neem daarna grotere systeemtekst, bereikbaarheid van lange detailinhoud, korte cellen, ontbrekende beschrijvingen en toegankelijkheid mee in één gerichte hertest. Vraag alleen nog ontbrekend toestelbewijs. Noteer toestelmodel/OS wanneer beschikbaar.

## Samenvatting
**Scrollbaseline, detailrespons en de gerichte swipe-dismiss-wijzigingenset zijn kwalitatief akkoord op de geteste iPhone. De dark-mode-screenshotinspectie is nu vastgelegd, met concrete open tekst-/layoutbevindingen.** Phase 1 blijft open voor die correcties, grotere tekst, toegankelijkheid, lifecycle, Android en release-performance.
