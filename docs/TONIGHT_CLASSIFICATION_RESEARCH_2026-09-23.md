# Vanavond classification research — 2026-09-23

Status: **EMPIRICAL DATA GATE COMPLETE — NO PRODUCTION IMPLEMENTATION**  
Issue: #135  
Research branch: `research/issue-135-tonight-classification`  
Canonical runtime/data base inspected: `cbdf97ba09f59dd4ae4e019b2e60e51dc03bedde`  
Final branch reconciled to latest `main`: `fad634e48102714d44711dc0a644f5c28adf0e22`  
Live canonical capture: 2026-09-23T09:43:34.961Z and confirmation run 2026-09-23T09:45Z  
Hosted read boundary: production `guide-schedule`

## 1. Executive conclusion

The current canonical hosted Teevee schedule is **not sufficient as a direct production classification contract** for any of the three Vanavond category modules.

The decisive problem is not genre availability: in the captured evening population every canonical programme had a non-empty `genre`. The problem is **semantic loss and taxonomy ambiguity**:

- the XMLTV adapter keeps only the **first** XMLTV `category`;
- that provider category is passed through as canonical `genre` without a Teevee semantic content-type mapping;
- obvious films occur under both `Film` and `Drama`;
- obvious scripted series occur under `Dramaseries`, `Misdaaddrama`, `Sitcoms`, but also under `Mysterie`, `Komedie`, `Misdaad` and the audience bucket `Kinderen`;
- `Sport` mixes full events, highlights/summary and historical sport documentary;
- `Sporttalkshow` identifies pre/post-match programming separately, but there is no canonical sport subtype;
- across all 1,114 captured broadcasts starting in the Vanavond category window, `isLive` was undefined for **100%** and `isRepeat` was undefined for **100%**.

Required decisions:

| Module | Decision | Why |
| --- | --- | --- |
| Film | **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT** | Exact `Film` had 100% precision in the reviewed sample but only 78.0% recall because 9/41 reviewed film broadcasts were canonical `Drama`. |
| Serie | **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT** | A narrow explicit-series whitelist was precise, but content type is spread across generic/audience genres. Its focused adult-scripted recall was 92.9%, while an expanded unqualified-series review including children's scripted series fell to 50.2%. |
| Sport | **GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT** | Exact `Sport` cannot distinguish event, summary and historical magazine/documentary; an event+same-day-highlights interpretation produced only 50% precision. Live/repeat metadata contributes no usable evidence in the captured population. |

No module should be implemented with UI-level `genre.includes(...)`, title-specific exceptions or a direct provider-taxonomy whitelist distributed through presentation code.

## 2. Dataset and scope

### Canonical source

The research used the same public hosted `guide-schedule` boundary consumed by Teevee, which reads the private canonical ScheduleRepository through the server-owned Supabase boundary.

This is deliberately **post-provider, post-channel-mapping, post-normalisation canonical data**. Raw XMLTV was not used as the classification truth.

Because the local research environment had no outbound DNS, the live capture ran in a temporary GitHub Actions test on this research branch. The temporary test is not part of the final PR. Evidence runs:

- CI #1025 / run `35844534965`: first live aggregate capture;
- CI #1028 / run `35844684020`: full canonical evening-row capture used for manual review.

### Television-day scope

All requests were derived with the existing `guideTelevisionDayHorizon` / `guideTelevisionDayTime` primitives:

- television day: 06:00 Europe/Amsterdam -> 06:00 next local calendar day;
- inspected product horizon: D-2 through D+7;
- Vanavond category window: starts in `[19:00, 06:00)`;
- the 18:00 flag was also captured for Jouw gids/Kijktips context.

At capture time:

