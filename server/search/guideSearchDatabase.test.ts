import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sql = readFileSync(
  resolve(repoRoot, 'server/search/guideSearchDatabase.sql'),
  'utf8',
);

describe('Guide Search database contract', () => {
  it('keeps Search a read-only service-role boundary with no provider coupling', () => {
    expect(sql).toContain('create extension if not exists unaccent with schema extensions');
    expect(sql).toContain('create or replace function teevee.search_guide');
    expect(sql).toContain('security invoker');
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain('public.teevee_search_guide');
    expect(sql).toContain('to service_role');
    expect(sql).toMatch(/revoke execute[\s\S]*from public, anon, authenticated/i);

    expect(sql).not.toMatch(/\b(insert|update|delete|truncate|drop)\b/i);
    expect(sql).not.toContain('provider_');
    expect(sql).not.toContain('xmltv');
  });

  it('requires the exact contiguous ten-window television-day horizon', () => {
    expect(sql).toContain('Guide Search requires exactly 10 television-day windows');
    expect(sql).toContain('Guide Search windows must be contiguous');
    expect(sql).toContain('window to must be after from');
    expect(sql).toContain('teevee.schedule_coverage');
    expect(sql).toContain("when v_covered_window_count = 0 then 'unavailable'");
    expect(sql).toContain(
      "when v_covered_window_count = v_window_count then 'complete'",
    );
    expect(sql).toContain("else 'partial'");
  });

  it('normalises lexical matches and ranks exact, prefix, substring deterministically', () => {
    expect(sql).toContain('teevee.normalize_search_text');
    expect(sql).toContain('extensions.unaccent');
    expect(sql).toContain('pg_catalog.strpos(normalized.value, v_query) = 1');
    expect(sql).toContain('pg_catalog.strpos(normalized.value, v_query) > 0');
    expect(sql).toContain('pg_catalog.strpos(v_query');
    expect(sql).not.toContain('pg_catalog.position');

    expect(sql).toMatch(
      /when normalized_title = v_query then 0[\s\S]*strpos\(normalized_title, v_query\) = 1 then 1[\s\S]*then 2/i,
    );
  });

  it('searches programmes only inside fully covered windows and keeps channels independent', () => {
    const channelSection = sql.indexOf('with channel_candidates as');
    const programmeSection = sql.indexOf('with windows as', channelSection + 1);
    expect(channelSection).toBeGreaterThan(-1);
    expect(programmeSection).toBeGreaterThan(channelSection);

    const channelSql = sql.slice(channelSection, programmeSection);
    expect(channelSql).toContain('from teevee.channels channel');
    expect(channelSql).not.toContain('covered_windows');

    const programmeSql = sql.slice(programmeSection);
    expect(programmeSql).toContain('covered_windows');
    expect(programmeSql).toMatch(
      /where exists \([\s\S]*from covered_windows window[\s\S]*programme\.start_at < window\.to_at[\s\S]*programme\.end_at > window\.from_at/i,
    );
  });

  it('locks programme ordering to match strength then current/future/history semantics', () => {
    expect(sql).toContain('when start_at <= p_now and p_now < end_at then 0');
    expect(sql).toContain('when start_at >= p_now then 1');
    expect(sql).toMatch(
      /order by\s+match_rank,\s+temporal_rank,[\s\S]*temporal_rank < 2 then start_at end asc[\s\S]*temporal_rank = 2 then start_at end desc[\s\S]*channel_sort_order,[\s\S]*id/i,
    );
    expect(sql).toContain('limit p_programme_limit');
    expect(sql).toContain('limit p_channel_limit');
  });

  it('returns only the typed bounded Search result shape', () => {
    expect(sql).toContain("'status', 'ok'");
    expect(sql).toContain("'programmeCoverage', v_programme_coverage");
    expect(sql).toContain("'channelMatches', v_channel_matches");
    expect(sql).toContain("'programmeMatches', v_programme_matches");
    expect(sql).toContain("'editorialSignals', '[]'::jsonb");
    expect(sql).not.toContain("'schedule'");
  });
});
