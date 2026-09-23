# Vanavond classification source evidence — 2026-09-23

Status: implementation evidence for issue #142 / PR #144. Normal CI remains fixture-only.

## Purpose

PR #137 proved that first-category canonical `Programme.genre` cannot safely populate Film, Series and Sport. Issue #142 needed to establish whether the current provider has stronger structured evidence available **before canonicalization**.

A temporary GitHub Actions probe read the current development XMLTV feed directly and inspected all `<category>`, `<episode-num>`, `<live/>` and `<previously-shown>` evidence.

Latest successful probe:
- workflow: `Tonight classification source probe`;
- run: **#9 / 35855124285**;
- job: **107161659875 — SUCCESS**;
- source bytes: **36,654,822**;
- probe target rows: **417** (repeated broadcasts of selected research examples, not total feed size).

The temporary workflow is evidence instrumentation only and must not remain a production/normal-CI dependency.

### Independent raw-source richness capture

Issue #142 also received an independent raw XMLTV capture from closed, intentionally unmerged research PR #145. CI #1055 / run `35856096847` inspected the same 12 mapped Teevee provider channels **before** `XmltvEpgProvider` parsing:

- raw XML: **36,654,822 bytes**;
- mapped programme rows: **3,372**;
- categories present: **3,372 / 3,372 (100%)**;
- multiple categories: **2,039 / 3,372 (60.47%)**;
- distinct secondary/tertiary category values: **61**;
- episode number: **2,335 / 3,372 (69.25%)**;
- credits block: **2,803 / 3,372 (83.13%)**;
- actor element: **2,702 / 3,372 (80.13%)**;
- production date/year: **2,417 / 3,372 (71.68%)**;
- director element: **779 / 3,372 (23.10%)**;
- producer element: **902 / 3,372 (26.75%)**.

The same capture found zero `<live/>`, `<previously-shown>`, `<new>`, `<premiere>`, rating, language or country metadata in those 3,372 rows. The programme-level `<icon>` tag was present but had no usable standard XMLTV URL, so it is not treated as artwork evidence.

This confirms that source richness is specifically useful for taxonomy/episodic classification, not for inventing live/repeat/first-run or artwork semantics.

## Film

The full category set directly explains the researched first-category false negatives.

Observed examples:
- `The Martian`: `['Drama', 'Film']`;
- `Kursk`: `['Drama', 'Film']`;
- `I, Robot`: `['Drama', 'Film']`;
- `De pupil`: `['Drama', 'Film']`;
- `Billy Elliot`: `['Drama', 'Film']`;
- `Almost Famous`: `['Drama', 'Film']`.

The old route kept only `Drama`. Preserving all provider categories at the server boundary allows exact structured `Film` evidence without title exceptions.

## Series

Generic scripted series often do not carry an explicit first-category series label, but the source provides structured season/episode evidence.

Observed:
- `Best Medicine`: categories `Komedie / Medisch`, episode `S1 E3`;
- `The Spencer Sisters`: `Mysterie / Komedie`, `S1 E4`;
- `Aspe`: `Misdaad`, `S2 E9/E10`;
- `Agatha Christie's Poirot`: `Mysterie / Misdaaddrama`, `S2 E4/E5`;
- `Missie Aarde`: `Komedie / Sciencefiction`, `S1 E5`.

Episode notation is not sufficient by itself: factual/reality/sport programmes can also carry series/episode-like numbering. The classifier therefore combines strong episode evidence with provider-specific scripted-category support and explicit non-scripted blockers.

### Audience intent

Observed children's scripted examples:
- `Bluey`: `Kinderen / Animatie`, `S3 E16`;
- `Marvel's Spidey and His Amazing Friends`: `Kinderen / Animatie`, explicit season/episode values.

Observed non-scripted children's counterexample:
- `NOS Jeugdjournaal`: `Kinderen / Nieuws`, `E266` (no season+episode signal).

This supports a provider mapping to Teevee's public `primarily-children` audience semantic without exposing raw `Kinderen` to mobile or implementing `genre !== 'Kinderen'`.

