# Teevee Design System Direction

Status: visual-design baseline updated 15 September 2026. Guide and Programme Detail direction below reflects owner-approved design decisions. Exact production token values still require implementation/device validation. Tonight remains provisional.

## Objective
Teevee should communicate premium utility: calm, precise, contemporary and highly legible. The Guide can contain substantial schedule information without looking dense or cheap.

The design should feel like an open canvas, not a stack of cards. Use hierarchy, whitespace and typography before boxes, fills and decoration.

## Canonical visual references
This document defines reusable visual-system rules; it does **not** choose which historical mock-up is current. The exact accepted visual references per surface are selected by `docs/VISUAL_BASELINE.md` and the manifests under `design/current/`.

A Design or Development thread changing an existing surface must inspect those canonical references first. Do not infer the baseline from chat history, Library recency, generated-image timestamps or visual similarity. When an otherwise accepted screenshot contains a stale control, newer behaviour in `PROJECT_STATE.md`, `UX.md` or an accepted ADR wins.

## Brand and visual character
- premium, modern, quiet and functional;
- no advertising surfaces;
- light mode is a primary design direction, with equally intentional dark mode and system mode;
- restrained app chrome;
- channel logos provide colour/identity naturally, so application accent colour is used sparingly;
- imagery belongs mainly to discovery/detail enrichment, not to the core Guide timeline;
- avoid ornamental media-app conventions that do not improve the TV-guide task.

## Typography
The preferred visual direction established during exploration is **Söhne** (or the approved production equivalent if licensing/technical constraints require substitution). Its role is a contemporary, premium, neutral grotesk with strong legibility rather than conspicuous brand typography.

Typography rules:
- title hierarchy should carry more of the visual structure than containers do;
- programme titles use clear weight contrast without excessive boldness everywhere;
- secondary times/channel names use lower weight/contrast;
- following programmes in Nu & Straks are deliberately quieter than the programme at the reference time;
- substantive content respects platform font scaling;
- never preserve a screenshot's density by clipping essential content or globally disabling Dynamic Type/font scaling.

A typeface choice is not permission to bundle/distribute font files without the appropriate licence. Production implementation must verify font licensing and platform delivery separately.

## Theme model
Support light, dark and system appearance. Components use semantic tokens rather than hard-coded theme colours.

Semantic categories:
- canvas background;
- primary/secondary/elevated surface where genuinely needed;
- primary/secondary/muted text;
- separator/border;
- accent/interactive;
- current/reference-time indicator;
- programme states;
- success/warning/error;
- focus/pressed/disabled.

### Background direction
Do not use a visibly creamy/off-white background merely to signal premium. The accepted direction is a near-white neutral canvas in light mode and a calm dark-anthracite canvas in dark mode. Exact token values remain implementation decisions subject to contrast/device validation.

## Colour
Red is an accent, not a structural fill. Use it for meaningful selected/current/primary-action emphasis, not as a large permanent chrome treatment.

Avoid a redundant full-height red current-time line when a compact time indicator/marker already provides sufficient temporal orientation. State must never depend on red alone.

## Surfaces, spacing and shape
- prefer continuous/open surfaces over stacked cards;
- avoid grey programme-block fills that make the Guide feel cheap or dashboard-like;
- use whitespace as the primary separator;
- use subtle hairlines only where spatial separation is otherwise ambiguous;
- keep deliberate breathing room between channel-logo navigation and Guide content;
- restrained corner radii; not every group needs a rounded container;
- no heavy shadows in the core Guide;
- the interface should never optimise for fitting the maximum number of facts into one viewport.

## Channel identity
Channel logo is the primary visual identifier when licensed/readable artwork is available. Channel name is secondary/contextual and remains available to assistive technology.

Rules:
- preserve logo proportions;
- do not recolour/distort marks merely for layout consistency;
- provide a clean text fallback;
- logo artwork is presentation metadata, not a schedule-data dependency;
- channel logos may provide natural visual colour while the surrounding UI remains restrained.

## Canonical Guide chrome
All three Guide presentations share one visual shell.

At rest the shell may show brand identity and the Guide-view selector. During vertical scrolling, nonessential brand chrome may condense to return space to schedule content. Essential context is view-specific:
- Totaal: selected day, `Nu`, and time axis/context;
- Per zender: channel-logo strip plus compact channel/date context and `Nu`;
- Nu & Straks: reference-time context/selector.

Bottom navigation remains stable. Avoid making the `tv.` brand mark consume permanent vertical space when it is no longer functionally useful during scroll.

### Shared Guide day selector
Totaal and Per zender share one accepted visual/interaction component for day navigation.

