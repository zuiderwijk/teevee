import type { Channel } from './epg';

/**
 * Canonical supported channel catalogue shared by mobile product state and the
 * server-side development source configuration.
 *
 * Provider channel identifiers deliberately do not belong here. The separate
 * provider mapping remains replaceable without changing Teevee channel identity.
 *
 * The queued 49-channel expansion updates this catalogue in its own increment.
 */
export const CANONICAL_CHANNEL_CATALOG = [
  { id: 'nl-npo-1', name: 'NPO 1', displayName: 'NPO 1', shortName: 'NPO 1', sortOrder: 1, isActive: true },
  { id: 'nl-npo-2', name: 'NPO 2', displayName: 'NPO 2', shortName: 'NPO 2', sortOrder: 2, isActive: true },
  { id: 'nl-npo-3', name: 'NPO 3', displayName: 'NPO 3', shortName: 'NPO 3', sortOrder: 3, isActive: true },
  { id: 'nl-rtl-4', name: 'RTL 4', displayName: 'RTL 4', shortName: 'RTL 4', sortOrder: 4, isActive: true },
  { id: 'nl-rtl-5', name: 'RTL 5', displayName: 'RTL 5', shortName: 'RTL 5', sortOrder: 5, isActive: true },
  { id: 'nl-sbs-6', name: 'SBS6', displayName: 'SBS6', shortName: 'SBS6', sortOrder: 6, isActive: true },
  { id: 'nl-rtl-7', name: 'RTL 7', displayName: 'RTL 7', shortName: 'RTL 7', sortOrder: 7, isActive: true },
  { id: 'nl-rtl-8', name: 'RTL 8', displayName: 'RTL 8', shortName: 'RTL 8', sortOrder: 8, isActive: true },
  { id: 'nl-net-5', name: 'Net5', displayName: 'Net5', shortName: 'Net5', sortOrder: 9, isActive: true },
  {
    id: 'nl-veronica-disney-xd',
    name: 'Veronica / Disney XD',
    displayName: 'Veronica / Disney XD',
    shortName: 'Veronica',
    sortOrder: 10,
    isActive: true,
  },
  { id: 'nl-sbs-9', name: 'SBS9', displayName: 'SBS9', shortName: 'SBS9', sortOrder: 11, isActive: true },
  { id: 'nl-rtl-z', name: 'RTL Z', displayName: 'RTL Z', shortName: 'RTL Z', sortOrder: 12, isActive: true },
] as const satisfies readonly Channel[];

export function canonicalActiveChannels(
  catalogue: readonly Channel[],
): Channel[] {
  return [...catalogue]
    .filter(({ isActive }) => isActive)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
    );
}
