import { describe, expect, it, vi } from 'vitest';

import type { Channel } from '@/data/domain/epg';
import {
  createChannelPersonalisationPreference,
  setChannelVisibility,
  visibleChannelIdsForPreference,
} from '@/data/domain/channelPersonalisation';
import { darkTheme, lightTheme } from '@/theme/tokens';

import {
  CHANNEL_MANAGEMENT_METRICS,
  channelManagementAccessibilityActions,
  channelManagementAutoScrollVelocity,
  channelManagementFocusAfterHide,
  channelManagementFocusAfterShow,
  channelManagementInsertionIndex,
  channelManagementMotionProfile,
  channelManagementQueryActive,
  channelManagementRowMetrics,
  channelManagementSectionCount,
  channelManagementSlotTop,
  channelManagementZones,
  clampChannelManagementScrollOffset,
  commitChannelManagementDrop,
  hiddenChannelAccessibilityLabel,
  reorderChannelIdsToIndex,
  visibleChannelAccessibilityLabel,
} from './channelManagement';

function channel(
  id: string,
  displayName: string,
  sortOrder: number,
  shortName?: string,
): Channel {
  return {
    id,
    name: displayName,
    displayName,
    ...(shortName ? { shortName } : {}),
    sortOrder,
    isActive: true,
  };
}

const CATALOG = [
  channel('npo-1', 'NPO 1', 1),
  channel('rtl-4', 'RTL 4', 2),
  channel('rtl-5', 'RTL 5', 3),
  channel('bbc-nl', 'BBC NL', 4),
];

