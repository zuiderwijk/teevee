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
const exactAlarm = vi.hoisted(() => ({
  get: vi.fn(),
  request: vi.fn(),
}));

vi.mock('expo-notifications', () => notifications);
vi.mock('react-native', () => ({ Platform: { OS: 'android', Version: 36 } }));
vi.mock('./exactAlarmCapability.native', () => ({
  getExactAlarmCapability: exactAlarm.get,
  requestExactAlarmCapability: exactAlarm.request,
}));

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
  exactAlarm.get.mockReset().mockReturnValue('available');
  exactAlarm.request.mockReset().mockResolvedValue('available');
});

describe('native programme reminder scheduling', () => {
  it('schedules only after Android exact-alarm capability is established', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;

    await expect(
      scheduleProgrammeReminder(programme, channel, () => nowMs),
    ).resolves.toMatchObject({ ok: true, notificationId: 'notification-1' });

    expect(exactAlarm.get).toHaveBeenCalledTimes(2);
    expect(exactAlarm.request).not.toHaveBeenCalled();
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('fails closed and does not schedule when exact-alarm special access is still missing', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    exactAlarm.get.mockReturnValue('unavailable');
    exactAlarm.request.mockResolvedValue('unavailable');

    await expect(
      scheduleProgrammeReminder(programme, channel, () => nowMs),
    ).resolves.toEqual({ ok: false, reason: 'exact-alarm' });

    expect(exactAlarm.request).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('continues scheduling after the user returns with exact-alarm access granted', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    exactAlarm.get
      .mockReturnValueOnce('unavailable')
      .mockReturnValueOnce('available');
    exactAlarm.request.mockResolvedValue('available');

    await expect(
      scheduleProgrammeReminder(programme, channel, () => nowMs),
    ).resolves.toMatchObject({ ok: true, notificationId: 'notification-1' });

    expect(exactAlarm.request).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('fails closed if exact-alarm access is revoked before the native schedule call', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    exactAlarm.get
      .mockReturnValueOnce('available')
      .mockReturnValueOnce('unavailable');

    await expect(
      scheduleProgrammeReminder(programme, channel, () => nowMs),
    ).resolves.toEqual({ ok: false, reason: 'exact-alarm' });

    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

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
  it('cancels the native request before invalidating a reminder after exact-alarm revocation', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    exactAlarm.get.mockReturnValue('unavailable');
    const cancellation = deferred<void>();
    notifications.cancelScheduledNotificationAsync.mockReturnValue(
      cancellation.promise,
    );

    let reconciled = false;
    const pending = reconcileProgrammeReminder(
      reminderRecord(),
      programme,
      () => nowMs,
    ).then((result) => {
      reconciled = true;
      return result;
    });

    await vi.waitFor(() => {
      expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'notification-1',
      );
    });
    expect(reconciled).toBe(false);

    cancellation.resolve();

    await expect(pending).resolves.toEqual({ status: 'verified-invalid' });
    expect(notifications.getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  it('keeps a revoked reminder inactive and retains its cleanup handle when native cancellation fails', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    exactAlarm.get.mockReturnValue('unavailable');
    notifications.cancelScheduledNotificationAsync.mockRejectedValue(
      new Error('cancel failed'),
    );

    await expect(
      reconcileProgrammeReminder(reminderRecord(), programme, () => nowMs),
    ).resolves.toEqual({
      status: 'indeterminate',
      reason: 'cancellation-unconfirmed',
      presentActive: false,
    });

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'notification-1',
    );
    expect(notifications.getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  it('keeps metadata inactive when exact-alarm capability cannot be established', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;
    exactAlarm.get.mockReturnValue('indeterminate');

    await expect(
      reconcileProgrammeReminder(reminderRecord(), programme, () => nowMs),
    ).resolves.toEqual({
      status: 'indeterminate',
      reason: 'exact-alarm-capability-unknown',
      presentActive: false,
    });
  });

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
