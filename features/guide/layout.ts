import {
  GUIDE_CHANNEL_WIDTH,
  GUIDE_ROW_HEIGHT,
  GUIDE_TIME_AXIS_HEIGHT,
} from './geometry';

export const GUIDE_LARGE_TEXT_THRESHOLD = 1.15;

export type GuideLayoutMetrics = {
  fontScale: number;
  largeText: boolean;
  rowHeight: number;
  channelWidth: number;
  timeAxisHeight: number;
};

function normaliseFontScale(fontScale: number): number {
  if (!Number.isFinite(fontScale) || fontScale <= 0) return 1;
  return Math.max(1, fontScale);
}

export function guideLayoutForFontScale(fontScale: number): GuideLayoutMetrics {
  const scale = normaliseFontScale(fontScale);
  const growth = scale - 1;

  return {
    fontScale: scale,
    largeText: scale >= GUIDE_LARGE_TEXT_THRESHOLD,
    rowHeight: Math.round(GUIDE_ROW_HEIGHT + 40 * growth),
    channelWidth: Math.round(GUIDE_CHANNEL_WIDTH + 28 * growth),
    timeAxisHeight: Math.round(GUIDE_TIME_AXIS_HEIGHT + 18 * growth),
  };
}
