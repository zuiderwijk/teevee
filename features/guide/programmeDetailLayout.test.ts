import { describe, expect, it } from 'vitest';

import {
  DETAIL_STICKY_HIDE_REENTRY,
  DETAIL_STICKY_SHOW_CLEARANCE,
  nextProgrammeDetailStickyVisible,
  programmeDetailBodyBottomPadding,
  programmeDetailStickyBottomPadding,
  shouldPreStackProgrammeDetailActions,
} from './programmeDetailLayout';

describe('Programme Detail sticky action geometry', () => {
  it('shows only after the original action group has fully cleared by 12 pt', () => {
    expect(
      nextProgrammeDetailStickyVisible({
        currentlyVisible: false,
        scrollable: true,
        actionBottomViewportY: -DETAIL_STICKY_SHOW_CLEARANCE + 0.1,
      }),
    ).toBe(false);
    expect(
      nextProgrammeDetailStickyVisible({
        currentlyVisible: false,
        scrollable: true,
        actionBottomViewportY: -DETAIL_STICKY_SHOW_CLEARANCE,
      }),
    ).toBe(true);
  });

  it('keeps the sticky copy visible until 24 pt has re-entered', () => {
    expect(
      nextProgrammeDetailStickyVisible({
        currentlyVisible: true,
        scrollable: true,
        actionBottomViewportY: DETAIL_STICKY_HIDE_REENTRY - 0.1,
      }),
    ).toBe(true);
    expect(
      nextProgrammeDetailStickyVisible({
        currentlyVisible: true,
        scrollable: true,
        actionBottomViewportY: DETAIL_STICKY_HIDE_REENTRY,
      }),
    ).toBe(false);
  });

  it('never shows sticky actions for non-scrollable content', () => {
    expect(
      nextProgrammeDetailStickyVisible({
        currentlyVisible: true,
        scrollable: false,
        actionBottomViewportY: -100,
      }),
    ).toBe(false);
  });
});

describe('Programme Detail action stacking', () => {
  it('pre-stacks constrained or accessibility-scale layouts', () => {
    expect(shouldPreStackProgrammeDetailActions(299, 1)).toBe(true);
    expect(shouldPreStackProgrammeDetailActions(350, 1.3)).toBe(true);
    expect(shouldPreStackProgrammeDetailActions(350, 1)).toBe(false);
  });
});

describe('Programme Detail bottom safe-area geometry', () => {
  it('applies the bottom safe area exactly once in the sticky bar', () => {
    expect(programmeDetailStickyBottomPadding(34)).toBe(34);
    expect(programmeDetailStickyBottomPadding(0)).toBe(10);
  });

  it('reserves sticky height plus clearance without adding the safe area twice', () => {
    expect(programmeDetailBodyBottomPadding(true, 92, 34)).toBe(108);
    expect(programmeDetailBodyBottomPadding(false, 0, 34)).toBe(50);
  });
});
