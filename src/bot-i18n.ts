/**
 * Telegram bot UI strings (TR / EN).
 * Command slugs stay English; menu descriptions and replies follow botLocale.
 */

import {
  THREED_BOT_COMMANDS,
} from './threed.config.js';
import { SCHEDULE_TIMEZONE } from './telegram-commands.config.js';

export type BotLocale = 'tr' | 'en';

export const BOT_LANG_COMMANDS = {
  tr: 'langtr',
  en: 'langen',
} as const;

export interface BotMessages {
  unauthorized: string;
  stopped: string;
  started: string;
  pollStarted: string;
  pollStartedFast: string;
  pollStarted3D: string;
  pollAlreadyRunning: string;
  pollCooldown: string;
  pollFailed: string;
  rateLimited: string;
  statusPaused: string;
  statusRunning: string;
  nextRun: string;
  unknownCommand: string;
  unknownCommandHint: string;
  langSwitched: (locale: BotLocale) => string;
  langCurrent: (locale: BotLocale) => string;
  threeDEnabled: string;
  threeDDisabled: string;
  threeDManualBlocked: string;
  pollInProgress: string;
  scheduleHours: string;
  feedProfile: string;
  threeDNews: string;
  lastPollNone: string;
  lastPoll: string;
  duration: string;
  phase: string;
  discovered: string;
  sent: string;
  queued: string;
  tokens: string;
  openRouterCredit: string;
  error: string;
  budgetLimitReached: string;
  budgetNearTarget: string;
  budgetLine: (month: string, spent: string, cap: string, suffix: string) => string;
  sessionSpendUnavailable: string;
  sessionSpendEmpty: string;
  sessionSpend: (usd: string, calls: number, tokens: string) => string;
  /** Manual poll completion (outcome-specific) */
  pollCompleteColdStart: (mode: string, footer: string) => string;
  pollCompleteNoNews: (mode: string, footer: string) => string;
  pollCompleteSent: (mode: string, count: number, footer: string) => string;
  pollCompleteFiltered: (mode: string, footer: string) => string;
  pollCompleteEmpty: (mode: string, footer: string) => string;
  pollModeNormal: string;
  pollModeFast: string;
  pollMode3D: string;
  cooldownMinutes: (min: number) => string;
  threeDStatusOn: string;
  threeDStatusOff: string;
  statusLabel: string;
  threeDEnabledSchedule: (hour: number, timezone: string) => string;
  lastPollInProgress: string;
  modeNormalShort: string;
  modeFastShort: string;
  profileLabel: string;
  feedsLabel: string;
  llmCallsLabel: string;
  creditRemaining: (usd: string) => string;
  metricDiscovered: string;
  metricSent: string;
  metricFiltered: string;
  metricQueued: string;
  metricDuration: string;
}

export interface TelegramMenuState {
  paused: boolean;
  threeDNewsEnabled: boolean;
}

const MENU_STATIC: Record<
  BotLocale,
  ReadonlyArray<{ command: string; description: string }>
> = {
  tr: [
    { command: 'commands', description: 'Komutları listele' },
    { command: 'status', description: 'Hakkında' },
    { command: 'pollnow', description: 'Şimdi ara' },
  ],
  en: [
    { command: 'commands', description: 'List all commands' },
    { command: 'status', description: 'About' },
    { command: 'pollnow', description: 'Search now' },
  ],
};

const MENU_LANG_TOGGLE: Record<
  BotLocale,
  { toTr: { command: string; description: string }; toEn: { command: string; description: string } }
> = {
  tr: {
    toTr: { command: BOT_LANG_COMMANDS.tr, description: 'Dili Türkçe yap' },
    toEn: { command: BOT_LANG_COMMANDS.en, description: 'Dili İngilizce yap' },
  },
  en: {
    toTr: { command: BOT_LANG_COMMANDS.tr, description: 'Set language to Turkish' },
    toEn: { command: BOT_LANG_COMMANDS.en, description: 'Set language to English' },
  },
};

const MENU_SCHEDULE_TOGGLE: Record<
  BotLocale,
  { pause: { command: string; description: string }; resume: { command: string; description: string } }
> = {
  tr: {
    pause: { command: 'pause', description: 'Planlı aramaları durdur' },
    resume: { command: 'resume', description: 'Planlı aramaları sürdür' },
  },
  en: {
    pause: { command: 'pause', description: 'Stop scheduled searches' },
    resume: { command: 'resume', description: 'Resume scheduled searches' },
  },
};

