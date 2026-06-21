// src/control-state.ts — Kalıcı durum: duraklatma, 3D katmanı, dil, zamanlama modu
// Bot/CLI dışında: data/control-state.json dosyasını düzenleyin; scheduler her turda yeniden okur.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import { createLogger } from './logger.js';
import type { BotLocale } from './bot-i18n.js';
import { isBotLocale } from './bot-i18n.js';
import type { SupportedLanguage } from './i18n.js';

const log = createLogger('control-state');

const STATE_FILE = join(config.dataDir, 'control-state.json');

export type ScheduleMode = 'hours' | 'interval';
export type PollIntervalMinutes = 15 | 30 | 60;
export type ContentLanguage = SupportedLanguage;

export interface ControlState {
  paused: boolean;
  threeDNewsEnabled: boolean;
  botLocale: BotLocale;
  contentLanguage: ContentLanguage;
  /** 'hours' = SCHEDULE_HOURS; 'interval' = pollIntervalMinutes */
  scheduleMode: ScheduleMode;
  /** 15, 30 veya 60 — yalnızca scheduleMode=interval iken kullanılır */
  pollIntervalMinutes: PollIntervalMinutes | null;
}

function defaultState(): ControlState {
  return {
    paused: false,
    threeDNewsEnabled: false,
    botLocale: 'en',
    contentLanguage: 'en',
    scheduleMode: 'hours',
    pollIntervalMinutes: null,
  };
}

/** Keep bot UI and LLM summary language aligned (single user-facing language). */
function syncLanguageFields(lang: SupportedLanguage): Pick<ControlState, 'botLocale' | 'contentLanguage'> {
  return { botLocale: lang, contentLanguage: lang };
}

function normalizeBotLocale(raw: unknown): BotLocale {
  if (typeof raw === 'string' && isBotLocale(raw)) return raw;
  return defaultState().botLocale;
}

function normalizeContentLanguage(raw: unknown): ContentLanguage | null {
  if (raw === 'en' || raw === 'tr' || raw === 'de' || raw === 'fr' || raw === 'es') {
    return raw;
  }
  return null;
}

function normalizePollInterval(raw: unknown): PollIntervalMinutes | null {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  if (n === 15 || n === 30 || n === 60) return n;
  return null;
}

function normalizeScheduleMode(
  raw: unknown,
  interval: PollIntervalMinutes | null,
): ScheduleMode {
  if (raw === 'interval') {
    if (interval) return 'interval';
    log.warn('scheduleMode=interval but pollIntervalMinutes missing/invalid — using hours');
    return 'hours';
  }
  return 'hours';
}

function loadStateFromDisk(): ControlState {
  if (!existsSync(STATE_FILE)) {
    return defaultState();
  }
  try {
    const raw = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as Partial<ControlState>;
    const pollIntervalMinutes = normalizePollInterval(raw.pollIntervalMinutes);
    const preferred =
      normalizeContentLanguage(raw.contentLanguage) ?? normalizeBotLocale(raw.botLocale);
    const language = preferred ?? defaultState().botLocale;
    return {
      paused: raw.paused === true,
      threeDNewsEnabled: raw.threeDNewsEnabled === true,
      ...syncLanguageFields(language),
      scheduleMode: normalizeScheduleMode(raw.scheduleMode, pollIntervalMinutes),
      pollIntervalMinutes,
    };
  } catch (err) {
    log.warn(`Failed to load control state, using defaults: ${err}`);
    return defaultState();
  }
}

function persistState(state: ControlState): void {
  const dir = dirname(STATE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const tmp = `${STATE_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  renameSync(tmp, STATE_FILE);
}

let state: ControlState = loadStateFromDisk();

/**
 * İlk kurulumda data/control-state.json yoksa varsayılanlarla oluşturur:
 * paused=false (planlı aramalar açık), threeDNewsEnabled=false (3D kapalı).
 */
export function ensureDefaultControlStateFile(): void {
  if (existsSync(STATE_FILE)) return;
  const defaults = defaultState();
  persistState(defaults);
  state = defaults;
  log.info(
    'Created control-state.json with defaults (scheduled polls on, 3D news off)',
  );
}

/** Zamanlanmış arama döngüsünden önce çağrılır — dosyadaki scheduleMode / paused güncellenir */
export function reloadControlStateFromDisk(): void {
  state = loadStateFromDisk();
}

export function getControlState(): Readonly<ControlState> {
  return { ...state };
}

export function setControlState(partial: Partial<ControlState>): void {
  const nextInterval =
    partial.pollIntervalMinutes !== undefined
      ? normalizePollInterval(partial.pollIntervalMinutes)
      : state.pollIntervalMinutes;

  const nextMode =
    partial.scheduleMode !== undefined
      ? normalizeScheduleMode(partial.scheduleMode, nextInterval)
      : partial.pollIntervalMinutes !== undefined
        ? normalizeScheduleMode(state.scheduleMode, nextInterval)
        : state.scheduleMode;

  state = {
    ...state,
    ...partial,
    pollIntervalMinutes: nextInterval,
    scheduleMode: nextMode,
  };
  if (partial.botLocale !== undefined || partial.contentLanguage !== undefined) {
    const lang =
      partial.botLocale ??
      partial.contentLanguage ??
      state.botLocale;
    Object.assign(state, syncLanguageFields(lang));
  }
  persistState(state);
}

export function isPaused(): boolean {
  return state.paused;
}

export function setPaused(paused: boolean): void {
  setControlState({ paused });
  log.info(`Control state: paused=${paused}`);
}

export function isThreeDNewsEnabled(): boolean {
  return state.threeDNewsEnabled;
}

export function setThreeDNewsEnabled(enabled: boolean): void {
  setControlState({ threeDNewsEnabled: enabled });
  log.info(`Control state: threeDNewsEnabled=${enabled}`);
}

export function getBotLocale(): BotLocale {
  return state.botLocale;
}

export function setBotLocale(locale: BotLocale): void {
  setControlState(syncLanguageFields(locale));
  log.info(`Control state: language=${locale}`);
}

export function getContentLanguage(): ContentLanguage {
  return state.contentLanguage;
}

export function setContentLanguage(lang: ContentLanguage): void {
  setBotLocale(lang);
}

export function getScheduleMode(): ScheduleMode {
  return state.scheduleMode;
}

export function getPollIntervalMinutes(): PollIntervalMinutes | null {
  return state.pollIntervalMinutes;
}

/** Apply CLI --lang on startup; persists unified language for UI and summaries. */
export function applyStartupLanguage(lang: SupportedLanguage): void {
  setBotLocale(lang);
}

/** Apply CLI --3d-on / --3d-off on startup */
export function applyStartupThreeDNews(enabled: boolean): void {
  setThreeDNewsEnabled(enabled);
}
