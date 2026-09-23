# TMDB matching research — Film & Series external identity — 2026-09-23

Status: **EMPIRICAL MATCHING RESEARCH COMPLETE — PASS TO NARROW PRODUCTION DESIGN**  
Issue: #155  
Research PR: #156  
Stacked base: PR #154 head `c7436a511bf824e36edd2c22574f594a84f5a7a5`  
Final reviewed research head: `86c406794e61087c0c6714fdd9044373ff8abaf7`

## 1. Executive conclusion

Concrete Teevee Film and scripted-Series broadcasts can be matched to TMDB with a deliberately conservative, fail-closed matcher at a resolution rate that is useful for artwork enrichment.

On the final deterministic current-provider sample:

| Family | Sample | High-confidence external identity | Unresolved | Ambiguous | Resolution |
| --- | ---: | ---: | ---: | ---: | ---: |
| Film | 45 | 44 | 1 | 0 | **97.78%** |
| Series | 50 | 49 | 1 | 0 | **98.00%** |
| Combined | 95 | 93 | 2 | 0 | **97.89%** |

Manual evidence review found **zero known false-positive TMDB Film/Series IDs among the 93 accepted high-confidence broadcast decisions**.

That is an observed result for this reviewed sample, not a universal precision guarantee.

The two unresolved broadcasts are correct fail-closed outcomes:

- Film: `The Visitor - Jacob Israël de Haan` — insufficient typed identity evidence for a unique TMDB Film candidate;
- Series: `Dino Daan & Lucy` — provider supplies S1 E13 but no director/cast/producer names, so no external Series identity is accepted.

The core product principle is therefore achievable:

> **Wrong artwork is worse than missing artwork.**

Recommendation: proceed to the **smallest production matcher/reference design**, preserving an explicit `unresolved / ambiguous` outcome and keeping Guide/runtime ownership independent from external identity.

This report does **not** authorize production TMDB integration, persistence, mobile artwork transport, UI changes or deployment.

## 2. Canonical architecture constraints confirmed

The research inspected current `main`, `AGENTS.md`, `docs/PROJECT_STATE.md`, `docs/DATA.md`, ADR 0003, ADR 0010, current Vanavond product/design documents, the XMLTV provider/parser/normaliser and the central classification implementation.

The following constraints remain canonical:

- `Programme.id` is one concrete broadcast identity;
- TMDB Film/Series identity is a separate semantic enrichment layer;
- mobile never consumes TMDB or raw EPG-provider data directly;
- the core Guide cannot depend on artwork/enrichment;
- provider-specific vocabulary stays server-side;
- only provider-independent high-confidence Teevee Film/Series classification may enter this matching path;
- unknown, contradictory or under-evidenced cases fail closed;
- no title-specific production exceptions;
- no general Teevee content catalogue is justified by this increment.

PR #154 / issue #153 remains the source-evidence dependency for this research.

## 3. Research source and reproducibility

All three successful/refinement passes used the same mapped-provider snapshot:

| Property | Value |
| --- | --- |
| XMLTV bytes | 36,654,822 |
| SHA-256 | `98159dd15af2fb74f96e916d00ea64317c353cd172941eae82552f8c2002cecf` |
| Mapped channels | 12 |
| Mapped programme rows | 3,372 |
| Explicit/high-confidence Film population | 45 |
| High-confidence general/mainstream scripted-Series population | 197 |

The Film sample contains the complete current 45-row high-confidence Film population.

The Series sample is a deterministic 50-row sample from the 197 high-confidence general/mainstream scripted-Series rows, ordered by a fixed SHA-256 key over channel/start/title.

No hosted Teevee data was mutated.

### Research executions

Initial credential check:

- workflow run `35918142289`, attempt 1;
- job `107374510271`;
- correctly stopped before any TMDB request because `TMDB_API_READ_ACCESS_TOKEN` was absent.

Successful V1:

- workflow run `35918142289`, attempt 2;
- job `107375601519`;
- artifact `10776690422`;
- artifact digest `sha256:3fcbc8faa011d39eae4ec6345e6f0ff2e25b4e128fc642f1d6ace2ce51ad8b52`.

Successful V2:

- workflow run `35918880793`;
- job `107377401651`;
- artifact `10775704072`;
- artifact digest `sha256:d26ed71cd827c2bb4afee0aa722520b34a444fcefe08f559a9f8fec7c404d431`.

Final V3:

- workflow run `35919151876`;
- job `107378335517`;
- artifact `10775953802`;
- artifact digest `sha256:022827628cb73db7d518c4bc822f88c77e9b8391d1ae115c267329f3db1d7e19`.

V3 is the authoritative research result in this document.

## 4. Population gate

### Film

Only broadcasts already classified by Teevee as high-confidence Film enter Film candidate generation.

The matcher does not infer Film from TMDB search results.

### Series

Only broadcasts already classified as:

- `contentType = series`;
- `seriesType = scripted-episodic`;
- `audience = general-mainstream`;
- `confidence = high`;

enter the researched Series path.

This deliberately excludes children-first Series and non-scripted/reality/factual rows from the Vanavond production use case.

## 5. Title normalization finding

Naive punctuation stripping is unsafe.

V1 normalized:

`Mickey Mouse Clubhouse+`

as if it were:

`Mickey Mouse Clubhouse`

and therefore made the 2025 `Mickey Mouse Clubhouse+` reboot ambiguous with the older 2006 series.

V2/V3 preserve `+` semantically as `plus`.

Result:

- S1 E6 -> TMDB Series `232869`;
- S1 E10 -> TMDB Series `232869`;
- no ambiguity remains.

Production normalization must therefore remove cosmetic punctuation carefully rather than assuming every symbol is semantically empty.

## 6. Film results

### 6.1 Final resolution

- sample: 45;
- high-confidence: **44**;
- unresolved: **1**;
- ambiguous: **0**;
- resolution: **97.78%**;
- unique accepted TMDB Film IDs: **41**.

Every one of the 44 high-confidence Film decisions has director overlap.

43/44 also have cast overlap.

The one accepted Film without cast overlap still has exact title/year/director evidence.

### 6.2 Year behaviour

Among 44 accepted Film broadcasts:

- 42 have TMDB release-year delta = 0;
- 2 have delta = 1.

Both delta-1 rows are repeats of `Operation Mincemeat`.

The provider reports production year 2021 while common release metadata is 2022. This is a legitimate production/release boundary rather than evidence of a wrong candidate.

Conclusion:

- exact Film year is strong;
- an absolute equality rule would create avoidable false negatives;
- **year ±1 may be accepted only with strong people evidence**.

### 6.3 Title/year alone is not safe enough

The candidate evidence contains real collision cases where title + year would not uniquely identify the work.

Examples:

- `Non-Stop`: multiple same/near-year title candidates exist; the accepted TMDB Film `225574` is separated by director Jaume Collet-Serra and cast overlap;
- `The Marksman`: more than one plausible title/year candidate exists; director/cast evidence separates TMDB Film `634528`.

Therefore title + year alone must not be a production high-confidence rule.

### 6.4 Localized-title cases

Two accepted Film rows have a different TMDB primary title but resolve safely through TMDB alternative-title evidence plus strong credits:

| Provider title | TMDB primary title | TMDB ID | Evidence |
| --- | --- | ---: | --- |
| De pupil | The Pupil | 1514822 | alt title + exact year + Karin Junger + cast overlap |
| A Taste of Tuscany | Just Add Love | 997190 | alt title + exact year + Brian Brough + cast overlap |

V1 also missed two Film rows because title search did not expose the right candidate strongly enough:

- `Enough!` -> TMDB Film `427095`, also known as `Kappen!`, director Tessa Schram, matching year and extensive cast overlap;
- `Invasion` -> TMDB Film `991610`, original/local title `Invasie`, director Bobby Boermans, matching year and cast overlap.

