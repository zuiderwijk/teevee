import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const edgeEntrypoint = resolve(
  repoRoot,
  'supabase/functions/programme-classifications/index.mjs',
);
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

function runtimeImports(filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
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

function resolveLocal(importer: string, specifier: string): string | null {
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

describe('programme-classifications Edge runtime module graph', () => {
  it('uses explicit self-resolving runtime imports', () => {
    const pending = [edgeEntrypoint];
    const visited = new Set<string>();
    const violations: string[] = [];

    while (pending.length > 0) {
      const filePath = pending.pop()!;
      if (visited.has(filePath)) continue;
      visited.add(filePath);
      for (const specifier of runtimeImports(filePath)) {
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
        const resolved = resolveLocal(filePath, specifier);
        if (resolved) pending.push(resolved);
      }
    }

    expect(violations).toEqual([]);
  });
});
