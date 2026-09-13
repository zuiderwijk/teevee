# Teevee Development Logboek

Doel: een begrijpelijk chronologisch overzicht van substantiële wijzigingen, toestelbewijs en verificatie. `docs/PROJECT_STATE.md` is altijd de canonieke actuele toestand.

## Logboekregels
- Noteer datum en tijd in Europe/Amsterdam.
- Schrijf eerst product-/gebruikerseffect, daarna techniek en verificatie.
- Claim alleen geslaagde checks wanneer die aantoonbaar geslaagd zijn.
- Benoem blokkades en regressies expliciet.
- Sluit substantiële entries af met de volgende stap.

---

## 13 september 2026, 10:35 CEST — PR #8: live partial-left titelbeweging herbouwd zonder per-programme worklets

### Wat verandert voor de gebruiker
De nog openstaande 09:20-eis — een programmanaam moet al **tijdens horizontaal draggen en momentum** leesbaar blijven wanneer de echte programmastart achter de vaste zenderrail verdwijnt — is opnieuw geïmplementeerd.

De programmablokken zelf blijven volledig tijdgetrouw: hun echte startpositie en duur-gebaseerde breedte veranderen niet. Alleen een kleine visuele laag aan de linker rand toont de titel opnieuw in het zichtbare restant.

### Architectuur
De crashgevoelige PR #6-aanpak is niet hergebruikt. PR #8 gebruikt één geïsoleerde `EdgeReadabilityOverlay` boven de programmeviewport:
- scrollposities worden via een kleine imperative ref aan de overlay doorgegeven;
- meerdere scroll-events worden maximaal één keer per animation frame tot overlay-state verwerkt;
- alleen zichtbare zenders plus één overscanrij worden voor edge-content bekeken;
- de zware 48-zender Guide-tree blijft buiten deze frame-update;
- geen nieuwe Reanimated/workletstyles per programma;
- PR #5-settled readability blijft als onderliggende fallback;
- de overlay is pointer-transparent en uit de accessibility-traversal gehaald; echte programmebuttons behouden hun volledige labels;
- de current-time line wordt boven de overlay herhaald zodat een edge-mask hem niet kan afdekken.

### Tests en CI
Nieuwe pure tests dekken het programma dat de linker viewportgrens kruist, de werkelijk resterende zichtbare breedte en de visible-row windowing/clamping. De bestaande Guide-integratietests mounten daarnaast de volledige 48-zender Guide inclusief de overlay.

De eerste PR-run **CI #119 / `34747757890`** stopte bij strict TypeScript omdat de huidige React Native-typing `StyleSheet.absoluteFillObject` niet exposeert. Dit is opgelost met expliciete absolute bounds; er is geen quality gate uitgezet.

Final PR-head **`35282fffc558115f60eded7534c4eb03266cf4f7`** passeerde **CI #120 / `34747825150`** volledig: installatie, typecheck, lint, tests en iOS/Android/web Expo exports.

PR #8 is gesquasht naar main als **`1fbc4095ea50959f80a87db5db1f91905f46c2e2`**. De exacte merge passeerde ook **main-CI #121 / `34747935259`** volledig met dezelfde gates.

### Fysieke gate
PR #6 heeft bewezen dat groene CI geen bewijs van native startupstabiliteit is. PR #8 is daarom nog niet fysiek geaccepteerd.

### Volgende stap
Op dezelfde iPhone alleen controleren: normale startup; titel beweegt/blijft leesbaar tijdens drag én momentum aan de linker rand; het echte programmablok springt niet/verandert niet van breedte; horizontale scroll voelt nog als de geaccepteerde baseline.

---

## 13 september 2026, 10:20 CEST — PR #7 volledig fysiek geaccepteerd

### Toestelbewijs
Op dezelfde iPhone en dezelfde vergrote systeemtekst bevestigde de product owner alle vier de gerichte PR #7-punten:
1. Teevee opent normaal;
2. `Vandaag`, `Morgen` en `Nu` blijven op één horizontale regel;
3. Morgen/Vandaag reageren direct met de juiste zwarte selected-state en `Nu` keert terug naar de actuele tijd;
4. horizontaal scrollen voelt nog hetzelfde/natuurlijk als de eerder geaccepteerde baseline.

