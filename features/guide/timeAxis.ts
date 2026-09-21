export const GUIDE_TIME_TICK_INTERVAL_MINUTES = 15;
export const GUIDE_TIME_LABEL_INTERVAL_MINUTES = 30;

export function centredTimeAxisLabelLeft(labelWidth: number): number {
  'worklet';
  const safeLabelWidth = Number.isFinite(labelWidth) ? Math.max(0, labelWidth) : 0;
  return -safeLabelWidth / 2;
}

export function clippedTimeAxisLabelWidth(
  viewportX: number,
  firstTickX: number,
  tickSpacing: number,
  labelWidth: number,
): number {
  'worklet';
  if (tickSpacing <= 0 || labelWidth <= 0) return 0;

  const safeViewportX = Math.max(0, viewportX);
  const firstLabelStartX = firstTickX + centredTimeAxisLabelLeft(labelWidth);
  const distancePastFirstLabelStart = safeViewportX - firstLabelStartX;
  if (distancePastFirstLabelStart < 0) return 0;

  const phase = distancePastFirstLabelStart % tickSpacing;
  if (phase <= 0 || phase >= labelWidth) return 0;

  return Math.min(labelWidth, labelWidth - phase);
}