const MENU_THREED_TOGGLE: Record<
  BotLocale,
  { enable: { command: string; description: string }; disable: { command: string; description: string } }
> = {
  tr: {
    enable: { command: THREED_BOT_COMMANDS.enable, description: '3D AI haberleri aç' },
    disable: { command: THREED_BOT_COMMANDS.disable, description: '3D AI haberleri kapat' },
  },
  en: {
    enable: { command: THREED_BOT_COMMANDS.enable, description: 'Turn on 3D AI news' },
    disable: { command: THREED_BOT_COMMANDS.disable, description: 'Turn off 3D AI news' },
  },
};

const HELP_LINES: Record<BotLocale, ReadonlyArray<{ cmd: string; desc: string }>> = {
  tr: [
    { cmd: '/status', desc: 'Hakkında' },
    { cmd: '/pollnow', desc: 'Şimdi ara' },
    { cmd: '/pause', desc: 'Planlı aramaları durdur' },
    { cmd: '/resume', desc: 'Planlı aramaları sürdür' },
    { cmd: '/commands', desc: 'Komutları listele' },
    { cmd: `/${THREED_BOT_COMMANDS.enable}`, desc: 'Aramayı aç' },
    { cmd: `/${THREED_BOT_COMMANDS.disable}`, desc: 'Aramayı kapat' },
  ],
  en: [
    { cmd: '/status', desc: 'About' },
    { cmd: '/pollnow', desc: 'Search now' },
    { cmd: '/pause', desc: 'Stop scheduled searches' },
    { cmd: '/resume', desc: 'Resume scheduled searches' },
    { cmd: '/commands', desc: 'List commands' },
    { cmd: `/${THREED_BOT_COMMANDS.enable}`, desc: 'Turn searches on' },
    { cmd: `/${THREED_BOT_COMMANDS.disable}`, desc: 'Turn searches off' },
  ],
};

