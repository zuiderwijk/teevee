import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const baseMigrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260922174626_create_editorial_signal_store.sql',
);
const lifecycleMigrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260923003000_preserve_started_editorial_signals.sql',
);
const sql = readFileSync(baseMigrationPath, 'utf8');
const lifecycleSql = readFileSync(lifecycleMigrationPath, 'utf8');

describe('editorial signal persistence migration', () => {
  it('keeps editorial storage private and deliberately independent of programme row deletion', () => {
    expect(sql).toContain('create table teevee.programme_editorial_signals');
    expect(sql).toContain('alter table teevee.programme_editorial_signals enable row level security');
    expect(sql).toContain('revoke all on teevee.programme_editorial_signals from public, anon, authenticated');
    expect(sql).not.toMatch(/programme_id\s+text[^;]*references\s+teevee\.programmes/i);
    expect(sql).not.toMatch(/programme_editorial_signals[\s\S]*on delete cascade/i);
  });

  it('validates canonical programme ids before editorial source reconciliation', () => {
    expect(sql).toContain('Editorial signal references unknown canonical programme');
    expect(sql).toContain("status', 'ignored-stale'");
    expect(sql).toContain('teevee.editorial_source_state');
    expect(lifecycleSql).toContain('Editorial signal references unknown canonical programme');
  });

  it('upserts future/current source membership without duplicating programme or source-item identity', () => {
    expect(lifecycleSql).toMatch(/insert into teevee\.programme_editorial_signals[\s\S]*on conflict \(source, signal_type, programme_id\) do update/i);
    expect(sql).toContain('primary key (source, signal_type, programme_id)');
    expect(sql).toContain('unique (source, signal_type, source_item_id)');
    expect(lifecycleSql).toContain('Duplicate editorial programme signal');
    expect(lifecycleSql).toContain('Duplicate editorial source item');
  });

  it('removes an omitted future signal but preserves an omitted already-started broadcast', () => {
    expect(lifecycleSql).toContain('p.start_at > p_refreshed_at');
    expect(lifecycleSql).toMatch(/not exists \([\s\S]*incoming\."programmeId" = existing\.programme_id[\s\S]*incoming\."type" = existing\.signal_type/i);
    expect(lifecycleSql).not.toContain('p.start_at <= p_refreshed_at');
  });

  it('removes orphaned signals only when the canonical programme no longer exists', () => {
    expect(lifecycleSql).toMatch(/delete from teevee\.programme_editorial_signals existing[\s\S]*not exists \([\s\S]*from teevee\.programmes p[\s\S]*p\.id = existing\.programme_id/i);
  });

  it('keeps historical retained signals readable while their programme exists', () => {
    expect(sql).toContain('join teevee.programmes p on p.id = s.programme_id');
    expect(lifecycleSql).not.toContain('create or replace function teevee.get_editorial_signals');
  });

  it('preserves advisory-lock and stale-refresh protection before mutation', () => {
    const lockIndex = lifecycleSql.indexOf('pg_advisory_xact_lock');
    const staleIndex = lifecycleSql.indexOf("status', 'ignored-stale'");
    const upsertIndex = lifecycleSql.indexOf('insert into teevee.programme_editorial_signals');
    expect(lockIndex).toBeGreaterThan(-1);
    expect(staleIndex).toBeGreaterThan(lockIndex);
    expect(upsertIndex).toBeGreaterThan(staleIndex);
  });

  it('exposes service-role-only RPCs and a refresh cadence independent from EPG refresh', () => {
    expect(sql).toContain('public.teevee_replace_editorial_signal_snapshot');
    expect(sql).toContain('public.teevee_get_editorial_signals');
    expect(sql).toContain('public.teevee_validate_editorial_refresh_cron_token');
    expect(sql).toContain('teevee-tvgids-editorial-refresh');
    expect(sql).toContain("'41 * * * *'");
    expect(sql).not.toContain('teevee.enqueue_development_epg_refresh');
  });
});
