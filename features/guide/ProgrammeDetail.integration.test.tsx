// @vitest-environment jsdom
// These are React state/render regressions with mocked native hosts, not iOS
// animation, layout, accessibility, gesture-latency or performance benchmarks.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GuideScreen from '@/app/index';
import { guideFixture } from '@/data/fixtures/guideFixture';
import { useGuideClock } from '@/features/guide/useGuideClock';

import { MISSING_DESCRIPTION, ProgrammeDetail } from './ProgrammeDetail';

vi.mock('@/features/guide/useGuideClock', () => ({
  useGuideClock: vi.fn(() => Date.parse('2026-09-13T08:00:00+02:00')),
}));
vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});
vi.mock('react-native', async () => {
  const { createElement, forwardRef } = await import('react');
  type HostProps = {
    children?: ReactNode;
    testID?: string;
    onPress?: () => void;
    onRequestClose?: () => void;
    visible?: boolean;
    accessibilityLabel?: string;
  };
  const View = ({ children, testID }: HostProps) => createElement('div', { 'data-testid': testID }, children);
  const Text = ({ children }: HostProps) => createElement('span', null, children);
  const Pressable = ({ children, testID, onPress, accessibilityLabel }: HostProps) => createElement('button', {
    'data-testid': testID, 'aria-label': accessibilityLabel, onClick: onPress,
  }, children);
  const ScrollView = forwardRef<HTMLDivElement, HostProps>(function MockScrollView({ children, testID }, ref) {
    return createElement('div', { ref, 'data-testid': testID }, children);
  });
  const Modal = ({ children, visible, onRequestClose }: HostProps) => visible ? createElement('section', { role: 'dialog' },
    createElement('button', { 'data-testid': 'native-request-close', onClick: onRequestClose }, 'Native close'),
    children,
  ) : null;
  return {
    View, Text, Pressable, ScrollView, Modal, SafeAreaView: View,
    StyleSheet: { create: <T,>(value: T) => value, hairlineWidth: 1, absoluteFill: {} },
  };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // Initial positioning is irrelevant to this regression and must not occur
  // halfway through assertions. Native scroll execution remains a device test.
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-13T08:00:00+02:00'));
  vi.mocked(useGuideClock).mockClear();
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

function getByTestId(id: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) throw new Error(`Missing test node: ${id}`);
  return element;
}

async function click(id: string) {
  await act(async () => getByTestId(id).click());
}

describe('programme detail rendering boundary', () => {
  it('opens/closes repeatedly without rerendering or remounting the 48-channel Guide', async () => {
    await act(async () => root.render(<GuideScreen />));
    const timeScroll = getByTestId('guide-time-scroll');
    const channelScroll = getByTestId('guide-channel-scroll');
    timeScroll.scrollLeft = 650;
    channelScroll.scrollTop = 900;
    const renderCount = vi.mocked(useGuideClock).mock.calls.length;
    expect(renderCount).toBeGreaterThan(0);
    expect(guideFixture.channels).toHaveLength(48);
    expect(container.querySelectorAll('[data-testid^="programme-channel-"]').length).toBeGreaterThan(1000);

    const first = guideFixture.programmes[0]!;
    for (const closeId of ['programme-detail-close', 'programme-detail-backdrop', 'native-request-close']) {
      await click(`programme-${first.id}`);
      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
      expect(getByTestId('programme-detail-sheet').textContent).toContain(first.title);
      expect(getByTestId('programme-detail-sheet').textContent).toContain(MISSING_DESCRIPTION);
      expect(vi.mocked(useGuideClock)).toHaveBeenCalledTimes(renderCount);
      await click(closeId);
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(vi.mocked(useGuideClock)).toHaveBeenCalledTimes(renderCount);
      expect(getByTestId('guide-time-scroll')).toBe(timeScroll);
      expect(getByTestId('guide-channel-scroll')).toBe(channelScroll);
      expect(timeScroll.scrollLeft).toBe(650);
      expect(channelScroll.scrollTop).toBe(900);
    }
  });

  it('shows the correct next programme and does not dismiss when its text is tapped', async () => {
    await act(async () => root.render(<GuideScreen />));
    const first = guideFixture.programmes[0]!;
    const second = guideFixture.programmes.find((programme) => programme.description !== undefined)!;
    await click(`programme-${first.id}`);
    await click('programme-detail-close');
    await click(`programme-${second.id}`);
    const sheet = getByTestId('programme-detail-sheet');
    expect(sheet.textContent).toContain(second.title);
    expect(sheet.textContent).toContain(second.description);
    await act(async () => sheet.querySelector('span')!.click());
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it.each([undefined, '', '   '])('handles absent or blank descriptions: %s', async (description) => {
    const programme = { id: 'missing', channelId: 'test', title: 'Zonder tekst', startAt: '2026-09-13T18:00:00Z', endAt: '2026-09-13T19:00:00Z', ...(description === undefined ? {} : { description }) };
    await act(async () => root.render(<ProgrammeDetail state={{ visible: true, selection: { programme, channelName: 'Testzender' } }} onClose={vi.fn()} />));
    expect(getByTestId('programme-detail-sheet').textContent).toContain(MISSING_DESCRIPTION);
  });
});