| Offset | Television day | Canonical status | Programmes | starts >=18:00 | starts >=19:00 |
| ---: | --- | --- | ---: | ---: | ---: |
| D-2 | 2026-09-21 | ok | 524 | 174 | 146 |
| D-1 | 2026-09-22 | ok | 519 | 173 | 147 |
| D | 2026-09-23 | ok | 513 | 162 | 136 |
| D+1 | 2026-09-24 | ok | 520 | 169 | 142 |
| D+2 | 2026-09-25 | ok | 524 | 169 | 142 |
| D+3 | 2026-09-26 | ok | 406 | 159 | 137 |
| D+4 | 2026-09-27 | ok | 409 | 148 | 128 |
| D+5 | 2026-09-28 | ok | 517 | 162 | 136 |
| D+6 | 2026-09-29 | **unavailable** | — | — | — |
| D+7 | 2026-09-30 | **unavailable** | — | — | — |

The authoritative usable research population is therefore **D-2 through D+5: eight complete television days, 12 active canonical channels, 3,932 canonical programme rows, of which 1,114 start from 19:00 through 06:00**.

D+6 and D+7 were not treated as empty evenings. ADR 0007 requires `unavailable` to remain distinct from covered-empty. This current result is also consistent with the temporary development-provider horizon limitation already documented in `docs/EPG_HORIZON_INVESTIGATION_2026-09-21.md`.

The eight available days include weekdays and the full Saturday/Sunday weekend of 26–27 September, and cover early evening, primetime, late evening and after-midnight programming.

Before finalizing the PR, `main` advanced by one Search closeout commit (`fad634e...`) touching only `docs/BUILD_SPEC.md`, `docs/DEVLOG.md` and `docs/PROJECT_STATE.md`; no EPG/domain/read-boundary code changed. The research branch was reset/rebased onto that latest `main` before the final research document was committed.

### Active canonical channels

All 12 were active and present in every available read:

1. NPO 1
2. NPO 2
3. NPO 3
4. RTL 4
5. RTL 5
6. SBS6
7. RTL 7
8. RTL 8
9. Net5
10. Veronica / Disney XD
11. SBS9
12. RTL Z

After-19:00 row volume by channel:

| Channel | Rows |
| --- | ---: |
| Veronica / Disney XD | 162 |
| RTL Z | 145 |
| NPO 1 | 113 |
| NPO 3 | 106 |
| RTL 4 | 95 |
| NPO 2 | 84 |
| SBS6 | 83 |
| RTL 5 | 82 |
| Net5 | 79 |
| RTL 8 | 63 |
| SBS9 | 53 |
| RTL 7 | 49 |

## 3. Methodology

For every returned canonical programme row the capture retained:

- `Programme.id`;
- canonical `channelId`;
- channel display name and sort order;
- `startAt` and `endAt`;
- title;
- subtitle when present;
- description when present;
- exact canonical `genre`;
- `isLive`;
- `isRepeat`;
- television-day label;
- starts-after-18:00 flag;
- starts-after-19:00 flag.

Classification evaluation followed these rules:

1. use exact canonical values, never substring matching;
2. evaluate programme rows inside the canonical 19:00–06:00 start window;
3. fail closed on uncertainty;
4. treat undefined live/repeat as unknown, never false;
5. use titles/descriptions only for **manual ground-truth adjudication**, not as proposed client heuristics;
6. where a boundary case was not safely inferable from the canonical description alone, use an authoritative external programme/film source only as a manual validation aid;
7. do not create title-specific production exceptions to improve metrics.

Metrics use broadcast rows rather than unique titles, because Vanavond renders concrete broadcasts.

### Ground-truth review universes

The manual review was intentionally stratified around both positive and failure-prone categories.

**Film review universe — 41 rows**

All after-19 rows with canonical genre:

- `Film` — 32 rows;
- `Drama` — 9 rows.

All 41 were manually inspected. The `Drama` rows contained seven distinct feature films and nine concrete broadcasts.

**Series focused review universe — 130 rows**

All after-19 rows with:

- `Dramaseries` — 61;
- `Misdaaddrama` — 24;
- `Sitcoms` — 20;
- `Komedie` — 8;
- `Mysterie` — 4;
- `Misdaad` — 4;
- `Drama` — 9.

