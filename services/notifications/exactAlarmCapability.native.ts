import { AppState, Platform } from 'react-native';

import { getTeeveeExactAlarmNativeModule } from '@/modules/teevee-exact-alarm';

export type ExactAlarmCapabilityStatus =
  | 'available'
  | 'unavailable'
  | 'indeterminate';

function requiresExactAlarmSpecialAccess(): boolean {
  if (Platform.OS !== 'android') return false;
  const apiLevel =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : Number(Platform.Version);
  return Number.isFinite(apiLevel) && apiLevel >= 31;
}

export function getExactAlarmCapability(): ExactAlarmCapabilityStatus {
  if (!requiresExactAlarmSpecialAccess()) return 'available';

  try {
    return getTeeveeExactAlarmNativeModule().canScheduleExactAlarms()
      ? 'available'
      : 'unavailable';
  } catch {
    return 'indeterminate';
  }
}

export async function requestExactAlarmCapability(): Promise<ExactAlarmCapabilityStatus> {
  const current = getExactAlarmCapability();
  if (current !== 'unavailable') return current;

  let sawBackground = AppState.currentState !== 'active';
  let resolveResume!: () => void;
  const resumed = new Promise<void>((resolve) => {
    resolveResume = resolve;
  });
  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState !== 'active') {
      sawBackground = true;
      return;
    }
    if (!sawBackground) return;
    subscription.remove();
    resolveResume();
  });

  try {
    const opened =
      await getTeeveeExactAlarmNativeModule().openExactAlarmSettingsAsync();
    if (!opened) {
      subscription.remove();
      return 'indeterminate';
    }
  } catch {
    subscription.remove();
    return 'indeterminate';
  }

  await resumed;
  return getExactAlarmCapability();
}
