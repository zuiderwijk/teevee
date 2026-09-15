# Guide day selector — current accepted interaction and visual direction

Status: **ACCEPTED**
Accepted: 2026-09-15; Per-zender Primetime amendment accepted 2026-09-15

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
- Per-zender channel-strip + compact channel/date context.

Authority amendment: the sticky/condensed visual predates the accepted Per-zender `Primetime` shortcut. Its Per-zender compact context row is therefore stale only where it omits `Primetime`; the written Per-zender rules below supersede that omission.

## Accepted behaviour

### Available range
- exactly the product Guide horizon currently frozen by ADR 0008: D-2, D-1, D and D+1 through D+7;
- do not expose an unrestricted calendar;
- do not show disabled dates outside the available horizon;
- do not expose technical `D-2` / `D+7` notation to users.

### Inline control
- show one compact, primarily typographic date control rather than ten permanent day buttons or a horizontal date rail;
- use human-readable labels such as `Vandaag · ma 15 sep`, `Morgen · di 16 sep`, or `Do 18 sep` as space permits;
- when the active television day is the preceding calendar date between 00:00 and 05:59, prefer the actual date label (for example `Ma 15 sep`) rather than calling it `Vandaag`;
- the complete control remains a platform-appropriate touch target even when its visible treatment is only text plus chevron;
- `Nu` remains a separate persistent action and is not folded into the date selector;
- in Per zender, `Primetime` is an additional sibling utility action; it is not part of the date selector itself.

### Bottom sheet
Tapping the date control opens a bounded bottom sheet containing the ten available television days in chronological order.

- current selection is explicit and not colour-only;
- relative wording (`Vandaag`, `Morgen`) may be used when semantically correct;
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
- channel name plus date, `Primetime` and `Nu` form the schedule context;
- `Primetime` keeps the selected television day and jumps to 20:30 on that day;
- between 00:00 and 05:59 this means jumping back to the preceding television-day evening at 20:30;
- `Nu` remains distinct and restores the actual current day and instant.

After vertical scroll:
- non-functional header chrome condenses away;
- the channel-logo strip remains sticky;
- immediately beneath it, use one compact sticky channel/date context row with both `Primetime` and `Nu` available;
- do not retain a duplicate large channel heading in the condensed state;
- horizontal schedule swipe continues to change adjacent channel without being intercepted by date/time utilities.

The earlier expanded Per-zender time picker (`Vanmiddag`, `Vooravond`, `Kies tijd…`) is not part of this accepted pattern.

### Scroll transition
- condensation should follow the vertical scroll naturally rather than behave like a news-app toolbar that disappears and reappears based on scroll direction;
- on scrolling back to the top, the full rest-state hierarchy returns naturally;
- reduced-motion mode may use a simpler non-interpolated state transition.

## Accessibility
- substantive labels follow platform text scaling;
- compact grouping may adapt height or wrap rather than shrink text excessively;
- date control, `Primetime` where present, and `Nu` retain platform-appropriate touch targets (minimum equivalent of 44 pt on iOS / 48 dp on Android where applicable);
- expose selected date, relative label where applicable, `Ga naar primetime` and `Ga naar nu` action semantics to VoiceOver/TalkBack;
- selection cannot rely on colour alone;
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

## Superseded
For Totaal and Per zender, this supersedes:
- prototype `Vandaag` / `Morgen` permanent day buttons;
- stale date controls shown in the 13 September canonical Guide images;
- any exploration using a horizontal ten-day rail, unrestricted calendar, or previous/next-day arrow chrome.

For Per zender specifically, the expanded historical time-picker is superseded, while the direct `Primetime` shortcut is accepted.

The rest of the canonical Totaal and Per-zender visual references remain accepted unless explicitly superseded elsewhere.
