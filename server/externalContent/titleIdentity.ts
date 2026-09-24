const LEADING_ARTICLES = new Set(['a', 'an', 'the', 'de', 'het', 'een']);

export function normaliseIdentityText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-US')
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function conservativeTitleIdentity(
  providerTitle: string,
  candidateTitles: readonly string[],
): boolean {
  const provider = normaliseIdentityText(providerTitle);
  return provider.length > 0 &&
    candidateTitles.some((title) => normaliseIdentityText(title) === provider);
}

function withoutLeadingArticle(value: string): string {
  const parts = normaliseIdentityText(value).split(' ').filter(Boolean);
  if (parts.length > 1 && LEADING_ARTICLES.has(parts[0]!)) {
    return parts.slice(1).join(' ');
  }
  return parts.join(' ');
}

export function leadingArticleTitleIdentity(
  providerTitle: string,
  candidateTitles: readonly string[],
): boolean {
  const provider = withoutLeadingArticle(providerTitle);
  return provider.length > 0 &&
    candidateTitles.some((title) => withoutLeadingArticle(title) === provider);
}

export function deriveSeriesBaseTitle(title: string): string | null {
  const candidates = [
    title.indexOf(':'),
    title.indexOf(','),
    title.indexOf(' - '),
  ].filter((index) => index > 0);
  if (candidates.length === 0) return null;

  const cut = Math.min(...candidates);
  const base = title.slice(0, cut).trim();
  if (!base || normaliseIdentityText(base) === normaliseIdentityText(title)) {
    return null;
  }
  return base;
}

export function peopleOverlap(
  providerPeople: readonly string[],
  candidatePeople: readonly string[],
): number {
  const candidate = new Set(
    candidatePeople.map(normaliseIdentityText).filter(Boolean),
  );
  return new Set(
    providerPeople
      .map(normaliseIdentityText)
      .filter((name) => name && candidate.has(name)),
  ).size;
}
