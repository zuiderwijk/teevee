# Teevee channel-logo asset provenance

Status: **ACTIVE LOCAL ASSET REGISTRY**
Checked/ingested: **2026-09-18**

Teevee renders approved canonical channel marks from local app assets. The app does not hotlink broadcaster or Wikimedia resources at runtime. The product owner explicitly confirmed that these channel logos may be used for Teevee. This document preserves replacement/provenance information; trademark ownership remains with the respective broadcaster/brand owner.

Runtime registry: `features/guide/channelLogoRegistry.ts`
Canonical ID/path manifest: `features/guide/channelLogoAssetManifest.ts`
Local assets: `assets/channels/`
Ingest hashes: `assets/channels/SHA256SUMS`

| Canonical channel ID | Display name | Local asset | Source / original provenance | Source URL | Commons note |
| --- | --- | --- | --- | --- | --- |
| `nl-npo-1` | NPO 1 | `assets/channels/nl-npo-1.png` | Wikimedia Commons rasterisation of current `NPO_1_logo_2014.svg`; author/brand: NPO | https://commons.wikimedia.org/wiki/File:NPO_1_logo_2014.svg | Commons marks the simple logo as public-domain/simple-logo; trademark restrictions may still apply. |
| `nl-npo-2` | NPO 2 | `assets/channels/nl-npo-2.png` | Wikimedia Commons rasterisation of current `NPO_2_logo_2014.svg`; author/brand: NPO | https://commons.wikimedia.org/wiki/File:NPO_2_logo_2014.svg | Commons marks the simple logo as public-domain/simple-logo; trademark restrictions may still apply. |
| `nl-npo-3` | NPO 3 | `assets/channels/nl-npo-3.png` | Wikimedia Commons rasterisation of current `NPO_3_logo_2018.svg`; original source: npo3.nl; author/brand: NPO | https://commons.wikimedia.org/wiki/File:NPO_3_logo_2018.svg | Commons marks the simple logo as public-domain/simple-logo; trademark restrictions may still apply. |
| `nl-rtl-4` | RTL 4 | `assets/channels/nl-rtl-4.png` | Wikimedia Commons rasterisation of current `RTL4_2023.svg`; original source: rtl.nl/gemist; author/brand: RTL Nederland | https://commons.wikimedia.org/wiki/File:RTL4_2023.svg | Commons marks the simple logo as public-domain/simple-logo; trademark restrictions may still apply. |
| `nl-rtl-5` | RTL 5 | `assets/channels/nl-rtl-5.png` | Wikimedia Commons rasterisation of current `RTL5_2023.svg`; original source: rtl.nl/gemist; author/brand: RTL Nederland | https://commons.wikimedia.org/wiki/File:RTL5_2023.svg | Commons marks the simple logo as public-domain/simple-logo; trademark restrictions may still apply. |
| `nl-sbs-6` | SBS6 | `assets/channels/nl-sbs-6.png` | Wikimedia Commons copy of the current 2023 PNG; original source: Kijk.nl; author/brand: Talpa Network | https://commons.wikimedia.org/wiki/File:SBS6_Logo.png | Commons file is CC BY-SA 4.0; this table preserves source/author attribution. |

## Fallback scope

The current development channel catalog also contains RTL 7, RTL 8, Net5, Veronica / Disney XD, SBS9 and RTL Z. Those channels intentionally remain on the canonical text fallback until equally current, provenance-checked local assets are ingested. Their absence does not change channel geometry: the same 48×48 item and 40×32 content box are retained, using `shortName ?? displayName` in 12/14 Bold.

Provider-supplied `channel.logoUrl` remains supported behind `ChannelIdentity` as a secondary input. A local canonical asset wins when present; provider-specific URLs are not embedded in Per-zender UI code.


## Dark-background compatibility audit — 2026-09-18

The local source assets above remain the authoritative light/default marks. NPO 1/2/3 remain legible on the accepted dark Guide canvas.

Physical iPhone review showed that the dark elements in the current RTL 4, RTL 5 and SBS6 marks lose sufficient visual clarity on the dark canvas. During this pass the existing official/Commons provenance chain was rechecked, but no separate current, provenance-checked dark-background variant was established for these three brands.

Missing asset inputs for final dark-mode acceptance:
- RTL 4 — current official/provenance-checked dark-background mark;
- RTL 5 — current official/provenance-checked dark-background mark;
- SBS6 — current official/provenance-checked dark-background mark.

Until such assets are supplied or verified, Teevee deliberately keeps the existing unmodified local marks. Do not runtime-tint/recolour full-colour logos, draw substitute brand marks, add a generic white tile, or hotlink a remote asset. If a verified dark-specific brand asset becomes available, add it next to the existing local asset and resolve it centrally in `channelLogoRegistry.ts`; keep `ChannelIdentity` as the single renderer and update this provenance record plus `SHA256SUMS`.
