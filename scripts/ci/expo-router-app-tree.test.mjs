import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const appRoot = join(repositoryRoot, 'app');

function findExpoRouterTestModules(directory = appRoot) {
  const matches = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      matches.push(...findExpoRouterTestModules(absolutePath));
      continue;
    }

    if (entry.isFile() && /\.(?:test|spec)\./i.test(entry.name)) {
      matches.push(relative(repositoryRoot, absolutePath));
    }
  }

  return matches.sort();
}

describe('Expo Router app tree', () => {
  it('contains no test or spec modules', () => {
    expect(findExpoRouterTestModules()).toEqual([]);
  });
});