For the focused metric, “series” means a scripted episodic programme rather than panel/news/reality/factual formats.

A second deliberate scan covered all **104 `Kinderen` rows**, because an unqualified product label “Series” can also include scripted children's series.

**Sport review universe — all 9 sport-labelled evening rows**

- `Sport` — 6;
- `Sporttalkshow` — 3.

All nine rows were individually reviewed and assigned a semantic subtype where the evidence allowed it.

These bounded universes make the reported precision/recall reproducible, but they are not claimed to be a perfect census of every latent semantic type hidden under every one of the 42 canonical genre values.

## 4. Canonical genre/category inventory

There were **42 distinct canonical genre values** in the 1,114 after-19 rows.

| Canonical genre | Count | Canonical genre | Count |
| --- | ---: | --- | ---: |
| Nieuws | 257 | Reality | 165 |
| Kinderen | 104 | Talkshow | 82 |
| Dramaseries | 61 | Documentaire | 55 |
| Entertainment | 49 | Shoppen | 40 |
| Spelshow | 34 | Film | 32 |
| Consumentenprogramma's | 31 | Weer | 28 |
| Misdaaddrama | 24 | Sitcoms | 20 |
| Reality Competitie | 16 | Actualiteitenprogramma's | 12 |
| Interview | 10 | Drama | 9 |
| Komedie | 8 | Bouwen En Verbouwen | 7 |
| Debat | 6 | Exercise | 6 |
| Medisch | 6 | Reizen | 6 |
| Sport | 6 | Beeldende Kunst | 4 |
| Misdaad | 4 | Muziek | 4 |
| Mysterie | 4 | Auto's | 3 |
| Sporttalkshow | 3 | Actualiteit | 2 |
| Cabaret | 2 | Culinair | 2 |
| Dieren | 2 | Politiek | 2 |
| Religie | 2 | Samenleving | 2 |
| Business & Financial | 1 | Geschiedenis | 1 |
| Variété | 1 | Wetenschap | 1 |

Notable taxonomy characteristics:

- content form, subject, audience and genre are mixed in one field;
- examples of form/type-like values: `Film`, `Dramaseries`, `Sitcoms`;
- subject-like values: `Sport`, `Politiek`, `Auto's`;
- audience-like value: `Kinderen`;
- format-like values: `Talkshow`, `Spelshow`, `Documentaire`;
- mixed provider vocabulary/language survives canonicalisation: `Business & Financial`, `Home & Garden` and `Exercise` occur elsewhere in the full-day dataset.

This is not a provider-independent semantic content-type ontology.

## 5. Missing-data analysis and adapter semantics

### Genre

Missing/blank canonical genre:

| Population | Missing | Rate |
| --- | ---: | ---: |
| all 3,932 captured canonical rows | 0 | 0% |
| starts >=18:00 | 0 / 1,316 | 0% |
| starts >=19:00 | 0 / 1,114 | 0% |

That is excellent field presence, but it must **not** be confused with semantic completeness.

### XMLTV category loss

Current `XmltvEpgProvider` uses:

`genre = elementText(programmeBlock, 'category')`

`elementText` returns the first matching element. Therefore:

- the first XMLTV `<category>` becomes canonical `genre`;
- any second/subsequent XMLTV category is discarded before canonical storage;
- downstream canonical consumers cannot reconstruct those lost categories;
- the current canonical row cannot tell whether its one genre was the only source category or merely the first.

This matters directly for Film/Series/Sport because the first provider category may express subject, audience or format rather than the desired Teevee content type.

### isLive

The adapter emits `isLive: true` only when a `<live/>` tag exists. It does not emit `false` for absence.

Captured after-19 population:

- true: **0**
- false: **0**
- undefined: **1,114 / 1,114 (100%)**

Therefore `isLive` currently provides **zero discriminating power** for the researched canonical horizon.

