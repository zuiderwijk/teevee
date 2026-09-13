import { describe, expect, it } from 'vitest';

import {
  GUIDE_CHANNEL_WIDTH,
  GUIDE_ROW_HEIGHT,
  GUIDE_TIME_AXIS_HEIGHT,
} from './geometry';
import { guideLayoutForFontScale } from './layout';

describe('guideLayoutForFontScale', () => {
  it('keeps the accepted baseline geometry at the default font scale', () => {
    expect(guideLayoutForFontScale(1)).toEqual({
      fontScale: 1,
      largeText: false,
      rowHeight: GUIDE_ROW_HEIGHT,
      channelWidth: GUIDE_CHANNEL_WIDTH,
      timeAxisHeight: GUIDE_TIME_AXIS_HEIGHT,
    });
  });

  it('grows the row, channel rail and time axis for larger system text', () => {
    expect(guideLayoutForFontScale(1.5)).toEqual({
      fontScale: 1.5,
      largeText: true,
      rowHeight: GUIDE_ROW_HEIGHT + 20,
      channelWidth: GUIDE_CHANNEL_WIDTH + 14,
      timeAxisHeight: GUIDE_TIME_AXIS_HEIGHT + 9,
    });
  });

  it('continues to grow instead of clipping at accessibility-sized scales', () => {
    const regular = guideLayoutForFontScale(1.5);
    const accessibility = guideLayoutForFontScale(2.5);

    expect(accessibility.rowHeight).toBeGreaterThan(regular.rowHeight);
    expect(accessibility.channelWidth).toBeGreaterThan(regular.channelWidth);
    expect(accessibility.timeAxisHeight).toBeGreaterThan(regular.timeAxisHeight);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('falls back safely for invalid scale %s', (fontScale) => {
    expect(guideLayoutForFontScale(fontScale)).toEqual(guideLayoutForFontScale(1));
  });
});
