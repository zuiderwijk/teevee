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
    maxFontSizeMultiplier?: number;
    onError?: () => void;
  };

  const View = ({ children, accessibilityLabel }: Props) =>
    createElement('div', { 'aria-label': accessibilityLabel }, children);
  const Text = ({ children, ellipsizeMode, maxFontSizeMultiplier }: Props) =>
    createElement('span', {
      'data-ellipsize-mode': ellipsizeMode,
      'data-max-font-scale': maxFontSizeMultiplier,
    }, children);
  const Image = ({ onError }: Props) => createElement('img', { onError });

  return {
    View,
    Text,
    Image,
    Platform: { OS: 'ios' },
    StyleSheet: { create: <T,>(value: T) => value },
  };
});

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

  it('uses logo-only presentation without losing accessible channel identity', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{ ...baseChannel, logoUrl: 'https://example.com/publiek-1.png' }}
          textColor="#111"
          mutedTextColor="#777"
          variant="logo-first"
        />,
      );
    });

    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('[aria-label="Publiek 1"]')).not.toBeNull();
  });

  it('keeps Per-zender fallback inside the logo slot and uses shortName when available', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{ ...baseChannel, shortName: 'P1' }}
          textColor="#111"
          mutedTextColor="#777"
          variant="per-channel-strip"
        />,
      );
    });

    const fallback = container.querySelector('span');
    expect(fallback?.textContent).toBe('P1');
    expect(fallback?.getAttribute('data-ellipsize-mode')).toBe('tail');
    expect(fallback?.getAttribute('data-max-font-scale')).toBe('1.2');
    expect(container.querySelector('[aria-label="Publiek 1"]')).not.toBeNull();
  });

  it('does not add a permanent caption beneath a successful Per-zender logo', async () => {
    await act(async () => {
      root.render(
        <ChannelIdentity
          channel={{ ...baseChannel, shortName: 'P1', logoUrl: 'https://example.com/publiek-1.png' }}
          textColor="#111"
          mutedTextColor="#777"
          variant="per-channel-strip"
        />,
      );
    });

    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('span')).toBeNull();
  });
});
