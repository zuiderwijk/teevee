import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CANONICAL_CHANNEL_CATALOG,
  canonicalActiveChannels,
} from '@/data/domain/channelCatalog';
import type { Channel } from '@/data/domain/epg';
import {
  channelPersonalisationEqual,
  hiddenChannelIdsForPreference,
  moveSelectedChannel,
  moveSelectedChannelToIndex,
  reconcileChannelPersonalisation,
  setChannelVisibility,
  visibleChannelIdsForPreference,
  type ChannelPersonalisationPreference,
} from '@/data/domain/channelPersonalisation';
import { withChannelPersonalisation } from '@/features/settings/appPreferences';
import {
  readAppPreferences,
  writeAppPreferences,
} from '@/services/storage/appPreferencesStorage';

type State = {
  catalog: Channel[];
  preference: ChannelPersonalisationPreference | null;
  needsInitialPersistence: boolean;
};

export type ChannelPersonalisationContextValue = {
  catalog: readonly Channel[];
  selectedChannelIds: readonly string[];
  hiddenChannelIds: readonly string[];
  guideSelectedChannelIds: readonly string[] | null;
  isPersonalised: boolean;
  isChannelVisible: (channelId: string) => boolean;
  canHideChannel: (channelId: string) => boolean;
  setChannelVisible: (channelId: string, visible: boolean) => void;
  addChannel: (channel: Channel) => void;
  moveChannel: (channelId: string, delta: -1 | 1) => void;
  moveChannelToIndex: (channelId: string, toIndex: number) => void;
  observeCanonicalCatalog: (channels: readonly Channel[]) => void;
};

const defaultCatalog = canonicalActiveChannels(CANONICAL_CHANNEL_CATALOG);
const defaultSelectedIds = defaultCatalog.map(({ id }) => id);
const noop = () => undefined;

const DEFAULT_CONTEXT: ChannelPersonalisationContextValue = {
  catalog: defaultCatalog,
  selectedChannelIds: defaultSelectedIds,
  hiddenChannelIds: [],
  guideSelectedChannelIds: null,
  isPersonalised: false,
  isChannelVisible: () => true,
  canHideChannel: () => defaultSelectedIds.length > 1,
  setChannelVisible: noop,
  addChannel: noop,
  moveChannel: noop,
  moveChannelToIndex: noop,
  observeCanonicalCatalog: noop,
};

const ChannelPersonalisationContext =
  createContext<ChannelPersonalisationContextValue | null>(null);

function channelEqual(left: Channel, right: Channel): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.displayName === right.displayName &&
    left.shortName === right.shortName &&
    left.logoUrl === right.logoUrl &&
    left.sortOrder === right.sortOrder &&
    left.isActive === right.isActive
  );
}

function catalogEqual(left: readonly Channel[], right: readonly Channel[]): boolean {
  return (
    left.length === right.length &&
    left.every((channel, index) => {
      const candidate = right[index];
      return candidate !== undefined && channelEqual(channel, candidate);
    })
  );
}

function mergeCatalogChannel(
  catalog: readonly Channel[],
  channel: Channel,
): Channel[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  byId.set(channel.id, channel);
  return canonicalActiveChannels([...byId.values()]);
}

function persistPreference(
  nextPreference: ChannelPersonalisationPreference | null,
): void {
  const currentPreferences = readAppPreferences();
  if (
    channelPersonalisationEqual(
      currentPreferences.channelPersonalisation,
      nextPreference,
    )
  ) {
    return;
  }
  writeAppPreferences(
    withChannelPersonalisation(currentPreferences, nextPreference),
  );
}

