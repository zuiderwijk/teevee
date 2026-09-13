export const GUIDE_TIME_TICK_LABEL_OFFSET = 6;
export const GUIDE_TIME_TICK_INTERVAL_MINUTES = 30;

export function clippedTimeAxisLabelWidth(
  viewportX: number,
  firstTickX: number,
  tickSpacing: number,
  labelWidth: number,
): number {
  'worklet';
  if (tickSpacing <= 0 || labelWidth <= 0) return 0;

  const safeViewportX = Math.max(0, viewportX);
  const firstLabelStartX = firstTickX + GUIDE_TIME_TICK_LABEL_OFFSET;
  const distancePastFirstLabel = safeViewportX - firstLabelStartX;
  if (distancePastFirstLabel <= 0) return 0;

  const phase = distancePastFirstLabel % tickSpacing;
  if (phase <= 0 || phase >= labelWidth) return 0;

  return Math.min(labelWidth, labelWidth - phase);
}