Daarmee is de veilige non-Reanimated controlherimplementatie volledig fysiek geaccepteerd. De PR #6-startcrash is niet teruggekeerd en de scrollbaseline is niet verslechterd.

---

## 13 september 2026, 09:56 CEST — PR #6 veroorzaakt iPhone-startcrash; main teruggezet naar runnable Guide

Na de PR #6-versie meldde de product owner een wit scherm gevolgd door een Expo Go-crash. PR #6 had per-programme Reanimated animated styles over de realistische 48-zenderfixture geïntroduceerd. Dat is een sterke kandidaat voor de regressie, maar zonder native foutlog niet bewezen.

Main is teruggezet naar PR #5 met **`f7c9f73568341d29e518be21e0de071e4ef7877d`**. De product owner bevestigde daarna normale startup. De drie 09:20-producteisen bleven geldig; twee zijn later veilig opgelost in PR #7, de derde wordt nu via PR #8 aangepakt.

---

## 13 september 2026, 09:12 CEST — PR #5: geometry-safe partial-left readability

Voor programmablokken waarvan de echte start links achter de vaste zenderrail ligt, kan de innerlijke titel/tijd na drag/momentum naar het zichtbare restant verschuiven zonder startpositie, duur of blokbreedte te vervalsen. Te krappe starttijdlabels worden verborgen in plaats van fragmentarisch getoond. De iPhone-test bevestigde dat dit pas na settle gebeurde; continue beweging bleef open.

---

## 13 september 2026, 09:01 CEST — Grote-tekstcorrectie fysiek geaccepteerd

Op dezelfde iPhone en duidelijk vergrote systeemtekst bleven `Gids`, `Nu`, daglabels en tijdas volledig leesbaar na PR #4. Zenderrail/programmarijen bleven uitgelijnd en programmadetail plus `Sluiten` bleven bereikbaar.

---

## 13 september 2026, 08:40 CEST — Dynamic Type en logo-ready kanaalidentiteit

Totaal kreeg schaalbare rij-, zender- en tijdasgeometrie. Bij grotere tekst krijgt programmatitel voorrang boven secundaire metadata. Kanaalidentiteit is technisch voorbereid op **logo primair, naam secundair**, met volledige accessibility-naam en tekstfallback.

---

## 13 september 2026, 08:05 CEST — Drie Guide-presentaties vastgelegd

PRODUCT/UX leggen vast:
- **Totaal** = 2D-grid;
- **Per zender** = verticale dagplanning van één zender;
- **Nu & Straks** = compacte all-channel lijst op één gedeeld referentietijdstip vandaag, zonder datumselector, met tijdselector en `Nu` voor live/current mode.

---

## 13 september 2026, 07:46 CEST — Swipe-down detail fysiek geaccepteerd

De product owner beoordeelde detailrespons en swipe-down dismissal als **"perfect"**. Button-close en outside-tap close blijven eveneens geaccepteerde routes.

---

## 13 september 2026, 07:04 CEST — Scrollbaseline fysiek geaccepteerd

Standaard platforminertie, native bounce/directional lock, doorlopende tijdlijn, dagovergang en geanimeerde `Nu` zijn op iPhone kwalitatief als **"perfect"** beoordeeld. Niet retunen zonder concreet regressiesignaal.

---

## 11 september 2026 — Phase 1 bootstrap

Projectfoundation, deterministische EPG-fixture, Expo/React Native strict TypeScript, eerste 2D Guide, detailmodal, current-time/progress, runtime-aligned Amsterdamse fixture, CI en device-workflow zijn opgebouwd. De fixture is later uitgebreid naar 48 synthetische zenders.

---

## Doorlopende open technische punten
- PR #8 live edge readability is technisch groen maar wacht op gerichte iPhone-acceptatie.
- Android gesture/back en release-achtige performance zijn nog niet fysiek gevalideerd.
- VoiceOver/screenreader, live theme switching en expliciete current-time/progress-validatie staan open.
- Finite fixture lifecycle rond resume na middernacht/expiry staat open.
- CI genereert nog een lockfile vóór `npm ci`; 15 moderate advisories vereisen gerichte analyse. Nooit `npm audit fix --force`.
- Productie-EPG/logo/artworkrechten, abonnement/paywall en final visual design liggen buiten deze directe Phase 1-stabiliteitsstap.
