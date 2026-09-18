import { describe, expect, it } from 'vitest';

import type { Channel, GuideFixture, GuideSchedule, Programme } from '@/data/domain/epg';

import { GUIDE_TYPOGRAPHY, GUIDE_VISUAL_METRICS, PER_CHANNEL_VISUAL_METRICS } from './guideVisualMetrics';
import {
  adjacentChannelIndex,
  buildProgrammeRows,
  channelRailOffsetForSelection,
  channelRailRecenterPlan,
  collapseProgressForScrollOffset,
  compactContextForCollapseProgress,
  currentProgrammeIdAt,
  perChannelFunctionalGapsForCollapseProgress,
  perChannelLayoutAnchorKey,
  perChannelNativeOffsetForScheduleOffset,
  perChannelScheduleOffsetForNativeOffset,
  PER_CHANNEL_STABLE_SCROLL_GEOMETRY,
  perChannelStableScrollVisuals,
  currentProgrammeRowHeight,
  programmeRowForTimestamp,
  programmesForChannelDay,
  programmeRowPressBackgroundColor,
  resolvePerChannelSchedulePresentation,
  resolvePerChannelTemporalControlStates,
  scheduleHeightForRows,
  scrollOffsetForTimestamp,
  selectedChannelIndexForId,
  standardProgrammeRowHeight,
  timestampForScrollOffset,
  viewportReferenceInset,
} from './perChannel';

const dayStart = Date.parse('2026-09-13T00:00:00+02:00');
const dayEnd = Date.parse('2026-09-14T00:00:00+02:00');

function programme(id: string, startAt: string, endAt: string): Programme {
  return { id, channelId: 'channel-1', title: id, startAt, endAt };
}

