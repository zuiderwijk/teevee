import { useSyncExternalStore } from 'react';

import type { GuideSearchNavigationIntent } from '@/data/domain/search';

export type GuidePerChannelNavigationIntent = Extract<
  GuideSearchNavigationIntent,
  { type: 'per-channel' }
>;

export type GuideNavigationRequest = {
  id: number;
  intent: GuidePerChannelNavigationIntent;
};

type Listener = () => void;

let nextRequestId = 1;
let currentRequest: GuideNavigationRequest | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function publishGuideNavigationIntent(
  intent: GuidePerChannelNavigationIntent,
): GuideNavigationRequest {
  const request = { id: nextRequestId++, intent };
  currentRequest = request;
  emit();
  return request;
}

export function acknowledgeGuideNavigationRequest(requestId: number): void {
  if (currentRequest?.id !== requestId) return;
  currentRequest = null;
  emit();
}

export function getGuideNavigationRequest(): GuideNavigationRequest | null {
  return currentRequest;
}

export function subscribeGuideNavigationRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGuideNavigationRequest(): GuideNavigationRequest | null {
  return useSyncExternalStore(
    subscribeGuideNavigationRequest,
    getGuideNavigationRequest,
    getGuideNavigationRequest,
  );
}

/** Test-only reset for the process-local transient handoff. */
export function resetGuideNavigationRequestForTests(): void {
  currentRequest = null;
  nextRequestId = 1;
  emit();
}
