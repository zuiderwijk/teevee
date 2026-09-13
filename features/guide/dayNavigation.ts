export type GuideDayOffset = 0 | 1;

export function guideDayOffsetForViewport(
  viewportX: number,
  tomorrowStartX: number,
): GuideDayOffset {
  'worklet';

  return viewportX >= tomorrowStartX ? 1 : 0;
}
