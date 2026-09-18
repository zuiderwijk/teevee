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

export function programmeDetailStickyBottomPadding(bottomSafeAreaInset: number): number {
  const safeInset = Number.isFinite(bottomSafeAreaInset) ? Math.max(0, bottomSafeAreaInset) : 0;
  return Math.max(10, safeInset);
}

export function programmeDetailBodyBottomPadding(
  stickyEligible: boolean,
  stickyBarHeight: number,
  bottomSafeAreaInset: number,
): number {
  const safeBarHeight = Number.isFinite(stickyBarHeight) ? Math.max(0, stickyBarHeight) : 0;
  const safeInset = Number.isFinite(bottomSafeAreaInset) ? Math.max(0, bottomSafeAreaInset) : 0;
  return stickyEligible ? safeBarHeight + 16 : Math.max(28, safeInset + 16);
}
