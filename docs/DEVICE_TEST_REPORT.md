# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 14:16 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons, swipe-down dismissal, PR #9 live partial-left programme-readability, PR #11 time-axis clipping en PR #12 reverse-scroll readability zijn kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van standaard platforminertie, doorlopende tijdlijn/dagovergang/`Nu`, detailrespons en swipe-down dismissal. Heropen deze instellingen niet zonder concreet regressiesignaal.

PR #7 is fysiek geaccepteerd: normale startup, `Vandaag · Morgen · Nu` op één regel, directe selected-state, `Nu`-terugkeer en ongewijzigd/natuurlijk horizontaal scrollgevoel.

PR #9 is fysiek geaccepteerd voor de native/UI-thread gesynchroniseerde partial-left programmatitel tijdens drag, momentum en programmaboundaries. De programma-geometrie en scrollphysics uit die baseline zijn bevroren tenzij concreet regressiebewijs ontstaat.

PR #11 is fysiek geaccepteerd voor de afzonderlijke time-axis clippingcorrectie: vertrekkende tijdlabels verdwijnen als geheel, zonder losse `:30`/`30`-fragmenten, terwijl tickposities tijdgetrouw blijven.

PR #12 is fysiek geaccepteerd voor sterke forward/reverse beweging: de reverse-scroll titelblanking komt niet terug en de PR #9/PR #11-baselines blijven intact.

## Dark mode en grotere systeemtekst
De eerder aangeleverde dark-mode Guide- en detailbeelden zijn beoordeeld; vraag ze niet opnieuw op. Dark mode is visueel bruikbaar. PR #13 bewijst technisch dat de system-theme hook live updates ontvangt, maar de echte iOS light↔dark wissel terwijl de app open blijft moet nog fysiek worden gevalideerd.

Bij duidelijk vergrote systeemtekst vond de eerste test clipping in `Gids` en daglabels. PR #4 corrigeerde dit. De hertest om **08:59** bevestigde `Gids`, `Nu`, daglabels en tijdas volledig zichtbaar, zenderrail/programmarijen uitgelijnd en programmadetail plus `Sluiten` bereikbaar. Deze gerichte large-text/chrome-correctie is fysiek geaccepteerd.

## Partial-left programme-readability — historie
PR #5 maakte settled readability geometry-safe: de echte programmastart en duur-gebaseerde blokbreedte veranderen niet; na settle kan titel/tijd naar het zichtbare restant worden verankerd. De 09:20 iPhone-test bevestigde dat dit inhoudelijk werkte maar te laat kwam: de titel moest al tijdens drag en momentum leesbaar blijven.

PR #6 probeerde dit met per-programme Reanimated animated styles. PR/main CI waren groen, maar de eerste fysieke iPhone-start gaf een wit scherm gevolgd door een Expo Go-crash. De rollback naar **`f7c9f73568341d29e518be21e0de071e4ef7877d`** werd fysiek bevestigd als weer normaal startend. Daarmee is de PR #6-architectuur afgewezen voor deze fixture.

## PR #8 — technisch groen, fysiek afgewezen
`ScreenRecording_09-13-2026 10-49-27_1.MP4` liet zien dat de native ScrollView tijdens drag/momentum voorliep op de React-state overlay. Een oude edge kon zichtbaar blijven terwijl de tijdlijn al verder was en opvolgende content bedekken. De onderliggende programmablokken bleven geometrisch stabiel.

Conclusie: **PR #8 fysiek afgewezen** ondanks groene CI.

## PR #9 — fysiek geaccepteerde native/UI-thread synchronisatie
PR #9 verplaatste edge-geometrie naar UI-thread shared values. React wisselt alleen edge-inhoud op programmaboundaries; een eventueel vertraagde oude edge stopt uiterlijk bij zijn echte programma-einde met tekenen. Slechts 48 kleine edge-rijen krijgen live animated geometry.

Technische verificatie:
- implementation head **`ff39a16e717e5f89f57509d6b18b54b72e9d1d3a`**: PR CI #125 / `34748926153` volledig geslaagd;
- definitieve PR-head **`8a37cef550e0558a03d0876a356e295ff4ac424b`**: PR CI #128 / `34749068020` volledig geslaagd;
- exact-main CI #129 / `34749225666` volledig geslaagd.

### Screen recording 11:35 — fysiek bewijs
`ScreenRecording_09-13-2026 11-35-40_1.MP4` liet frame-voor-frame zien:
- stabiele sessie zonder white-screen/crash;
- partial-left programmatitel volgt de zichtbare linker rand tijdens drag;
- relatie blijft coherent tijdens momentum;
- oude edge verdwijnt bij het echte programma-einde en bedekt geen opvolger;
- programmaframes ogen stabiel en scrollgevoel blijft overeenkomen met de eerder geaccepteerde baseline.

