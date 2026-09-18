import { describe, expect, it } from 'vitest';

import {
  PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS,
  PROGRAMME_REMINDER_LEAD_MS,
  programmeReminderFireAtMs,
} from './programmeReminderContract';

describe('programme reminder timing', () => {
  it('uses the canonical five-minute lead time', () => {
    const now = Date.parse('2026-09-18T18:00:00Z');
    const start = new Date(now + 30 * 60 * 1000).toISOString();
    expect(programmeReminderFireAtMs(start, now)).toBe(
      Date.parse(start) - PROGRAMME_REMINDER_LEAD_MS,
    );
  });

  it('uses the earliest immediate notification when less than five minutes remain', () => {
    const now = Date.parse('2026-09-18T18:00:00Z');
    const start = new Date(now + 2 * 60 * 1000).toISOString();
    expect(programmeReminderFireAtMs(start, now)).toBe(
      now + PROGRAMME_REMINDER_IMMEDIATE_DELAY_MS,
    );
  });

  it('does not allow reminders after programme start', () => {
    const now = Date.parse('2026-09-18T18:00:00Z');
    expect(programmeReminderFireAtMs(new Date(now).toISOString(), now)).toBeNull();
    expect(
      programmeReminderFireAtMs(new Date(now - 1).toISOString(), now),
    ).toBeNull();
  });
});