A generic director-filmography fallback recovered both without title-specific rules.

### 6.5 Unresolved Film

`The Visitor - Jacob Israël de Haan`

Provider evidence:

- year 2024;
- no typed director;
- no producer;
- only Zvi Landsman as actor/person evidence.

The work itself can be found outside TMDB research evidence, but the matcher does not have enough structured evidence to accept a unique TMDB Film ID.

Correct outcome: **unresolved**.

This is preferable to guessing artwork.

## 7. Recommended Film high-confidence rule

For this provider/evidence quality, production design should begin with one deliberately narrow Film tier.

### Candidate generation

1. Gate on high-confidence Teevee Film classification.
2. Search TMDB Movie using the provider title.
3. Retrieve candidate details, alternative titles and credits.
4. If direct title search remains unresolved and a provider director exists, a bounded director-filmography fallback is allowed.

### Candidate acceptance

A direct candidate is high-confidence only when:

- provider title matches TMDB title/original/alternative title under conservative normalization;
- TMDB release year is provider production year ±1;
- **director overlap exists**;
- there is exactly one qualifying candidate.

Cast overlap is additional support and a useful ambiguity discriminator.

A localized-title fallback may qualify only with a materially stronger bundle:

- year ±1;
- same director;
- at least two provider/TMDB cast overlaps;
- unique candidate.

Any multiple qualifying candidates -> **ambiguous**.  
No qualifying candidate -> **unresolved**.

Do not lower this threshold merely to improve artwork coverage.

## 8. Series results

### 8.1 Final resolution

- sample: 50;
- high-confidence Series identity: **49**;
- unresolved: **1**;
- ambiguous: **0**;
- resolution: **98.00%**;
- unique accepted TMDB Series IDs: **28**.

Accepted rule distribution:

| Evidence path | Broadcasts |
| --- | ---: |
| strict title + cast + validated S/E | 43 |
| derived base title + >=2 cast + validated S/E | 3 |
| derived base title + >=4 cast, Series identity only because S/E numbering disagrees | 2 |
| leading-article-insensitive title + cast + validated S/E | 1 |

All accepted Series rows have cast overlap.

### 8.2 Provider year must not constrain Series first-air year

The research confirms the source-research warning.

Provider production year can represent episode-era metadata and may be far removed from a Series first-air year.

A particularly strong example is `Aspe` S2 E10:

- title/cast/S-E evidence identifies the Series/episode coherently;
- provider year is 2022;
- TMDB episode-era data points to the original older episode chronology.

Using provider year as TMDB Series first-air year would therefore manufacture false negatives.

Production rule:

> **Do not use provider production year as a required Series first-air-year constraint.**

## 9. Staged Series title fallback

V2 proved why broad title fallback must not be applied eagerly.

For:

`Law & Order: Special Victims Unit`

V2 also searched the syntactically-derived base:

`Law & Order`

Both Series can share cast and valid-looking season/episode coordinates. That created an artificial ambiguity.

V3 corrected the strategy:

1. try the full provider title first;
2. if it resolves uniquely, stop;
3. only if still unresolved, try a syntactically-derived base title such as the portion before `:`, `,` or ` - `;
4. require stronger independent evidence for this fallback.

This returns the SVU broadcast to the correct unique Series ID without considering the parent franchise unnecessarily.

## 10. Series identity is not episode identity

This is the most important Series-specific architectural finding.

Two `Neighbours: A New Chapter` broadcasts carry:

- provider S38 E190 / S38 E191;
- five cast matches against TMDB `Neighbours` Series `2674`;
- a strong branding/base-title relationship.

The TMDB candidate does **not** expose those provider S/E coordinates at the researched path.

The evidence is sufficient for high-confidence **Series identity**, but insufficient for TMDB **episode identity**.

Correct outcome:

- external Series ID: resolved;
- external episode ID: **unresolved / absent**.

Never manufacture an episode ID merely because the Series ID is known.

