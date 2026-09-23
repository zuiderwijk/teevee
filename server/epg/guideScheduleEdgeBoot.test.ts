import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const edgeEntrypoints = [
  'supabase/functions/guide-schedule/index.mjs',
  'supabase/functions/guide-search/index.mjs',
].map((path) => resolve(repoRoot, path));
const localExtensions = ['.ts', '.tsx', '.mjs', '.js'];

function isRuntimeImport(statement: ts.ImportDeclaration): boolean {
  const clause = statement.importClause;
  if (!clause) return true;
  if (clause.isTypeOnly) return false;
  if (clause.name) return true;
  const bindings = clause.namedBindings;
  if (!bindings) return false;
  if (ts.isNamespaceImport(bindings)) return true;
  return bindings.elements.some((element) => !element.isTypeOnly);
}

function runtimeImportSpecifiers(filePath: string): string[] {
  const source = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS,
  );
  return sourceFile.statements
    .filter(ts.isImportDeclaration)
    .filter(isRuntimeImport)
    .map((statement) => {
      if (!ts.isStringLiteral(statement.moduleSpecifier)) {
        throw new Error('Unexpected non-string import in ' + filePath);
      }
      return statement.moduleSpecifier.text;
    });
}

function resolveLocalImport(importer: string, specifier: string): string | null {
  const base = specifier.startsWith('@/')
    ? resolve(repoRoot, specifier.slice(2))
    : specifier.startsWith('.')
      ? resolve(dirname(importer), specifier)
      : null;
  if (!base) return null;
  if (extname(base)) return existsSync(base) ? base : null;
  for (const extension of localExtensions) {
    const candidate = base + extension;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

describe('public Guide Edge runtime module graphs', () => {
  it('keeps schedule and Search reads deployable with explicit runtime imports', () => {
    const pending = [...edgeEntrypoints];
    const visited = new Set<string>();
    const violations: string[] = [];

    while (pending.length > 0) {
      const filePath = pending.pop()!;
      if (visited.has(filePath)) continue;
      visited.add(filePath);

      for (const specifier of runtimeImportSpecifiers(filePath)) {
        const relativeFile = relative(repoRoot, filePath);
        if (specifier.startsWith('@/')) {
          violations.push(relativeFile + ': runtime alias import ' + specifier);
        } else if (specifier.startsWith('.') && !extname(specifier)) {
          violations.push(relativeFile + ': extensionless runtime import ' + specifier);
        } else if (
          !specifier.startsWith('.') &&
          !/^(?:node|jsr|npm|https?):/.test(specifier)
        ) {
          violations.push(relativeFile + ': unsupported bare runtime import ' + specifier);
        }
        const resolved = resolveLocalImport(filePath, specifier);
        if (resolved) pending.push(resolved);
      }
    }

    expect(violations).toEqual([]);
  });
});
