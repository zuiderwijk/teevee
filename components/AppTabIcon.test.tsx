// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppTabIcon } from './AppTabIcon';

vi.mock('react-native', () => {
  type Props = { children?: ReactNode; testID?: string };
  const View = ({ children, testID }: Props) =>
    createElement('div', { 'data-testid': testID }, children);
  return {
    View,
    StyleSheet: { create: <T,>(value: T) => value },
  };
});

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

describe('AppTabIcon', () => {
  it.each([
    ['guide', 'app-tab-icon-guide'],
    ['tonight', 'app-tab-icon-tonight'],
    ['search', 'app-tab-icon-search'],
  ] as const)('renders the accepted %s icon treatment', async (name, testID) => {
    await act(async () => {
      root.render(<AppTabIcon name={name} color="#111" focused />);
    });

    expect(container.querySelector(`[data-testid="${testID}"]`)).not.toBeNull();
  });
});
