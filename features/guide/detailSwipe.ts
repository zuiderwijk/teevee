/** Gesture distances are logical points; velocity is points per second.
 * These are initial interaction thresholds, not measured performance claims.
 */
export function detailDragOffset(distance: number, sheetHeight: number): number {
  'worklet';
  if (!Number.isFinite(distance) || !Number.isFinite(sheetHeight) || sheetHeight <= 0) return 0;
  return Math.max(0, Math.min(distance, sheetHeight));
}

export function shouldDismissDetail(distance: number, velocityY: number, sheetHeight: number): boolean {
  'worklet';
  if (!Number.isFinite(distance) || !Number.isFinite(velocityY) || !Number.isFinite(sheetHeight) || sheetHeight <= 0) return false;
  // A clear reversal towards the open position cancels, even after a long drag.
  if (distance <= 0 || velocityY < -200) return false;
  const distanceThreshold = Math.min(140, Math.max(72, sheetHeight * 0.25));
  return distance >= distanceThreshold || (distance >= 24 && velocityY >= 900);
}