describe('channel management interaction contract', () => {
  it('implements the accepted Dynamic Type row formula and two-line threshold', () => {
    expect(channelManagementRowMetrics(0.8)).toEqual({
      effectiveFontScale: 1,
      minHeight: 56,
      nameLines: 1,
    });
    expect(channelManagementRowMetrics(1.35).nameLines).toBe(1);
    expect(channelManagementRowMetrics(1.36)).toEqual({
      effectiveFontScale: 1.36,
      minHeight: 56,
      nameLines: 2,
    });
    expect(channelManagementRowMetrics(2).minHeight).toBe(68);
  });

  it('keeps both sighted control zones at 48pt and exact drag calibration', () => {
    expect(CHANNEL_MANAGEMENT_METRICS.visibilityZoneWidth).toBe(48);
    expect(CHANNEL_MANAGEMENT_METRICS.dragZoneWidth).toBe(48);
    expect(CHANNEL_MANAGEMENT_METRICS.dragLongPressMs).toBe(220);
    expect(CHANNEL_MANAGEMENT_METRICS.dragPreactivationTolerance).toBe(8);
    expect(CHANNEL_MANAGEMENT_METRICS.autoScrollEdge).toBe(72);
    expect(CHANNEL_MANAGEMENT_METRICS.autoScrollMaxVelocity).toBe(900);
  });

  it('keeps visible user order but hidden channels in canonical order', () => {
    const zones = channelManagementZones(
      CATALOG,
      ['rtl-5', 'npo-1'],
    );
    expect(zones.visible.map(({ id }) => id)).toEqual(['rtl-5', 'npo-1']);
    expect(zones.hidden.map(({ id }) => id)).toEqual(['rtl-4', 'bbc-nl']);
  });

  it('moves hide/show between zones and appends shown channels to the visible end', () => {
    const initial = createChannelPersonalisationPreference(CATALOG);
    const hiddenPreference = setChannelVisibility(
      CATALOG,
      initial,
      'rtl-4',
      false,
    );
    expect(
      channelManagementZones(
        CATALOG,
        visibleChannelIdsForPreference(CATALOG, hiddenPreference),
      ),
    ).toMatchObject({
      visible: [
        { id: 'npo-1' },
        { id: 'rtl-5' },
        { id: 'bbc-nl' },
      ],
      hidden: [{ id: 'rtl-4' }],
    });

    const shownPreference = setChannelVisibility(
      CATALOG,
      hiddenPreference,
      'rtl-4',
      true,
    );
    expect(
      visibleChannelIdsForPreference(CATALOG, shownPreference),
    ).toEqual(['npo-1', 'rtl-5', 'bbc-nl', 'rtl-4']);
    expect(
      channelManagementZones(
        CATALOG,
        visibleChannelIdsForPreference(CATALOG, shownPreference),
      ).hidden,
    ).toEqual([]);
  });

  it('filters both zones locally using canonical Search aliases without changing order', () => {
    expect(
      channelManagementZones(CATALOG, ['rtl-5', 'npo-1'], 'RTL5').visible.map(
        ({ id }) => id,
      ),
    ).toEqual(['rtl-5']);
    expect(
      channelManagementZones(CATALOG, ['rtl-5', 'npo-1'], 'BBC.NL').hidden.map(
        ({ id }) => id,
      ),
    ).toEqual(['bbc-nl']);
    expect(channelManagementQueryActive('   ')).toBe(false);
    expect(channelManagementQueryActive('NPO')).toBe(true);
    expect(channelManagementSectionCount(2, 7, true)).toBe('2 van 7');
    expect(channelManagementSectionCount(7, 7, false)).toBe('7 zenders');
  });

  it('reorders a visible channel directly to an arbitrary first/middle/last index', () => {
    const order = ['a', 'b', 'c', 'd'];
    expect(reorderChannelIdsToIndex(order, 'd', 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(reorderChannelIdsToIndex(order, 'a', 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(reorderChannelIdsToIndex(order, 'b', 99)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('persists exactly once only when a completed drop changes index', () => {
    const commit = vi.fn();
    expect(commitChannelManagementDrop(['a', 'b', 'c'], 'a', 2, commit)).toBe(
      true,
    );
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('a', 2);

    expect(commitChannelManagementDrop(['a', 'b', 'c'], 'b', 1, commit)).toBe(
      false,
    );
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('clamps insertion targets to visible slots so hidden rows cannot be destinations', () => {
    const order = ['a', 'b', 'c'];
    const heights = { a: 56, b: 56, c: 56 };
    expect(channelManagementInsertionIndex(order, 'b', -100, heights, 56)).toBe(0);
    expect(channelManagementInsertionIndex(order, 'b', 40, heights, 56)).toBe(1);
    expect(channelManagementInsertionIndex(order, 'b', 9999, heights, 56)).toBe(2);
    expect(channelManagementSlotTop(order, 'b', 2, heights, 56)).toBe(112);
  });

  it('uses the accepted quadratic auto-scroll curve and clamps scroll bounds', () => {
    expect(channelManagementAutoScrollVelocity(72, 600)).toBe(0);
    expect(channelManagementAutoScrollVelocity(0, 600)).toBe(-900);
    expect(channelManagementAutoScrollVelocity(600, 600)).toBe(900);
    expect(channelManagementAutoScrollVelocity(36, 600)).toBe(-225);
    expect(clampChannelManagementScrollOffset(-20, 400)).toBe(0);
    expect(clampChannelManagementScrollOffset(420, 400)).toBe(400);
    expect(clampChannelManagementScrollOffset(200, 400)).toBe(200);
  });

  it('exposes one row semantic with bounded visibility/reorder actions', () => {
    expect(
      visibleChannelAccessibilityLabel('NPO 1', 0, 12),
    ).toBe('NPO 1, zichtbaar, positie 1 van 12');
    expect(hiddenChannelAccessibilityLabel('RTL 5')).toBe('RTL 5, verborgen');

    expect(
      channelManagementAccessibilityActions({
        visible: true,
        index: 0,
        total: 3,
        reorderEnabled: true,
        canHide: true,
      }),
    ).toEqual([
      { name: 'hide', label: 'Verberg zender' },
      { name: 'moveDown', label: 'Verplaats omlaag' },
    ]);

    expect(
      channelManagementAccessibilityActions({
        visible: true,
        index: 1,
        total: 3,
        reorderEnabled: false,
        canHide: true,
      }),
    ).toEqual([{ name: 'hide', label: 'Verberg zender' }]);

    expect(
      channelManagementAccessibilityActions({
        visible: true,
        index: 0,
        total: 1,
        reorderEnabled: true,
        canHide: false,
      }),
    ).toEqual([]);

    expect(
      channelManagementAccessibilityActions({
        visible: false,
        index: 0,
        total: 1,
        reorderEnabled: false,
        canHide: false,
      }),
    ).toEqual([{ name: 'show', label: 'Toon zender' }]);
  });

  it('keeps accessibility focus in the active workflow after hide/show', () => {
    expect(channelManagementFocusAfterHide(['a', 'b', 'c'], 'b')).toEqual({
      type: 'channel',
      channelId: 'c',
    });
    expect(channelManagementFocusAfterHide(['a'], 'a')).toEqual({
      type: 'visible-heading',
    });
    expect(channelManagementFocusAfterShow(['a', 'b', 'c'], 'b')).toEqual({
      type: 'channel',
      channelId: 'c',
    });
    expect(channelManagementFocusAfterShow(['a'], 'a')).toEqual({
      type: 'hidden-heading',
    });
  });

  it('uses dedicated light/dark semantic visibility tokens instead of editorial accent', () => {
    expect(lightTheme.colors.channelVisibilityActive).toBe('#237A57');
    expect(darkTheme.colors.channelVisibilityActive).toBe('#58C592');
    expect(lightTheme.colors.channelVisibilityActive).not.toBe(
      lightTheme.colors.editorialAccent,
    );
    expect(darkTheme.colors.channelVisibilityActive).not.toBe(
      darkTheme.colors.editorialAccent,
    );
  });

  it('removes lift/reflow motion under Reduced Motion while retaining direct tracking', () => {
    expect(channelManagementMotionProfile(false)).toEqual({
      pickedScale: 1.02,
      pickedShadow: true,
      neighbourDurationMs: 160,
      settleImmediately: false,
    });
    expect(channelManagementMotionProfile(true)).toEqual({
      pickedScale: 1,
      pickedShadow: false,
      neighbourDurationMs: 0,
      settleImmediately: true,
    });
  });
});
