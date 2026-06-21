// src/telegram-bot.ts
import { APP_DISPLAY_NAME, config } from './config.js';
import { createLogger } from './logger.js';
import {
  isPaused,
  setPaused,
  getControlState,
  isThreeDNewsEnabled,
  setThreeDNewsEnabled,
  getBotLocale,
  setBotLocale,
  setContentLanguage,
  getScheduleMode,
  getPollIntervalMinutes,
} from './control-state.js';
import { getNextScheduledRunAt, formatScheduledTime } from './scheduler.js';
import {
  BOT_COMMANDS,
  SCHEDULE_TIMEZONE,
  SCHEDULE_HOURS,
  resolveBotCommand,
} from './telegram-commands.config.js';
import {
  BOT_LANG_COMMANDS,
  BOT_LANGUAGES_COMMAND,
  formatCommandsHelp,
  formatPollDurationShort,
  getBotMessages,
  getTelegramMenuCommands,
  localeDateTimeString,
  localeNumber,
  type BotLocale,
} from './bot-i18n.js';
import {
  LANGUAGE_DISPLAY_NAMES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from './i18n.js';
import {
  answerCallbackQuery,
  editMessageText,
  formatUpstreamSourcePlainLine,
  formatUpstreamSourceLine,
  sendChatMessage,
  type TelegramInlineKeyboardMarkup,
} from './telegram.js';
import { clearTelegramWebhook, isPollInProgress, runPollSafely } from './poll-coordinator.js';
import { getActiveFeedCount } from './feeds.js';
import { getLastPollSnapshot, getPollPhase } from './poll-state.js';
import { getLastCreditsSnapshot } from './openrouter-credits.js';
import { formatBuildInfoLine } from './build-info.js';
import { THREED_BOT_COMMANDS, THREED_SCHEDULE_HOUR } from './threed.config.js';
import { formatMonthlyBudgetLine } from './budget-guard.js';

const log = createLogger('telegram-bot');

export { isPollInProgress };

export function formatStartupNotificationBody(headline: string, locale: BotLocale): string {
  const msg = getBotMessages(locale);
  const paused = isPaused();
  const statusLine = paused ? msg.statusPaused : msg.statusRunning;
  let nextLine = '';
  try {
    const next = getNextScheduledRunAt(SCHEDULE_TIMEZONE, SCHEDULE_HOURS);
    nextLine = `${msg.nextRun}: ${formatScheduledTime(next, SCHEDULE_TIMEZONE)}`;
  } catch {
    nextLine = '';
  }
  const mode = getScheduleMode();
  let scheduleInfo: string;
  if (mode === 'interval') {
    const mins = getPollIntervalMinutes();
    scheduleInfo =
      mins != null
        ? msg.scheduleIntervalLine(mins)
        : msg.scheduleModeHoursLine(SCHEDULE_HOURS.join(','), SCHEDULE_TIMEZONE);
  } else {
    scheduleInfo = msg.scheduleModeHoursLine(SCHEDULE_HOURS.join(','), SCHEDULE_TIMEZONE);
  }
  const lines = [
    headline,
    '',
    statusLine,
    ...(nextLine ? [nextLine] : []),
    scheduleInfo,
    msg.startupPollNowHint,
    formatUpstreamSourcePlainLine(locale),
    '',
    formatBuildInfoLine(),
  ];
  return lines.join('\n');
}

const LANG_CALLBACK_PREFIX = 'lang:';

const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
};

const commandTimestamps = new Map<string, number[]>();

function isRateLimited(chatId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const times = (commandTimestamps.get(chatId) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= config.commandRateLimitPerMinute) {
    commandTimestamps.set(chatId, times);
    return true;
  }
  times.push(now);
  commandTimestamps.set(chatId, times);
  return false;
}

function normalizeCommand(text: string): string {
  const first = text.trim().split(/\s+/)[0] ?? '';
  const at = first.indexOf('@');
  const withoutBot = at >= 0 ? first.slice(0, at) : first;
  return withoutBot.toLowerCase();
}

function menuCommandsForLocale(locale: BotLocale): Array<{ command: string; description: string }> {
  const { paused, threeDNewsEnabled } = getControlState();
  return getTelegramMenuCommands(locale, { paused, threeDNewsEnabled }).map(
    ({ command, description }) => ({
      command,
      description,
    }),
  );
}

async function refreshTelegramBotMenu(token: string, locale?: BotLocale): Promise<void> {
  await registerTelegramBotCommands(token, locale);
}

