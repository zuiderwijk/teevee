import { describe, expect, it } from 'vitest';

import type { Channel } from './epg';
import {
  createChannelPersonalisationPreference,
  hiddenChannelIdsForPreference,
  moveSelectedChannel,
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
