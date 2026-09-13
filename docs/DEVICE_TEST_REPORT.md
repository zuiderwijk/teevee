# Teevee Phase 1 — Device Test Report

Bijgewerkt tijdens de detailrespons-increment op **13 september 2026**. Codeversie `85e3d408` vastgelegd om **07:18:07 CEST (Europe/Amsterdam)**; exacte tijd van deze rapportwijziging staat in GitHub.
Een groene CI is geen geslaagde toesteltest. Alleen concrete observaties worden als resultaat vastgelegd.

## Toestel en versies
- Testperiode: 11–13 september 2026.
- Platform: iOS, eigen iPhone van de product owner; netwerk wifi.
- Toestelmodel, iOS-versie en Expo Go-versie: nog niet genoteerd.
- Eerste scrollretest na `df6873e2`: akkoord.
- Latere 48-zendertest: exacte lokale SHA niet doorgegeven.
- Scrollbaseline-hertest gevraagd voor `b13a7c5` of documentatie-opvolger `0e9be91`; kwalitatief akkoord ontvangen. Lokale SHA niet afzonderlijk bevestigd.
- Laatste detailtest: dezelfde geïnstalleerde app, geen nieuwe runtimecode sinds het scrollakkoord.
- Nieuwe te hertesten detailcode: PR #1, `85e3d408` of geïntegreerde opvolger met dezelfde code. **Nog niet op iPhone geaccepteerd.**

## Laatste feedback — detail werkt, reactie voelt te traag
De product owner meldt:
> Openen gaat goed. Voelt wel traag. Tussen de tik, en het openen zit dusdanig veel tijd (gevoelsmatig, niet gemeten) dat het traag voelt. Zelfde geldt wanneer je de Sluiten knop indrukt.
> Gidspositite blijft behouden.

Daaruit volgt uitsluitend:
- Openen en sluiten functioneren.
- De tijd- en zenderpositie blijft volgens de gebruiker behouden.
- De reactie bij beide acties is nog niet prettig genoeg.
- Er zijn geen milliseconden, frames, exacte toestelgegevens of afzonderlijke animatie-/wachttijdmetingen aangeleverd.

## Eerder akkoord — scrollbaseline
Op 13 september antwoordde de owner **"perfect"** na de gerichte hertest van standaardinertie, doorlopende tijdlijn voorbij 16:00/over middernacht en geanimeerde terugkeer met `Nu`. Dit blijft kwalitatief akkoord op die wijzigingenset. De nieuwe detailmelding heropent de goedgekeurde scrollinstellingen niet.

De oorspronkelijke aanleiding blijft als geschiedenis staan: een harde swipe kwam met snellere afremming ongeveer één scherm ver tegenover circa twee in de vergelijking met TVgids.nl; horizontale navigatie stopte rond 16:00 en `Nu` voelde vanaf maandag als schermvervanging. De continuous-timeline/normal-inertia-wijziging is daarvoor geaccepteerd. Dit waren geen metingen met identieke beginsnelheden.

## Kerncheck
| Onderdeel | Laatste toestelobservatie | Status |
|---|---|---|
| App opent direct in Gids | Opent en rendert via Expo Go. | Bevestigd. |
| Horizontaal scrollen / tijdsbereik | Onderdeel van hertest met antwoord "perfect". | Kwalitatief akkoord. |
| Verticaal scrollen | Standaardinertie geaccepteerd. | `normal` behouden. |
| Zenderkolom synchroon | Geen eerdere klacht; geen aparte nieuwe meting. | Meenemen in performancechecks. |
| Boven-/onderrand | Bounce eerder akkoord. | Baseline behouden. |
| `Nu` vanuit volgende dag | Geanimeerde terugkeer geaccepteerd. | Kwalitatief akkoord. |
| Huidige-tijdlijn | Eerste screenshot leek correct. | Geen nieuwe nauwkeurigheidsmeting. |
| Voortgang lopend programma | Niet afzonderlijk getest. | Open. |
| Vandaag / volgende dag | Continue overgang geaccepteerd. | Kwalitatief akkoord. |
| Korte programmablokken | Niet afzonderlijk beoordeeld. | Open. |
| Programmadetail openen/sluiten | Functioneert, maar beide acties voelen vertraagd. | Responsprobleem open; renderfix klaar voor hertest. |
| Gidspositie na sluiten | Gebruiker bevestigt behoud. | Bevestigd op pre-fix-versie; na wijziging hercontroleren. |
| Ontbrekende beschrijving | Geen afzonderlijke toesteluitkomst. | Geautomatiseerde fallback-check toegevoegd; device open. |
| Light / dark mode | Eerste light-screenshot, geen aparte beoordeling. | Open. |
| Grotere tekst / toegankelijkheid | Niet afzonderlijk getest. | Open. |
| Android / release-performance | Niet getest of gemeten. | Open. |

