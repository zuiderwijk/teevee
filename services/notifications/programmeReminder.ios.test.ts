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
vi.mock('react-native', () => ({ Platform: { OS: 'ios', Version: '18.0' } }));
vi.mock('./exactAlarmCapability.native', () => ({
  getExactAlarmCapability: exactAlarm.get,
  requestExactAlarmCapability: exactAlarm.request,
}));

import { scheduleProgrammeReminder } from './programmeReminder.native';
import { PROGRAMME_REMINDER_LEAD_MS } from './programmeReminderContract';

const channel = {
  id: 'npo1',
  name: 'NPO 1',
  displayName: 'NPO 1',
  sortOrder: 0,
  isActive: true,
};

const programme = {
  id: 'programme-ios-reminder',
  channelId: channel.id,
  title: 'iOS reminder',
  startAt: '2026-09-18T19:00:00.000Z',
  endAt: '2026-09-18T20:00:00.000Z',
};

beforeEach(() => {
  notifications.setNotificationChannelAsync.mockReset().mockResolvedValue(null);
  notifications.getPermissionsAsync.mockReset().mockResolvedValue({
    granted: true,
    status: 'granted',
    ios: { status: notifications.IosAuthorizationStatus.AUTHORIZED },
  });
  notifications.requestPermissionsAsync.mockReset();
  notifications.scheduleNotificationAsync.mockReset().mockResolvedValue('ios-notification');
  notifications.cancelScheduledNotificationAsync.mockReset().mockResolvedValue(undefined);
  notifications.getAllScheduledNotificationsAsync.mockReset().mockResolvedValue([]);
  exactAlarm.get.mockReset().mockReturnValue('available');
  exactAlarm.request.mockReset().mockResolvedValue('available');
});

describe('iOS programme reminder scheduling', () => {
  it('preserves the existing five-minute iOS flow without Android special access', async () => {
    const nowMs = Date.parse(programme.startAt) - 30 * 60 * 1000;

    await expect(
      scheduleProgrammeReminder(programme, channel, () => nowMs),
    ).resolves.toEqual({
      ok: true,
      notificationId: 'ios-notification',
      fireAtMs: Date.parse(programme.startAt) - PROGRAMME_REMINDER_LEAD_MS,
    });

    expect(notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(exactAlarm.request).not.toHaveBeenCalled();
    const request = notifications.scheduleNotificationAsync.mock.calls[0]?.[0];
    expect(request?.trigger).not.toHaveProperty('channelId');
  });
});
