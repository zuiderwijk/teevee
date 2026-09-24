import type { Channel } from './epg';

export const CHANNEL_PERSONALISATION_VERSION = 1 as const;

export type ChannelPersonalisationPreference = {
  version: typeof CHANNEL_PERSONALISATION_VERSION;
  /**
   * Every canonical channel ID the preference has already seen.
   * This is the durable distinction between "new" and "previously hidden".
   */
  knownChannelIds: string[];
  /**
   * Visible channel IDs in user order. Hidden IDs are knownChannelIds minus this set.
   */
  selectedChannelIds: string[];
};

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.trim() === '') return null;
    ids.push(item.trim());
  }
  return ids;
}

function unique(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

function canonicalIds(catalogue: readonly Channel[]): string[] {
  return [...catalogue]
    .filter(({ isActive }) => isActive)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
    )
    .map(({ id }) => id);
}

export function parseChannelPersonalisationPreference(
  value: unknown,
): ChannelPersonalisationPreference | null {
  const input = record(value);
  if (!input || input.version !== CHANNEL_PERSONALISATION_VERSION) return null;

  const knownChannelIds = stringIds(input.knownChannelIds);
  const selectedChannelIds = stringIds(input.selectedChannelIds);
  if (
    !knownChannelIds ||
    !selectedChannelIds ||
    knownChannelIds.length === 0 ||
    selectedChannelIds.length === 0
  ) {
    return null;
  }

  const known = new Set(knownChannelIds);
  if (selectedChannelIds.some((id) => !known.has(id))) return null;

  return {
    version: CHANNEL_PERSONALISATION_VERSION,
    knownChannelIds,
    selectedChannelIds,
  };
}

export function createChannelPersonalisationPreference(
  catalogue: readonly Channel[],
): ChannelPersonalisationPreference | null {
  const ids = canonicalIds(catalogue);
  if (ids.length === 0) return null;
  return {
    version: CHANNEL_PERSONALISATION_VERSION,
    knownChannelIds: ids,
    selectedChannelIds: ids,
  };
}

/**
 * Reconcile persisted user intent against the current canonical catalogue.
 *
 * Existing selected order wins over catalogue reorder. IDs never seen by this
 * preference are genuinely new and are appended in current canonical order.
 * Previously known-but-unselected IDs remain hidden.
 */
export function reconcileChannelPersonalisation(
  catalogue: readonly Channel[],
  preference: ChannelPersonalisationPreference | null,
): ChannelPersonalisationPreference | null {
  if (!preference) return null;

  const currentIds = canonicalIds(catalogue);
  if (currentIds.length === 0) return preference;

  const current = new Set(currentIds);
  const previouslyKnown = new Set(unique(preference.knownChannelIds));
  const selected = unique(preference.selectedChannelIds).filter(
    (id) => current.has(id) && previouslyKnown.has(id),
  );
  const newlyIntroduced = currentIds.filter((id) => !previouslyKnown.has(id));

  selected.push(...newlyIntroduced);
  if (selected.length === 0) selected.push(currentIds[0]!);

  return {
    version: CHANNEL_PERSONALISATION_VERSION,
    knownChannelIds: currentIds,
    selectedChannelIds: selected,
  };
}

export function channelPersonalisationEqual(
  left: ChannelPersonalisationPreference | null | undefined,
  right: ChannelPersonalisationPreference | null | undefined,
): boolean {
  if (!left || !right) return !left && !right;
  return (
    left.version === right.version &&
    left.knownChannelIds.length === right.knownChannelIds.length &&
    left.selectedChannelIds.length === right.selectedChannelIds.length &&
    left.knownChannelIds.every((id, index) => id === right.knownChannelIds[index]) &&
    left.selectedChannelIds.every(
      (id, index) => id === right.selectedChannelIds[index],
    )
  );
}

export function visibleChannelIdsForPreference(
  catalogue: readonly Channel[],
  preference: ChannelPersonalisationPreference | null,
): string[] {
  if (!preference) return canonicalIds(catalogue);
  return (
    reconcileChannelPersonalisation(catalogue, preference)?.selectedChannelIds ??
    canonicalIds(catalogue)
  );
}

export function hiddenChannelIdsForPreference(
  catalogue: readonly Channel[],
  preference: ChannelPersonalisationPreference | null,
): string[] {
  if (!preference) return [];
  const selected = new Set(
    reconcileChannelPersonalisation(catalogue, preference)?.selectedChannelIds ?? [],
  );
  return canonicalIds(catalogue).filter((id) => !selected.has(id));
}

export function setChannelVisibility(
  catalogue: readonly Channel[],
  preference: ChannelPersonalisationPreference | null,
  channelId: string,
  visible: boolean,
): ChannelPersonalisationPreference | null {
  const currentIds = canonicalIds(catalogue);
  if (!currentIds.includes(channelId)) return preference;

  const base =
    reconcileChannelPersonalisation(
      catalogue,
      preference ?? createChannelPersonalisationPreference(catalogue),
    ) ?? createChannelPersonalisationPreference(catalogue);
  if (!base) return null;

  const alreadyVisible = base.selectedChannelIds.includes(channelId);
  if (visible === alreadyVisible) return base;

  if (visible) {
    return {
      ...base,
      selectedChannelIds: [...base.selectedChannelIds, channelId],
    };
  }

  // A personalised Guide never persists an unusable empty selection.
  if (base.selectedChannelIds.length <= 1) return base;
  return {
    ...base,
    selectedChannelIds: base.selectedChannelIds.filter((id) => id !== channelId),
  };
}

export function moveSelectedChannel(
  catalogue: readonly Channel[],
  preference: ChannelPersonalisationPreference | null,
  channelId: string,
  delta: -1 | 1,
): ChannelPersonalisationPreference | null {
  const base =
    reconcileChannelPersonalisation(
      catalogue,
      preference ?? createChannelPersonalisationPreference(catalogue),
    ) ?? createChannelPersonalisationPreference(catalogue);
  if (!base) return null;

  const from = base.selectedChannelIds.indexOf(channelId);
  if (from < 0) return base;
  const to = Math.max(
    0,
    Math.min(base.selectedChannelIds.length - 1, from + delta),
  );
  if (to === from) return base;

  const selectedChannelIds = [...base.selectedChannelIds];
  const [moved] = selectedChannelIds.splice(from, 1);
  selectedChannelIds.splice(to, 0, moved!);
  return { ...base, selectedChannelIds };
}
