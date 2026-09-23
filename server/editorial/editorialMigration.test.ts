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
  'supabase/migrations/20260922235737_preserve_started_editorial_signals.sql',
);
const sql = readFileSync(baseMigrationPath, 'utf8');
const lifecycleSql = readFileSync(lifecycleMigrationPath, 'utf8');
const smokeSql = readFileSync(
  resolve(repoRoot, 'server/editorial/editorialMigrationSmoke.sql'),
  'utf8',
);

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

  it('keeps both canonical-programme and source-item uniqueness while upserting current membership', () => {
    expect(lifecycleSql).toMatch(/insert into teevee\.programme_editorial_signals[\s\S]*on conflict \(source, signal_type, programme_id\) do update/i);
    expect(sql).toContain('primary key (source, signal_type, programme_id)');
    expect(sql).toContain('unique (source, signal_type, source_item_id)');
    expect(lifecycleSql).toContain('Duplicate editorial programme signal');
    expect(lifecycleSql).toContain('Duplicate editorial source item');
  });

  it('reconciles same-source-item canonical rekeys before orphan/future cleanup and before incoming upsert', () => {
    const rekeyIndex = lifecycleSql.indexOf(
      'Reconcile explicit source-item rekeys BEFORE incoming upsert',
    );
    const orphanIndex = lifecycleSql.indexOf(
      'Schedule retention owns historical lifetime',
    );
    const futureIndex = lifecycleSql.indexOf(
      'A successful source snapshot may retract an omitted Kijktip',
    );
    const upsertIndex = lifecycleSql.indexOf(
      'All rows that can conflict on source-item identity have now been reconciled',
    );

    expect(rekeyIndex).toBeGreaterThan(-1);
    expect(orphanIndex).toBeGreaterThan(rekeyIndex);
    expect(futureIndex).toBeGreaterThan(orphanIndex);
    expect(upsertIndex).toBeGreaterThan(futureIndex);
    expect(lifecycleSql).toMatch(
      /incoming\."sourceItemId" = existing\.source_item_id[\s\S]*incoming\."programmeId" is distinct from existing\.programme_id/i,
    );
  });

  it('covers the corrected-start regression: one sourceItemId may move to a new canonical programmeId', () => {
    expect(smokeSql).toContain('same sourceItemId -> corrected canonical programme ID because start changed');
    expect(smokeSql).toContain("'smoke-rekey-old'");
    expect(smokeSql).toContain("'smoke-rekey-new'");
    expect(smokeSql).toContain("'source-rekey'");
    expect(smokeSql).toContain("'2099-01-04T14:00:00Z'");
    expect(smokeSql).toContain("'2099-01-04T14:02:00Z'");
    expect(smokeSql).toContain('source-item rekey did not land on corrected programme');
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
    expect(smokeSql).toContain("teevee.get_editorial_signals(array['smoke-started-omit'])");
  });

  it('recovers only the directly evidenced owner-observed tips.rss broadcast and fails closed on ambiguity', () => {
    expect(lifecycleSql).toContain(
      'https://www.tvgids.nl/nieuws/televisie/de-slimste-mens-kiki-boreel-amusement-quiz-npo-1-2026-09-22',
    );
    expect(lifecycleSql).toContain("'nl-npo-1'::text");
    expect(lifecycleSql).toContain("'De slimste mens'::text");
    expect(lifecycleSql).toContain("'2026-09-22T19:30:00Z'::timestamptz");
    expect(lifecycleSql).toContain("'channel-title-start'");
    expect(lifecycleSql).toContain('candidate_count = 1');
    expect(lifecycleSql).toContain("interval '5 minutes'");
    expect(lifecycleSql).toContain('on conflict do nothing');
    expect(lifecycleSql).not.toContain('nieuws.rss');
    expect(lifecycleSql).not.toContain('programme-0gh2ai605h9qyw');
  });

  it('preserves advisory-lock and stale-refresh protection before every reconciliation mutation', () => {
    const lockIndex = lifecycleSql.indexOf('pg_advisory_xact_lock');
    const staleIndex = lifecycleSql.indexOf("status', 'ignored-stale'");
    const firstReconcileDeleteIndex = lifecycleSql.indexOf(
      'delete from teevee.programme_editorial_signals existing',
    );
    expect(lockIndex).toBeGreaterThan(-1);
    expect(staleIndex).toBeGreaterThan(lockIndex);
    expect(firstReconcileDeleteIndex).toBeGreaterThan(staleIndex);
  });

  it('keeps a disposable real-Postgres smoke covering every lifecycle blocker', () => {
    expect(smokeSql).toContain('future present / future omitted / started present / started omitted');
    expect(smokeSql).toContain('source-item rekey did not land on corrected programme');
    expect(smokeSql).toContain('orphan signal was not cleaned');
    expect(smokeSql).toContain('stale refresh was not ignored');
    expect(smokeSql).toContain('historical getter did not return retained started signal');
    expect(smokeSql).toContain('owner-observed historical recovery expected exactly 1 row');
    expect(smokeSql.match(/20260922235737_preserve_started_editorial_signals\.sql/g)).toHaveLength(2);
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
