# Teevee — Current Design Contract

`design/current/` contains only the design state that a new Teevee thread may treat as current.

## Rules

- `docs/VISUAL_BASELINE.md` is the canonical index.
- Each surface has one current manifest under this directory; shared accepted components/interactions may have a dedicated manifest referenced by the relevant surfaces.
- Older alternatives do not live here. Git history is the archive.
- A design generated in chat is not current until the owner explicitly accepts it and the corresponding manifest is updated on `main`.
- Never select a Library image because it is newer, prettier or appears more complete. Use the exact asset id/path in the current manifest.
- Behaviour defined by `docs/UX.md`, `docs/PROJECT_STATE.md` or an accepted ADR overrides a stale control visible in an otherwise accepted screenshot.
- If canonical pixels cannot be opened, do not substitute another historical image. Use the written baseline and report the missing asset access.

## Current manifests

Shared system:
- `TYPOGRAPHY.md` — accepted Instrument Sans UI typography system across Teevee.

Guide:
- `guide/TOTAAL.md` — accepted owner-approved Totaal production visual design; production implementation spec remains separate
- `guide/PER_ZENDER.md`
- `guide/NU_EN_STRAKS.md`
- `guide/GUIDE_DAY_SELECTOR.md` — accepted shared Totaal/Per-zender day-navigation and sticky-context contract.

Other surfaces:
- `PROGRAMME_DETAIL.md`
- `TONIGHT.md` — accepted owner-approved Vanavond production visual design; exact implementation metrics/states live in `docs/TONIGHT_VISUAL_CONVERGENCE.md`.

The exact approved visual pixels are currently stored in the user's persistent `/Teevee` Library; their stable file ids are recorded in these manifests and in `docs/VISUAL_BASELINE.md`.
