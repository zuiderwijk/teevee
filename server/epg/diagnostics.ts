import type { Channel, Programme } from '@/data/domain/epg';

export type DataQualitySeverity = 'warning' | 'error';

export type DataQualityCode =
  | 'invalid-channel-mapping'
  | 'duplicate-channel-mapping'
  | 'unknown-canonical-channel'
  | 'unmapped-provider-channel'
  | 'missing-title'
  | 'invalid-start'
  | 'invalid-end'
  | 'invalid-range'
  | 'duplicate-provider-programme'
  | 'overlapping-programmes';

export type DataQualityDiagnostic = {
  severity: DataQualitySeverity;
  code: DataQualityCode;
  message: string;
  providerChannelId?: string;
  providerProgrammeId?: string;
  channelId?: Channel['id'];
  programmeId?: Programme['id'];
};

export function dataQualityDiagnostic(
  severity: DataQualitySeverity,
  code: DataQualityCode,
  message: string,
  context: Omit<DataQualityDiagnostic, 'severity' | 'code' | 'message'> = {},
): DataQualityDiagnostic {
  return { severity, code, message, ...context };
}
