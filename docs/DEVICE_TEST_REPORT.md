# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 08:40 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub.
Een groene CI of een test met gemockte native hosts is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons en gerichte swipe-dismiss-wijzigingenset zijn eerder kwalitatief geaccepteerd op dit toestel.
- De nieuwe Dynamic Type-layout op main `da61b3cf10f8bf79e552f2b3eacdb289439810ce` is **nog niet op het toestel getest**.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van:
- standaard platforminertie, doorlopende tijdlijn, dagovergang en geanimeerde `Nu`;
- detailrespons na render-isolatie, inclusief sluiten met knop en buiten het paneel;
- de swipe-down dismissal change set, inclusief gevraagde korte trek/terugveer en heropenen als gezamenlijke testset.

Dit zijn kwalitatieve bevestigingen, geen afzonderlijke timings, framerates of volledige randgevalmetingen. Heropen deze instellingen niet zonder concreet regressiesignaal.

## Dark-modebeelden — ontvangen en beoordeeld
De gebruiker leverde de gids met geopende details en de gids zonder dimlaag aan. Die screenshots zijn reeds beoordeeld; vraag ze niet opnieuw op.

Visuele bevindingen:
- donkere modus vormt een bruikbare leesbare basis; hoofdtekst en programmavlakken zijn duidelijk van de achtergrond te onderscheiden;
- titel, beschrijving en `Sluiten` waren in het getoonde detail zichtbaar; het handvat was subtiel;
- lange synthetische zendernamen braken midden in woorden af (`Internation` / `aal 2`, enz.);
- bij deels horizontaal uit beeld geschoven programmablokken verdwijnen beginletters en soms delen van de tijd achter de vaste zenderkolom;
- de linkerste tijdasmarkering kan gedeeltelijk worden afgesneden;
- de screenshot in een toekomstig zichtbaar tijdvak levert op zichzelf geen bewijs over de current-time-lijn of progressnauwkeurigheid;
- een blauw zwevend tandwiel in één beeld heeft onbekende herkomst en wordt niet als Teevee-UI geïnterpreteerd.

Het afzonderlijke TVgids.nl-beeld van Nu & Straks is een interactiereferentie, geen Teevee-toesteltest.

## Nieuwste implementatie — klaar voor grotere-teksttest
PR #3 is geïntegreerd op main als **`da61b3cf10f8bf79e552f2b3eacdb289439810ce`**.

Gerichte wijzigingen:
- Totaal leest de systeem-`fontScale` en vergroot rijhoogte, zenderrail en tijdas naarmate tekst groter wordt;
- de default font scale houdt de eerder geaccepteerde basisgeometrie;
- bij grotere tekst blijft de programmatitel primair en wordt de secundaire starttijd in programmablokken weggelaten als de beschikbare dichtheid te laag wordt;
- zendernamen blijven één regel en ellipsen in plaats van willekeurig midden in woorden te breken;
- dag- en `Nu`-bediening hebben minimaal 44 logische punten touchhoogte;
- het kanaalmodel ondersteunt optioneel `logoUrl` en de kanaalcomponent kan logo primair tonen met de volledige naam als subtiele visuele tekst én accessibility label;
- wanneer een logo ontbreekt of faalt, blijft een schone tekstfallback zichtbaar.

De fixture bevat bewust **geen echte logo's**. Logoherkenning, uiteindelijke afmetingen/vormgeving en productierechten zijn dus niet getest of goedgekeurd.

De eerder geaccepteerde scrollinertie, bounce, doorlopende tijdlijn, `Nu`, detailmodal en swipe-drempels zijn in deze increment niet gewijzigd.

## Technische verificatie
- Exacte PR-head `4c67e6cfc369e0b0f54c93ecd26bfc457336f631`: **PR-CI #69 geslaagd**.
- Integratie op main `da61b3cf10f8bf79e552f2b3eacdb289439810ce`: **main-CI #70, run `34743172096`, geslaagd**.
- Beide CI-paden controleerden installatie, strict TypeScript, lint, tests en iOS/Android/web Expo bundle exports.
- Pure tests bewaken de font-scale-layout bij 1.0, 1.5 en een accessibility-achtige 2.5, plus ongeldige input.
- De React-integratietest gebruikt gemockte native hosts en een vaste test-fontscale. Dit bewijst geen echte iOS-layout, VoiceOver-ervaring of touchbereikbaarheid.

