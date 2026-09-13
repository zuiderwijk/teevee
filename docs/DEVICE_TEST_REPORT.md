# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 09:12 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of een test met gemockte native hosts is geen geslaagde toesteltest.

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
- een blauw zwevend tandwiel in screenshots heeft onbekende herkomst en wordt niet als Teevee-UI geïnterpreteerd.

Het afzonderlijke TVgids.nl-beeld van Nu & Straks is een interactiereferentie, geen Teevee-toesteltest.

## Grotere systeemtekst — eerste fysieke hertest
De product owner heeft de eerste Dynamic Type-versie op dezelfde iPhone getest met systeemtekst duidelijk groter dan normaal en leverde een screenshot met beeldtijd **08:44**.

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

## Gecorrigeerde grote-tekst hertest — 08:59 screenshot
De product owner heeft de geïntegreerde correctie opnieuw op dezelfde iPhone en dezelfde materially enlarged systeemtekststand getest en een screenshot met beeldtijd **08:59** aangeleverd.

Visueel toestelbewijs:
- `Gids` is volledig zichtbaar en wordt niet meer verticaal afgesneden;
- `Nu` is volledig zichtbaar;
- `Vandaag` en `Ma 14 Sep` zijn volledig leesbaar en niet meer geellipst;
- tijdaslabels zoals `08:30`, `09:00` en `09:30` zijn volledig leesbaar;
- zenderrail en programmarijen blijven visueel op dezelfde rijhoogte uitgelijnd;
- programmatitels schalen zonder de eerdere verticale line-height-clipping.

Daarmee is de **gerichte grote-tekst/chrome-correctie fysiek geaccepteerd voor deze iPhone-test**.

De screenshot bevestigde tegelijk opnieuw het reeds apart geregistreerde punt dat programma-inhoud die horizontaal gedeeltelijk achter de vaste zenderrail ligt aan de linkerkant kan worden afgesneden. Dat was geen regressie van PR #4.

De blauwe zwevende tandwielknop overlapt opnieuw delen van de UI, maar de herkomst is nog steeds niet vastgesteld en hij wordt niet als Teevee-productchrome beoordeeld.

## Nieuwe correctie — gedeeltelijk links verborgen programma-inhoud
PR #5 pakt uitsluitend dit afzonderlijke readability-punt aan. De echte EPG-geometrie wordt niet aangepast:
- het programmablok behoudt zijn originele left-position en duur-gebaseerde breedte;
- alleen de tekstinhoud krijgt na drag-/momentum-einde een viewport-afhankelijke inset wanneer de echte programmastart links buiten beeld ligt;
- de tekstcontainer wordt beperkt tot de daadwerkelijk resterende zichtbare breedte zodat titel-ellipsis eerlijk blijft;
- de starttijd wordt alleen getoond als er genoeg zichtbare breedte over is om de volledige tijd te tonen;
- accessibility-labels blijven volledige titel, begin- en eindtijd bevatten;
- de nieuwe readability-offset wordt niet op ieder scrollframe in React-state gezet, zodat de zware Guide niet op scrollfrequentie opnieuw hoeft te renderen.

Geen wijziging aan `decelerationRate`, bounce, directional lock, dag/Nu-semantiek, programmadetail of swipe-dismissal.

## Technische verificatie
- Eerste Dynamic Type-increment: PR #3 geïntegreerd als `da61b3cf10f8bf79e552f2b3eacdb289439810ce`; PR-CI #69 en main-CI #70 waren groen.
- Documentatiestatus `a858525ac40c4c4807a6e1a9e0afa6fc77eadf9f`: CI #71 groen.
- Grote-tekstcorrectie PR #4 exact head **`536de5b778725d2f91dba3f734c4efecd8d78028`**: **CI #74, run `34743728065`, geslaagd**.
- PR #4 geïntegreerd op main als **`4f4fa94c6b1968ca03bb551fde9bb7ed376b2113`**; main-CI #75 / run `34743812493` geslaagd.
- Partial-left readability PR #5 exact head **`de308881e102b40d4f7739944b32c0c5e9e22888`**: **CI #86, run `34744460640`, geslaagd**.
- PR #5 geïntegreerd op main als **`1e8aa125819472eb6ac76b0a41c0243973c4a003`**; **main-CI #87 / run `34744549991` geslaagd** met installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

De 08:59-screenshot levert het fysieke bewijs voor de large-textcorrectie. De nieuwe partial-left tekstverankering heeft nog **geen** fysiek toestelbewijs; CI bewijst alleen code/buildintegriteit.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | Bevestigd in eerdere tests |
| Horizontaal bereik / dagovergang / Nu | Kwalitatief akkoord; settings ongewijzigd in PR #5 |
| Verticale inertie/bounce | Kwalitatief akkoord; ongewijzigd |
| Detail openen/respons | Kwalitatief akkoord |
| Sluiten knop/achtergrond | Kwalitatief akkoord |
| Swipe-down dismissal | Kwalitatief akkoord |
| Gidspositie behouden | Eerder bevestigd |
| Dark mode | Visueel bruikbare basis; geen formele contrastmeting |
| Zender-/programmarijalignment bij grote tekst | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| Gidsheader/daglabels/tijdas bij grote tekst | **Fysiek bevestigd na correctie** |
| Deels verborgen programme-informatie achter zenderrail | **Codecorrectie geïntegreerd en CI-groen; gerichte iPhone-hertest nodig** |
| VoiceOver/screenreader | Open |
| Themawisseling tijdens gebruik | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende gerichte iPhone-validatie
Gebruik main **`1e8aa125819472eb6ac76b0a41c0243973c4a003`** of nieuwer. Na `git pull --ff-only` en `npm run start:clean`:

1. Horizontaal scrollen tot een **langer** programmablok links gedeeltelijk achter de vaste zenderrail ligt.
2. Vinger loslaten en eventuele momentumscroll volledig laten stoppen.
3. Controleren dat het programmablok zelf niet springt of van breedte verandert, maar de titel in het zichtbare restant leesbaar begint.
4. Als een starttijd zichtbaar is, moet die volledig leesbaar zijn; bij te weinig ruimte hoort hij te ontbreken in plaats van als fragment te verschijnen.
5. Alleen melden als de eerder geaccepteerde horizontale scroll nu merkbaar springerig of anders aanvoelt.

Een enkele screenshot **nadat de horizontale beweging volledig gestopt is** is voldoende. Geen uitgebreide herhaling van de overige reeds geaccepteerde flows nodig.

## Samenvatting
**Dynamic Type/chrome is fysiek geaccepteerd. Het afzonderlijke partial-left programme-readability-probleem is nu geometry-safe geïmplementeerd en technisch groen op main, maar heeft nog één gerichte iPhone-hertest nodig voordat ook deze increment kan worden geaccepteerd.**