## Wat in code is veranderd — niet verwarren met toestelbewijs
De geselecteerde programmastatus zat in dezelfde component als de volledige gids. Dat leverde een onnodige herberekening van de programmaboom op bij openen én sluiten. De detailstatus zit nu in een kleine parent, naast een memoized Guide met een stabiele callback. De gids blijft gemount en hoeft niet opnieuw te renderen alleen door detailselectie.

Bij sluiten blijft de geselecteerde tekst aanwezig tijdens de native animatie. Er is pressed-feedback toegevoegd op programmablokken en Sluiten; activering blijft na een voltooide tik. Tikken op sheettekst sluit de backdrop niet. Geen verandering aan gidsinertie, bounce, geometrie, dagovergangen of native `slide`-animatie.

Dit is een gerichte correctie van onnodig renderwerk. De precieze bijdrage aan de gevoelde vertraging is **nog niet op iPhone gemeten**. We verkorten de animatie niet tegelijk; zo blijft de volgende vergelijking zinvol.

## Technische verificatie
- Bestaande scrollcode eerder CI #49/#50; acceptatiedocumentatie #51.
- PR-run #52 faalde op een nieuwe React DOM-typeversie die niet bij React 19.2 paste. Alleen de test-typesversiereeks is aangescherpt.
- PR-run **#53** voor `85e3d408` is geslaagd: install, TypeScript, lint, tests en Expo-webexport.
- Nieuwe reducerchecks en React/jsdom-tests bewaken herhaald openen/sluiten zonder extra Guide-render, dezelfde gemounte scrollhosts/offsets, juiste vervolgselectie, tekstretentie bij sluiten en fallback bij ontbrekende/lege beschrijvingen.
- Native hosts en de klok zijn in de React-test gemockt. Dit bewijst geen native animatie, tikvertraging, toegankelijkheid, framerate of iPhone-scrollpositie. De bestaande toestelbevestiging van positie is afzonderlijk bewijs.

## Volgende gerichte hertest
Stop Metro met Control+C. Haal in `~/projects/teevee` de nieuwe versie op met `git pull --ff-only`, installeer de toegevoegde testtooling met `npm install` en start `npm run start:clean`. Open opnieuw via Expo Go; de app zelf gebruikt geen nieuwe native dependencies.

Test enkele verschillende programma's, ook een smal blok. Let op de reactie direct na de tik en daarna op de schuifbeweging. Sluit opnieuw en controleer dat tijd- en zenderpositie behouden blijven. Meld of de reactie merkbaar directer is; geen stopwatch of verplicht verbeterpercentage nodig.

Bij aanhoudende traagheid: profiler/screenrecording gebruiken om wachten vóór de animatie te onderscheiden van de native overgang, en later release-achtig vergelijken. Nog geen nieuwe animatieparameters gokken. Leesbaarheid, ontbrekende tekst, grotere tekst en light/dark worden daarna apart afgerond.

## Beeldmateriaal en samenvatting
De eerste iPhone-screenshot rond 19:43 staat in de ontwikkelthread; er is geen nieuwe opname of instrumentele meting ontvangen.

**Scrollbaseline blijft akkoord. Detailfunctie en positiebehoud zijn bevestigd, maar tikrespons vraagt hertest na de rendercorrectie. Phase 1 blijft open**, inclusief leesbaarheid, toegankelijkheid, lifecycle, Android en release-achtige performance.
