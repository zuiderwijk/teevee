# Channel personalisation — Mijn zenders

Status: **MERGED AND CANONICAL — issue #170 / PR #173**
Date: 2026-09-24  
Owner: Teevee product

## Contract

Teevee distinguishes three channel concepts:

1. the complete canonical supported channel catalogue;
2. the persisted user-selected visible channel set;
3. the persisted user order of that visible set.

The Guide consumes one user-level projection over the canonical catalogue. Totaal, Per zender and Nu & Straks therefore always resolve the same selected IDs and order. The canonical channel catalogue and canonical programme/channel identity are never rewritten by personalisation.

Without a channel preference, Teevee preserves the existing canonical/default catalogue and order exactly.

## Persistence and reconciliation

Channel personalisation is local app preference state. Version 1 stores:

- `knownChannelIds`: every canonical ID already observed by this preference;
- `selectedChannelIds`: the visible IDs in user order.

Hidden channels are the set difference `knownChannelIds - selectedChannelIds`. Persisting only selected IDs is explicitly insufficient because it cannot distinguish a deliberately hidden channel from a genuinely new canonical channel.

Reconciliation is deterministic:

- selected IDs retain their existing relative user order;
- removed/obsolete IDs are discarded safely;
- duplicate persisted IDs are de-duplicated;
- genuinely new canonical IDs are automatically selected and appended after the existing selected order;
- multiple new IDs append in current canonical/default order;
- previously known but hidden IDs never reappear merely because the catalogue changes;
- a corrupt preference fails safe to the canonical default;
- a personalised state cannot persist an empty visible set; if catalogue evolution removes every selected ID, the first current canonical ID is used as product-safe recovery.

The preference schema is optional inside the existing app-preferences v1 envelope, so users without channel personalisation retain their previous behavior and appearance/Guide-presentation preferences remain independently repairable.

## Canonical catalogue ownership

`data/domain/channelCatalog.ts` owns the provider-independent app catalogue. The current development provider configuration consumes the same canonical catalogue while retaining its provider mappings separately.

The exact 49-channel production expansion is a separate next increment. It must extend the canonical catalogue and provider/data configuration without changing the reconciliation contract above.

Synthetic deterministic Guide fixtures are not canonical catalogue input. A fixture may remain visible during fixture-first/offline startup and never becomes persisted `knownChannelIds`.

## Guide projection

`features/channels/channelGuideProjection.ts` is the shared projection boundary for all Guide presentations.

It:

- orders channels by `selectedChannelIds`;
- filters programmes to those channels;
- leaves canonical schedule objects untouched;
- supports a transient contextual channel ID for Search → Per zender;
- preserves the accepted synthetic fixture fallback when canonical selected IDs do not overlap fixture IDs.

Per zender keeps the contextual Search channel in process-local view state for the active Per-zender session. That is intentionally separate from the persisted selection.

## Search bridge

Search remains full-catalog and independent from Guide visibility.

A hidden channel result:

- remains searchable;
- can open Per zender at current-time context;
- does not mutate channel preferences;
- displays a quiet hidden-state indication;
- exposes an explicit `Toevoegen` action, which is the persistence mutation.

The finite management intents are:

- `zenders`
- `alle zenders`
- `zenderoverzicht`
- `mijn zenders`
- `zenders instellen`
- `zenders toevoegen`
- `zendervolgorde`

They resolve locally to the Mijn-zenders management route and deliberately do not invoke fuzzy, semantic or AI Search.

Safe channel aliases are canonicalised at the shared provider-independent Search request boundary before hosted querying:

- `RTL8` → `RTL 8`
- `RTL7` → `RTL 7`
- `RTLZ` → `RTL Z`
- `NPO1` → `NPO 1`
- `ESPN1` → `ESPN`
- `VRT1` → `VRT 1`
- `BBCNL` / `BBC.NL` → `BBC NL`

Programme Search, D-2..D+7 horizon ownership, debounce/race semantics, exact-broadcast Programme Detail navigation and hosted Search storage remain unchanged.

## Management surface

`Mijn zenders` is a dedicated compact utility screen, reachable from Settings and management Search intents. Owner acceptance #5819111859 freezes the two-zone interaction specification in PR comment #5819090800.

The management surface has two zones:

- **Mijn zenders** contains only visible channels in persisted Guide order. Rows expose an eye control and a handle-only drag interaction. Reorder is provisional while dragging and persists exactly once after a successful changed-position drop through the arbitrary-index canonical-ID operation.
- **Verborgen zenders** contains only hidden channels in canonical/default order. Rows use a quieter eye-off treatment, never expose a drag handle, and showing a channel appends it directly after the current final visible channel.

There is no save/done flow: visibility changes and successful drops persist immediately. When only one visible channel remains, its visibility control stays present but disabled and the screen explains that one channel must remain visible.

The screen includes management-local `Zoek een zender`. Filtering runs only over the canonical catalogue, filters both zones and never calls hosted Guide Search. While a query is active, visibility remains available but drag/reorder is disabled and handles are omitted. Clearing the query restores the complete two-zone layout. No bulk show/hide action is part of this increment.

The accepted drag contract uses the existing gesture/Reanimated stack rather than a draggable-list dependency: 220 ms handle long-press, 8 pt preactivation movement tolerance, edge-only auto-scroll after activation, a visible insertion slot, reduced-motion handling, one pick haptic and one changed-drop haptic. Accessibility deliberately does not depend on drag: each channel row is one screen-reader focus stop with hide/show and one-step move custom actions as applicable; the sighted eye and handle are hidden as duplicate accessibility descendants.

## Out of scope

Issue #170 does not activate the 49-channel production catalogue, change provider mappings beyond sharing the existing 12-channel catalogue, change EPG orchestration/ingest, modify issue #167 acceptance, add TMDB/artwork, add accounts/cloud profiles, add server-side preference sync, or add a new state-management/cache dependency.

## Physical validation

Required iPhone validation after automated gates:

1. clean/no-preference first load keeps existing default channel set/order;
2. hide a middle channel and verify Totaal, Per zender and Nu & Straks all remove it;
3. reorder two visible channels and verify all three presentations share the order;
4. restart the app and verify selection/order survive;
5. Search the hidden channel and verify it remains findable;
6. open it from Search and verify Per zender shows it without re-adding it;
7. return to Search, use `Toevoegen`, and verify it becomes visible exactly once, appended to current selected order;
8. use `mijn zenders` or `zendervolgorde` Search and verify the management route;
9. physically converge handle-only drag: short press vs 220 ms activation, scroll-before-activation, neighbor movement, first/last drop and 72-pt edge auto-scroll on a long (~49-channel) list;
10. validate hide/show zone transitions, dark/system, Larger Text through maximum Accessibility Text, VoiceOver custom actions/focus and persistence after restart;
11. verify a hidden active/current channel preference change produces coherent deterministic Guide fallback rather than index drift.

Android physical validation remains under the project-wide hardware gate; automated Android export/build validation remains required.
