import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migration = readFileSync(
  resolve(
    repoRoot,
    'supabase/migrations/20260923144656_create_programme_classification_foundation.sql',
  ),
  'utf8',
);
const recoveryMigration = readFileSync(
  resolve(
    repoRoot,
    'supabase/migrations/20260923201300_recover_programme_classification_siblings.sql',
  ),
  'utf8',
);
const smoke = readFileSync(
  resolve(repoRoot, 'server/classification/classificationMigrationSmoke.sql'),
  'utf8',
);

describe('programme classification migration contract', () => {
  it('keeps classification as a private sibling keyed to canonical Programme with cascade lifecycle', () => {
    expect(migration).toContain('create table teevee.programme_classifications');
    expect(migration).toContain(
      'references teevee.programmes(id) on update cascade on delete cascade',
    );
    expect(migration).toContain(
      'alter table teevee.programme_classifications enable row level security',
    );
    expect(migration).toContain(
      'revoke all on teevee.programme_classifications from public, anon, authenticated',
    );
  });

  it('wraps canonical replacement atomically and exits before classification mutation on stale schedule writes', () => {
    const scheduleReplace = migration.indexOf(
      'v_result := teevee.replace_schedule_window',
    );
    const staleReturn = migration.indexOf(
      "if v_result->>'status' = 'ignored-stale'",
    );
    const classificationInsert = migration.indexOf(
      'insert into teevee.programme_classifications',
    );

    expect(scheduleReplace).toBeGreaterThan(-1);
    expect(staleReturn).toBeGreaterThan(scheduleReplace);
    expect(classificationInsert).toBeGreaterThan(staleReturn);
  });

  it('requires complete provider-independent classifications for every in-scope stored programme', () => {
    expect(migration).toContain('Missing programme classification for %');
    expect(migration).toContain(
      'Classification references programme outside schedule payload',
    );
    expect(migration).not.toMatch(/category|provider_key|provider_category/i);
  });

  it('exposes only least-privilege service-role RPC bridges', () => {
    expect(migration).toContain('security invoker');
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      'public.teevee_get_programme_classifications',
    );
    expect(migration).toContain('from public, anon, authenticated');
    expect(migration).toContain('to service_role');
  });

  it('adds a service-only non-destructive recovery RPC without weakening schedule replacement authority', () => {
    expect(recoveryMigration).toContain(
      'create or replace function teevee.recover_programme_classifications',
    );
    expect(recoveryMigration).toContain(
      'public.teevee_recover_programme_classifications',
    );
    expect(recoveryMigration).toContain('security invoker');
    expect(recoveryMigration).toContain("set search_path = ''");
    expect(recoveryMigration).toContain('pg_advisory_xact_lock');
    expect(recoveryMigration).toContain(
      'coverage.generated_at > p_observed_at',
    );
    expect(recoveryMigration).toContain(
      'current_classification.classified_at > p_observed_at',
    );
    expect(recoveryMigration).toContain(
      'existing.id = candidate.id',
    );
    expect(recoveryMigration).toContain(
      'existing.channel_id = candidate."channelId"',
    );
    expect(recoveryMigration).toContain(
      'existing.start_at = candidate."startAt"',
    );
    expect(recoveryMigration).toContain(
      'existing.end_at = candidate."endAt"',
    );
    expect(recoveryMigration).toContain(
      'existing.title = candidate.title',
    );
    expect(recoveryMigration).toContain(
      'Recovery payload contains overlapping programme candidates',
    );
    expect(recoveryMigration).not.toContain(
      'teevee.replace_schedule_window(',
    );
    expect(recoveryMigration).not.toMatch(
      /delete\s+from\s+teevee\.(?:programmes|schedule_coverage)/i,
    );
  });

  it('keeps recovery least-privilege and provider-independent', () => {
    expect(recoveryMigration).toContain(
      'from public, anon, authenticated',
    );
    expect(recoveryMigration).toContain('to service_role');
    expect(recoveryMigration).not.toMatch(
      /provider_key|provider_category|categories|episodeNumbers/i,
    );
  });

  it('keeps executable lifecycle smoke for idempotency, start correction, stale protection and deletion cleanup', () => {
    expect(smoke).toContain('Same broadcast again must remain idempotent');
    expect(smoke).toContain('Canonical start correction rekeys Programme.id');
    expect(smoke).toContain('stale classified write was not ignored');
    expect(smoke).toContain('classification orphan survived programme deletion');
    expect(smoke).toContain('provider-independent read contract failed');
    expect(smoke).toContain('classification recovery mutated canonical programme count');
    expect(smoke).toContain('classification recovery mutated schedule coverage');
    expect(smoke).toContain('repeated recovery duplicated classification');
    expect(smoke).toContain('corrected recovery row did not fail closed');
    expect(smoke).toContain('stale recovery was not ignored');
    expect(smoke).toContain('classification recovery lifecycle left an orphan');
    expect(smoke).toContain('20260923201300_recover_programme_classification_siblings.sql');
    expect(smoke).toContain('rollback;');
  });
});
