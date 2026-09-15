import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  classifyAndroidNativeScope,
  getPullRequestChangedFiles,
} from './android-native-scope.mjs';

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
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

describe('Android native CI scope', () => {
  it('skips documentation and design-only changes', () => {
    expect(
      classifyAndroidNativeScope([
        'docs/TESTING.md',
        'design/current/guide/TOTAAL.md',
        'AGENTS.md',
      ]),
    ).toMatchObject({ run: false, scope: 'docs-only' });
  });

  it('runs arm64 for runtime or configuration changes', () => {
    expect(
      classifyAndroidNativeScope(['.github/workflows/ci.yml', 'app/index.tsx']),
    ).toMatchObject({ run: true, scope: 'arm64' });
  });

  it('falls back conservatively to arm64 for an unexpected empty diff', () => {
    expect(classifyAndroidNativeScope([])).toMatchObject({ run: true, scope: 'arm64' });
  });

  it('uses the merge-base PR diff when main advances after a docs-only branch point', () => {
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

    const changedFiles = getPullRequestChangedFiles({
      baseSha: advancedBaseSha,
      headSha,
      cwd,
    });

    expect(changedFiles).toEqual(['docs/review.md']);
    expect(classifyAndroidNativeScope(changedFiles)).toMatchObject({
      run: false,
      scope: 'docs-only',
    });
  });
});
