// @vitest-environment jsdom
import {
  createElement,
  forwardRef,
  type ReactNode,
} from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/theme/useTeeveeTheme', async () => {
  const { lightTheme } = await import('@/theme/tokens');
  return { useTeeveeTheme: () => lightTheme };
});

vi.mock('@/features/guide/channelLogoRegistry', () => ({
  resolveChannelLogo: () => null,
}));

vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) =>
    fn(...args),
}));

vi.mock('react-native-gesture-handler', () => {
  const pan = {
    enabled: () => pan,
    activateAfterLongPress: () => pan,
    failOffsetY: () => pan,
    onStart: () => pan,
    onUpdate: () => pan,
    onEnd: () => pan,
    onFinalize: () => pan,
  };
  return {
    Gesture: { Pan: () => pan },
    GestureDetector: ({ children }: { children: ReactNode }) => children,
  };
});

vi.mock('react-native-reanimated', async () => {
  const { View } = await import('react-native');
  const transition = {
    easing: () => transition,
  };
  return {
    default: { View },
    Easing: { cubic: () => 0, out: () => () => 0 },
    FadeIn: { duration: () => undefined },
    FadeOut: { duration: () => undefined },
    LinearTransition: { duration: () => transition },
  };
});

vi.mock('react-native', async () => {
  const React = await import('react');

  type HostProps = {
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    testID?: string;
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityActions?: Array<{ name: string; label: string }>;
    accessibilityElementsHidden?: boolean;
    importantForAccessibility?: string;
    disabled?: boolean;
    onPress?: () => void;
    onLayout?: (event: { nativeEvent: { layout: { height: number } } }) => void;
    style?: unknown;
  };

  const flattenStyle = (style: unknown): Record<string, unknown> => {
    if (Array.isArray(style)) {
      return style.reduce<Record<string, unknown>>(
        (result, item) => ({ ...result, ...flattenStyle(item) }),
        {},
      );
    }
    return style && typeof style === 'object'
      ? (style as Record<string, unknown>)
      : {};
  };

  const childrenFor = (children: HostProps['children']) =>
    typeof children === 'function' ? children({ pressed: false }) : children;

  const hostProps = (props: HostProps) => ({
    'data-testid': props.testID,
    'data-focusable': props.accessible ? 'true' : undefined,
    'data-actions': props.accessibilityActions
      ? JSON.stringify(props.accessibilityActions)
      : undefined,
    'aria-label': props.accessibilityLabel,
    'data-hint': props.accessibilityHint,
    'aria-hidden':
      props.accessibilityElementsHidden ||
      props.importantForAccessibility === 'no-hide-descendants' ||
      props.accessible === false
        ? 'true'
        : undefined,
    'data-style': JSON.stringify(flattenStyle(props.style)),
  });

  const View = forwardRef<HTMLDivElement, HostProps>((props, ref) =>
    createElement('div', { ...hostProps(props), ref }, childrenFor(props.children)),
  );
  View.displayName = 'View';

  const Text = (props: HostProps) =>
    createElement('span', hostProps(props), childrenFor(props.children));

  const Pressable = forwardRef<HTMLButtonElement, HostProps>((props, ref) =>
    createElement(
      'button',
      {
        ...hostProps(props),
        ref,
        disabled: props.disabled,
        onClick: props.onPress,
      },
      childrenFor(props.children),
    ),
  );
  Pressable.displayName = 'Pressable';

  return {
    Image: (props: HostProps) => createElement('span', hostProps(props)),
    Platform: { OS: 'ios' },
    Pressable,
    StyleSheet: {
      create: <T,>(value: T) => value,
      hairlineWidth: 1,
    },
    Text,
    View,
  };
});

import { ChannelManagementRow } from './ChannelManagementRow';

const channel = {
  id: 'npo',
  name: 'NPO 1',
  displayName: 'NPO 1',
  shortName: 'NPO 1',
  sortOrder: 1,
  isActive: true,
};

let root: Root;
let container: HTMLDivElement;

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

async function render(
  overrides: Partial<React.ComponentProps<typeof ChannelManagementRow>> = {},
) {
  await act(async () => {
    root.render(
      <ChannelManagementRow
        channel={channel}
        visible
        index={0}
        total={3}
        minHeight={56}
        nameLines={1}
        canHide
        reorderEnabled
        reduceMotion={false}
        showSeparator
        onToggleVisibility={() => undefined}
        onMoveOneStep={() => undefined}
        onDragStart={() => undefined}
        onDragMove={() => undefined}
        onDragFinalize={() => undefined}
        {...overrides}
      />,
    );
  });
}

