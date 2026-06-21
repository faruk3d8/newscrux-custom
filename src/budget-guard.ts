// src/budget-guard.ts — Aylık tahmini LLM maliyeti (tüm aramalar); yalnızca uyarı, asla engellemez

import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from './logger.js';
import { getBotMessages } from './bot-i18n.js';
import type { BotLocale } from './bot-i18n.js';
import { sendNotification } from './telegram.js';
import { getBotLocale } from './control-state.js';
import {
  THREED_COST_PER_1M_COMPLETION,
  THREED_COST_PER_1M_PROMPT,
  THREED_MONTHLY_BUDGET_USD,
  THREED_MONTHLY_TARGET_USD,
} from './threed.config.js';

const log = createLogger('budget');

const USAGE_FILE = path.join(process.cwd(), 'data', 'token-usage.jsonl');
const NOTIFY_STATE_FILE = path.join(process.cwd(), 'data', 'budget-notify-state.json');

interface UsageRecord {
  /** Milliseconds since epoch (token-usage.jsonl) or legacy ISO string */
  ts: number | string;
  promptTokens: number;
  completionTokens: number;
  detail?: string;
}

function recordMonthKey(ts: number | string): string {
  if (typeof ts === 'number') {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  if (/^\d{4}-\d{2}/.test(ts)) return ts.slice(0, 7);
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export interface MonthlyBudgetStatus {
  month: string;
  estimatedUsd: number;
  budgetUsd: number;
  targetUsd: number;
  /** true when spend >= budget (informational only — polls are never blocked) */
  atOrOverBudget: boolean;
  nearTarget: boolean;
}

function readUsageRecords(): UsageRecord[] {
  if (!fs.existsSync(USAGE_FILE)) return [];
  const lines = fs.readFileSync(USAGE_FILE, 'utf8').split('\n').filter(Boolean);
  const out: UsageRecord[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as UsageRecord);
    } catch {
      // skip bad lines
    }
  }
  return out;
}

function estimateUsd(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * THREED_COST_PER_1M_PROMPT +
    (completionTokens / 1_000_000) * THREED_COST_PER_1M_COMPLETION
  );
}

function currentMonthKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthlyLlmSpend(): MonthlyBudgetStatus {
  const month = currentMonthKey();
  const records = readUsageRecords().filter((r) => recordMonthKey(r.ts) === month);

  let promptTokens = 0;
  let completionTokens = 0;
  for (const r of records) {
    promptTokens += r.promptTokens;
    completionTokens += r.completionTokens;
  }

  const estimatedUsd = estimateUsd(promptTokens, completionTokens);
  const atOrOverBudget = estimatedUsd >= THREED_MONTHLY_BUDGET_USD;
  const nearTarget =
    !atOrOverBudget && estimatedUsd >= THREED_MONTHLY_TARGET_USD * 0.85;

  return {
    month,
    estimatedUsd,
    budgetUsd: THREED_MONTHLY_BUDGET_USD,
    targetUsd: THREED_MONTHLY_TARGET_USD,
    atOrOverBudget,
    nearTarget,
  };
}

/** @deprecated Use getMonthlyLlmSpend — kept for call-site compatibility */
export function getThreeDMonthlySpend(): MonthlyBudgetStatus {
  return getMonthlyLlmSpend();
}

interface BudgetNotifyState {
  month: string;
  notifiedAt: string;
}

function readNotifyState(): BudgetNotifyState | null {
  if (!fs.existsSync(NOTIFY_STATE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(NOTIFY_STATE_FILE, 'utf8')) as BudgetNotifyState;
  } catch {
    return null;
  }
}

function writeNotifyState(state: BudgetNotifyState): void {
  const dir = path.dirname(NOTIFY_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(NOTIFY_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Aylık bütçe limitine ulaşıldığında Telegram uyarısı gönderir (ayda bir kez).
 * Aramaları durdurmaz; kullanıcı data/control-state.json ile paused=true yapabilir.
 */
export async function maybeNotifyMonthlyBudgetLimit(): Promise<void> {
  const status = getMonthlyLlmSpend();
  if (!status.atOrOverBudget) return;

  const prev = readNotifyState();
  if (prev?.month === status.month) return;

  const locale = getBotLocale();
  const msg = getBotMessages(locale);
  const cap = status.budgetUsd.toFixed(2);
  const spent = status.estimatedUsd.toFixed(3);
  const title = msg.monthlyBudgetAlertTitle;
  const body = msg.monthlyBudgetAlertBody(cap, spent);

  const sent = await sendNotification(title, body);
  if (sent) {
    writeNotifyState({ month: status.month, notifiedAt: new Date().toISOString() });
    log.info(
      `Monthly budget alert sent: $${spent} >= $${cap} (${status.month}) — polls continue unless paused`,
    );
  } else {
    log.warn('Monthly budget alert could not be sent (Telegram)');
  }
}

export function formatMonthlyBudgetLine(locale?: BotLocale): string {
  const msg = getBotMessages(locale ?? getBotLocale());
  const s = getMonthlyLlmSpend();
  const suffix = s.atOrOverBudget
    ? msg.budgetLimitReached
    : s.nearTarget
      ? msg.budgetNearTarget
      : '';
  return msg.budgetLine(s.month, s.estimatedUsd.toFixed(3), s.budgetUsd.toFixed(2), suffix);
}

/** @deprecated Use formatMonthlyBudgetLine */
export const formatThreeDBudgetLine = formatMonthlyBudgetLine;
