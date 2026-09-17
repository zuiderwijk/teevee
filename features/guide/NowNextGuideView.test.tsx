// @vitest-environment jsdom
import {
  act,
  createElement,
  forwardRef,
  type ReactNode,
  useImperativeHandle,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NowNextGuideView } from './NowNextGuideView';

const NOW_MS = Date.parse('2026-09-15T10:45:00+02:00');

vi.mock('./useGuideClock', () => ({
  useGuideClock: () => NOW_MS,
}));

vi.mock('./ChannelIdentity', () => ({
  ChannelIdentity: ({ channel }: { channel: { displayName: string } }) =>
    createElement('span', null, channel.displayName),
}));

vi.mock('./GuideChrome', () => ({
  GuideChrome: ({ presentationNavigation }: { presentationNavigation?: ReactNode }) =>
    createElement('div', { 'data-testid': 'mock-guide-chrome' }, presentationNavigation),
}));

type MockProps = {
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: (event: unknown) => void;
  onMomentumScrollEnd?: (event: unknown) => void;
  onScroll?: (event: unknown) => void;
};

vi.mock('react-native', async () => {
  const element = (tag: string, props: MockProps) =>
    createElement(
      tag,
      {
        'data-testid': props.testID,
        'aria-label': props.accessibilityLabel,
        'aria-selected': props.accessibilityState?.selected,
        onClick: props.onPress,
        onDoubleClick: props.onMomentumScrollEnd
          ? () => props.onMomentumScrollEnd?.({ nativeEvent: { contentOffset: { x: 760 } } })
          : undefined,
      },
      props.children,
    );

  const ScrollView = forwardRef(function MockScrollView(props: MockProps, ref) {
    useImperativeHandle(ref, () => ({ scrollTo: vi.fn() }));
    return element('div', props);
  });

  return {
    Pressable: (props: MockProps) => element('button', props),
    SafeAreaView: (props: MockProps) => element('div', props),
    ScrollView,
    View: (props: MockProps) => element('div', props),
    Text: (props: MockProps) => element('span', props),
    useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1, scale: 3 }),
    StyleSheet: {
      hairlineWidth: 1,
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
  vi.spyOn(Date, 'now').mockReturnValue(NOW_MS);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('NowNextGuideView temporal chrome', () => {
  it('stays live when a programmatic rail alignment reports momentum completion', async () => {
    await act(async () => {
      root.render(<NowNextGuideView onSelectProgramme={() => undefined} />);
    });

    const rail = container.querySelector<HTMLElement>('[data-testid="now-next-time-rail"]');
    expect(rail).not.toBeNull();

    await act(async () => {
      rail?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="now-next-reference-badge"]')?.textContent).toContain('10:45');
    expect(container.querySelector('[data-testid="now-next-primetime-action"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="now-next-now-action"]')).toBeNull();
  });

  it('uses one shared live reference and swaps Primetime for Nu while browsing', async () => {
    await act(async () => {
      root.render(<NowNextGuideView onSelectProgramme={() => undefined} />);
    });

    const badge = () => container.querySelector('[data-testid="now-next-reference-badge"]');
    expect(badge()?.textContent).toContain('10:45');
    expect(container.querySelector('[data-testid="now-next-primetime-action"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="now-next-now-action"]')).toBeNull();

    const primetime = container.querySelector<HTMLButtonElement>('[data-testid="now-next-primetime-action"]');
    await act(async () => primetime?.click());

    expect(badge()?.textContent).toContain('20:30');
    expect(container.querySelector('[data-testid="now-next-primetime-action"]')).toBeNull();
    expect(container.querySelector('[data-testid="now-next-now-action"]')).not.toBeNull();

    const now = container.querySelector<HTMLButtonElement>('[data-testid="now-next-now-action"]');
    await act(async () => now?.click());

    expect(badge()?.textContent).toContain('10:45');
    expect(container.querySelector('[data-testid="now-next-primetime-action"]')).not.toBeNull();
  });
});
