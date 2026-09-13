import { GUIDE_TIME_TICK_LABEL_OFFSET, timeAxisLabelOpacity } from './timeAxis';

describe('timeAxisLabelOpacity', () => {
  it('keeps a label visible while its full text starts inside the viewport', () => {
    expect(timeAxisLabelOpacity(100 + GUIDE_TIME_TICK_LABEL_OFFSET, 100)).toBe(1);
  });

  it('hides a label immediately once its text start crosses the left viewport edge', () => {
    expect(timeAxisLabelOpacity(100 + GUIDE_TIME_TICK_LABEL_OFFSET, 107)).toBe(0);
  });

  it('clamps negative bounce offsets to the real left edge', () => {
    expect(timeAxisLabelOpacity(GUIDE_TIME_TICK_LABEL_OFFSET, -20)).toBe(1);
  });
});
