// src/telegram.ts
import { config } from './config.js';
import { UPSTREAM_PROJECT_LINK_LABEL, UPSTREAM_PROJECT_URL } from './config.js';
import { createLogger } from './logger.js';
import { getContentLanguage } from './control-state.js';
import { getBotMessages, type BotLocale } from './bot-i18n.js';
import { getLanguagePack } from './i18n.js';
import type { QueueEntry, StructuredSummary } from './types.js';

const log = createLogger('telegram');

const TELEGRAM_MAX_MESSAGE = 4096;
const TELEGRAM_SAFE_MESSAGE = 3800;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Clickable short link to the upstream newscrux repo (Telegram HTML). */
export function formatUpstreamProjectLink(): string {
  return `<a href="${escapeHtml(UPSTREAM_PROJECT_URL)}">${escapeHtml(UPSTREAM_PROJECT_LINK_LABEL)}</a>`;
}

/** Localized upstream credit for /status, e.g. "Ana kaynak: newscrux" (link). */
export function formatUpstreamSourceLine(locale: BotLocale): string {
  const label = getBotMessages(locale).upstreamSourceLabel;
  return `${escapeHtml(label)}: ${formatUpstreamProjectLink()}`;
}

/** Localized upstream credit as plain text (no link preview card). */
export function formatUpstreamSourcePlainLine(locale: BotLocale): string {
  const label = getBotMessages(locale).upstreamSourceLabel;
  return `${escapeHtml(label)}: ${escapeHtml(UPSTREAM_PROJECT_LINK_LABEL)}`;
}

function trimToSentenceBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('!\n'),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('?\n'),
  );

  if (lastSentenceEnd > maxLength * 0.3) {
    return truncated.slice(0, lastSentenceEnd + 1);
  }

  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.slice(0, lastSpace) + '...' : truncated;
}

interface RenderResult {
  title: string;
  message: string;
  truncated: boolean;
}

export interface ArticleNotificationOptions {
  notificationEmoji?: string;
}

export function renderNotification(
  entry: QueueEntry,
  summary: StructuredSummary,
  options: ArticleNotificationOptions = {},
): RenderResult {
  const isArxiv = entry.feedName.startsWith(config.arxivFeedPrefix);
  const emoji = options.notificationEmoji ?? (isArxiv ? '📄' : '📰');
  const { labels } = getLanguagePack(getContentLanguage());

  const titleRaw = summary.translated_title || (summary as { title_tr?: string }).title_tr || entry.title;
  const title = titleRaw.slice(0, 250);

  const source = escapeHtml(entry.feedName);
  const whatHappened = escapeHtml(summary.what_happened);
  const whyItMatters = escapeHtml(summary.why_it_matters);
  const keyDetail = escapeHtml(summary.key_detail);

  const sourceLine = `${emoji} ${source}`;
  const whatLine = `\n\n<b>${labels.whatHappened}</b> ${whatHappened}`;
  const whyLine = `\n\n<b>${labels.whyItMatters}</b> ${whyItMatters}`;
  const detailLine = `\n\n💡 ${keyDetail}`;

  let message = sourceLine + whatLine + whyLine + detailLine;
  if (message.length <= TELEGRAM_MAX_MESSAGE) {
    return { title, message, truncated: false };
  }

  message = sourceLine + whatLine + whyLine;
  if (message.length <= TELEGRAM_MAX_MESSAGE) {
    return { title, message, truncated: true };
  }

  const whyFirstSentence = whyItMatters.split(/[.!?]\s/)[0] + '.';
  const whyLineShort = `\n\n<b>${labels.whyItMatters}</b> ${whyFirstSentence}`;
  message = sourceLine + whatLine + whyLineShort;
  if (message.length <= TELEGRAM_MAX_MESSAGE) {
    return { title, message, truncated: true };
  }

  const availableForWhat =
    TELEGRAM_MAX_MESSAGE - (sourceLine + `\n\n<b>${labels.whatHappened}</b> ` + whyLineShort).length;
  const whatTrimmed = trimToSentenceBoundary(whatHappened, Math.max(availableForWhat, 100));
  message = sourceLine + `\n\n<b>${labels.whatHappened}</b> ${whatTrimmed}` + whyLineShort;

  return { title, message: message.slice(0, TELEGRAM_MAX_MESSAGE), truncated: true };
}

