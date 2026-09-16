# Performance evidence — cold Guide day switch

Status: **MEASUREMENT INSTRUMENTATION READY — PHYSICAL BASELINE NOT YET CAPTURED**  
Date: 2026-09-16  
Issue: #67  
Base `main`: `fe2fd0b88b65e1e89281c3bf0a9c3d4502b8df9b`

## Purpose

PR #66 physical iPhone acceptance found no functional failure but did report one repeatable non-blocking sensation: immediately after a cold day switch, a very quick first follow-up date interaction can feel less responsive once. The same sensation can recur after switching between Guide presentations and then making the first date change there.

This increment is measurement-only. It must identify where time is spent before any optimisation is selected.

It does **not** add prefetching, persistence, a new cache architecture, new dependencies or Guide gesture changes.

## Facts already established from the accepted implementation

These are code facts, not a performance diagnosis:

1. `GuideScreen` conditionally renders Totaal or Per zender; switching between those presentations unmounts one Guide component and mounts the other.
2. `useSelectedGuideDaySchedule()` owns its visited-window cache in a component-local `useRef(new Map())` capped at ten entries.
3. Therefore switching Guide presentation destroys the previous presentation's component-session selected-window cache. Returning to it later creates a new cache instance.
4. `GuideDaySelector` does not disable day options while selected-window loading is active. `loading` is exposed only through accessibility busy state.
5. The selector uses a native slide `Modal`; after selecting a day the modal closes while the Guide selection change proceeds. A very quick follow-up tap can therefore be compared against the native modal `onDismiss` timing rather than assumed to be a loading lock.
6. When an uncached non-current window has no canonical schedule yet, the Guide remains immediately usable through the deterministic fixture path while the bounded hosted read runs.

None of these facts alone proves the dominant cause of the physical observation.

## Instrumented events

All measurement logs use the exact prefix:

`[TeeveeGuidePerf]`

Each event is one JSON object and includes a surface (`totaal` or `per-zender`) and, for a day-switch trace, a monotonically increasing `traceId`.

To limit observer effect, event payloads are timestamped and buffered in memory at the actual event, but console/Metro I/O is deferred until after the primary measurement window. A day-option press pushes any pending flush at least 2.5 seconds out; the JS-frame sample itself lasts 1.2 seconds. The reported durations therefore describe the original event timings rather than the later log-flush moment.

### Interaction and presentation timing

- `selector-open-press`: the selector control received the press.
- `selector-modal-shown`: native selector modal reported shown.
- `day-option-press`: start of the measured day switch.
- `selection-committed`: the selected-day hook observed the target selected day after the React state commit.
- `first-frame-proxy`: next JS animation frame after the committed target day; records whether canonical schedule data was already present or the first committed path still relied on fixture fallback.
- `selector-modal-dismissed`: iOS native modal dismissal completed, including `tapToModalDismissMs`.

A visually attempted follow-up tap that produces **no** `selector-open-press` before `selector-modal-dismissed` is useful evidence that the native closing modal, rather than Guide loading state, is still owning interaction during that interval.

### Selected-window source and network timing

- `selected-window-cache-mounted` / `selected-window-cache-unmounted`: identifies the lifetime of the component-session cache.
- `surface-mounted` / `surface-unmounted`: identifies Totaal/Per-zender presentation lifetime.
- `selected-window-resolution`: records whether the requested window resolved from `current-runtime`, `session-cache`, `network`, `unavailable` or `network-error`.
- `selected-window-network-start` / `selected-window-network-finish`: measures the complete existing bounded selected-window request path and records one-day versus two-day request scope plus returned channel/programme counts.

Cache-instance IDs make the overview-switch question observable: if Totaal cache `totaal-N` unmounts, Per zender mounts another cache, and returning to Totaal mounts a new `totaal-M`, the cache reset is proven in the same device trace.

### Fixture and JS-thread timing

