import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  acknowledgeGuideNavigationRequest,
  getGuideNavigationRequest,
  publishGuideNavigationIntent,
  resetGuideNavigationRequestForTests,
  subscribeGuideNavigationRequest,
} from './guideNavigationIntent';

describe('transient Guide navigation intent', () => {
  afterEach(() => resetGuideNavigationRequestForTests());

  it('publishes one process-local Per-zender handoff without persistence semantics', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeGuideNavigationRequest(listener);

    const request = publishGuideNavigationIntent({
      type: 'per-channel',
      channelId: 'nl-npo-1',
      referenceAt: '2026-09-23T06:45:00.000Z',
    });

    expect(request.id).toBe(1);
    expect(getGuideNavigationRequest()).toEqual(request);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('acknowledges only the matching request so a newer handoff cannot be cleared by an older screen', () => {
    const first = publishGuideNavigationIntent({
      type: 'per-channel',
      channelId: 'nl-npo-1',
      referenceAt: '2026-09-23T06:45:00.000Z',
    });
    const second = publishGuideNavigationIntent({
      type: 'per-channel',
      channelId: 'nl-rtl-4',
      referenceAt: '2026-09-23T07:00:00.000Z',
    });

    acknowledgeGuideNavigationRequest(first.id);
    expect(getGuideNavigationRequest()).toEqual(second);

    acknowledgeGuideNavigationRequest(second.id);
    expect(getGuideNavigationRequest()).toBeNull();
  });
});