Conclusie: **PR #9 fysiek geaccepteerd en bevroren.**

## PR #10 — technisch groen, fysiek afgewezen
PR #10 gaf ieder halfuurlabel een Reanimated opacity-style. Final implementation head **`efeedc08d3a6c50f3ef3fc9f119e8da5e3860b2b`** passeerde PR CI #140 / `34750478071` volledig.

### Screen recording 13:09 — fysiek bewijs
`ScreenRecording_09-13-2026 13-09-16_1.MP4` liet zien:
- rond **8,7 s** blijft links alleen **`30`** van een tijdlabel zichtbaar;
- tijdens snelle horizontale beweging verdwijnen meerdere programmatitels tijdelijk terwijl de blokken zichtbaar blijven;
- programme frames blijven wel visueel stabiel.

Conclusie: **PR #10 fysiek afgewezen.** De per-tick Reanimated-opacityarchitectuur mag niet opnieuw worden ingevoerd.

De destijds aangenomen hypothese dat de extra animated tijdlabels de titelblanking veroorzaakten is door de latere PR #11-opname weerlegd: de titelblanking bleef bestaan nadat alle per-tick animaties waren verwijderd.

## PR #11 — single left-edge mask: time-axis fysiek geaccepteerd
PR #11 vervangt alleen de afgewezen PR #10-labelarchitectuur:
- ticklijnen en labelteksten zijn statische/native ScrollView-content;
- geen animated style per tijdlabel;
- één kleine `TimeAxisLeftMask` ligt vast aan de linker tijdasrand;
- de maskerbreedte volgt op de UI-thread het zichtbare restant van het ene label dat al gedeeltelijk uit beeld is;
- dezelfde bestaande PR #9 `scrollX` shared value wordt gebruikt;
- programme geometry en native scrollmechanica zijn niet gewijzigd.

Technische verificatie:
- PR-head **`8cba485c4c24bbf5160c652a13aba685c5520b3e`** passeerde PR CI #145 / **`34754026981`** volledig;
- PR #11 is gesquasht naar main als **`9ed7113bc114911218107263b6df224940d5dd09`**.

### Screen recording 13:48 — fysiek bewijs
De product owner leverde `ScreenRecording_09-13-2026 13-48-10_1.MP4` (14,28 s, 1170×2532).

Framecontrole van de tijdas:
- bij de overgang **13:30 → 14:00** blijft 13:30 volledig zichtbaar tot vlak voor de grens en is het in het volgende relevante frame volledig verdwenen;
- er is geen tussenframe met alleen `:30`, `30` of een ander afgesneden restant;
- hetzelfde whole-label gedrag is terug te zien bij andere bemonsterde tijdsovergangen tijdens snelle beweging;
- verticale tickposities blijven visueel stabiel; er is geen tijdlijnsprong;
- programme blocks blijven qua positie en breedte stabiel.

Conclusie voor de geïsoleerde PR #11-doelstelling: **de single-mask time-axis correctie is fysiek geaccepteerd.**

### Tegelijk blootgelegd: reverse-scroll title blanking
Dezelfde opname laat rond **7,0–7,4 s** meerdere zichtbare programmeblokken tijdelijk zonder titeltekst zien tijdens een snelle scroll terug naar eerdere tijden. Dit bleek een stale `readabilityViewportX` in de oudere PR #5 settled-readabilityberekening.

## PR #12 — reverse-scroll title blanking fix: fysiek geaccepteerd
PR #12 wijzigt alleen de pure settled-readability helper:
- re-anchoring wordt alleen toegepast wanneer de remembered viewport daadwerkelijk door het programmaframe snijdt;
- als de remembered viewport vóór het programma ligt of al op/voorbij het programma-einde is, blijft de normale volledige tekstgeometrie intact;
- PR #9 blijft verantwoordelijk voor live partial-left edge readability;
- programme `left`/`width`, native inertia/bounce/directional lock en PR #11 time-axis mask blijven ongewijzigd.

Regressietests dekken expliciet een stale viewport voorbij het programma-einde en de exacte end boundary.

Technische verificatie:
- PR-head **`0f00e69b3fc7d5211e8522367a8217ce360b9649`** passeerde PR CI #150 / **`34755583818`** volledig;
- PR #12 is gesquasht naar main als **`b76edfab972b1d6194b2cbf1460515256de0e5c4`**;
- de gedocumenteerde post-merge main passeerde CI #154 / **`34755760369`** volledig.

### Screen recording 14:04 — fysiek bewijs
De product owner leverde `ScreenRecording_09-13-2026 14-04-35_1.MP4` (10,93 s, 1170×2532).

