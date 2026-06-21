/**
 * Telegram bot UI strings (all supported content languages).
 * Command slugs stay English; menu descriptions and replies follow the selected language.
 */

import { THREED_BOT_COMMANDS } from './threed.config.js';
import { SCHEDULE_TIMEZONE } from './telegram-commands.config.js';
import { isSupportedLanguage, type SupportedLanguage } from './i18n.js';
import {
  EXTRA_HELP_LINES,
  EXTRA_MENU_SCHEDULE_TOGGLE,
  EXTRA_MENU_STATIC,
  EXTRA_MENU_THREED_TOGGLE,
  EXTRA_MESSAGES,
  HELP_HEADERS,
  LOCALE_BCP47,
} from './bot-i18n-extra.js';

export type BotLocale = SupportedLanguage;

export const BOT_LANGUAGES_COMMAND = 'languages';

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
  startupPollNowHint: string;
  unknownCommand: string;
  unknownCommandHint: string;
  langSwitched: (displayName: string) => string;
  langCurrent: (displayName: string) => string;
  langPickerTitle: string;
  langPickerCloseButton: string;
  langPickerClosed: string;
  langSwitchedTo: (displayName: string) => string;
  contentLangCurrent: (displayName: string) => string;
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
  monthlyBudgetAlertTitle: string;
  monthlyBudgetAlertBody: (cap: string, spent: string) => string;
  scheduleIntervalLine: (minutes: number) => string;
  scheduleModeHoursLine: (hours: string, timezone: string) => string;
  controlStateScheduleHint: string;
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
  /** Prefix before clickable upstream repo link in /status (e.g. "Ana kaynak") */
  upstreamSourceLabel: string;
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
  ...EXTRA_MENU_STATIC,
};

const MENU_LANGUAGES: Record<BotLocale, { command: string; description: string }> = {
  tr: { command: BOT_LANGUAGES_COMMAND, description: 'Dil seç' },
  en: { command: BOT_LANGUAGES_COMMAND, description: 'Choose language' },
  de: { command: BOT_LANGUAGES_COMMAND, description: 'Sprache wählen' },
  fr: { command: BOT_LANGUAGES_COMMAND, description: 'Choisir la langue' },
  es: { command: BOT_LANGUAGES_COMMAND, description: 'Elegir idioma' },
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
  ...EXTRA_MENU_SCHEDULE_TOGGLE,
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
  ...EXTRA_MENU_THREED_TOGGLE,
};

