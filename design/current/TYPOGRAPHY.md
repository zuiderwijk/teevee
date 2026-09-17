# Typography — current accepted system

Status: **ACCEPTED**
Accepted: 2026-09-17
Scope: all Teevee product surfaces unless a future owner-approved brand asset explicitly defines its own lettering.

## Canonical typeface

**Instrument Sans** is the accepted primary UI typeface for Teevee.

Use Instrument Sans as one coherent UI family across:
- Guide presentation navigation and shared chrome;
- programme titles;
- programme times and secondary schedule metadata;
- Programme Detail;
- Vanavond / Tonight;
- Search;
- Settings and other secondary product surfaces.

Do **not** pair Instrument Sans with Inter, Geist, Public Sans or another sans-serif by default. The accepted direction is one typographic family, with hierarchy created through size, weight, line height, contrast and spacing rather than through a second UI typeface.

A future final wordmark/logo may use separate custom brand lettering. That does not change Instrument Sans as the product UI family.

## Weight and hierarchy direction

Preferred starting hierarchy:
- Regular for body copy, programme times and quiet secondary information;
- Medium for programme titles and compact functional labels where extra emphasis is needed;
- Semibold for primary headings, selected navigation and stronger programme states;
- Bold only where a specific hierarchy requires it; avoid making the interface uniformly heavy.

Exact native weight mapping and font-file variants remain implementation details and must be validated on iOS and Android rather than inferred from mock-up rendering.

## Schedule numerals

Where supported reliably by the production font/runtime, programme times and other aligned schedule numerals should use tabular numerals. If the exact Instrument Sans build does not expose a reliable tabular-numeral feature on both platforms, preserve alignment through the least intrusive production-safe implementation rather than introducing a second typeface solely for numbers.

## Accessibility

- Substantive text continues to respect Dynamic Type / platform font scaling.
- Do not preserve mock-up density by clipping essential content or globally disabling scaling.
- Programme titles remain more prominent than times/secondary metadata through weight and contrast, not tiny text.
- Compact chrome may use only the already documented narrow scaling caps where necessary.
- Validate representative larger text sizes on physical iOS and Android devices.

## Screenshot and handoff authority

The previously accepted screenshots remain canonical for their composition, spacing, hierarchy and interaction treatment, but any Söhne/Söhne-like typography visible in them is now **SUPERSEDED only for the typeface family** by Instrument Sans.

Likewise, older surface-specific handoff text that still names Söhne should be read as stale for the family name only. This manifest plus `docs/VISUAL_BASELINE.md` and `docs/DESIGN_SYSTEM.md` define the current typography choice.

No other visual decision is reopened by this typeface change.

## Production delivery

This decision selects the typeface; it does not by itself approve a particular binary/font package or loading implementation.

Before shipping:
- verify the exact Instrument Sans source and licence used for distribution;
- include only required weights/styles;
- verify Expo/React Native loading and fallback behaviour on iOS and Android;
- avoid visible font-swap/layout-jump regressions during startup;
- ensure the font remains available offline once the app is installed;
- validate rendering, truncation, tabular numerals and Dynamic Type on physical devices.

Do not commit arbitrary font binaries from chat or local machines merely because the family has been selected.