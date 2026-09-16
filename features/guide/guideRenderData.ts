import type { GuideFixture, Programme } from '@/data/domain/epg';
import { GUIDE_TIME_ZONE } from '@/data/domain/guideTime';

const GUIDE_TIME_FORMATTER = new Intl.DateTimeFormat('nl-NL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: GUIDE_TIME_ZONE,
});

export function formatGuideTime(timeMs: number): string {
  return GUIDE_TIME_FORMATTER.format(timeMs);
}

export function indexGuideProgrammesByChannel(
  fixture: Pick<GuideFixture, 'channels' | 'programmes'>,
): Map<string, Programme[]> {
  const programmesByChannel = new Map<string, Programme[]>();

  for (const channel of fixture.channels) {
    programmesByChannel.set(channel.id, []);
  }

  for (const programme of fixture.programmes) {
    programmesByChannel.get(programme.channelId)?.push(programme);
  }

  return programmesByChannel;
}
