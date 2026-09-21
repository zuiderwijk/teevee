// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Channel, Programme } from '@/data/domain/epg';

import { TOTAAL_TYPOGRAPHY } from './totaal';
import { TotaalProgrammeCell } from './TotaalProgrammeCell';

type MockStyle =
  | Record<string, unknown>
  | MockStyle[]
  | null
  | undefined;

type MockProps = {
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  numberOfLines?: number;
  onPress?: () => void;
  style?: MockStyle | ((state: { pressed: boolean }) => MockStyle);
};

function flattenStyle(style: MockStyle): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (result, item) => ({ ...result, ...flattenStyle(item) }),
      {},
    );
  }
  return style;
}

vi.mock('react-native', () => {
  const View = ({ children, testID }: MockProps) =>
    createElement('div', { 'data-testid': testID }, children);
  const Text = ({ children, testID, numberOfLines, style }: MockProps) => {
    const resolved = flattenStyle(style);
    return createElement(
      'span',
      {
        'data-testid': testID,
        'data-number-of-lines': numberOfLines,
        'data-font-family': resolved.fontFamily,
        'data-color': resolved.color,
      },
      children,
    );
  };
  const Pressable = ({
    children,
    testID,
    accessibilityLabel,
    onPress,
    style,
  }: MockProps) => {
    const resolved =
      typeof style === 'function' ? flattenStyle(style({ pressed: false })) : flattenStyle(style);
    return createElement(
      'button',
      {
        'data-testid': testID,
        'aria-label': accessibilityLabel,
        'data-left': resolved.left,
        'data-width': resolved.width,
        'data-radius': resolved.borderRadius,
        'data-background': resolved.backgroundColor,
        onClick: onPress,
      },
      children,
    );
  };

  return {
    Pressable,
    Text,
    View,
    StyleSheet: {
      create: <T,>(value: T) => value,
    },
  };
});

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    colors: {
      background: '#F7F7F5',
      surfaceElevated: '#fff',
      text: '#111',
      textSecondary: '#555',
      border: '#ddd',
    },
  }),
}));

const channel: Channel = {
  id: 'npo-1',
  name: 'NPO 1',
  displayName: 'NPO 1 volledig',
  sortOrder: 0,
  isActive: true,
};

function programme(
  id: string,
  startAt: string,
  endAt: string,
  title = 'Een volledig programmanaam',
): Programme {
  return { id, channelId: channel.id, startAt, endAt, title };
}

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

