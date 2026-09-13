export const GUIDE_TIME_TICK_LABEL_OFFSET = 6;

export function timeAxisLabelOpacity(labelStartX: number, viewportX: number): 0 | 1 {
  'worklet';
  const safeViewportX = Math.max(0, viewportX);
  return labelStartX >= safeViewportX ? 1 : 0;
}
