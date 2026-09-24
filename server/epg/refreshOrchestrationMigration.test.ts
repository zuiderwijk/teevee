import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migration = readFileSync(
  resolve(
    repoRoot,
    'supabase/migrations/20260924095903_create_epg_refresh_orchestration.sql',
  ),
  'utf8',
);

describe('bounded EPG refresh orchestration migration', () => {
  it('persists run ownership and source/day/channel-group child identity privately', () => {
    expect(migration).toContain('create table teevee.epg_refresh_runs');
    expect(migration).toContain('create table teevee.epg_refresh_jobs');
    expect(migration).toContain('request_key text not null unique');
    expect(migration).toContain('observed_at timestamptz not null');
    expect(migration).toContain('source_key text not null');
    expect(migration).toContain('day_offset integer not null');
    expect(migration).toContain('channel_group_key text not null');
    expect(migration).toContain('provider_channel_ids text[] not null');
    expect(migration).toContain(
      'unique (run_id, source_key, day_offset, channel_group_key)',
    );
    expect(migration).toContain('alter table teevee.epg_refresh_runs enable row level security');
    expect(migration).toContain('alter table teevee.epg_refresh_jobs enable row level security');
  });

  it('serializes child dispatch and recovers worker-killed leases without trusting cron success', () => {
    expect(migration).toContain("hashtextextended('teevee-epg-refresh-dispatch', 0)");
    expect(migration).toContain("status in ('dispatched','running')");
    expect(migration).toContain("lease_expires_at <= pg_catalog.now()");
    expect(migration).toContain("lease_expires_at > pg_catalog.now()");
    expect(migration).toContain("interval '3 minutes'");
    expect(migration).toContain("interval '30 seconds'");
    expect(migration).toContain('attempt_count >= max_attempts');
    expect(migration).toContain("'work-item lease expired before terminal completion'");
    expect(migration).toContain("'teevee-development-epg-refresh-pump'");
    expect(migration).toContain("'* * * * *'");
  });

  it('dispatches only opaque job identity to Edge and stores the real scope server-side', () => {
    expect(migration).toContain("'mode', 'work-item'");
    expect(migration).toContain("'jobId', v_job.id");
    expect(migration).toContain("'attemptToken', v_attempt_token");
    expect(migration).not.toMatch(
      /jsonb_build_object\([\s\S]{0,400}'mode', 'work-item'[\s\S]{0,400}'providerChannelIds'/,
    );
    expect(migration).toContain('teevee.claim_epg_refresh_job');
    expect(migration).toContain('v_job.attempt_token is distinct from p_attempt_token');
  });

  it('preserves one run observation timestamp across independently claimed children', () => {
    expect(migration).toContain('observed_at timestamptz not null');
    expect(migration).toContain("select observed_at");
    expect(migration).toContain("'observedAt',v_observed_at");
    expect(migration).toContain("'from',v_job.from_at");
    expect(migration).toContain("'to',v_job.to_at");
    expect(migration).toContain("'providerChannelIds',to_jsonb(v_job.provider_channel_ids)");
  });

  it('keeps orchestration RPCs service-role only and leaves the cron token in Vault', () => {
    expect(migration).toContain('public.teevee_start_epg_refresh_run');
    expect(migration).toContain('public.teevee_claim_epg_refresh_job');
    expect(migration).toContain('public.teevee_complete_epg_refresh_job');
    expect(migration).toContain('from public, anon, authenticated');
    expect(migration).toContain('to service_role');
    expect(migration).toContain("from vault.decrypted_secrets");
    expect(migration).toContain("name = 'teevee_epg_refresh_cron_token'");
    expect(migration).not.toMatch(/grant execute[\s\S]*to anon/i);
    expect(migration).not.toMatch(/grant execute[\s\S]*to authenticated/i);
  });

  it('keeps the existing six-hour cron entrypoint untouched while adding only the recovery pump', () => {
    expect(migration).toContain("where request_key = p_request_key");
    expect(migration).toContain("where status in ('queued','running')");
    expect(migration).not.toContain(
      'create or replace function teevee.enqueue_development_epg_refresh()',
    );
    expect(migration).not.toContain("cron.unschedule('teevee-development-epg-refresh')");
    expect(migration).toContain("'teevee-development-epg-refresh-pump'");
  });
});