Audience evidence is deliberately **orthogonal to content-type evidence**. `Kinderen` / `Kids En Familie` can establish `audience: primarily-children` without proving whether the programme is Film, Series, Sport or `other`. The semantic contract therefore intentionally permits `contentType: unknown` + `audience: primarily-children` when the audience is known but the programme family is not. Children-audience evidence alone never proves `other/high`; a strong non-scripted format such as `Nieuws` must independently prove that content type.

### Exact-classifier live validation and certainty corrections

A disposable workflow runs the **actual PR #144 classifier implementation** over the current mapped 12-channel source.

The first implementation probe correctly identified several rows that must not be promoted into `Series vanavond`, but the subsequent classifier version still overstated certainty: every broad `GENERIC_SERIES_BLOCKER_CATEGORIES` value was also reused as positive `other/high` evidence. Technical Lead review #5794926935 identified the semantic error: **blocking generic Series inference is not positive proof of another content type**.

The concrete boundary is `Sluipschutters`:
- categories `Komedie / Entertainment`;
- episode `S5 E3`;
- description includes `humoristisch sketchprogramma`.

That evidence is insufficient to prove high-confidence scripted episodic Series for the frozen Vanavond scope, so the row is not Series-eligible. But `Entertainment` is only broad context at this provider boundary and does not itself prove `other/high`. The corrected result is therefore `contentType: unknown`, `confidence: unknown`.

The same distinction applies to other broad context/subject categories. Strong structured non-scripted format evidence such as `Reality`, `Documentaire`, `Nieuws` and `Talkshow` can still produce high-confidence `other`. Broad context such as `Entertainment`, `Auto's`, `Dieren`, `Politiek`, `Muziek`, `Reizen` and similar categories only blocks generic scripted inference; without stronger positive evidence, ambiguity stays `unknown`.

Raw-source inspection remains important because episode numbers, actor credits and even director credits are not sufficient by themselves:
- factual programmes also carry `Sx Ey` episode numbers;
- presenters/hosts are frequently encoded as `<actor>`;
- some factual programmes have director credits.

The rule therefore keeps:
1. strong explicit scripted-form precedence, except for strong non-scripted format conflicts;
2. conservative generic scripted recovery from S/E plus compatible structured evidence;
3. broad context blockers only as **negative inference gates**, never as automatic positive `other` evidence;
4. high-confidence `other` only from strong positive non-scripted/other evidence;
5. children-audience evidence as an independent audience dimension that may remain known while content type/confidence fail closed.

Post-#5794926935 exact-implementation live evidence:
- workflow: `Tonight classification semantic revalidation`;
- run: **#1 / 35862210491**;
- job: **107184911263 — SUCCESS**;
- source bytes: **36,597,644**;
- evening rows inspected: **965**;
- Film eligible: **36**;
- general/mainstream Series eligible: **99**;
- all semantic Series including primarily-children: **182**;
- Sport eligible: **3**;
- content types: **621 other / 182 series / 36 film / 117 unknown / 9 sport**;
- high-confidence `other` row instances: **621**.

Compared with the preceding live classifier probe on the same current source population, Film/Series/Sport eligibility and semantic Series counts are unchanged. The confidence-only correction moves **112 broadcast row instances** from `other/high` to fail-closed `unknown/unknown`: `other` **733 → 621**, `unknown` **5 → 117**.

### Audience/content-type certainty correction

Technical Lead exact-head review **#5795818040** found one remaining certainty conflation after the previous blocker was closed: the classifier treated children-audience evidence itself as sufficient to emit `contentType: other / confidence: high` whenever Series had not been proven.

The correction is deliberately narrower:
- `Kinderen` / `Kids En Familie` establish `audience: primarily-children` only;
- without a proven target family or positive strong non-scripted format, content type remains `unknown` and confidence remains `unknown`;
- `Kinderen + Nieuws` remains `other/high` because `Nieuws`, not `Kinderen`, proves the non-scripted content type;
- `Kinderen + Animatie + Sx Ey` and explicit scripted-form + children evidence can still become semantic scripted Series, while the audience keeps them excluded from `Series vanavond`;
- strong non-scripted conflict precedence remains unchanged.

