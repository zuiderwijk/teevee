# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 10:14 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons en swipe-down dismissal zijn eerder kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van:
- standaard platforminertie, doorlopende tijdlijn, dagovergang en geanimeerde `Nu`;
- detailrespons, sluiten met knop en buiten het paneel;
- swipe-down dismissal.

Heropen deze instellingen niet zonder concreet regressiesignaal.

## Dark mode en grotere systeemtekst
De eerder aangeleverde dark-mode Guide- en detailbeelden zijn beoordeeld; vraag ze niet opnieuw op. Dark mode is visueel bruikbaar, maar formele contrastmeting en screenreaderbewijs staan nog open.

Bij duidelijk vergrote systeemtekst vond de eerste test clipping in `Gids` en daglabels. PR #4 corrigeerde dit. De hertest om **08:59** bevestigde op dezelfde iPhone:
- `Gids`, `Nu`, daglabels en tijdas volledig zichtbaar;
- zenderrail en programmarijen uitgelijnd;
- programmatitels zonder eerdere line-height clipping;
- programmadetail plus `Sluiten` bereikbaar.

De gerichte large-text/chrome-correctie is daarmee fysiek geaccepteerd.

## Partial-left programme-readability — PR #5
PR #5 houdt programmageometrie eerlijk terwijl titel/tijd na een horizontale beweging naar het resterende zichtbare deel kan worden verankerd. Startpositie en duur-gebaseerde blokbreedte veranderen niet; een starttijd wordt verborgen wanneer hij niet volledig past.

De 09:20 iPhone-test bevestigde dat dit pas **na loslaten/settlen** gebeurt. De product owner wil uiteindelijk dat de titel al tijdens drag en momentum meebeweegt. Dat blijft een open requirement.

Dezelfde 09:20-test legde twee extra eisen vast:
- expliciete Vandaag/Morgen-selectie moet direct visueel actief worden;
- **Vandaag · Morgen · Nu** hoort altijd op één regel te staan, met `Morgen` als compact zichtbaar label en slechts lokaal begrensde font scaling voor deze controls.

## PR #6 — technisch groen, fysiek afgewezen
PR #6 probeerde alle drie de 09:20-eisen tegelijk te implementeren met per-programme Reanimated animated styles en een gedeelde viewportwaarde.

Hoewel PR-CI #92 en main-CI #93 groen waren, gaf de eerste fysieke iPhone-start een **wit scherm gevolgd door een Expo Go-crash**. Daarmee is PR #6 fysiek afgewezen. De exacte native oorzaak is niet bewezen; de zware per-programme animation/worklet-opzet over de 48-zenderfixture is een belangrijke verdachte.

## Rollback — fysiek hersteld
Main is met rollbackcommit **`f7c9f73568341d29e518be21e0de071e4ef7877d`** teruggebracht naar de PR #5-runtimebaseline.

De product owner heeft daarna expliciet bevestigd: **Teevee opent weer normaal**. Dit is het fysieke bewijs dat de rollback de startup-regressie heeft verwijderd.

## PR #7 — veilige controlherimplementatie
Na het herstelde startupbewijs zijn alleen de controlwijzigingen opnieuw gebouwd, zonder nieuwe Reanimated/workletlogica:
- Vandaag, Morgen en Nu staan op één horizontale regel;
- alleen deze compacte labels hebben `maxFontSizeMultiplier=1.2`;
- Morgen is zichtbaar compact; de werkelijke datum zit in het accessibility-label;
- Vandaag/Morgen worden direct geselecteerd na tap en blijven tijdens hun eigen animated jump beschermd tegen tijdelijke tussenliggende scroll-state;
- Nu keert terug naar vandaag/current time;
- PR #5 programme-readability blijft verder ongewijzigd en beweegt dus nog niet live tijdens de swipe.

Technische verificatie:
- PR #7 head **`67925d17913f5eac1aa00417f17bbf880e3724a9`**: CI #104 / run `34746652205` volledig geslaagd.
- PR #7 merge **`c697c4e7b9bb026409962f319d26cebad75a3a56`**.
- Main-CI #105 attempt 1 faalde vóór projectchecks door npm `ETARGET` op `@csstools/css-calc@^3.4.0`.
- De rerun van exact dezelfde main SHA, attempt 2, slaagde volledig: installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

### Fysieke hertest om 10:14 CEST
De product owner bevestigde op dezelfde iPhone en dezelfde vergrote systeemtekst:
1. Teevee opent normaal;
2. `Vandaag`, `Morgen` en `Nu` staan op één regel;
3. de geselecteerde dag reageert direct correct en `Nu` keert terug naar de actuele tijd.

De gevraagde vierde observatie — of horizontale scroll nog hetzelfde aanvoelt als de eerder geaccepteerde baseline — is nog niet beantwoord en wordt daarom niet als akkoord geregistreerd.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Bevestigd na rollback én PR #7** |
| Horizontale scroll/inertie/bounce | Eerdere baseline kwalitatief akkoord; **PR #7-retstgevoel nog niet bevestigd** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| Partial-left geometry-safe readability | Technisch geïntegreerd; na settle fysiek waargenomen |
| Continue titelbeweging tijdens swipe | **Open; PR #6-opzet teruggedraaid** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| Actieve dag direct na tap | **Fysiek bevestigd in PR #7** |
| VoiceOver/screenreader | Open |
| Live theme switching | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende gerichte iPhone-validatie
Er resteert voor PR #7 nog maar één vraag: **voelt horizontaal scrollen nog hetzelfde/natuurlijk als de eerder geaccepteerde baseline?**

Bij `ja` is de PR #7 fysieke validatie afgerond. Bij `nee` is een concrete beschrijving van de regressie nodig voordat er weer code wordt aangepast.

**Niet opnieuw beoordelen:** live meebewegen van partial-left programmatitels. Dat is bewust nog niet herbouwd.

## Samenvatting
**De PR #6 startcrash is fysiek hersteld en de veilige PR #7-controlherimplementatie is op de iPhone bevestigd voor startup, éénregelige Vandaag/Morgen/Nu-controls en directe selected-state. Alleen het scrollgevoel van deze exacte build staat nog open; continue titelbeweging blijft een aparte volgende technische increment.**