function buildTelegramText(title: string, message: string, url?: string, urlLabel?: string): string {
  const header = `<b>${escapeHtml(title)}</b>`;
  let text = `${header}\n\n${message}`;
  if (url) {
    const linkLabel = escapeHtml(urlLabel || url);
    text += `\n\n<a href="${escapeHtml(url)}">${linkLabel}</a>`;
  }
  return text.slice(0, TELEGRAM_MAX_MESSAGE);
}

export interface TelegramInlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface SendChatMessageOptions {
  reply_markup?: TelegramInlineKeyboardMarkup;
}

export async function sendChatMessage(
  chatId: string,
  text: string,
  options: SendChatMessageOptions = {},
): Promise<boolean> {
  try {
    const apiUrl = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, TELEGRAM_MAX_MESSAGE),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(options.reply_markup ? { reply_markup: options.reply_markup } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      log.error(`Telegram chat message error (${response.status}): ${body}`);
      return false;
    }

    const payload = (await response.json()) as { ok?: boolean };
    return payload.ok === true;
  } catch (err) {
    log.error('Failed to send Telegram chat message', err);
    return false;
  }
}

export async function sendNotification(
  title: string,
  message: string,
  url?: string,
  urlTitle?: string,
): Promise<boolean> {
  try {
    const text = buildTelegramText(title, message, url, urlTitle);
    const apiUrl = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      log.error(`Telegram error (${response.status}): ${body}`);
      return false;
    }

    const payload = (await response.json()) as { ok?: boolean };
    return payload.ok === true;
  } catch (err) {
    log.error('Failed to send Telegram notification', err);
    return false;
  }
}

export async function sendArticleNotification(
  entry: QueueEntry,
  summary: StructuredSummary,
  options: ArticleNotificationOptions = {},
): Promise<{ success: boolean; truncated: boolean }> {
  const { title, message, truncated } = renderNotification(entry, summary, options);
  const isArxiv = entry.feedName.startsWith(config.arxivFeedPrefix);
  const { labels } = getLanguagePack(getContentLanguage());
  const urlTitle = isArxiv ? labels.readArticle : labels.readMore;

  const success = await sendNotification(title, message, entry.link, urlTitle);
  return { success, truncated };
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  options: { text?: string; show_alert?: boolean } = {},
): Promise<boolean> {
  try {
    const apiUrl = `https://api.telegram.org/bot${config.telegramBotToken}/answerCallbackQuery`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        ...(options.text ? { text: options.text.slice(0, 200) } : {}),
        ...(options.show_alert ? { show_alert: true } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      log.error(`Telegram answerCallbackQuery error (${response.status}): ${body}`);
      return false;
    }

    const payload = (await response.json()) as { ok?: boolean };
    return payload.ok === true;
  } catch (err) {
    log.error('Failed to answer Telegram callback query', err);
    return false;
  }
}

export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  options: SendChatMessageOptions = {},
): Promise<boolean> {
  try {
    const apiUrl = `https://api.telegram.org/bot${config.telegramBotToken}/editMessageText`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: text.slice(0, TELEGRAM_MAX_MESSAGE),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(options.reply_markup ? { reply_markup: options.reply_markup } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      log.error(`Telegram editMessageText error (${response.status}): ${body}`);
      return false;
    }

    const payload = (await response.json()) as { ok?: boolean };
    return payload.ok === true;
  } catch (err) {
    log.error('Failed to edit Telegram message', err);
    return false;
  }
}

export { TELEGRAM_SAFE_MESSAGE };
