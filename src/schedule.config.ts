/**
 * Automatic poll schedule: timezone and wall-clock hours.
 * Precedence: CLI flags → .env → compiled defaults.
 */
import { config as loadEnv } from 'dotenv';

loadEnv();

export const DEFAULT_SCHEDULE_TIMEZONE = 'Europe/Istanbul';
export const DEFAULT_SCHEDULE_HOURS = [12, 20] as const;

function validateTimezone(timeZone: string): string {
  const trimmed = timeZone.trim();
  if (!trimmed) {
    throw new Error('Schedule timezone must be a non-empty IANA name (e.g. Europe/Istanbul)');
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return trimmed;
  } catch {
    throw new Error(
      `Invalid IANA timezone "${timeZone}" (examples: Europe/Istanbul, America/New_York)`,
    );
  }
}

function parseScheduleHoursList(raw: string | undefined, source: string): number[] {
  if (raw === undefined || raw.trim() === '') {
    return [...DEFAULT_SCHEDULE_HOURS];
  }

  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`${source} must include at least one hour (0–23, comma-separated)`);
  }

  const hours = parts.map((part) => {
    const n = Number.parseInt(part, 10);
    if (Number.isNaN(n) || n < 0 || n > 23) {
      throw new Error(`${source}: invalid hour "${part}" (use 0–23, comma-separated)`);
    }
    return n;
  });

  return [...new Set(hours)].sort((a, b) => a - b);
}

function applyResolved(timezone: string, hours: number[]): void {
  _scheduleTimezone = validateTimezone(timezone);
  if (hours.length === 0) {
    throw new Error('Schedule hours must include at least one hour (0–23)');
  }
  for (const hour of hours) {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new Error(`Invalid schedule hour: ${hour} (use 0–23)`);
    }
  }
  _scheduleHours = [...new Set(hours)].sort((a, b) => a - b);
}

function resolveScheduleFromEnv(): { timezone: string; hours: number[] } {
  const timezone = process.env.SCHEDULE_TIMEZONE ?? DEFAULT_SCHEDULE_TIMEZONE;
  const hours = parseScheduleHoursList(process.env.SCHEDULE_HOURS, 'SCHEDULE_HOURS');
  return { timezone, hours };
}

let _scheduleTimezone: string = DEFAULT_SCHEDULE_TIMEZONE;
let _scheduleHours: number[] = [...DEFAULT_SCHEDULE_HOURS];

try {
  const resolved = resolveScheduleFromEnv();
  applyResolved(resolved.timezone, resolved.hours);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[newscrux] Invalid schedule configuration: ${message}`);
  process.exit(1);
}

/** Effective IANA timezone for scheduled polls (live binding; CLI may override at startup). */
export let SCHEDULE_TIMEZONE = _scheduleTimezone;

/** Wall-clock hours in SCHEDULE_TIMEZONE when automatic polls run. */
export let SCHEDULE_HOURS: readonly number[] = _scheduleHours;

export interface StartupScheduleOverrides {
  timezone?: string;
  hours?: number[];
}

/** Apply CLI overrides after env defaults were loaded at import time. */
export function applyStartupScheduleOverrides(overrides: StartupScheduleOverrides): void {
  const timezone = overrides.timezone ?? _scheduleTimezone;
  const hours = overrides.hours ?? [..._scheduleHours];
  applyResolved(timezone, hours);
  SCHEDULE_TIMEZONE = _scheduleTimezone;
  SCHEDULE_HOURS = _scheduleHours;
}

export function parseCliScheduleHours(raw: string): number[] {
  return parseScheduleHoursList(raw, '--schedule-hours');
}

export function validateCliTimezone(raw: string): string {
  return validateTimezone(raw);
}
