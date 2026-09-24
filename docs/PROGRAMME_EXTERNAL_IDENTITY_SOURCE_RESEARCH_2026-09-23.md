# Programme external identity source research — 2026-09-23

Status: **EMPIRICAL SOURCE RESEARCH COMPLETE — NO TMDB / ARTWORK IMPLEMENTATION**  
Issue: #153  
Research PR: #154  
Research base inspected: `ca499efb8563a5344f47552be8b2937a4331c98b`  
Live source probe: GitHub Actions run `35916501162`, job `107369193101` — SUCCESS  
Source: `https://iptv-epg.org/files/epg-nl.xml`

## 1. Executive conclusion

The current development XMLTV source contains substantially more useful content-identity evidence than Teevee's canonical `Programme`, and enough of that evidence is structured and high-quality to justify a separate TMDB matching research increment.

The strongest finding is Film:

- 45 current mapped broadcasts carry explicit `Film` evidence;
- all 45 have a production year;
- 44/45 (97.78%) have director credits;
- 44/45 (97.78%) have actor credits;
- 42/45 (93.33%) have producer credits.

For explicit scripted-Series provider rows:

- 187 current mapped broadcasts match the strong explicit series categories used by Teevee classification;
- 186/187 (99.47%) have episode notation;
- 187/187 have a `<date>` year;
- 187/187 have actor credits;
- 118/187 (63.10%) have director credits;
- 165/187 (88.24%) have producer credits.

However, the source does **not** provide a stable programme/content identifier in the current snapshot. The only `<programme>` attributes across all 3,372 mapped rows are `start`, `stop` and `channel`; no programme `id` attribute or other explicit external content ID is present. Teevee therefore must not treat the current provider/broadcast key as content identity.

The source also exposes two important semantic traps:

1. all 2,335 `episode-num` values have **no `system` attribute**; they are display-style values such as `S38 E188`, `E12` or `S3`, not provider episode IDs;
2. the provider often encodes factual hosts/presenters as `<actor>`. There is no `<presenter>` coverage in the mapped snapshot. Actor names are therefore useful supporting evidence only after content-family context has been established.

Recommendation:

- do **not** expand canonical `Programme`;
- expand server-only provider evidence just enough to expose production year and role-preserving credit names during ingest/matching;
- keep the evidence transient initially;
- let the next research spike test this evidence against TMDB and determine confidence rules before adding any production persistence;
- if/when matching is productionized, start with a small broadcast-keyed external-content reference sibling rather than a new Teevee-wide content catalogue abstraction.

Final research verdict: **PASS TO TMDB MATCHING RESEARCH**.

### External-content production successor

Issue #159 / PR #161 consumes the PR #158 transient evidence in the **same authoritative provider observation** and writes only a minimal private broadcast-keyed TMDB reference after canonical schedule storage succeeds. Proposed ADR 0011 records the lifecycle.

The #152/Cold Pursuit evidence is now resolved architecturally by choosing forward-fill/warm-up rather than historical fuzzy reconciliation: partial/stale observations cannot attach external identity, and the persistence RPC requires same-observation authoritative coverage. The dormant #152 classification recovery RPC is not an external-content bootstrap dependency.

### Production follow-up

Issue #157 / PR #158 implements the minimum production parser/domain-boundary follow-up proven necessary by this research and the completed TMDB matching research (#156):

- `ExternalProgramme.productionDate = { raw, year? }`, where only exact current-provider `YYYY` values receive a numeric year;
- `ExternalProgramme.credits = { director[], actor[], producer[] }`, preserving source roles and never globally reinterpreting actor as cast;
- existing categories, episode evidence and classification compatibility remain unchanged;
- canonical `Programme`, public/mobile schedule payloads and persistence remain unchanged;
- evidence is transient/server-side in this increment.

PR #152 is referenced only as lifecycle evidence: its controlled D0 recovery returned 512 provider candidates, 319 exact matches/recoveries and 193 unmatched. That result invalidates the earlier assumption below that later provider refetch plus exact retained-broadcast reconciliation is sufficient for every bootstrap/replay case. The next external-identity production increment must explicitly solve replay/bootstrap ownership; this production-evidence foundation does not introduce fuzzy broadcast matching or evidence persistence.

## 2. Methodology and source snapshot

