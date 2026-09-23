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

### Exact-classifier live validation and precision correction

A disposable workflow ran the **actual PR #144 classifier implementation** over the current mapped 12-channel source. The first run exposed a real precision defect in the generic Series rule: alongside the researched misses, it also admitted clearly non-scripted/factual/panel formats such as `The Yorkshire Vet`, `Sluipschutters`, `LUBACH`, `Beste Kijkers`, `Het Interventie Team` and `Top Gear`.

Raw-source inspection showed why episode numbers and actor credits were insufficient:
- factual programmes also carry `Sx Ey` episode numbers;
- presenters/hosts are frequently encoded as `<actor>`;
- some factual programmes even have director credits.

The final rule therefore uses **category-format precedence first**, then minimal director-credit presence only for otherwise non-conflicting generic single-scripted-category recovery. It does not retain director names or actor/cast data.

Final exact-implementation live evidence:
- workflow: `Tonight classification runtime probe`;
- run: **#4 / 35857949057**;
- job: **107170868358 — SUCCESS**;
- evening rows inspected: **965**;
- Film eligible: **36**;
- general/mainstream Series eligible: **99**;
- Sport eligible: **3**;
- all semantic Series including primarily-children: **182**;
- unknown after fail-closed classification: **5**.

After the fix, the complete unique set of **generic** general/mainstream Series recoveries in that live evening population was:
- `The Spencer Sisters`;
- `Best Medicine`;
- `Missie Aarde`;
- `Agatha Christie's Poirot`;
- `Aspe`.

That set exactly matches the research-derived generic adult-scripted boundary examples. The prior factual/panel false positives disappeared without any production title rule.

The same live run classified the reviewed Sport boundary as:
- `NOS Studio Sport` → highlights → Vanavond eligible;
- `UEFA Nations League Soccer` → event → eligible;
- `UCI Road World Championships` → event → eligible;
- `NOS Voetbal` → talk → excluded;
- `Andere Tijden Sport` → magazine/documentary → excluded.

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
