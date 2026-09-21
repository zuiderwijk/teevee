# Guide day selector — current accepted interaction and visual direction

Status: **ACCEPTED**
Accepted: 2026-09-15; Per-zender Primetime amendment accepted 2026-09-15; Per-zender temporal-state refinement accepted 2026-09-17; Per-zender rest-heading removal and compact temporal-context refinement accepted 2026-09-18; Totaal compact date-label alignment accepted 2026-09-21

Applies to:
- Totaal;
- Per zender.

Nu & Straks does **not** use this selector.

## Canonical visual assets

### Day states and bottom sheet
- `/Teevee/Teevee Guide day selector - states and bottom sheet.png`
  - file id: `file_00000000390c8210b76256621721592b`

Use this reference for:
- the compact inline date label;
- today / alternate-day / after-midnight states;
- the bounded ten-day bottom sheet;
- shared use in Totaal and Per zender.

### Sticky / condensed scroll behaviour
- `/Teevee/Teevee Guide day selector - sticky scroll behavior.png`
  - file id: `file_00000000314481f69f6a34d18ece1c21`

Use this reference for:
- rest versus vertically scrolled states;
- non-functional header condensation;
- persistent date / `Nu` context;
- Totaal time-axis stickiness;
- Per-zender channel-strip + compact temporal context.

The reference is structural only for Per zender where later written refinements supersede its exact label content/spacing.

Authority amendment: the sticky/condensed visual predates the accepted Per-zender `Primetime` shortcut and later refinements. Its Per-zender representation is stale where it omits `Primetime`, implies only static utility-button visuals, implies a 72-pt settled condensed channel strip, shows selected-channel text outside the logo rail, uses the older long relative date labels, or implies wrapped temporal chrome. The written Per-zender rules below supersede those details.

## Accepted behaviour

### Available range
- exactly the product Guide horizon currently frozen by ADR 0008: D-2, D-1, D and D+1 through D+7;
- do not expose an unrestricted calendar;
- do not show disabled dates outside the available horizon;
- do not expose technical `D-2` / `D+7` notation to users.

### Inline control
- show one compact, primarily typographic date control rather than ten permanent day buttons or a horizontal date rail;
- use human-readable compact labels consistently in **Totaal and Per zender**;
- **06:00–23:59:** current television day = `Vandaag`, next television day = `Morgen`, with no redundant weekday/date suffix; all other days use an explicit abbreviated weekday + date such as `Zo 20 sep`;
- **00:00–05:59:** use only explicit abbreviated weekday + date labels for every television-day option, including the current and next television day. Do not show `Vandaag` or `Morgen` in this window;
- these shared rules are based on the canonical 06:00 Europe/Amsterdam television-day boundary, not calendar midnight;
- the complete control remains a platform-appropriate touch target even when its visible treatment is only text plus chevron;
- `Nu` remains a separate persistent action and is not folded into the date selector;
- in Per zender, `Primetime` is an additional sibling utility action; it is not part of the date selector itself.

### Bottom sheet
Tapping the date control opens a bounded bottom sheet containing the ten available television days in chronological order.

- current selection is explicit and not colour-only;
- for Totaal and Per zender, bottom-sheet labels follow the same compact-label rule as the inline selector: `Vandaag`/`Morgen` only from 06:00–23:59; from 00:00–05:59 all options use explicit weekday + date labels;
- no month grid, arbitrary calendar navigation or unavailable dates;
- selecting a day closes the sheet and moves the Guide to that television day.

### Time preservation when changing day
Changing day preserves the currently viewed wall-clock time where practical.

Example: viewing Monday around 20:35 and selecting Thursday should land around Thursday 20:35, not automatically at 06:00 or Primetime.

`Nu` is the explicit exception: it restores both the actual current instant and the television day containing that instant.

### Totaal
- vertical scrolling keeps the selected date, `Nu` action and time axis available;
- non-functional brand/header chrome condenses away as vertical scrolling progresses;
- horizontal time browsing remains continuous across midnight and the 06:00 television-day boundary;
- the visible date context updates when the Guide's stable time-navigation anchor crosses 06:00, not merely when a sliver of the next day becomes visible;
- date-context changes should be visually quiet; no attention-seeking transition is required.