### isRepeat

The adapter emits `isRepeat: true` only when `<previously-shown>` exists. It does not emit `false` for absence.

Captured after-19 population:

- true: **0**
- false: **0**
- undefined: **1,114 / 1,114 (100%)**

Therefore `isRepeat` currently provides **zero discriminating power** for the researched canonical horizon.

A concrete sport failure demonstrates the consequence: the official NTR schedule labels the researched `Andere Tijden Sport — Kein Geloel, Fussbal Spielen` broadcasts as reruns/`hh`, while the canonical rows still had `isRepeat === undefined`. The absence of the flag is therefore demonstrably not evidence of first-run status.

## 6. Film results

### Naive current-canonical candidate

Conservative direct rule:

`genre === 'Film'`

Captured volume: **32 broadcasts / 28 distinct titles**.

Every reviewed `Film` row was a genuine feature film: **0 false positives**.

However, every one of the 9 reviewed `Drama` broadcasts was also a feature film:

| Programme id | Day | Channel | Title | Canonical genre | Ground truth |
| --- | --- | --- | --- | --- | --- |
| programme-0dwqvtl08eaxg1 | 2026-09-22 | RTL 7 | The Grey | Drama | Film |
| programme-1nwhhxt0olb8lx | 2026-09-22 | Veronica / Disney XD | Kursk | Drama | Film |
| programme-0rm0owm1brj1lk | 2026-09-23 | Veronica / Disney XD | I, Robot | Drama | Film |
| programme-1885p521qxv4h0 | 2026-09-24 | SBS9 | The Martian | Drama | Film |
| programme-1xt7oj701dq6n7 | 2026-09-26 | NPO 3 | De pupil | Drama | Film |
| programme-0bh26010yhfynl | 2026-09-26 | SBS9 | I, Robot | Drama | Film |
| programme-1l7e20c05wz8jc | 2026-09-27 | Net5 | Billy Elliot | Drama | Film |
| programme-12bo6u91pqnvmh | 2026-09-27 | Net5 | Almost Famous | Drama | Film |
| programme-0xm918000heepu | 2026-09-27 | SBS9 | Kursk | Drama | Film |

`De pupil` was independently checked because its canonical description alone did not explicitly say “film”; Filmhuis Den Haag / Eye / NFF identify it as Karin Junger's 2025 feature film. Other boundary titles are established feature films and were consistent with their canonical descriptions.

### Film quality metric

Reviewed positive universe: 41 film broadcasts.

- true positives: 32
- false positives: 0
- false negatives: 9
- precision: **32 / 32 = 100%**
- recall/coverage: **32 / 41 = 78.0%**
- ambiguous after adjudication: 0
- sample size: 41 positive/boundary rows

The precision target is met; the approximately 85% recall gate is **not**.

Mapping every `Drama` row to film happens to recover these nine rows in this eight-day snapshot, but that is not a defensible production rule: `Drama` is a generic semantic category and can represent episodic drama in another provider/day. It would be sample overfitting.

### Film decision

**GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**

Film repeats remain eligible. No repeat filter should be introduced.

## 7. Series results

### Conservative explicit-series candidate

The strongest current exact values are:

- `Dramaseries`
- `Misdaaddrama`
- `Sitcoms`

They produce **105** after-19 broadcasts.

Nightly volume is large and stable: 11–15 candidates per available evening.

In the focused 130-row review universe:

- all 105 explicit-series candidates were genuine scripted episodic series;
- 8 scripted-series broadcasts were missed:
  - `Best Medicine` — `Komedie`;
  - `Missie Aarde` — `Komedie`;
  - `The Spencer Sisters` — 2 rows under `Mysterie`;
  - `Agatha Christie's Poirot` — 2 rows under `Mysterie`;
  - `Aspe` — 2 rows under `Misdaad`;
- `Drama` contained films, not series, in this sample;
- other `Komedie` rows included panel/sketch/home-video formats;
- `Misdaad` also contained the factual `Het Interventie Team`.