export function ChannelPersonalisationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<State>(() => {
    const catalog = canonicalActiveChannels(CANONICAL_CHANNEL_CATALOG);
    const stored = readAppPreferences().channelPersonalisation ?? null;
    const preference = reconcileChannelPersonalisation(catalog, stored);
    return {
      catalog,
      preference,
      needsInitialPersistence:
        stored !== null && !channelPersonalisationEqual(stored, preference),
    };
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const commit = useCallback((next: State) => {
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    if (!state.needsInitialPersistence) return;
    persistPreference(state.preference);
    commit({ ...state, needsInitialPersistence: false });
  }, [commit, state]);

  const observeCanonicalCatalog = useCallback(
    (channels: readonly Channel[]) => {
      const catalog = canonicalActiveChannels(channels);
      if (catalog.length === 0) return;

      const current = stateRef.current;
      const preference = reconcileChannelPersonalisation(
        catalog,
        current.preference,
      );
      if (
        catalogEqual(catalog, current.catalog) &&
        channelPersonalisationEqual(preference, current.preference)
      ) {
        return;
      }

      if (!channelPersonalisationEqual(preference, current.preference)) {
        persistPreference(preference);
      }
      commit({
        catalog,
        preference,
        needsInitialPersistence: false,
      });
    },
    [commit],
  );

  const setChannelVisible = useCallback(
    (channelId: string, visible: boolean) => {
      const current = stateRef.current;
      const preference = setChannelVisibility(
        current.catalog,
        current.preference,
        channelId,
        visible,
      );
      if (channelPersonalisationEqual(preference, current.preference)) return;
      persistPreference(preference);
      commit({
        ...current,
        preference,
        needsInitialPersistence: false,
      });
    },
    [commit],
  );

  const addChannel = useCallback(
    (channel: Channel) => {
      const current = stateRef.current;
      const catalog = mergeCatalogChannel(current.catalog, channel);
      const reconciled = reconcileChannelPersonalisation(
        catalog,
        current.preference,
      );
      const preference = setChannelVisibility(
        catalog,
        reconciled,
        channel.id,
        true,
      );
      if (
        catalogEqual(catalog, current.catalog) &&
        channelPersonalisationEqual(preference, current.preference)
      ) {
        return;
      }
      if (!channelPersonalisationEqual(preference, current.preference)) {
        persistPreference(preference);
      }
      commit({
        catalog,
        preference,
        needsInitialPersistence: false,
      });
    },
    [commit],
  );

  const moveChannel = useCallback(
    (channelId: string, delta: -1 | 1) => {
      const current = stateRef.current;
      const preference = moveSelectedChannel(
        current.catalog,
        current.preference,
        channelId,
        delta,
      );
      if (channelPersonalisationEqual(preference, current.preference)) return;
      persistPreference(preference);
      commit({
        ...current,
        preference,
        needsInitialPersistence: false,
      });
    },
    [commit],
  );

  const moveChannelToIndex = useCallback(
    (channelId: string, toIndex: number) => {
      const current = stateRef.current;
      const preference = moveSelectedChannelToIndex(
        current.catalog,
        current.preference,
        channelId,
        toIndex,
      );
      if (channelPersonalisationEqual(preference, current.preference)) return;
      persistPreference(preference);
      commit({
        ...current,
        preference,
        needsInitialPersistence: false,
      });
    },
    [commit],
  );

  const selectedChannelIds = useMemo(
    () => visibleChannelIdsForPreference(state.catalog, state.preference),
    [state.catalog, state.preference],
  );
  const hiddenChannelIds = useMemo(
    () => hiddenChannelIdsForPreference(state.catalog, state.preference),
    [state.catalog, state.preference],
  );
  const selectedSet = useMemo(
    () => new Set(selectedChannelIds),
    [selectedChannelIds],
  );

  const value = useMemo<ChannelPersonalisationContextValue>(
    () => ({
      catalog: state.catalog,
      selectedChannelIds,
      hiddenChannelIds,
      guideSelectedChannelIds: state.preference
        ? state.preference.selectedChannelIds
        : null,
      isPersonalised: state.preference !== null,
      isChannelVisible: (channelId) =>
        state.preference === null || selectedSet.has(channelId),
      canHideChannel: (channelId) =>
        selectedSet.has(channelId) && selectedChannelIds.length > 1,
      setChannelVisible,
      addChannel,
      moveChannel,
      moveChannelToIndex,
      observeCanonicalCatalog,
    }),
    [
      addChannel,
      hiddenChannelIds,
      moveChannel,
      moveChannelToIndex,
      observeCanonicalCatalog,
      selectedChannelIds,
      selectedSet,
      setChannelVisible,
      state.catalog,
      state.preference,
    ],
  );

  return (
    <ChannelPersonalisationContext.Provider value={value}>
      {children}
    </ChannelPersonalisationContext.Provider>
  );
}

/**
 * Read hook used by Guide/Search. Isolated component tests that do not mount the
 * app root keep canonical default behaviour via the non-mutating fallback.
 */
export function useChannelPersonalisation(): ChannelPersonalisationContextValue {
  return useContext(ChannelPersonalisationContext) ?? DEFAULT_CONTEXT;
}

export function useChannelPersonalisationSettings(): ChannelPersonalisationContextValue {
  const context = useContext(ChannelPersonalisationContext);
  if (!context) {
    throw new Error(
      'useChannelPersonalisationSettings must be used within ChannelPersonalisationProvider',
    );
  }
  return context;
}
