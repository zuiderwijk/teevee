import { describe, expect, it } from 'vitest';

import type { Programme } from '@/data/domain/epg';

import { windowGuideProgrammesByChannel } from './guideProgrammeWindow';
import {
  deriveTotaalMicroProgrammeMetadata,
  totaalIsMicroProgrammeFrameWidth,
  totaalMicroProgrammeThreshold,
  totaalNormaliseRepeatedProgrammeTitle,
  totaalRepeatedRunVisibleLayout,
  totaalRepeatedTitleRunPresentationsForWindow,
  totaalRepeatedTitleRunsForTimeWindow,
} from './totaalMicroProgrammes';

const CHANNEL = 'one';
const START = Date.parse('2026-09-21T04:00:00.000Z');

function programme(
  id: string,
  startMinutes: number,
  durationMinutes: number,
  title = 'Editie',
): Programme {
  return {
    id,
    channelId: CHANNEL,
    title,
    startAt: new Date(START + startMinutes * 60_000).toISOString(),
    endAt: new Date(START + (startMinutes + durationMinutes) * 60_000).toISOString(),
  };
}

function metadata(programmes: Programme[], fontScale = 1) {
  return deriveTotaalMicroProgrammeMetadata(
    new Map([[CHANNEL, programmes]]),
    3,
    fontScale,
  );
}

describe('Totaal micro-programme classification', () => {
  it('uses strict < 48 × S against the full real frame width', () => {
    expect(totaalMicroProgrammeThreshold(1)).toBe(48);
    expect(totaalIsMicroProgrammeFrameWidth(47.999, 1)).toBe(true);
    expect(totaalIsMicroProgrammeFrameWidth(48, 1)).toBe(false);
    expect(totaalIsMicroProgrammeFrameWidth(15, 1)).toBe(true);
    expect(totaalIsMicroProgrammeFrameWidth(30, 1)).toBe(true);
    expect(totaalIsMicroProgrammeFrameWidth(45, 1)).toBe(true);
    expect(totaalIsMicroProgrammeFrameWidth(60, 1)).toBe(false);
  });

  it('scales only the micro threshold with effective fontScale', () => {
    expect(totaalMicroProgrammeThreshold(1.5)).toBe(72);
    expect(totaalIsMicroProgrammeFrameWidth(60, 1.5)).toBe(true);
    expect(totaalIsMicroProgrammeFrameWidth(72, 1.5)).toBe(false);
  });

  it('does not accept clipped visible remainder as classification input', () => {
    const fullFrameWidth = 60;
    const clippedRemainder = 20;
    expect(totaalIsMicroProgrammeFrameWidth(fullFrameWidth, 1)).toBe(false);
    expect(clippedRemainder).toBeLessThan(totaalMicroProgrammeThreshold(1));
  });


});

