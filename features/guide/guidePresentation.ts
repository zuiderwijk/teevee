export const GUIDE_PRESENTATIONS = [
  { id: 'total', label: 'Totaal' },
  { id: 'per-channel', label: 'Per zender' },
  { id: 'now-next', label: 'Nu & Straks' },
] as const;

export type GuidePresentation = (typeof GUIDE_PRESENTATIONS)[number]['id'];

export const DEFAULT_GUIDE_PRESENTATION: GuidePresentation = 'total';

export function isGuidePresentation(value: unknown): value is GuidePresentation {
  return GUIDE_PRESENTATIONS.some((presentation) => presentation.id === value);
}
