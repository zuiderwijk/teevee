import {
  GUIDE_CHANNEL_WIDTH,
  GUIDE_MINUTE_WIDTH,
  GUIDE_ROW_HEIGHT,
  GUIDE_TIME_AXIS_HEIGHT,
} from './geometry';

export const GUIDE_LARGE_TEXT_THRESHOLD = 1.35;
export const GUIDE_STACKED_CONTROLS_THRESHOLD = Number.POSITIVE_INFINITY;

export type GuideLayoutMetrics = {
  fontScale: number;
  largeText: boolean;
  stackedControls: boolean;
  rowHeight: number;
  channelWidth: number;
  timeAxisHeight: number;
  minuteWidth: number;
  tickLabelWidth: number;
};

function normaliseFontScale(fontScale: number): number {
  if (!Number.isFinite(fontScale) || fontScale <= 0) return 1;
  return Math.max(1, fontScale);
}

export function guideLayoutForFontScale(fontScale: number): GuideLayoutMetrics {
  const scale = normaliseFontScale(fontScale);
  const growth = scale - 1;
  const minuteWidth = Math.round((GUIDE_MINUTE_WIDTH + 1.2 * growth) * 100) / 100;
  const baselineRowHeight = Math.round(GUIDE_ROW_HEIGHT + 40 * growth);
  const contentSafeHeight = Math.ceil(56 * scale + 13);

  return {
    fontScale: scale,
    largeText: scale > GUIDE_LARGE_TEXT_THRESHOLD,
    stackedControls: false,
    rowHeight: Math.max(baselineRowHeight, contentSafeHeight),
    channelWidth: Math.round(GUIDE_CHANNEL_WIDTH + 28 * growth),
    timeAxisHeight: GUIDE_TIME_AXIS_HEIGHT,
    minuteWidth,
    tickLabelWidth: 48,
  };
}