/** Set bot display name in Telegram chat list / profile (Bot API setMyName). */
async function registerTelegramBotProfile(token: string): Promise<void> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: APP_DISPLAY_NAME }),
    });
    const body = (await response.json()) as { ok?: boolean; description?: string };
    if (body.ok) {
      log.info(`Telegram bot display name set to "${APP_DISPLAY_NAME}"`);
    } else {
      log.warn(`setMyName: ${body.description ?? 'unknown error'}`);
    }
  } catch (err) {
    log.warn(`setMyName failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function postSetMyCommands(
  token: string,
  payload: Record<string, unknown>,
  label: string,
): Promise<void> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { ok?: boolean; description?: string };
    if (body.ok) {
      log.info(`Telegram bot menu commands registered (${label})`);
    } else {
      log.warn(`setMyCommands (${label}): ${body.description ?? 'unknown error'}`);
    }
  } catch (err) {
    log.warn(
      `setMyCommands (${label}) failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** Register menu descriptions for Telegram app language + bot locale (incl. /langtr). */
async function registerTelegramBotCommands(token: string, locale?: BotLocale): Promise<void> {
  const loc = locale ?? getBotLocale();
  const activeCommands = menuCommandsForLocale(loc);

  // Telegram picks descriptions by the user's app language_code; always use botLocale text.
  for (const lc of SUPPORTED_LANGUAGES) {
    await postSetMyCommands(
      token,
      { commands: activeCommands, language_code: lc },
      `language_code=${lc} botLocale=${loc}`,
    );
  }

  // Fallback when Telegram has no matching language_code list.
  await postSetMyCommands(token, { commands: activeCommands }, `default locale=${loc}`);

  // /langtr and /langen: force the authorized private chat menu to follow botLocale
  // (overrides Telegram app language_code= en/tr lists for this user).
  const chatId = config.telegramChatId?.trim();
  if (chatId) {
    const chatScope = { type: 'chat' as const, chat_id: chatId };
    await postSetMyCommands(
      token,
      { commands: activeCommands, scope: chatScope },
      `chat scope locale=${loc}`,
    );
    // Private chat: chat_id === user_id — most specific scope for single-owner bots.
    await postSetMyCommands(
      token,
      {
        commands: activeCommands,
        scope: { type: 'chat_member', chat_id: chatId, user_id: chatId },
      },
      `chat_member scope locale=${loc}`,
    );
  }
}

function isAuthorizedChat(chatId: number | string | undefined): boolean {
  if (chatId === undefined || chatId === null) return false;
  return String(chatId) === String(config.telegramChatId);
}

function formatDuration(ms: number | undefined, locale: BotLocale): string {
  if (!ms) return '-';
  return formatPollDurationShort(ms, locale);
}

function formatLastPollBlock(locale: BotLocale): string {
  const msg = getBotMessages(locale);
  const snap = getLastPollSnapshot();
  if (!snap) return `\n${msg.lastPollNone}`;

  const when = snap.finishedAt
    ? localeDateTimeString(snap.finishedAt, locale)
    : msg.lastPollInProgress;
  const mode = snap.fastMode ? msg.modeFastShort : msg.modeNormalShort;
  let block =
    `\n${msg.lastPoll}: ${when} (${mode}, ${snap.feedCount} ${msg.feedsLabel}, ${msg.profileLabel}=${snap.feedProfile})`;

  if (snap.durationMs) {
    block += `\n${msg.duration}: ${formatDuration(snap.durationMs, locale)}`;
  }
  if (snap.phase && !snap.finishedAt) {
    block += `\n${msg.phase}: ${snap.phase}`;
  }
  if (snap.metrics) {
    const m = snap.metrics;
    block += `\n${msg.discovered}: ${m.discovered} | ${msg.sent}: ${m.sent} | ${msg.queued}: ${m.queue_pending}`;
    if (m.tokens_calls > 0) {
      block += `\n${msg.tokens}: ${localeNumber(m.tokens_total, locale)} (${m.tokens_calls} ${msg.llmCallsLabel})`;
    }
  }
  const credits = getLastCreditsSnapshot();
  if (credits && credits.limitRemainingUsd !== null) {
    block += `\n${msg.creditRemaining(credits.limitRemainingUsd.toFixed(2))}`;
  }
  if (snap.error) {
    block += `\n⚠️ ${msg.error}: ${snap.error}`;
  }
  return block;
}

async function switchBotLocale(chatId: string, locale: BotLocale, token: string): Promise<void> {
  setBotLocale(locale);
  await registerTelegramBotCommands(token, locale);
  await sendChatMessage(
    chatId,
    getBotMessages(locale).langSwitched(LANGUAGE_DISPLAY_NAMES[locale]),
  );
}

function buildLanguagePickerMarkup(locale: BotLocale): TelegramInlineKeyboardMarkup {
  const msgs = getBotMessages(locale);
  const rows = SUPPORTED_LANGUAGES.map((code) => [
    {
      text: `${LANGUAGE_FLAGS[code]} ${LANGUAGE_DISPLAY_NAMES[code]}`,
      callback_data: `${LANG_CALLBACK_PREFIX}${code}`,
    },
  ]);
  rows.push([
    {
      text: msgs.langPickerCloseButton,
      callback_data: `${LANG_CALLBACK_PREFIX}close`,
    },
  ]);
  return { inline_keyboard: rows };
}

async function handleLanguagesCommand(chatId: string, locale: BotLocale): Promise<void> {
  const msg = getBotMessages(locale);
  await sendChatMessage(chatId, msg.langPickerTitle, {
    reply_markup: buildLanguagePickerMarkup(locale),
  });
}

async function handleCallbackQuery(
  query: NonNullable<TelegramUpdate['callback_query']>,
  token: string,
): Promise<void> {
  const chatId = query.message?.chat.id;
  if (chatId === undefined || !isAuthorizedChat(chatId)) {
    await answerCallbackQuery(query.id);
    return;
  }

  const chatIdStr = String(chatId);
  const messageId = query.message?.message_id;
  const locale = getBotLocale();
  const msg = getBotMessages(locale);

  if (isRateLimited(chatIdStr)) {
    await answerCallbackQuery(query.id, { text: msg.rateLimited, show_alert: true });
    return;
  }

  const data = query.data ?? '';
  if (!data.startsWith(LANG_CALLBACK_PREFIX) || messageId === undefined) {
    await answerCallbackQuery(query.id);
    return;
  }

  const choice = data.slice(LANG_CALLBACK_PREFIX.length);
  const emptyKeyboard: TelegramInlineKeyboardMarkup = { inline_keyboard: [] };

  if (choice === 'close') {
    await answerCallbackQuery(query.id);
    await editMessageText(chatIdStr, messageId, msg.langPickerClosed, {
      reply_markup: emptyKeyboard,
    });
    return;
  }

  if (!isSupportedLanguage(choice)) {
    await answerCallbackQuery(query.id);
    return;
  }

  const displayName = LANGUAGE_DISPLAY_NAMES[choice];
  setBotLocale(choice);
  await registerTelegramBotCommands(token, choice);

  const confirmation = getBotMessages(choice).langSwitchedTo(displayName);
  await answerCallbackQuery(query.id, { text: confirmation });
  await editMessageText(chatIdStr, messageId, confirmation, {
    reply_markup: emptyKeyboard,
  });
}

async function handleCommand(chatId: string, text: string, token: string): Promise<void> {
  const locale = getBotLocale();
  const msg = getBotMessages(locale);

  if (isRateLimited(chatId)) {
    await sendChatMessage(chatId, msg.rateLimited);
    return;
  }

  const trimmed = text.trim();
  const cmd = normalizeCommand(trimmed);

  if (cmd === `/${BOT_LANG_COMMANDS.tr}`) {
    await switchBotLocale(chatId, 'tr', token);
    return;
  }

  if (cmd === `/${BOT_LANG_COMMANDS.en}`) {
    await switchBotLocale(chatId, 'en', token);
    return;
  }

  if (cmd === `/${BOT_LANGUAGES_COMMAND}`) {
    await handleLanguagesCommand(chatId, locale);
    return;
  }

  if (cmd === `/${THREED_BOT_COMMANDS.enable}`) {
    setThreeDNewsEnabled(true);
    await refreshTelegramBotMenu(token);
    await sendChatMessage(
      chatId,
      `${msg.threeDEnabledSchedule(THREED_SCHEDULE_HOUR, SCHEDULE_TIMEZONE)}\n${formatMonthlyBudgetLine(locale)}`,
    );
    return;
  }

  if (cmd === `/${THREED_BOT_COMMANDS.disable}`) {
    setThreeDNewsEnabled(false);
    await refreshTelegramBotMenu(token);
    await sendChatMessage(chatId, msg.threeDDisabled);
    return;
  }

  const action = resolveBotCommand(cmd);

  if (action === 'stop') {
    setPaused(true);
    await refreshTelegramBotMenu(token);
    await sendChatMessage(chatId, msg.stopped);
    return;
  }

  if (action === 'resume') {
    setPaused(false);
    await refreshTelegramBotMenu(token);
    await sendChatMessage(chatId, msg.started);
    return;
  }

  if (action === 'poll') {
    void runPollSafely({ manual: true, chatId });
    return;
  }

  if (action === 'help') {
    await sendChatMessage(chatId, formatCommandsHelp(locale));
    return;
  }

  if (action === 'status') {
    const { paused } = getControlState();
    const statusLine = paused ? msg.statusPaused : msg.statusRunning;
    const langLine = `\n${msg.langCurrent(LANGUAGE_DISPLAY_NAMES[locale])}`;
    let nextLine = '';
    try {
      const next = getNextScheduledRunAt(SCHEDULE_TIMEZONE, SCHEDULE_HOURS);
      nextLine = `\n${msg.nextRun}: ${formatScheduledTime(next, SCHEDULE_TIMEZONE)}`;
    } catch {
      nextLine = '';
    }

    const runningLine = isPollInProgress()
      ? `\n${msg.pollInProgress}${getPollPhase() ? `: ${getPollPhase()}` : ''}.`
      : '';
    const feedLine = `\n${msg.feedProfile}: ${config.feedProfile} (${getActiveFeedCount()} ${msg.feedsLabel})`;
    const buildLine = `\n${formatBuildInfoLine()}`;
    const threeDState = isThreeDNewsEnabled() ? msg.threeDStatusOn : msg.threeDStatusOff;
    const threeDLine = `\n${msg.threeDNews}: ${threeDState} (${THREED_SCHEDULE_HOUR}:00)`;
    const lastLine = formatLastPollBlock(locale);

    await sendChatMessage(
      chatId,
      `${statusLine}${langLine}${runningLine}${nextLine}${feedLine}${threeDLine}${buildLine}${lastLine}\n\n${formatUpstreamSourceLine(locale)}`,
    );
    return;
  }

  await sendChatMessage(
    chatId,
    `${msg.unknownCommand} ${msg.unknownCommandHint}`,
  );
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    data?: string;
    message?: {
      message_id: number;
      chat: { id: number };
    };
  };
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number };
  };
}