Focused adult-scripted metric:

- true positives: 105
- false positives: 0
- false negatives: 8
- precision: **100%**
- recall/coverage: **92.9%**
- focused sample size: 130 rows

Numerically that focused sample clears the launch gate. It is nevertheless **not sufficient proof for the unqualified product label “Series”**.

### Audience/category collision: Kinderen

The deliberate scan of all 104 `Kinderen` evening rows found:

- `Bluey`: **80** scripted episodic broadcasts;
- `Marvel's Spidey and His Amazing Friends`: **16** scripted episodic broadcasts;
- `NOS Jeugdjournaal`: 8 non-series broadcasts.

So the provider uses `Kinderen` as an audience/content bucket in preference to a series type. If “Series vanavond” means scripted series without an age exclusion, the conservative mapping misses another **96** true series broadcasts.

Expanded reviewed metric:

- explicit-series true positives: 105
- boundary true-series false negatives outside the explicit mapping: 8
- children's scripted-series false negatives: 96
- reviewed true series total: 209
- precision remains **100%**
- recall becomes **105 / 209 = 50.2%**

This is a product-semantic warning as well as a data warning. Product must decide whether children's scripted series belong in “Series vanavond”; a provider genre should not accidentally make that decision.

### Repeat filter

There is no empirical basis for excluding `isRepeat === true` in Series today:

- 0 of 1,114 evening rows exposed true;
- 1,114 exposed undefined;
- metadata completeness is therefore 0% for distinguishing repeated from non-repeated programmes.

Even if `true` is positive evidence when it appears, applying a Series exclusion on this source would create asymmetric behaviour based on sparse provider tagging rather than a trustworthy “new episode” contract.

**Recommendation: do not exclude Series on repeat status in v1 unless a future classification/enrichment source makes repeat/first-run status materially complete and independently validated.**

### Series decision

**GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**

## 8. Sport results

All nine sport-labelled after-19 broadcasts were reviewed.

| Programme id | Day | Title | Canonical genre | Best supported subtype | Live/repeat evidence |
| --- | --- | --- | --- | --- | --- |
| programme-0ir7tf4080rpnq | 2026-09-24 | Andere Tijden Sport | Sport | historical sport documentary/magazine | canonical live/repeat unknown |
| programme-1djisms11ev3je | 2026-09-24 | NOS Voetbal | Sporttalkshow | pre-match talk | unknown |
| programme-1dk937u1u931jq | 2026-09-24 | UEFA Nations League Soccer | Sport | full event broadcast | live status unknown |
| programme-1n1fj5k1ea60ba | 2026-09-24 | NOS Voetbal | Sporttalkshow | post-match talk | unknown |
| programme-0whfxga1clugns | 2026-09-24 | Andere Tijden Sport | Sport | historical sport documentary/magazine | canonical repeat unknown; official source marks rerun |
| programme-1sxy07n14s20gr | 2026-09-26 | NOS Studio Sport | Sport | highlights/summary, possibly mixed live images | unknown |
| programme-0e0m3lz0hr3mrj | 2026-09-27 | NOS Voetbal | Sporttalkshow | post-match talk | unknown |
| programme-0gyquig0vmi7ag | 2026-09-27 | UCI Road World Championships | Sport | full event broadcast | live status unknown |
| programme-0xayxq60vnvyjs | 2026-09-27 | Andere Tijden Sport | Sport | historical sport documentary/magazine | canonical repeat unknown; official source identifies rerun series |

### What current canonical data can and cannot distinguish

It can distinguish:

- explicit `Sporttalkshow` from `Sport`.

It cannot reliably distinguish inside `Sport`:

- live event vs delayed/full-event broadcast;
- event vs highlights/summary;
- event vs historical sport documentary/magazine;
- first-run vs repeat.

If the intended first-release Sport module is:

