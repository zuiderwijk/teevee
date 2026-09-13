# Teevee Phase 1 — Device Test Report

Gebruik dit document voor de eerste fysieke toesteltest van de gids. Vul alleen concrete observaties in; geen aannames.

## Toestel
- Datum/tijd test: 11–13 september 2026
- Platform: iOS
- Toestelmodel: nog niet genoteerd
- OS-versie: nog niet genoteerd
- Expo Go-versie (indien zichtbaar): nog niet genoteerd
- Netwerk: wifi
- App-commit (optioneel): retest na `df6873e24d24cf2747da6936fab1b0f60f0d1073`

## Kerncheck
Markeer per onderdeel: **goed / twijfel / probleem** en voeg alleen toelichting toe wanneer nodig.

| Onderdeel | Status | Observatie |
|---|---|---|
| App opent direct in Gids | goed | App opent via Expo Go en de gids rendert direct. |
| Horizontaal scrollen door tijd | goed | Na de scrollfix akkoord bevonden; eerdere terug-scrollproblemen zijn niet opnieuw gemeld. |
| Verticaal scrollen door zenders | goed / nader meten | Werkt functioneel goed. Gevoelsmatig mogelijk wat traag bij een swipe omlaag, maar de huidige gids is te kort om dit betrouwbaar te beoordelen. |
| Zenderkolom blijft synchroon | goed | Geen probleem gemeld tijdens de test. |
| `Nu` brengt je logisch terug | nog te testen |  |
| Huidige-tijdlijn staat correct | goed | Screenshot rond 19:43 toont de huidige-tijdlijn op de verwachte positie. |
| Voortgang lopend programma klopt | nog te testen |  |
| Vandaag → morgen → vandaag | goed | Wijziging voor behoud van horizontale tijdcontext is akkoord bevonden. |
| Korte programmablokken blijven bruikbaar | nog te testen |  |
| Programma aantikken opent detail | nog te testen |  |
| Detail sluiten voelt logisch | nog te testen |  |
| Light mode leesbaar/rustig | zichtbaar, nog niet beoordeeld | Eerste screenshot is light mode; visuele richting is nog prototype. |
| Dark mode leesbaar/rustig | nog te testen |  |

## Performance
### Horizontaal scrollen
- Status: akkoord na retest.
- Eerdere bevinding: incidenteel niet reageren bij terugscrollen.
- Na fix: geen nieuw probleem gemeld.

### Verticaal scrollen
- Status: functioneel goed, inertie nog niet definitief beoordeeld.
- Observatie: een swipe naar beneden voelt mogelijk wat traag.
- Betrouwbaarheid observatie: laag; met 16 testzenders was de verticale scrollafstand te kort om de inertie goed te beoordelen.
- Vervolg: fixture verlengen naar een realistischer aantal zenders en daarna dezelfde swipe opnieuw beoordelen voordat de snelheid wordt aangepast.

### Synchronisatie zenderkolom
- Loopt gelijk / incidenteel achter / structureel achter: loopt gelijk volgens eerste indruk.
- Wanneer precies: geen probleem gemeld.

### Interactie
- Programmadetail opent direct / merkbare vertraging: nog te testen.
- Andere vertragingen: geen nieuwe melding na scrollfix.

## Productgevoel
- Voelt dit al als een mobiele tv-gids in plaats van een verkleinde desktopgids? nog niet beoordeeld
- Is de informatiedichtheid prettig? nog niet beoordeeld
- Is direct duidelijk waar je in tijd en zenders bent? dagwissel/tijdcontext is na fix akkoord
- Wat stoort het meest tijdens normaal gebruik? nog geen bevestigd blokkerend probleem; verticale inertie moet bij langere gids opnieuw worden beoordeeld
- Wat voelt verrassend goed? algemene scrollperformance voelt op iPhone goed genoeg om met standaard React Native-primitives door te gaan

## Screenshots / screenrecording
- Screenshot eerste succesvolle iPhone-run rond 19:43 CEST aanwezig in de ontwikkelthread.

## Samenvatting
- Grootste probleem: geen bevestigd blokkerend scrollprobleem meer na retest.
- Grootste pluspunt: scrollfixes zijn akkoord en de standaard React Native-scrollarchitectuur blijft voorlopig valide.
- Blokkeert dit verdere ontwikkeling? nee.
- Aanbevolen eerstvolgende verbetering: testfixture verlengen naar een realistischer verticale gidslengte en daarna verticale inertie opnieuw beoordelen voordat `decelerationRate` wordt aangepast.
