# Teevee Phase 1 — Device Test Report

Bijgewerkt op **13 september 2026, 10:35 CEST — Europe/Amsterdam**. Exacte committijd staat in GitHub. Een groene CI of bundle-export is geen geslaagde toesteltest.

## Toestel en versies
- Eigen iPhone van de product owner; wifi; testperiode 11–13 september 2026.
- Model, iOS-versie, Expo Go-versie en exacte lokale SHA zijn nog niet genoteerd.
- Scrollbaseline, detailrespons en swipe-down dismissal zijn eerder kwalitatief geaccepteerd op dit toestel.

## Reeds geaccepteerde interactiebaseline
De product owner heeft eerder met **"perfect"** gereageerd op gerichte hertests van standaard platforminertie, doorlopende tijdlijn/dagovergang/`Nu`, detailrespons en swipe-down dismissal. Heropen deze instellingen niet zonder concreet regressiesignaal.

PR #7 is eveneens fysiek geaccepteerd: normale startup, `Vandaag · Morgen · Nu` op één regel, directe juiste selected-state plus `Nu`-terugkeer en ongewijzigd/natuurlijk horizontaal scrollgevoel.

## Dark mode en grotere systeemtekst
De eerder aangeleverde dark-mode Guide- en detailbeelden zijn beoordeeld; vraag ze niet opnieuw op. Dark mode is visueel bruikbaar, maar formele contrastmeting en screenreaderbewijs staan nog open.

Bij duidelijk vergrote systeemtekst vond de eerste test clipping in `Gids` en daglabels. PR #4 corrigeerde dit. De hertest om **08:59** bevestigde `Gids`, `Nu`, daglabels en tijdas volledig zichtbaar, zenderrail/programmarijen uitgelijnd en programmadetail plus `Sluiten` bereikbaar. Deze gerichte large-text/chrome-correctie is fysiek geaccepteerd.

## Partial-left programme-readability
PR #5 maakte settled readability geometry-safe: de echte programmastart en duur-gebaseerde blokbreedte veranderen niet; na settle kan titel/tijd naar het zichtbare restant worden verankerd. De 09:20 iPhone-test bevestigde dat dit inhoudelijk werkte maar te laat kwam: de product owner wil dat de titel al tijdens drag en momentum leesbaar blijft.

PR #6 probeerde dit met per-programme Reanimated animated styles. PR/main CI waren groen, maar de eerste fysieke iPhone-start gaf een wit scherm gevolgd door een Expo Go-crash. De rollback naar **`f7c9f73568341d29e518be21e0de071e4ef7877d`** werd fysiek bevestigd als weer normaal startend. Daarmee is de PR #6-architectuur afgewezen voor deze fixture.

## PR #8 — nieuwe low-overhead live edge-oplossing
PR #8 implementeert de open titelbeweging opnieuw, maar zonder een animated/worklet-instance per programma:
- één geïsoleerde overlay boven de programmaweergave;
- scroll-events worden maximaal één keer per animation frame tot overlay-state samengevoegd;
- alleen zichtbare zenders plus kleine overscan leveren een edge-mask;
- het echte programmablok blijft op zijn oorspronkelijke startpositie en duur-gebaseerde breedte;
- PR #5-settled readability blijft als fallback actief;
- de overlay ontvangt geen touches en is verborgen voor accessibility; de echte programmebutton blijft de toegankelijke bron;
- de current-time line blijft boven de overlay zichtbaar.

### Technische verificatie
De eerste PR #8-run **CI #119 / `34747757890`** faalde bij strict TypeScript doordat `StyleSheet.absoluteFillObject` niet beschikbaar was in de gebruikte React Native-typing. De implementatie is gecorrigeerd naar expliciete absolute bounds; geen check is uitgezet.

Final PR-head **`35282fffc558115f60eded7534c4eb03266cf4f7`** passeerde **PR CI #120 / `34747825150`** volledig: installatie, strict TypeScript, lint, tests en iOS/Android/web Expo exports.

PR #8 is gesquasht naar main als **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`**. De exacte merge passeerde **main CI #121 / `34747935259`** eveneens volledig.

Deze groene CI is uitdrukkelijk nog **geen fysieke acceptatie**; PR #6 heeft aangetoond waarom de volgende toesteltest noodzakelijk is.

## Kernstatus Phase 1
| Onderdeel | Status |
|---|---|
| App opent/rendert via Expo Go | **Bevestigd t/m PR #7; PR #8 hertest nodig** |
| Horizontale scroll/inertie/bounce | **Kwalitatief bevestigd t/m PR #7; PR #8 regressiecheck nodig** |
| Verticale scroll/inertie/bounce | Kwalitatief akkoord |
| Detail openen/sluiten/swipe-down | Kwalitatief akkoord |
| Grote systeemtekst chrome/alignment | **Fysiek bevestigd** |
| Detailinhoud + Sluiten bij grote tekst | **Fysiek bevestigd voor geteste inhoud** |
| Partial-left geometry | **Waarheidsgetrouw in PR #5/PR #8 code** |
| Continue titelbeweging tijdens swipe | **PR #8 technisch groen; fysieke validatie nodig** |
| Vandaag/Morgen/Nu op één regel | **Fysiek bevestigd in PR #7** |
| Actieve dag direct na tap | **Fysiek bevestigd in PR #7** |
| VoiceOver/screenreader | Open |
| Live theme switching | Open |
| Progress/current-time nauwkeurigheid | Open |
| Android/release-achtige performance | Open |

## Volgende gerichte iPhone-validatie
Gebruik main **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`** of nieuwer. De vergrote tekststand mag blijven staan.

Controleer alleen:
1. Teevee opent normaal, zonder wit scherm/crash.
2. Scroll horizontaal zodat de start van een langer programmablok achter de vaste zenderrail verdwijnt. **Tijdens de vingerbeweging zelf** blijft de titel aan de zichtbare linker rand leesbaar/meebewegen.
3. Laat los terwijl er momentum is. Ook **tijdens het uitrollen** blijft de titel meebewegen; hij wacht niet meer tot de scroll stopt.
4. Het programmablok zelf springt niet en verandert niet zichtbaar van breedte; horizontale scroll voelt nog natuurlijk zoals vóór PR #8.

Already accepted `Vandaag/Morgen/Nu` en detailgedrag hoeven niet opnieuw getest te worden, tenzij spontaan een regressie opvalt.

Een korte terugkoppeling `1 ja/nee, 2 ja/nee, 3 ja/nee, 4 ja/nee` is voldoende; een screenshot helpt alleen bij een visueel defect, maar kan beweging tijdens drag/momentum niet bewijzen.

## Samenvatting
**PR #7 is volledig fysiek geaccepteerd. PR #8 herbouwt alleen de resterende continue partial-left titelbeweging met één lichte viewport-overlay in plaats van duizenden per-programme animations/worklets. PR- en main-CI zijn groen; één gerichte iPhone-test is nu de enige acceptatiegate.**
