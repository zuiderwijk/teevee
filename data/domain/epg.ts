export type Channel = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
  shortName?: string;
  logoUrl?: string;
};

export type Programme = {
  id: string;
  channelId: Channel['id'];
  startAt: string;
  endAt: string;
  title: string;
  subtitle?: string;
  description?: string;
  genre?: string;
  isLive?: boolean;
  isRepeat?: boolean;
};

/**
 * Provider-independent schedule contract consumed by Teevee features.
 * Fixtures and future API/cache implementations must all converge on this shape.
 */
export type GuideSchedule = {
  generatedAt: string;
  timezone: 'Europe/Amsterdam';
  channels: Channel[];
  programmes: Programme[];
};

/**
 * Compatibility name for deterministic development/test schedules.
 * Keeping fixtures explicit prevents real-data work from replacing the stable CI baseline.
 */
export type GuideFixture = GuideSchedule;

export function programmeDurationMinutes(programme: Programme): number {
  return (Date.parse(programme.endAt) - Date.parse(programme.startAt)) / 60_000;
}

export function isProgrammeCurrent(programme: Programme, nowMs: number): boolean {
  const start = Date.parse(programme.startAt);
  const end = Date.parse(programme.endAt);
  return nowMs >= start && nowMs < end;
}

export function programmeProgress(programme: Programme, now: Date | number): number {
  const start = Date.parse(programme.startAt);
  const end = Date.parse(programme.endAt);
  const current = typeof now === 'number' ? now : now.getTime();

  if (current <= start) return 0;
  if (current >= end) return 1;
  return (current - start) / (end - start);
}
