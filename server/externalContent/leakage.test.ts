import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function sourceFiles(root: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = resolve(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      result.push(...sourceFiles(path));
    } else if (/\.(?:ts|tsx|js|mjs)$/.test(entry) && !/\.test\./.test(entry)) {
      result.push(path);
    }
  }
  return result;
}

describe('external content trust-boundary leakage', () => {
  it('leaves canonical Programme and public Guide transport free of TMDB/provider identity evidence', () => {
    const domain = readFileSync(resolve(repoRoot, 'data/domain/epg.ts'), 'utf8');
    const guideContract = readFileSync(
      resolve(repoRoot, 'services/api/guideScheduleContract.ts'),
      'utf8',
    );
    const publicSurface = `${domain}\n${guideContract}`;

    expect(publicSurface).not.toMatch(/tmdb/i);
    expect(publicSurface).not.toContain('productionDate');
    expect(publicSurface).not.toContain('credits');
    expect(publicSurface).not.toContain('externalContentId');
  });

  it('keeps the TMDB credential and server matcher outside mobile/runtime client source roots', () => {
    const clientRoots = ['app', 'components', 'features', 'data', 'services', 'theme'];
    const clientSource = clientRoots
      .flatMap((root) => sourceFiles(resolve(repoRoot, root)))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    expect(clientSource).not.toContain('TMDB_API_READ_ACCESS_TOKEN');
    expect(clientSource).not.toMatch(/server\/externalContent/);
  });

  it('keeps external matching gated by central provider-independent classification semantics', () => {
    const enrichment = readFileSync(
      resolve(repoRoot, 'server/externalContent/enrichment.ts'),
      'utf8',
    );

    expect(enrichment).toContain('isTonightFilmClassification');
    expect(enrichment).toContain('isTonightSeriesClassification');
    expect(enrichment).not.toMatch(/programme\.genre/);
  });
});