The research reused the current production development-provider URL and the exact 12 mapped canonical channels from `server/epg/developmentChannelCatalog.ts`.

The local agent sandbox has no outbound DNS. Consistent with the earlier Vanavond source research, a temporary branch-only GitHub Actions probe fetched and parsed the real provider document. The probe did not call Teevee hosted write APIs and did not mutate production state.

Observed snapshot:

| Property | Value |
| --- | --- |
| Response date | 2026-09-23 20:31:22 UTC |
| Bytes | 36,654,822 |
| SHA-256 | `98159dd15af2fb74f96e916d00ea64317c353cd172941eae82552f8c2002cecf` |
| Last-Modified | absent |
| ETag | absent |
| Mapped channels | 12 |
| Mapped programme rows | 3,372 |

The snapshot reproduces the earlier richness population exactly at 3,372 mapped rows.

The probe inventoried `<programme>` attributes and direct child tags, measured field/role coverage, inspected episode notation, selected Film/Series evidence samples and looked for title/year and cross-channel collisions.

## 3. Current architecture inspected

Current boundary:

`XMLTV -> XmltvEpgProvider -> ExternalProgramme -> normaliseProviderSchedule -> canonical Programme + ProgrammeClassification sibling -> ScheduleRepository`

Relevant properties:

- canonical `Programme` deliberately remains narrow;
- `ExternalProgramme` already retains complete categories and episode-number values plus only `hasDirectorCredit` for classification;
- the XMLTV parser does **not** populate `ExternalProgramme.id`;
- canonical `Programme.id` therefore currently uses the fallback broadcast identity derived from provider key + canonical channel + start + end + title;
- classification is a broadcast-keyed sibling and participates in the schedule correction/delete lifecycle;
- PR #152 / issue #151 adds the important D0 recovery rule that exact enrichment recovery can be safe even when a provider window is not complete enough for destructive schedule replacement.

No conclusion below requires changing the accepted provider-independent mobile/Guide boundary.

## 4. Provider richness inventory

### 4.1 Direct programme structure

Across 3,372 mapped programme rows, the only `<programme>` attributes are:

| Attribute | Rows | Coverage |
| --- | ---: | ---: |
| `start` | 3,372 | 100% |
| `stop` | 3,372 | 100% |
| `channel` | 3,372 | 100% |
| programme/content `id` | 0 | 0% |

Observed direct child-tag counts:

| Tag | Occurrences |
| --- | ---: |
| `title` | 3,372 |
| `category` | 5,437 |
| `icon` | 3,372 |
| `desc` | 3,356 |
| `credits` | 2,803 |
| `date` | 2,417 |
| `episode-num` | 2,335 |

No mapped programme contained a direct `sub-title`, `country`, `language`, `rating`, `new`, `premiere`, `previously-shown`, `live` or `presenter` element in this snapshot.

Absence in this snapshot is not a universal XMLTV capability claim. It means these fields cannot currently be depended on for this provider.

### 4.2 Richness and matching value

| Field | Coverage | Film usefulness | Series usefulness | Reliability / recommendation |
| --- | ---: | --- | --- | --- |
| title | 100% | required search key | required series search key | necessary, never sufficient alone |
| subtitle | 0% | none today | none today | do not design around it |
| description | 99.53% | weak fallback/context | weak fallback/context | transient only; avoid primary fuzzy identity |
| complete categories | 100% | high content-family gate | high content-family gate | already retained server-side; provider vocabulary only |
| multiple categories | 60.47% | high supporting context | high supporting context | proves first-category canonical genre is lossy |
| episode notation | 69.25% overall | n/a | high episode evidence | all unnamespaced display notation; not an external episode ID |
| production year | 71.68% overall | **high discriminator** | medium/episode context | all observed values are `YYYY`; semantics differ by content family |
| credits block | 83.13% | high candidate validation | high candidate validation | preserve roles; do not flatten |
| director | 23.10% overall | **strong supporting evidence** | weak-medium, often episode-level | 97.78% on explicit Film |
| actor | 80.13% overall | strong supporting evidence | medium supporting evidence | unsafe without family context because hosts are encoded as actors |
| producer | 26.75% overall | weak-medium support | weak-medium support | useful tie-breaker, not required search input |
| presenter | 0% | n/a | n/a | hosts are not reliably typed as presenters |
| country | 0% | none today | none today | no current matching value |
| language | 0% | none today | none today | no current matching value |
| rating | 0% | none today | none today | no current matching value |
| new/premiere | 0% | none today | none today | no current matching value |
| previously-shown/live | 0% in snapshot | no identity value | no identity value | retain tri-state classification semantics, not identity evidence |
| programme `icon` | 100% | **not identity evidence** | **not identity evidence** | opaque `iptv-epg.org/images/...` proxy URLs; no standard content/artwork identity |
| provider programme/content ID | 0% | unavailable | unavailable | do not invent one |

