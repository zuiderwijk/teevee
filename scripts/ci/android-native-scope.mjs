import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DOCS_OR_DESIGN_ONLY = /^(?:docs\/|design\/|[^/]+\.md$)/;

export function classifyAndroidNativeScope(changedFiles) {
  const files = changedFiles.map((file) => file.trim()).filter(Boolean);

  if (files.length === 0) {
    return {
      run: true,
      scope: 'arm64',
      reason: 'Empty PR diff detected; running arm64 native build conservatively.',
    };
  }

  const runtimeFiles = files.filter((file) => !DOCS_OR_DESIGN_ONLY.test(file));
  if (runtimeFiles.length === 0) {
    return {
      run: false,
      scope: 'docs-only',
      reason: 'Documentation/design-only PR; skipping Android native compilation.',
    };
  }

  return {
    run: true,
    scope: 'arm64',
    reason: 'Runtime/config change detected; building arm64-v8a for PR validation.',
  };
}

export function getPullRequestChangedFiles({ baseSha, headSha, cwd = process.cwd() }) {
  if (!baseSha || !headSha) {
    throw new Error('baseSha and headSha are required');
  }

  const output = execFileSync('git', ['diff', '--name-only', `${baseSha}...${headSha}`], {
    cwd,
    encoding: 'utf8',
  });

  return output.split('\n').map((file) => file.trim()).filter(Boolean);
}

function writeGithubOutputs(result) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `run=${String(result.run)}\nscope=${result.scope}\n`,
    'utf8',
  );
}

function runCli() {
  const [, , baseSha, headSha] = process.argv;
  const changedFiles = getPullRequestChangedFiles({ baseSha, headSha });
  const result = classifyAndroidNativeScope(changedFiles);

  console.log('Changed files:');
  console.log(changedFiles.length > 0 ? changedFiles.join('\n') : '(none)');
  console.log(result.reason);
  writeGithubOutputs(result);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