describe('Totaal repeated-title run derivation', () => {
  it('forms a run from two directly adjacent identical microcells', () => {
    const result = metadata([
      programme('a', 0, 5),
      programme('b', 5, 5),
    ]);
    expect(result.repeatedTitleRuns).toHaveLength(1);
    expect(result.repeatedTitleRuns[0]?.programmes.map((item) => item.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('breaks a run on a temporal gap', () => {
    expect(
      metadata([programme('a', 0, 5), programme('b', 6, 5)]).repeatedTitleRuns,
    ).toHaveLength(0);
  });

  it('breaks a run on overlap', () => {
    expect(
      metadata([programme('a', 0, 6), programme('b', 5, 5)]).repeatedTitleRuns,
    ).toHaveLength(0);
  });

  it('breaks a run on a different title', () => {
    expect(
      metadata([
        programme('a', 0, 5, 'Editie'),
        programme('b', 5, 5, 'Andere editie'),
      ]).repeatedTitleRuns,
    ).toHaveLength(0);
  });

  it('breaks a micro run when the same title programme is normal width', () => {
    const result = metadata([
      programme('a', 0, 5),
      programme('normal', 5, 20),
      programme('b', 25, 5),
    ]);
    expect(result.repeatedTitleRuns).toHaveLength(0);
    expect(result.microProgrammeIds.has('normal')).toBe(false);
  });

  it('normalises trim and internal whitespace only', () => {
    expect(totaalNormaliseRepeatedProgrammeTitle('  Zelfde   titel\n')).toBe(
      'Zelfde titel',
    );
    expect(
      metadata([
        programme('a', 0, 5, ' Zelfde   titel '),
        programme('b', 5, 5, 'Zelfde titel'),
      ]).repeatedTitleRuns,
    ).toHaveLength(1);
  });

  it('keeps title comparison case-sensitive', () => {
    expect(
      metadata([
        programme('a', 0, 5, 'Editie'),
        programme('b', 5, 5, 'editie'),
      ]).repeatedTitleRuns,
    ).toHaveLength(0);
  });

  it('derives complete run membership before viewport windowing', () => {
    const programmes = [
      programme('a', 0, 5),
      programme('b', 5, 5),
      programme('c', 10, 5),
      programme('d', 15, 5),
    ];
    const result = metadata(programmes);
    const run = result.repeatedTitleRuns[0]!;
    const leftWindow = windowGuideProgrammesByChannel(
      new Map([[CHANNEL, programmes]]),
      START,
      START + 11 * 60_000,
    );
    const rightWindow = windowGuideProgrammesByChannel(
      new Map([[CHANNEL, programmes]]),
      START + 9 * 60_000,
      START + 20 * 60_000,
    );

    expect(leftWindow.get(CHANNEL)?.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(rightWindow.get(CHANNEL)?.map((item) => item.id)).toEqual(['b', 'c', 'd']);
    expect(run.programmes.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(
      totaalRepeatedTitleRunsForTimeWindow(
        result.repeatedTitleRuns,
        START,
        START + 11 * 60_000,
      )[0]?.id,
    ).toBe(run.id);
    expect(
      totaalRepeatedTitleRunsForTimeWindow(
        result.repeatedTitleRuns,
        START + 9 * 60_000,
        START + 20 * 60_000,
      )[0]?.id,
    ).toBe(run.id);
  });

  it('keeps full run identity while bounding overlay members to each programme window', () => {
    const programmes = Array.from({ length: 24 }, (_, index) =>
      programme(`p-${index}`, index * 5, 5),
    );
    const result = metadata(programmes);
    const run = result.repeatedTitleRuns[0]!;
    const leftFrom = START;
    const leftTo = START + 26 * 60_000;
    const rightFrom = START + 94 * 60_000;
    const rightTo = START + 121 * 60_000;
    const source = new Map([[CHANNEL, programmes]]);
    const leftWindow = windowGuideProgrammesByChannel(source, leftFrom, leftTo);
    const rightWindow = windowGuideProgrammesByChannel(source, rightFrom, rightTo);

    const leftPresentation = totaalRepeatedTitleRunPresentationsForWindow(
      result.repeatedTitleRuns,
      result.repeatedRunByProgrammeId,
      leftWindow,
      leftFrom,
      leftTo,
    )[0]!;
    const rightPresentation = totaalRepeatedTitleRunPresentationsForWindow(
      result.repeatedTitleRuns,
      result.repeatedRunByProgrammeId,
      rightWindow,
      rightFrom,
      rightTo,
    )[0]!;

    expect(leftPresentation.run.id).toBe(run.id);
    expect(rightPresentation.run.id).toBe(run.id);
    expect(leftPresentation.run.programmes).toHaveLength(24);
    expect(rightPresentation.run.programmes).toHaveLength(24);
    expect(leftPresentation.programmes.map((item) => item.id)).toEqual([
      'p-0',
      'p-1',
      'p-2',
      'p-3',
      'p-4',
      'p-5',
    ]);
    expect(rightPresentation.programmes.map((item) => item.id)).toEqual([
      'p-18',
      'p-19',
      'p-20',
      'p-21',
      'p-22',
      'p-23',
    ]);
  });
});

describe('Totaal repeated-title visible layout', () => {
  it('activates the shared title at exactly 48 × S and not below it', () => {
    expect(totaalRepeatedRunVisibleLayout(0, 48, 0, 48, 1).showSharedTitle).toBe(true);
    expect(
      totaalRepeatedRunVisibleLayout(0, 47.999, 0, 48, 1).showSharedTitle,
    ).toBe(false);
    expect(totaalRepeatedRunVisibleLayout(0, 72, 0, 72, 1.5).showSharedTitle).toBe(true);
  });

  it('gives four five-minute cells a 60-pt shared-title run at base scale', () => {
    const result = metadata([
      programme('a', 0, 5),
      programme('b', 5, 5),
      programme('c', 10, 5),
      programme('d', 15, 5),
    ]);
    const run = result.repeatedTitleRuns[0]!;
    const layout = totaalRepeatedRunVisibleLayout(0, 60, 0, 300, 1);
    expect(run.programmes).toHaveLength(4);
    expect(layout.visibleWidth).toBe(60);
    expect(layout.showSharedTitle).toBe(true);
  });

  it('keeps three five-minute cells below the shared-title threshold', () => {
    const result = metadata([
      programme('a', 0, 5),
      programme('b', 5, 5),
      programme('c', 10, 5),
    ]);
    const layout = totaalRepeatedRunVisibleLayout(0, 45, 0, 300, 1);
    expect(result.repeatedTitleRuns[0]?.programmes).toHaveLength(3);
    expect(layout.visibleWidth).toBe(45);
    expect(layout.showSharedTitle).toBe(false);
  });

  it('re-anchors partial-left presentation inside the run bounds', () => {
    expect(totaalRepeatedRunVisibleLayout(30, 120, 60, 100, 1)).toEqual({
      visibleStartX: 60,
      visibleEndX: 120,
      visibleWidth: 60,
      viewportOffsetX: 0,
      contentTranslateX: -30,
      showSharedTitle: true,
    });
  });

  it('clips partial-right presentation to the viewport and run end', () => {
    expect(totaalRepeatedRunVisibleLayout(30, 120, 0, 80, 1)).toEqual({
      visibleStartX: 30,
      visibleEndX: 80,
      visibleWidth: 50,
      viewportOffsetX: 30,
      contentTranslateX: 0,
      showSharedTitle: true,
    });
  });

  it('shows no shared title when visible run width drops below threshold', () => {
    const layout = totaalRepeatedRunVisibleLayout(0, 90, 50, 40, 1);
    expect(layout.visibleWidth).toBe(40);
    expect(layout.showSharedTitle).toBe(false);
  });
});
