// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { guideTelevisionDayHorizon } from '@/data/domain/guideTime';

import { GuideDaySelector } from './GuideDaySelector';

type MockProps = {
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: { selected?: boolean; busy?: boolean };
  visible?: boolean;
  maxFontSizeMultiplier?: number;
  onPress?: () => void;
  onRequestClose?: () => void;
  style?: unknown;
};

vi.mock('react-native', () => {
  const element = (tag: string, props: MockProps) =>
    createElement(
      tag,
      {
        'data-testid': props.testID,
        'data-max-font-scale': props.maxFontSizeMultiplier,
        'aria-label': props.accessibilityLabel,
        'aria-selected': props.accessibilityState?.selected,
        'aria-busy': props.accessibilityState?.busy,
        onClick: props.onPress,
      },
      props.children,
    );

  return {
    Modal: ({ children, visible }: MockProps) => (visible ? createElement('div', { 'data-modal': 'true' }, children) : null),
    Pressable: (props: MockProps) => element('button', props),
    SafeAreaView: (props: MockProps) => element('div', props),
    ScrollView: (props: MockProps) => element('div', props),
    View: (props: MockProps) => element('div', props),
    Text: (props: MockProps) => element('span', props),
    Platform: { OS: 'ios' },
    StyleSheet: {
      hairlineWidth: 1,
      absoluteFill: {},
      create: <T,>(value: T) => value,
    },
  };
});

vi.mock('@/theme/useTeeveeTheme', () => ({
  useTeeveeTheme: () => ({
    dark: false,
    colors: {
      background: '#fff',
      surface: '#fff',
      surfaceElevated: '#f5f5f5',
      text: '#111',
      textSecondary: '#555',
      textMuted: '#777',
      border: '#ddd',
      accent: '#111',
      currentTime: '#d44',
      programme: '#eee',
      programmeCurrent: '#ddd',
    },
  }),
}));

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

async function click(selector: string) {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  await act(async () => element.click());
}

describe('GuideDaySelector', () => {
  it('opens exactly ten D-2..D+7 options with one explicit accessible selected state', async () => {
    const nowMs = Date.parse('2026-09-15T17:00:00Z');
    const horizon = guideTelevisionDayHorizon(nowMs);
    const onSelectDay = vi.fn();

    await act(async () => {
      root.render(
        <GuideDaySelector
          selectedDayStartMs={horizon[0]!.fromMs}
          nowMs={nowMs}
          onSelectDay={onSelectDay}
        />,
      );
    });
    await click('[data-testid="guide-day-selector"]');

    const options = [...container.querySelectorAll<HTMLElement>('[data-testid^="guide-day-option-"]')];
    expect(options).toHaveLength(10);
    expect(options[0]?.dataset.testid).toBe('guide-day-option--2');
    expect(options.at(-1)?.dataset.testid).toBe('guide-day-option-7');
    expect(options.filter((option) => option.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="guide-day-option-selected-mark"]')).toHaveLength(1);
  });

  it('uses the preceding absolute television-day date before 06:00 and never exposes an unbounded calendar', async () => {
    const nowMs = Date.parse('2026-09-15T03:59:00Z');
    const selectedDay = guideTelevisionDayHorizon(nowMs).find(({ offset }) => offset === 0)!;

    await act(async () => {
      root.render(
        <GuideDaySelector
          selectedDayStartMs={selectedDay.fromMs}
          nowMs={nowMs}
          onSelectDay={() => undefined}
        />,
      );
    });

    const selector = container.querySelector<HTMLElement>('[data-testid="guide-day-selector"]');
    expect(selector?.getAttribute('aria-label')).toContain('Ma 14 sep');
    expect(selector?.getAttribute('aria-label')).not.toContain('Vandaag · ma 14 sep');

    await click('[data-testid="guide-day-selector"]');
    expect(container.querySelectorAll('[data-testid^="guide-day-option-"]')).toHaveLength(10);
    expect(container.textContent).not.toContain('Kies datum');
  });

  it('keeps compact date/prefix copy inside the documented 1.20 chrome scaling cap', async () => {
    const nowMs = Date.parse('2026-09-15T17:00:00Z');
    const selectedDay = guideTelevisionDayHorizon(nowMs)[2]!;

    await act(async () => {
      root.render(
        <GuideDaySelector
          selectedDayStartMs={selectedDay.fromMs}
          nowMs={nowMs}
          compactPrefix="NPO 1"
          onSelectDay={() => undefined}
        />,
      );
    });

    expect(container.querySelector('[data-testid="guide-day-selector"]')?.getAttribute('aria-label')).toContain('NPO 1');
    const capped = [...container.querySelectorAll('[data-max-font-scale]')];
    expect(capped).toHaveLength(2);
    expect(capped.every((node) => node.getAttribute('data-max-font-scale') === '1.2')).toBe(true);
  });

  it('announces loading state and commits the chosen day from the whole option row', async () => {
    const nowMs = Date.parse('2026-09-15T17:00:00Z');
    const horizon = guideTelevisionDayHorizon(nowMs);
    const onSelectDay = vi.fn();

    await act(async () => {
      root.render(
        <GuideDaySelector
          selectedDayStartMs={horizon[2]!.fromMs}
          nowMs={nowMs}
          loading
          onSelectDay={onSelectDay}
        />,
      );
    });

    expect(
      container.querySelector('[data-testid="guide-day-selector"]')?.getAttribute('aria-busy'),
    ).toBe('true');

    await click('[data-testid="guide-day-selector"]');
    await click('[data-testid="guide-day-option-7"]');

    expect(onSelectDay).toHaveBeenCalledWith(horizon.at(-1)!.fromMs);
    expect(container.querySelector('[data-modal="true"]')).toBeNull();
  });
});
