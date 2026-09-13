# Per zender — Phase 1B implementation notes

The first Per zender prototype deliberately keeps the physically accepted Totaal implementation untouched.

## Interaction architecture
- Vertical position is a continuous time axis, not a programme-row index.
- `PER_CHANNEL_MINUTE_HEIGHT` maps elapsed schedule minutes to Y geometry.
- Programme blocks are clipped to Amsterdam day boundaries but keep real start/duration geometry.
- The outer vertical ScrollView owns the time position.
- A nested horizontal paging ScrollView renders previous/current/next channel pages. Because the pager lives inside the one vertical schedule surface, changing page naturally retains exactly the same Y/time anchor.
- After a successful adjacent-channel page, the three-page pager is recentered without animation and rebuilt around the new channel. This avoids mounting 48 full schedule pages.
- The separate horizontal channel strip can be browsed and tapped directly; selection recentres the active item.
- No per-frame vertical scroll offset is bridged into React state or JS. This follows the performance lesson from Totaal PR #14/#15.

## Prototype scope
`app/index.tsx` temporarily exposes a small Phase 1B switch between the frozen Totaal surface and `PerChannelGuideView`. Totaal remains the initial prototype view so its established integration boundary keeps running unchanged; the switch is test scaffolding, not the final presentation selector or default-view decision. The final shared Guide presentation contract belongs after both Phase 1B interaction models have been proven.

Fixture channels currently have no licensed logo URLs, so the accepted textual channel fallback is shown. This must not be mistaken for the intended production logo treatment.
