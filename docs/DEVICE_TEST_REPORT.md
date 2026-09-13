# Teevee Phase 1 — Device Test Report

Vastlegging gestart: **13 september 2026, 07:04 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub.
Gebruik alleen concrete observaties. Een wijziging in code of een groene CI is geen geslaagde toesteltest.

## Toestel en versies
- Testperiode: 11–13 september 2026.
- Platform: iOS, eigen iPhone van de product owner.
- Toestelmodel, iOS-versie en Expo Go-versie: nog niet genoteerd.
- Netwerk: wifi.
- Eerste scrollretest: na `df6873e24d24cf2747da6936fab1b0f60f0d1073`; wijzigingen akkoord.
- Latere test: 48-zenderversie; exacte lokale SHA niet doorgegeven.
- Laatste hertest gevraagd voor code **`b13a7c5263cd663ed1d7ea35e3cfb46d70a8988a`** of documentatie-opvolger `0e9be9103ec2ff96ec63e702476b56dfd8669603`. De werkelijk geïnstalleerde lokale SHA is niet afzonderlijk bevestigd.

## Laatste ontvangen feedback — akkoord
Na de instructie om de standaardinertie, de doorlopende tijdlijn voorbij 16:00/over middernacht en de geanimeerde terugkeer met `Nu` te hertesten, antwoordde de product owner op 13 september 2026: **"perfect"**.

Dit is vastgelegd als **kwalitatief akkoord op die gerichte wijzigingenset**. De scrolluitloop, doorlopende dagovergang en terugkeer met `Nu` vormen voortaan de werkbaseline op deze iPhone. Er zijn geen nieuwe afzonderlijke swipeafstanden, snelheden, framerates of animatieduren gemeld. Er is ook geen afzonderlijke beoordeling van detailweergave, grotere tekst, toegankelijkheid of dark mode gegeven.

## Eerdere bevindingen — aanleiding voor de wijzigingen
De langere gids maakte het eerdere vermoeden concreter: een harde verticale swipe vanaf boven kwam ongeveer tot Docu/Muziek, circa één scherm. De product owner meldde dat dezelfde soort swipe in TVgids.nl circa twee schermen aflegde. Dit was een kwalitatieve vergelijking, geen gemeten gelijke beginsnelheid.

Daarnaast werd gemeld:
- Vandaag en maandag stopten horizontaal rond 16:00.
- Vanaf maandag voelde `Nu` als een herladen/vervangen van het scherm, in plaats van terugschuiven over de daggrens.
- Gewenst: één doorlopende tijdlijn en een geanimeerde terugkeer naar de huidige tijd.

Deze punten zijn als gerichte wijzigingenset nu akkoord bevonden; de oorspronkelijke bevindingen blijven hier als geschiedenis staan.

## Kerncheck
| Onderdeel | Laatste toestelobservatie | Status |
|---|---|---|
| App opent direct in Gids | Opent en rendert via Expo Go. | Eerder bevestigd. |
| Horizontaal scrollen / tijdsbereik | Doorlopende tijdlijn onderdeel van de hertest waarop "perfect" is geantwoord. | Kwalitatief akkoord; geen detailmeting. |
| Verticaal scrollen | Standaardinertie onderdeel van dezelfde geaccepteerde hertest. | Kwalitatief akkoord; `normal` behouden. |
| Zenderkolom synchroon | Geen probleem gemeld in eerdere test. Geen afzonderlijke nieuwe meting. | Meenemen bij latere performancemeting. |
| Boven-/onderrand | Eerdere bouncewijziging akkoord; geen nieuwe klacht. | Baseline behouden. |
| `Nu` vanuit volgende dag | Geanimeerde terugkeer onderdeel van de geaccepteerde hertest. | Kwalitatief akkoord. |
| Huidige-tijdlijn | Eerste screenshot rond 19:43 leek correct. | Geen nieuwe nauwkeurigheidscontrole gemeld. |
| Voortgang lopend programma | Nog niet afzonderlijk getest. | Open. |
| Vandaag / volgende dag | Continue overgang onderdeel van de geaccepteerde hertest. | Kwalitatief akkoord. |
| Korte programmablokken | Nog niet afzonderlijk getest. | Open. |
| Programmadetail openen/sluiten | Nog niet afzonderlijk getest. | Open. |
| Light mode | Eerste screenshot zichtbaar, niet definitief beoordeeld. | Open. |
| Dark mode | Nog niet afzonderlijk getest. | Open. |
| Grotere systeemtekst / toegankelijkheid | Nog niet afzonderlijk getest. | Open. |
| Android / release-achtige performance | Nog niet getest of gemeten. | Open. |

## Wijzigingen versus bewijs
`0.995` was een onbewezen tussenstap. Na bespreking is `decelerationRate="normal"` op beide assen ingevoerd; native bounce blijft aan. Het oude 12-uursvenster is vervangen door één fixturetijdlijn van 49 uur vanaf de Amsterdamse dagstart bij openen. `Nu` en dagknoppen gebruiken dezelfde horizontale ScrollView. Kalendergrenzen gebruiken expliciet Europe/Amsterdam.

CI run #49 is geslaagd voor de codecommit; documentatie-opvolger `0e9be91` had een geslaagde run #50. Het nieuwe kwalitatieve iPhone-akkoord is apart bewijs voor het scrollgevoel. Het is geen volledige Phase 1-acceptatie en geen productiebenchmark.

## Volgende gerichte validatie — programmadetail en leesbaarheid
Gebruik de huidige geïnstalleerde app; voor alleen deze documentatie-update hoeft niets opnieuw te worden geïnstalleerd of geladen.

1. Open en sluit enkele programma's, waaronder een smal blok en een langere titel. Controleer of na sluiten dezelfde tijd- en zenderpositie terugkomt.
2. Bekijk een programma zonder beschrijving. Er moet een begrijpelijke fallback staan, geen kapotte of onbedoeld lege weergave.
3. Controleer light en dark mode en wissel tijdens gebruik. Let op leesbare titels, tijden, detailtekst en knoppen.
4. Vergroot de systeemtekst. Controleer of inhoud bereikbaar blijft en detail nog gesloten kan worden.

Dit zijn geplande checks, geen vastgelegde testresultaten. Noteer model/OS wanneer beschikbaar. Registreer problemen per onderdeel; heropen het goedgekeurde scrollgevoel alleen bij een concrete regressie.

## Productgevoel
- Akkoord: de laatste gerichte combinatie van scrolluitloop, doorlopende tijdlijn en `Nu`-terugkeer.
- Informatiedichtheid, definitief visueel ontwerp en algemene productvoorkeur zijn nog niet afzonderlijk beoordeeld.
- Precies twee schermen per swipe is geen vastgelegde eis.

## Beeldmateriaal
- Screenshot van de eerste succesvolle iPhone-run rond 19:43 CEST staat in de ontwikkelthread.
- Geen nieuwe screenrecording of instrumentele framerate-/velocitymeting ontvangen.

## Samenvatting
**Gerichte iPhone-scrollhertest akkoord.** Behoud de standaardinertie en doorlopende tijdlijn. De volgende stap is programmadetail en leesbaarheid valideren, niet verder aan de goedgekeurde inertie sleutelen. **Phase 1 blijft open** voor de overige interactie-, toegankelijkheids-, lifecycle- en Android-/performancechecks.
