import { describe, expect, it } from 'vitest';

import type { Channel, GuideFixture, GuideSchedule } from '@/data/domain/epg';
import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';
import { darkTheme, lightTheme } from '@/theme/tokens';

import {
  TOTAAL_TYPOGRAPHY,
  TOTAAL_VISUAL_METRICS,
  resolveTotaalSchedulePresentation,
  totaalChannelIdForScheduleOffset,
  totaalChannelIdentityAccessible,
  totaalChromeCondensedForProgress,
  totaalCollapseProgressForScrollOffset,
  totaalCurrentTimeMarkerBodyX,
  totaalNativeOffsetForScheduleOffset,
  totaalProgrammeContentPresentation,
  totaalProgrammePressBackgroundColor,
  totaalProgrammeSecondaryLabel,
  totaalPreservedChannelScheduleOffset,
  totaalSafeAreaLayout,
  totaalScheduleOffsetForNativeOffset,
  totaalStableScrollGeometry,
  totaalStableScrollVisuals,
  totaalTimeAxisTickPresentation,
} from './totaal';

const channel: Channel = {
  id: 'one',
  name: 'NPO 1',
  displayName: 'NPO 1',
  sortOrder: 0,
  isActive: true,
};

const selectedSchedule: GuideSchedule = {
  generatedAt: 'selected',
  timezone: 'Europe/Amsterdam',
  channels: [channel],
  programmes: [],
};

const fixture: GuideFixture = {
  generatedAt: 'fixture',
  timezone: 'Europe/Amsterdam',
  channels: [{ ...channel, id: 'fixture' }],
  programmes: [],
};

