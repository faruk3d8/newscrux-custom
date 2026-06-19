// src/control-state.ts
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { config, runtimeConfig } from './config.js';
import { createLogger } from './logger.js';
import type { SupportedLanguage } from './i18n.js';
import type { BotLocale } from './bot-i18n.js';
import { isBotLocale } from './bot-i18n.js';

const log = createLogger('control-state');

const STATE_FILE = join(config.dataDir, 'control-state.json');

export interface ControlState {
  paused: boolean;
  /** 3D AI news layer — default off; enable with /3dainewsopen */
  threeDNewsEnabled: boolean;
  /** Telegram bot UI language (commands menu + replies) */
  botLocale: BotLocale;
}

function defaultState(): ControlState {
  return { paused: false, threeDNewsEnabled: false, botLocale: 'tr' };
}

function loadControlState(): ControlState {
  if (!existsSync(STATE_FILE)) {
    return defaultState();
  }
  try {
    const raw = readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ControlState>;
    const botLocale =
      typeof parsed.botLocale === 'string' && isBotLocale(parsed.botLocale)
        ? parsed.botLocale
        : defaultState().botLocale;
    return {
      paused: parsed.paused === true,
      threeDNewsEnabled: parsed.threeDNewsEnabled === true,
      botLocale,
    };
  } catch (err) {
    log.warn(`Failed to load control state, using defaults: ${err}`);
    return defaultState();
  }
}

function saveControlState(state: ControlState): void {
  const tmp = `${STATE_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  renameSync(tmp, STATE_FILE);
}

let state: ControlState = loadControlState();

function syncContentLanguageFromBotLocale(): void {
  runtimeConfig.language = state.botLocale;
}

syncContentLanguageFromBotLocale();

/** LLM summaries and article notifications follow bot locale (/langtr, /langen) or --lang. */
export function getContentLanguage(): SupportedLanguage {
  return runtimeConfig.language;
}

/** Apply CLI --lang on startup; tr/en also persist as botLocale. */
export function applyStartupLanguage(lang: SupportedLanguage): void {
  if (isBotLocale(lang)) {
    setBotLocale(lang);
  } else {
    runtimeConfig.language = lang;
    log.info(`Runtime content language: ${lang}`);
  }
}

export function getControlState(): ControlState {
  return { ...state };
}

export function isPaused(): boolean {
  return state.paused;
}

export function setPaused(paused: boolean): void {
  state = { ...state, paused };
  saveControlState(state);
  log.info(`Control state: paused=${paused}`);
}

export function isThreeDNewsEnabled(): boolean {
  return state.threeDNewsEnabled;
}

export function setThreeDNewsEnabled(enabled: boolean): void {
  state = { ...state, threeDNewsEnabled: enabled };
  saveControlState(state);
  log.info(`Control state: threeDNewsEnabled=${enabled}`);
}

export function getBotLocale(): BotLocale {
  return state.botLocale;
}

export function setBotLocale(locale: BotLocale): void {
  state = { ...state, botLocale: locale };
  saveControlState(state);
  syncContentLanguageFromBotLocale();
  log.info(`Control state: botLocale=${locale}`);
}