export function startTelegramBotListener(): void {
  let offset = 0;
  const token = config.telegramBotToken;

  const threeD = Object.values(THREED_BOT_COMMANDS).map((c) => `/${c}`).join(', ');
  log.info(
    `Telegram bot listener started. Commands: ${Object.values(BOT_COMMANDS).join(', ')}, /${BOT_LANGUAGES_COMMAND}, /${BOT_LANG_COMMANDS.tr}, /${BOT_LANG_COMMANDS.en}, 3D: ${threeD}`,
  );

  const pollUpdates = async (): Promise<void> => {
    try {
      const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
      url.searchParams.set('timeout', '30');
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('allowed_updates', JSON.stringify(['message', 'callback_query']));

      const response = await fetch(url);
      if (!response.ok) {
        const errBody = await response.text();
        log.warn(`getUpdates failed: ${response.status} ${errBody}`);
        if (response.status === 409) {
          log.error(
            'Telegram 409 Conflict: another process is polling this bot token. Stop other npm start/systemd instances or revoke webhook elsewhere.',
          );
        }
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

        if (update.callback_query) {
          const cbChatId = update.callback_query.message?.chat.id;
          if (!isAuthorizedChat(cbChatId)) {
            log.warn(`Ignored callback from unauthorized chat ${cbChatId ?? 'unknown'}`);
            await answerCallbackQuery(update.callback_query.id);
            continue;
          }

          log.info(`Callback received: ${update.callback_query.data ?? '(empty)'}`);
          await handleCallbackQuery(update.callback_query, token);
          continue;
        }

        const msg = update.message;
        if (!msg?.text || !msg.text.startsWith('/')) continue;

        const chatId = String(msg.chat.id);
        if (!isAuthorizedChat(msg.chat.id)) {
          log.warn(`Ignored command from unauthorized chat ${chatId}`);
          await sendChatMessage(chatId, getBotMessages(getBotLocale()).unauthorized);
          continue;
        }

        log.info(`Command received: ${msg.text.split(/\s+/)[0]}`);
        await handleCommand(chatId, msg.text, token);
      }
    } catch (err) {
      log.error('Telegram bot polling error', err);
    }

    setImmediate(pollUpdates);
  };

  void clearTelegramWebhook(token).then(async () => {
    await registerTelegramBotProfile(token);
    await registerTelegramBotCommands(token);
    void pollUpdates();
  });
}