describe('Totaal production calibration', () => {
  it('freezes the persistent stack, rail identity and marker geometry', () => {
    expect(TOTAAL_VISUAL_METRICS.dayContextHeight).toBe(52);
    expect(TOTAAL_VISUAL_METRICS.timeAxisHeight).toBe(44);
    expect(TOTAAL_VISUAL_METRICS.persistentStackHeight).toBe(96);
    expect(TOTAAL_VISUAL_METRICS.viewedTimeAnchor).toBe(120);
    expect(TOTAAL_VISUAL_METRICS.channelLogoMaxWidth).toBe(48);
    expect(TOTAAL_VISUAL_METRICS.channelLogoMaxHeight).toBe(36);
    expect(TOTAAL_VISUAL_METRICS.currentMarkerBodyHeight).toBe(18);
    expect(TOTAAL_VISUAL_METRICS.currentMarkerMinWidth).toBe(38);
    expect(TOTAAL_VISUAL_METRICS.currentMarkerPointerWidth).toBe(6);
    expect(TOTAAL_VISUAL_METRICS.currentMarkerPointerHeight).toBe(4);
  });

  it('uses Instrument Sans Medium/Semibold/Regular for the production programme hierarchy', () => {
    expect(TOTAAL_TYPOGRAPHY.programmeTitle).toEqual({
      fontFamily: TEEVEE_FONT_FAMILIES.medium,
      fontSize: 15,
      lineHeight: 19,
    });
    expect(TOTAAL_TYPOGRAPHY.currentProgrammeTitle).toEqual({
      fontFamily: TEEVEE_FONT_FAMILIES.semibold,
      fontSize: 15,
      lineHeight: 19,
    });
    expect(TOTAAL_TYPOGRAPHY.programmeSecondary).toEqual({
      fontFamily: TEEVEE_FONT_FAMILIES.regular,
      fontSize: 13,
      lineHeight: 18,
    });
  });

  it('uses current end-time copy and non-current start-time copy', () => {
    expect(totaalProgrammeSecondaryLabel(true, '20:00', '20:30')).toBe('tot 20:30');
    expect(totaalProgrammeSecondaryLabel(false, '20:00', '20:30')).toBe('20:00');
  });

  it('degrades programme content at the frozen visible-remainder thresholds', () => {
    expect(totaalProgrammeContentPresentation(51)).toEqual({
      paddingX: 6,
      titleLines: 1,
      showSecondary: false,
      mode: 'compact',
    });
    expect(totaalProgrammeContentPresentation(63.99).mode).toBe('compact');
    expect(totaalProgrammeContentPresentation(64)).toEqual({
      paddingX: 8,
      titleLines: 1,
      showSecondary: true,
      mode: 'standard',
    });
    expect(totaalProgrammeContentPresentation(125.99).mode).toBe('standard');
    expect(totaalProgrammeContentPresentation(126)).toEqual({
      paddingX: 10,
      titleLines: 2,
      showSecondary: true,
      mode: 'comfortable',
    });
  });

  it('keeps channel identity non-redundant in normal rows but accessible without programme actions', () => {
    expect(totaalChannelIdentityAccessible(3)).toBe(false);
    expect(totaalChannelIdentityAccessible(1)).toBe(false);
    expect(totaalChannelIdentityAccessible(0)).toBe(true);
  });

  it('keeps permanent programme background transparent and pressed state semantic', () => {
    expect(totaalProgrammePressBackgroundColor(false, '#fff')).toBe('transparent');
    expect(totaalProgrammePressBackgroundColor(true, '#fff')).toBe('#fff');
    expect(TOTAAL_VISUAL_METRICS.programmeBoundaryWidth).toBe(1);
    expect(TOTAAL_VISUAL_METRICS.programmeBoundaryOpacity).toBe(0.55);
    expect(TOTAAL_VISUAL_METRICS.programmeBoundaryInsetY).toBe(10);
  });

  it('uses the 15-minute axis hierarchy with labels at major half-hours only', () => {
    const hour = totaalTimeAxisTickPresentation(Date.parse('2026-09-21T18:00:00Z'));
    const quarter = totaalTimeAxisTickPresentation(Date.parse('2026-09-21T18:15:00Z'));
    const half = totaalTimeAxisTickPresentation(Date.parse('2026-09-21T18:30:00Z'));
    const threeQuarter = totaalTimeAxisTickPresentation(Date.parse('2026-09-21T18:45:00Z'));

    expect(hour).toEqual({ major: true, tickHeight: 10, tickOpacity: 0.78 });
    expect(half).toEqual(hour);
    expect(quarter).toEqual({ major: false, tickHeight: 6, tickOpacity: 0.5 });
    expect(threeQuarter).toEqual(quarter);
    expect(TOTAAL_VISUAL_METRICS.axisBaselineHeight).toBe(1);
    expect(TOTAAL_VISUAL_METRICS.axisBaselineOpacity).toBe(0.42);
  });

  it('centres the current marker body while keeping its pointer on exact time at viewport edges', () => {
    expect(totaalCurrentTimeMarkerBodyX(120, 300, 38)).toBe(101);
    expect(totaalCurrentTimeMarkerBodyX(3, 300, 38)).toBe(0);
    expect(totaalCurrentTimeMarkerBodyX(298, 300, 38)).toBe(262);
  });

  it('uses fixed native viewport geometry with 196/212 rest and 96 settled endpoints', () => {
    expect(totaalStableScrollGeometry(1)).toEqual({
      viewportTop: 96,
      contentTopInset: 100,
      scrollCompensation: 44,
    });
    expect(totaalStableScrollGeometry(1.5)).toEqual({
      viewportTop: 96,
      contentTopInset: 116,
      scrollCompensation: 60,
    });
    expect(totaalStableScrollVisuals(0, 1)).toEqual({
      overlayBottom: 196,
      contentTranslateY: 0,
    });
    expect(totaalStableScrollVisuals(1, 1)).toEqual({
      overlayBottom: 96,
      contentTranslateY: -44,
    });
    expect(totaalStableScrollVisuals(0, 1.5)).toEqual({
      overlayBottom: 212,
      contentTranslateY: 0,
    });
    expect(totaalStableScrollVisuals(1, 1.5)).toEqual({
      overlayBottom: 96,
      contentTranslateY: -60,
    });
  });

  it('collapses across 56 pt and switches discretely at 28 pt for Reduce Motion', () => {
    expect(totaalCollapseProgressForScrollOffset(0, false)).toBe(0);
    expect(totaalCollapseProgressForScrollOffset(28, false)).toBe(0.5);
    expect(totaalCollapseProgressForScrollOffset(56, false)).toBe(1);
    expect(totaalCollapseProgressForScrollOffset(27.99, true)).toBe(0);
    expect(totaalCollapseProgressForScrollOffset(28, true)).toBe(1);
    expect(totaalChromeCondensedForProgress(0.49)).toBe(false);
    expect(totaalChromeCondensedForProgress(0.5)).toBe(true);
  });

  it('preserves semantic channel context without snapping when catalogue order is unchanged', () => {
    const previous = ['npo-1', 'npo-2', 'rtl-4'];
    expect(totaalChannelIdForScheduleOffset(previous, 76, 98)).toBe('npo-2');
    expect(
      totaalPreservedChannelScheduleOffset({
        previousChannelIds: previous,
        nextChannelIds: previous,
        channelId: 'npo-2',
        previousRowHeight: 76,
        nextRowHeight: 76,
        currentScheduleOffset: 98,
      }),
    ).toBe(98);
  });

  it('preserves the same semantic channel and intra-row context across catalogue reorder and row growth', () => {
    expect(
      totaalPreservedChannelScheduleOffset({
        previousChannelIds: ['npo-1', 'npo-2', 'rtl-4'],
        nextChannelIds: ['rtl-4', 'npo-1', 'npo-2'],
        channelId: 'npo-2',
        previousRowHeight: 76,
        nextRowHeight: 97,
        currentScheduleOffset: 76 + 22,
      }),
    ).toBe(97 * 2 + 22);
  });

  it('keeps semantic schedule offset isolated from the 56-pt native collapse', () => {
    expect(totaalNativeOffsetForScheduleOffset(152, 1)).toBe(208);
    expect(totaalScheduleOffsetForNativeOffset(208, 1)).toBe(152);
    expect(totaalNativeOffsetForScheduleOffset(152, 0)).toBe(152);
    expect(totaalScheduleOffsetForNativeOffset(152, 0)).toBe(152);
  });

  it('keeps the native schedule viewport fixed below safe area plus the 96-pt stack', () => {
    expect(totaalSafeAreaLayout(59, 1)).toEqual({
      overlayTop: 59,
      scheduleViewportTop: 155,
    });
  });

  it('retains established channel identity without fabricating programmes while a selected day is unavailable', () => {
    expect(resolveTotaalSchedulePresentation(selectedSchedule, [channel], fixture)).toEqual({
      channels: selectedSchedule.channels,
      schedule: selectedSchedule,
      source: 'selected-schedule',
    });
    expect(resolveTotaalSchedulePresentation(null, [channel], fixture)).toEqual({
      channels: [channel],
      schedule: null,
      source: 'established-channels',
    });
    expect(resolveTotaalSchedulePresentation(null, null, fixture)).toEqual({
      channels: fixture.channels,
      schedule: fixture,
      source: 'fixture',
    });
  });

  it('uses semantic light/dark canvas and a theme-invariant on-current-time foreground', () => {
    expect(lightTheme.colors.background).toBe('#F7F7F5');
    expect(darkTheme.colors.background).toBe('#10100F');
    expect(lightTheme.colors.onCurrentTime).toBe('#0D0D0D');
    expect(darkTheme.colors.onCurrentTime).toBe('#0D0D0D');
    expect(lightTheme.colors.programme).toBe('#EFEFEB');
    expect(darkTheme.colors.programmeCurrent).toBe('#30302D');
  });
});