The provider contains 74 distinct category values in this snapshot. This reinforces the existing classification conclusion that complete categories are useful structured evidence but remain provider vocabulary rather than public Teevee semantics.

## 5. Production year/date

`<date>` coverage is 2,417 / 3,372 = **71.68%**.

Every observed value has exactly the shape:

`YYYY`

There are 32 unique values, from 1990 through 2026. There are no full dates in the current mapped snapshot.

### Film

All 45 explicit Film rows have a production year: **100% Film coverage**.

Examples:

| Film | Year | Director evidence |
| --- | ---: | --- |
| Billy Elliot | 2000 | Stephen Daldry |
| Almost Famous | 2000 | Cameron Crowe |
| The Little Gangster | 2015 | Arne Toonen |
| De pupil | 2025 | Karin Junger |
| A Taste of Tuscany | 2022 | Brian Brough |
| Moonlight in Vermont | 2017 | Mel Damski |

For Film, title + production year is materially more discriminating than title alone, especially for remakes/generic titles. Director/cast can then validate ambiguous search candidates. A year mismatch should normally lower or reject confidence rather than be ignored.

The next TMDB research must still measure provider/TMDB year disagreements before treating year equality as an absolute rule.

### Series

All 187 explicit-Series rows also have a year, but this field is **not a stable series-première year**.

Examples:

- `Home and Away — S38 E17 — date 2025`;
- `Neighbours: A New Chapter — S38 E188 — date 2023`;
- `Sullivan's Crossing — S4 E3 — date 2026`.

The provider year therefore behaves like programme/episode production/release context. Feeding it directly into a TMDB TV-series first-air-year constraint would create false negatives for long-running series.

This is visible at population level: **61 titles have multiple date values inside one source snapshot**, including `Bluey` (2018/2020/2021), `Chicago Fire` (2024/2025) and `Bing` (2014/2015).

Conclusion:
- Film: year = strong discriminator;
- Series: year = supporting episode-era evidence only, never assume it equals series first-air year.

## 6. Credits

Credits exist on 2,803 / 3,372 rows = **83.13%**.

Role coverage:

| Role | Programmes | Coverage | Total role entries | Mean entries when present |
| --- | ---: | ---: | ---: | ---: |
| actor | 2,702 | 80.13% | 14,373 | 5.32 |
| producer | 902 | 26.75% | 1,787 | 1.98 |
| director | 779 | 23.10% | 922 | 1.18 |
| presenter | 0 | 0% | 0 | — |

### Film-specific strength

Among 45 explicit Film rows:

- director: **97.78%**;
- actor: **97.78%**;
- producer: **93.33%**.

For Film matching:
- director names are strong supporting identity evidence;
- cast names are strong supporting evidence after a candidate set exists;
- producers are useful additional tie-breakers but should not be required for a match.

### Actor semantic problem

The earlier classification warning is confirmed directly.

Examples where the source uses `<actor>` for factual hosts/presenters:

- `Hart van Nederland` / `Nieuws`: Maarten Steendam, Nikki Herr, Sandra Schuurhof, Marlayne Sahupala, Mirella van Markus, Celine Huijsmans appear as actors;
- `House Rules` / `Reality`: Johanna Griggs and Carolyn Burns-McCrave appear as actors;
- `MasterChef Australia: Back to Win` / `Reality Competitie`: Andy Allen, Poh Ling Yeow, Sofia Levin and Jean-Christophe Novelli appear as actors;
- `Buzz` / `Talkshow`: Iris Enthoven and Wiesje Hillen appear as actors.

There are zero typed presenter rows in this source snapshot.

