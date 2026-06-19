// src/token-usage.ts — OpenRouter token usage logging (JSONL) + per-poll session totals

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.js';
import { createLogger } from './logger.js';
import {
  THREED_COST_PER_1M_COMPLETION,
  THREED_COST_PER_1M_PROMPT,
} from './threed.config.js';
import { getBotLocale } from './control-state.js';
import { getBotMessages, localeNumber, type BotLocale } from './bot-i18n.js';

const log = createLogger('tokens');

const TOKEN_LOG_FILE = join(config.dataDir, 'token-usage.jsonl');

export type TokenOperation = 'summarize' | 'relevance';

export interface TokenUsageRecord {
  ts: number;
  pollCycle?: number;
  operation: TokenOperation;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  detail?: string;
}

export interface TokenSessionTotals {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  callCount: number;
}

function emptyTotals(): TokenSessionTotals {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0, callCount: 0 };
}

let sessionTotals = emptyTotals();
let activePollCycle: number | undefined;
let botSessionStartedAt: number | null = null;

export function markBotSessionStarted(): void {
  botSessionStartedAt = Date.now();
}

function estimateUsd(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * THREED_COST_PER_1M_PROMPT +
    (completionTokens / 1_000_000) * THREED_COST_PER_1M_COMPLETION
  );
}

export interface BotSessionSpend {
  startedAt: number | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  callCount: number;
  estimatedUsd: number;
}

/** Estimated LLM spend since this process started (from token-usage.jsonl). */
export function getBotSessionSpend(): BotSessionSpend {
  let promptTokens = 0;
  let completionTokens = 0;
  let callCount = 0;
  const since = botSessionStartedAt;

  if (since !== null && existsSync(TOKEN_LOG_FILE)) {
    try {
      const lines = readFileSync(TOKEN_LOG_FILE, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        const record = JSON.parse(line) as TokenUsageRecord;
        if (record.ts < since) continue;
        promptTokens += record.promptTokens;
        completionTokens += record.completionTokens;
        callCount += 1;
      }
    } catch (err) {
      log.warn(`Failed to read token log: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    startedAt: since,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    callCount,
    estimatedUsd: estimateUsd(promptTokens, completionTokens),
  };
}

export function formatBotSessionSpendLine(locale?: BotLocale): string {
  const msg = getBotMessages(locale ?? getBotLocale());
  const s = getBotSessionSpend();
  if (s.startedAt === null) {
    return msg.sessionSpendUnavailable;
  }
  if (s.callCount === 0) {
    return msg.sessionSpendEmpty;
  }
  return msg.sessionSpend(
    s.estimatedUsd.toFixed(3),
    s.callCount,
    localeNumber(s.totalTokens, locale ?? getBotLocale()),
  );
}

export function beginTokenSession(pollCycle: number): void {
  activePollCycle = pollCycle;
  sessionTotals = emptyTotals();
}

export function getTokenSessionTotals(): TokenSessionTotals {
  return { ...sessionTotals };
}

export function extractChatUsage(result: unknown): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} | null {
  if (!result || typeof result !== 'object') return null;
  const usage = (result as { usage?: unknown }).usage;
  if (!usage || typeof usage !== 'object') return null;

  const u = usage as {
    promptTokens?: unknown;
    completionTokens?: unknown;
    totalTokens?: unknown;
  };

  const promptTokens = typeof u.promptTokens === 'number' ? u.promptTokens : 0;
  const completionTokens = typeof u.completionTokens === 'number' ? u.completionTokens : 0;
  const totalTokens =
    typeof u.totalTokens === 'number' ? u.totalTokens : promptTokens + completionTokens;

  if (promptTokens === 0 && completionTokens === 0 && totalTokens === 0) {
    return null;
  }

  return { promptTokens, completionTokens, totalTokens };
}

export function recordTokenUsage(
  operation: TokenOperation,
  model: string,
  usage: { promptTokens: number; completionTokens: number; totalTokens: number },
  detail?: string | Record<string, string | number>,
): void {
  const detailStr =
    typeof detail === 'string'
      ? detail
      : detail
        ? Object.entries(detail)
            .map(([k, v]) => `${k}=${v}`)
            .join(' ')
        : undefined;

  sessionTotals.promptTokens += usage.promptTokens;
  sessionTotals.completionTokens += usage.completionTokens;
  sessionTotals.totalTokens += usage.totalTokens;
  sessionTotals.callCount += 1;

  const record: TokenUsageRecord = {
    ts: Date.now(),
    pollCycle: activePollCycle,
    operation,
    model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    ...(detailStr ? { detail: detailStr.slice(0, 200) } : {}),
  };

  try {
    mkdirSync(config.dataDir, { recursive: true });
    appendFileSync(TOKEN_LOG_FILE, `${JSON.stringify(record)}\n`, 'utf-8');
  } catch (err) {
    log.warn(`Failed to append token log: ${err instanceof Error ? err.message : String(err)}`);
  }

  log.debug(
    `tokens operation=${operation} prompt=${usage.promptTokens} completion=${usage.completionTokens} total=${usage.totalTokens}${detailStr ? ` detail="${detailStr.slice(0, 60)}"` : ''}`,
  );
}

export function logTokenSessionSummary(pollCycle: number): void {
  const t = sessionTotals;
  if (t.callCount === 0) {
    log.info(`[TOKENS] poll_cycle=${pollCycle} calls=0`);
    return;
  }
  log.info(
    `[TOKENS] poll_cycle=${pollCycle} calls=${t.callCount} prompt=${t.promptTokens} completion=${t.completionTokens} total=${t.totalTokens}`,
  );
}
