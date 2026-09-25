# ADR 0013 — Local canonical channel personalisation projection

Status: **Accepted candidate in Issue #170 / PR #173; canonical on merge**  
Date: 2026-09-24

## Context

Teevee needs one shared `Mijn zenders` selection/order across Totaal, Per zender and Nu & Straks while Search must continue to address the complete supported channel catalogue. The next production increment will expand the catalogue from the current 12 channels to the approved 49-channel set.

Storing only selected IDs is insufficient. An ID absent from selection could mean either "the user deliberately hid this known channel" or "this channel did not exist when the preference was saved". Those meanings require different reconciliation when the canonical catalogue grows.

## Decision

Channel personalisation is local user preference state in the existing app-preferences infrastructure.

The durable preference stores both:

- every canonical channel ID already known to that preference;
- visible selected canonical IDs in explicit user order.

The canonical catalogue remains provider-independent domain data. Personalisation is a projection over that catalogue, not a mutation of canonical schedule/channel identity.

Catalogue reconciliation:

- preserves selected relative user order;
- treats `current canonical ID not in previous known IDs` as genuinely new;
- automatically selects genuinely new IDs and appends them in canonical order;
- retains previously known-but-unselected IDs as hidden;
- removes obsolete IDs;
- repairs duplicates;
- guarantees product-safe non-empty personalised output.

All Guide presentations consume the same projection boundary. Search ignores that visibility projection and remains full-catalog. Search navigation to a hidden channel may inject that exact ID as transient Per-zender context, but only an explicit add action mutates persistence.

Synthetic fixture IDs are never canonical catalogue history.

## Consequences

The later 49-channel expansion does not need a preference migration or Guide-specific reorder logic; it updates the canonical catalogue and the existing reconciliation appends the genuinely new IDs.

The app does not require accounts, server-side profiles, a database table, a new state-management library or persistent schedule cache for this capability.

The accepted management presentation is a two-zone surface: visible channels are reordered by handle-only drag while hidden channels remain in canonical/default order and are not reorderable. Drag changes presentation state provisionally and commits one arbitrary-index canonical-ID move only after a changed-position drop. Accessibility retains explicit one-step move actions, so reorder remains operable without drag. This presentation does not alter the persisted known-vs-selected model or shared Guide projection.

Search alias handling remains a finite provider-independent mapping at the shared Search domain/API boundary. It is not provider-ID logic and does not authorize fuzzy/semantic Search.
