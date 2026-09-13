# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 08:55 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of een test met gemockte native hosts is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons en gerichte swipe-dismiss-wijzigingenset zijn eerder kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van:
- standaard platforminertie, doorlopende tijdlijn, dagovergang en geanimeerde `Nu`;
- detailrespons na render-isolatie, inclusief sluiten met knop en buiten het paneel;
- swipe-down dismissal als gerichte wijzigingenset, inclusief korte trek/terugveer en heropenen.

Dit zijn kwalitatieve bevestigingen, geen timings, framerates of volledige randgevalmetingen. Heropen deze instellingen niet zonder concreet regressiesignaal.

## Dark-modebeelden — eerder ontvangen en beoordeeld
De gebruiker leverde de Guide met geopende details en de Guide zonder dimlaag aan. De beelden zijn beoordeeld; vraag ze niet opnieuw op.

Vastgelegde bevindingen:
- dark mode vormt een bruikbare visuele basis; hoofdtekst en programmavlakken zijn duidelijk van de achtergrond te onderscheiden;
- titel, beschrijving en `Sluiten` waren in het getoonde detail zichtbaar; het handvat was subtiel;
- lange synthetische zendernamen braken in de oude layout midden in woorden;
- bij deels horizontaal uit beeld geschoven programmablokken kunnen beginletters en delen van tijden achter de vaste zenderkolom verdwijnen;
- de linkerste tijdasmarkering kan gedeeltelijk worden afgesneden;
- een screenshot in een toekomstig tijdvak is geen afzonderlijk bewijs voor current-time/progressnauwkeurigheid;
- een blauw zwevend tandwiel in één beeld heeft onbekende herkomst en wordt niet als Teevee-UI geïnterpreteerd.

Het afzonderlijke TVgids.nl-beeld van Nu & Straks is een interactiereferentie, geen Teevee-toesteltest.

## Grotere systeemtekst — eerste fysieke hertest
De product owner heeft de Dynamic Type-versie op dezelfde iPhone getest met systeemtekst duidelijk groter dan normaal en leverde een screenshot met beeldtijd **08:44**.

Gerapporteerde resultaten:

| Controle | Toestelbewijs | Resultaat |
|---|---|---|
| Zenderkolom en programmarijen blijven uitgelijnd | Antwoord: `Ja` | **Geslaagd op deze test** |
| Gids/chrome leesbaar bij grote tekst | Screenshot | **Defect aangetroffen** |
| Programmadetail relevante inhoud + `Sluiten` bereikbaar | Antwoord: `ja` | **Geslaagd op deze test** |

### Concreet defect uit screenshot
- De grote titel `Gids` was zichtbaar afgesneden/clipped.
- De daglabels werden geellipst, zichtbaar als onder meer `Van...` en `Ma 1...`.
- De tijdas en Guide-chrome hielden bij deze fontscale te weinig horizontale leesruimte over.

De bevestigde alignment is belangrijk: de schaalbare rijhoogte en gesynchroniseerde zender/programmarijen werkten op dit toestel. De bevestigde detailbereikbaarheid betekent dat er op basis van deze test **geen reden is om ProgrammeDetail nu al intern scrollbaar te maken**. Dat blijft een latere oplossing wanneer echte lange content buiten bereik blijkt; dan moet reading-scroll expliciet met swipe-to-dismiss worden gecoördineerd.

## Correctie naar aanleiding van de 08:44-test
PR #4 corrigeert uitsluitend de grote-tekst-layout/chrome en laat de geaccepteerde interacties ongemoeid:
- vaste line-heights verwijderd van schaalbare Guide-/programmatitels;
- vanaf large-text mode krijgen header en dagbediening eigen breedte door een gestapelde layout;
- minuten-schaal en tick-labelruimte groeien mee met `fontScale`, waardoor tijdlabels en programmablokken meer horizontale leesruimte krijgen;
- tijdgeometrie blijft intern consistent: timeline width, programme frames, current-time positie, day jumps en scroll-naar-tijd gebruiken dezelfde schaal;
- de 100%-fontscale behoudt de eerder geaccepteerde basisgeometrie.

Geen wijziging aan scrollinertie, bounce, directional lock, native detailmodal, bestaande close-routes of swipe-dismiss-drempels.

## Technische verificatie
- Eerste Dynamic Type-increment: PR #3 geïntegreerd als `da61b3cf10f8bf79e552f2b3eacdb289439810ce`; PR-CI #69 en main-CI #70 waren groen.
- Documentatiestatus `a858525ac40c4c4807a6e1a9e0afa6fc77eadf9f`: CI #71 groen.
- Grote-tekstcorrectie PR #4 exact head **`536de5b778725d2f91dba3f734c4efecd8d78028`**: **CI #74, run `34743728065`, geslaagd**.
- PR #4 geïntegreerd op main als **`4f4fa94c6b1968ca03bb551fde9bb7ed376b2113`**.
- Exacte main-integratie: **CI #75, run `34743812493`, geslaagd**. Installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports waren allemaal succesvol.

Dit technische bewijs vervangt de fysieke hertest van de gecorrigeerde layout niet.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | Bevestigd in eerdere tests |
| Horizontaal bereik / dagovergang / Nu | Kwalitatief akkoord; ongewijzigd |
| Verticale inertie/bounce | Kwalitatief akkoord; ongewijzigd |
| Detail openen/respons | Kwalitatief akkoord |
| Sluiten knop/achtergrond | Kwalitatief akkoord |
| Swipe-down dismissal | Kwalitatief akkoord |
| Gidspositie behouden | Eerder bevestigd |
| Dark mode | Visueel bruikbare basis; geen formele contrastmeting |
| Zender-/programmarijalignment bij grote tekst | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| Gidsheader/daglabels bij grote tekst | Defect gezien; codecorrectie geïntegreerd, **hertest nodig** |
| Deels verborgen programme-informatie achter zenderrail | Open apart punt |
| VoiceOver/screenreader | Open |
| Themawisseling tijdens gebruik | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende gerichte iPhone-validatie
Gebruik main `4f4fa94c6b1968ca03bb551fde9bb7ed376b2113` of nieuwer. Na `git pull --ff-only` en `npm run start:clean`, laat de iPhone op dezelfde grote systeemtekststand staan.

Controleer alleen:
1. `Gids`, `Nu`, beide daglabels, tijdas en programmatitels zijn volledig leesbaar zonder clipping/rare overlap.
2. Zenderkolom en programmarijen blijven nog steeds uitgelijnd bij verticaal scrollen.
3. Een programmadetail blijft bereikbaar inclusief `Sluiten`.

Geen uitgebreide herhaling van de eerder geaccepteerde scroll-/swipetests nodig, tenzij deze build daar daadwerkelijk een regressie veroorzaakt. Bij een defect volstaat een korte beschrijving plus één screenshot van die toestand.

## Samenvatting
**De eerste echte larger-text toesteltest bevestigde alignment en detailbereikbaarheid, maar vond een concreet clipping/ellipsis-probleem in de Guide-chrome. Dat probleem is gericht gecorrigeerd en technisch groen geïntegreerd op main. Eén korte hertest op dezelfde grote tekststand is nu het ontbrekende bewijs voor deze accessibility-increment.**
