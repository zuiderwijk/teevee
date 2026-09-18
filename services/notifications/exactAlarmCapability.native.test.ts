import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({
  canScheduleExactAlarms: vi.fn(),
  openExactAlarmSettingsAsync: vi.fn(),
}));
const platform = vi.hoisted(() => ({
  OS: 'android' as 'android' | 'ios',
  Version: 36 as number | string,
}));
const appState = vi.hoisted(() => ({
  currentState: 'active' as string,
  listeners: new Set<(state: string) => void>(),
}));

vi.mock('@/modules/teevee-exact-alarm', () => ({
  getTeeveeExactAlarmNativeModule: () => native,
}));
vi.mock('react-native', () => ({
  Platform: platform,
  AppState: {
    get currentState() {
      return appState.currentState;
    },
    addEventListener: (
      _event: string,
      listener: (state: string) => void,
    ) => {
      appState.listeners.add(listener);
      return { remove: () => appState.listeners.delete(listener) };
    },
  },
}));

import {
  getExactAlarmCapability,
  requestExactAlarmCapability,
} from './exactAlarmCapability.native';

function emitAppState(state: string) {
  appState.currentState = state;
  for (const listener of [...appState.listeners]) listener(state);
}

beforeEach(() => {
  platform.OS = 'android';
  platform.Version = 36;
  appState.currentState = 'active';
  appState.listeners.clear();
  native.canScheduleExactAlarms.mockReset().mockReturnValue(true);
  native.openExactAlarmSettingsAsync.mockReset().mockResolvedValue(true);
});

describe('Android exact-alarm capability boundary', () => {
  it('reports available when AlarmManager can schedule exact alarms', () => {
    expect(getExactAlarmCapability()).toBe('available');
    expect(native.canScheduleExactAlarms).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable when special access is missing', () => {
    native.canScheduleExactAlarms.mockReturnValue(false);
    expect(getExactAlarmCapability()).toBe('unavailable');
  });

  it('rechecks capability after the user returns from Alarms & reminders settings', async () => {
    native.canScheduleExactAlarms
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const pending = requestExactAlarmCapability();
    await vi.waitFor(() => {
      expect(native.openExactAlarmSettingsAsync).toHaveBeenCalledTimes(1);
    });

    emitAppState('background');
    emitAppState('active');

    await expect(pending).resolves.toBe('available');
  });

  it('fails closed when the native capability boundary cannot be established', async () => {
    native.canScheduleExactAlarms.mockImplementation(() => {
      throw new Error('native boundary unavailable');
    });
    expect(getExactAlarmCapability()).toBe('indeterminate');

    native.canScheduleExactAlarms.mockReset().mockReturnValue(false);
    native.openExactAlarmSettingsAsync.mockRejectedValue(
      new Error('settings unavailable'),
    );
    await expect(requestExactAlarmCapability()).resolves.toBe('indeterminate');
  });

  it('leaves iOS outside the Android special-access lifecycle', async () => {
    platform.OS = 'ios';
    platform.Version = '18.0';

    expect(getExactAlarmCapability()).toBe('available');
    await expect(requestExactAlarmCapability()).resolves.toBe('available');
    expect(native.canScheduleExactAlarms).not.toHaveBeenCalled();
    expect(native.openExactAlarmSettingsAsync).not.toHaveBeenCalled();
  });
});
