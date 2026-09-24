import type { Channel } from '@/data/domain/epg';
import {
  canonicalGuideSearchQuery,
  normalizeGuideSearchText,
} from '@/data/domain/search';

export const CHANNEL_MANAGEMENT_METRICS = {
  screenInsetX: 20,
  navigationHeight: 48,
  searchMinHeight: 48,
  searchRadius: 12,
  searchPaddingX: 12,
  sectionGap: 28,
  sectionHeaderGap: 8,
  visibilityZoneWidth: 48,
  dragZoneWidth: 48,
  logoWidth: 40,
  logoHeight: 32,
  logoNameGap: 12,
  rowBaseMinHeight: 56,
  rowVerticalPadding: 10,
  rowBaseLineHeight: 20,
  visibilityPressedDiameter: 36,
  visibilityPressedRadius: 18,
  visibilityIconBox: 24,
  visibilityEyeWidth: 20,
  visibilityEyeHeight: 14,
  visibilityStrokeWidth: 1.8,
  visibilityPupilSize: 5,
  dragGlyphWidth: 18,
  dragGlyphHeight: 14,
  dragStrokeWidth: 1.5,
  insertionLineHeight: 2,
  dragLongPressMs: 220,
  dragPreactivationTolerance: 8,
  neighbourAnimationMs: 160,
  zoneTransitionMs: 160,
  pickedScale: 1.02,
  pickedOpacity: 0.98,
  pickedRadius: 12,
  pickedShadowRadius: 10,
  pickedShadowOffsetY: 4,
  androidPickedElevation: 6,
  autoScrollEdge: 72,
  autoScrollMaxVelocity: 900,
  dropSpring: {
    damping: 24,
    stiffness: 280,
    mass: 0.8,
  },
} as const;

export type ChannelManagementRowMetrics = {
  effectiveFontScale: number;
  minHeight: number;
  nameLines: 1 | 2;
};

export type ChannelManagementZones = {
  visible: Channel[];
  hidden: Channel[];
};

export type ChannelManagementAccessibilityAction = {
  name: 'hide' | 'show' | 'moveUp' | 'moveDown';
  label: string;
};

export type ChannelManagementFocusOutcome =
  | { type: 'channel'; channelId: string }
  | { type: 'visible-heading' }
  | { type: 'hidden-heading' };

export type ChannelManagementMotionProfile = {
  pickedScale: number;
  pickedShadow: boolean;
  neighbourDurationMs: number;
  settleImmediately: boolean;
};

function effectiveScale(fontScale: number): number {
  return Number.isFinite(fontScale) && fontScale > 0
    ? Math.max(1, fontScale)
    : 1;
}

export function channelManagementRowMetrics(
  fontScale: number,
): ChannelManagementRowMetrics {
  const effectiveFontScale = effectiveScale(fontScale);
  return {
    effectiveFontScale,
    minHeight: Math.max(
      CHANNEL_MANAGEMENT_METRICS.rowBaseMinHeight,
      Math.ceil(
        CHANNEL_MANAGEMENT_METRICS.rowBaseLineHeight * effectiveFontScale + 28,
      ),
    ),
    nameLines: effectiveFontScale <= 1.35 ? 1 : 2,
  };
}

function channelMatchesQuery(channel: Channel, query: string): boolean {
  const canonicalQuery = canonicalGuideSearchQuery(query);
  const normalizedQuery = normalizeGuideSearchText(canonicalQuery);
  if (!normalizedQuery) return true;
  const compactQuery = normalizedQuery.replace(/\s+/g, '');

  return [
    channel.displayName,
    channel.name,
    channel.shortName ?? '',
  ].some((candidate) => {
    const normalizedCandidate = normalizeGuideSearchText(candidate);
    return (
      normalizedCandidate.includes(normalizedQuery) ||
      normalizedCandidate.replace(/\s+/g, '').includes(compactQuery)
    );
  });
}

export function channelManagementZones(
  catalog: readonly Channel[],
  selectedChannelIds: readonly string[],
  query = '',
): ChannelManagementZones {
  const byId = new Map(catalog.map((channel) => [channel.id, channel]));
  const selectedSet = new Set(selectedChannelIds);

  const visible = selectedChannelIds
    .map((id) => byId.get(id))
    .filter((channel): channel is Channel => Boolean(channel))
    .filter((channel) => channelMatchesQuery(channel, query));

  const hidden = catalog
    .filter(({ id }) => !selectedSet.has(id))
    .filter((channel) => channelMatchesQuery(channel, query));

  return { visible, hidden };
}

export function channelManagementQueryActive(query: string): boolean {
  return normalizeGuideSearchText(query).length > 0;
}

export function channelManagementSectionCount(
  filteredCount: number,
  totalCount: number,
  queryActive: boolean,
): string {
  if (queryActive) return `${filteredCount} van ${totalCount}`;
  return totalCount === 1 ? '1 zender' : `${totalCount} zenders`;
}

export function reorderChannelIdsToIndex(
  order: readonly string[],
  channelId: string,
  toIndex: number,
): string[] {
  const from = order.indexOf(channelId);
  if (from < 0) return [...order];

  const clamped = Math.max(0, Math.min(order.length - 1, Math.trunc(toIndex)));
  if (from === clamped) return [...order];

  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved!);
  return next;
}

