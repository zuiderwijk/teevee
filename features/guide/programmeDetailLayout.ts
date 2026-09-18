export const DETAIL_STICKY_SHOW_CLEARANCE = 12;
export const DETAIL_STICKY_HIDE_REENTRY = 24;

type StickyVisibilityInput = {
  currentlyVisible: boolean;
  scrollable: boolean;
  actionBottomViewportY: number;
};

export function nextProgrammeDetailStickyVisible({
  currentlyVisible,
  scrollable,
  actionBottomViewportY,
}: StickyVisibilityInput): boolean {
  if (!scrollable || !Number.isFinite(actionBottomViewportY)) return false;
  if (!currentlyVisible) {
    return actionBottomViewportY <= -DETAIL_STICKY_SHOW_CLEARANCE;
  }
  return actionBottomViewportY < DETAIL_STICKY_HIDE_REENTRY;
}

export function shouldPreStackProgrammeDetailActions(
  availableWidth: number,
  fontScale: number,
): boolean {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(fontScale)) return true;
  return availableWidth < 300 || fontScale >= 1.3;
}
