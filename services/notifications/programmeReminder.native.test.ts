import { beforeEach, describe, expect, it, vi } from 'vitest';

const notifications = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: {
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
  },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

vi.mock('expo-notifications', () => notifications);
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import {
  reconcileProgrammeReminder,
  scheduleProgrammeReminder,
} from './programmeReminder.native';
import { PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS } from './programmeReminderContract';

const channel = {
  id: 'npo1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  sortOrder: 0,
  isActive: true,
};

const programme = {
  id: 'programme-native-reminder',
  channelId: channel.id,
  title: 'Native reminder',
  startAt: '2026-09-18T19:00:00.000Z',
  endAt: '2026-09-18T20:00:00.000Z',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function reminderRecord(overrides: Partial<{
  notificationId: string;
  fireAtMs: number;
  programmeStartAt: string;
}> = {}) {
  return {
    programmeId: programme.id,
    channelId: programme.channelId,
    startAt: programme.startAt,
    endAt: programme.endAt,
    title: programme.title,
    notificationId: overrides.notificationId ?? 'notification-1',
    fireAtMs:
      overrides.fireAtMs ?? Date.parse(programme.startAt) - 5 * 60 * 1000,
    programmeStartAt: overrides.programmeStartAt ?? programme.startAt,
  };
}

beforeEach(() => {
  notifications.setNotificationChannelAsync.mockReset().mockResolvedValue(null);
  notifications.getPermissionsAsync.mockReset().mockResolvedValue({
    granted: false,
    status: 'undetermined',
  });
  notifications.requestPermissionsAsync.mockReset().mockResolvedValue({
    granted: true,
    status: 'granted',
  });
  notifications.scheduleNotificationAsync.mockReset().mockResolvedValue('notification-1');
  notifications.cancelScheduledNotificationAsync.mockReset().mockResolvedValue(undefined);
  notifications.getAllScheduledNotificationsAsync.mockReset().mockResolvedValue([]);
});

describe('native programme reminder scheduling', () => {
  it('recomputes after permission and falls back immediately inside five minutes', async () => {
    const permission = deferred<{ granted: boolean; status: string }>();
    notifications.requestPermissionsAsync.mockReturnValue(permission.promise);

    const startMs = Date.parse(programme.startAt);
    let nowMs = startMs - 5 * 60 * 1000 - 1000;
    const pending = scheduleProgrammeReminder(programme, channel, () => nowMs);

    await vi.waitFor(() => {
      expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    nowMs = startMs - 2 * 60 * 1000;
    permission.resolve({ granted: true, status: 'granted' });

    const result = await pending;
    expect(result).toEqual({
      ok: true,
      notificationId: 'notification-1',
      fireAtMs: nowMs + PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS,
    });

    const request = notifications.scheduleNotificationAsync.mock.calls[0]?.[0];
    expect(request?.content.title).toBe('Begint zo');
    expect((request?.trigger as { date: Date }).date.getTime()).toBe(
      nowMs + PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS,
    );
  });

  it('does not schedule after programme start is crossed during permission', async () => {
    const permission = deferred<{ granted: boolean; status: string }>();
    notifications.requestPermissionsAsync.mockReturnValue(permission.promise);

    const startMs = Date.parse(programme.startAt);
    let nowMs = startMs - 5 * 60 * 1000 - 1000;
    const pending = scheduleProgrammeReminder(programme, channel, () => nowMs);

    await vi.waitFor(() => {
      expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    nowMs = startMs;
    permission.resolve({ granted: true, status: 'granted' });

    await expect(pending).resolves.toEqual({ ok: false, reason: 'started' });
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('native programme reminder reconciliation', () => {
  it('keeps metadata when native enumeration is indeterminate', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    notifications.getAllScheduledNotificationsAsync.mockRejectedValue(
      new Error('native unavailable'),
    );

    await expect(
      reconcileProgrammeReminder(reminderRecord(), programme, () => nowMs),
    ).resolves.toEqual({
      status: 'indeterminate',
      reason: 'native-query-failed',
      presentActive: true,
    });
  });

  it('keeps a stale identifier but does not present active when cancellation is unconfirmed', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    notifications.cancelScheduledNotificationAsync.mockRejectedValue(
      new Error('cancel failed'),
    );

    await expect(
      reconcileProgrammeReminder(
        reminderRecord({ programmeStartAt: '2026-09-18T18:55:00.000Z' }),
        programme,
        () => nowMs,
      ),
    ).resolves.toEqual({
      status: 'indeterminate',
      reason: 'cancellation-unconfirmed',
      presentActive: false,
    });
  });

  it('returns verified-invalid only when absence or stale cancellation is confirmed', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;

    await expect(
      reconcileProgrammeReminder(
        reminderRecord({ programmeStartAt: '2026-09-18T18:55:00.000Z' }),
        programme,
        () => nowMs,
      ),
    ).resolves.toEqual({ status: 'verified-invalid' });

    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    await expect(
      reconcileProgrammeReminder(reminderRecord(), programme, () => nowMs),
    ).resolves.toEqual({ status: 'verified-invalid' });

    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: 'notification-1' },
    ]);
    await expect(
      reconcileProgrammeReminder(reminderRecord(), programme, () => nowMs),
    ).resolves.toEqual({ status: 'verified-valid' });
  });
});
