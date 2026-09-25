import type { Channel } from './epg';

/**
 * Canonical supported channel catalogue shared by mobile product state and the
 * server-side development source configuration.
 *
 * Provider channel identifiers deliberately do not belong here. The separate
 * provider mapping remains replaceable without changing Teevee channel identity.
 *
 * Existing canonical IDs stay stable when a provider/brand name changes. New
 * channels use Teevee-owned IDs and the owner-approved 49-channel default order.
 */
export const CANONICAL_CHANNEL_CATALOG = [
  { id: 'nl-npo-1', name: 'NPO 1', displayName: 'NPO 1', shortName: 'NPO 1', sortOrder: 1, isActive: true },
  { id: 'nl-npo-2', name: 'NPO 2', displayName: 'NPO 2', shortName: 'NPO 2', sortOrder: 2, isActive: true },
  { id: 'nl-npo-3', name: 'NPO 3', displayName: 'NPO 3', shortName: 'NPO 3', sortOrder: 3, isActive: true },
  { id: 'nl-rtl-4', name: 'RTL 4', displayName: 'RTL 4', shortName: 'RTL 4', sortOrder: 4, isActive: true },
  { id: 'nl-rtl-5', name: 'RTL 5', displayName: 'RTL 5', shortName: 'RTL 5', sortOrder: 5, isActive: true },
  { id: 'nl-sbs-6', name: 'SBS6', displayName: 'SBS6', shortName: 'SBS6', sortOrder: 6, isActive: true },
  { id: 'nl-rtl-7', name: 'RTL 7', displayName: 'RTL 7', shortName: 'RTL 7', sortOrder: 7, isActive: true },
  {
    id: 'nl-veronica-disney-xd',
    name: 'Veronica',
    displayName: 'Veronica',
    shortName: 'Veronica',
    sortOrder: 8,
    isActive: true,
  },
  { id: 'nl-net-5', name: 'Net5', displayName: 'Net5', shortName: 'Net5', sortOrder: 9, isActive: true },
  { id: 'nl-rtl-8', name: 'RTL 8', displayName: 'RTL 8', shortName: 'RTL 8', sortOrder: 10, isActive: true },
  { id: 'nl-star-channel', name: 'STAR Channel', displayName: 'STAR Channel', shortName: 'STAR', sortOrder: 11, isActive: true },
  { id: 'nl-sbs-9', name: 'SBS9', displayName: 'SBS9', shortName: 'SBS9', sortOrder: 12, isActive: true },
  { id: 'nl-paramount-network', name: 'Paramount Network', displayName: 'Paramount Network', shortName: 'Paramount', sortOrder: 13, isActive: true },
  { id: 'nl-ziggo-sport', name: 'Ziggo Sport', displayName: 'Ziggo Sport', shortName: 'Ziggo Sport', sortOrder: 14, isActive: true },
  { id: 'nl-ziggo-sport-2', name: 'Ziggo Sport 2', displayName: 'Ziggo Sport 2', shortName: 'Ziggo 2', sortOrder: 15, isActive: true },
  { id: 'nl-ziggo-sport-3', name: 'Ziggo Sport 3', displayName: 'Ziggo Sport 3', shortName: 'Ziggo 3', sortOrder: 16, isActive: true },
  { id: 'nl-ziggo-sport-4', name: 'Ziggo Sport 4', displayName: 'Ziggo Sport 4', shortName: 'Ziggo 4', sortOrder: 17, isActive: true },
  { id: 'nl-ziggo-sport-5', name: 'Ziggo Sport 5', displayName: 'Ziggo Sport 5', shortName: 'Ziggo 5', sortOrder: 18, isActive: true },
  { id: 'nl-ziggo-sport-6', name: 'Ziggo Sport 6', displayName: 'Ziggo Sport 6', shortName: 'Ziggo 6', sortOrder: 19, isActive: true },
  { id: 'nl-espn', name: 'ESPN', displayName: 'ESPN', shortName: 'ESPN', sortOrder: 20, isActive: true },
  { id: 'nl-espn-2', name: 'ESPN 2', displayName: 'ESPN 2', shortName: 'ESPN 2', sortOrder: 21, isActive: true },
  { id: 'nl-espn-3', name: 'ESPN 3', displayName: 'ESPN 3', shortName: 'ESPN 3', sortOrder: 22, isActive: true },
  { id: 'nl-espn-4', name: 'ESPN 4', displayName: 'ESPN 4', shortName: 'ESPN 4', sortOrder: 23, isActive: true },
  { id: 'nl-viaplay-tv', name: 'Viaplay TV', displayName: 'Viaplay TV', shortName: 'Viaplay TV', sortOrder: 24, isActive: true },
  { id: 'nl-rtl-z', name: 'RTL Z', displayName: 'RTL Z', shortName: 'RTL Z', sortOrder: 25, isActive: true },
  { id: 'nl-tlc', name: 'TLC', displayName: 'TLC', shortName: 'TLC', sortOrder: 26, isActive: true },
  { id: 'nl-comedy-central', name: 'Comedy Central', displayName: 'Comedy Central', shortName: 'Comedy', sortOrder: 27, isActive: true },
  { id: 'nl-24kitchen', name: '24Kitchen', displayName: '24Kitchen', shortName: '24Kitchen', sortOrder: 28, isActive: true },
  { id: 'nl-eurosport-1', name: 'Eurosport 1', displayName: 'Eurosport 1', shortName: 'Eurosport 1', sortOrder: 29, isActive: true },
  { id: 'nl-eurosport-2', name: 'Eurosport 2', displayName: 'Eurosport 2', shortName: 'Eurosport 2', sortOrder: 30, isActive: true },
  { id: 'nl-discovery', name: 'Discovery', displayName: 'Discovery', shortName: 'Discovery', sortOrder: 31, isActive: true },
  { id: 'nl-national-geographic', name: 'National Geographic', displayName: 'National Geographic', shortName: 'Nat Geo', sortOrder: 32, isActive: true },
  { id: 'nl-history', name: 'History', displayName: 'History', shortName: 'History', sortOrder: 33, isActive: true },
  { id: 'nl-bbc-nl', name: 'BBC NL', displayName: 'BBC NL', shortName: 'BBC NL', sortOrder: 34, isActive: true },
  { id: 'nl-bbc-one', name: 'BBC One', displayName: 'BBC One', shortName: 'BBC One', sortOrder: 35, isActive: true },
  { id: 'nl-bbc-two', name: 'BBC Two', displayName: 'BBC Two', shortName: 'BBC Two', sortOrder: 36, isActive: true },
  { id: 'be-vrt-1', name: 'VRT 1', displayName: 'VRT 1', shortName: 'VRT 1', sortOrder: 37, isActive: true },
  { id: 'be-vrt-canvas', name: 'VRT Canvas', displayName: 'VRT Canvas', shortName: 'Canvas', sortOrder: 38, isActive: true },
  { id: 'be-vtm', name: 'VTM', displayName: 'VTM', shortName: 'VTM', sortOrder: 39, isActive: true },
  { id: 'be-play', name: 'Play', displayName: 'Play', shortName: 'Play', sortOrder: 40, isActive: true },
  { id: 'be-play-fictie', name: 'Play Fictie', displayName: 'Play Fictie', shortName: 'Play Fictie', sortOrder: 41, isActive: true },
  { id: 'be-vtm-2', name: 'VTM2', displayName: 'VTM2', shortName: 'VTM2', sortOrder: 42, isActive: true },
  { id: 'be-vtm-3', name: 'VTM3', displayName: 'VTM3', shortName: 'VTM3', sortOrder: 43, isActive: true },
  { id: 'be-vtm-4', name: 'VTM4', displayName: 'VTM4', shortName: 'VTM4', sortOrder: 44, isActive: true },
  { id: 'be-play-actie', name: 'Play Actie', displayName: 'Play Actie', shortName: 'Play Actie', sortOrder: 45, isActive: true },
  { id: 'be-play-reality', name: 'Play Reality', displayName: 'Play Reality', shortName: 'Play Reality', sortOrder: 46, isActive: true },
  { id: 'be-play-crime', name: 'Play Crime', displayName: 'Play Crime', shortName: 'Play Crime', sortOrder: 47, isActive: true },
  { id: 'be-vtm-gold', name: 'VTM Gold', displayName: 'VTM Gold', shortName: 'VTM Gold', sortOrder: 48, isActive: true },
  { id: 'be-ketnet', name: 'Ketnet', displayName: 'Ketnet', shortName: 'Ketnet', sortOrder: 49, isActive: true },
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