> full sporting events plus useful same-day highlights/summaries; exclude pre/post talk and historical magazine/documentary

then exact `genre === 'Sport'` produces in this sample:

- 3 useful inclusions: 2 full events + 1 Studio Sport summary/mixed programme;
- 3 false positives: `Andere Tijden Sport`;
- precision: **3 / 6 = 50%**;
- recall within the reviewed sport-labelled event/highlights universe: 100%;
- sample size: 9 sport-labelled rows;
- live-event recall cannot be measured because canonical live status is unknown for every row.

A broader rule `Sport OR Sporttalkshow` would classify all nine as “sport-related”, but that would avoid the data problem by weakening the product meaning. It would knowingly include pre/post talk and historical reruns and is not recommended merely to improve a metric.

### Defensible Sport product contract

For a premium finite Vanavond module, the data supports this target contract for future enrichment:

Include:

- full sporting event broadcasts, whether proven live or not;
- high-confidence same-day highlights/summary programmes.

Do not exclude an event solely because live status is unknown.

Exclude by default:

- pre/post-match talk;
- general sport talkshows;
- historical sport documentary/magazine;
- other sport-adjacent factual programming.

Repeat semantics:

- an explicit repeat is not automatically disqualifying for a full event if Product later wants replayed events;
- however “repeat” must remain a tri-state property (`repeat | not_repeat | unknown`) and cannot be inferred from absence;
- v1 should not claim “live” unless high-confidence positive evidence exists.

### Sport decision

**GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**

## 9. Nightly module volumes

These are **candidate volumes**, not a recommendation to ship the raw mappings.

### Conservative raw mappings

- Film: exact `Film`;
- Series: exact `Dramaseries | Misdaaddrama | Sitcoms`;
- Sport: `Sport | Sporttalkshow` to show the full current sport-related taxonomy footprint.

| Day | Film | Series | Sport-related |
| --- | ---: | ---: | ---: |
| 2026-09-21 | 4 | 14 | 0 |
| 2026-09-22 | 2 | 11 | 0 |
| 2026-09-23 | 6 | 13 | 0 |
| 2026-09-24 | 5 | 14 | 5 |
| 2026-09-25 | 4 | 12 | 0 |
| 2026-09-26 | 4 | 15 | 1 |
| 2026-09-27 | 3 | 11 | 3 |
| 2026-09-28 | 4 | 15 | 0 |

Distribution:

| Module | Total | Min | Median | p95* | Max | 0 nights | 1–2 | 3–5 | >5 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Film exact | 32 | 2 | 4 | 6 | 6 | 0 | 1 | 6 | 1 |
| Series explicit | 105 | 11 | 13.5 | 15 | 15 | 0 | 0 | 0 | 8 |
| Sport-related | 9 | 0 | 0 | 5 | 5 | 5 | 1 | 2 | 0 |

* nearest-rank p95 over eight observed nights.

### Manually corrected lower-bound volumes

Film after adding only the manually proven `Drama` films:

- by night: **4, 4, 7, 6, 4, 6, 6, 4**
- total: 41
- min 4 / median 5 / p95 7 / max 7.

Focused adult-scripted Series after adding the eight manually proven boundary series:

- by night: **15, 12, 13, 14, 14, 17, 12, 16**
- total: 113.

If children's scripted series are in scope, reviewed Series volume becomes:

- **27, 24, 25, 26, 26, 29, 24, 28**
- total: 209.

This spread is important for Design: Films naturally fit a small carousel; Series is intrinsically much denser and needs a deliberate product scope before Design can treat it as a finite premium module; Sport is often absent and must support module omission.

### Candidate distribution by channel

Film exact:

- RTL 7: 15
- Veronica / Disney XD: 8
- SBS9: 8
- RTL 8: 1

Series explicit:

- RTL 8: 40
- Veronica / Disney XD: 26
- Net5: 22
- SBS9: 6
- RTL 4: 5
- NPO 3: 3
- NPO 2: 2
- NPO 1: 1

