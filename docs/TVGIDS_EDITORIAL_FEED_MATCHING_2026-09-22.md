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

Matching should be deterministic and conservative. Ambiguous items produce no Guide label.

### Tier A — exact source broadcast identity

Preferred when the RSS item or linked content exposes a TVgids `lineair/<id>`.

Resolve:

`source = tvgids + lineairId -> canonical Programme.id`

For a future authorized TVgids/Bindinc EPG provider this source identity may be retained at the server boundary or through a small source-alias relation.

With the current development XMLTV provider, TVgids `lineair` IDs are not available in the canonical Guide. A temporary resolver therefore still needs programme metadata to join the source identity to the current canonical broadcast.

### Tier B — strong broadcast tuple

Use when no exact source alias is available:

1. explicit canonical channel mapping;
2. normalized programme title;
3. scheduled start near the canonical start;
4. require exactly one candidate.

Recommended initial tolerance: start within **5 minutes**. Do not require exact end time.

Reason: editorial pages and the current Guide can drift by a minute after schedule revisions. On 2026-09-22, the daily article rendered `Race Across the World` as 20:31–21:59 while the programme page/search surface showed 20:30–22:00. Exact minute equality would incorrectly drop such a tip.

End time is useful as corroboration, not the primary key.

### Tier C — constrained fallback

Only when channel is unavailable:
- normalized title;
- near-exact start;
- exactly one candidate across the bounded television-day schedule.

If more than one candidate remains, reject.

### Never match automatically on

- title alone;
- article publication timestamp;
- genre;
- slug alone;
- description semantic similarity alone;
- first search result for a programme name.

Repeated broadcasts, reruns and same-title programmes make these unsafe.

## Title normalization

Keep normalization deliberately small:
- trim;
- Unicode-normalize;
- lowercase for comparison;
- collapse whitespace;
- normalize typographic apostrophes/dashes;
- ignore surrounding punctuation.

Do not strip episode numbers, season markers or arbitrary suffixes unless real mismatch evidence requires it. Over-normalization increases false positives.

## Proposed enrichment shape

Do not add `isKijktip` directly to the core provider model.

A small server/domain enrichment record is sufficient:

```ts
type ProgrammeEditorialSignal = {
  programmeId: Programme['id'];
  type: 'kijktip';
  source: 'tvgids';
  sourceItemId: string;
  sourceUrl?: string;
  publishedAt?: string;
  matchedBy: 'source-id' | 'channel-title-start';
};
```

The Guide can later consume a merged programme presentation model without making editorial content part of EPG identity.

Do not generalize this into a broad recommendation/content platform before a real second signal type exists.

## Deduplication

Use stable source identity first:
- `tvgids:lineair:<id>` when available;
- otherwise canonicalized RSS item URL/GUID plus resolved `Programme.id`.

The same programme appearing in `tips.rss` and a “Vanavond op TV” article must still result in one `kijktip` signal.

## Diagnostics required for a spike

Record counts for:
- feed items received;
- exact `lineair` IDs extracted;
- exact source-ID matches;
- tuple matches;
- ambiguous matches;
- unmatched items;
- duplicates;
- items outside the Teevee Guide horizon.

Keep example failures in tests/fixtures; do not silently broaden matching until the failure pattern is understood.

## First implementation spike

Before building production ingestion:

1. capture a raw current `tips.rss` payload server-side;
2. document the actual XML elements per item;
3. verify whether `<link>`, `<guid>` or another element contains `/lineair/<id>`;
4. collect roughly 20–50 current tip items;
5. compare them against the same bounded canonical Teevee schedules;
6. report exact-ID / tuple / ambiguous / unmatched rates;
7. only then select the persistence/API shape.

Success criterion: a deterministic match rate high enough that ambiguous items can safely be omitted instead of requiring fuzzy/AI matching.

## Product semantics

A TVgids news article mentioning a broadcast is not automatically a Teevee `Kijktip`.

For the first Teevee implementation, `Kijktip` should mean an explicit TVgids editorial tip signal. Broader news/content relevance can be explored later as a separate signal if the product needs it.
