# Teevee Design System Direction

Status: Phase 0 direction, not a frozen visual specification. Amended 13 September 2026 with channel-identity and text-scaling requirements.

## Objective
The interface should communicate premium utility: calm, precise, contemporary and highly legible. The Guide may be information-dense, but must not feel busy.

## Visual Direction 01
The previously supplied light and dark concept visuals are registered as **Visual Direction 01**. They are reference material only.

Qualities worth preserving:
- light mode as the primary exploration direction;
- strong typographic hierarchy;
- restrained chrome;
- clear time/channel structure;
- premium but not ornamental presentation;
- imagery used more generously on discovery/detail surfaces than inside the core Guide.

## Theme model
Support light, dark and system appearance from the app-shell phase. Components use semantic tokens rather than hard-coded theme colours.

Initial semantic token categories:
- background / surface / elevated surface;
- primary / secondary / muted text;
- separator / border;
- accent / interactive;
- current-time indicator;
- programme states;
- success / warning / error;
- focus/pressed/disabled.

Exact values are deliberately not frozen in Phase 0.

## Channel identity
In Guide surfaces, **the channel logo is the primary visual identifier when a licensed, usable logo is available**. The channel name remains present as a smaller/subtler textual identifier or otherwise directly available; Teevee must not assume every user recognises every logo.

Rules:
- never rely on logo recognition alone;
- expose the full channel name to assistive technology;
- provide an intentional text-first fallback when a logo is missing, delayed, illegible, monochrome-incompatible or not licensed;
- preserve recognisable logo proportions; do not distort or recolour channel marks merely to fit the layout;
- logo artwork is presentation metadata, not a dependency for schedule correctness;
- final production logo use requires rights/source validation separately from EPG programme-data rights.

The current synthetic text-only channel column is a prototype state, not the target visual identity treatment.

## Typography
Use a platform-appropriate, highly legible sans-serif baseline unless later brand work establishes a typeface with measurable product value. Hierarchy matters more than brand novelty. Programme cells must remain readable at constrained widths.

Teevee must respect platform text-size preferences. Dynamic Type / font scaling is a product requirement, not a later cosmetic enhancement. Layouts may adapt density, row height, wrapping and visible metadata as text grows; they must not solve large text by clipping essential information or globally disabling font scaling.

At larger accessibility sizes, preserving comprehension takes precedence over preserving the default-density screenshot. Compact Totaal cells may show less secondary metadata, while programme detail and list-oriented Guide views must remain fully readable and reachable.

## Spacing and shape
Use a small consistent spacing scale and restrained corner radii. Avoid excessive card nesting. The timeline itself should read as one coherent surface rather than a dashboard of unrelated cards.

## Motion
Motion should clarify spatial/time relationships, selection and navigation. Avoid decorative animation. Respect reduced-motion settings.

## Programme imagery
Core Guide functionality must never depend on artwork. Programme Detail and Tonight can progressively enrich with imagery. Missing images should result in an intentional layout, not placeholders that look broken.

## Accessibility
Accessibility is a core quality gate for the paid Guide experience, regardless of assumptions about audience age.

- semantic tokens must meet contrast requirements;
- do not communicate live/current/saved state using colour alone;
- touch targets should follow platform guidance;
- support platform font scaling beyond 100%;
- test representative larger text sizes on-device rather than only at the default system size;
- prevent essential channel/programme identity, times and actions from becoming unreachable at larger sizes;
- allow layout reflow or reduced information density where necessary;
- support screen-reader labels for programme, channel and time context;
- respect reduced-motion preferences where animation is non-essential.

## Freeze process
Visual decisions become frozen only after they are implemented in a representative Guide prototype and reviewed in both light and dark modes on realistic phone sizes. Accessibility-sensitive components additionally require larger system-text review before being frozen. Once frozen, material changes require a documented design decision.