A future external-reference model may therefore need optional episode identity, but this research does not freeze its persistence schema.

## 11. Branded/localized Series cases

Representative non-trivial accepted cases:

| Provider title | TMDB Series | Evidence |
| --- | --- | --- |
| The Bold And The Beautiful, The Beginning | The Bold and the Beautiful / 6647 | derived base title + 10 cast overlaps + valid S4 episode |
| Neighbours: A New Chapter | Neighbours / 2674 | derived base title + 5 cast overlaps; Series-only due numbering mismatch |
| First years | The First Years / 82708 | article-insensitive title + cast + valid S15 E21 |
| Flikken Gent | Flikken | TMDB alternate/localized title evidence + cast/S-E evidence |
| Mickey Mouse Clubhouse+ | Mickey Mouse Clubhouse+ / 232869 | semantic plus preserved + cast/S-E evidence |

No title-specific matcher exception is required for these cases.

## 12. Unresolved Series

`Dino Daan & Lucy` S1 E13

Provider evidence:

- categories: Animation / Adventure;
- year 2025;
- explicit S1 E13;
- directors: none;
- actors: none;
- producers: none.

The current Teevee classifier can classify the programme as scripted Series from structured format evidence, but that does not create enough external identity evidence for TMDB matching.

Correct outcome: **unresolved**.

Classification confidence and external identity confidence are separate concepts.

## 13. Recommended Series high-confidence rules

### Primary path

1. Gate on high-confidence provider-independent scripted/general Series classification.
2. Search TMDB TV using the complete provider title.
3. Accept only a unique candidate when:
   - title/original/alternative title matches conservatively;
   - there is at least one cast overlap;
   - when explicit provider S/E exists, that episode coordinate exists in the candidate Series.

### Minor article variation

A leading-article-only variation may be ignored when:

- the rest of the title matches;
- cast overlaps;
- explicit S/E validates when available.

### Branded/base-title fallback

Only after the full-title path is unresolved:

1. derive a syntactic base title from a clear separator such as `:`, `,` or ` - `;
2. search that base title;
3. require:
   - unique candidate;
   - at least two cast overlaps;
   - provider S/E exists under the TMDB candidate.

### Series-only numbering-mismatch fallback

When the only contradiction is episode numbering:

- derived base title must match the candidate;
- require at least four cast overlaps;
- resolve **Series ID only**;
- keep episode identity unresolved.

Any weaker case remains unresolved.

## 14. Repeat stability

Repeated content in the reviewed sample resolves consistently.

### Film

- `Non-Stop` -> TMDB Film `225574` on both broadcasts;
- `I, Robot` -> TMDB Film `2048` on both broadcasts;
- `Operation Mincemeat` -> TMDB Film `661231` on both broadcasts.

### Series, same S/E

- `Zussen` S2 E3 -> TMDB Series `225307` on both broadcasts;
- `Family Law` S1 E9 -> TMDB Series `124643` on both broadcasts;
- `The Bold and the Beautiful` S39 E240 -> TMDB Series `6647` on both broadcasts.

Observed repeat conflicts: **0**.

This supports keeping broadcast ownership separate while allowing multiple broadcasts to reference one external content identity.

## 15. Ground-truth review

The final 95-row sample was reviewed at the candidate/evidence level rather than accepting the TMDB search top result.

For every proposed high-confidence decision the review checked the complete acceptance evidence bundle and candidate uniqueness.

All non-trivial cases were separately inspected, including:

- localized Film titles;
- primary-title differences;
- Film year ±1;
- same-title Film candidate collisions;
- branded Series titles;
- leading-article variation;
- semantic `+`;
- parent-franchise collision;
- provider/TMDB season-numbering disagreement;
- repeat consistency;
- both unresolved rows.

Result:

- reviewed high-confidence broadcast decisions: **93**;
- known wrong TMDB Film/Series IDs: **0**;
- observed reviewed high-tier precision: **93/93 = 100%**;
- unresolved: **2**;
- ambiguous: **0**.