const MESSAGES: Record<BotLocale, BotMessages> = {
  tr: {
    unauthorized: 'Bu botu kullanma yetkiniz yok.',
    stopped: 'Planlı aramalar durduruldu. Manuel arama için /pollnow kullanın.',
    started: 'Planlı aramalar sürdürülüyor.',
    pollStarted: 'Manuel arama başlatıldı…',
    pollStartedFast: 'Hızlı manuel arama başlatıldı (scraping kapalı, düşük limit)…',
    pollStarted3D: '🧊 3D AI manuel arama başlatıldı…',
    pollAlreadyRunning: 'Bir arama zaten çalışıyor. Lütfen bekleyin.',
    pollCooldown: 'Yeni manuel arama için lütfen bekleyin.',
    pollFailed: 'Arama başarısız. Logları kontrol edin.',
    rateLimited: 'Çok fazla komut. Lütfen bir dakika bekleyin.',
    statusPaused: 'Durum: Duraklatıldı',
    statusRunning: 'Durum: Aktif',
    nextRun: 'Sonraki zamanlanmış arama',
    unknownCommand: 'Bilinmeyen komut. Bkz.',
    unknownCommandHint: '/commands',
    langSwitched: (locale) =>
      locale === 'tr' ? 'Dil TR olarak ayarlandı 🇹🇷' : 'Language set to EN 🇬🇧',
    langCurrent: (locale) =>
      locale === 'tr' ? 'Mevcut dil: Türkçe 🇹🇷' : 'Current language: English 🇬🇧',
    threeDEnabled: '🧊 3D AI haber katmanı açıldı.',
    threeDDisabled: '🧊 3D AI haber katmanı kapatıldı.',
    threeDManualBlocked:
      'Zamanlanmış 3D aramalar kapalı. Otomatik aramayı açmak için /3dainewsopen kullanın.',
    pollInProgress: 'Arama devam ediyor',
    scheduleHours: 'Program',
    feedProfile: 'Feed profili',
    threeDNews: '3D haber',
    lastPollNone: 'Son arama: henüz yok',
    lastPoll: 'Son arama',
    duration: 'Süre',
    phase: 'Aşama',
    discovered: 'Keşfedilen',
    sent: 'Gönderilen',
    queued: 'Kuyrukta',
    tokens: 'Token',
    openRouterCredit: 'OpenRouter kredi',
    error: 'Hata',
    budgetLimitReached: ' — LİMİT AŞILDI',
    budgetNearTarget: ' — hedefe yakın',
    budgetLine: (month, spent, cap, suffix) =>
      `3D maliyet (${month}): ~$${spent} / $${cap}${suffix}`,
    sessionSpendUnavailable: 'Oturum harcaması: kullanılamıyor',
    sessionSpendEmpty: 'Oturum harcaması: ~$0.000 (henüz LLM çağrısı yok)',
    sessionSpend: (usd, calls, tokens) =>
      `Oturum harcaması: ~$${usd} (${calls} LLM çağrısı, ${tokens} token)`,
    pollCompleteColdStart: (mode, footer) =>
      `${mode} tamamlandı.\nİlk çalıştırma: mevcut RSS haberleri sisteme kaydedildi, özet gönderilmedi. Sonraki aramalarda yeni haberler bildirilecek.${footer}`,
    pollCompleteNoNews: (mode, footer) =>
      `${mode} tamamlandı.\nYeni haber bulunamadı — RSS kaynakları tarandı, yeni makale yok.${footer}`,
    pollCompleteSent: (mode, count, footer) =>
      `${mode} tamamlandı.\n${count} haber Telegram'a gönderildi.${footer}`,
    pollCompleteFiltered: (mode, footer) =>
      `${mode} tamamlandı.\nİşlendi ancak gönderilecek yeni özet yok (ilgi eşiği veya filtreler).${footer}`,
    pollCompleteEmpty: (mode, footer) => `${mode} tamamlandı.\nYeni haber bulunamadı.${footer}`,
    pollModeNormal: 'Arama',
    pollModeFast: 'Hızlı arama',
    pollMode3D: '3D AI arama',
    cooldownMinutes: (min) => ` (${min} dk)`,
    threeDStatusOn: 'AÇIK',
    threeDStatusOff: 'KAPALI',
    statusLabel: 'Durum',
    threeDEnabledSchedule: (hour, timezone) =>
      `🧊 3D AI haber katmanı açıldı.\nZamanlanmış arama: ${hour}:00 (${timezone}).`,
    lastPollInProgress: 'devam ediyor',
    modeNormalShort: 'normal',
    modeFastShort: 'hızlı',
    profileLabel: 'profil',
    feedsLabel: 'kaynak',
    llmCallsLabel: 'LLM çağrısı',
    creditRemaining: (usd) => `OpenRouter kredi: $${usd} kalan`,
    metricDiscovered: 'keşfedilen',
    metricSent: 'gönderilen',
    metricFiltered: 'filtrelenen',
    metricQueued: 'kuyrukta',
    metricDuration: 'süre',
  },
  en: {
    unauthorized: 'You are not authorized to use this bot.',
    stopped: 'Scheduled searches stopped. Use /pollnow for manual runs.',
    started: 'Scheduled searches resumed.',
    pollStarted: 'Manual poll started…',
    pollStartedFast: 'Fast manual poll started (scraping off, low limits)…',
    pollStarted3D: '🧊 3D AI manual poll started…',
    pollAlreadyRunning: 'A poll is already running. Please wait.',
    pollCooldown: 'Please wait before starting another manual poll.',
    pollFailed: 'Poll failed. Check logs.',
    rateLimited: 'Too many commands. Please wait a minute.',
    statusPaused: 'Status: Paused',
    statusRunning: 'Status: Active',
    nextRun: 'Next scheduled poll',
    unknownCommand: 'Unknown command. See',
    unknownCommandHint: '/commands',
    langSwitched: (locale) =>
      locale === 'tr' ? 'Dil TR olarak ayarlandı 🇹🇷' : 'Language set to EN 🇬🇧',
    langCurrent: (locale) =>
      locale === 'tr' ? 'Mevcut dil: Türkçe 🇹🇷' : 'Current language: English 🇬🇧',
    threeDEnabled: '🧊 3D AI news layer enabled.',
    threeDDisabled: '🧊 3D AI news layer disabled.',
    threeDManualBlocked:
      'Scheduled 3D searches are off. Use /3dainewsopen to enable automatic runs.',
    pollInProgress: 'Poll in progress',
    scheduleHours: 'Schedule',
    feedProfile: 'Feed profile',
    threeDNews: '3D news',
    lastPollNone: 'Last poll: none yet',
    lastPoll: 'Last poll',
    duration: 'Duration',
    phase: 'Phase',
    discovered: 'Discovered',
    sent: 'Sent',
    queued: 'Queued',
    tokens: 'Tokens',
    openRouterCredit: 'OpenRouter credit',
    error: 'Error',
    budgetLimitReached: ' — LIMIT REACHED',
    budgetNearTarget: ' — near target',
    budgetLine: (month, spent, cap, suffix) =>
      `3D cost (${month}): ~$${spent} / $${cap}${suffix}`,
    sessionSpendUnavailable: 'Session spend: unavailable',
    sessionSpendEmpty: 'Session spend: ~$0.000 (no LLM calls yet)',
    sessionSpend: (usd, calls, tokens) =>
      `Session spend: ~$${usd} (${calls} LLM calls, ${tokens} tokens)`,
    pollCompleteColdStart: (mode, footer) =>
      `${mode} finished.\nFirst run: existing RSS items were recorded; no summaries sent. New articles will be reported on later polls.${footer}`,
    pollCompleteNoNews: (mode, footer) =>
      `${mode} finished.\nNo new articles — RSS feeds were scanned, nothing new.${footer}`,
    pollCompleteSent: (mode, count, footer) =>
      `${mode} finished.\n${count} item(s) sent to Telegram.${footer}`,
    pollCompleteFiltered: (mode, footer) =>
      `${mode} finished.\nProcessed but no summaries to send (relevance threshold or filters).${footer}`,
    pollCompleteEmpty: (mode, footer) => `${mode} finished.\nNo new articles found.${footer}`,
    pollModeNormal: 'Poll',
    pollModeFast: 'Fast poll',
    pollMode3D: '3D AI poll',
    cooldownMinutes: (min) => ` (${min} min)`,
    threeDStatusOn: 'ON',
    threeDStatusOff: 'OFF',
    statusLabel: 'Status',
    threeDEnabledSchedule: (hour, timezone) =>
      `🧊 3D AI news layer enabled.\nScheduled poll: ${hour}:00 (${timezone}).`,
    lastPollInProgress: 'in progress',
    modeNormalShort: 'normal',
    modeFastShort: 'fast',
    profileLabel: 'profile',
    feedsLabel: 'feeds',
    llmCallsLabel: 'LLM calls',
    creditRemaining: (usd) => `OpenRouter credit: $${usd} remaining`,
    metricDiscovered: 'discovered',
    metricSent: 'sent',
    metricFiltered: 'filtered',
    metricQueued: 'queued',
    metricDuration: 'duration',
  },
};

