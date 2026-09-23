import type { ProgrammeExternalContentDecision } from './types.ts';

export type ExternalContentDecisionWriteResult = {
  decisionCount: number;
  resolvedReferenceCount: number;
  clearedReferenceCount: number;
  ignoredStaleCount: number;
};

export interface ProgrammeExternalContentRepository {
  applyDecisions(input: {
    observedAt: string;
    resolvedAt: string;
    decisions: readonly ProgrammeExternalContentDecision[];
  }): Promise<ExternalContentDecisionWriteResult>;
}
