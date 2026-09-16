import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { classifyCiFile, classifyCiScope, getChangedFiles } from './ci-scope.mjs';

const tempDirs = [];

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function commitFile(cwd, path, content, message) {
  const fullPath = join(cwd, path);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
  git(cwd, 'add', path);
  git(cwd, 'commit', '-m', message);
  return git(cwd, 'rev-parse', 'HEAD');
}

afterEach(() => {
  while (tempDirs.length > 0) rmSync(tempDirs.pop(), { recursive: true, force: true });
});

describe('Fast CI change classification', () => {
  it.each([
    ['docs/TESTING.md', 'docs-design'],
    ['design/current/guide/TOTAAL.md', 'docs-design'],
    ['AGENTS.md', 'docs-design'],
    ['server/epg/normalise.ts', 'pure-code'],
    ['features/guide/guideTime.test.ts', 'pure-code'],
    ['app/index.tsx', 'runtime-ui'],
    ['features/guide/GuideView.tsx', 'runtime-ui'],
    ['package-lock.json', 'native-config'],
    ['app.json', 'native-config'],
    ['android/app/build.gradle', 'native-config'],
    ['.github/workflows/ci.yml', 'native-config'],
    ['scripts/ci/ci-scope.mjs', 'native-config'],
    ['unexpected/file.xyz', 'native-config'],
  ])('classifies %s as %s', (file, expected) => {
    expect(classifyCiFile(file)).toBe(expected);
  });

  it('lets the heaviest class win for mixed diffs', () => {
    expect(classifyCiScope(['docs/README.md', 'app/index.tsx'])).toMatchObject({
      classification: 'runtime-ui',
      runQuality: true,
      runExpoExport: true,
      runNative: false,
    });
    expect(classifyCiScope(['features/guide/GuideView.tsx', 'package.json'])).toMatchObject({
      classification: 'native-config',
      runQuality: true,
      runExpoExport: true,
      runNative: true,
    });
  });

  it('keeps docs/design-only changes on the minimal gate', () => {
    expect(classifyCiScope(['docs/UX.md', 'design/current/guide/TOTAAL.md'])).toMatchObject({
      classification: 'docs-design',
      runQuality: false,
      runExpoExport: false,
      runNative: false,
    });
  });

  it('keeps pure code and test changes off bundle/native gates', () => {
    expect(classifyCiScope(['server/epg/normalise.ts', 'server/epg/normalise.test.ts'])).toMatchObject({
      classification: 'pure-code',
      runQuality: true,
      runExpoExport: false,
      runNative: false,
    });
  });

  it('falls back conservatively for an empty diff', () => {
    expect(classifyCiScope([])).toMatchObject({
      classification: 'native-config',
      runQuality: true,
      runExpoExport: true,
      runNative: true,
    });
  });

  it('uses merge-base diff semantics when the target branch advances', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'teevee-ci-scope-'));
    tempDirs.push(cwd);
    git(cwd, 'init', '-b', 'main');
    git(cwd, 'config', 'user.email', 'ci-test@teevee.invalid');
    git(cwd, 'config', 'user.name', 'Teevee CI test');
    commitFile(cwd, 'README.md', 'base\n', 'base');
    git(cwd, 'checkout', '-b', 'docs-change');
    const headSha = commitFile(cwd, 'docs/review.md', 'docs only\n', 'docs change');
    git(cwd, 'checkout', 'main');
    const advancedBaseSha = commitFile(cwd, 'app/runtime.ts', 'export {};\n', 'runtime on main');

    expect(getChangedFiles({ baseSha: advancedBaseSha, headSha, cwd })).toEqual(['docs/review.md']);
  });
});
