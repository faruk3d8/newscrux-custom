// src/budget-guard.ts — 3D katmanı aylık tahmini LLM maliyeti

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.js';
import { createLogger } from './logger.js';
import {
  THREED_COST_PER_1M_COMPLETION,
  THREED_COST_PER_1M_PROMPT,
  THREED_MONTHLY_BUDGET_USD,
  THREED_MONTHLY_TARGET_USD,
} from './threed.config.js';
import type { TokenUsageRecord } from './token-usage.js';
import { getBotLocale } from './control-state.js';
import { getBotMessages, type BotLocale } from './bot-i18n.js';

const log = createLogger('budget-3d');

const TOKEN_LOG_FILE = join(config.dataDir, 'token-usage.jsonl');

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function estimateUsd(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * THREED_COST_PER_1M_PROMPT +
    (completionTokens / 1_000_000) * THREED_COST_PER_1M_COMPLETION
  );
}

function isThreeDRecord(record: TokenUsageRecord): boolean {
  return record.detail?.includes('layer=3d') === true;
}

export interface ThreeDBudgetStatus {
  month: string;
  estimatedUsd: number;
  promptTokens: number;
  completionTokens: number;
  callCount: number;
  budgetUsd: number;
  targetUsd: number;
  blocked: boolean;
  nearTarget: boolean;
}

export function getThreeDMonthlySpend(): ThreeDBudgetStatus {
  const now = Date.now();
  const month = monthKey(now);
  let promptTokens = 0;
  let completionTokens = 0;
  let callCount = 0;

  if (existsSync(TOKEN_LOG_FILE)) {
    try {
      const lines = readFileSync(TOKEN_LOG_FILE, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        const record = JSON.parse(line) as TokenUsageRecord;
        if (monthKey(record.ts) !== month) continue;
        if (!isThreeDRecord(record)) continue;
        promptTokens += record.promptTokens;
        completionTokens += record.completionTokens;
        callCount += 1;
      }
    } catch (err) {
      log.warn(`Failed to read token log: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const estimatedUsd = estimateUsd(promptTokens, completionTokens);
  const blocked = estimatedUsd >= THREED_MONTHLY_BUDGET_USD;
  const nearTarget = estimatedUsd >= THREED_MONTHLY_TARGET_USD;

  return {
    month,
    estimatedUsd,
    promptTokens,
    completionTokens,
    callCount,
    budgetUsd: THREED_MONTHLY_BUDGET_USD,
    targetUsd: THREED_MONTHLY_TARGET_USD,
    blocked,
    nearTarget,
  };
}

/** 3D LLM adımı öncesi — limit aşıldıysa false */
export function assertThreeDBudgetAvailable(): boolean {
  const status = getThreeDMonthlySpend();
  if (status.blocked) {
    log.warn(
      `3D monthly budget exceeded: $${status.estimatedUsd.toFixed(4)} >= $${status.budgetUsd.toFixed(2)} — skipping LLM`,
    );
    return false;
  }
  if (status.nearTarget) {
    log.info(
      `3D monthly spend near target: $${status.estimatedUsd.toFixed(4)} (target $${status.targetUsd})`,
    );
  }
  return true;
}

export function formatThreeDBudgetLine(locale?: BotLocale): string {
  const loc = locale ?? getBotLocale();
  const msg = getBotMessages(loc);
  const s = getThreeDMonthlySpend();
  const suffix = s.blocked
    ? msg.budgetLimitReached
    : s.nearTarget
      ? msg.budgetNearTarget
      : '';
  return msg.budgetLine(s.month, s.estimatedUsd.toFixed(3), s.budgetUsd.toFixed(2), suffix);
}
