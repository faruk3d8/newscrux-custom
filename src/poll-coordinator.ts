// src/poll-coordinator.ts
import { createLogger } from './logger.js';
import { sendChatMessage } from './telegram.js';
import { MANUAL_POLL_COOLDOWN_MINUTES } from './telegram-commands.config.js';
import { getBotLocale } from './control-state.js';
import { getBotMessages } from './bot-i18n.js';
import { maybeNotifyMonthlyBudgetLimit } from './budget-guard.js';
import { notifyManualPollStarted } from './manual-poll-notify.js';
import type { PollRunOptions } from './poll-options.js';

const log = createLogger('poll-coordinator');

let pollInProgress = false;
let pollHandler: ((options: PollRunOptions) => Promise<void>) | null = null;
let poll3DHandler: ((options: PollRunOptions) => Promise<void>) | null = null;
let lastManualPollAt = 0;

export function registerPollHandler(handler: (options: PollRunOptions) => Promise<void>): void {
  pollHandler = handler;
}

export function registerPoll3DHandler(handler: (options: PollRunOptions) => Promise<void>): void {
  poll3DHandler = handler;
}

export function isPollInProgress(): boolean {
  return pollInProgress;
}

export async function clearTelegramWebhook(token: string): Promise<void> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
    });
    const body = (await response.json()) as { ok?: boolean; description?: string };
    if (body.ok) {
      log.info('Telegram webhook cleared (long-polling mode)');
    } else {
      log.warn(`deleteWebhook: ${body.description ?? 'unknown error'}`);
    }
  } catch (err) {
    log.warn(`deleteWebhook failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Tek seferde yalnızca bir arama döngüsü çalışır (manuel + zamanlanmış paylaşımlı kilit).
 */
export async function runPollSafely(options: PollRunOptions = {}): Promise<boolean> {
  const { manual = false, chatId, fastMode = false, layer = 'default' } = options;
  const msg = getBotMessages(getBotLocale());

  const handler = layer === '3d' ? poll3DHandler : pollHandler;

  if (!handler) {
    log.error(`Poll handler not registered (layer=${layer})`);
    if (manual && chatId) {
      await sendChatMessage(chatId, msg.pollFailed);
    }
    return false;
  }

  if (pollInProgress) {
    if (manual && chatId) {
      await sendChatMessage(chatId, msg.pollAlreadyRunning);
    } else {
      log.info('Scheduled poll skipped — another poll is already running');
    }
    return false;
  }

  if (manual) {
    const cooldownMs = MANUAL_POLL_COOLDOWN_MINUTES * 60 * 1000;
    const elapsed = Date.now() - lastManualPollAt;
    if (lastManualPollAt > 0 && elapsed < cooldownMs) {
      if (chatId) {
        const waitMin = Math.ceil((cooldownMs - elapsed) / 60_000);
        await sendChatMessage(
          chatId,
          `${msg.pollCooldown}${msg.cooldownMinutes(waitMin)}`,
        );
      }
      return false;
    }
    lastManualPollAt = Date.now();
  }

  pollInProgress = true;

  try {
    log.info(
      manual
        ? `Manual poll started (layer=${layer}, fast=${fastMode})`
        : `Scheduled poll started (layer=${layer}, fast=${fastMode})`,
    );
    await notifyManualPollStarted({ manual, chatId, fastMode, layer });
    await handler({ manual, chatId, fastMode, layer });
    await maybeNotifyMonthlyBudgetLimit();
    log.info(manual ? 'Manual poll finished' : 'Scheduled poll finished');
    return true;
  } catch (err) {
    log.error('Poll handler error', err);
    if (manual && chatId) {
      await sendChatMessage(chatId, msg.pollFailed);
    }
    return false;
  } finally {
    pollInProgress = false;
  }
}
