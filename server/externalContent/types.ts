import type { Programme } from '../../data/domain/epg.ts';

export const EXTERNAL_CONTENT_MATCHER_VERSION = 1;

export type ExternalContentMediaType = 'film' | 'series';
export type ExternalContentSource = 'tmdb';

export type ExternalContentMatchDecision =
  | {
      status: 'resolved';
      source: ExternalContentSource;
      mediaType: ExternalContentMediaType;
      externalContentId: string;
      confidence: 'high';
      matcherVersion: number;
    }
  | {
      status: 'unresolved';
      reason:
        | 'missing-required-evidence'
        | 'no-qualifying-candidate'
        | 'insufficient-people-evidence';
    }
  | {
      status: 'ambiguous';
    };

export type ProgrammeExternalContentDecision = {
  programmeId: Programme['id'];
  channelId: Programme['channelId'];
  startAt: Programme['startAt'];
  endAt: Programme['endAt'];
  title: Programme['title'];
  observedAt: string;
  decision: ExternalContentMatchDecision;
};

export type ProgrammeExternalContentReference = {
  programmeId: Programme['id'];
  source: ExternalContentSource;
  mediaType: ExternalContentMediaType;
  externalContentId: string;
  confidence: 'high';
  matcherVersion: number;
  evidenceObservedAt: string;
  resolvedAt: string;
};