describe('TotaalProgrammeCell', () => {
  it('renders exact real-duration geometry with no permanent card fill/radius or progress element', async () => {
    const item = programme(
      'current',
      '2026-09-21T18:00:00.000Z',
      '2026-09-21T18:30:00.000Z',
    );

    await act(async () => {
      root.render(
        <TotaalProgrammeCell
          channel={channel}
          programme={item}
          nowMs={Date.parse('2026-09-21T18:15:00.000Z')}
          windowStartMs={Date.parse('2026-09-21T18:00:00.000Z')}
          minuteWidth={3}
          fontScale={1}
          repeatedTitleRunMember={false}
          onSelectProgramme={() => undefined}
        />,
      );
    });

    const button = container.querySelector<HTMLElement>('[data-testid="programme-current"]');
    expect(button?.dataset.left).toBe('0');
    expect(button?.dataset.width).toBe('90');
    expect(button?.dataset.radius).toBe('0');
    expect(button?.dataset.background).toBe('transparent');
    expect(container.querySelector('[data-testid*="progress"]')).toBeNull();
    expect(container.querySelector('[data-testid="totaal-programme-boundary-current"]')).not.toBeNull();
  });

  it('uses tot-end copy and complete current accessibility semantics', async () => {
    const item = programme(
      'current-copy',
      '2026-09-21T18:00:00.000Z',
      '2026-09-21T18:30:00.000Z',
      'Nieuwsuur',
    );

    await act(async () => {
      root.render(
        <TotaalProgrammeCell
          channel={channel}
          programme={item}
          nowMs={Date.parse('2026-09-21T18:15:00.000Z')}
          windowStartMs={Date.parse('2026-09-21T18:00:00.000Z')}
          minuteWidth={3}
          fontScale={1}
          repeatedTitleRunMember={false}
          onSelectProgramme={() => undefined}
        />,
      );
    });

    expect(
      container.querySelector('[data-testid="totaal-programme-secondary-current-copy"]')
        ?.textContent,
    ).toBe('tot 20:30');
    expect(
      container.querySelector('[data-testid="programme-current-copy"]')
        ?.getAttribute('aria-label'),
    ).toBe('NPO 1 volledig, Nieuwsuur, 20:00 tot 20:30, nu bezig');
  });

  it('renders a 15-minute microcell as one centred ellipsis with full action semantics', async () => {
    const short = programme(
      'short',
      '2026-09-21T18:30:00.000Z',
      '2026-09-21T18:45:00.000Z',
      'Volledige microtitel',
    );

    await act(async () => {
      root.render(
        <TotaalProgrammeCell
          channel={channel}
          programme={short}
          nowMs={Date.parse('2026-09-21T18:00:00.000Z')}
          windowStartMs={Date.parse('2026-09-21T18:00:00.000Z')}
          minuteWidth={3}
          fontScale={1}
          repeatedTitleRunMember={false}
          onSelectProgramme={() => undefined}
        />,
      );
    });

    const button = container.querySelector<HTMLElement>('[data-testid="programme-short"]');
    expect(button?.dataset.left).toBe('90');
    expect(button?.dataset.width).toBe('45');
    expect(
      container.querySelector('[data-testid="totaal-programme-title-short"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="totaal-programme-secondary-short"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="totaal-programme-micro-short"]')?.textContent,
    ).toBe('…');
    expect(button?.getAttribute('aria-label')).toBe(
      'NPO 1 volledig, Volledige microtitel, 20:30 tot 20:45',
    );
    expect(
      container.querySelector('[data-testid="totaal-programme-boundary-short"]'),
    ).not.toBeNull();
  });

  it('uses Semibold ellipsis only for the exact current microcell', async () => {
    const currentMicro = programme(
      'current-micro',
      '2026-09-21T18:30:00.000Z',
      '2026-09-21T18:45:00.000Z',
    );

    await act(async () => {
      root.render(
        <TotaalProgrammeCell
          channel={channel}
          programme={currentMicro}
          nowMs={Date.parse('2026-09-21T18:35:00.000Z')}
          windowStartMs={Date.parse('2026-09-21T18:00:00.000Z')}
          minuteWidth={3}
          fontScale={1}
          repeatedTitleRunMember={false}
          onSelectProgramme={() => undefined}
        />,
      );
    });

    expect(
      container.querySelector<HTMLElement>(
        '[data-testid="totaal-programme-micro-current-micro"]',
      )?.dataset.fontFamily,
    ).toBe(TOTAAL_TYPOGRAPHY.currentProgrammeTitle.fontFamily);
  });

  it('keeps repeated-run members as individual programme actions while the visual overlay owns their label', async () => {
    const selected: string[] = [];
    const member = programme(
      'run-member',
      '2026-09-21T18:30:00.000Z',
      '2026-09-21T18:35:00.000Z',
      'Herhaalde editie',
    );

    await act(async () => {
      root.render(
        <TotaalProgrammeCell
          channel={channel}
          programme={member}
          nowMs={Date.parse('2026-09-21T18:00:00.000Z')}
          windowStartMs={Date.parse('2026-09-21T18:00:00.000Z')}
          minuteWidth={3}
          fontScale={1}
          repeatedTitleRunMember
          onSelectProgramme={({ programme: selectedProgramme }) =>
            selected.push(selectedProgramme.id)
          }
        />,
      );
    });

    expect(
      container.querySelector('[data-testid="totaal-programme-micro-run-member"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="totaal-programme-title-run-member"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="totaal-programme-boundary-run-member"]'),
    ).not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLElement>('[data-testid="programme-run-member"]')?.click();
    });
    expect(selected).toEqual(['run-member']);
  });

  it('allows two title lines and visible start time only at comfortable width', async () => {
    const comfortable = programme(
      'comfortable',
      '2026-09-21T19:00:00.000Z',
      '2026-09-21T20:00:00.000Z',
    );

    await act(async () => {
      root.render(
        <TotaalProgrammeCell
          channel={channel}
          programme={comfortable}
          nowMs={Date.parse('2026-09-21T18:00:00.000Z')}
          windowStartMs={Date.parse('2026-09-21T18:00:00.000Z')}
          minuteWidth={3}
          fontScale={1}
          repeatedTitleRunMember={false}
          onSelectProgramme={() => undefined}
        />,
      );
    });

    expect(
      container.querySelector('[data-testid="totaal-programme-title-comfortable"]')
        ?.getAttribute('data-number-of-lines'),
    ).toBe('2');
    expect(
      container.querySelector('[data-testid="totaal-programme-secondary-comfortable"]')
        ?.textContent,
    ).toBe('21:00');
  });
});