Sport-related:

- NPO 3: 7
- NPO 1: 2

The current modules would therefore be strongly channel-skewed; this is observed schedule composition, not a reason to invent balancing/ranking.

## 10. False positives, false negatives and ambiguity

### Film

False positives for exact `Film` in review: **0**.

False negatives proven: **9 rows** under `Drama`.

Failure mode: provider's first category expresses dramatic genre rather than film content type.

### Series

False positives for the conservative explicit series mapping in the focused review: **0**.

False negatives:

- 8 adult-scripted boundary rows under `Komedie`, `Mysterie`, `Misdaad`;
- a further 96 scripted children's series rows under `Kinderen` if age is not a product exclusion.

Failure mode: `genre` mixes content type with subgenre/audience.

Ambiguity:

- “Series” is not yet semantically explicit about children's animation or other age buckets;
- reality/factual formats frequently carry season/episode notation, so `Sx Ex` is not sufficient proof of a Series-module item;
- season/episode text should not become a client-side parser heuristic.

### Sport

False positives for exact `Sport` under the proposed event+same-day-highlights contract: **3 / 6**, all `Andere Tijden Sport`.

Ambiguity:

- `NOS Studio Sport` explicitly says “livebeelden en/of samenvattingen”, so even the description does not establish one stable live subtype;
- UEFA/WK event descriptions say “verslag”, but canonical `isLive` is unknown;
- official external schedule evidence can identify `Andere Tijden Sport` reruns while canonical repeat remains unknown.

## 11. Precision / recall summary

| Proposed direct rule | Precision | Recall / coverage | Review scope | Gate |
| --- | ---: | ---: | --- | --- |
| Film = exact `Film` | **100%** | **78.0%** | 41 reviewed film/boundary rows | recall FAIL |
| Series = `Dramaseries|Misdaaddrama|Sitcoms` | **100%** | **92.9%** | focused 130-row adult-scripted universe | conditional PASS only |
| Same Series rule, unqualified scripted series incl. `Kinderen` | **100%** | **50.2%** | expanded reviewed universe | recall FAIL |
| Sport = exact `Sport`, target event + same-day highlights | **50%** | 100% within sport-labelled target rows; live recall unmeasurable | all 9 sport-labelled rows | precision FAIL |

The Series focused number must not be promoted to a production claim: the full inventory itself demonstrates a major content-type collision under `Kinderen`.

## 12. Required central classification/enrichment contract

### Architectural recommendation

Introduce, in a future implementation increment, **one centralized provider-independent programme-classification enrichment** on the server/canonical-data side.

Do not place it in Vanavond presentation code and do not make it a second programme identity.

A suitable conceptual output is a sibling classification keyed by canonical `Programme.id`, for example:

- `contentType: film | series | sport | other | unknown`;
- for sport only: `sportKind: event | highlights | magazine | talk | other | unknown`;
- `liveStatus: live | not_live | unknown`;
- `repeatStatus: repeat | not_repeat | unknown`;
- optional confidence/provenance for diagnostics, not presentation ranking.

The exact storage/transport shape is intentionally **not** frozen by this research.

### Inputs the classifier/enrichment should be able to use

Prefer structured upstream evidence over text heuristics:

1. the **full source category set**, not only the first category;
2. explicit provider live markers;
3. explicit provider repeat/previously-shown markers;
4. any authorized provider content-type / programme-kind / series identity available at the provider boundary;
5. canonical title/subtitle/description as secondary evidence only when rules are deterministic and testable;
6. canonical channel/time context only where it materially disambiguates, not as a hidden ranking signal.

### Provider independence

Provider-specific labels may be interpreted only inside the provider adapter/classification boundary.

Mobile/Vanavond should receive Teevee semantics such as `film`, `series`, `sport:event`; it should not know that the current temporary provider used `Dramaseries`, `Mysterie` or any future supplier vocabulary.

