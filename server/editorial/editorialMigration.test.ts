import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260922173000_create_editorial_signal_store.sql',
);
const sql = readFileSync(migrationPath, 'utf8');

describe('editorial signal persistence migration', () => {
  it('keeps editorial storage private and deliberately independent of programme row deletion', () => {
    expect(sql).toContain('create table teevee.programme_editorial_signals');
    expect(sql).toContain('alter table teevee.programme_editorial_signals enable row level security');
    expect(sql).toContain('revoke all on teevee.programme_editorial_signals from public, anon, authenticated');
    expect(sql).not.toMatch(/programme_id\s+text[^;]*references\s+teevee\.programmes/i);
    expect(sql).not.toMatch(/programme_editorial_signals[\s\S]*on delete cascade/i);
  });

  it('validates canonical programme ids before authoritative source snapshot replacement', () => {
    expect(sql).toContain('Editorial signal references unknown canonical programme');
    expect(sql).toContain('delete from teevee.programme_editorial_signals');
    expect(sql).toContain("status', 'ignored-stale'");
    expect(sql).toContain('teevee.editorial_source_state');
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
