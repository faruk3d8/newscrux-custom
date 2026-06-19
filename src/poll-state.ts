// src/poll-state.ts — last poll snapshot for /durum

import type { PollMetrics } from './types.js';

export interface PollSnapshot {
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  manual: boolean;
  fastMode: boolean;
  feedProfile: string;
  feedCount: number;
  phase?: string;
  metrics?: PollMetrics;
  error?: string;
}

let currentPhase: string | undefined;
let lastSnapshot: PollSnapshot | undefined;

export function setPollPhase(phase: string | undefined): void {
  currentPhase = phase;
  if (lastSnapshot && !lastSnapshot.finishedAt) {
    lastSnapshot.phase = phase;
  }
}

export function getPollPhase(): string | undefined {
  return currentPhase;
}

export function beginPollSnapshot(partial: Omit<PollSnapshot, 'startedAt'>): void {
  currentPhase = partial.phase;
  lastSnapshot = {
    ...partial,
    startedAt: Date.now(),
    phase: partial.phase,
  };
}

export function finishPollSnapshot(
  update: Pick<PollSnapshot, 'metrics' | 'error'> & { phase?: string },
): void {
  if (!lastSnapshot) return;
  const finishedAt = Date.now();
  lastSnapshot = {
    ...lastSnapshot,
    finishedAt,
    durationMs: finishedAt - lastSnapshot.startedAt,
    phase: update.phase,
    metrics: update.metrics,
    error: update.error,
  };
  currentPhase = undefined;
}

export function getLastPollSnapshot(): PollSnapshot | undefined {
  return lastSnapshot ? { ...lastSnapshot } : undefined;
}
