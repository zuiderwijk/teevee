import { describe, expect, it } from 'vitest';

import { guideFixture } from './guideFixture';
import { buildRuntimeGuideFixture } from './runtimeGuideFixture';

describe('runtime Guide fixture', () => {
  it('rebases deterministic fixture data around the supplied current time', () => {
    const nowMs = Date.parse('2030-05-10T18:12:00.000Z');
    const runtime = buildRuntimeGuideFixture(nowMs);

    expect(runtime.generatedAt).toBe(new Date(nowMs).toISOString());
    expect(runtime.channels).toEqual(guideFixture.channels);
    expect(runtime.programmes).toHaveLength(guideFixture.programmes.length);

    const starts = runtime.programmes.map((programme) => Date.parse(programme.startAt));
    const ends = runtime.programmes.map((programme) => Date.parse(programme.endAt));

    expect(Math.min(...starts)).toBe(nowMs - 19 * 60 * 60 * 1000);
    expect(Math.max(...ends)).toBeGreaterThan(nowMs + 24 * 60 * 60 * 1000);
  });

  it('preserves programme durations and ids while shifting timestamps', () => {
    const runtime = buildRuntimeGuideFixture(Date.parse('2030-05-10T18:12:00.000Z'));
    const original = guideFixture.programmes[10];
    const shifted = runtime.programmes[10];

    expect(original).toBeDefined();
    expect(shifted).toBeDefined();
    if (!original || !shifted) return;

    expect(shifted.id).toBe(original.id);
    expect(Date.parse(shifted.endAt) - Date.parse(shifted.startAt)).toBe(
      Date.parse(original.endAt) - Date.parse(original.startAt),
    );
  });
});
