export type Channel = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
  shortName?: string;
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

export type GuideFixture = {
  generatedAt: string;
  timezone: 'Europe/Amsterdam';
  channels: Channel[];
  programmes: Programme[];
};

export function programmeDurationMinutes(programme: Programme): number {
  return (Date.parse(programme.endAt) - Date.parse(programme.startAt)) / 60_000;
}

export function programmeProgress(programme: Programme, now: Date): number {
  const start = Date.parse(programme.startAt);
  const end = Date.parse(programme.endAt);
  const current = now.getTime();

  if (current <= start) return 0;
  if (current >= end) return 1;
  return (current - start) / (end - start);
}
