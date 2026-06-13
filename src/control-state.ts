// src/control-state.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.js';
import { createLogger } from './logger.js';

const log = createLogger('control');

export interface ControlState {
  /** true ise 12:00 / 20:00 gibi zamanlanmış aramalar atlanır */
  paused: boolean;
}

const STATE_FILE = join(config.dataDir, 'control-state.json');

function defaultState(): ControlState {
  return { paused: false };
}

export function loadControlState(): ControlState {
  try {
    if (!existsSync(STATE_FILE)) {
      return defaultState();
    }
    const raw = readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ControlState>;
    return { paused: parsed.paused === true };
  } catch (err) {
    log.warn('Could not read control state, using defaults', err);
    return defaultState();
  }
}

export function saveControlState(state: ControlState): void {
  try {
    if (!existsSync(config.dataDir)) {
      mkdirSync(config.dataDir, { recursive: true });
    }
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    log.error('Failed to save control state', err);
  }
}

let state: ControlState = loadControlState();

export function isPaused(): boolean {
  return state.paused;
}

export function setPaused(paused: boolean): void {
  state = { paused };
  saveControlState(state);
  log.info(paused ? 'Scheduled polls paused via control state' : 'Scheduled polls resumed');
}

export function getControlState(): ControlState {
  return { ...state };
}
