import { describe, expect, it } from 'vitest';

import { guideProgrammeWindowBucket } from './guideProgrammeWindow';
import {
  TOTAAL_HORIZONTAL_PHASE,
  TOTAAL_HORIZONTAL_SURFACE,
  totaalHorizontalBeginDrag,
  totaalHorizontalEndDrag,
  totaalHorizontalIdleOwnership,
  totaalHorizontalMomentumBegin,
  totaalHorizontalMomentumEnd,
  totaalHorizontalProgrammaticPlan,
  totaalHorizontalProgrammaticTargetReached,
  totaalHorizontalScrollDecision,
  type TotaalHorizontalOwnership,
  type TotaalHorizontalSurface,
} from './horizontalScrollOwnership';

function scroll(
  state: TotaalHorizontalOwnership,
  surface: TotaalHorizontalSurface,
) {
  return totaalHorizontalScrollDecision(state, surface);
}

describe('Totaal horizontal scroll ownership', () => {
  it('mirrors schedule-owner movement to axis once and never mirrors the passive axis event back', () => {
    const owned = totaalHorizontalBeginDrag(
      totaalHorizontalIdleOwnership(),
      TOTAAL_HORIZONTAL_SURFACE.schedule,
    );

    expect(scroll(owned, TOTAAL_HORIZONTAL_SURFACE.schedule)).toEqual({
      authoritative: true,
      mirrorTo: TOTAAL_HORIZONTAL_SURFACE.axis,
    });
    expect(scroll(owned, TOTAAL_HORIZONTAL_SURFACE.axis)).toEqual({
      authoritative: false,
      mirrorTo: TOTAAL_HORIZONTAL_SURFACE.none,
    });
  });

  it('mirrors axis-owner movement to schedule once and never mirrors the passive schedule event back', () => {
    const owned = totaalHorizontalBeginDrag(
      totaalHorizontalIdleOwnership(),
      TOTAAL_HORIZONTAL_SURFACE.axis,
    );

    expect(scroll(owned, TOTAAL_HORIZONTAL_SURFACE.axis)).toEqual({
      authoritative: true,
      mirrorTo: TOTAAL_HORIZONTAL_SURFACE.schedule,
    });
    expect(scroll(owned, TOTAAL_HORIZONTAL_SURFACE.schedule)).toEqual({
      authoritative: false,
      mirrorTo: TOTAAL_HORIZONTAL_SURFACE.none,
    });
  });

  it('retains the initiating owner through native momentum', () => {
    const drag = totaalHorizontalBeginDrag(
      totaalHorizontalIdleOwnership(),
      TOTAAL_HORIZONTAL_SURFACE.schedule,
    );
    const momentum = totaalHorizontalEndDrag(
      drag,
      TOTAAL_HORIZONTAL_SURFACE.schedule,
      0.6,
    );

    expect(momentum).toEqual({
      owner: TOTAAL_HORIZONTAL_SURFACE.schedule,
      phase: TOTAAL_HORIZONTAL_PHASE.momentum,
    });
    expect(
      totaalHorizontalMomentumBegin(
        momentum,
        TOTAAL_HORIZONTAL_SURFACE.schedule,
      ),
    ).toEqual(momentum);
    expect(scroll(momentum, TOTAAL_HORIZONTAL_SURFACE.axis).authoritative).toBe(false);
  });

  it('releases only after settle so the other surface can own the next gesture', () => {
    const momentum: TotaalHorizontalOwnership = {
      owner: TOTAAL_HORIZONTAL_SURFACE.schedule,
      phase: TOTAAL_HORIZONTAL_PHASE.momentum,
    };

    const blocked = totaalHorizontalBeginDrag(
      momentum,
      TOTAAL_HORIZONTAL_SURFACE.axis,
    );
    expect(blocked).toEqual(momentum);

    const settled = totaalHorizontalMomentumEnd(
      momentum,
      TOTAAL_HORIZONTAL_SURFACE.schedule,
    );
    expect(settled).toEqual(totaalHorizontalIdleOwnership());

    expect(
      totaalHorizontalBeginDrag(settled, TOTAAL_HORIZONTAL_SURFACE.axis),
    ).toEqual({
      owner: TOTAAL_HORIZONTAL_SURFACE.axis,
      phase: TOTAAL_HORIZONTAL_PHASE.drag,
    });
  });

  it('positions both peers directly for initial and non-animated programmatic placement without scroll ownership', () => {
    const plan = totaalHorizontalProgrammaticPlan(420, false);

    expect(plan).toEqual({
      ownership: totaalHorizontalIdleOwnership(),
      authoritativeX: 420,
      scheduleTargetX: 420,
      axisTargetX: 420,
    });
    expect(
      scroll(plan.ownership, TOTAAL_HORIZONTAL_SURFACE.schedule).authoritative,
    ).toBe(false);
    expect(
      scroll(plan.ownership, TOTAAL_HORIZONTAL_SURFACE.axis).authoritative,
    ).toBe(false);
  });

  it('uses schedule as the sole animated Nu owner and mirrors its native travel until the target settles', () => {
    const plan = totaalHorizontalProgrammaticPlan(840, true);

    expect(plan.ownership).toEqual({
      owner: TOTAAL_HORIZONTAL_SURFACE.schedule,
      phase: TOTAAL_HORIZONTAL_PHASE.programmatic,
    });
    expect(plan.authoritativeX).toBeNull();
    expect(plan.axisTargetX).toBeNull();
    expect(scroll(plan.ownership, TOTAAL_HORIZONTAL_SURFACE.schedule).mirrorTo).toBe(
      TOTAAL_HORIZONTAL_SURFACE.axis,
    );
    expect(scroll(plan.ownership, TOTAAL_HORIZONTAL_SURFACE.axis).authoritative).toBe(
      false,
    );
    expect(
      totaalHorizontalProgrammaticTargetReached(
        plan.ownership,
        TOTAAL_HORIZONTAL_SURFACE.schedule,
        839.6,
        840,
      ),
    ).toBe(true);
  });

  it('keeps the 120-pt viewed-time target identical for both direct peers on day selection', () => {
    const viewedTimeAnchor = 120;
    const targetTimeX = 990;
    const viewportX = targetTimeX - viewedTimeAnchor;
    const plan = totaalHorizontalProgrammaticPlan(viewportX, false);

    expect(plan.authoritativeX).toBe(870);
    expect(plan.scheduleTargetX).toBe(870);
    expect(plan.axisTargetX).toBe(870);
    expect(plan.scheduleTargetX + viewedTimeAnchor).toBe(targetTimeX);
  });

  it('advances programme-window buckets only from authoritative native owner movement', () => {
    const viewportWidth = 300;
    const owned = totaalHorizontalBeginDrag(
      totaalHorizontalIdleOwnership(),
      TOTAAL_HORIZONTAL_SURFACE.axis,
    );
    let authoritativeBucket = 0;

    for (const x of [299, 301, 601]) {
      if (scroll(owned, TOTAAL_HORIZONTAL_SURFACE.axis).authoritative) {
        authoritativeBucket = guideProgrammeWindowBucket(x, viewportWidth);
      }
      if (scroll(owned, TOTAAL_HORIZONTAL_SURFACE.schedule).authoritative) {
        authoritativeBucket = guideProgrammeWindowBucket(x, viewportWidth);
      }
    }

    expect(authoritativeBucket).toBe(2);
  });

  it('releases a non-momentum drag immediately after its native drag settles', () => {
    const drag = totaalHorizontalBeginDrag(
      totaalHorizontalIdleOwnership(),
      TOTAAL_HORIZONTAL_SURFACE.axis,
    );
    expect(
      totaalHorizontalEndDrag(drag, TOTAAL_HORIZONTAL_SURFACE.axis, 0),
    ).toEqual(totaalHorizontalIdleOwnership());
  });
});