Disposable exact-classifier revalidation of this second correction:
- workflow: `Tonight classification audience revalidation`;
- run: **#1 / 35868756695**;
- job: **107206994998 — SUCCESS**;
- source bytes: **36,597,644**;
- evening rows inspected: **965**;
- Film eligible: **36**;
- general/mainstream Series eligible: **99**;
- all semantic Series including primarily-children: **182**;
- Sport eligible: **3**;
- content types: **620 other / 182 series / 36 film / 118 unknown / 9 sport**.

Relative to the immediately preceding exact-classifier run `35862210491`, exactly **one** current evening row moves from `other/high` to `unknown/unknown`; Film, Series and Sport eligibility and semantic-Series counts are unchanged. Among **91** rows with `audience: primarily-children`, the corrected distribution is:
- **83** `series/high`;
- **7** `other/high`, each requiring independent positive non-scripted evidence;
- **1** `unknown/unknown`.

The single current children-audience ambiguity is a `Marvel's Spidey and His Amazing Friends` broadcast carrying `Kinderen / Animatie` but only `S3` rather than explicit season+episode evidence. It now correctly preserves `audience: primarily-children` while leaving content type unknown. Another Spidey broadcast with `S3 E12` remains semantic children Series, as does `Bluey`; `NOS Jeugdjournaal` remains `other/high + primarily-children` because `Nieuws` is strong positive non-scripted evidence.

The probe found **27 unique title/category combinations** with broad context blockers that now remain ambiguous rather than being promoted to `other/high`:
- `Nederland in Beweging` — `Exercise`;
- `Beste Zangers` — `Muziek`;
- `Tussen Kunst en Kitsch` — `Entertainment / Consumentenprogramma's`;
- `BinnensteBuiten` — `Bouwen En Verbouwen / Culinair`;
- `In de Buurt` — `Samenleving`;
- `Maarten & Philip op het spoor` — `Entertainment`;
- `The Yorkshire Vet` — `Dieren / Medisch`;
- `Sluipschutters` — `Komedie / Entertainment`;
- `Vlogmania kort` — `Entertainment`;
- `De mosterd van Meus` — `Culinair / Reizen`;
- `Too Good To Be True` — `Entertainment`;
- `Tommy Teleshopping` — `Shoppen`;
- `LUBACH` — `Entertainment / Komedie`;
- `Casa Di Beau` — `Entertainment`;
- `Make Up Your Mind` — `Entertainment`;
- `VriendenLoterij De Winnaars` — `Entertainment / Samenleving`;
- `Beste Kijkers` — `Entertainment / Komedie`;
- `Telvero` — `Consumentenprogramma's / Shoppen`;
- `Adam's Family: 25 Jaar Later` — `Entertainment`;
- `Politie In Actie UK` — `Entertainment`;
- `RTL Autowereld` — `Auto's`;
- `America's Got Talent` — `Variété / Muziek`;
- `Business Class` — `Business & Financial`;
- `Mr. Frank Visser rijdt visite` — `Debat / Recht`;
- `Lachen om Home Video's` — `Komedie / Entertainment`;
- `Veronica Film` — `Entertainment`;
- `Top Gear` — `Auto's / Komedie`.

These rows are not asserted to be one ground-truth content family by Teevee. The only production claim is that the available structured evidence does not justify high-confidence Series or high-confidence `other` under the current provider mapping.

The requested researched Series boundaries remain stable and Series-eligible:
- `The Spencer Sisters`;
- `Best Medicine`;
- `Missie Aarde`;
- `Agatha Christie's Poirot`;
- `Aspe`.

`Het Interventie Team` also remains `unknown/unknown`; it was already ambiguous because `Misdaad + S/E` without the required positive scripted evidence is insufficient. It is not part of the 112-row confidence correction.