Therefore:
- preserve the raw XMLTV role name;
- never reinterpret `actor` globally as fictional cast;
- credit names become identity evidence only in a known Film/Series candidate context;
- actor overlap alone must never establish content identity.

## 7. Episode identity

Episode-number coverage: 2,335 / 3,372 = **69.25%**.

All 2,335 values have **no `system` attribute**. There are no double-system programmes.

Observed notation:

| Shape | Rows |
| --- | ---: |
| explicit `Sx Ey` | 2,126 |
| episode-only `Ey` | 113 |
| season-only `Sx` | 96 |

For the 187 explicit-Series rows, episode-number coverage is **99.47%**.

Representative examples:

- `Neighbours: A New Chapter` — `S38 E188`;
- `Home and Away` — `S38 E17`;
- `Sullivan's Crossing` — `S4 E3`;
- `Wild Cards` — `S1 E3`.

This is valuable episode-location evidence but **not external identity**:
- no provider episode ID is present;
- no XMLTV namespace/system exists;
- season-only and episode-only rows exist;
- notation can identify the intended episode within a candidate series but cannot safely discover the series by itself.

Future flow should be:

`broadcast title + content-family evidence -> external series candidate -> optional S/E candidate validation -> series-level external identity`

Do not first search TMDB for an episode title/entity and then infer the series.

## 8. Provider programme identifiers

The current source has **no programme ID attribute at all** across 3,372 mapped programme rows.

Consequences:

1. `XmltvEpgProvider` correctly leaves `ExternalProgramme.id` undefined.
2. The current canonical `Programme.id` uses its fallback broadcast identity based on provider key + canonical channel + start + end + title.
3. That ID is deterministic for the exact observed broadcast, but it is not a provider content ID.
4. A start/end correction changes the fallback identity.
5. Repeats are separate broadcasts.
6. The same title on another channel is a separate broadcast.
7. Nothing in the current raw source proves same-content identity across repeats/channels.

The snapshot contains **59 titles seen on multiple active channels**, including `De slimste mens`, `Buzz`, `Andere Tijden Sport` and `Business Class`. Title equality across those rows is obviously not a safe substitute for an external content ID.

There is therefore no provider identifier whose stability over repeated ingests/repeats/start corrections can meaningfully be tested as content identity. The current source simply does not provide one.

If a future EPG provider supplies identifiers, Teevee must retain them with provider namespace and empirically classify their semantics before using them:
- broadcast ID;
- programme/work ID;
- episode ID;
- series ID;
- unknown/opaque.

Never map an opaque provider ID to content identity by assumption.

## 9. Film identity evidence

Current explicit-Film sample shows a consistently strong evidence bundle:

| Title | Year | Categories | Director | Cast examples | Expected pre-TMDB confidence |
| --- | ---: | --- | --- | --- | --- |
| Billy Elliot | 2000 | Drama / Film | Stephen Daldry | Julie Walters, Jamie Bell | high search evidence |
| Almost Famous | 2000 | Drama / Film | Cameron Crowe | Billy Crudup, Frances McDormand, Kate Hudson | high |
| The Little Gangster | 2015 | Film / Komedie | Arne Toonen | Meral Polat, Raymond Thiry | high |
| De pupil | 2025 | Drama / Film | Karin Junger | Bart De Wilde, Gijs Naber, Hadewych Minis | high |
| A Taste of Tuscany | 2022 | Drama / Film | Brian Brough | Laura Mitchell, Brad Johnson | high |
| Moonlight in Vermont | 2017 | Film / Romantische Komedie | Mel Damski | Lacey Chabert, Carlo Marks | high |
| Beauty and the Billionaire | 2022 | Film / Romantiek | Brian Brough | Sashleigha Hightower, Chris Reid | high |

The expectation above is **source-evidence confidence**, not a claimed TMDB match result. TMDB has not been queried in this increment.

### Film matching hypothesis for the next spike

Candidate generation:
1. normalized title;
2. content family already classified as Film;
3. production year as strong search/discrimination evidence.

Candidate validation:
- director intersection;
- cast intersection;
- duration tolerance if useful;
- optional producer support.

Fail closed when:
- title produces multiple plausible same-year candidates and credits do not separate them;
- provider year conflicts materially with all candidates;
- translated/provider-localized title finds no defensible candidate;
- TV movie/documentary semantics disagree;
- evidence is internally contradictory.

