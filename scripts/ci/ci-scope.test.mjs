import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { classifyCiFile, classifyCiScope, getChangedFiles } from './ci-scope.mjs';

const tempDirs = [];
const classifierScript = fileURLToPath(new URL('./ci-scope.mjs', import.meta.url));

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function createRepository() {
  const cwd = mkdtempSync(join(tmpdir(), 'teevee-ci-scope-'));
  tempDirs.push(cwd);
  git(cwd, 'init', '-b', 'main');
  git(cwd, 'config', 'user.email', 'ci-test@teevee.invalid');
  git(cwd, 'config', 'user.name', 'Teevee CI test');
  return cwd;
}

function commitFile(cwd, path, content, message) {
  const fullPath = join(cwd, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
  git(cwd, 'add', path);
  git(cwd, 'commit', '-m', message);
  return git(cwd, 'rev-parse', 'HEAD');
}

function readGithubOutputs(path) {
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .trim()
      .split('\n')
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

function runClassifierCli(cwd, args) {
  const outputPath = join(cwd, 'github-output.txt');
  execFileSync(process.execPath, [classifierScript, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_OUTPUT: outputPath },
  });
  return readGithubOutputs(outputPath);
}

const HEAVY_OUTPUTS = {
  classification: 'native-config',
  run_quality: 'true',
  run_expo_export: 'true',
  run_native: 'true',
};

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
    ['eslint.config.js', 'pure-code'],
    ['expo-env.d.ts', 'pure-code'],
    ['app/index.tsx', 'runtime-ui'],
    ['features/guide/GuideView.tsx', 'runtime-ui'],
    ['tsconfig.json', 'runtime-ui'],
    ['package-lock.json', 'native-config'],
    ['app.json', 'native-config'],
    ['android/app/build.gradle', 'native-config'],
    ['.github/workflows/ci.yml', 'native-config'],
    ['scripts/ci/ci-scope.mjs', 'native-config'],
    ['scripts/build-assets.mjs', 'native-config'],
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

  it('keeps proven pure code and test changes off bundle/native gates', () => {
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

  it('uses merge-base diff semantics when the PR target branch advances', () => {
    const cwd = createRepository();
    commitFile(cwd, 'README.md', 'base\n', 'base');
    git(cwd, 'checkout', '-b', 'docs-change');
    const headSha = commitFile(cwd, 'docs/review.md', 'docs only\n', 'docs change');
    git(cwd, 'checkout', 'main');
    const advancedBaseSha = commitFile(cwd, 'app/runtime.ts', 'export {};\n', 'runtime on main');

    expect(getChangedFiles({ baseSha: advancedBaseSha, headSha, cwd })).toEqual(['docs/review.md']);
  });

  it('keeps the deleted runtime path visible when runtime code is renamed into docs', () => {
    const cwd = createRepository();
    const baseSha = commitFile(cwd, 'app/Foo.tsx', 'export {};\n', 'runtime file');
    mkdirSync(join(cwd, 'docs'), { recursive: true });
    git(cwd, 'mv', 'app/Foo.tsx', 'docs/Foo.md');
    git(cwd, 'commit', '-m', 'rename runtime into docs');
    const headSha = git(cwd, 'rev-parse', 'HEAD');

    const files = getChangedFiles({ baseSha, headSha, cwd });
    expect(new Set(files)).toEqual(new Set(['app/Foo.tsx', 'docs/Foo.md']));
    expect(classifyCiScope(files).classification).toBe('runtime-ui');
  });

  it('keeps the deleted native/config path visible when config is renamed into docs', () => {
    const cwd = createRepository();
    const baseSha = commitFile(cwd, 'app.json', '{}\n', 'native config');
    mkdirSync(join(cwd, 'docs'), { recursive: true });
    git(cwd, 'mv', 'app.json', 'docs/app-config.md');
    git(cwd, 'commit', '-m', 'rename config into docs');
    const headSha = git(cwd, 'rev-parse', 'HEAD');

    const files = getChangedFiles({ baseSha, headSha, cwd });
    expect(new Set(files)).toEqual(new Set(['app.json', 'docs/app-config.md']));
    expect(classifyCiScope(files).classification).toBe('native-config');
  });

  it('uses the exact before-to-after tree delta for non-fast-forward main pushes', () => {
    const cwd = createRepository();
    const commonSha = commitFile(cwd, 'README.md', 'base\n', 'base');
    const beforeSha = commitFile(cwd, 'app/runtime.ts', 'export {};\n', 'runtime before push');
    git(cwd, 'checkout', '-b', 'replacement-main', commonSha);
    const afterSha = commitFile(cwd, 'docs/review.md', 'docs only\n', 'replacement docs');

    expect(getChangedFiles({ baseSha: beforeSha, headSha: afterSha, cwd })).toEqual(['docs/review.md']);

    const files = getChangedFiles({ baseSha: beforeSha, headSha: afterSha, diffMode: 'push', cwd });
    expect(new Set(files)).toEqual(new Set(['app/runtime.ts', 'docs/review.md']));
    expect(classifyCiScope(files).classification).toBe('runtime-ui');
  });

  it('writes conservative heavy outputs when git diff receives an invalid SHA', () => {
    const cwd = createRepository();
    commitFile(cwd, 'README.md', 'base\n', 'base');

    expect(runClassifierCli(cwd, ['missing-sha', 'HEAD', '--diff-mode=pull-request'])).toEqual(HEAVY_OUTPUTS);
  });

  it('writes conservative heavy outputs when a required SHA is missing', () => {
    const cwd = createRepository();
    const baseSha = commitFile(cwd, 'README.md', 'base\n', 'base');

    expect(runClassifierCli(cwd, [baseSha, '--diff-mode=push'])).toEqual(HEAVY_OUTPUTS);
  });

  it('keeps explicit release validation on the native-config gate', () => {
    const cwd = createRepository();
    const baseSha = commitFile(cwd, 'README.md', 'base\n', 'base');
    const headSha = commitFile(cwd, 'docs/review.md', 'docs only\n', 'docs change');

    expect(
      runClassifierCli(cwd, [baseSha, headSha, '--diff-mode=pull-request', '--force-native']),
    ).toEqual(HEAVY_OUTPUTS);
  });
});
