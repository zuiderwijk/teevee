# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 09:34 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of een test met gemockte native hosts is geen geslaagde toesteltest.

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
- bij deels horizontaal uit beeld geschoven programmablokken konden beginletters en delen van tijden achter de vaste zenderkolom verdwijnen;
- de linkerste tijdasmarkering kan gedeeltelijk worden afgesneden;
- een screenshot in een toekomstig tijdvak is geen afzonderlijk bewijs voor current-time/progressnauwkeurigheid;
- een blauw zwevend tandwiel in screenshots heeft onbekende herkomst en wordt niet als Teevee-UI geïnterpreteerd.

Het afzonderlijke TVgids.nl-beeld van Nu & Straks is een interactiereferentie, geen Teevee-toesteltest.

## Grotere systeemtekst — 08:44 en 08:59
De eerste Dynamic Type-versie is op dezelfde iPhone getest met systeemtekst duidelijk groter dan normaal. De 08:44-test bevestigde zender/programmarij-uitlijning en bereikbaarheid van programmadetail inclusief `Sluiten`, maar vond drie concrete layoutproblemen: `Gids` werd verticaal afgesneden, daglabels ellipsten en Guide-chrome/tijdas hielden te weinig leesruimte over.

PR #4 corrigeerde die layout zonder scrollinertie, bounce, directional lock, detailmodal of swipe-dismissal te wijzigen. De hertest om **08:59** bevestigde fysiek:
- `Gids` volledig zichtbaar;
- `Nu` volledig zichtbaar;
- beide daglabels volledig leesbaar;
- tijdaslabels zoals `08:30`, `09:00`, `09:30` volledig leesbaar;
- zenderrail en programmarijen nog steeds uitgelijnd;
- geen eerdere verticale line-height-clipping meer in programmatitels.

Daarmee is de gerichte grote-tekst/chrome-correctie fysiek geaccepteerd op deze iPhone. Omdat de geteste detailinhoud bereikbaar bleef, is er op basis van dit bewijs geen reden om ProgrammeDetail nu al intern scrollbaar te maken.

## Partial-left programme-readability — PR #5
De 08:59-screenshot bevestigde ook het aparte probleem dat de begintekst van een programma kan verdwijnen wanneer de echte programmastart links achter de vaste zenderrail ligt.

PR #5 maakte dat geometry-safe:
- het programmablok behoudt de echte startpositie en duur-gebaseerde breedte;
- alleen innerlijke titel/tijd-inhoud kan naar het zichtbare restant worden verankerd;
- de tekstcontainer gebruikt alleen de resterende zichtbare breedte, zodat ellipsis eerlijk blijft;
- een starttijd wordt niet getoond wanneer hij niet volledig past;
- accessibility-labels behouden volledige titel, begin- en eindtijd.

Technisch was PR #5 groen: head `de308881e102b40d4f7739944b32c0c5e9e22888`, CI #86 / run `34744460640`; merge `1e8aa125819472eb6ac76b0a41c0243973c4a003`, main-CI #87 / run `34744549991`.

## Gerichte iPhone-hertest — 09:20 screenshot
De product owner testte PR #5 en leverde een screenshot met beeldtijd **09:20** plus drie concrete observaties.

1. **Titelverankering is te laat.** Wanneer een programmanaam achter de vaste zenderrail scrollt, komt de titel pas opnieuw in het zichtbare restant wanneer de vinger wordt losgelaten / de oude settled-update plaatsvindt. Producteis: de innerlijke programme-inhoud moet **tijdens de swipe en momentumbeweging continu** met de zichtbare viewport meebewegen. Het programmablok zelf mag nog steeds niet verschuiven of van breedte veranderen.
2. **Actieve dagstatus reageert niet goed genoeg op expliciete selectie.** Bij het klikken van Vandaag naar de volgende dag bleef de zwarte actieve-buttonstatus niet betrouwbaar/immediately synchroon met de gekozen dag. Producteis: een expliciete dagtap moet meteen de geselecteerde visuele state tonen; handmatig horizontaal browsen mag de actieve dag daarna nog steeds uit de zichtbare tijd afleiden.
3. **Primaire tijdnavigatie moet één regel blijven.** De eigenaar wil `Vandaag`, `Morgen` en `Nu` altijd op één horizontale regel. De compacte control-labels mogen daarom lokaal begrensd schalen zodat deze rij niet verticaal uiteenvalt. `Morgen` vervangt de weekday/date als visueel label; de werkelijke datum blijft via accessibility-context beschikbaar.

De screenshot liet daarnaast zien dat de eerder gecorrigeerde grote-tekstbasis nog bruikbaar bleef. De blauwe zwevende tandwielknop is opnieuw zichtbaar maar blijft van onbekende herkomst en wordt niet als Teevee-productchrome beoordeeld.

PR #5 is op basis van deze hertest dus **niet als finale partial-left-interactie geaccepteerd**; de geometry-safe basis blijft wel bruikbaar.

