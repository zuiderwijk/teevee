// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Channel } from '@/data/domain/epg';

import { ChannelIdentity } from './ChannelIdentity';

vi.mock('react-native', () => {
  type Props = {
    children?: ReactNode;
    accessibilityLabel?: string;
    ellipsizeMode?: string;
    numberOfLines?: number;
    onError?: () => void;
  };

  const View = ({ children, accessibilityLabel }: Props) =>
    createElement('div', { 'aria-label': accessibilityLabel }, children);
  const Text = ({ children, ellipsizeMode, numberOfLines }: Props) =>
    createElement(
      'span',
      {
        'data-ellipsize-mode': ellipsizeMode,
        'data-number-of-lines': numberOfLines,
      },
      children,
    );
  const Image = ({ onError }: Props) => createElement('img', { onError });

  return {
    View,
    Text,
    Image,
    StyleSheet: { create: <T,>(value: T) => value },
  };
});

vi.mock('./channelLogoRegistry', () => ({
  resolveChannelLogo: (channel: { id: string; logoUrl?: string }) => {
    if (channel.id === 'nl-npo-1') return { key: 'local:nl-npo-1', source: 1 };
    if (channel.logoUrl) return { key: `remote:${channel.logoUrl}`, source: { uri: channel.logoUrl } };
    return null;
  },
}));

const baseChannel: Channel = {
  id: 'publiek-1',
  name: 'Publiek 1',
  displayName: 'Publiek 1',
  sortOrder: 0,
  isActive: true,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('ChannelIdentity', () => {
  it('preserves differentiating suffixes when a text-only identity must truncate', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity channel={baseChannel} textColor="#111" mutedTextColor="#777" />,
      );
    });

    expect(container.querySelector('span')?.getAttribute('data-ellipsize-mode')).toBe('middle');
    expect(container.textContent).toBe('Publiek 1');
  });

  it('keeps conventional tail truncation when a logo already carries the primary identity', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{ ...baseChannel, logoUrl: 'https://example.com/publiek-1.png' }}
          textColor="#111"
          mutedTextColor="#777"
        />,
      );
    });

    expect(container.querySelector('span')?.getAttribute('data-ellipsize-mode')).toBe('tail');
  });

  it('uses the short name inside the Per-zender fallback while exposing the full channel name', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{ ...baseChannel, shortName: 'NPO 1' }}
          textColor="#111"
          mutedTextColor="#777"
          variant="per-channel-strip"
        />,
      );
    });

    expect(container.textContent).toBe('NPO 1');
    expect(container.querySelector('[aria-label="Publiek 1"]')).not.toBeNull();
    expect(container.querySelector('span')?.getAttribute('data-ellipsize-mode')).toBe('tail');
  });

  it('does not render a permanent caption under a successful Per-zender logo', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{
            ...baseChannel,
            shortName: 'NPO 1',
            logoUrl: 'https://example.com/publiek-1.png',
          }}
          textColor="#111"
          mutedTextColor="#777"
          variant="per-channel-strip"
        />,
      );
    });

    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('[aria-label="Publiek 1"]')).not.toBeNull();
  });

  it('resolves a local canonical Per-zender logo without a visible caption and keeps the full accessibility name', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{ ...baseChannel, id: 'nl-npo-1', displayName: 'NPO 1', shortName: 'NPO 1' }}
          textColor="#111"
          mutedTextColor="#777"
          variant="per-channel-strip"
        />,
      );
    });

    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('[aria-label="NPO 1"]')).not.toBeNull();
  });

  it('exposes the full Nu & Straks channel name when retained identity is the only accessible channel semantics', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{
            ...baseChannel,
            id: 'nl-npo-1',
            displayName: 'Nederland 1 volledig',
            shortName: 'NPO 1',
          }}
          textColor="#111"
          mutedTextColor="#777"
          variant="now-next"
          accessible
        />,
      );
    });

    expect(
      container.querySelector('[aria-label="Nederland 1 volledig"]'),
    ).not.toBeNull();
  });

  it('uses the fixed Nu & Straks identity without adding an extra accessibility focus stop', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{ ...baseChannel, id: 'nl-npo-1', displayName: 'NPO 1', shortName: 'NPO 1' }}
          textColor="#111"
          mutedTextColor="#777"
          variant="now-next"
          accessible={false}
        />,
      );
    });

    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('[aria-label]')).toBeNull();
  });

  it('uses a 48x36 logo-first Totaal identity without a duplicate visible caption', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{
            ...baseChannel,
            id: 'nl-npo-1',
            displayName: 'Nederland 1 volledig',
            shortName: 'NPO 1',
          }}
          textColor="#111"
          mutedTextColor="#777"
          variant="totaal"
          accessible={false}
        />,
      );
    });

    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('[aria-label]')).toBeNull();
  });

  it('uses the full Totaal displayName as a max-two-line fallback and accessibility identity', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{
            ...baseChannel,
            displayName: 'Publieke Omroep Volledig',
            shortName: 'PO',
          }}
          textColor="#111"
          mutedTextColor="#777"
          variant="totaal"
          accessible
        />,
      );
    });

    expect(container.textContent).toBe('Publieke Omroep Volledig');
    expect(container.querySelector('span')?.getAttribute('data-number-of-lines')).toBe('2');
    expect(container.querySelector('[aria-label="Publieke Omroep Volledig"]')).not.toBeNull();
  });

  it('falls back inside the same Per-zender identity after a logo load failure', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{
            ...baseChannel,
            shortName: 'NPO 1',
            logoUrl: 'https://example.com/publiek-1.png',
          }}
          textColor="#111"
          mutedTextColor="#777"
          variant="per-channel-strip"
        />,
      );
    });

    const image = container.querySelector('img');
    expect(image).not.toBeNull();

    await act(async () => {
      image?.dispatchEvent(new Event('error', { bubbles: true }));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('NPO 1');
    expect(container.querySelector('[aria-label="Publiek 1"]')).not.toBeNull();
  });
});