const HELP_LINES: Record<BotLocale, ReadonlyArray<{ cmd: string; desc: string }>> = {
  tr: [
    { cmd: '/status', desc: 'Hakkında' },
    { cmd: '/pollnow', desc: 'Şimdi ara' },
    { cmd: '/pause', desc: 'Planlı aramaları durdur' },
    { cmd: '/resume', desc: 'Planlı aramaları sürdür' },
    { cmd: '/commands', desc: 'Komutları listele' },
    { cmd: `/${BOT_LANGUAGES_COMMAND}`, desc: 'Dil seç' },
    { cmd: `/${THREED_BOT_COMMANDS.enable}`, desc: 'Aramayı aç' },
    { cmd: `/${THREED_BOT_COMMANDS.disable}`, desc: 'Aramayı kapat' },
  ],
  en: [
    { cmd: '/status', desc: 'About' },
    { cmd: '/pollnow', desc: 'Search now' },
    { cmd: '/pause', desc: 'Stop scheduled searches' },
    { cmd: '/resume', desc: 'Resume scheduled searches' },
    { cmd: '/commands', desc: 'List commands' },
    { cmd: `/${BOT_LANGUAGES_COMMAND}`, desc: 'Choose language' },
    { cmd: `/${THREED_BOT_COMMANDS.enable}`, desc: 'Turn searches on' },
    { cmd: `/${THREED_BOT_COMMANDS.disable}`, desc: 'Turn searches off' },
  ],
  ...EXTRA_HELP_LINES,
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
    nextRun: 'Sonraki arama',
    startupPollNowHint: 'Hemen arama için /pollnow kullanın.',
    unknownCommand: 'Bilinmeyen komut. Bkz.',
    unknownCommandHint: '/commands',
    langSwitched: (displayName) => `Menü ve bildirim dili ${displayName} olarak ayarlandı.`,
    langCurrent: (displayName) => `Dil: ${displayName}`,
    langPickerTitle: '🌍 Dil seçin — özet ve bildirimler bu dilde gönderilir:',
    langPickerCloseButton: '✖ Kapat',
    langPickerClosed: 'Dil menüsü kapatıldı.',
    langSwitchedTo: (displayName) => `Dil ayarlandı: ${displayName}`,
    contentLangCurrent: (displayName) => `Dil: ${displayName}`,
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
    budgetLimitReached: ' — limit aşıldı (uyarı; aramalar durmaz)',
    budgetNearTarget: ' — hedefe yakın',
    budgetLine: (month, spent, cap, suffix) =>
      `Aylık LLM (${month}): ~$${spent} / $${cap}${suffix}`,
    monthlyBudgetAlertTitle: '⚠️ Aylık bütçe limiti',
    monthlyBudgetAlertBody: (cap, spent) =>
      `Aylık belirlenen $${cap} limitine ulaşıldı (tahmini harcama ~$${spent}). Aşım yapmamak için aramaları duraklatın: data/control-state.json içinde "paused": true veya /pause.`,
    scheduleIntervalLine: (minutes) => `Aralık: her ${minutes} dk`,
    scheduleModeHoursLine: (hours, timezone) => `Program (${timezone}): ${hours}`,
    controlStateScheduleHint:
      'Zamanlama: data/control-state.json — scheduleMode "hours"|"interval", pollIntervalMinutes 15|30|60',
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
    upstreamSourceLabel: 'Ana kaynak',
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
    nextRun: 'Next poll',
    startupPollNowHint: 'Use /pollnow for an immediate search.',
    unknownCommand: 'Unknown command. See',
    unknownCommandHint: '/commands',
    langSwitched: (displayName) => `Menu and notification language set to ${displayName}.`,
    langCurrent: (displayName) => `Language: ${displayName}`,
    langPickerTitle: 'Choose language — summaries and notifications will use this language:',
    langPickerCloseButton: '✖ Close',
    langPickerClosed: 'Language menu closed.',
    langSwitchedTo: (displayName) => `Language set to ${displayName}`,
    contentLangCurrent: (displayName) => `Language: ${displayName}`,
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
    budgetLimitReached: ' — limit reached (alert only; polls continue)',
    budgetNearTarget: ' — near target',
    budgetLine: (month, spent, cap, suffix) =>
      `Monthly LLM (${month}): ~$${spent} / $${cap}${suffix}`,
    monthlyBudgetAlertTitle: '⚠️ Monthly budget limit',
    monthlyBudgetAlertBody: (cap, spent) =>
      `Monthly limit of $${cap} reached (estimated spend ~$${spent}). To avoid overspending, pause searches: set "paused": true in data/control-state.json or use /pause.`,
    scheduleIntervalLine: (minutes) => `Interval: every ${minutes} min`,
    scheduleModeHoursLine: (hours, timezone) => `Schedule (${timezone}): ${hours}`,
    controlStateScheduleHint:
      'Scheduling: data/control-state.json — scheduleMode "hours"|"interval", pollIntervalMinutes 15|30|60',
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
    upstreamSourceLabel: 'Upstream',
  },
  ...EXTRA_MESSAGES,
};

export function isBotLocale(value: string): value is BotLocale {
  return isSupportedLanguage(value);
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
  const schedule = state.paused
    ? MENU_SCHEDULE_TOGGLE[locale].resume
    : MENU_SCHEDULE_TOGGLE[locale].pause;
  const threeD = state.threeDNewsEnabled
    ? MENU_THREED_TOGGLE[locale].disable
    : MENU_THREED_TOGGLE[locale].enable;
  return [...MENU_STATIC[locale], MENU_LANGUAGES[locale], schedule, threeD];
}

export function formatCommandsHelp(locale: BotLocale): string {
  const lines = HELP_LINES[locale].map((h) => `${h.cmd} — ${h.desc}`);
  return `${HELP_HEADERS[locale]}\n\n${lines.join('\n')}`;
}

export function formatPollDurationShort(ms: number, locale: BotLocale): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) {
    switch (locale) {
      case 'tr':
        return `${sec} sn`;
      case 'de':
        return `${sec} Sek.`;
      case 'fr':
        return `${sec} s`;
      case 'es':
        return `${sec} s`;
      default:
        return `${sec}s`;
    }
  }
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  switch (locale) {
    case 'tr':
      return rem > 0 ? `${min} dk ${rem} sn` : `${min} dk`;
    case 'de':
      return rem > 0 ? `${min} Min. ${rem} Sek.` : `${min} Min.`;
    case 'fr':
      return rem > 0 ? `${min} min ${rem} s` : `${min} min`;
    case 'es':
      return rem > 0 ? `${min} min ${rem} s` : `${min} min`;
    default:
      return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
  }
}

export function localeDateTimeString(isoOrMs: string | number, locale: BotLocale): string {
  return new Date(isoOrMs).toLocaleString(LOCALE_BCP47[locale], { timeZone: SCHEDULE_TIMEZONE });
}

export function localeNumber(n: number, locale: BotLocale): string {
  return n.toLocaleString(LOCALE_BCP47[locale]);
}
