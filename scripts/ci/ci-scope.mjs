import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CI_CHANGE_CLASSES = ['docs-design', 'pure-code', 'runtime-ui', 'native-config'];

const DOCS_DESIGN = /^(?:docs\/|design\/)|\.md$/;
const TEST_FILE = /(?:^|\/)[^/]+\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/;
const NATIVE_CONFIG = [
  /^(?:package\.json|package-lock\.json|npm-shrinkwrap\.json|app\.json|eas\.json|\.npmrc)$/,
  /^(?:app|expo)\.config\.(?:[cm]?[jt]s)$/,
  /^(?:babel|metro|react-native)\.config\.(?:[cm]?[jt]s)$/,
  /^(?:android|ios)\//,
  /^\.github\//,
  /^scripts\/ci\//,
  /^(?:gradle\.properties|settings\.gradle(?:\.kts)?|build\.gradle(?:\.kts)?|Podfile)$/,
  /^patches\//,
];
const PURE_CODE = [
  /^server\//,
  /^scripts\/(?!ci\/)/,
  /^(?:tsconfig\.json|eslint\.config\.(?:[cm]?[jt]s)|expo-env\.d\.ts)$/,
];
const RUNTIME_UI = [
  /^(?:app|components|features|data|services|theme)\//,
];

function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

export function classifyCiFile(file) {
  const normalized = file.trim();
  if (!normalized) return 'native-config';
  if (matchesAny(normalized, NATIVE_CONFIG)) return 'native-config';
  if (DOCS_DESIGN.test(normalized)) return 'docs-design';
  if (TEST_FILE.test(normalized) || matchesAny(normalized, PURE_CODE)) return 'pure-code';
  if (matchesAny(normalized, RUNTIME_UI)) return 'runtime-ui';
  return 'native-config';
}

export function classifyCiScope(changedFiles) {
  const files = changedFiles.map((file) => file.trim()).filter(Boolean);
  if (files.length === 0) {
    return resultFor('native-config', 'Empty or unavailable diff; using conservative native/config validation.');
  }

  let winner = 'docs-design';
  for (const file of files) {
    const classification = classifyCiFile(file);
    if (CI_CHANGE_CLASSES.indexOf(classification) > CI_CHANGE_CLASSES.indexOf(winner)) {
      winner = classification;
    }
  }

  return resultFor(winner, `Highest-risk changed-file class: ${winner}.`);
}

function resultFor(classification, reason) {
  return {
    classification,
    runQuality: classification !== 'docs-design',
    runExpoExport: classification === 'runtime-ui' || classification === 'native-config',
    runNative: classification === 'native-config',
    reason,
  };
}

export function getChangedFiles({ baseSha, headSha, cwd = process.cwd() }) {
  if (!baseSha || !headSha) throw new Error('baseSha and headSha are required');
  const output = execFileSync('git', ['diff', '--name-only', `${baseSha}...${headSha}`], {
    cwd,
    encoding: 'utf8',
  });
  return output.split('\n').map((file) => file.trim()).filter(Boolean);
}

function writeGithubOutputs(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `classification=${result.classification}`,
      `run_quality=${String(result.runQuality)}`,
      `run_expo_export=${String(result.runExpoExport)}`,
      `run_native=${String(result.runNative)}`,
      '',
    ].join('\n'),
    'utf8',
  );
}

function conservativeFailure(error) {
  const result = resultFor('native-config', 'Classifier failed; using conservative native/config validation.');
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  console.log(result.reason);
  writeGithubOutputs(result);
  process.exitCode = 0;
}

function runCli() {
  const [, , baseSha, headSha, forceMode] = process.argv;
  try {
    const result = forceMode === '--force-native'
      ? resultFor('native-config', 'Explicit release validation requested.')
      : classifyCiScope(getChangedFiles({ baseSha, headSha }));
    console.log(result.reason);
    console.log(`CI class: ${result.classification}`);
    writeGithubOutputs(result);
  } catch (error) {
    conservativeFailure(error);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runCli();
