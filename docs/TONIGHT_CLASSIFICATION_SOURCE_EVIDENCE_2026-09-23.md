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
1. preserve full structured evidence in server-only `ExternalProgramme`;
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

This document records empirical implementation evidence. The product/classification authority remains `docs/TONIGHT_CLASSIFICATION_RESEARCH_2026-09-23.md`; architecture authority is ADR 0010.