describe('ChannelManagementRow accessibility surface', () => {
  it('exposes one row focus stop while eye and drag handle remain sighted-only targets', async () => {
    await render();

    const focusStops = container.querySelectorAll('[data-focusable="true"]');
    expect(focusStops).toHaveLength(1);
    expect(focusStops[0]?.getAttribute('aria-label')).toBe(
      'NPO 1, zichtbaar, positie 1 van 3',
    );

    const eye = container.querySelector('[data-testid="channels-visibility-npo"]');
    const handle = container.querySelector('[data-testid="channels-drag-npo"]');
    expect(eye?.getAttribute('aria-hidden')).toBe('true');
    expect(handle?.getAttribute('aria-hidden')).toBe('true');

    expect(focusStops[0]?.getAttribute('data-actions')).toContain(
      'Verberg zender',
    );
    expect(focusStops[0]?.getAttribute('data-actions')).toContain(
      'Verplaats omlaag',
    );
  });

  it('keeps the active row and native drag handle mounted when pickup becomes a placeholder', async () => {
    await render();

    const rowBefore = container.querySelector(
      '[data-testid="channels-visible-npo"]',
    );
    const handleBefore = container.querySelector(
      '[data-testid="channels-drag-npo"]',
    );
    expect(rowBefore).not.toBeNull();
    expect(handleBefore).not.toBeNull();

    await render({ draggingPlaceholder: true });

    const rowAfter = container.querySelector(
      '[data-testid="channels-visible-npo"]',
    );
    const handleAfter = container.querySelector(
      '[data-testid="channels-drag-npo"]',
    );

    expect(rowAfter).toBe(rowBefore);
    expect(handleAfter).toBe(handleBefore);
    expect(
      container.querySelector('[data-testid="channels-drop-slot-npo"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll('[data-focusable="true"]')).toHaveLength(0);
  });

  it('preserves the dragged handle identity while its keyed row moves between siblings', async () => {
    const channels = ['a', 'b', 'c'].map((id, index) => ({
      ...channel,
      id,
      displayName: id.toUpperCase(),
      name: id.toUpperCase(),
      sortOrder: index,
    }));

    const renderOrder = async (order: string[]) => {
      await act(async () => {
        root.render(
          <>
            {order.map((id, index) => {
              const item = channels.find((candidate) => candidate.id === id)!;
              return (
                <ChannelManagementRow
                  key={item.id}
                  channel={item}
                  visible
                  index={index}
                  total={order.length}
                  minHeight={56}
                  nameLines={1}
                  canHide
                  reorderEnabled
                  reduceMotion={false}
                  showSeparator={index < order.length - 1}
                  draggingPlaceholder={item.id === 'b'}
                  onToggleVisibility={() => undefined}
                  onMoveOneStep={() => undefined}
                  onDragStart={() => undefined}
                  onDragMove={() => undefined}
                  onDragFinalize={() => undefined}
                />
              );
            })}
          </>,
        );
      });
    };

    await renderOrder(['a', 'b', 'c']);
    const rowBefore = container.querySelector('[data-testid="channels-visible-b"]');
    const handleBefore = container.querySelector('[data-testid="channels-drag-b"]');

    await renderOrder(['a', 'c', 'b']);

    expect(
      container.querySelector('[data-testid="channels-visible-b"]'),
    ).toBe(rowBefore);
    expect(
      container.querySelector('[data-testid="channels-drag-b"]'),
    ).toBe(handleBefore);
  });

  it('gives the eye and drag handle the full measured row-height target', async () => {
    await render();

    const row = container.querySelector('[data-testid="channels-visible-npo"]');
    const eye = container.querySelector('[data-testid="channels-visibility-npo"]');
    const handle = container.querySelector('[data-testid="channels-drag-npo"]');
    const rowStyle = JSON.parse(row?.getAttribute('data-style') ?? '{}');
    const eyeStyle = JSON.parse(eye?.getAttribute('data-style') ?? '{}');
    const handleStyle = JSON.parse(handle?.getAttribute('data-style') ?? '{}');

    expect(rowStyle.minHeight).toBe(56);
    expect(rowStyle.paddingVertical).toBeUndefined();
    expect(eyeStyle).toMatchObject({ width: 48, alignSelf: 'stretch' });
    expect(handleStyle).toMatchObject({ width: 48, alignSelf: 'stretch' });
  });

  it('omits reorder actions and the drag handle while management Search is active', async () => {
    await render({ reorderEnabled: false });

    expect(
      container.querySelector('[data-testid="channels-drag-npo"]'),
    ).toBeNull();
    const row = container.querySelector('[data-focusable="true"]');
    expect(row?.getAttribute('data-actions')).toBe(
      JSON.stringify([{ name: 'hide', label: 'Verberg zender' }]),
    );
  });

  it('keeps the last visible eye present but disabled and removes the hide action', async () => {
    await render({ total: 1, canHide: false });

    const eye = container.querySelector<HTMLButtonElement>(
      '[data-testid="channels-visibility-npo"]',
    );
    expect(eye).not.toBeNull();
    expect(eye?.disabled).toBe(true);
    const row = container.querySelector('[data-focusable="true"]');
    expect(row?.getAttribute('data-actions')).toBe('[]');
    expect(row?.getAttribute('data-hint')).toBe(
      'Minimaal één zender moet zichtbaar blijven',
    );
  });

  it('exposes only Toon zender for a hidden row and never renders a drag handle', async () => {
    await render({
      visible: false,
      index: 0,
      total: 1,
      canHide: false,
      reorderEnabled: false,
    });

    const row = container.querySelector('[data-focusable="true"]');
    expect(row?.getAttribute('aria-label')).toBe('NPO 1, verborgen');
    expect(row?.getAttribute('data-actions')).toBe(
      JSON.stringify([{ name: 'show', label: 'Toon zender' }]),
    );
    expect(
      container.querySelector('[data-testid="channels-drag-npo"]'),
    ).toBeNull();
  });
});