export function isBotLocale(value: string): value is BotLocale {
  return value === 'tr' || value === 'en';
}

export function getBotMessages(locale: BotLocale): BotMessages {
  return MESSAGES[locale];
}

export function getTelegramMenuCommands(
  locale: BotLocale,
  state: TelegramMenuState,
): ReadonlyArray<{
  command: string;
  description: string;
}> {
  const lang =
    locale === 'tr' ? MENU_LANG_TOGGLE[locale].toEn : MENU_LANG_TOGGLE[locale].toTr;
  const schedule = state.paused
    ? MENU_SCHEDULE_TOGGLE[locale].resume
    : MENU_SCHEDULE_TOGGLE[locale].pause;
  const threeD = state.threeDNewsEnabled
    ? MENU_THREED_TOGGLE[locale].disable
    : MENU_THREED_TOGGLE[locale].enable;
  return [...MENU_STATIC[locale], lang, schedule, threeD];
}

export function formatCommandsHelp(locale: BotLocale): string {
  const langToggle =
    locale === 'tr' ? MENU_LANG_TOGGLE.tr.toEn : MENU_LANG_TOGGLE.en.toTr;
  const langLine = { cmd: `/${langToggle.command}`, desc: langToggle.description };
  const lines = [...HELP_LINES[locale], langLine].map((h) => `${h.cmd} — ${h.desc}`);
  return `📋 Commands — Komutlar:\n\n${lines.join('\n')}`;
}

export function formatPollDurationShort(ms: number, locale: BotLocale): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) {
    return locale === 'tr' ? `${sec} sn` : `${sec}s`;
  }
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (locale === 'tr') {
    return rem > 0 ? `${min} dk ${rem} sn` : `${min} dk`;
  }
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
}

export function localeDateTimeString(isoOrMs: string | number, locale: BotLocale): string {
  const loc = locale === 'tr' ? 'tr-TR' : 'en-US';
  return new Date(isoOrMs).toLocaleString(loc, { timeZone: SCHEDULE_TIMEZONE });
}

export function localeNumber(n: number, locale: BotLocale): string {
  const loc = locale === 'tr' ? 'tr-TR' : 'en-US';
  return n.toLocaleString(loc);
}
