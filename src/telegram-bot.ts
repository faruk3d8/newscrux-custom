// src/telegram-bot.ts
import { config } from './config.js';
import { createLogger } from './logger.js';
import { isPaused, setPaused, getControlState } from './control-state.js';
import { getNextScheduledRunAt, formatScheduledTime } from './scheduler.js';
import {
  BOT_COMMANDS,
  BOT_MESSAGES,
  SCHEDULE_TIMEZONE,
  SCHEDULE_HOURS,
} from './telegram-commands.config.js';
import { sendChatMessage } from './telegram.js';
import { clearTelegramWebhook, isPollInProgress, runPollSafely } from './poll-coordinator.js';

const log = createLogger('telegram-bot');

export { isPollInProgress };

function normalizeCommand(text: string): string {
  const first = text.trim().split(/\s+/)[0] ?? '';
  const at = first.indexOf('@');
  return at >= 0 ? first.slice(0, at) : first;
}

function isAuthorizedChat(chatId: number | string | undefined): boolean {
  if (chatId === undefined || chatId === null) return false;
  return String(chatId) === String(config.telegramChatId);
}

async function handleCommand(chatId: string, text: string): Promise<void> {
  const cmd = normalizeCommand(text);

  if (cmd === BOT_COMMANDS.stop) {
    setPaused(true);
    await sendChatMessage(chatId, BOT_MESSAGES.stopped);
    return;
  }

  if (cmd === BOT_COMMANDS.start) {
    setPaused(false);
    await sendChatMessage(chatId, BOT_MESSAGES.started);
    return;
  }

  if (cmd === BOT_COMMANDS.pollNow) {
    void runPollSafely({ manual: true, chatId });
    return;
  }

  if (cmd === BOT_COMMANDS.status) {
    const { paused } = getControlState();
    const statusLine = paused ? BOT_MESSAGES.statusPaused : BOT_MESSAGES.statusRunning;
    let nextLine = '';
    try {
      const next = getNextScheduledRunAt(SCHEDULE_TIMEZONE, SCHEDULE_HOURS);
      nextLine = `\n${BOT_MESSAGES.nextRun}: ${formatScheduledTime(next, SCHEDULE_TIMEZONE)}`;
    } catch {
      nextLine = '';
    }

    const runningLine = isPollInProgress() ? '\nŞu an bir arama devam ediyor.' : '';
    const hoursLine = `\nOtomatik saatler (${SCHEDULE_TIMEZONE}): ${SCHEDULE_HOURS.join(', ')}`;
    await sendChatMessage(chatId, `${statusLine}${runningLine}${nextLine}${hoursLine}`);
    return;
  }

  const help = Object.values(BOT_COMMANDS).join(', ');
  await sendChatMessage(chatId, `${BOT_MESSAGES.unknownCommand}: ${help}`);
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number };
  };
}

export function startTelegramBotListener(): void {
  let offset = 0;
  const token = config.telegramBotToken;

  log.info(
    `Telegram bot listener started. Commands: ${Object.values(BOT_COMMANDS).join(', ')}`,
  );

  const pollUpdates = async (): Promise<void> => {
    try {
      const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
      url.searchParams.set('timeout', '30');
      url.searchParams.set('offset', String(offset));

      const response = await fetch(url);
      if (!response.ok) {
        log.warn(`getUpdates failed: ${response.status}`);
        setTimeout(pollUpdates, 5000);
        return;
      }

      const body = (await response.json()) as { ok: boolean; result: TelegramUpdate[] };
      if (!body.ok || !Array.isArray(body.result)) {
        setTimeout(pollUpdates, 5000);
        return;
      }

      for (const update of body.result) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.text || !msg.text.startsWith('/')) continue;

        const chatId = String(msg.chat.id);
        if (!isAuthorizedChat(msg.chat.id)) {
          log.warn(`Ignored command from unauthorized chat ${chatId}`);
          continue;
        }

        log.info(`Command received: ${normalizeCommand(msg.text)}`);
        await handleCommand(chatId, msg.text);
      }
    } catch (err) {
      log.error('Telegram bot polling error', err);
    }

    setImmediate(pollUpdates);
  };

  void clearTelegramWebhook(token).then(() => {
    void pollUpdates();
  });
}
