# TVgids.nl app Search evidence — channel discovery and personalisation

Status: **EMPIRICAL PRODUCT EVIDENCE + OWNER-APPROVED TEEVEE DIRECTION**  
Date recorded: 24 September 2026  
Source: user-provided TVgids.nl app Search statistics export `export_2026-09-24T1030.csv`

## Evidence boundary

The source export contains aggregated keyword rows with:

- `Keywords`;
- `Action Taken`;
- `Searches with Results`;
- `Searches without Result`;
- `Average Click Result`;
- `Average Results Shown`.

The CSV contains **no measurement-period/date field**. The filename establishes the export timestamp, not the period represented by the statistics. Do not call these figures YTD, monthly or daily without separate evidence.

The raw query export is deliberately **not committed** to the Teevee repository. This document retains only aggregated evidence required for product decisions. Teevee's existing privacy contract remains unchanged: raw user query text is not a default product-analytics dependency.

## Dataset summary

The export contains:

- **14,887** data rows;
- **48,523** searches;
- **42,013** searches with at least one result;
- **6,510** searches without result;
- overall no-result rate: **13.42%**;
- **13,592** distinct raw keyword strings;
- **9,443** distinct keywords occurred exactly once, or **69.47%** of unique keywords.

`Average Click Result` is exactly `0.0` in all 14,887 rows. Therefore this export cannot support claims about result CTR, selected-result quality or successful downstream navigation.

## Channel-discovery evidence

Named channels/channel families are among the highest-volume queries. Examples:

| Exact raw keyword | Searches | Without result |
| --- | ---: | ---: |
| `eurosport` | 792 | 1 |
| `espn` | 515 | 0 |
| `vrt` | 333 | 0 |
| `bbc nl` | 329 | 0 |
| `bbc 1` | 225 | 0 |
| `ziggo sport` | 219 | 0 |
| `npo 1` | 169 | 0 |
| `canvas` | 156 | 0 |
| `rtl 4` | 149 | 0 |
| `eurosport 2` | 121 | 0 |

These are descriptive query counts only. The export does not reveal whether a user searched because a channel was absent, hard to find in the Guide, remembered by name, or simply preferred Search navigation.

## Channel-overview / management intent

A narrow, exact four-query slice:

- `zenders`;
- `alle zenders`;
- `tv zenders`;
- `zenderoverzicht`;

accounts for **495 searches**, of which **469 (94.75%)** returned no result.

Breakdown:

| Raw keyword | Searches | With result | Without result |
| --- | ---: | ---: | ---: |
| `zenders` | 371 | 26 | 345 |
| `alle zenders` | 79 | 0 | 79 |
| `tv zenders` | 35 | 0 | 35 |
| `zenderoverzicht` | 10 | 0 | 10 |

Across **all 156 distinct raw keywords containing the literal substring `zender`**, the export records **702 searches**, of which **670 (95.44%)** returned no result. This larger lexical slice is not a pure personalisation metric: it also contains queries such as “welke zender …” and specific channel-number questions.

There is nevertheless direct personalisation/configuration intent in the data. The exact queries:

- `mijn zenders` — 9;
- `zenders instellen` — 3;
- `zenders toevoegen` — 2;
- `teken + zendervolgorde instellen` — 1;
- `zendervolgorde` — 1;
- `zenders indelen` — 1;

sum to **17 searches**, all without result.

A separate conservative set of 11 one-off queries explicitly describes missing/restoration problems such as “ben mijn zenderoverzicht kwijt”, “hoe krijg je zenders weer terug”, “tv zenders allemaal weg uit gids wat doen” and “waarom zie ik de zenders niet”. All 11 returned no result.

These low-frequency long-tail phrases should not be treated as a measured feature-demand percentage, but they support the interpretation that Search is sometimes being used as a recovery/help route for channel navigation.

## Deterministic alias/normalisation failures

The export also shows clear paired failures where a channel succeeds with a space but fails without it:

| Query A | Result | Query B | Result |
| --- | --- | --- | --- |
| `rtl 8` | 48 searches / 1 no-result | `rtl8` | 28 / **28 no-result** |
| `rtl z` | 74 / 0 | `rtlz` | 19 / **19** |
| `rtl 7` | 40 / 0 | `rtl7` | 14 / **14** |
| `npo 1` | 169 / 0 | `npo1` | 10 / **10** |
| `espn 1` | 109 / 0 | `espn1` | 5 / **5** |
| `vrt 1` | 19 / 0 | `vrt1` | 8 / **8** |
| `bbc nl` | 329 / 0 | `bbcnl` + `bbc.nl` | 8 / **8** |

This is strong evidence for deterministic channel alias/identity normalisation. It is **not** evidence that Teevee needs fuzzy, semantic or AI search for these cases.

