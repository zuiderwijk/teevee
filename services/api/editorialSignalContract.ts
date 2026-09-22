import type { ProgrammeEditorialSignal } from '@/data/domain/editorial';

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Editorial signal ' + field + ' must be a non-empty string');
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requiredString(value, field);
}

function optionalTimestamp(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error('Editorial signal ' + field + ' must be a valid timestamp when provided');
  }
  return new Date(Date.parse(value)).toISOString();
}

export function programmeEditorialSignalIdentity(
  signal: ProgrammeEditorialSignal,
): string {
  return [signal.programmeId, signal.type, signal.source].join('\u0000');
}

export function parseProgrammeEditorialSignal(value: unknown): ProgrammeEditorialSignal {
  const input = record(value);
  if (!input) throw new Error('Editorial signal must be an object');

  if (input.type !== 'kijktip') throw new Error('Editorial signal type is invalid');
  if (input.source !== 'tvgids') throw new Error('Editorial signal source is invalid');
  if (
    input.matchedBy !== 'source-id' &&
    input.matchedBy !== 'channel-title-start' &&
    input.matchedBy !== 'channel-exact-start'
  ) {
    throw new Error('Editorial signal matchedBy is invalid');
  }

  const sourceUrl = optionalString(input.sourceUrl, 'sourceUrl');
  const publishedAt = optionalTimestamp(input.publishedAt, 'publishedAt');

  return {
    programmeId: requiredString(input.programmeId, 'programmeId'),
    type: 'kijktip',
    source: 'tvgids',
    sourceItemId: requiredString(input.sourceItemId, 'sourceItemId'),
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(publishedAt ? { publishedAt } : {}),
    matchedBy: input.matchedBy,
  };
}

export function parseProgrammeEditorialSignals(value: unknown): ProgrammeEditorialSignal[] {
  if (!Array.isArray(value)) throw new Error('Editorial signals must be an array');

  const signals = value.map(parseProgrammeEditorialSignal);
  const identities = new Set<string>();
  for (const signal of signals) {
    const identity = programmeEditorialSignalIdentity(signal);
    if (identities.has(identity)) {
      throw new Error('Editorial signals contain a duplicate programme signal');
    }
    identities.add(identity);
  }
  return signals;
}
