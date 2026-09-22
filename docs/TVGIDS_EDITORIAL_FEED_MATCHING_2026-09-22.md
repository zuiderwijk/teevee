# TVgids editorial feed -> Teevee programme matching research

Status: empirical research complete, 2026-09-22 (PR #120).  
Scope: technical suitability of public TVgids.nl editorial RSS surfaces for programme-level enrichment in Teevee. This does **not** change the production EPG/provider-rights decision.

## Executive conclusion

Use `https://www.tvgids.nl/tips.rss` as the only candidate source that may directly create a Teevee `kijktip` editorial signal.

The category news feeds are useful as supporting editorial-content sources, but they must **not** be interpreted as programme tips merely because an article mentions a programme. They are heterogeneous article feeds and may map one-to-zero, one-to-one or one-to-many to Guide broadcasts.

The strongest TVgids source identity discovered is the public broadcast URL form:

`/.../<programme-slug>/lineair/<numeric-id>`

The public `/tips` surface links individual tips to these broadcast-specific URLs. Examples observed on 2026-09-22 include:
- `/amusement/b-b-vol-liefde/lineair/217678602`
- `/serie/after-the-flood/lineair/217681342`
- `/film/the-outpost/lineair/217679592`

Multiple occurrences of the same programme can have different `lineair` IDs, so this behaves as a broadcast-level source identifier rather than merely a programme-title identifier.

PR #120 captured the raw feed in GitHub Actions and verified the actual per-item schema. `tips.rss` contains 100 current items and exposes `title`, `link`, `description`, `pubDate`, `start`, `end`, `guid`, `enclosure`, `category`, `channel_name` and `channel_icon`. It does **not** expose a `lineair/<id>` in the RSS item fields observed on 2026-09-22. Matching therefore cannot depend on a TVgids broadcast ID unless a future authorized source adds one.

## Relevant Teevee constraints

Canonical Teevee `Programme` is intentionally provider-independent:

- `id`
- `channelId`
- `startAt`
- `endAt`
- `title`
- optional `subtitle`, `description`, `genre`, `isLive`, `isRepeat`

External provider IDs exist only behind the server ingestion boundary as `ExternalProgramme.id`. Canonical `Programme.id` is generated from provider namespace, canonical channel, external programme identity and broadcast start.

Consequences:
- RSS must never be consumed directly by the mobile Guide;
- editorial matching belongs server-side;
- provider/source identity must not leak into the mobile core EPG model;
- an editorial signal should resolve to canonical `Programme.id`.

## Feed suitability

| Source | Logical record | Broadcast relationship | Kijktip suitability |
| --- | --- | --- | --- |
| `tips.rss` / `/tips` | one editorial tip | intended to represent one specific linear broadcast | **Primary candidate** |
| `nieuws/televisie/nieuws.rss` | one news/editorial article | often none; the daily “Vanavond op TV” article contains multiple broadcasts | supporting/fallback only |
| `nieuws/film/nieuws.rss` | one film article | may describe one scheduled film, evergreen film content or streaming | do not auto-promote |
| `nieuws/serie/nieuws.rss` | one series article | may describe an episode, season, streaming release or general news | do not auto-promote |
| `nieuws/sport/nieuws.rss` | one sports article | frequently schedule roundups or stories spanning multiple events | do not auto-promote |
| `nieuws.rss` | aggregate article feed | mixed | unsuitable for direct programme labels |

### Television feed

The daily `Vanavond op TV` article is structurally interesting because its rendered article contains repeated blocks with:
- programme title;
- channel;
- start and end time;
- editorial teaser;
- programme-detail CTA.

That makes the article parseable into several programme candidates, but the RSS item itself represents the **article**, not one broadcast. It is therefore a one-to-many source and should not be joined directly to one `Programme`.

It also substantially overlaps the dedicated tip surface, so using it as a second independent Kijktip source would create duplicates and conflicting lifecycle semantics.

### Film / series feeds

These categories contain both schedule-driven articles and non-schedule content. A programme title in an article title is insufficient evidence that the article applies to a specific current broadcast.

A linear label may only be created when a concrete broadcast reference can be extracted from the article: preferably a `lineair/<id>` link, otherwise channel + scheduled time + title.

### Sport feed

Sport has the weakest one-item/one-broadcast assumption. Articles can cover:
- a complete matchday;
- a weekly football schedule;
- an event timetable;
- results;
- a competition or participant;
- one specific live broadcast.

Treat sport articles as editorial content until concrete broadcast references are extracted.

## Matching contract

Matching is deterministic and fail-closed. Ambiguous or insufficiently supported items produce no Guide label.

### Tier A — exact source broadcast identity

Highest confidence when a future authorized TVgids/Bindinc source exposes a stable broadcast identifier that can be resolved server-side to canonical `Programme.id`.

The live `tips.rss` capture on 2026-09-22 exposed **no** `lineair/<id>` in any of its 100 items, so this tier is not available from the current RSS feed.

### Tier B — strong broadcast tuple

Use:
1. explicit mapping from RSS `channel_name` to canonical Teevee channel identity;
2. deliberately small normalized-title equality;
3. RSS `start` within **±5 minutes** of canonical `startAt`;
4. exactly one canonical candidate.

The ±5-minute tolerance is empirically justified. Valid observed tips differed from the canonical development EPG by 1–5 minutes, including `Race Across the World` (+1), `The Commuter` (+2), `The Grey` (+3), `The Hangover Part II` (+4) and `Oblivion` (+5).

Do not require exact end time. RSS `end` is corroborating/lifecycle data because schedule revisions can change duration.

### Tier C — exact-start constrained fallback

Use only when Tier B fails on title while:
- the channel is explicitly mapped;
- RSS `start` equals one canonical programme start instant on that channel;
- exactly one canonical programme starts there.

Keep the title mismatch as a diagnostic. Do **not** learn or generalize title aliases automatically from one observation.

This fallback is supported by the empirical failures: all 10 title-mismatch items had a same-channel canonical programme at the exact RSS start instant.

### Reject / no label

Produce no Kijktip signal when:
- source data is invalid;
- the channel is not mapped;
- canonical schedule coverage for the broadcast is unavailable;
- more than one candidate survives a confidence tier;
- title mismatch and start drift occur together;
- no deterministic candidate exists.

False negatives are preferred over false-positive editorial labels.

### Never match automatically on

- title alone;
- article publication timestamp;
- genre;
- slug alone;
- description semantic similarity;
- fuzzy/AI similarity;
- nearest programme in time;
- first search result for a programme name.

Repeated broadcasts, reruns, naming translations and generic sports titles make these unsafe.

## Title normalization

Keep normalization deliberately small:
- trim;
- Unicode-normalize;
- lowercase for comparison;
- collapse whitespace;
- normalize typographic apostrophes/dashes;
- ignore surrounding punctuation.

Do not strip episode numbers, season markers or arbitrary suffixes unless real mismatch evidence requires it. Over-normalization increases false positives.

## Minimal production data contract

The current RSS already exposes the minimum source fields required for deterministic matching:

```ts
type TvgidsTipSourceItem = {
  sourceItemId: string;  // canonical GUID; link fallback
  sourceUrl: string;
  title: string;
  channelName: string;   // RSS channel_name
  startAt: string;       // parsed from RSS start
  endAt: string;         // parsed from RSS end; corroboration/lifecycle
  publishedAt?: string;
};
```

Production ingestion requirements:
- fetch and parse server-side; the mobile client never consumes TVgids RSS directly;
- honor the feed-declared character encoding before XML parsing;
- map `channelName` explicitly to canonical Teevee channel identity;
- validate timestamps and convert them to canonical instants;
- resolve to canonical `Programme.id` with the confidence rules above;
- unresolved items produce no Guide label;
- record the match method and failure reason for diagnostics.

`category`, `channel_icon`, `enclosure` and `description` are not required for broadcast matching.

Do not add `isKijktip` to the provider/core EPG identity model. The minimal resolved enrichment is:

```ts
type ProgrammeEditorialSignal = {
  programmeId: Programme['id'];
  type: 'kijktip';
  source: 'tvgids';
  sourceItemId: string;
  sourceUrl?: string;
  publishedAt?: string;
  matchedBy: 'source-id' | 'channel-title-start' | 'channel-exact-start';
};
```

Do not generalize this into a broad recommendation/content platform before a real second signal type exists.

## Deduplication

Use stable source identity first:
- `tvgids:lineair:<id>` when available;
- otherwise canonicalized RSS item URL/GUID plus resolved `Programme.id`.

The same programme appearing in `tips.rss` and a “Vanavond op TV” article must still result in one `kijktip` signal.

## Production diagnostics

Record at minimum:
- feed items received;
- source broadcast IDs extracted, if a future source exposes them;
- exact source-ID matches;
- channel-title-start matches;
- channel-exact-start fallback matches;
- ambiguous matches;
- title mismatches;
- unsupported channels;
- items outside canonical schedule coverage;
- invalid/undecodable items;
- duplicates;
- unmatched items.

Keep representative failures as deterministic fixtures/tests before broadening any matching rule.

## Empirical closeout — PR #120

PR #120 used a temporary GitHub Actions probe to compare the live `tips.rss` feed with the public canonical Teevee Guide schedule. The probe was removed after evidence capture; no production UI/runtime implementation remains in the PR.

### Observed RSS contract

Live capture on 2026-09-22:
- HTTP 200;
- content type `application/rss+xml; charset=ISO-8859-1`;
- **100** current items;
- per-item elements: `title`, `link`, `description`, `pubDate`, `start`, `end`, `guid`, `enclosure`, `category`, `channel_name`, `channel_icon`;
- items exposing `lineair/<id>`: **0 / 100**.

The declared ISO-8859-1 encoding matters. The temporary Node probe decoded one non-ASCII title as mojibake (`Dwars door de Pyreneeën`), proving that production ingestion must decode the response bytes using the declared charset before parsing XML.

### Canonical comparison population

The probe observed **3,791** canonical programmes across the current 12-channel development catalog.

Of the 100 RSS tips:
- **15** were outside the canonical schedule coverage available to the development provider;
- **19** were on channels outside the deliberately narrow 12-channel development catalog;
- **66** therefore had both canonical time coverage and a mapped canonical channel.

The 34 excluded items are development-provider/catalog limitations, not matching failures.

### Match rate

With Tier B only — mapped channel + normalized exact title + start within ±5 minutes + exactly one candidate:
- **56 / 66 eligible items matched = 84.85%**;
- **0 ambiguous matches**;
- **10 title mismatches**.

Thus the directly measured end-to-end result was 56/100 feed items, but the matching-quality rate on items Teevee could actually evaluate was **84.85%**.

Every one of the 10 title-mismatch items had a same-channel canonical programme at the **exact RSS start instant**, so the constrained Tier C exact-start fallback would recover the observed residual set without fuzzy/AI matching.

### Observed failure modes

The 10 title mismatches were caused by:
- translation/provider naming differences: `Invasie` ↔ `Invasion`, `Bestemming X` ↔ `Destination X`;
- provider-generic sports naming: fixture-specific `UEFA Nations League: …` ↔ `UEFA Nations League Soccer`, and `Sport - Wielrennen: WK in Montréal` ↔ `UCI Road World Championships`;
- programme naming variants: `Altijd in de buurt` ↔ `In de Buurt`, `Studio sport live` ↔ `NOS Studio Sport Live`, `Criminal minds: Evolution` ↔ `Criminal Minds`, and `vtwonen weer verliefd op je huis` ↔ `VTWonen: Weer verliefd op je huis`;
- one character-decoding failure caused by the temporary probe not honoring the RSS ISO-8859-1 charset.

No empirical evidence required title fuzzing, semantic similarity or AI matching.

### Research conclusion

The current `tips.rss` feed is technically sufficient for a conservative programme-level Kijktip enrichment because it directly supplies **title + channel + broadcast start/end**. Exact TVgids broadcast identity would be preferable if an authorized future source exposes it, but it is not required for a viable deterministic match.

The production matcher should therefore use:
1. exact source broadcast identity when available;
2. otherwise channel + normalized title + start ±5 minutes, unique candidate;
3. otherwise channel + exact start, unique candidate, with title mismatch diagnostic;
4. otherwise no Kijktip signal.

This closes the empirical matching question. PR #120 itself did not establish usage rights. The product owner has since confirmed that the intended Teevee Kijktip use of `https://www.tvgids.nl/tips.rss` is rights-cleared, so rights for this editorial source are **not a Kijktip release blocker**. This does not select or clear the eventual production EPG provider and does not change the separate licensing/redistribution-rights gates for production schedule data, channel logos or programme artwork.

## Product semantics

A TVgids news article mentioning a broadcast is not automatically a Teevee `Kijktip`.

For the first Teevee implementation, `Kijktip` should mean an explicit TVgids editorial tip signal. Broader news/content relevance can be explored later as a separate signal if the product needs it.
