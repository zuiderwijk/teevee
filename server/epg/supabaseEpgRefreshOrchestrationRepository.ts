import type { StoredProviderScheduleObservation } from './ingest.ts';
import {
  EPG_REFRESH_MAX_WORK_ITEMS_PER_RUN,
  type EpgRefreshWorkItemPlan,
} from './refreshTopology.ts';
import type { ScheduleRpcClient } from './supabaseScheduleRepository.ts';

type RpcError = { message: string };

function rpcError(operation: string, error: RpcError): Error {
  return new Error(`Supabase ${operation} failed: ${error.message}`);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} returned an invalid payload`);
  }
  return value as Record<string, unknown>;
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function timestamp(value: unknown, label: string): string {
  const text = requiredText(value, label);
  if (!Number.isFinite(Date.parse(text))) throw new Error(`${label} must be a valid timestamp`);
  return new Date(Date.parse(text)).toISOString();
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must contain at least one value`);
  }
  return value.map((item, index) => requiredText(item, `${label}[${index}]`));
}

function storedObservation(value: unknown): StoredProviderScheduleObservation {
  const payload = record(value, 'externalContentObservation');
  const programmes = payload.programmes;
  if (!Array.isArray(programmes) || programmes.length === 0) {
    throw new Error('externalContentObservation programmes must be a non-empty array');
  }
  for (const [index, item] of programmes.entries()) {
    const observation = record(item, `externalContentObservation.programmes[${index}]`);
    record(observation.programme, `externalContentObservation.programmes[${index}].programme`);
    record(
      observation.classification,
      `externalContentObservation.programmes[${index}].classification`,
    );
    record(
      observation.externalProgramme,
      `externalContentObservation.programmes[${index}].externalProgramme`,
    );
  }

  return {
    from: timestamp(payload.from, 'externalContentObservation.from'),
    to: timestamp(payload.to, 'externalContentObservation.to'),
    observedAt: timestamp(payload.observedAt, 'externalContentObservation.observedAt'),
    channelIds: stringArray(
      payload.channelIds,
      'externalContentObservation.channelIds',
    ),
    programmes: programmes as StoredProviderScheduleObservation['programmes'],
  };
}

export type EpgRefreshRunLifecycle = 'queued' | 'running' | 'completed' | 'incomplete' | 'failed';

export type StartEpgRefreshRunResult = {
  runId: number;
  status: EpgRefreshRunLifecycle;
  jobCount: number;
  reused: boolean;
};

export type ClaimedEpgRefreshWorkItem = {
  status: 'claimed';
  runId: number;
  jobId: number;
  attempt: number;
  observedAt: string;
  sourceKey: string;
  dayOffset: number;
  from: string;
  to: string;
  channelGroupKey: string;
  providerChannelIds: string[];
};

export type EpgRefreshWorkItemClaimResult =
  | ClaimedEpgRefreshWorkItem
  | {
      status: 'duplicate' | 'stale-attempt' | 'terminal';
      jobId: number;
    };

export type ClaimedEpgRefreshExternalContentWorkItem = {
  status: 'claimed';
  runId: number;
  jobId: number;
  attempt: number;
  externalContentObservation: StoredProviderScheduleObservation;
};

export type EpgRefreshExternalContentClaimResult =
  | ClaimedEpgRefreshExternalContentWorkItem
  | {
      status: 'duplicate' | 'stale-attempt' | 'terminal';
      jobId: number;
    };

export type CompleteEpgRefreshExternalContentResult = {
  jobId: number;
  externalContentStatus: 'queued' | 'completed' | 'skipped' | 'failed';
  runId: number;
  runStatus: EpgRefreshRunLifecycle;
};

export type CompleteEpgRefreshWorkItemResult = {
  jobId: number;
  jobStatus: 'queued' | 'succeeded' | 'incomplete' | 'failed';
  runId: number;
  runStatus: EpgRefreshRunLifecycle;
};

