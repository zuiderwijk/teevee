import { requireNativeModule } from 'expo';

type TeeveeExactAlarmNativeModule = {
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettingsAsync(): Promise<boolean>;
};

let nativeModule: TeeveeExactAlarmNativeModule | null = null;

export function getTeeveeExactAlarmNativeModule(): TeeveeExactAlarmNativeModule {
  nativeModule ??=
    requireNativeModule<TeeveeExactAlarmNativeModule>('TeeveeExactAlarm');
  return nativeModule;
}
