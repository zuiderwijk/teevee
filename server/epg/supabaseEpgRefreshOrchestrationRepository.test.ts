import { describe, expect, it } from 'vitest';

import type { ScheduleRpcClient } from './supabaseScheduleRepository.ts';
import { SupabaseEpgRefreshOrchestrationRepository } from './supabaseEpgRefreshOrchestrationRepository.ts';

class FakeRpcClient implements ScheduleRpcClient {
  readonly calls: Array<{ functionName: string; args: Record<string, unknown> }> = [];

  constructor(private readonly responses: unknown[]) {}

  async rpc<T>(functionName: string, args: Record<string, unknown>) {
    this.calls.push({ functionName, args });
    return this.responses.shift() as { data: T | null; error: { message: string } | null };
  }
}

describe('SupabaseEpgRefreshOrchestrationRepository', () => {
  it('starts one durable run with source/day/channel-group jobs', async () => {
    const client = new FakeRpcClient([{
      data: { runId: 41, status: 'running', jobCount: 2, reused: false },
      error: null,
    }]);
    const repository = new SupabaseEpgRefreshOrchestrationRepository(client);

    await expect(repository.startRun({
      requestKey: 'cron:2026-09-24T12',
      observedAt: '2026-09-24T10:17:00Z',
      anchorAt: '2026-09-24T10:17:00Z',
      jobs: [
        {
          sourceKey: 'iptv-epg-nl',
          dayOffset: -3,
          from: '2026-09-21T04:00:00Z',
          to: '2026-09-22T04:00:00Z',
          channelGroupKey: 'group-1',
          providerChannelIds: ['NPO1.nl'],
        },
        {
          sourceKey: 'iptv-epg-nl',
          dayOffset: -2,
          from: '2026-09-22T04:00:00Z',
          to: '2026-09-23T04:00:00Z',
          channelGroupKey: 'group-1',
          providerChannelIds: ['NPO1.nl'],
        },
      ],
    })).resolves.toEqual({
      runId: 41,
      status: 'running',
      jobCount: 2,
      reused: false,
    });

    expect(client.calls[0]).toEqual({
      functionName: 'teevee_start_epg_refresh_run',
      args: {
        p_request_key: 'cron:2026-09-24T12',
        p_observed_at: '2026-09-24T10:17:00.000Z',
        p_anchor_at: '2026-09-24T10:17:00.000Z',
        p_jobs: expect.any(Array),
      },
    });
  });

  it('claims only database-owned work-item scope', async () => {
    const client = new FakeRpcClient([{
      data: {
        status: 'claimed',
        runId: 41,
        jobId: 7,
        attempt: 2,
        observedAt: '2026-09-24T10:17:00Z',
        sourceKey: 'iptv-epg-nl',
        dayOffset: 0,
        from: '2026-09-24T04:00:00Z',
        to: '2026-09-25T04:00:00Z',
        channelGroupKey: 'group-1',
        providerChannelIds: ['RTL4.nl', 'RTL5.nl'],
      },
      error: null,
    }]);
    const repository = new SupabaseEpgRefreshOrchestrationRepository(client);

    await expect(repository.claimJob({
      jobId: 7,
      attemptToken: 'attempt-token',
    })).resolves.toEqual({
      status: 'claimed',
      runId: 41,
      jobId: 7,
      attempt: 2,
      observedAt: '2026-09-24T10:17:00.000Z',
      sourceKey: 'iptv-epg-nl',
      dayOffset: 0,
      from: '2026-09-24T04:00:00.000Z',
      to: '2026-09-25T04:00:00.000Z',
      channelGroupKey: 'group-1',
      providerChannelIds: ['RTL4.nl', 'RTL5.nl'],
    });
    expect(client.calls[0]).toEqual({
      functionName: 'teevee_claim_epg_refresh_job',
      args: { p_job_id: 7, p_attempt_token: 'attempt-token' },
    });
  });

  it('treats duplicate/stale/terminal claims as idempotent non-work results', async () => {
    for (const status of ['duplicate', 'stale-attempt', 'terminal'] as const) {
      const repository = new SupabaseEpgRefreshOrchestrationRepository(
        new FakeRpcClient([{ data: { status, jobId: 7 }, error: null }]),
      );
      await expect(repository.claimJob({
        jobId: 7,
        attemptToken: 'attempt-token',
      })).resolves.toEqual({ status, jobId: 7 });
    }
  });

  it('completes a work item without trusting client-owned retry state', async () => {
    const client = new FakeRpcClient([{
      data: { jobId: 7, jobStatus: 'succeeded', runId: 41, runStatus: 'running' },
      error: null,
    }]);
    const repository = new SupabaseEpgRefreshOrchestrationRepository(client);

    await expect(repository.completeJob({
      jobId: 7,
      attemptToken: 'attempt-token',
      result: 'succeeded',
      outcome: { writeStatus: 'stored', programmeCount: 42 },
    })).resolves.toEqual({
      jobId: 7,
      jobStatus: 'succeeded',
      runId: 41,
      runStatus: 'running',
    });
    expect(client.calls[0]).toEqual({
      functionName: 'teevee_complete_epg_refresh_job',
      args: {
        p_job_id: 7,
        p_attempt_token: 'attempt-token',
        p_result: 'succeeded',
        p_outcome: { writeStatus: 'stored', programmeCount: 42 },
        p_error: null,
      },
    });
  });

  it('parses durable incomplete child/run outcomes', async () => {
    const repository = new SupabaseEpgRefreshOrchestrationRepository(
      new FakeRpcClient([{
        data: { jobId: 9, jobStatus: 'incomplete', runId: 42, runStatus: 'incomplete' },
        error: null,
      }]),
    );

    await expect(repository.completeJob({
      jobId: 9,
      attemptToken: 'attempt-token',
      result: 'incomplete',
      outcome: { authority: { status: 'incomplete' } },
    })).resolves.toEqual({
      jobId: 9,
      jobStatus: 'incomplete',
      runId: 42,
      runStatus: 'incomplete',
    });
  });

  it('surfaces RPC failures and rejects malformed orchestration payloads', async () => {
    const failing = new SupabaseEpgRefreshOrchestrationRepository(
      new FakeRpcClient([{ data: null, error: { message: 'database unavailable' } }]),
    );
    await expect(failing.claimJob({
      jobId: 1,
      attemptToken: 'token',
    })).rejects.toThrow('Supabase claim_epg_refresh_job failed: database unavailable');

    const malformed = new SupabaseEpgRefreshOrchestrationRepository(
      new FakeRpcClient([{ data: { status: 'claimed', jobId: 1 }, error: null }]),
    );
    await expect(malformed.claimJob({
      jobId: 1,
      attemptToken: 'token',
    })).rejects.toThrow('runId must be a positive integer');
  });
});
