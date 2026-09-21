export const TOTAAL_HORIZONTAL_SURFACE = {
  none: 0,
  schedule: 1,
  axis: 2,
} as const;

export const TOTAAL_HORIZONTAL_PHASE = {
  idle: 0,
  drag: 1,
  momentum: 2,
  programmatic: 3,
} as const;

export type TotaalHorizontalSurface =
  (typeof TOTAAL_HORIZONTAL_SURFACE)[keyof typeof TOTAAL_HORIZONTAL_SURFACE];
export type TotaalHorizontalPhase =
  (typeof TOTAAL_HORIZONTAL_PHASE)[keyof typeof TOTAAL_HORIZONTAL_PHASE];

export type TotaalHorizontalOwnership = {
  owner: TotaalHorizontalSurface;
  phase: TotaalHorizontalPhase;
};

export type TotaalHorizontalScrollDecision = {
  authoritative: boolean;
  mirrorTo: TotaalHorizontalSurface;
};

export type TotaalHorizontalProgrammaticPlan = {
  ownership: TotaalHorizontalOwnership;
  authoritativeX: number | null;
  scheduleTargetX: number;
  axisTargetX: number | null;
};

const MOMENTUM_VELOCITY_EPSILON = 0.001;
const PROGRAMMATIC_TARGET_EPSILON = 0.5;

export function totaalHorizontalIdleOwnership(): TotaalHorizontalOwnership {
  'worklet';
  return {
    owner: TOTAAL_HORIZONTAL_SURFACE.none,
    phase: TOTAAL_HORIZONTAL_PHASE.idle,
  };
}

export function totaalHorizontalBeginDrag(
  state: TotaalHorizontalOwnership,
  surface: TotaalHorizontalSurface,
): TotaalHorizontalOwnership {
  'worklet';
  if (
    surface === TOTAAL_HORIZONTAL_SURFACE.none ||
    (state.owner !== TOTAAL_HORIZONTAL_SURFACE.none && state.owner !== surface)
  ) {
    return state;
  }

  return {
    owner: surface,
    phase: TOTAAL_HORIZONTAL_PHASE.drag,
  };
}

export function totaalHorizontalScrollDecision(
  state: TotaalHorizontalOwnership,
  surface: TotaalHorizontalSurface,
): TotaalHorizontalScrollDecision {
  'worklet';
  const authoritative =
    surface !== TOTAAL_HORIZONTAL_SURFACE.none && state.owner === surface;

  return {
    authoritative,
    mirrorTo: authoritative
      ? surface === TOTAAL_HORIZONTAL_SURFACE.schedule
        ? TOTAAL_HORIZONTAL_SURFACE.axis
        : TOTAAL_HORIZONTAL_SURFACE.schedule
      : TOTAAL_HORIZONTAL_SURFACE.none,
  };
}

export function totaalHorizontalEndDrag(
  state: TotaalHorizontalOwnership,
  surface: TotaalHorizontalSurface,
  velocityX: number | undefined,
): TotaalHorizontalOwnership {
  'worklet';
  if (state.owner !== surface) return state;

  const safeVelocity = Number.isFinite(velocityX) ? Math.abs(velocityX ?? 0) : 0;
  if (safeVelocity > MOMENTUM_VELOCITY_EPSILON) {
    return {
      owner: surface,
      phase: TOTAAL_HORIZONTAL_PHASE.momentum,
    };
  }

  return totaalHorizontalIdleOwnership();
}

export function totaalHorizontalMomentumBegin(
  state: TotaalHorizontalOwnership,
  surface: TotaalHorizontalSurface,
): TotaalHorizontalOwnership {
  'worklet';
  if (
    surface === TOTAAL_HORIZONTAL_SURFACE.none ||
    (state.owner !== TOTAAL_HORIZONTAL_SURFACE.none && state.owner !== surface)
  ) {
    return state;
  }

  return {
    owner: surface,
    phase: TOTAAL_HORIZONTAL_PHASE.momentum,
  };
}

export function totaalHorizontalMomentumEnd(
  state: TotaalHorizontalOwnership,
  surface: TotaalHorizontalSurface,
): TotaalHorizontalOwnership {
  'worklet';
  return state.owner === surface ? totaalHorizontalIdleOwnership() : state;
}

export function totaalHorizontalProgrammaticPlan(
  viewportX: number,
  animated: boolean,
): TotaalHorizontalProgrammaticPlan {
  'worklet';
  const x = Number.isFinite(viewportX) ? Math.max(0, viewportX) : 0;

  if (animated) {
    return {
      ownership: {
        owner: TOTAAL_HORIZONTAL_SURFACE.schedule,
        phase: TOTAAL_HORIZONTAL_PHASE.programmatic,
      },
      authoritativeX: null,
      scheduleTargetX: x,
      axisTargetX: null,
    };
  }

  return {
    ownership: totaalHorizontalIdleOwnership(),
    authoritativeX: x,
    scheduleTargetX: x,
    axisTargetX: x,
  };
}

export function totaalHorizontalProgrammaticTargetReached(
  state: TotaalHorizontalOwnership,
  surface: TotaalHorizontalSurface,
  viewportX: number,
  targetX: number,
): boolean {
  'worklet';
  return (
    state.owner === surface &&
    state.phase === TOTAAL_HORIZONTAL_PHASE.programmatic &&
    Number.isFinite(viewportX) &&
    Number.isFinite(targetX) &&
    Math.abs(viewportX - targetX) <= PROGRAMMATIC_TARGET_EPSILON
  );
}
