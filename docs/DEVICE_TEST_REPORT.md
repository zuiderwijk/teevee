# Teevee Phase 1 — Device Test Report

Bijgewerkt: **13 september 2026, 06:58 CEST — Europe/Amsterdam**.
Gebruik alleen concrete observaties. Een wijziging in code of een groene CI is geen geslaagde toesteltest.

## Toestel en versies
- Testperiode: 11–13 september 2026.
- Platform: iOS, eigen iPhone van de product owner.
- Toestelmodel, iOS-versie en Expo Go-versie: nog niet genoteerd.
- Netwerk: wifi.
- Eerste scrollretest: na `df6873e24d24cf2747da6936fab1b0f60f0d1073`; wijzigingen akkoord.
- Latere test: 48-zenderversie; exacte lokale SHA niet doorgegeven.
- Nieuwe te testen code: **`b13a7c5263cd663ed1d7ea35e3cfb46d70a8988a`** of een opvolger met dezelfde code.

## Laatste ontvangen feedback
De langere gids maakt het eerdere vermoeden concreter: een harde verticale swipe vanaf boven komt ongeveer tot Docu/Muziek, circa één scherm. De product owner meldt dat dezelfde soort swipe in TVgids.nl circa twee schermen aflegt. Dit is een bruikbare kwalitatieve vergelijking, geen gemeten gelijke beginsnelheid.

Daarnaast werd gemeld:
- Vandaag en maandag stoppen horizontaal rond 16:00.
- Vanaf maandag voelt `Nu` als een herladen/vervangen van het scherm, in plaats van terugschuiven over de daggrens.
- Gewenst: één doorlopende tijdlijn en een geanimeerde terugkeer naar de huidige tijd.

## Kerncheck
| Onderdeel | Laatste toestelobservatie | Status nieuwe code |
|---|---|---|
| App opent direct in Gids | Opent en rendert via Expo Go. | Hercontrole mogelijk. |
| Horizontaal scrollen | Eerdere niet-reagerende terugswipes na fix akkoord; later stop rond 16:00 gevonden. | Doorlopende tijdlijn geïmplementeerd; hertest nodig. |
| Verticaal scrollen | Functioneel soepel, maar te korte uitloop met 48 kanalen. | Beide assen nu `normal`; hertest nodig. |
| Zenderkolom synchroon | Geen probleem gemeld in eerdere test. | Tijdens langere fling en bounce opnieuw beoordelen. |
| Boven-/onderrand | Eerdere bouncewijziging akkoord. | Bounce behouden; opnieuw beoordelen. |
| `Nu` vanuit volgende dag | Reload-achtig gevoel gemeld. | Geanimeerde scroll in dezelfde tijdlijn; hertest nodig. |
| Huidige-tijdlijn | Eerste screenshot rond 19:43 leek correct. | Nieuwe meerdaagse situatie nog niet beoordeeld. |
| Voortgang lopend programma | Nog niet afzonderlijk getest. | Open. |
| Vandaag / volgende dag | Eerdere tijdpositie-aanpassing akkoord; nieuwe wens is een continue overgang. | Knoppen navigeren naar dagstart; hertest nodig. |
| Korte programmablokken | Nog niet afzonderlijk getest. | Open. |
| Programmadetail openen/sluiten | Nog niet afzonderlijk getest. | Open. |
| Light mode | Eerste screenshot zichtbaar, niet definitief beoordeeld. | Open. |
| Dark mode | Nog niet afzonderlijk getest. | Open. |

## Wijzigingen versus bewijs
`0.995` was een onbewezen tussenstap. De owner vroeg waarom niet de standaard iOS-inertie werd gebruikt en gaf daarna opdracht verder te gaan met de standaard als uitgangspunt. De nieuwe code gebruikt `decelerationRate="normal"` op beide assen. De native bounce blijft aan.

Het oude 12-uursvenster is vervangen door één fixturetijdlijn van 49 uur vanaf de Amsterdamse dagstart bij openen. `Nu` en de dagknoppen gebruiken dezelfde horizontale ScrollView. Kalendergrenzen gebruiken expliciet Europe/Amsterdam, ook als het toestel in een andere tijdzone staat.

CI run #49 is geslaagd voor de codecommit. Er is **nog geen iPhone-feedback over deze nieuwe combinatie**. Geen score, swipeafstand, framerate of verbeterpercentage invullen zonder test.

## Gerichte hertest
1. Stop Metro op de Mac met Control+C. Voer in `~/projects/teevee` `git pull --ff-only` uit en start met `npm run start:clean`. Scan de QR-code opnieuw. Een GitHub-commit wordt niet automatisch lokaal geladen.
2. Test meerdere stevige verticale swipes, ook halverwege de lijst zodat de boven-/onderrand de uitloop niet begrenst. Let op afstand na loslaten, controle en of aanraken de beweging goed stopt.
3. Scroll op beide dagen voorbij 16:00 en naar de avond. Beweeg door middernacht en controleer de actieve dag.
4. Ga naar de volgende dag en druk op `Nu`. Controleer of de inhoud terugschuift zonder schermvervanging en of de verticale zenderpositie behouden blijft.
5. Controleer bij langere uitloop de synchronisatie van zendernamen en de bounce boven/onder.

Noteer model/OS wanneer beschikbaar. Vergelijk gevoel, niet een verplicht aantal schermen: precies twee schermen is geen vastgelegde eis.

## Productgevoel
- Eerdere plus: algemene scrollperformance voelde soepel genoeg om met standaard React Native-primitives verder te onderzoeken.
- Actuele aandachtspunten: uitloop verticaal, bereik in de tijd en continuïteit bij `Nu`.
- Informatiedichtheid, definitief visueel ontwerp en algemene productvoorkeur zijn nog niet beoordeeld.

## Beeldmateriaal
- Screenshot van de eerste succesvolle iPhone-run rond 19:43 CEST staat in de ontwikkelthread.
- Geen nieuwe screenrecording of instrumentele framerate-/velocitymeting ontvangen.

## Samenvatting
De eerdere hertest was akkoord, maar de 48-zendertest bracht concrete aanvullende problemen aan het licht. Een gerichte correctie is technisch geverifieerd en staat klaar voor de volgende toesteltest. **Phase 1 is niet afgerond**: nieuwe iPhone-acceptatie en representatieve Android-validatie ontbreken nog.