export function channelManagementInsertionIndex(
  order: readonly string[],
  draggedChannelId: string,
  pointerYWithinVisibleList: number,
  measuredHeights: Readonly<Record<string, number>>,
  fallbackRowHeight: number,
): number {
  const remaining = order.filter((id) => id !== draggedChannelId);
  if (remaining.length === 0) return 0;

  const y = Math.max(0, pointerYWithinVisibleList);
  let cursor = 0;

  for (let index = 0; index < remaining.length; index += 1) {
    const id = remaining[index]!;
    const height = Math.max(1, measuredHeights[id] ?? fallbackRowHeight);
    if (y < cursor + height / 2) return index;
    cursor += height;
  }

  // remaining.length is also the final index after inserting the dragged row.
  // This hard cap means the hidden zone can never become a legal destination.
  return remaining.length;
}

export function channelManagementSlotTop(
  order: readonly string[],
  draggedChannelId: string,
  toIndex: number,
  measuredHeights: Readonly<Record<string, number>>,
  fallbackRowHeight: number,
): number {
  const finalOrder = reorderChannelIdsToIndex(order, draggedChannelId, toIndex);
  const finalIndex = finalOrder.indexOf(draggedChannelId);
  let top = 0;
  for (let index = 0; index < finalIndex; index += 1) {
    const id = finalOrder[index]!;
    top += Math.max(1, measuredHeights[id] ?? fallbackRowHeight);
  }
  return top;
}

export function channelManagementAutoScrollVelocity(
  pointerYWithinViewport: number,
  viewportHeight: number,
): number {
  if (!(viewportHeight > 0)) return 0;

  const edge = CHANNEL_MANAGEMENT_METRICS.autoScrollEdge;
  const max = CHANNEL_MANAGEMENT_METRICS.autoScrollMaxVelocity;

  const topDistance = pointerYWithinViewport;
  if (topDistance < edge) {
    const proximity = Math.max(0, Math.min(1, (edge - topDistance) / edge));
    return -max * proximity * proximity;
  }

  const bottomDistance = viewportHeight - pointerYWithinViewport;
  if (bottomDistance < edge) {
    const proximity = Math.max(0, Math.min(1, (edge - bottomDistance) / edge));
    return max * proximity * proximity;
  }

  return 0;
}

export function clampChannelManagementScrollOffset(
  offset: number,
  maxOffset: number,
): number {
  return Math.max(0, Math.min(Math.max(0, maxOffset), offset));
}

export function commitChannelManagementDrop(
  order: readonly string[],
  channelId: string,
  targetIndex: number,
  commit: (channelId: string, toIndex: number) => void,
): boolean {
  const from = order.indexOf(channelId);
  if (from < 0) return false;

  const target = Math.max(
    0,
    Math.min(order.length - 1, Math.trunc(targetIndex)),
  );
  if (from === target) return false;

  commit(channelId, target);
  return true;
}

export function visibleChannelAccessibilityLabel(
  channelName: string,
  index: number,
  total: number,
): string {
  return `${channelName}, zichtbaar, positie ${index + 1} van ${total}`;
}

export function hiddenChannelAccessibilityLabel(channelName: string): string {
  return `${channelName}, verborgen`;
}

export function channelManagementAccessibilityActions({
  visible,
  index,
  total,
  reorderEnabled,
  canHide,
}: {
  visible: boolean;
  index: number;
  total: number;
  reorderEnabled: boolean;
  canHide: boolean;
}): ChannelManagementAccessibilityAction[] {
  if (!visible) return [{ name: 'show', label: 'Toon zender' }];

  const actions: ChannelManagementAccessibilityAction[] = [];
  if (canHide) actions.push({ name: 'hide', label: 'Verberg zender' });
  if (reorderEnabled && index > 0) {
    actions.push({ name: 'moveUp', label: 'Verplaats omhoog' });
  }
  if (reorderEnabled && index < total - 1) {
    actions.push({ name: 'moveDown', label: 'Verplaats omlaag' });
  }
  return actions;
}

export function channelManagementFocusAfterHide(
  visibleChannelIds: readonly string[],
  hiddenChannelId: string,
): ChannelManagementFocusOutcome {
  const index = visibleChannelIds.indexOf(hiddenChannelId);
  if (index < 0) return { type: 'visible-heading' };

  const next = visibleChannelIds[index + 1] ?? visibleChannelIds[index - 1];
  return next
    ? { type: 'channel', channelId: next }
    : { type: 'visible-heading' };
}

export function channelManagementFocusAfterShow(
  hiddenChannelIds: readonly string[],
  shownChannelId: string,
): ChannelManagementFocusOutcome {
  const index = hiddenChannelIds.indexOf(shownChannelId);
  if (index < 0) return { type: 'hidden-heading' };

  const next = hiddenChannelIds[index + 1] ?? hiddenChannelIds[index - 1];
  return next
    ? { type: 'channel', channelId: next }
    : { type: 'hidden-heading' };
}

export function channelManagementMotionProfile(
  reduceMotion: boolean,
): ChannelManagementMotionProfile {
  return reduceMotion
    ? {
        pickedScale: 1,
        pickedShadow: false,
        neighbourDurationMs: 0,
        settleImmediately: true,
      }
    : {
        pickedScale: CHANNEL_MANAGEMENT_METRICS.pickedScale,
        pickedShadow: true,
        neighbourDurationMs: CHANNEL_MANAGEMENT_METRICS.neighbourAnimationMs,
        settleImmediately: false,
      };
}