Known cases to deliberately include:
- same-title remakes;
- generic titles;
- translated/localized titles;
- one Film row without director/cast;
- Dutch/local productions;
- TV movies/documentaries;
- provider year ±1 disagreements if observed during TMDB comparison.

## 10. Series identity evidence

Representative explicit-Series sample:

| Title | Provider year | Episode | Categories | Supporting people |
| --- | ---: | --- | --- | --- |
| Neighbours: A New Chapter | 2023 | S38 E188 | Dramaseries / Soap | Alan Fletcher, Annie Jones; director Eugenie Muggleton |
| Home and Away | 2025 | S38 E17 | Dramaseries / Soap | Ray Meagher, Georgie Parker; directors David Gould / Geoffrey Nottage |
| Sullivan's Crossing | 2026 | S4 E3 | Dramaseries | Morgan Kohan, Chad Michael Murray |
| Wild Cards | 2024 | S1 E3 | Misdaaddrama | Giacomo Gianniotti, Vanessa Morgan; director Lee Rose |
| Five Bedrooms | 2023 | S4 E3 | Dramaseries / Romantische Komedie | Kat Stewart, Stephen Peacocke |
| Million Dollar Listing New York | 2014 | S3 E5/E6 | Dramaseries / Reality | Fredrik Eklund, Ryan Serhant |

The `Million Dollar Listing New York` rows are an intentional warning: raw category/actor vocabulary can look superficially series-like while `Reality` is also present. External identity matching must consume the **provider-independent content classification result** as a gate, not independently reinvent Film/Series semantics from raw categories.

### Series matching hypothesis for the next spike

Candidate generation:
1. normalized programme title as series title;
2. only rows already classified as high-confidence Teevee Series for the researched production path;
3. do **not** use provider production year as TMDB first-air year.

Candidate validation:
- S/E existence against the candidate series where TMDB episode data is available;
- cast overlap as supporting evidence;
- director overlap is weak for series-level identity because it is episode-specific;
- provider production year can validate episode-era plausibility, not series premiere;
- repeated broadcasts of the same S/E should resolve to the same external series and episode identity if the provider metadata is stable.

Failure modes:
- localized/translated series title;
- reboot/new-chapter naming differences;
- same-name series;
- reality/non-scripted rows accidentally carrying series-looking metadata;
- season numbering differences between provider/TMDB;
- specials or episode-only/season-only notation;
- production year interpreted incorrectly as series first-air year.

## 11. Broadcast identity versus external content identity

### Broadcast identity — keep unchanged

`Programme.id`

Meaning: one concrete channel/timing broadcast.

It remains the ownership key for:
- Guide;
- Programme Detail;
- save/reminder state;
- Vanavond broadcast eligibility;
- lifecycle/correction semantics.

### External content identity — separate layer

The next layer answers a different question:

> Which external Film/Series work does this broadcast refer to?

Possible external identities:
- Film;
- Series;
- optionally Episode;
- source/provider reference such as a TMDB media type + ID.

### Minimal architecture choice

Do **not** create a general Teevee `ContentIdentity` aggregate/catalogue yet.

For the first production artwork use case, the smallest adequate model is a broadcast-keyed sibling/reference conceptually similar to:

```
ProgrammeExternalContentReference {
  programmeId
  contentKind: film | series
  source
  externalContentId
  externalEpisodeId?
  confidence
  matcherVersion
  matchedAt
}
```

The exact production schema is intentionally **not** frozen by this research.

Why broadcast-keyed first:
- the input fact to resolve is a concrete provider broadcast;
- correction/delete lifecycle already belongs to `Programme.id`;
- different broadcasts may safely resolve to the same external ID;
- it avoids prematurely introducing a Teevee content catalogue, canonical title entity or cross-provider master-data model.

A standalone content-keyed entity becomes justified later only if product behaviour needs content-level ownership independent from broadcasts, for example persistent title favourites, cross-broadcast deduplication, a content detail catalogue or recommendations.

## 12. Minimal raw evidence to preserve before canonicalization

### Already available and should remain

- normalized/raw provider programme title;
- subtitle if a future provider supplies it;
- description as bounded contextual evidence;
- complete category set;
- structured episode-number values including the raw `system` when present;
- provider programme ID when supplied, namespaced by provider and treated as opaque until semantics are proven;
- start/end/channel for exact broadcast reconciliation.