const fixture: GuideFixture = {
  generatedAt: '2026-09-13T10:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    { id: 'channel-1', name: 'Een', displayName: 'Een', sortOrder: 0, isActive: true },
    { id: 'channel-2', name: 'Twee', displayName: 'Twee', sortOrder: 1, isActive: true },
  ],
  programmes: [
    programme('before', '2026-09-12T21:00:00.000Z', '2026-09-12T22:00:00.000Z'),
    programme('overlap', '2026-09-12T21:30:00.000Z', '2026-09-12T22:30:00.000Z'),
    programme('short', '2026-09-13T08:00:00.000Z', '2026-09-13T08:05:00.000Z'),
    programme('inside', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
    programme('long', '2026-09-13T19:00:00.000Z', '2026-09-13T22:00:00.000Z'),
    {
      ...programme('other', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
      channelId: 'channel-2',
    },
  ],
};

describe('per-channel fixed-row schedule', () => {
  it('keeps programmes that intersect the selected Amsterdam day in chronological order', () => {
    expect(programmesForChannelDay(fixture, 'channel-1', dayStart, dayEnd).map(({ id }) => id)).toEqual([
      'overlap',
      'short',
      'inside',
      'long',
    ]);
  });

  it('gives every non-current programme the same row height regardless of duration', () => {
    const programmes = [
      programme('five-minutes', '2026-09-13T08:00:00.000Z', '2026-09-13T08:05:00.000Z'),
      programme('three-hours', '2026-09-13T09:00:00.000Z', '2026-09-13T12:00:00.000Z'),
    ];
    const rows = buildProgrammeRows(programmes, Date.parse('2026-09-13T13:00:00.000Z'), 1);

    expect(rows.map(({ height }) => height)).toEqual([52, 52]);
    expect(rows.map(({ top }) => top)).toEqual([0, 52]);
    expect(scheduleHeightForRows(rows)).toBe(104);
  });

  it('scales standard/current row types consistently with Dynamic Type', () => {
    expect(standardProgrammeRowHeight(1)).toBe(52);
    expect(standardProgrammeRowHeight(1.1)).toBe(57);
    expect(standardProgrammeRowHeight(1.35)).toBe(70);
    expect(standardProgrammeRowHeight(1.5)).toBe(78);
    expect(standardProgrammeRowHeight(2)).toBe(104);

    expect(currentProgrammeRowHeight(1)).toBe(176);
    expect(currentProgrammeRowHeight(1.1)).toBe(194);
    expect(currentProgrammeRowHeight(1.35)).toBe(238);
    expect(currentProgrammeRowHeight(1.5)).toBe(265);
    expect(currentProgrammeRowHeight(2)).toBe(352);
  });

  it('resolves at most one current row and uses real start/end time for progress', () => {
    const programmes = [
      programme('older-overlap', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
      programme('newer-overlap', '2026-09-13T18:15:00.000Z', '2026-09-13T18:45:00.000Z'),
      programme('after', '2026-09-13T19:00:00.000Z', '2026-09-13T20:00:00.000Z'),
    ];
    const nowMs = Date.parse('2026-09-13T18:30:00.000Z');
    const rows = buildProgrammeRows(programmes, nowMs, 1);

    expect(currentProgrammeIdAt(programmes, nowMs)).toBe('newer-overlap');
    expect(rows.filter(({ current }) => current)).toHaveLength(1);
    expect(rows.find(({ current }) => current)?.height).toBe(176);
    expect(rows.find(({ current }) => current)?.progress).toBeCloseTo(0.5, 5);
  });

  it('does not add proportional blank space for real schedule gaps', () => {
    const programmes = [
      programme('morning', '2026-09-13T08:00:00.000Z', '2026-09-13T09:00:00.000Z'),
      programme('evening', '2026-09-13T20:00:00.000Z', '2026-09-13T21:00:00.000Z'),
    ];
    const rows = buildProgrammeRows(programmes, Date.parse('2026-09-13T12:00:00.000Z'), 1);

    expect(rows[1]?.top).toBe(52);
  });

  it('preserves time context through programme timestamps rather than minutes-per-pixel', () => {
    const programmes = [
      programme('early', '2026-09-13T08:00:00.000Z', '2026-09-13T09:00:00.000Z'),
      programme('prime', '2026-09-13T18:00:00.000Z', '2026-09-13T22:00:00.000Z'),
      programme('late', '2026-09-13T22:00:00.000Z', '2026-09-13T23:00:00.000Z'),
    ];
    const rows = buildProgrammeRows(programmes, Date.parse('2026-09-14T00:00:00.000Z'), 1);
    const anchor = viewportReferenceInset(1);
    const primetime = Date.parse('2026-09-13T20:30:00.000Z');

    expect(programmeRowForTimestamp(rows, primetime)?.programme.id).toBe('prime');
    expect(scrollOffsetForTimestamp(rows, primetime, anchor)).toBe(0);
    expect(timestampForScrollOffset(rows, 52, 0, primetime)).toBe(Date.parse(programmes[1]!.startAt));
  });

  it('keeps collapse position-coupled and applies the canonical Reduce Motion switch', () => {
    expect(collapseProgressForScrollOffset(100, 100, false)).toBe(0);
    expect(collapseProgressForScrollOffset(128, 100, false)).toBe(0.5);
    expect(collapseProgressForScrollOffset(156, 100, false)).toBe(1);
    expect(collapseProgressForScrollOffset(220, 100, false)).toBe(1);

    expect(collapseProgressForScrollOffset(127, 100, true)).toBe(0);
    expect(collapseProgressForScrollOffset(128, 100, true)).toBe(1);
  });

  it('switches the binary compact context at the canonical collapse midpoint', () => {
    expect(compactContextForCollapseProgress(0)).toBe(false);
    expect(compactContextForCollapseProgress(0.49)).toBe(false);
    expect(compactContextForCollapseProgress(0.5)).toBe(true);
    expect(compactContextForCollapseProgress(1)).toBe(true);
  });

  it('uses canonical rest and settled-condensed functional gaps', () => {
    expect(perChannelFunctionalGapsForCollapseProgress(0)).toEqual({
      stripToContext: 24,
      contextToSchedule: 12,
    });
    expect(perChannelFunctionalGapsForCollapseProgress(1)).toEqual({
      stripToContext: 0,
      contextToSchedule: 0,
    });
  });

  it('keeps the native schedule viewport fixed while visual chrome converges', () => {
    expect(PER_CHANNEL_STABLE_SCROLL_GEOMETRY).toEqual({
      viewportTop: 112,
      contentTopInset: 148,
      wrappedContextDelta: 36,
      scrollCompensation: 92,
    });

    const rest = perChannelStableScrollVisuals(0, false);
    const midpoint = perChannelStableScrollVisuals(0.5, false);
    const condensed = perChannelStableScrollVisuals(1, false);

    expect(rest.overlayBottom).toBe(260);
    expect(midpoint.overlayBottom).toBe(186);
    expect(condensed.overlayBottom).toBe(112);
    expect(rest.contentTranslateY).toBe(0);
    expect(midpoint.contentTranslateY).toBe(-46);
    expect(condensed.contentTranslateY).toBe(-92);

    const wrappedRest = perChannelStableScrollVisuals(0, true);
    const wrappedCondensed = perChannelStableScrollVisuals(1, true);
    expect(wrappedRest.overlayBottom).toBe(296);
    expect(wrappedCondensed.overlayBottom).toBe(148);
    expect(wrappedRest.contentTranslateY).toBe(36);
    expect(wrappedCondensed.contentTranslateY).toBe(-56);
  });

  it('round-trips semantic schedule offsets through the stable native viewport geometry', () => {
    for (const progress of [0, 0.25, 0.5, 1]) {
      const nativeOffset = perChannelNativeOffsetForScheduleOffset(640, progress);
      expect(perChannelScheduleOffsetForNativeOffset(nativeOffset, progress)).toBe(640);
    }

    expect(perChannelNativeOffsetForScheduleOffset(0, 0)).toBe(148);
    expect(perChannelNativeOffsetForScheduleOffset(0, 1)).toBe(56);
  });

  it('uses the accepted Per-zender typography and 72/60 rail geometry', () => {
    expect(GUIDE_TYPOGRAPHY.programmeTitle).toMatchObject({ fontSize: 17, lineHeight: 21 });
    expect(GUIDE_TYPOGRAPHY.currentProgrammeTitle).toMatchObject({ fontSize: 19, lineHeight: 23 });
    expect(GUIDE_TYPOGRAPHY.programmeTime).toMatchObject({ fontSize: 16, lineHeight: 20 });
    expect(GUIDE_TYPOGRAPHY.currentDescription).toMatchObject({ fontSize: 15, lineHeight: 22 });
    expect(PER_CHANNEL_VISUAL_METRICS.channelStripHeight).toBe(72);
    expect(PER_CHANNEL_VISUAL_METRICS.channelStripCondensedHeight).toBe(60);
    expect(PER_CHANNEL_VISUAL_METRICS.channelItemSize).toBe(48);
    expect(PER_CHANNEL_VISUAL_METRICS.channelItemGap).toBe(12);
    expect(GUIDE_VISUAL_METRICS.controlPressOpacity).toBe(0.72);
    expect(PER_CHANNEL_VISUAL_METRICS.stripToUtilitiesGap).toBe(24);
    expect(PER_CHANNEL_VISUAL_METRICS.currentRowHeight).toBe(176);
    expect(PER_CHANNEL_VISUAL_METRICS.currentDescriptionGap).toBe(10);
    expect(PER_CHANNEL_VISUAL_METRICS.currentDescriptionToProgressMinGap).toBe(20);
    expect(PER_CHANNEL_VISUAL_METRICS.currentDescriptionMaxLines).toBe(4);
    expect(PER_CHANNEL_VISUAL_METRICS.progressHeight).toBe(4);
    expect(PER_CHANNEL_VISUAL_METRICS.progressBottomInset).toBe(16);
  });

  it('recentres a selected channel while keeping rail bounds authoritative', () => {
    const viewportWidth = 390;
    const middleOffset = channelRailOffsetForSelection(5, 12, viewportWidth);
    expect(middleOffset).toBe(149);

    const selectedLeft = 20 + 5 * 60 - middleOffset;
    expect(selectedLeft).toBeGreaterThanOrEqual(0);
    expect(selectedLeft + 48).toBeLessThanOrEqual(viewportWidth);

    expect(channelRailOffsetForSelection(0, 12, viewportWidth)).toBe(0);
    expect(channelRailOffsetForSelection(11, 12, viewportWidth)).toBe(358);
  });

  it('uses the same final rail target with Reduce Motion but disables recenter animation', () => {
    const animated = channelRailRecenterPlan(5, 12, 390, false);
    const reduced = channelRailRecenterPlan(5, 12, 390, true);
    expect(reduced.x).toBe(animated.x);
    expect(animated.animated).toBe(true);
    expect(reduced.animated).toBe(false);
  });

  it('derives Nu and Primetime state from semantic programme anchors with Nu precedence', () => {
    const rows = buildProgrammeRows(
      [
        programme('now-context', '2026-09-13T18:00:00.000Z', '2026-09-13T19:00:00.000Z'),
        programme('prime-context', '2026-09-13T19:00:00.000Z', '2026-09-13T22:00:00.000Z'),
      ],
      Date.parse('2026-09-13T18:30:00.000Z'),
      1,
    );
    const selectedDayStartMs = Date.parse('2026-09-13T04:00:00.000Z');
    const nowTimeMs = Date.parse('2026-09-13T18:30:00.000Z');
    const primetimeTimeMs = Date.parse('2026-09-13T20:30:00.000Z');

    expect(
      resolvePerChannelTemporalControlStates({
        rows,
        stableAnchorTimeMs: nowTimeMs,
        selectedDayStartMs,
        nowDayStartMs: selectedDayStartMs,
        nowTimeMs,
        primetimeTimeMs,
      }),
    ).toEqual({ nu: 'active', primetime: 'inactive' });

    expect(
      resolvePerChannelTemporalControlStates({
        rows,
        stableAnchorTimeMs: primetimeTimeMs,
        selectedDayStartMs,
        nowDayStartMs: selectedDayStartMs,
        nowTimeMs,
        primetimeTimeMs,
      }),
    ).toEqual({ nu: 'return', primetime: 'active' });

    const overlapRows = buildProgrammeRows(
      [programme('shared-context', '2026-09-13T18:00:00.000Z', '2026-09-13T22:00:00.000Z')],
      Date.parse('2026-09-13T20:40:00.000Z'),
      1,
    );
    expect(
      resolvePerChannelTemporalControlStates({
        rows: overlapRows,
        stableAnchorTimeMs: primetimeTimeMs,
        selectedDayStartMs,
        nowDayStartMs: selectedDayStartMs,
        nowTimeMs: Date.parse('2026-09-13T20:40:00.000Z'),
        primetimeTimeMs,
      }),
    ).toEqual({ nu: 'active', primetime: 'inactive' });
  });

  it('keeps active distinct from disabled and reserves disabled for unavailable targets', () => {
    const rows = buildProgrammeRows(
      [programme('context', '2026-09-13T19:00:00.000Z', '2026-09-13T22:00:00.000Z')],
      Date.parse('2026-09-13T18:00:00.000Z'),
      1,
    );
    const state = resolvePerChannelTemporalControlStates({
      rows,
      stableAnchorTimeMs: Date.parse('2026-09-13T20:30:00.000Z'),
      selectedDayStartMs: 1,
      nowDayStartMs: 2,
      nowTimeMs: Date.parse('2026-09-13T18:00:00.000Z'),
      primetimeTimeMs: Date.parse('2026-09-13T20:30:00.000Z'),
      nuAvailable: false,
      primetimeAvailable: false,
    });
    expect(state).toEqual({ nu: 'disabled', primetime: 'disabled' });
    expect(state.nu).not.toBe('active');
    expect(state.primetime).not.toBe('active');
  });

  it('uses semantic surface fill only while a full programme row is pressed', () => {
    expect(programmeRowPressBackgroundColor(true, '#surface')).toBe('#surface');
    expect(programmeRowPressBackgroundColor(false, '#surface')).toBe('transparent');
  });

  it('keeps established canonical broadcaster identity while a selected day has no schedule yet', () => {
    const canonicalChannels: Channel[] = [
      { id: 'nl-npo-1', name: 'NPO 1', displayName: 'NPO 1', sortOrder: 0, isActive: true },
      { id: 'nl-rtl-4', name: 'RTL 4', displayName: 'RTL 4', sortOrder: 1, isActive: true },
    ];
    const presentation = resolvePerChannelSchedulePresentation(null, canonicalChannels, fixture);

    expect(presentation.source).toBe('established-channels');
    expect(presentation.channels.map(({ id }) => id)).toEqual(['nl-npo-1', 'nl-rtl-4']);
    expect(presentation.schedule).toBeNull();
    expect(presentation.channels.some(({ id }) => id === 'channel-1')).toBe(false);
  });

  it('replaces only programme ownership when the selected canonical day arrives', () => {
    const canonicalChannels: Channel[] = [
      { id: 'nl-npo-1', name: 'NPO 1', displayName: 'NPO 1', sortOrder: 0, isActive: true },
      { id: 'nl-rtl-4', name: 'RTL 4', displayName: 'RTL 4', sortOrder: 1, isActive: true },
    ];
    const selectedSchedule: GuideSchedule = {
      generatedAt: '2026-09-13T10:00:00.000Z',
      timezone: 'Europe/Amsterdam',
      channels: canonicalChannels,
      programmes: [{
        id: 'rtl-programme',
        channelId: 'nl-rtl-4',
        startAt: '2026-09-13T18:00:00.000Z',
        endAt: '2026-09-13T19:00:00.000Z',
        title: 'RTL programme',
      }],
    };
    const presentation = resolvePerChannelSchedulePresentation(selectedSchedule, canonicalChannels, fixture);

    expect(presentation.source).toBe('selected-schedule');
    expect(presentation.channels).toBe(selectedSchedule.channels);
    expect(presentation.schedule).toBe(selectedSchedule);
    expect(selectedChannelIndexForId(presentation.channels, 'nl-rtl-4')).toBe(1);
    expect(selectedChannelIndexForId([...presentation.channels].reverse(), 'nl-rtl-4')).toBe(0);
    expect(
      perChannelLayoutAnchorKey(dayStart, 'nl-rtl-4', 1, null),
    ).toBeNull();
    expect(
      perChannelLayoutAnchorKey(dayStart, 'nl-rtl-4', 1, selectedSchedule),
    ).toContain('nl-rtl-4');
  });

  it('keeps the deterministic generic fixture valid only when no canonical catalogue exists', () => {
    const presentation = resolvePerChannelSchedulePresentation(null, null, fixture);

    expect(presentation.source).toBe('fixture');
    expect(presentation.schedule).toBe(fixture);
    expect(presentation.channels[0]?.id).toBe('channel-1');
    expect(selectedChannelIndexForId(presentation.channels, 'missing')).toBe(0);
  });

  it('clamps adjacent channel navigation at the lineup edges', () => {
    expect(adjacentChannelIndex(0, -1, 3)).toBe(0);
    expect(adjacentChannelIndex(1, -1, 3)).toBe(0);
    expect(adjacentChannelIndex(1, 1, 3)).toBe(2);
    expect(adjacentChannelIndex(2, 1, 3)).toBe(2);
  });
});
