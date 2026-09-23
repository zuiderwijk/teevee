import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migration = readFileSync(
  resolve(
    repoRoot,
    'supabase/migrations/20260923064120_create_guide_search_read_boundary.sql',
  ),
  'utf8',
);
const smoke = readFileSync(
  resolve(repoRoot, 'server/search/searchMigrationSmoke.sql'),
  'utf8',
);

describe('Guide Search migration contract', () => {
  it('keeps the read boundary private/service-role-only and provider-independent', () => {
    expect(migration).toContain('create or replace function teevee.search_guide');
    expect(migration).toContain('create or replace function public.teevee_search_guide');
    expect(migration).toContain('security invoker');
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      'revoke execute on function public.teevee_search_guide',
    );
    expect(migration).toContain(
      'grant execute on function public.teevee_search_guide',
    );
    expect(migration).not.toMatch(/provider[_ -]?id/i);
  });

  it('searches covered canonical pairs without returning full schedules', () => {
    expect(migration).toContain('teevee.schedule_coverage');
    expect(migration).toContain('teevee.programmes');
    expect(migration).toContain('teevee.channels');
    expect(migration).toContain("'programmeCoverage'");
    expect(migration).toContain("'channelMatches'");
    expect(migration).toContain("'programmeMatches'");
    expect(migration).not.toContain("'programmes', v_");
  });

  it('executes the real migration in the disposable PostgreSQL smoke', () => {
    expect(
      smoke.match(
        /20260923064120_create_guide_search_read_boundary\.sql/g,
      ),
    ).toHaveLength(1);
    expect(smoke).toMatch(/\brollback\b/i);
  });
});