### Add for external-identity research/production matching

Server-only `ExternalProgramme` should later be able to expose:

1. `productionDate` or equivalent raw provider date evidence; current XMLTV can normalize this safely to an optional `productionYear` because every observed value is `YYYY`;
2. role-preserving credit names:
   - directors;
   - actors;
   - producers;
   - presenters/hosts when a provider actually supplies those roles.

Do not replace role-preserving credits with a generic `people[]` bag.

### Transient versus persistent

**Parse-only / transient:**
- raw XML document;
- raw `icon` URL;
- unused rating/language/country/new/premiere fields if absent/not proven useful;
- full provider tag vocabulary not required by a matcher.

**Needed during ingest/matching:**
- title;
- content classification;
- full categories while the provider-specific interpreter needs them;
- production year/date;
- episode notation;
- role-preserving directors/actors/producers;
- channel/timing/duration;
- opaque provider IDs if present.

**Persistent only if production evidence later proves necessary:**
- resolved external reference;
- matcher version/confidence;
- minimal audit/fingerprint sufficient to explain/re-evaluate a resolution.

This research does **not** justify persisting all raw credits/categories per broadcast.

Why transient is sufficient initially:
- current matching can run server-side against the same provider observation used by ingest;
- D0 recovery can re-fetch provider evidence and reconcile only exact retained canonical broadcasts;
- storing full raw metadata adds schema/licensing/data-minimization cost before TMDB matching has proven which fields actually contribute.

If future provider retention/availability proves insufficient for replay, a small private identity-evidence snapshot can be reconsidered with measured necessity.

## 13. Programme icon

The current source supplies an `<icon>` for all 3,372 mapped rows, but every URL is an opaque `iptv-epg.org/images/...` resource.

There is no:
- embedded content ID;
- stable source namespace usable as Film/Series identity;
- aspect/language/artwork-type contract;
- evidence that the asset is a poster/backdrop class suitable for Teevee;
- rights/provenance contract established by this research.

Therefore icon is **not identity evidence** and does not remove the need for external artwork enrichment.

Do not persist it into canonical `Programme` merely because coverage is 100%.

## 14. Bootstrap/recovery lifecycle requirements

A future external-content/artwork sibling must learn from issue #151 / PR #152.

### Normal creation

- derive external matching evidence server-side from the provider observation;
- canonicalize the broadcast;
- resolve the external reference independently of Guide eligibility;
- write the sibling only after a high-confidence external match exists;
- no match = no sibling.

### Start correction / rekey

A corrected start can change `Programme.id`.

Required behaviour:
- old broadcast/reference follows canonical delete/cascade or equivalent cleanup;
- new broadcast is independently matched from current evidence;
- never title-rekey an old external reference onto a different broadcast;
- recomputation may resolve the same external content ID, which is expected.

### Delete/cascade

When a canonical broadcast leaves retained authoritative schedule state, its broadcast-keyed reference must not survive as an orphan.

### Stale protection

Every asynchronous matching/backfill write needs an observation/match generation. An older match completion must not overwrite a newer provider observation or corrected broadcast.

### Idempotency

Replaying identical provider evidence for the same canonical broadcast should produce the same reference or no-op.

### Active D0 recovery / partial provider window

**Schedule replacement completeness != enrichment recovery eligibility.**

A recovery path may:
1. fetch a bounded provider scope;
2. parse/normalize matching evidence;
3. reconcile candidates only against already-retained concrete canonical broadcasts;
4. require exact/current broadcast agreement;
5. write only missing/current external-reference siblings;
6. never delete/replace schedule rows or coverage;
7. ignore unmatched, corrected or stale candidates;
8. be safe to rerun.

### Replay

The enrichment must support bounded replay against retained broadcasts after matcher improvements/version changes. Replay should never change Guide visibility or programme identity.

Do not build a generic enrichment framework merely to support these requirements.

## 15. Privacy, rights and minimization

Credits and programme metadata are factual provider data, not user-personal profile data, but source licensing/redistribution remains a separate production gate.