System rules:
- visible treatment is primarily typographic (date label + disclosure indicator), not a heavy pill/card;
- the whole control remains a platform-appropriate touch target despite restrained visible chrome;
- `Nu` is visually and functionally separate from the date selector;
- opening the selector uses a bounded bottom sheet rather than an unrestricted calendar;
- selection uses semantic selected state plus an explicit non-colour indicator;
- labels may use `Vandaag` / `Morgen` only when semantically correct for the active television day;
- when larger text requires more space, increase control/header height or wrap before aggressively shrinking labels;
- light/dark/system use semantic surface, border and text tokens rather than separate interaction variants.

Sticky/condensed rules:
- condensation removes non-functional chrome; it must not remove essential Guide context;
- Totaal keeps date + `Nu` + time axis available while the Guide scrolls vertically;
- Per zender keeps the channel-logo strip and one compact channel/date row available while the schedule scrolls vertically;
- do not show both a large channel heading and the compact channel/date heading simultaneously in the settled condensed state;
- prefer whitespace and, only when needed, a subtle hairline/theme surface to separate sticky context from scrolling content;
- avoid heavy floating cards and shadows;
- reduced-motion preferences may replace interpolated condensation with a simpler state change.

Exact canonical assets and state semantics are defined by `design/current/guide/GUIDE_DAY_SELECTOR.md`.

## Guide-specific density
### Totaal
This is the densest presentation because spatial geometry itself communicates schedule information. Keep cells typographic and restrained. Do not add genres or artwork. Current programme context may prioritise end time; future cells prioritise start time.

### Per zender
Use an open vertical schedule, not a card stack. Keep the sticky horizontal channel-logo strip visually separated from programme content with breathing room. Horizontal schedule swipe changes channel; no decorative previous/next arrows are required when gesture behaviour and logo strip make navigation understandable.

### Nu & Straks
Each channel presents one dominant programme at the selected reference time plus three quieter following programmes. No progress bars, genre chips, artwork, chevrons or `Daarna` labels. The hierarchy itself communicates current/reference versus following content.

## Programme Detail
Programme Detail is a calm information surface, not a streaming-service hero page.

- title is the first visual anchor;
- channel/time follows immediately;
- artwork is optional enrichment rather than a required hero;
- primary phase actions are `Herinner mij` and `Bewaar`;
- no overflow/share/calendar chrome in the current phase;
- the normal actions live in the content;
- after those actions scroll out of view, a compact bottom sticky action treatment may appear;
- use a subtle separator/translucent or theme surface rather than a large floating card or heavy shadow;
- respect bottom safe areas;
- accessibility text may reflow the two actions vertically.

## Tonight / Vanavond
Provisional direction only. Tonight may use more imagery and editorial composition than Guide, while remaining a finite decision-support surface rather than an engagement feed. Channel and start-time information remain immediately legible. Missing artwork must not break the composition.

## Motion
Motion clarifies spatial/time relationships, selection and navigation. Avoid decorative animation.

- scrolling should use platform-appropriate inertia;
- boundaries should feel elastic rather than hitting an unnatural hard stop where the platform permits it;
- directional locking should help distinguish vertical schedule scrolling from horizontal time/channel gestures;
- selected states may update immediately before a longer animated jump finishes;
- Guide header condensation should follow vertical scroll naturally rather than use attention-seeking toolbar behaviour;
- respect reduced-motion settings.

## Touch ergonomics
Frequent actions should be reachable without unnecessary hand repositioning. Programme Detail uses contextual sticky bottom actions once the canonical actions leave the viewport, giving one-handed access without permanently adding chrome.

Guide day selection and `Nu` remain reachable while vertically browsing Totaal or Per zender. Touch targets remain platform-appropriate and safe-area aware.

## Accessibility
- maintain semantic contrast in light and dark themes;
- do not communicate state with colour alone;
- support larger system text for substantive content;
- allow row height, wrapping and density to adapt;
- compact controls may use only narrow, documented scaling caps where necessary;
- expose full textual channel identity and useful programme/time summaries to screen readers;
- expose the full selected date and day-selection action for the Guide date control;
- test representative larger text settings on physical iOS and Android devices;
- respect reduced motion.

## Freeze model
There are three levels:
1. **Accepted UX/visual baseline** — owner-approved direction that implementation should follow; exact current visual references are listed in `docs/VISUAL_BASELINE.md` / `design/current/`;
2. **Provisional direction** — promising but intentionally open (currently notably Tonight composition and exact production tokens);
3. **Technically frozen implementation** — implemented and validated on representative devices in light/dark and relevant accessibility settings.

A visual baseline is not automatically a claim that the current code implements it. Material changes to an accepted baseline should be recorded explicitly rather than silently drifting through implementation.
