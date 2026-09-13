import { describe, expect, it } from 'vitest';

import { detailReducer, initialDetailState, type ProgrammeSelection } from './detailState';

const selection: ProgrammeSelection = {
  channelName: 'Testzender',
  programme: { id: 'one', channelId: 'test', title: 'Programma', startAt: '2026-09-13T18:00:00Z', endAt: '2026-09-13T19:00:00Z' },
};

describe('detail state', () => {
  it('opens immediately with the selected programme', () => {
    expect(detailReducer(initialDetailState, { type: 'open', selection })).toEqual({ visible: true, selection });
  });

  it('retains content for the native close animation without mutating the previous state', () => {
    const opened = detailReducer(initialDetailState, { type: 'open', selection });
    const closed = detailReducer(opened, { type: 'close' });
    expect(closed.visible).toBe(false);
    expect(closed.selection).toBe(selection);
    expect(opened.visible).toBe(true);
  });

  it('ignores repeated close actions', () => {
    expect(detailReducer(initialDetailState, { type: 'close' })).toBe(initialDetailState);
    const closed = detailReducer({ visible: true, selection }, { type: 'close' });
    expect(detailReducer(closed, { type: 'close' })).toBe(closed);
  });

  it('replaces retained content when opening a different programme', () => {
    const next = { ...selection, programme: { ...selection.programme, id: 'two', title: 'Volgende programma' } };
    const closed = detailReducer({ visible: true, selection }, { type: 'close' });
    expect(detailReducer(closed, { type: 'open', selection: next })).toEqual({ visible: true, selection: next });
  });
});
