# Teevee Design System Direction

Status: Phase 0 direction, not a frozen visual specification.

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

## Typography
Use a platform-appropriate, highly legible sans-serif baseline unless later brand work establishes a typeface with measurable product value. Hierarchy matters more than brand novelty. Programme cells must remain readable at constrained widths.

## Spacing and shape
Use a small consistent spacing scale and restrained corner radii. Avoid excessive card nesting. The timeline itself should read as one coherent surface rather than a dashboard of unrelated cards.

## Motion
Motion should clarify spatial/time relationships, selection and navigation. Avoid decorative animation. Respect reduced-motion settings.

## Programme imagery
Core Guide functionality must never depend on artwork. Programme Detail and Tonight can progressively enrich with imagery. Missing images should result in an intentional layout, not placeholders that look broken.

## Accessibility
Semantic tokens must meet contrast requirements. Do not communicate live/current/saved state using colour alone. Touch targets should follow platform guidance. Text scaling should be supported while preserving a usable schedule interaction.

## Freeze process
Visual decisions become frozen only after they are implemented in a representative Guide prototype and reviewed in both light and dark modes on realistic phone sizes. Once frozen, material changes require a documented design decision.
