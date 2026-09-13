import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GuideFixture, Programme } from '@/data/domain/epg';
import { useTeeveeTheme } from '@/theme/useTeeveeTheme';

import { edgeReadableProgramme, visibleRowRange } from './edgeReadability';
import {
  GUIDE_PROGRAMME_TIME_MIN_VISIBLE_WIDTH,
  programmeContentMode,
} from './geometry';
import type { GuideLayoutMetrics } from './layout';

const MIN_READABLE_TEXT_WIDTH = 16;

type ViewportState = {
  x: number;
  y: number;
};

export type EdgeReadabilityOverlayHandle = {
  updateHorizontal: (x: number) => void;
  updateVertical: (y: number) => void;
  setViewport: (x: number, y: number) => void;
};

type EdgeReadabilityOverlayProps = {
  fixture: GuideFixture;
  layout: GuideLayoutMetrics;
  windowStart: number;
  viewportWidth: number;
  viewportHeight: number;
  nowMs: number;
  nowX: number;
  nowInWindow: boolean;
};

function finiteOrZero(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function formatTime(timeMs: number) {
  return new Date(timeMs).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

export const EdgeReadabilityOverlay = forwardRef<
  EdgeReadabilityOverlayHandle,
  EdgeReadabilityOverlayProps
>(function EdgeReadabilityOverlay(
  {
    fixture,
    layout,
    windowStart,
    viewportWidth,
    viewportHeight,
    nowMs,
    nowX,
    nowInWindow,
  },
  ref,
) {
  const theme = useTeeveeTheme();
  const [viewport, setViewportState] = useState<ViewportState>({ x: 0, y: 0 });
  const pendingViewportRef = useRef<ViewportState>({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const programmesByChannel = useMemo(() => {
    const map = new Map<string, Programme[]>();
    for (const channel of fixture.channels) map.set(channel.id, []);
    for (const programme of fixture.programmes) map.get(programme.channelId)?.push(programme);
    return map;
  }, [fixture]);

  const scheduleViewport = useCallback((next: Partial<ViewportState>) => {
    pendingViewportRef.current = {
      x: next.x ?? pendingViewportRef.current.x,
      y: next.y ?? pendingViewportRef.current.y,
    };

    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      setViewportState({ ...pendingViewportRef.current });
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      updateHorizontal: (x) => scheduleViewport({ x: Math.max(0, finiteOrZero(x)) }),
      updateVertical: (y) => scheduleViewport({ y: finiteOrZero(y) }),
      setViewport: (x, y) =>
        scheduleViewport({ x: Math.max(0, finiteOrZero(x)), y: finiteOrZero(y) }),
    }),
    [scheduleViewport],
  );

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const range = visibleRowRange(
    viewport.y,
    viewportHeight,
    layout.rowHeight,
    fixture.channels.length,
    1,
  );

  const masks = [];
  if (range) {
    for (let rowIndex = range.first; rowIndex <= range.last; rowIndex += 1) {
      const channel = fixture.channels[rowIndex];
      if (!channel) continue;
      const programmes = programmesByChannel.get(channel.id) ?? [];
      const edge = edgeReadableProgramme(
        programmes,
        viewport.x,
        viewportWidth,
        windowStart,
        layout.minuteWidth,
      );
      if (!edge) continue;

      const contentMode = programmeContentMode(Math.min(edge.frame.width, edge.visibleWidth));
      const horizontalPadding = contentMode === 'compact' ? 5 : 8;
      if (edge.visibleWidth - horizontalPadding * 2 < MIN_READABLE_TEXT_WIDTH) continue;

      const startMs = Date.parse(edge.programme.startAt);
      const endMs = Date.parse(edge.programme.endAt);
      const isCurrent = nowMs >= startMs && nowMs < endMs;
      const leavesProgressVisible = isCurrent && contentMode !== 'compact';
      const titleLines = layout.largeText ? 1 : contentMode === 'comfortable' ? 2 : 1;
      const showProgrammeTime =
        !layout.largeText &&
        contentMode !== 'compact' &&
        edge.visibleWidth >= GUIDE_PROGRAMME_TIME_MIN_VISIBLE_WIDTH;
      const rowTop = rowIndex * layout.rowHeight - viewport.y;
      const topInset = leavesProgressVisible ? 14 : 4;
      const bottomInset = 4;

      masks.push(
        <View
          key={`${channel.id}-${edge.programme.id}`}
          style={[
            styles.edgeMask,
            {
              top: rowTop + topInset,
              width: edge.visibleWidth,
              height: Math.max(0, layout.rowHeight - topInset - bottomInset),
              paddingHorizontal: horizontalPadding,
              paddingVertical: contentMode === 'compact' ? 6 : 7,
              justifyContent: layout.largeText || !showProgrammeTime ? 'center' : 'space-between',
              backgroundColor: isCurrent ? theme.colors.programmeCurrent : theme.colors.programme,
              borderTopRightRadius: edge.endsInViewport && !leavesProgressVisible ? 8 : 0,
              borderBottomRightRadius: edge.endsInViewport ? 8 : 0,
            },
          ]}
        >
          <Text
            numberOfLines={titleLines}
            ellipsizeMode="tail"
            style={[
              styles.title,
              contentMode === 'compact' ? styles.titleCompact : null,
              { color: theme.colors.text },
            ]}
          >
            {edge.programme.title}
          </Text>
          {showProgrammeTime ? (
            <Text numberOfLines={1} style={[styles.time, { color: theme.colors.textMuted }]}>
              {formatTime(startMs)}
            </Text>
          ) : null}
        </View>,
      );
    }
  }

  const currentTimeLeft = nowX - viewport.x;
  const showCurrentTimeLine =
    nowInWindow && currentTimeLeft >= 0 && currentTimeLeft <= viewportWidth;

  return (
    <View
      testID="guide-edge-readability-overlay"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.overlay}
    >
      {masks}
      {showCurrentTimeLine ? (
        <View
          style={[
            styles.currentTimeLine,
            { left: currentTimeLeft, backgroundColor: theme.colors.currentTime },
          ]}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 3,
  },
  edgeMask: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  title: { fontSize: 12, fontWeight: '600' },
  titleCompact: { fontSize: 10 },
  time: { fontSize: 10, marginTop: 4 },
  currentTimeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 4,
  },
});