## PR #6 — live title movement + one-row controls
PR #6 corrigeert de drie 09:20-bevindingen zonder de echte EPG-geometrie of geaccepteerde scrollinstellingen te veranderen:
- de bestaande horizontale `onScroll`-eventstroom zet de actuele viewportpositie in een Reanimated shared value;
- de innerlijke programme-title/tijdcontainer gebruikt animated styles en volgt die viewportpositie continu tijdens drag en momentum, zonder viewport-x op elk frame in React state te zetten;
- de starttijd verdwijnt live zodra onvoldoende zichtbare breedte overblijft voor een complete tijd;
- een expliciete Vandaag/Morgen-tap zet de actieve day-state onmiddellijk en beschermt die tijdens de eigen animated jump tegen een tijdelijke terug-flip;
- `Vandaag`, `Morgen` en `Nu` staan op één rij;
- uitsluitend de compacte labels van deze drie controls hebben `maxFontSizeMultiplier=1.2`; de Guide-content zelf blijft Dynamic Type volgen;
- `Morgen` exposeert voor accessibility ook de echte datum.

### Technische verificatie
De eerste PR #6 CI-run **#91 / `34745304913`** vond een test-harnessprobleem: de eerste variant gebruikte `useAnimatedScrollHandler`, terwijl de bestaande Reanimated mock die export niet bevatte. Typecheck en lint waren al groen; twee integratietests faalden op de ontbrekende mock. Er zijn geen checks uitgezet. De implementatie is vervolgens vereenvoudigd naar de reeds bestaande RN-scroll-eventstroom plus Reanimated shared value.

De finale head **`fd80c4d66cb6bab2b57f39f7ca12104fe9b419ce`** passeerde **CI #92 / run `34745389220`** volledig: installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

PR #6 is gesquasht naar main als **`dd01a36055e4f2f7841d4a1b9ecf8461e3820002`**. De exacte merge passeerde **main-CI #93 / run `34745481415`** volledig met dezelfde gates.

Dit is technisch bewijs, geen fysiek bewijs dat de beweging op de iPhone inderdaad continu aanvoelt.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | Bevestigd in eerdere tests |
| Horizontaal bereik / standaardinertie / bounce | Kwalitatief akkoord; instellingen ongewijzigd in PR #6 |
| Verticale inertie/bounce | Kwalitatief akkoord; ongewijzigd |
| Detail openen/respons | Kwalitatief akkoord |
| Sluiten knop/achtergrond | Kwalitatief akkoord |
| Swipe-down dismissal | Kwalitatief akkoord |
| Gidspositie behouden | Eerder bevestigd |
| Dark mode | Visueel bruikbare basis; geen formele contrastmeting |
| Zender-/programmarijalignment bij grote tekst | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| Gidsheader/tijdas bij grote tekst | **Fysiek bevestigd na PR #4** |
| Partial-left programme-content geometry | Geometry-safe code technisch groen |
| Continue titelbeweging tijdens swipe | **PR #6 technisch groen; fysieke hertest nodig** |
| Vandaag/Morgen/Nu op één regel | **PR #6 technisch groen; fysieke hertest nodig** |
| Actieve dag direct na tap | **PR #6 technisch groen; fysieke hertest nodig** |
| VoiceOver/screenreader | Open |
| Themawisseling tijdens gebruik | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende gerichte iPhone-validatie
Gebruik main **`dd01a36055e4f2f7841d4a1b9ecf8461e3820002`** of nieuwer. Laat dezelfde vergrote systeemtekststand actief.

Controleer uitsluitend:
1. Tijdens **de horizontale swipe zelf én tijdens momentum** beweegt de programmatitel mee naar het zichtbare restant wanneer zijn echte blokstart achter de zenderrail verdwijnt; er mag geen sprong pas na loslaten meer zijn. Het blok zelf blijft op zijn echte start/duur staan.
2. `Vandaag`, `Morgen` en `Nu` staan op één horizontale regel.
3. Een tap op `Morgen` maakt `Morgen` direct geselecteerd/zwart; een tap op `Vandaag` doet hetzelfde voor Vandaag. `Nu` keert terug naar vandaag/de actuele tijd.
4. Meld alleen als de eerder geaccepteerde horizontale scroll nu merkbaar springerig of zwaarder aanvoelt.

Een screenshot na de test plus een kort ja/nee voor **continue titelbeweging** en **directe active-day response** is voldoende. Een screenshot alleen kan de beweging tijdens de swipe niet bewijzen.

## Samenvatting
**De 09:20-toesteltest vond drie concrete UX-gaten in PR #5. PR #6 corrigeert deze technisch: programme-inhoud volgt de swipe continu, expliciete dagselectie wordt direct actief en Vandaag/Morgen/Nu blijven op één rij met alleen voor deze compacte labels lokaal begrensde font scaling. PR- en main-CI zijn groen; één gerichte iPhone-hertest ontbreekt nog.**