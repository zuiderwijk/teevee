import { describe, expect, it } from 'vitest';

import {
  GUIDE_CHANNEL_WIDTH,
  GUIDE_MINUTE_WIDTH,
  GUIDE_ROW_HEIGHT,
  GUIDE_TIME_AXIS_HEIGHT,
} from './geometry';
import { guideLayoutForFontScale } from './layout';

describe('guideLayoutForFontScale', () => {
  it('keeps the accepted Totaal baseline geometry at the default font scale', () => {
    expect(guideLayoutForFontScale(1)).toEqual({
      fontScale: 1,
      largeText: false,
      stackedControls: false,
      rowHeight: GUIDE_ROW_HEIGHT,
      channelWidth: GUIDE_CHANNEL_WIDTH,
      timeAxisHeight: GUIDE_TIME_AXIS_HEIGHT,
      minuteWidth: GUIDE_MINUTE_WIDTH,
      tickLabelWidth: 48,
    });
    expect(GUIDE_CHANNEL_WIDTH).toBe(84);
    expect(GUIDE_ROW_HEIGHT).toBe(76);
    expect(GUIDE_MINUTE_WIDTH).toBe(3);
    expect(GUIDE_TIME_AXIS_HEIGHT).toBe(44);
  });

  it.each([
    [1.35, 90, 94, 3.42],
    [1.5, 97, 98, 3.6],
    [2, 125, 112, 4.2],
  ])(
    'uses the canonical Dynamic Type formula at scale %s',
    (fontScale, rowHeight, channelWidth, minuteWidth) => {
      const layout = guideLayoutForFontScale(fontScale);
      expect(layout.rowHeight).toBe(rowHeight);
      expect(layout.channelWidth).toBe(channelWidth);
      expect(layout.minuteWidth).toBe(minuteWidth);
      expect(layout.timeAxisHeight).toBe(44);
      expect(layout.stackedControls).toBe(false);
    },
  );

  it('switches only the shared accessibility chrome flag above 1.35', () => {
    expect(guideLayoutForFontScale(1.35).largeText).toBe(false);
    expect(guideLayoutForFontScale(1.351).largeText).toBe(true);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'falls back safely for invalid scale %s',
    (fontScale) => {
      expect(guideLayoutForFontScale(fontScale)).toEqual(guideLayoutForFontScale(1));
    },
  );
});