- `fixture-alignment`: duration of shifting the deterministic fixture to the selected day when canonical selected-window data is not yet available.
- `js-frame-sample`: a 1.2-second JS `requestAnimationFrame` sample beginning at the day-option press, reporting maximum observed JS-frame gap and counts of gaps >=34 ms and >=50 ms.

The JS sampler is intentionally short-lived and starts only on a measured date selection.

## UI-thread measurement

Do **not** add a permanent Reanimated frame callback merely to measure this issue: that would add work to the UI thread being investigated.

For the physical baseline, capture UI-thread/frame evidence separately during the same interaction sequence using native/React Native performance tooling (React Native performance monitor or Xcode Instruments/Core Animation where available). Record whether the physical hesitation coincides with:

- JS frame degradation only;
- UI frame degradation only;
- both;
- neither, while the selector modal is still dismissing.

This distinction is required before selecting an optimisation.

## Required physical baseline protocol

Use the current measurement branch on the same class of environment as the original observation where practical (iPhone 13 / iOS 26.6). Before testing, record the exact checkout SHA with `git rev-parse HEAD`.

Capture Metro logs containing `[TeeveeGuidePerf]` and a screen recording. Keep UI performance tooling visible/recorded where practical.

Run these scenarios without changing Guide physics or data architecture:

1. **Totaal cold non-current day**
   - start on current D;
   - select an uncached non-current day;
   - immediately attempt to reopen the selector and select another day as soon as physically possible;
   - repeat the same day sequence after it is warm.
2. **Per zender cold non-current day**
   - repeat the same cold then warm sequence.
3. **Overview reset**
   - warm at least one non-current day in Totaal;
   - switch to Per zender and make a date selection;
   - return to Totaal and make the first date selection again;
   - verify cache unmount/mount IDs in the logs.
4. **Network comparison**
   - include at least one cold hosted response and one session-cache hit so network duration can be separated from commit/render responsiveness.

Do not interpret Expo Go network/Metro startup time as Teevee day-switch latency.

## Evidence table

Populate after the physical run. Do not invent values.

| Scenario | Surface | Source | Tap -> commit | Commit -> first-frame proxy | Modal dismiss | Network | Max JS gap | UI evidence | Observation |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Cold day switch | Totaal | pending | pending | pending | pending | pending | pending | pending | pending |
| Warm revisit | Totaal | pending | pending | pending | pending | pending | pending | pending | pending |
| Cold day switch | Per zender | pending | pending | pending | pending | pending | pending | pending | pending |
| Warm revisit | Per zender | pending | pending | pending | pending | pending | pending | pending | pending |
| First switch after overview remount | Totaal | pending | pending | pending | pending | pending | pending | pending | pending |

## Decision rule

The measurement must identify the dominant cause before implementation work continues:

- **native modal interaction window** if attempted rapid follow-up taps are absent from logs until `selector-modal-dismissed` while commit/first-frame/network/JS/UI timing is otherwise healthy;
- **network/data availability** only if first meaningful usability is actually gated on the bounded request and its duration dominates;
- **fixture alignment** only if measured alignment cost materially dominates the cold JS path;
- **React/render JS cost** if tap-to-commit or commit-to-frame and JS-frame gaps are high while network/fixture work is not;
- **UI-thread work** if native UI frame evidence degrades without comparable JS delay;
- **cache-remount amplification** only if the cold cost is measurably absent on warm revisits and reliably returns with a new component-session cache instance after overview switching.

Multiple contributors may exist. Record evidence and pick the smallest follow-up change that addresses the measured dominant contributor.

## Merge policy

This instrumentation is temporary evidence code. Do not merge it into `main` merely because its CI is green. The measurement PR is the reproducible code/evidence vehicle for the physical baseline.

After the physical baseline is captured:

1. record measured results and conclusion in this evidence record and issue #67;
2. propose the smallest separate production fix only if the evidence justifies one;
3. close the measurement PR without merge unless a durable diagnostic facility is independently justified;
4. keep accepted Guide gestures, D-2..D+7 semantics, fixture-first behaviour and deferred `NowNextGuideView` unchanged.
