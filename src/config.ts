// src/config.ts
import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';
import type { EffectivePollLimits, PollRunOptions } from './poll-options.js';
import type { SupportedLanguage } from './i18n.js';

loadEnv();

export type FeedProfile = 'minimal' | 'full';

function envInt(name: string, fallback: number, min = 0, max = 1000): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

function envProfile(name: string, fallback: FeedProfile): FeedProfile {
  const raw = (process.env[name] ?? fallback).trim().toLowerCase();
  return raw === 'minimal' ? 'minimal' : 'full';
}

export const config = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  openrouterModel: process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-v3.2-speciale',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
  maxArticlesPerPoll: envInt('MAX_ARTICLES_PER_POLL', 10, 1, 50),
  arxivMaxPerPoll: envInt('ARXIV_MAX_PER_POLL', 15, 0, 50),
  maxRelevanceBatch: envInt('MAX_RELEVANCE_BATCH', 25, 5, 100),
  relevanceThreshold: envInt('RELEVANCE_THRESHOLD', 6, 1, 10),
  summarizeDelayMs: envInt('SUMMARIZE_DELAY_MS', 2000, 0, 30000),
  sendDelayMs: envInt('SEND_DELAY_MS', 500, 0, 10000),
  summarizeConcurrency: envInt('SUMMARIZE_CONCURRENCY', 2, 1, 5),
  feedProfile: envProfile('FEED_PROFILE', 'full'),
  progressHeartbeatMs: envInt('PROGRESS_HEARTBEAT_MS', 120_000, 30_000, 600_000),
  startupNotify: envBool('STARTUP_NOTIFY', true),
  pollMetricsNotify: envBool('POLL_METRICS_NOTIFY', false),
  openrouterCreditAlertEnabled: envBool('OPENROUTER_CREDIT_ALERT', true),
  openrouterCreditAlertMinUsd: envInt('OPENROUTER_CREDIT_ALERT_MIN_USD', 1, 0, 1000),
  openrouterCreditAlertCooldownMs: envInt(
    'OPENROUTER_CREDIT_ALERT_COOLDOWN_MS',
    86_400_000,
    3_600_000,
    604_800_000,
  ),
  fastMaxArticles: envInt('FAST_MAX_ARTICLES', 3, 1, 10),
  fastArxivMax: envInt('FAST_ARXIV_MAX', 0, 0, 5),
  fastRelevanceBatch: envInt('FAST_RELEVANCE_BATCH', 10, 3, 30),
  fastSummarizeConcurrency: envInt('FAST_SUMMARIZE_CONCURRENCY', 2, 1, 5),
  commandRateLimitPerMinute: envInt('COMMAND_RATE_LIMIT_PER_MINUTE', 10, 1, 60),
  dataDir: join(process.cwd(), 'data'),
  arxivFeedPrefix: 'arXiv',
  arxivDigestIntervalMs: 60 * 60 * 1000,
  maxRetries: 3,
  retryDelayMs: 5000,
  queueRetentionDays: 7,
  seenRetentionDays: 30,
  scrapingDomainDelayMs: envInt('SCRAPE_DELAY_MS', 2000, 0, 30_000),
  scrapingTimeoutMs: envInt('SCRAPE_TIMEOUT_MS', 10_000, 1000, 60_000),
  maxContentLength: 8000,
  maxScrapePerPoll: 10,
  userAgent: 'Newscrux-Custom/2.0 (AI News Aggregator)',
  logLevel: (process.env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error',
  snippetMinLength: 300,
  enrichedContentMaxLength: 3000,
};

export const runtimeConfig = {
  language: 'tr' as SupportedLanguage,
};

export function getEffectivePollLimits(options: PollRunOptions = {}): EffectivePollLimits {
  if (options.fastMode) {
    return {
      maxArticlesPerPoll: config.fastMaxArticles,
      arxivMaxPerPoll: config.fastArxivMax,
      maxRelevanceBatch: config.fastRelevanceBatch,
      relevanceThreshold: config.relevanceThreshold,
      summarizeDelayMs: 0,
      sendDelayMs: 0,
      summarizeConcurrency: config.fastSummarizeConcurrency,
      skipScraping: true,
      fastMode: true,
    };
  }

  return {
    maxArticlesPerPoll: config.maxArticlesPerPoll,
    arxivMaxPerPoll: config.arxivMaxPerPoll,
    maxRelevanceBatch: config.maxRelevanceBatch,
    relevanceThreshold: config.relevanceThreshold,
    summarizeDelayMs: config.summarizeDelayMs,
    sendDelayMs: config.sendDelayMs,
    summarizeConcurrency: config.summarizeConcurrency,
    skipScraping: false,
    fastMode: false,
  };
}

export function validateConfig(): void {
  const missing: string[] = [];
  if (!config.openrouterApiKey) missing.push('OPENROUTER_API_KEY');
  if (!config.telegramBotToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!config.telegramChatId) missing.push('TELEGRAM_CHAT_ID');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!/^[\d-]+$/.test(config.telegramChatId.trim())) {
    throw new Error('TELEGRAM_CHAT_ID must be a numeric chat identifier');
  }

  if (config.telegramBotToken.length < 20 || !config.telegramBotToken.includes(':')) {
    throw new Error('TELEGRAM_BOT_TOKEN format looks invalid');
  }
}