function parseRunLifecycle(value: unknown, label: string): EpgRefreshRunLifecycle {
  if (
    value === 'queued' ||
    value === 'running' ||
    value === 'completed' ||
    value === 'incomplete' ||
    value === 'failed'
  ) {
    return value;
  }
  throw new Error(`${label} is invalid`);
}

function parseStartResult(value: unknown): StartEpgRefreshRunResult {
  const payload = record(value, 'Supabase start_epg_refresh_run');
  return {
    runId: positiveInteger(payload.runId, 'runId'),
    status: parseRunLifecycle(payload.status, 'run status'),
    jobCount: positiveInteger(payload.jobCount, 'jobCount'),
    reused: payload.reused === true,
  };
}

function parseClaimResult(value: unknown): EpgRefreshWorkItemClaimResult {
  const payload = record(value, 'Supabase claim_epg_refresh_job');
  const status = payload.status;
  const jobId = positiveInteger(payload.jobId, 'jobId');

  if (status === 'duplicate' || status === 'stale-attempt' || status === 'terminal') {
    return { status, jobId };
  }
  if (status !== 'claimed') throw new Error('Supabase claim_epg_refresh_job status is invalid');

  const runId = positiveInteger(payload.runId, 'runId');
  if (typeof payload.dayOffset !== 'number' || !Number.isInteger(payload.dayOffset)) {
    throw new Error('dayOffset must be an integer');
  }

  return {
    status: 'claimed',
    runId,
    jobId,
    attempt: positiveInteger(payload.attempt, 'attempt'),
    observedAt: timestamp(payload.observedAt, 'observedAt'),
    sourceKey: requiredText(payload.sourceKey, 'sourceKey'),
    dayOffset: payload.dayOffset,
    from: timestamp(payload.from, 'from'),
    to: timestamp(payload.to, 'to'),
    channelGroupKey: requiredText(payload.channelGroupKey, 'channelGroupKey'),
    providerChannelIds: stringArray(payload.providerChannelIds, 'providerChannelIds'),
  };
}

function parseExternalContentClaimResult(
  value: unknown,
): EpgRefreshExternalContentClaimResult {
  const payload = record(value, 'Supabase claim_epg_refresh_external_content_job');
  const status = payload.status;
  const jobId = positiveInteger(payload.jobId, 'jobId');

  if (status === 'duplicate' || status === 'stale-attempt' || status === 'terminal') {
    return { status, jobId };
  }
  if (status !== 'claimed') {
    throw new Error('Supabase claim_epg_refresh_external_content_job status is invalid');
  }

  return {
    status: 'claimed',
    runId: positiveInteger(payload.runId, 'runId'),
    jobId,
    attempt: positiveInteger(payload.attempt, 'attempt'),
    externalContentObservation: storedObservation(payload.externalContentObservation),
  };
}

function parseExternalContentCompleteResult(
  value: unknown,
): CompleteEpgRefreshExternalContentResult {
  const payload = record(value, 'Supabase complete_epg_refresh_external_content_job');
  const externalContentStatus = payload.externalContentStatus;
  if (
    externalContentStatus !== 'queued' &&
    externalContentStatus !== 'completed' &&
    externalContentStatus !== 'skipped' &&
    externalContentStatus !== 'failed'
  ) {
    throw new Error('externalContentStatus is invalid');
  }
  return {
    jobId: positiveInteger(payload.jobId, 'jobId'),
    externalContentStatus,
    runId: positiveInteger(payload.runId, 'runId'),
    runStatus: parseRunLifecycle(payload.runStatus, 'runStatus'),
  };
}

function parseCompleteResult(value: unknown): CompleteEpgRefreshWorkItemResult {
  const payload = record(value, 'Supabase complete_epg_refresh_job');
  const jobStatus = payload.jobStatus;
  if (
    jobStatus !== 'queued' &&
    jobStatus !== 'succeeded' &&
    jobStatus !== 'incomplete' &&
    jobStatus !== 'failed'
  ) {
    throw new Error('jobStatus is invalid');
  }

  return {
    jobId: positiveInteger(payload.jobId, 'jobId'),
    jobStatus,
    runId: positiveInteger(payload.runId, 'runId'),
    runStatus: parseRunLifecycle(payload.runStatus, 'runStatus'),
  };
}

