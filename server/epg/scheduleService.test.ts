import { describe, expect, it, vi } from 'vitest';

import type { GuideSchedule } from '../../data/domain/epg';
import { RepositoryGuideScheduleApi } from './scheduleService';

const schedule: GuideSchedule = {
  generatedAt: '2026-09-22T17:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  channels: [
    {
      id: 'nl-npo-1',
      name: 'NPO 1',
      displayName: 'NPO 1',
      sortOrder: 1,
      isActive: true,
    },
  ],
  programmes: [
    {
      id: 'programme-1',
      channelId: 'nl-npo-1',
      startAt: '2026-09-22T18:00:00.000Z',
      endAt: '2026-09-22T19:00:00.000Z',
      title: 'Nieuws',
    },
  ],
};

const request = {
  from: '2026-09-22T16:00:00.000Z',
  to: '2026-09-23T04:00:00.000Z',
};

describe('RepositoryGuideScheduleApi editorial composition', () => {
  it('returns stored signals beside an independently valid schedule', async () => {
    const api = new RepositoryGuideScheduleApi(
      {
        replaceWindow: vi.fn(),
        getSchedule: vi.fn().mockResolvedValue(schedule),
      },
      {
        replaceSourceSnapshot: vi.fn(),
        getSignalsForProgrammeIds: vi.fn().mockResolvedValue([
          {
            programmeId: 'programme-1',
            type: 'kijktip',
            source: 'tvgids',
            sourceItemId: 'tip-1',
            matchedBy: 'channel-title-start',
          },
        ]),
      },
    );

    await expect(api.getSchedule(request)).resolves.toMatchObject({
      status: 'ok',
      schedule,
      editorialSignals: [{ programmeId: 'programme-1', type: 'kijktip' }],
    });
  });

  it('keeps the Guide schedule available when editorial storage fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const api = new RepositoryGuideScheduleApi(
      {
        replaceWindow: vi.fn(),
        getSchedule: vi.fn().mockResolvedValue(schedule),
      },
      {
        replaceSourceSnapshot: vi.fn(),
        getSignalsForProgrammeIds: vi.fn().mockRejectedValue(
          new Error('editorial store unavailable'),
        ),
      },
    );

    await expect(api.getSchedule(request)).resolves.toEqual({
      status: 'ok',
      schedule,
      editorialSignals: [],
    });
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });

  it('does not query enrichment when canonical schedule coverage is unavailable', async () => {
    const getSignalsForProgrammeIds = vi.fn();
    const api = new RepositoryGuideScheduleApi(
      {
        replaceWindow: vi.fn(),
        getSchedule: vi.fn().mockResolvedValue(null),
      },
      {
        replaceSourceSnapshot: vi.fn(),
        getSignalsForProgrammeIds,
      },
    );

    await expect(api.getSchedule(request)).resolves.toEqual({
      status: 'unavailable',
    });
    expect(getSignalsForProgrammeIds).not.toHaveBeenCalled();
  });
});
