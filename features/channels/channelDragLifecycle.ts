export type ChannelDragSession = {
  token: number;
  channelId: string;
  originalIndex: number;
  targetIndex: number;
  height: number;
};

export type ChannelDragTerminationKind = 'drop' | 'cancel';

export type ChannelDragTerminationPlan = {
  sessionToken: number;
  channelId: string;
  settleIndex: number;
  persistToIndex: number | null;
  emitDropHaptic: boolean;
  stopAutoScroll: true;
  nextSession: null;
};

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, Math.trunc(index)));
}

export function createChannelDragSession({
  token,
  channelId,
  originalIndex,
  height,
}: {
  token: number;
  channelId: string;
  originalIndex: number;
  height: number;
}): ChannelDragSession {
  return {
    token,
    channelId,
    originalIndex,
    targetIndex: originalIndex,
    height,
  };
}

export function updateChannelDragSessionTarget(
  session: ChannelDragSession,
  targetIndex: number,
): ChannelDragSession {
  if (session.targetIndex === targetIndex) return session;
  return { ...session, targetIndex };
}

export function planChannelDragTermination(
  session: ChannelDragSession,
  order: readonly string[],
  kind: ChannelDragTerminationKind,
): ChannelDragTerminationPlan {
  const currentIndex = order.indexOf(session.channelId);
  const originalIndex =
    currentIndex >= 0
      ? currentIndex
      : clampIndex(session.originalIndex, Math.max(order.length, 1));

  if (kind === 'cancel') {
    return {
      sessionToken: session.token,
      channelId: session.channelId,
      settleIndex: originalIndex,
      persistToIndex: null,
      emitDropHaptic: false,
      stopAutoScroll: true,
      nextSession: null,
    };
  }

  const targetIndex = clampIndex(session.targetIndex, Math.max(order.length, 1));
  const changed = currentIndex >= 0 && targetIndex !== currentIndex;

  return {
    sessionToken: session.token,
    channelId: session.channelId,
    settleIndex: changed ? targetIndex : originalIndex,
    persistToIndex: changed ? targetIndex : null,
    emitDropHaptic: changed,
    stopAutoScroll: true,
    nextSession: null,
  };
}

export function clearChannelDragSessionIfCurrent(
  current: ChannelDragSession | null,
  sessionToken: number,
): ChannelDragSession | null {
  if (!current || current.token !== sessionToken) return current;
  return null;
}