The 100% figure is sample evidence only. It must not be represented as guaranteed future precision.

## 16. Which provider fields materially contributed

The research now answers the source-research persistence question more narrowly.

### Film v1 matcher evidence

Material:

- provider-independent Film classification;
- title;
- production year;
- **director names**;
- actor/cast names.

Not required to obtain the reviewed high-confidence tier:

- producer names;
- duration;
- provider icon;
- description.

Director evidence is especially valuable: all 44 accepted Film rows have director overlap.

### Series v1 matcher evidence

Material:

- provider-independent scripted/general Series classification;
- title;
- actor/cast names;
- episode notation.

Not required for Series identity in the reviewed tier:

- provider production year as a first-air constraint;
- director names;
- producer names;
- duration;
- provider icon.

Director evidence can still remain available to other server-side semantics; it is not needed by this Series identity rule.

### Consequence

Do not persist a broad raw-metadata catalogue merely because the provider supplies it.

A first production matcher needs only the smallest evidence bundle that these results prove materially useful.

## 17. Artwork availability observed, but not authorized

Every accepted V3 candidate exposed both a TMDB poster path and backdrop path:

- Film: 44/44 accepted broadcasts;
- Series: 49/49 accepted broadcasts.

This means external identity is likely sufficient to unlock the visual Vanavond direction.

It does **not** prove:

- correct poster/backdrop choice;
- no-language versus Dutch-language image preference;
- aspect policy;
- image quality ranking;
- caching policy;
- redistribution rights;
- commercial TMDB licensing;
- attribution/branding requirements.

Artwork selection remains a separate increment after external identity production design.

## 18. TMDB commercial-use gate

TMDB's public developer documentation distinguishes non-commercial developer API use from commercial use. Teevee is a paid commercial product, so the research correctly treated production API/data/image use as an independent commercial-use gate.

**Owner update — 2026-09-23:** the product owner confirms the required TMDB commercial licensing for Teevee production use is arranged. This licensing gate is therefore **CLOSED**.

The repository intentionally does not store confidential contract terms, commercial details or credentials. Production implementation must still comply with the agreed TMDB contract, including any applicable attribution/branding obligations, and must separately define credential ownership, rate-limit, retry, timeout and caching behavior.

Official public references used by the research:

- https://developer.themoviedb.org/docs/faq
- https://developer.themoviedb.org/docs/authentication-application

## 19. Production architecture recommendation

The source research architecture remains valid:

`raw provider programme -> server-only identity evidence -> provider-independent Teevee classification gate -> TMDB matcher adapter -> optional broadcast-keyed external reference -> later artwork selection -> Vanavond / Programme Detail enrichment`

Hard boundaries:

- `Programme.id` stays broadcast identity;
- external identity matching runs server-side;
- raw provider vocabulary stays server-side;
- TMDB vocabulary stays behind the external matcher/artwork boundary;
- absence of a match never removes a programme from Guide or Vanavond eligibility;
- no match means no external reference/artwork;
- multiple broadcasts may resolve to the same external content ID;
- Series ID and episode ID remain independently resolvable;
- no title-specific exceptions;
- no generic content catalogue.

This report deliberately does not freeze a database schema.

## 20. Lifecycle requirements for the future production increment

A future external-content reference must inherit the existing Teevee enrichment lifecycle rules:

- exact concrete broadcast ownership;
- idempotent recomputation;
- safe start-correction/rekey handling;
- delete/cascade with the broadcast;
- stale-generation protection;
- bounded replay after matcher-version changes;
- D0-style enrichment recovery may reconcile retained exact broadcasts without authorizing schedule replacement.

No generic enrichment framework is needed solely for this feature.

## 21. What V1 -> V2 -> V3 proved

### V1

Result:

- Film 42/45 high;
- Series 41/50 high;
- 2 Series ambiguities.

Learnings:

- direct search is already strong;
- localized titles need bounded fallback;
- naive punctuation made `Clubhouse+` unsafe;
- branded Series naming needs careful handling.

### V2

Result:

- Film 44/45 high;
- Series 46/50 high;
- one Series ambiguity.

Learnings:

- semantic plus handling fixes the reboot collision;
- generic Film credit fallback safely recovers localized titles;
- broad derived-title Series search is too eager: it introduced a parent-franchise collision for SVU.

### V3

Result:

- Film 44/45 high;
- Series 49/50 high;
- no ambiguous accepted outcome.

Learnings:

- title broadening must be staged after strict resolution fails;
- Series identity and episode identity must be separate;
- a very strong cast bundle can prove Series identity even when external episode numbering disagrees;
- fail-closed unresolved cases remain necessary.

## 22. Production-readiness gates that remain

Matching research is complete, but production implementation still requires a separate increment covering:

1. **CLOSED — owner confirms TMDB commercial licensing / production API-data-image usage permission is arranged;**
2. production credential ownership and secret management;
3. API rate-limit, retry, timeout and caching strategy;
4. the smallest persistence/reference contract and migration lifecycle;
5. matcher-version/audit semantics sufficient for replay and explanation;
6. server-only implementation with deterministic fixture tests;
7. artwork-selection research/contract after identity is resolved;
8. transport to mobile without coupling Guide to external enrichment;
9. independent QA and production deployment evidence.

Do not combine all of these into a generic content-platform rewrite.

## 23. Final verdict

**PASS TO NARROW PRODUCTION DESIGN.**

The current provider evidence is empirically sufficient to resolve a useful majority of high-confidence Film and scripted-Series broadcasts to TMDB while keeping unsafe cases unresolved.

The production matcher should optimize for the reviewed high-confidence rules, not overall match rate.

Observed final sample:

- **Film: 44/45 = 97.78% resolved**;
- **Series: 49/50 = 98.00% Series identity resolved**;
- **Combined: 93/95 = 97.89% resolved**;
- **known false-positive external IDs in reviewed high-confidence tier: 0**;
- **repeat identity conflicts: 0**.

The next engineering step is the smallest server-side external-identity production design. The previously separate TMDB commercial-use gate is now closed by owner confirmation; credential, rate-limit/cache and contract-compliance requirements remain part of production design.

Issue #157 / PR #158 is the prerequisite parser/evidence foundation for that design. It productionizes only the transient typed provider evidence that this research materially used: Film production year/director/actor evidence and Series actor/episode evidence, while also retaining producer names by source role for the proven provider boundary. It does not implement TMDB calls, matching, persistence or artwork.

The #152 D0 recovery result also tightens production-readiness gate #5: bounded replay for already-retained broadcasts may not assume later provider refetch still exactly reconciles every canonical broadcast. External-identity production design must explicitly own bootstrap/replay semantics before persistence/deployment.

No artwork UI/runtime implementation is authorized by this report.


## Production implementation follow-up — issue #159 / PR #161

The final research rules in this document are productionized by issue #159 / PR #161 and proposed ADR 0011 (`docs/decisions/0011-broadcast-keyed-external-content-identity.md`).

The implementation keeps the research boundary intact:
- same-observation transient provider evidence is used before it is discarded;
- central high-confidence Film/Series classification remains the entry gate;
- Film year/director and strengthened alternative-title rules are fail-closed;
- Series full-title/S-E/cast/base-title/numbering-disagreement rules remain series-identity-only and never create episode IDs;
- unresolved/ambiguous cases create no external identity;
- canonical `Programme` and public/mobile Guide remain unchanged.

Production lifecycle intentionally does **not** use later exact retained-broadcast refetch as a universal replay/bootstrap. #152/Cold Pursuit evidence superseded that assumption. Identity forward-fills from authoritative complete current/future observations and is stored as a private broadcast-keyed sibling; retained historical D0 may have a temporary warm-up gap rather than receiving fuzzy attachment.
