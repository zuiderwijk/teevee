import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const entrypoint = readFileSync(
  resolve(repoRoot, 'supabase/functions/epg-refresh/index.mjs'),
  'utf8',
);

describe('epg-refresh bounded orchestration entrypoint', () => {
  it('keeps guide-horizon as a lightweight durable planner instead of executing the horizon', () => {
    expect(entrypoint).not.toContain("import { refreshGuideHorizon }");
    expect(entrypoint).toContain("if (request.mode === 'guide-horizon')");
    expect(entrypoint).toContain('planGuideHorizonRefreshWorkItems');
    expect(entrypoint).toContain('orchestrationRepository(secretKey).startRun');
    expect(entrypoint).toContain('{ status: 202 }');

    const guideStart = entrypoint.indexOf("if (request.mode === 'guide-horizon')");
    const workItemStart = entrypoint.indexOf("if (request.mode === 'work-item')");
    const guideBlock = entrypoint.slice(guideStart, workItemStart);
    expect(guideBlock).not.toContain('new XmltvEpgProvider');
    expect(guideBlock).not.toContain('ingestProviderSchedule');
    expect(guideBlock).not.toContain('enrichExternalContent(');
  });

  it('claims database-owned scope before constructing a provider or ingesting', () => {
    const workItemStart = entrypoint.indexOf("if (request.mode === 'work-item')");
    const manualWindowStart = entrypoint.indexOf(
      'const refreshStartedAt = new Date();',
      workItemStart,
    );
    const workItemBlock = entrypoint.slice(workItemStart, manualWindowStart);

    const claim = workItemBlock.indexOf('orchestration.claimJob');
    const execute = workItemBlock.indexOf('executeClaimedWorkItem');
    const complete = workItemBlock.indexOf('orchestration.completeJob');

    expect(claim).toBeGreaterThan(-1);
    expect(execute).toBeGreaterThan(claim);
    expect(complete).toBeGreaterThan(execute);
    expect(entrypoint).toContain('providerChannelIds: claim.providerChannelIds');
  });

  it('keeps Guide canonical writes ahead of deferred TMDB work', () => {
    const executeStart = entrypoint.indexOf('async function executeClaimedWorkItem');
    const fetchStart = entrypoint.indexOf('export default', executeStart);
    const executeBlock = entrypoint.slice(executeStart, fetchStart);

    const guideStart = entrypoint.indexOf("if (request.mode === 'work-item')");
    const externalStart = entrypoint.indexOf(
      "if (request.mode === 'external-content-work-item')",
    );
    const manualStart = entrypoint.indexOf(
      'const refreshStartedAt = new Date();',
      externalStart,
    );
    const guideBlock = entrypoint.slice(guideStart, externalStart);
    const externalBlock = entrypoint.slice(externalStart, manualStart);

    expect(executeBlock).toContain('selectExternalContentEnrichmentObservation');
    expect(executeBlock).toContain('externalContentObservation');
    expect(executeBlock).not.toContain('await enrichExternalContent(');

    expect(guideBlock).toContain('externalContentObservation');
    expect(guideBlock).not.toContain('await enrichExternalContent(');

    expect(externalBlock).toContain('claimExternalContentJob');
    expect(externalBlock).toContain('await enrichExternalContent(');
    expect(externalBlock).toContain('completeExternalContentJob');
    expect(externalBlock).not.toContain('new XmltvEpgProvider');
    expect(externalBlock).not.toContain('ingestProviderSchedule');
  });

  it('routes ignored-stale through database canonical authority proof', () => {
    expect(entrypoint).toContain('claim.canonicalChannelIds');
    expect(entrypoint).toContain('sameCanonicalScope');
    expect(entrypoint).toContain("'verify-stale-authority'");
    expect(entrypoint).toContain("completion.jobStatus === 'succeeded'");
    expect(entrypoint).not.toContain(
      "reason: 'newer-authority-exact-scope'",
    );
  });

  it('classifies deferred enrichment outcomes before durable completion', () => {
    const externalStart = entrypoint.indexOf(
      "if (request.mode === 'external-content-work-item')",
    );
    const manualStart = entrypoint.indexOf(
      'const refreshStartedAt = new Date();',
      externalStart,
    );
    const externalBlock = entrypoint.slice(externalStart, manualStart);

    expect(entrypoint).toContain('classifyDurableExternalContentOutcome');
    expect(externalBlock).toContain('const durableOutcome =');
    expect(externalBlock).toContain('result: durableOutcome.result');
    expect(externalBlock).toContain("'retry-scheduled'");
    expect(externalBlock).not.toContain('success: true');
    expect(externalBlock).not.toContain('success: false');
  });

  it('uses cron authentication to derive a stable scheduled idempotency key', () => {
    expect(entrypoint).toContain("'cron-token'");
    expect(entrypoint).toContain("authKind === 'cron-token'");
    expect(entrypoint).toContain(
      'scheduledEpgRefreshRequestKey(refreshStartedAt.getTime())',
    );
    expect(entrypoint).toContain('manual:');
    expect(entrypoint).toContain('crypto.randomUUID()');
  });
});