The same live run keeps the reviewed Sport boundary unchanged:
- `NOS Studio Sport` → highlights → Vanavond eligible;
- `UEFA Nations League Soccer` → event → eligible;
- `UCI Road World Championships` → event → eligible;
- `NOS Voetbal` → talk → excluded;
- `Andere Tijden Sport` → magazine/documentary → excluded.

Production classifier source still contains no title-specific whitelist/blacklist logic. Research titles above are evidence labels only.

## Sport

The full category set resolves several false positives structurally:
- `Andere Tijden Sport`: `Sport / Documentaire / Sports` => magazine/documentary;
- `NOS Voetbal` pre/post-match: `Sporttalkshow / Voetbal` => talk;
- `UEFA Nations League Soccer` full match: `Sport / Voetbal / Sports`, explicit description `Verslag van de wedstrijd …` => event;
- `NOS Studio Sport`: `Sport / Interview / Sports`, explicit `samenvattingen … van de dag` => highlights;
- UEFA summary broadcasts use the same Sport/Voetbal categories but explicitly say `Samenvatting` or `Hoogtepunten`.

Therefore category `Sport` alone cannot mean event. The current provider interpreter applies subtype precedence and only consults narrow explicit description terms **after** structured Sport evidence exists.

## Category population

Selected feed-wide category counts from the probe:
- `Kinderen` 8,773;
- `Nieuws` 7,053;
- `Animatie` 6,555;
- `Documentaire` 2,917;
- `Sports` 2,911;
- `Sport` 2,818;
- `Dramaseries` 1,705;
- `Film` 1,355;
- `Voetbal` 1,040;
- `Komedie` 859;
- `Misdaad` 718;
- `Misdaaddrama` 614;
- `Sporttalkshow` 597;
- `Sitcoms` 392;
- `Drama` 339;
- `Medisch` 231;
- `Mysterie` 177;
- `Multisportevenement` 170;
- `Reality Competitie` 147;
- `Wielrennen` 97;
- `Miniseries` 79;
- `Kids En Familie` 69;
- `Event` 64.

These labels remain provider vocabulary. They justify the current provider mapping but are not public Teevee domain values.

## Live / repeat

The probe preserved structured tags rather than manufacturing booleans:
- `<live/>` present => `true`;
- absent => `undefined`;
- `<previously-shown>` present => `true`;
- absent => `undefined`.

The central Teevee classification contract converts explicit boolean `true` / `false` / absence to tri-state `true` / `false` / `unknown`. Absence never means false.

## Implementation consequence

The correct boundary is:
1. preserve only classification-relevant structured evidence in server-only `ExternalProgramme`: full categories, episode numbers and minimal director-credit presence (not names/cast);
2. classify once during normalization/ingest;
3. persist only provider-independent Teevee semantics beside the concrete canonical broadcast;
4. never add raw category arrays to canonical/mobile `Programme`;
5. keep normal CI deterministic and network-free.

## Disposable persistence execution evidence

The new classification persistence was executed against an isolated PostgreSQL 17 service rather than the hosted Teevee project.

Evidence:
- workflow: `Tonight classification migration smoke`;
- run: **#1 / 35855629562**;
- job: **107163296515 — SUCCESS**;
- migration under test: `20260923111500_create_programme_classification_foundation.sql`;
- the smoke loaded the canonical schedule-store migration and public RPC bridge first;
- the lifecycle assertion block completed with PostgreSQL `DO`;
- the transaction ended with `ROLLBACK`.

The executable smoke covers:
- initial classified ingest/read;
- same-broadcast idempotent upsert;
- canonical start-time correction / Programme.id rekey;
- old classification cascade cleanup;
- corrected classification insert;
- stale classified write ignored without semantic rollback;
- bounded provider-independent getter;
- authoritative programme deletion/empty replacement cascading classification cleanup.

No migration, function or classification row was deployed to the hosted Teevee project by this test.

All temporary network/migration workflows are disposable evidence tooling and are removed before final review handoff; normal repository CI remains deterministic and network-free.

This document records empirical implementation evidence. The product/classification authority remains `docs/TONIGHT_CLASSIFICATION_RESEARCH_2026-09-23.md`; architecture authority is ADR 0010.
