// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ChannelPersonalisationProvider,
  useChannelPersonalisationSettings,
  type ChannelPersonalisationContextValue,
} from './ChannelPersonalisationProvider';

const storage = vi.hoisted(() => ({
  read: vi.fn(() => ({
    version: 1 as const,
    guidePresentation: 'per-channel' as const,
    appearance: 'system' as const,
  })),
  write: vi.fn(() => true),
}));

vi.mock('@/services/storage/appPreferencesStorage', () => ({
  readAppPreferences: storage.read,
  writeAppPreferences: storage.write,
}));

let api: ChannelPersonalisationContextValue | null = null;

function Probe() {
  api = useChannelPersonalisationSettings();
  return null;
}

let root: Root;
let container: HTMLDivElement;

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  api = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <ChannelPersonalisationProvider>
        <Probe />
      </ChannelPersonalisationProvider>,
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('ChannelPersonalisationProvider reorder persistence', () => {
  it('persists exactly once for one arbitrary-index reorder and not for a no-op repeat', async () => {
    expect(api).not.toBeNull();
    expect(api!.selectedChannelIds.slice(0, 4)).toEqual([
      'nl-npo-1',
      'nl-npo-2',
      'nl-npo-3',
      'nl-rtl-4',
    ]);

    await act(async () => {
      api!.moveChannelToIndex('nl-npo-1', 2);
    });

    expect(storage.write).toHaveBeenCalledTimes(1);
    const persisted = storage.write.mock.calls[0]![0];
    expect(persisted.channelPersonalisation?.selectedChannelIds.slice(0, 4)).toEqual([
      'nl-npo-2',
      'nl-npo-3',
      'nl-npo-1',
      'nl-rtl-4',
    ]);

    await act(async () => {
      api!.moveChannelToIndex('nl-npo-1', 2);
    });

    expect(storage.write).toHaveBeenCalledTimes(1);
  });
});
