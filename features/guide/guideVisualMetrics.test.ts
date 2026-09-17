import { describe, expect, it } from 'vitest';

import { TEEVEE_FONT_FAMILIES } from '@/theme/typography';

import {
  currentProgrammeRowHeight,
  GUIDE_TYPOGRAPHY,
  PER_CHANNEL_VISUAL_METRICS,
  perChannelCollapseProgress,
  programmeTitleLineCount,
  standardProgrammeRowHeight,
} from './guideVisualMetrics';

describe('canonical Per-zender visual metrics', () => {
  it('keeps fixed programme row geometry independent of programme duration', () => {
    expect(PER_CHANNEL_VISUAL_METRICS.standardRowHeight).toBe(52);
    expect(PER_CHANNEL_VISUAL_METRICS.currentRowHeight).toBe(120);
    expect(standardProgrammeRowHeight(1)).toBe(52);
    expect(currentProgrammeRowHeight(1)).toBe(120);
  });

  it('scales both fixed row types consistently with Dynamic Type', () => {
    expect(standardProgrammeRowHeight(1.1)).toBe(57);
    expect(standardProgrammeRowHeight(1.35)).toBe(70);
    expect(standardProgrammeRowHeight(1.5)).toBe(78);
    expect(standardProgrammeRowHeight(2)).toBe(104);
    expect(currentProgrammeRowHeight(1.1)).toBe(132);
    expect(currentProgrammeRowHeight(1.35)).toBe(162);
    expect(currentProgrammeRowHeight(1.5)).toBe(180);
    expect(currentProgrammeRowHeight(2)).toBe(240);
    expect(programmeTitleLineCount(1.35)).toBe(1);
    expect(programmeTitleLineCount(1.36)).toBe(2);
  });

  it('uses the canonical fixed schedule columns and current progress geometry', () => {
    expect(PER_CHANNEL_VISUAL_METRICS.timeTextX).toBe(24);
    expect(PER_CHANNEL_VISUAL_METRICS.timeGutterWidth).toBe(64);
    expect(PER_CHANNEL_VISUAL_METRICS.programmeColumnX).toBe(100);
    expect(PER_CHANNEL_VISUAL_METRICS.programmeRightInset).toBe(24);
    expect(PER_CHANNEL_VISUAL_METRICS.progressHeight).toBe(4);
    expect(PER_CHANNEL_VISUAL_METRICS.progressRadius).toBe(2);
    expect(PER_CHANNEL_VISUAL_METRICS.progressBottomInset).toBe(16);
  });

  it('implements direct 56-point collapse and discrete Reduce Motion switching at 28', () => {
    expect(perChannelCollapseProgress(0)).toBe(0);
    expect(perChannelCollapseProgress(28)).toBe(0.5);
    expect(perChannelCollapseProgress(56)).toBe(1);
    expect(perChannelCollapseProgress(100)).toBe(1);
    expect(perChannelCollapseProgress(27.99, true)).toBe(0);
    expect(perChannelCollapseProgress(28, true)).toBe(1);
  });

  it('maps canonical typography to the bundled Instrument Sans static weights', () => {
    expect(GUIDE_TYPOGRAPHY.programmeTime).toMatchObject({
      fontFamily: TEEVEE_FONT_FAMILIES.regular,
      fontSize: 16,
      lineHeight: 20,
    });
    expect(GUIDE_TYPOGRAPHY.programmeTitle).toMatchObject({
      fontFamily: TEEVEE_FONT_FAMILIES.medium,
      fontSize: 18,
      lineHeight: 22,
    });
    expect(GUIDE_TYPOGRAPHY.currentProgrammeTitle).toMatchObject({
      fontFamily: TEEVEE_FONT_FAMILIES.bold,
      fontSize: 20,
      lineHeight: 24,
    });
    expect(GUIDE_TYPOGRAPHY.currentDescription).toMatchObject({
      fontFamily: TEEVEE_FONT_FAMILIES.regular,
      fontSize: 15,
      lineHeight: 18,
    });
  });
});