## Interpretation

The export proves:

1. channel lookup is a material Search use case;
2. generic channel-overview queries are frequent enough to deserve a first-class response instead of a dead no-result state;
3. there is explicit, if smaller, evidence of users trying to find channel configuration/order functionality through Search;
4. deterministic alias handling can solve real no-result failures.

The export does **not** prove the causal hypothesis that users search for channels because they cannot find them inside a large Guide. That remains a product interpretation.

The owner considers that interpretation sufficiently plausible and aligned with Teevee's planned 49-channel expansion to adopt the following product direction.

## Owner-approved Teevee direction — Channel catalog, My Channels and Search

Teevee separates three concepts:

1. **Canonical channel catalog** — every channel Teevee supports.
2. **User channel selection** — the subset the user chooses to keep visible in their everyday Guide.
3. **User channel order** — the user's preferred order for that selected subset.

The working user-facing concept is **Mijn zenders**. Exact final microcopy and management-screen visual design may still be refined, but these semantics are canonical.

### Guide semantics

- When the user has no persisted preference, use the owner-approved default order from `docs/CHANNEL_EXPANSION_TARGET_2026-09-24.md`.
- Once the user customises channels, their persisted selection/order becomes authoritative.
- Channel selection/order is one shared preference model. Do not create independent personal channel lists for Per zender, Nu & Straks and Totaal.
- The persistent Per-zender channel-logo rail reflects the selected channels and their personal order.
- Other Guide presentations must consume the same selected set/order where channel lists/order are presented, rather than silently reintroducing hidden channels.
- Hiding a channel means “remove it from my everyday Guide”, not “delete it from Teevee”.

### Search semantics

Search is a **recovery route across the complete canonical catalog**, not only the user's visible Guide subset.

Therefore:

- a supported hidden channel remains searchable;
- finding/opening a hidden channel must **not** silently change the user's persistent selection;
- tapping a channel result may open Guide → Per zender on that channel contextually, as the existing Search contract already allows;
- when a Search result identifies a channel that is not currently selected, Search should provide a quiet, explicit path to add it to the user's channel set;
- after explicit addition, the UI may offer a path to adjust channel order;
- the personalisation affordance must not block the primary “open this channel” job.

Search thereby becomes a contextual education surface: Teevee introduces channel personalisation when the user's own query demonstrates that it is relevant, rather than relying on generic onboarding/tutorial copy.

### Generic channel-intent queries

Queries such as `zenders`, `alle zenders`, `zenderoverzicht`, `mijn zenders`, `zenders instellen`, `zenders toevoegen` and `zendervolgorde` should not terminate in an ordinary programme/channel no-match state.

A later implementation increment should provide a deterministic **channel-management/navigation result** that routes to the channel-selection/order surface.

This is bounded product navigation intent, not a general semantic-search or AI-query interpretation capability.

### Alias handling

Channel Search should own deterministic canonical aliases/normalisation such as spacing/punctuation variants (`RTL8` → RTL 8, `NPO1` → NPO 1, `RTLZ` → RTL Z) at the canonical channel-search boundary.

Do not push provider-specific aliases into mobile presentation code.

## New-channel reconciliation — owner decision

Owner decision, 24 September 2026.

When Teevee adds a genuinely **new canonical supported channel** after a user already has a customised Mijn-zenders selection/order:

- the new channel is **automatically selected/visible**;
- it is appended **after the user's current last selected channel**;
- the existing relative order of the user's channels is preserved exactly;
- existing hidden channels remain hidden and must not be resurrected merely because the catalog is reconciled;
- when multiple genuinely new channels arrive in one catalog update, append them as one block in their canonical/default catalog order.

This is deliberately additive: catalog growth should not reset or reshuffle a user's established Guide, while a newly supported channel remains discoverable in the Guide without requiring the user to know that Teevee added it.

The persistence/reconciliation design must be able to distinguish **newly introduced channel IDs** from **previously known but user-hidden channel IDs**. An implementation that stores only the selected IDs, with no way to retain the user's known/hidden state across catalog versions, is insufficient because it cannot make this distinction safely.

Whether Teevee explicitly tells the user in the UX that new channels were added is **not yet decided**. That communication may be designed later and is not required to implement the reconciliation semantics.

## What remains open

This decision intentionally does **not** freeze:

- exact management-screen visual design;
- exact “add to Mijn zenders” microcopy/iconography;
- drag-and-drop vs another reorder interaction;
- whether/how the UX communicates that newly supported channels were appended automatically;
- whether later behavioural evidence justifies additional personalisation prompts outside Search.

Those belong to the dedicated channel-personalisation implementation increment.

