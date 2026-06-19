// src/openrouter-credits.ts — OpenRouter credit balance logging + optional Telegram alert

import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OpenRouter } from '@openrouter/sdk';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { sendChatMessage } from './telegram.js';

const log = createLogger('openrouter-credits');

const CREDITS_SNAPSHOT_FILE = join(config.dataDir, 'openrouter-credits.json');

interface CreditsSnapshot {
  checkedAt: number;
  label: string;
  usageUsd: number;
  limitUsd: number | null;
  limitRemainingUsd: number | null;
  usageDailyUsd: number;
  isFreeTier: boolean;
}

interface AlertState {
  lastAlertAt: number;
}

function loadAlertState(): AlertState {
  try {
    if (existsSync(CREDITS_SNAPSHOT_FILE)) {
      const parsed = JSON.parse(readFileSync(CREDITS_SNAPSHOT_FILE, 'utf-8')) as CreditsSnapshot & {
        lastAlertAt?: number;
      };
      return { lastAlertAt: parsed.lastAlertAt ?? 0 };
    }
  } catch {
    // ignore
  }
  return { lastAlertAt: 0 };
}

function saveCreditsSnapshot(snapshot: CreditsSnapshot, lastAlertAt: number): void {
  try {
    mkdirSync(config.dataDir, { recursive: true });
    const payload = { ...snapshot, lastAlertAt };
    const tmp = CREDITS_SNAPSHOT_FILE + '.tmp';
    writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf-8');
    renameSync(tmp, CREDITS_SNAPSHOT_FILE);
  } catch (err) {
    log.warn(`Failed to save credits snapshot: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Fetches current key metadata, logs it, persists snapshot, and optionally alerts on low balance.
 */
export async function checkOpenRouterCredits(notifyChatId?: string): Promise<void> {
  const client = new OpenRouter({ apiKey: config.openrouterApiKey });

  let data;
  try {
    const response = await client.apiKeys.getCurrentKeyMetadata();
    data = response.data;
  } catch (err) {
    log.warn(`OpenRouter credits check failed: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const snapshot: CreditsSnapshot = {
    checkedAt: Date.now(),
    label: data.label,
    usageUsd: data.usage,
    limitUsd: data.limit,
    limitRemainingUsd: data.limitRemaining,
    usageDailyUsd: data.usageDaily,
    isFreeTier: data.isFreeTier,
  };

  const alertState = loadAlertState();

  log.info(
    `[CREDITS] usage_usd=${snapshot.usageUsd.toFixed(4)} daily_usd=${snapshot.usageDailyUsd.toFixed(4)} ` +
      `limit_usd=${snapshot.limitUsd ?? 'none'} remaining_usd=${snapshot.limitRemainingUsd ?? 'n/a'} free_tier=${snapshot.isFreeTier}`,
  );

  let lastAlertAt = alertState.lastAlertAt;

  if (
    config.openrouterCreditAlertEnabled &&
    notifyChatId &&
    snapshot.limitRemainingUsd !== null &&
    snapshot.limitRemainingUsd <= config.openrouterCreditAlertMinUsd
  ) {
    const now = Date.now();
    if (now - lastAlertAt >= config.openrouterCreditAlertCooldownMs) {
      lastAlertAt = now;
      const limitText =
        snapshot.limitUsd !== null ? `$${snapshot.limitUsd.toFixed(2)}` : 'sınırsız';
      await sendChatMessage(
        notifyChatId,
        `⚠️ OpenRouter credit low: $${snapshot.limitRemainingUsd.toFixed(2)} remaining (limit ${limitText}).`,
      );
      log.warn(`Low credit alert sent (remaining=$${snapshot.limitRemainingUsd.toFixed(2)})`);
    } else {
      log.info('Low credit alert suppressed (cooldown active)');
    }
  }

  saveCreditsSnapshot(snapshot, lastAlertAt);
}

export function getLastCreditsSnapshot(): CreditsSnapshot | null {
  try {
    if (!existsSync(CREDITS_SNAPSHOT_FILE)) return null;
    const parsed = JSON.parse(readFileSync(CREDITS_SNAPSHOT_FILE, 'utf-8')) as CreditsSnapshot;
    return parsed;
  } catch {
    return null;
  }
}
