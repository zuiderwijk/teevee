import { describe, expect, it } from 'vitest';

import {
  clearChannelDragSessionIfCurrent,
  createChannelDragSession,
  planChannelDragTermination,
  updateChannelDragSessionTarget,
} from './channelDragLifecycle';

describe('channel drag lifecycle', () => {
  it('terminates a changed-position drop with one persistence effect and drop haptic', () => {
    const session = updateChannelDragSessionTarget(
      createChannelDragSession({
        token: 1,
        channelId: 'a',
        originalIndex: 0,
        height: 56,
      }),
      2,
    );

    expect(planChannelDragTermination(session, ['a', 'b', 'c'], 'drop')).toEqual({
      sessionToken: 1,
      channelId: 'a',
      settleIndex: 2,
      persistToIndex: 2,
      emitDropHaptic: true,
      stopAutoScroll: true,
      nextSession: null,
    });
  });

  it('terminates a no-op drop without persistence or changed-drop haptic', () => {
    const session = createChannelDragSession({
      token: 2,
      channelId: 'b',
      originalIndex: 1,
      height: 56,
    });

    expect(planChannelDragTermination(session, ['a', 'b', 'c'], 'drop')).toEqual({
      sessionToken: 2,
      channelId: 'b',
      settleIndex: 1,
      persistToIndex: null,
      emitDropHaptic: false,
      stopAutoScroll: true,
      nextSession: null,
    });
  });

  it('cancels back to the original live slot without persistence or haptic', () => {
    const session = updateChannelDragSessionTarget(
      createChannelDragSession({
        token: 3,
        channelId: 'b',
        originalIndex: 1,
        height: 56,
      }),
      2,
    );

    expect(planChannelDragTermination(session, ['a', 'b', 'c'], 'cancel')).toEqual({
      sessionToken: 3,
      channelId: 'b',
      settleIndex: 1,
      persistToIndex: null,
      emitDropHaptic: false,
      stopAutoScroll: true,
      nextSession: null,
    });
  });

  it('cannot let a stale settle completion clear a newer drag session', () => {
    const newer = createChannelDragSession({
      token: 5,
      channelId: 'c',
      originalIndex: 2,
      height: 56,
    });

    expect(clearChannelDragSessionIfCurrent(newer, 4)).toBe(newer);
    expect(clearChannelDragSessionIfCurrent(newer, 5)).toBeNull();
    expect(clearChannelDragSessionIfCurrent(null, 5)).toBeNull();
  });

  it('preserves first and last legal drop targets', () => {
    const first = updateChannelDragSessionTarget(
      createChannelDragSession({
        token: 6,
        channelId: 'c',
        originalIndex: 2,
        height: 56,
      }),
      0,
    );
    const last = updateChannelDragSessionTarget(
      createChannelDragSession({
        token: 7,
        channelId: 'a',
        originalIndex: 0,
        height: 56,
      }),
      99,
    );

    expect(planChannelDragTermination(first, ['a', 'b', 'c'], 'drop').settleIndex).toBe(0);
    expect(planChannelDragTermination(last, ['a', 'b', 'c'], 'drop').settleIndex).toBe(2);
  });

  it('has synchronous terminal ownership independent of motion policy', () => {
    const session = createChannelDragSession({
      token: 8,
      channelId: 'a',
      originalIndex: 0,
      height: 56,
    });
    const normal = planChannelDragTermination(session, ['a', 'b'], 'cancel');
    const reducedMotion = planChannelDragTermination(session, ['a', 'b'], 'cancel');

    expect(normal.nextSession).toBeNull();
    expect(reducedMotion.nextSession).toBeNull();
    expect(normal.stopAutoScroll).toBe(true);
    expect(reducedMotion.stopAutoScroll).toBe(true);
  });
});
