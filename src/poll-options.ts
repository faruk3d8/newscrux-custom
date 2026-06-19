// src/poll-options.ts

export type PollLayer = 'default' | '3d';

export interface PollRunOptions {
  manual?: boolean;
  chatId?: string;
  fastMode?: boolean;
  /** default = genel AI haber; 3d = 3D AI katmanı (yalnızca zamanlanmış 12:00) */
  layer?: PollLayer;
}

export interface EffectivePollLimits {
  maxArticlesPerPoll: number;
  arxivMaxPerPoll: number;
  maxRelevanceBatch: number;
  relevanceThreshold: number;
  summarizeDelayMs: number;
  sendDelayMs: number;
  summarizeConcurrency: number;
  skipScraping: boolean;
  fastMode: boolean;
}
