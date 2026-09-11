# Teevee Phase 1 — Device Test Report

Gebruik dit document voor de eerste fysieke toesteltest van de gids. Vul alleen concrete observaties in; geen aannames.

## Toestel
- Datum/tijd test: 11 september 2026, circa 19:43–19:46 CEST
- Platform: iOS
- Toestelmodel: nog niet genoteerd
- OS-versie: nog niet genoteerd
- Expo Go-versie (indien zichtbaar): nog niet genoteerd
- Netwerk: wifi
- App-commit (optioneel): eerste test vóór commit `df6873e24d24cf2747da6936fab1b0f60f0d1073`

## Kerncheck
Markeer per onderdeel: **goed / twijfel / probleem** en voeg alleen toelichting toe wanneer nodig.

| Onderdeel | Status | Observatie |
|---|---|---|
| App opent direct in Gids | goed | App opent via Expo Go en de gids rendert direct. |
| Horizontaal scrollen door tijd | probleem | Vooruit scrollen voelt prima, maar terug in de tijd reageert soms niet of lijkt tijdelijk geen gesture te pakken. |
| Verticaal scrollen door zenders | goed | Eerste indruk: werkt prima. |
| Zenderkolom blijft synchroon | goed | Geen probleem gemeld tijdens eerste test. |
| `Nu` brengt je logisch terug | nog te testen |  |
| Huidige-tijdlijn staat correct | goed | Screenshot rond 19:43 toont de huidige-tijdlijn op de verwachte positie. |
| Voortgang lopend programma klopt | nog te testen |  |
| Vandaag → morgen → vandaag | probleem | Bij wisselen naar morgen blijft de tijdcontext niet logisch behouden; de gids springt naar het begin van het venster. |
| Korte programmablokken blijven bruikbaar | nog te testen |  |
| Programma aantikken opent detail | nog te testen |  |
| Detail sluiten voelt logisch | nog te testen |  |
| Light mode leesbaar/rustig | zichtbaar, nog niet beoordeeld | Eerste screenshot is light mode; visuele richting is nog prototype. |
| Dark mode leesbaar/rustig | nog te testen |  |

## Performance
### Horizontaal scrollen
- Soepel / lichte hapering / duidelijke hapering: meestal soepel, maar interactieprobleem bij terug scrollen.
- Wanneer precies: incidenteel bij horizontaal terug in de tijd vegen; de gids lijkt dan soms niet te reageren.
- Aanvullende wens: horizontale tijdnavigatie mag meer doorrollen dan verticale zendernavigatie.

### Verticaal scrollen
- Soepel / lichte hapering / duidelijke hapering: soepel volgens eerste indruk.
- Wanneer precies: geen probleem gemeld.
- Randgedrag: boven- en onderkant stoppen te hard; gewenst is een kleine natuurlijke iOS-bounce.

### Synchronisatie zenderkolom
- Loopt gelijk / incidenteel achter / structureel achter: loopt gelijk volgens eerste indruk.
- Wanneer precies: geen probleem gemeld.

### Interactie
- Programmadetail opent direct / merkbare vertraging: nog te testen.
- Andere vertragingen: horizontale terug-scrollgesture voelt incidenteel alsof deze niet wordt geregistreerd.

## Productgevoel
- Voelt dit al als een mobiele tv-gids in plaats van een verkleinde desktopgids? nog niet beoordeeld
- Is de informatiedichtheid prettig? nog niet beoordeeld
- Is direct duidelijk waar je in tijd en zenders bent? deels; dagwissel verliest tijdcontext
- Wat stoort het meest tijdens normaal gebruik? incidenteel niet reageren bij terug scrollen en harde verticale eindstop
- Wat voelt verrassend goed? algemene scrollperformance voelt in eerste test prima

## Screenshots / screenrecording
- Screenshot eerste succesvolle iPhone-run rond 19:43 CEST aanwezig in de ontwikkelthread.
- Bij blijvende terug-scrollproblemen heeft een korte screenrecording voorkeur.

## Samenvatting
- Grootste probleem: horizontale gesture reageert incidenteel niet en dagwissel verliest tijdpositie.
- Grootste pluspunt: algemene scrollperformance op de eerste iPhone-test voelt prima.
- Blokkeert dit verdere ontwikkeling? nee, maar deze UX-punten moeten vóór Phase 1-exit opgelost of verklaard zijn.
- Aanbevolen eerstvolgende verbetering: tijdpositie bij dagwissel behouden, horizontale en verticale inertie verschillend tunen en native bounce aan de verticale grenzen herstellen.