### Per zender
At rest:
- shared Guide/brand chrome may be visible;
- the horizontal channel-logo strip is available;
- selected channel identity in expanded/rest state is carried by the selected logo in the channel rail; do not render a separate large textual selected-channel heading;
- date, `Primetime` and `Nu` form the schedule context;
- `Primetime` keeps the selected television day and jumps to 20:30 on that day;
- between 00:00 and 05:59 this means jumping back to the preceding television-day evening at 20:30;
- `Nu` remains distinct and restores the actual current day and instant;
- date remains primarily typographic, not a permanent pill;
- `Primetime` and `Nu` expose explicit action versus active/current states based on the actual stable schedule context, not merely on the last control tapped;
- active/current must not be represented by colour alone;
- when away from now, `Nu` may use the stronger return-action treatment; once at now, it becomes a current-state indicator rather than remaining a CTA-style pill;
- `Primetime` remains visually lighter while inactive and uses the accepted current-state treatment when the stable schedule context corresponds to the programme/context containing the selected day's 20:30 reference point;
- active/current is not disabled; disabled is reserved for genuinely unavailable actions.

After vertical scroll:
- non-functional header chrome condenses away;
- the channel-logo strip remains sticky;
- settled condensed Per-zender channel strip is 60 pt high while preserving the 48 × 48 channel touch/item geometry;
- immediately beneath it, keep the same compact one-row temporal context: date + `Primetime` + `Nu`;
- do **not** add the selected channel name in condensed state; the persistently selected logo in the rail remains sufficient visible identity;
- the same semantic action/current state rules for `Primetime` and `Nu` continue in condensed state;
- horizontal schedule swipe continues to change adjacent channel without being intercepted by date/time utilities.

The earlier expanded Per-zender time picker (`Vanmiddag`, `Vooravond`, `Kies tijd…`) is not part of this accepted pattern.

### Scroll transition
- condensation should follow the vertical scroll naturally rather than behave like a news-app toolbar that disappears and reappears based on scroll direction;
- on scrolling back to the top, the full rest-state hierarchy returns naturally;
- in Per zender with normal motion, the channel strip may interpolate from 72 pt at rest to 60 pt settled condensed while 48 × 48 channel items remain unchanged;
- reduced-motion mode may use a simpler non-interpolated state transition.

## Accessibility
- substantive programme labels follow platform text scaling;
- for **Per-zender compact temporal chrome only**, date, `Primetime` and `Nu` use a hard `maximumFontSizeMultiplier = 1.20` and remain one line; this prevents functional chrome from destabilising while programme content remains substantively scalable;
- date control, `Primetime` where present, and `Nu` retain platform-appropriate touch targets (minimum equivalent of 44 pt on iOS / 48 dp on Android where applicable);
- expose selected date, relative label where applicable, `Ga naar primetime` and `Ga naar nu` action semantics to VoiceOver/TalkBack;
- for Per-zender temporal utilities, expose active/current state semantically when the corresponding stable schedule context is active;
- selection/current state cannot rely on colour alone;
- sticky content must not obscure programme content or system safe areas;
- light, dark and system modes use the same interaction contract.

## Preserve from existing Guide baselines
This accepted selector does **not** reopen:
- Totaal two-dimensional time/channel gestures;
- Per-zender adjacent-channel swipe or direct channel-strip selection;
- television-day semantics from ADR 0008;
- canonical open schedule geometry / typography;
- bottom navigation;
- Nu & Straks interaction model.

## Explicitly not accepted by the 2026-09-17 refinement
- A one-time horizontal-swipe nudge/peek is not canonical yet; it requires separate explicit acceptance after interaction/physical validation.
- A `•••` overflow entry is not part of this selector decision and remains a separate shared-header/application-IA question.

## Superseded
For Totaal and Per zender, this supersedes:
- prototype `Vandaag` / `Morgen` permanent day buttons;
- stale date controls shown in the 13 September canonical Guide images;
- any exploration using a horizontal ten-day rail, unrestricted calendar, or previous/next-day arrow chrome.

For Per zender specifically, the expanded historical time-picker is superseded, while the direct `Primetime` shortcut is accepted. Static utility-button-only treatment and a permanently 72-pt settled condensed channel strip are superseded by the 2026-09-17 Per-zender refinement. The 2026-09-18 physical-validation refinement supersedes all selected-channel text outside the persistent logo rail, the older long `Vandaag/Morgen · weekday date` labels, relative `Vandaag/Morgen` wording between 00:00–05:59, 24-pt rail→utilities spacing, and Dynamic-Type-driven wrapped temporal chrome.

The rest of the canonical Totaal and Per-zender visual references remain accepted unless explicitly superseded elsewhere.
