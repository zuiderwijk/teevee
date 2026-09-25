import type { GuideScheduleApi } from './guideScheduleContract';
import type { GuideSearchApi } from './guideSearchContract';
import { HostedGuideScheduleClient } from './hostedGuideScheduleClient';
import { HostedGuideSearchClient } from './hostedGuideSearchClient';
import {
  Physical49GuideScheduleClient,
  Physical49GuideSearchClient,
} from './physical49GuideClients';

export const PHYSICAL_49_MODE_ENV = 'EXPO_PUBLIC_TEEVEE_PHYSICAL_49';

export function physical49ModeEnabled(
  value = process.env.EXPO_PUBLIC_TEEVEE_PHYSICAL_49,
  development = typeof __DEV__ !== 'undefined' && __DEV__,
): boolean {
  return development && value === '1';
}

export function createRuntimeGuideScheduleApi(
  physical49 = physical49ModeEnabled(),
): GuideScheduleApi {
  return physical49
    ? new Physical49GuideScheduleClient()
    : new HostedGuideScheduleClient();
}

export function createRuntimeGuideSearchApi(
  physical49 = physical49ModeEnabled(),
): GuideSearchApi {
  return physical49
    ? new Physical49GuideSearchClient()
    : new HostedGuideSearchClient();
}