Frame-voor-frame controle laat zien:
- een sterke fling naar later en een sterke reverse fling terug naar eerder;
- programmatitels blijven zichtbaar tijdens de reverse drag/momentum; de brede tekstloze programmeblokken uit de 13:48-opname komen niet terug;
- PR #9 partial-left edge-title blijft coherent aan de linker rand;
- PR #11 time-axis blijft vrij van afgesneden `:30`/`30`-fragmenten;
- ticks springen niet en programmeblokken behouden hun positie/breedte.

Conclusie: **PR #12 is fysiek geaccepteerd.** De reverse-scroll stale-state correctie wordt samen met PR #9 en PR #11 als Guide-interactiebaseline bevroren.

## PR #13 — VoiceOver-semantiek + live system-theme switching: technisch groen
PR #13 is een semantische/accessibility-increment en verandert geen Guide-geometrie, scrollphysics of gestures.

Wijzigingen:
- de visuele vaste zenderrail is uit de accessibility-traversal gehaald om 48 losse, dubbele zenderannouncements vóór programma-inhoud te voorkomen;
- de visuele halfuurtijdas is uit de accessibility-traversal gehaald omdat ieder programmablok zijn eigen begin/eindtijd aankondigt;
- het decoratieve `TEEVEE`-eyebrow wordt niet apart aangekondigd; `Gids` blijft een header;
- ieder programmebutton-label bevat nu zender + titel + begin/eindtijd + `nu bezig` indien actueel;
- ieder programmebutton heeft de hint `Opent programmadetails`;
- Programme Detail behoudt `accessibilityViewIsModal`, accessibility escape en de close-label `Programmadetails sluiten`.

Automatische dekking:
- de Guide-integratietest controleert self-contained programme-labels en dat de visuele rails verborgen zijn voor accessibility;
- de bestaande detailtest controleert accessibility escape;
- een nieuwe `useTeeveeTheme` render-test bewijst live **light → dark → light** op dezelfde gemounte component zonder remount en controleert de null→light fallback.

Technische verificatie:
- PR-head **`766be594f6e8af193e3f9b364c7c6378a7c210df`** passeerde PR CI #158 / **`34756492990`** volledig: install, strict TypeScript, lint, tests en iOS/Android/web Expo exports;
- PR #13 is gesquasht naar main als **`a8651b26c2521b53d0077bbd499862c3b1b71ed2`**.

Deze technische dekking bewijst niet hoe VoiceOver op het echte toestel focust/spreekt en bewijst niet de native iOS Appearance-transition in Expo Go. Daarvoor resteert één gerichte fysieke gate.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Fysiek bevestigd** |
| Horizontale scroll/inertie/bounce | **Fysiek geaccepteerde en bevroren baseline** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| PR #9 native-synced edge readability | **Fysiek geaccepteerd / frozen baseline** |
| PR #11 single left-edge time-axis mask | **Fysiek geaccepteerd** |
| PR #12 reverse-scroll title blanking | **Fysiek geaccepteerd** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| PR #13 VoiceOver semantics | **Technisch groen; fysieke VoiceOver-gate nodig** |
| PR #13 live theme switching | **Automatisch bewezen; fysieke iOS Appearance-gate nodig** |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende fysieke validatie — PR #13
Gebruik current `main`. Geen scrollretour of brede regressietest nodig.

### VoiceOver
1. Zet VoiceOver aan en begin bovenaan de Guide.
2. `Gids`, `Vandaag`, `Morgen` en `Ga naar nu` moeten logisch bereikbaar zijn.
3. De vaste visuele zenderrail en de losse halfuur-tijdas mogen niet als lange afzonderlijke focusreeksen tussen de controls en programmablokken verschijnen.
4. Focus meerdere programmablokken. Ze moeten zender, titel en begin/eindtijd spreken; een actueel programma mag bovendien `nu bezig` spreken. De actiehint moet duidelijk maken dat details geopend worden.
5. Open één Programme Detail. De inhoud en `Programmadetails sluiten` moeten bereikbaar zijn. Sluit één keer met VoiceOver twee-vinger-scrub/accessibility escape.

### Live theme
1. Laat Teevee geopend.
2. Schakel iOS Appearance Light → Dark → Light. De Guide moet direct meeschakelen zonder reload/herstart.
3. Open Programme Detail en wissel nog één keer. Zowel sheet als statusbar moeten direct de nieuwe appearance volgen.

Een korte screen recording is voldoende voor de theme-switch. Voor VoiceOver graag daarnaast één korte geschreven observatie van de uitgesproken volgorde/labels wanneer de opname de VoiceOver-audio niet bruikbaar vastlegt.

## Samenvatting
**De 14:04-opname accepteert PR #12 fysiek en sluit de Guide-scroll/readabilityreeks PR #9 + PR #11 + PR #12. PR #13 is technisch volledig groen en maakt programma-items screenreader-self-contained, verwijdert dubbele rail/tijdas-noise uit accessibility en bewijst live systeemthemawisseling automatisch. Alleen de gerichte native VoiceOver + iOS Appearance-check staat nog open.**