Minimization rules:
- keep raw provider evidence server-side;
- do not return raw credits/categories to mobile merely for artwork;
- do not persist complete raw source documents;
- persist only what a proven matcher/recovery lifecycle needs;
- artwork rights/provenance and TMDB API/image terms remain independent from EPG matching correctness.

## 16. TMDB matching research handoff

The next research thread should test actual TMDB candidate matching. It must still be a research spike, not production artwork implementation.

### Input population

Use real provider records from the same mapped channels, stratified to include at minimum:

**Film**
- 30–50 high-confidence Film broadcasts;
- duplicate titles/repeats where present;
- generic/same-title risk cases;
- Dutch/local and international titles;
- translated/localized-title candidates;
- at least the row lacking normal director/cast evidence;
- Film rows with complete year/director/cast evidence.

**Series**
- 30–50 high-confidence scripted-Series broadcasts;
- long-running series;
- new/reboot/new-chapter titles;
- same series across multiple episodes/repeats;
- S/E, season-only and episode-only notation;
- examples with and without directors;
- no non-scripted/reality row should be treated as Series unless Teevee classification itself says high-confidence Series.

### Minimum fields supplied to the matcher research

Per broadcast:
- canonical `Programme.id` for traceability only;
- normalized provider title;
- provider content classification;
- production year/date;
- episode notation;
- duration;
- director names;
- actor names;
- producer names as optional support;
- provider channel/start only for traceability/reconciliation, **not** external content identity;
- provider ID only if present; current source has none.

### Confidence hypotheses to test

Film:
- title + matching year + director overlap -> likely Tier A/high;
- title + matching year + meaningful cast overlap -> likely high;
- title + year only -> candidate-dependent, never automatically high when ambiguous;
- title only -> fail closed.

Series:
- title + candidate series + valid S/E -> likely high;
- title + strong cast overlap + consistent S/E -> likely high;
- title alone -> fail closed when candidate ambiguity exists;
- provider production year must not be required to equal TMDB first-air year.

Candidate validation must measure actual false-match behaviour before thresholds are frozen.

### Success criteria

The TMDB research may recommend production matching only if it can demonstrate:

1. a documented ground-truth sample for Film and Series;
2. **zero known false-positive external IDs in the reviewed high-confidence tier**;
3. a useful measurable resolution rate without title-specific production exceptions;
4. explicit unresolved/ambiguous output for unsafe cases;
5. stable resolution for repeats of the same content;
6. correct separation of Film versus Series search spaces;
7. Series matching does not mistake episodes for separate series;
8. year mismatch/localized-title/season-numbering failure modes are quantified;
9. no direct mobile TMDB dependency is required;
10. the minimal fields that materially contribute to matching are identified before persistence is designed.

This gate deliberately prioritizes precision over match rate. A missing poster is acceptable; a confidently wrong poster is not.

## 17. Open uncertainties

The source research intentionally leaves these for the TMDB comparison:

- how often provider year differs from TMDB release year for Film;
- how often provider titles are localized differently from TMDB searchable titles;
- whether director/cast overlap adds enough precision after title+year to justify retaining both in production matching;
- what candidate-search strategy best handles punctuation/articles/translated titles;
- how TMDB season/episode numbering diverges from the provider;
- whether provider icon URLs have any stable cache value independent from external artwork; they have no identity value regardless;
- exact persistence shape/versioning after matching confidence is empirically known.

No uncertainty above requires broadening canonical `Programme`.

## 18. Architectural recommendation

Minimal next architecture, contingent on TMDB research success:

`raw provider programme -> server-only identity evidence -> provider-independent Teevee classification gate -> external matcher adapter -> optional broadcast-keyed ExternalContentReference -> optional artwork selection -> Vanavond/Programme Detail enrichment`

Hard boundaries:
- `Programme.id` stays broadcast identity;
- raw provider vocabulary stays server-side;
- TMDB vocabulary stays behind its matcher/artwork adapter;
- Guide remains enrichment-independent;
- absence/failure of external identity/artwork fails open for Guide and fail-closed for enrichment;
- no title-specific production exceptions;
- no Teevee content catalogue abstraction until a product use case needs it.

## 19. Verdict

The current provider supplies enough structured Film/Series identity evidence to make an empirical TMDB candidate-matching spike worthwhile, while also proving why title-only matching and provider-ID assumptions would be unsafe.

**PASS TO TMDB MATCHING RESEARCH**