## Kerncheck
| Onderdeel | Toestelbewijs | Status |
|---|---|---|
| App opent in Gids | Opent/rendert via Expo Go in eerdere build. | Bevestigd. |
| Horizontaal bereik / dagovergang / Nu | Gerichte hertest met "perfect". | Kwalitatief akkoord; niet gewijzigd. |
| Verticale inertie en bounce | Standaardinstellingen kwalitatief akkoord. | Behouden. |
| Programmadetail openen/respons | "Perfect" na rendercorrectie. | Kwalitatief akkoord. |
| Sluiten via knop/achtergrond | Expliciet bevestigd. | Akkoord behouden. |
| Neerwaarts wegvegen | Gerichte hertest met "perfect". | Kwalitatief akkoord. |
| Gidspositie behouden | Eerder bevestigd. | Geen regressie gemeld. |
| Dark-modegids/detail | Beide beelden ontvangen. | Visueel bruikbare basis; geen formele contrasttest. |
| Zendernaam zonder mid-word breuk | Codecorrectie op main. | **Toesteltest op nieuwe build nodig.** |
| Systeemtekst >100% / Dynamic Type | Nieuwe adaptieve layout op main. | **Nog geen toestelbewijs.** |
| Detailinhoud bij grote tekst | Huidige detailbody heeft geen interne ScrollView. | **Bereikbaarheid gericht testen.** |
| Deels verborgen programma-informatie achter zenderrail | Zichtbaar in eerder screenshot. | Open; niet opgelost door deze increment. |
| Screenreader / VoiceOver | Geen toesteltest. | Open. |
| Themawisseling tijdens gebruik | Geen afzonderlijke test. | Open. |
| Voortgang / tijdnauwkeurigheid | Niet afzonderlijk gevalideerd. | Open. |
| Android / release-achtige performance | Geen apparaatmeting. | Open. |

## Gerichte volgende iPhone-validatie
Gebruik main `da61b3cf10f8bf79e552f2b3eacdb289439810ce` of nieuwer. Na `git pull --ff-only` en `npm run start:clean`:

1. Zet de iPhone-systeemtekst duidelijk groter dan standaard; een accessibility-grootte is juist nuttig voor deze test.
2. Open Totaal en controleer of de zenderkolom en programmarijen horizontaal op dezelfde hoogte blijven, ook na verticaal scrollen.
3. Controleer `Gids`, dagkeuze, `Nu`, tijdas, zendernamen en programmatitels op clipping/overlap. De layout mag minder compact zijn; essentiële tekst mag niet onbruikbaar worden.
4. Open een programmadetail met beschrijving. Controleer of titel, metadata, volledige relevante beschrijving en `Sluiten` bereikbaar blijven.
5. Alleen als er een concreet probleem zichtbaar is: noteer wat ontbreekt/overlapt en lever bij voorkeur één screenshot van die toestand.

Geen noodzaak om de eerder geaccepteerde standaard-font scroll- en swipegevoelens opnieuw uitgebreid te testen, tenzij deze grotere-tekstbuild daar daadwerkelijk een regressie veroorzaakt.

## Belangrijke grens voor detailinhoud
ProgrammeDetail heeft momenteel geen interne ScrollView. Als grotere systeemtekst of een lange beschrijving de inhoud buiten bereik duwt, is dat een geldige bevinding en wordt de volgende implementatie scrollbaar. Daarbij moet lezen/scrollen worden afgestemd op swipe-to-dismiss, bijvoorbeeld via een duidelijke dragzone of door dismissal alleen aan de bovenrand van de content-scroll toe te staan. Reading-scroll mag niet onbedoeld sluiten.

## Samenvatting
**De eerder geaccepteerde iPhone-interactiebaseline blijft staan. Dark mode is visueel beoordeeld. De eerste Dynamic Type/layoutcorrectie is technisch groen en geïntegreerd, maar grotere systeemtekst en detailbereikbaarheid moeten nu fysiek op de iPhone worden gevalideerd voordat dit accessibility-deel van Phase 1 kan worden afgesloten.**
