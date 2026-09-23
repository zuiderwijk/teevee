import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migration = readFileSync(
  resolve(
    repoRoot,
    'supabase/migrations/20260924001500_create_programme_external_content_reference.sql',
  ),
  'utf8',
);
const smoke = readFileSync(
  resolve(repoRoot, 'server/externalContent/externalContentMigrationSmoke.sql'),
  'utf8',
);

describe('external content reference migration contract', () => {
  it('keeps the reference private, broadcast-keyed and cascade-owned by canonical Programme', () => {
    expect(migration).toContain('create table teevee.programme_external_content_references');
    expect(migration).toContain(
      'programme_id text primary key references teevee.programmes(id) on update cascade on delete cascade',
    );
    expect(migration).toContain(
      'alter table teevee.programme_external_content_references enable row level security',
    );
    expect(migration).toContain(
      'revoke all on teevee.programme_external_content_references from public, anon, authenticated',
    );
    expect(migration).not.toMatch(/unique\s*\([^)]*external_content_id/i);
  });

  it('persists only high-confidence TMDB Film/Series IDs and no provider evidence or artwork', () => {
    expect(migration).toContain("source = 'tmdb'");
    expect(migration).toContain("media_type in ('film','series')");
    expect(migration).toContain("confidence = 'high'");
    expect(migration).not.toMatch(/director|actor|producer|production_date|poster|backdrop|image_url/i);
  });

  it('serializes with canonical schedule replacement and requires same-observation authoritative coverage', () => {
    expect(migration).toContain('pg_catalog.pg_advisory_xact_lock');
    expect(migration).toContain('coverage.generated_at = p_observed_at');
    expect(migration).toContain('coverage.generated_at > p_observed_at');
    expect(migration).toContain('existing.evidence_observed_at > p_observed_at');
  });

  it('exposes only a service-role write bridge and no mobile/public read RPC', () => {
    expect(migration).toContain(
      'public.teevee_apply_programme_external_content_decisions',
    );
    expect(migration).toContain('from public, anon, authenticated');
    expect(migration).toContain('to service_role');
    expect(migration).not.toMatch(/get_programme_external_content/i);
  });

  it('keeps executable lifecycle smoke for shared identity, idempotency, rekey, stale and delete ownership', () => {
    expect(smoke).toContain('Multiple concrete broadcasts may share one TMDB content identity');
    expect(smoke).toContain('Same-observation rerun is idempotent');
    expect(smoke).toContain('correct/rekey');
    expect(smoke).toContain('late stale identity result was not rejected');
    expect(smoke).toContain('external reference survived canonical programme deletion');
    expect(smoke).toContain('rollback;');
  });
});
