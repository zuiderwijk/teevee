import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  beginMountedGuideDaySwitchTrace,
  flushGuideDaySwitchDiagnostics,
  markGuideDaySelectionCommitted,
  markGuideDaySwitchSurfaceMounted,
  markGuideDaySwitchSurfaceUnmounted,
  markGuideFixtureAlignment,
} from './guideDaySwitchDiagnostics';

afterEach(() => {
  markGuideDaySwitchSurfaceUnmounted('totaal');
  markGuideDaySwitchSurfaceUnmounted('per-zender');
  flushGuideDaySwitchDiagnostics();
  vi.restoreAllMocks();
});

describe('Guide day-switch diagnostics', () => {
  it('correlates a mounted surface day switch while deferring console I/O', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const fromDayStartMs = Date.parse('2026-09-15T04:00:00Z');
    const toDayStartMs = Date.parse('2026-09-16T04:00:00Z');

    markGuideDaySwitchSurfaceMounted('totaal');
    const traceId = beginMountedGuideDaySwitchTrace(fromDayStartMs, toDayStartMs);
    markGuideDaySelectionCommitted('totaal', toDayStartMs);
    markGuideFixtureAlignment(toDayStartMs, 7.25, 48, 576);

    expect(traceId).not.toBeNull();
    expect(log).not.toHaveBeenCalled();

    flushGuideDaySwitchDiagnostics();
    const messages = log.mock.calls.map(([message]) => String(message));
    expect(messages.some((message) => message.includes('"event":"day-option-press"'))).toBe(true);
    expect(messages.some((message) => message.includes('"event":"selection-committed"'))).toBe(true);
    expect(messages.some((message) => message.includes('"event":"fixture-alignment"'))).toBe(true);
    expect(messages.some((message) => message.includes('"surface":"totaal"'))).toBe(true);
  });

  it('does not start an interaction trace when no Guide surface is mounted', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const traceId = beginMountedGuideDaySwitchTrace(
      Date.parse('2026-09-15T04:00:00Z'),
      Date.parse('2026-09-16T04:00:00Z'),
    );

    expect(traceId).toBeNull();
    flushGuideDaySwitchDiagnostics();
    expect(log).not.toHaveBeenCalled();
  });
});
