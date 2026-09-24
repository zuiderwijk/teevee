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
