import { describe, expect, it } from 'vitest';

import { CANONICAL_CHANNEL_CATALOG } from './channelCatalog';
import type { Channel } from './epg';
import {
  createChannelPersonalisationPreference,
  hiddenChannelIdsForPreference,
  moveSelectedChannel,
  moveSelectedChannelToIndex,
  parseChannelPersonalisationPreference,
  reconcileChannelPersonalisation,
  setChannelVisibility,
  visibleChannelIdsForPreference,
  type ChannelPersonalisationPreference,
} from './channelPersonalisation';

function channel(id: string, sortOrder: number): Channel {
  return {
    id,
    name: id.toUpperCase(),
    displayName: id.toUpperCase(),
    sortOrder,
    isActive: true,
  };
}

const ABC = [channel('a', 1), channel('b', 2), channel('c', 3)];

function preference(
  knownChannelIds: string[],
  selectedChannelIds: string[],
): ChannelPersonalisationPreference {
  return { version: 1, knownChannelIds, selectedChannelIds };
}

describe('channel personalisation reconciliation', () => {
  it('uses canonical default order when no preference exists', () => {
    expect(visibleChannelIdsForPreference(ABC, null)).toEqual(['a', 'b', 'c']);
    expect(hiddenChannelIdsForPreference(ABC, null)).toEqual([]);
  });

  it('preserves a persisted custom visible order and hidden choice', () => {
    const saved = preference(['a', 'b', 'c'], ['c', 'a']);
    expect(reconcileChannelPersonalisation(ABC, saved)).toEqual(saved);
    expect(hiddenChannelIdsForPreference(ABC, saved)).toEqual(['b']);
  });

  it('appends one genuinely new canonical ID without reviving a hidden ID', () => {
    const saved = preference(['a', 'b'], ['a']);
    const next = reconcileChannelPersonalisation(
      [channel('a', 1), channel('b', 2), channel('c', 3)],
      saved,
    );
    expect(next?.selectedChannelIds).toEqual(['a', 'c']);
    expect(next?.knownChannelIds).toEqual(['a', 'b', 'c']);
  });

  it('appends multiple new IDs in current canonical order', () => {
    const saved = preference(['a', 'b'], ['b', 'a']);
    const next = reconcileChannelPersonalisation(
      [channel('d', 1), channel('b', 2), channel('c', 3), channel('a', 4)],
      saved,
    );
    expect(next?.selectedChannelIds).toEqual(['b', 'a', 'd', 'c']);
  });


  it('migrates the shipped 12-channel personalised state to 49 without reviving hidden channels', () => {
    const legacyKnown = [
      'nl-npo-1',
      'nl-npo-2',
      'nl-npo-3',
      'nl-rtl-4',
      'nl-rtl-5',
      'nl-sbs-6',
      'nl-rtl-7',
      'nl-rtl-8',
      'nl-net-5',
      'nl-veronica-disney-xd',
      'nl-sbs-9',
      'nl-rtl-z',
    ];
    const saved = preference(legacyKnown, [
      'nl-rtl-z',
      'nl-npo-1',
      'nl-rtl-8',
      'nl-veronica-disney-xd',
    ]);

    const next = reconcileChannelPersonalisation(
      CANONICAL_CHANNEL_CATALOG,
      saved,
    );

    expect(next?.knownChannelIds).toHaveLength(49);
    expect(next?.selectedChannelIds).toHaveLength(4 + 37);
    expect(next?.selectedChannelIds.slice(0, 4)).toEqual(saved.selectedChannelIds);
    expect(next?.selectedChannelIds).not.toContain('nl-net-5');
    expect(next?.selectedChannelIds.slice(4)).toEqual(
      CANONICAL_CHANNEL_CATALOG
        .map(({ id }) => id)
        .filter((id) => !legacyKnown.includes(id)),
    );
  });

  it('does not let catalogue reorder rewrite existing user relative order', () => {
    const saved = preference(['a', 'b', 'c'], ['c', 'a']);
    const reordered = [channel('b', 1), channel('a', 2), channel('c', 3)];
    expect(
      reconcileChannelPersonalisation(reordered, saved)?.selectedChannelIds,
    ).toEqual(['c', 'a']);
  });

  it('drops removed IDs and keeps at least one visible channel', () => {
    expect(
      reconcileChannelPersonalisation(
        [channel('a', 1), channel('c', 2)],
        preference(['a', 'b', 'c'], ['b']),
      ),
    ).toEqual(preference(['a', 'c'], ['a']));
  });

  it('repairs duplicate persisted IDs deterministically', () => {
    expect(
      reconcileChannelPersonalisation(
        ABC,
        preference(['a', 'a', 'b', 'c'], ['c', 'c', 'a']),
      ),
    ).toEqual(preference(['a', 'b', 'c'], ['c', 'a']));
  });

  it('drops obsolete unknown IDs without treating them as new current channels', () => {
    expect(
      reconcileChannelPersonalisation(
        ABC,
        preference(['a', 'b', 'c', 'gone'], ['gone', 'b']),
      )?.selectedChannelIds,
    ).toEqual(['b']);
  });

  it('fails corrupt/empty persistence safe to no personalisation', () => {
    expect(
      parseChannelPersonalisationPreference({
        version: 1,
        knownChannelIds: ['a'],
        selectedChannelIds: [],
      }),
    ).toBeNull();
    expect(
      parseChannelPersonalisationPreference({
        version: 1,
        knownChannelIds: ['a'],
        selectedChannelIds: ['unknown'],
      }),
    ).toBeNull();
    expect(parseChannelPersonalisationPreference('broken')).toBeNull();
  });

  it('makes explicit add idempotent, appends re-added channels and prevents hiding the last channel', () => {
    const hidden = setChannelVisibility(ABC, null, 'b', false);
    expect(hidden?.selectedChannelIds).toEqual(['a', 'c']);

    const added = setChannelVisibility(ABC, hidden, 'b', true);
    expect(added?.selectedChannelIds).toEqual(['a', 'c', 'b']);
    expect(setChannelVisibility(ABC, added, 'b', true)).toEqual(added);

    const one = preference(['a', 'b', 'c'], ['c']);
    expect(setChannelVisibility(ABC, one, 'c', false)).toEqual(one);
  });

  it('moves one visible channel directly to an arbitrary index', () => {
    const saved = preference(['a', 'b', 'c'], ['c', 'a', 'b']);
    expect(
      moveSelectedChannelToIndex(ABC, saved, 'c', 2)?.selectedChannelIds,
    ).toEqual(['a', 'b', 'c']);
    expect(
      moveSelectedChannelToIndex(ABC, saved, 'b', 0)?.selectedChannelIds,
    ).toEqual(['b', 'c', 'a']);
    expect(
      moveSelectedChannelToIndex(ABC, saved, 'a', 99)?.selectedChannelIds,
    ).toEqual(['c', 'b', 'a']);
  });

  it('moves only visible channels and creates a preference from the default when needed', () => {
    expect(
      moveSelectedChannel(ABC, null, 'b', -1)?.selectedChannelIds,
    ).toEqual(['b', 'a', 'c']);
    expect(
      moveSelectedChannel(
        ABC,
        preference(['a', 'b', 'c'], ['c', 'a']),
        'c',
        1,
      )?.selectedChannelIds,
    ).toEqual(['a', 'c']);
    expect(createChannelPersonalisationPreference(ABC)?.selectedChannelIds).toEqual(
      ['a', 'b', 'c'],
    );
  });
});
