// src/poll-coordinator.ts
import { createLogger } from './logger.js';
import { sendChatMessage } from './telegram.js';
import { BOT_MESSAGES, MANUAL_POLL_COOLDOWN_MINUTES } from './telegram-commands.config.js';

const log = createLogger('poll-coordinator');

let pollInProgress = false;
let pollHandler: (() => Promise<void>) | null = null;
let lastManualPollAt = 0;

export function registerPollHandler(handler: () => Promise<void>): void {
  pollHandler = handler;
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
    log.warn('deleteWebhook failed', err);
  }
}

/**
 * Tek seferde yalnızca bir arama döngüsü çalışır (manuel + zamanlanmış paylaşımlı kilit).
 */
export async function runPollSafely(options: {
  manual?: boolean;
  chatId?: string;
} = {}): Promise<boolean> {
  const { manual = false, chatId } = options;

  if (!pollHandler) {
    log.error('Poll handler not registered');
    if (manual && chatId) {
      await sendChatMessage(chatId, BOT_MESSAGES.pollFailed);
    }
    return false;
  }

  if (pollInProgress) {
    if (manual && chatId) {
      await sendChatMessage(chatId, BOT_MESSAGES.pollAlreadyRunning);
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
        await sendChatMessage(chatId, `${BOT_MESSAGES.pollCooldown} (${waitMin} dk)`);
      }
      return false;
    }
    lastManualPollAt = Date.now();
  }

  pollInProgress = true;
  if (manual && chatId) {
    await sendChatMessage(chatId, BOT_MESSAGES.pollStarted);
  }

  try {
    log.info(manual ? 'Manual poll started' : 'Scheduled poll started');
    await pollHandler();
    if (manual && chatId) {
      await sendChatMessage(chatId, BOT_MESSAGES.pollDone);
    }
    return true;
  } catch (err) {
    log.error('Poll handler error', err);
    if (manual && chatId) {
      await sendChatMessage(chatId, BOT_MESSAGES.pollFailed);
    }
    return false;
  } finally {
    pollInProgress = false;
  }
}