export class SupabaseEpgRefreshOrchestrationRepository {
  constructor(private readonly client: ScheduleRpcClient) {}

  async startRun(input: {
    requestKey: string;
    observedAt: string;
    anchorAt: string;
    jobs: readonly EpgRefreshWorkItemPlan[];
  }): Promise<StartEpgRefreshRunResult> {
    if (input.jobs.length < 1 || input.jobs.length > EPG_REFRESH_MAX_WORK_ITEMS_PER_RUN) {
      throw new Error(
        `jobs must contain 1..${EPG_REFRESH_MAX_WORK_ITEMS_PER_RUN} work items`,
      );
    }
    const response = await this.client.rpc<unknown>('teevee_start_epg_refresh_run', {
      p_request_key: requiredText(input.requestKey, 'requestKey'),
      p_observed_at: timestamp(input.observedAt, 'observedAt'),
      p_anchor_at: timestamp(input.anchorAt, 'anchorAt'),
      p_jobs: input.jobs,
    });
    if (response.error) throw rpcError('start_epg_refresh_run', response.error);
    return parseStartResult(response.data);
  }

  async claimJob(input: {
    jobId: number;
    attemptToken: string;
  }): Promise<EpgRefreshWorkItemClaimResult> {
    const response = await this.client.rpc<unknown>('teevee_claim_epg_refresh_job', {
      p_job_id: positiveInteger(input.jobId, 'jobId'),
      p_attempt_token: requiredText(input.attemptToken, 'attemptToken'),
    });
    if (response.error) throw rpcError('claim_epg_refresh_job', response.error);
    return parseClaimResult(response.data);
  }

  async completeJob(input: {
    jobId: number;
    attemptToken: string;
    result: 'succeeded' | 'incomplete' | 'failed';
    outcome?: Record<string, unknown>;
    error?: string;
    externalContentObservation?: StoredProviderScheduleObservation;
  }): Promise<CompleteEpgRefreshWorkItemResult> {
    const response = await this.client.rpc<unknown>('teevee_complete_epg_refresh_job', {
      p_job_id: positiveInteger(input.jobId, 'jobId'),
      p_attempt_token: requiredText(input.attemptToken, 'attemptToken'),
      p_result: input.result,
      p_outcome: input.outcome ?? null,
      p_error: input.error?.trim() || null,
      p_external_content_observation: input.externalContentObservation ?? null,
    });
    if (response.error) throw rpcError('complete_epg_refresh_job', response.error);
    return parseCompleteResult(response.data);
  }

  async claimExternalContentJob(input: {
    jobId: number;
    attemptToken: string;
  }): Promise<EpgRefreshExternalContentClaimResult> {
    const response = await this.client.rpc<unknown>(
      'teevee_claim_epg_refresh_external_content_job',
      {
        p_job_id: positiveInteger(input.jobId, 'jobId'),
        p_attempt_token: requiredText(input.attemptToken, 'attemptToken'),
      },
    );
    if (response.error) {
      throw rpcError('claim_epg_refresh_external_content_job', response.error);
    }
    return parseExternalContentClaimResult(response.data);
  }

  async completeExternalContentJob(input: {
    jobId: number;
    attemptToken: string;
    result: 'succeeded' | 'retryable-failure';
    outcome?: Record<string, unknown>;
    error?: string;
  }): Promise<CompleteEpgRefreshExternalContentResult> {
    const response = await this.client.rpc<unknown>(
      'teevee_complete_epg_refresh_external_content_job',
      {
        p_job_id: positiveInteger(input.jobId, 'jobId'),
        p_attempt_token: requiredText(input.attemptToken, 'attemptToken'),
        p_result: input.result,
        p_outcome: input.outcome ?? null,
        p_error: input.error?.trim() || null,
      },
    );
    if (response.error) {
      throw rpcError('complete_epg_refresh_external_content_job', response.error);
    }
    return parseExternalContentCompleteResult(response.data);
  }
}
