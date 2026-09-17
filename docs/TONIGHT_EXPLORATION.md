# Tonight / personalisation exploration

Status: **EXPLORATION — NOT ACCEPTED PRODUCT SCOPE OR IMPLEMENTATION REQUIREMENT**

Owner alignment: 2026-09-17. The concepts below are worth preserving and exploring beyond the MVP, but they do **not** replace the accepted product/UX baseline in `docs/PRODUCT.md`, `docs/UX.md` or `design/current/`.

## Product role under exploration

The working role for `Vanavond` / Tonight is not "another guide" and not an editorial feed. It is a calm decision layer on top of the EPG:

> **Guide tells you what is on television. Tonight helps you choose. Teevee can gradually learn what is worth showing to you.**

The long-term opportunity is to let this evolve into a lightweight personal television planner such as `Mijn TV-avond`, without turning Teevee into an engagement feed or streaming catalogue.

## Candidate Tonight modules

### Voor jou vanavond
Show tonight's broadcasts for programmes the user previously saved.

- Treat this as a personal guide, not as a generic recommendation carousel.
- This module can become the foundation for a future `Mijn TV-avond` concept.
- Preserve normal broadcast facts: time, channel and programme identity remain primary.

### 5 kijktips
Show a maximum of five concise inspirational picks for the evening.

- No editorial article copy is required.
- The module should inspire quickly rather than create another content feed.
- The system may improve its selection over time using aggregate interaction signals such as opens/clicks, saves and reminders.
- Any short explanation should be factual and compact, for example `Nieuwe aflevering`, `Live` or `Omdat je ... bewaart`.

### Omdat je dit leuk vindt
Use programmes the user explicitly liked as taste signals and show relevant broadcasts that air tonight.

- Deliberately exclude repeats from this personalised recommendation module.
- `Bewaar` and `Vind ik leuk` should remain semantically distinct:
  - `Bewaar`: explicit utility intent — keep/follow this programme.
  - `Vind ik leuk`: taste signal — show me more things like this.
- A like does not have to become prominent Guide chrome; Programme Detail is a more natural future surface for the action.

### Top 3 films / series / sport
Show three high-confidence picks per category when the evening has enough qualifying programmes.

Important distinction:

- `Top 3 vanavond` is a **general ranking** for everyone.
- `Voor jou` is **personalised**.

Do not label three arbitrarily chosen items as `Top 3`. The ranking must be explainable, reproducible and defensible.

Candidate ranking inputs, with category-specific weighting to be researched before implementation:

- content quality / trustworthy external ratings where legally and technically available;
- first-run / new-episode / premiere status;
- live status for sport;
- event significance and Dutch relevance for sport;
- broad audience interest / popularity;
- Teevee aggregate engagement such as opens, saves and reminders once sufficient data exists;
- channel reach may be an input, but should not automatically make a weaker programme rank above a stronger one.

Cold start should be deterministic and rules-based rather than pretending there is already enough Teevee behavioural data. Machine-learning or AI recommendations are not required to make these modules useful.

### Talkshows vanavond
Provide a functional chronological overview of evening talkshows.

- Ranking is unnecessary; completeness and timing are more useful.
- Show guest/topic metadata only when reliably available.

### Wat heb ik vanavond gemist?
After programmes have aired, surface a very small set of notable broadcasts from earlier that evening.

Eligibility should be deliberately strict so this does not become a generic catch-up guide:

- programme has already aired tonight;
- exclude repeats;
- programme is on a major channel **or** has demonstrably high popularity/relevance;
- programme type is suitable for catch-up;
- keep the result compact, roughly 3–5 items rather than a complete archive.

The intended feeling is closer to "these were the notable things from tonight" than "everything that has already been broadcast".

## Adjacent settings / personalisation concepts

### User-defined Primetime
Allow the user to define what `Primetime` means to them, for example 20:00, 20:30 or 21:00.

- The current accepted baseline remains fixed at 20:30 until this future feature is explicitly promoted.
- If implemented later, the chosen time must have one consistent meaning everywhere the Primetime shortcut appears.
- Primetime still operates on the selected television day; customising the clock time must not reintroduce calendar-day ambiguity.

### Manage saved and liked programmes
Provide one secondary-management surface where the user can review and undo saved/liked choices.

- This belongs naturally under secondary navigation/settings unless usage evidence later justifies a permanent primary tab.
- Saved and liked state should remain easy to undo.
- Core Guide use must remain possible without a mandatory account; any future synchronisation model should preserve that product principle.

## Product constraints to preserve

Any future implementation should continue to respect the existing Teevee principles:

- Guide remains primary.
- Calm over engagement; no infinite recommendation feed.
- No advertising.
- Personal without unnecessary complexity.
- No mandatory account for core use.
- Recommendations should help the user make a television decision, not maximise session length.
- Tonight should stay rooted in actual scheduled television broadcasts rather than expand into a full streaming catalogue.

## Open questions before promotion

1. Which exact definition and metadata source makes each `Top 3` category defensible?
2. How should external quality signals be licensed, normalised and combined with Teevee behaviour?
3. What counts as a repeat across providers and schedule metadata?
4. Which channels count as "major" for `Wat heb ik vanavond gemist?`, and when may popularity override that list?
5. How much behavioural data is required before aggregate Teevee signals influence rankings?
6. Should `Vind ik leuk` apply to a programme, series/franchise, person/team or more than one entity type?
7. What privacy/storage model supports personalisation without forcing an account?
8. When does `Voor jou vanavond` become rich enough to justify the broader `Mijn TV-avond` concept?

Until these questions are resolved and the owner explicitly promotes individual concepts, treat every module in this document as exploration only.