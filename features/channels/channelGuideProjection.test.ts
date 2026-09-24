import { describe, expect, it } from 'vitest';

import type { GuideSchedule } from '@/data/domain/epg';
import {
  projectGuidePresentation,
  projectGuideScheduleChannels,
} from './channelGuideProjection';

const schedule: GuideSchedule = {
  generatedAt: '2026-09-24T12:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: ['a', 'b', 'c'].map((id, index) => ({
    id,
    name: id,
    displayName: id,
    sortOrder: index,
    isActive: true,
  })),
  programmes: ['a', 'b', 'c'].map((channelId) => ({
    id: `programme-${channelId}`,
    channelId,
    startAt: '2026-09-24T18:00:00.000Z',
    endAt: '2026-09-24T19:00:00.000Z',
    title: channelId,
  })),
};

describe('Guide channel personalisation projection', () => {
  it('applies one selection/order to channels and programmes', () => {
    const projected = projectGuideScheduleChannels(schedule, ['c', 'a']);
    expect(projected.channels.map(({ id }) => id)).toEqual(['c', 'a']);
    expect(projected.programmes.map(({ channelId }) => channelId)).toEqual([
      'a',
      'c',
    ]);
  });

  it('can append one hidden channel as transient Search context without mutating selection', () => {
    const selected = ['c', 'a'] as const;
    const projected = projectGuideScheduleChannels(schedule, selected, ['b']);
    expect(projected.channels.map(({ id }) => id)).toEqual(['c', 'a', 'b']);
    expect(selected).toEqual(['c', 'a']);
  });

  it('leaves the synthetic/non-canonical fallback usable when no selected IDs overlap', () => {
    const projected = projectGuideScheduleChannels(schedule, ['real-1']);
    expect(projected).toEqual(schedule);
  });

  it('projects retained channel identity even while a selected-day schedule is unavailable', () => {
    const presentation = {
      source: 'established-channels' as const,
      channels: schedule.channels,
      schedule: null,
    };
    const projected = projectGuidePresentation(presentation, ['b', 'a']);
    expect(projected.channels.map(({ id }) => id)).toEqual(['b', 'a']);
    expect(projected.schedule).toBeNull();
  });
});