A future provider swap should require replacing mapping evidence, not changing Vanavond UI rules.

### Fail-closed rules

- unknown classification -> omit from the category module;
- generic `Drama` alone -> not enough to declare Film;
- generic `Komedie`, `Mysterie`, `Misdaad`, `Kinderen` alone -> not enough to declare Series;
- `Sport` alone -> not enough to declare an event;
- missing live flag -> `unknown`, never `not_live`;
- missing repeat flag -> `unknown`, never `not_repeat`;
- no title-specific production exceptions solely to hit a metric.

## 13. Consequences for the Vanavond Product Definition

The overall Vanavond hierarchy does not need to be reopened.

The research supports the existing frozen principle that Films/Series/Sport are individually gated by data quality and that weak heuristics must not be shipped.

Required clarification before Series implementation:

- define whether `Series vanavond` means **scripted series of all ages** or a narrower adult/mainstream scripted-series scope;
- do not let the temporary provider's `Kinderen` category make that product decision implicitly.

Recommended frozen Sport semantics for the next product/implementation handoff:

- include full sporting events regardless of whether current live status can be proven;
- include high-confidence same-day highlights/summary;
- exclude sport talk/pre-post shows and historical sport magazine/documentary by default;
- do not advertise “live” without positive high-confidence evidence.

Series repeat filtering should remain **off** until repeat metadata is complete enough to support it.

Film repeats remain allowed as already defined.

## 14. Design / UX handoff

Design can proceed conceptually with the following measured constraints, but production category modules remain blocked on classification enrichment:

- **Films:** expect roughly 4–7 real film broadcasts per observed evening after correcting the proven `Drama` misses. A compact chronological carousel is plausible.
- **Series:** even the conservative explicit mapping produces 11–15 items nightly; focused reviewed adult-scripted volume reaches 12–17. Design should not assume a 3–5 item module. If all-age scripted series are in scope, volume rises to 24–29 per night in this sample and Product must resolve scope before visual convergence.
- **Sport:** 5/8 observed evenings had zero sport-related rows after 19:00; module omission is a normal state. On event nights, related content clusters around the event and can include pre/post programming that should not automatically enter the module.
- module ordering stays chronological; this research does not introduce ranking;
- no visual treatment should expose raw provider genre or uncertain live/repeat status.

## 15. Open questions

1. Does “Series vanavond” intentionally include children's scripted series such as `Bluey` and `Marvel's Spidey and His Amazing Friends`, or is the product scope narrower?
2. Which structured classification fields are available from the eventual authorized production EPG provider, especially full category sets, content type, series identity, live and repeat/first-run?
3. Should sport replays of full events be included when a reliable repeat signal becomes available?
4. Is “highlights/summary” always desirable in Sport, or only when tied to a same-evening event?
5. D+6/D+7 remain unavailable with the temporary provider at this capture. Re-run this research against the eventual production provider before final release acceptance, because classification quality and product-horizon sufficiency are separate release gates.

## 16. Research limitations

- Eight authoritative television days were available, not ten; D+6/D+7 were correctly unavailable.
- The provider is the temporary development XMLTV source, not the eventual rights-cleared production EPG.
- Precision/recall figures are empirical for the explicitly documented review universes; they are not statistical guarantees for every future programme.
- The canonical field only preserves the first provider category, so canonical-only research cannot measure how often useful secondary XMLTV categories were discarded.
- `isLive` and `isRepeat` were entirely undefined in the observed evening population, preventing any direct live/repeat recall estimate.
- External sources were used only to adjudicate specific manual boundary cases, never as the programme population or runtime classification source.

## 17. Final gate

**Film — GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**

**Serie — GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**

**Sport — GO WITH CENTRAL CLASSIFICATION MAPPING/ENRICHMENT**

This research authorizes a **separate future classification/enrichment design + implementation increment**. It does not authorize Vanavond category UI/runtime implementation directly from the current `Programme.genre`, `isLive` or `isRepeat` fields.
