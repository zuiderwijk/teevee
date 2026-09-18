import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Channel, Programme } from '@/data/domain/epg';
import type { ProgrammeReminderRecord } from '@/features/guide/programmePersonalState';

import {
  programmeReminderFireAtMs,
  type ProgrammeReminderScheduleResult,
} from './programmeReminderContract';

const CHANNEL_ID = 'programme-reminders';
let handlerConfigured = false;

function ensureForegroundHandler() {
  if (handlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

ensureForegroundHandler();

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Programmaherinneringen',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

function permissionGranted(status: Notifications.NotificationPermissionsStatus): boolean {
  if (Platform.OS !== 'ios') return status.granted || status.status === 'granted';
  const iosStatus = status.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (permissionGranted(current)) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return permissionGranted(requested);
}

export async function scheduleProgrammeReminder(
  programme: Programme,
  channel: Channel,
  nowMs = Date.now(),
): Promise<ProgrammeReminderScheduleResult> {
  const fireAtMs = programmeReminderFireAtMs(programme.startAt, nowMs);
  if (fireAtMs === null) return { ok: false, reason: 'started' };

  try {
    ensureForegroundHandler();
    await ensureAndroidChannel();
    if (!(await ensurePermission())) return { ok: false, reason: 'permission' };

    const preferredFireAt = Date.parse(programme.startAt) - 5 * 60 * 1000;
    const immediate = fireAtMs > preferredFireAt;
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: immediate ? 'Begint zo' : 'Begint over 5 minuten',
        body: `${programme.title} op ${channel.displayName}`,
        data: {
          type: 'programme-reminder',
          programmeId: programme.id,
          channelId: channel.id,
          startAt: programme.startAt,
        },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAtMs),
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });

    return { ok: true, notificationId, fireAtMs };
  } catch {
    return { ok: false, reason: 'schedule' };
  }
}

export async function cancelProgrammeReminder(notificationId: string): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch {
    return false;
  }
}

export async function reconcileProgrammeReminder(
  record: ProgrammeReminderRecord,
  programme: Programme,
  nowMs = Date.now(),
): Promise<boolean> {
  const startMs = Date.parse(programme.startAt);
  if (
    !Number.isFinite(startMs) ||
    startMs <= nowMs ||
    record.programmeStartAt !== programme.startAt
  ) {
    await cancelProgrammeReminder(record.notificationId);
    return false;
  }

  // Once the five-minute reminder instant has passed, retaining the state until
  // programme start is intentional: the notification may already have fired.
  if (record.fireAtMs <= nowMs) return true;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((request) => request.identifier === record.notificationId);
  } catch {
    return false;
  }
}
