// src/scheduler.ts
import { createLogger } from './logger.js';
import {
  isPaused,
  isThreeDNewsEnabled,
  reloadControlStateFromDisk,
  getScheduleMode,
  getPollIntervalMinutes,
} from './control-state.js';
import { runPollSafely } from './poll-coordinator.js';
import { SCHEDULE_TIMEZONE, SCHEDULE_HOURS } from './telegram-commands.config.js';
import { THREED_SCHEDULE_HOUR } from './threed.config.js';

const log = createLogger('scheduler');

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Yerel (timezone) saati UTC epoch ms'e çevirir */
function zonedLocalToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): number {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let i = 0; i < 4; i++) {
    const p = getZonedParts(new Date(utc), timeZone);
    const desired = Date.UTC(year, month - 1, day, hour, minute, second);
    const actual = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    utc += desired - actual;
  }

  return utc;
}

export function getNextScheduledRunAt(
  timeZone: string = SCHEDULE_TIMEZONE,
  hours: readonly number[] = SCHEDULE_HOURS,
): Date {
  reloadControlStateFromDisk();
  const mode = getScheduleMode();
  if (mode === 'interval') {
    const mins = getPollIntervalMinutes();
    if (mins) {
      return new Date(Date.now() + mins * 60_000);
    }
  }

  const now = Date.now();
  const sorted = [...hours].sort((a, b) => a - b);

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const probe = new Date(now + dayOffset * 24 * 60 * 60 * 1000);
    const z = getZonedParts(probe, timeZone);

    for (const hour of sorted) {
      const utcMs = zonedLocalToUtc(timeZone, z.year, z.month, z.day, hour, 0, 0);
      if (utcMs > now + 5000) {
        return new Date(utcMs);
      }
    }
  }

  throw new Error('Could not compute next scheduled run');
}

export function formatScheduledTime(date: Date, timeZone: string = SCHEDULE_TIMEZONE): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

async function executeScheduledPollCycle(): Promise<void> {
  const timeZone = SCHEDULE_TIMEZONE;
  const runHour = getZonedParts(new Date(), timeZone).hour;

  if (isPaused()) {
    log.info('Scheduled poll skipped — system is paused (edit data/control-state.json or use bot resume)');
    return;
  }

  await runPollSafely({ manual: false });

  if (runHour === THREED_SCHEDULE_HOUR && isThreeDNewsEnabled()) {
    log.info('Running scheduled 3D news layer after general poll');
    await runPollSafely({ manual: false, layer: '3d' });
  }
}

export function startScheduledPolls(): void {
  const timeZone = SCHEDULE_TIMEZONE;
  const hours = SCHEDULE_HOURS;

  const scheduleNext = (): void => {
    reloadControlStateFromDisk();

    const mode = getScheduleMode();
    const intervalMins = getPollIntervalMinutes();

    if (mode === 'interval' && intervalMins) {
      const delayMs = intervalMins * 60_000;
      log.info(
        `Next interval poll in ${intervalMins} min (${formatScheduledTime(new Date(Date.now() + delayMs), timeZone)})`,
      );
      setTimeout(async () => {
        await executeScheduledPollCycle();
        scheduleNext();
      }, delayMs);
      return;
    }

    let next: Date;
    try {
      next = getNextScheduledRunAt(timeZone, hours);
    } catch (err) {
      log.error('Failed to schedule next poll', err);
      setTimeout(scheduleNext, 60_000);
      return;
    }

    const delayMs = next.getTime() - Date.now();
    log.info(
      `Next scheduled poll at ${formatScheduledTime(next, timeZone)} (${Math.round(delayMs / 60000)} min)`,
    );

    setTimeout(async () => {
      await executeScheduledPollCycle();
      scheduleNext();
    }, delayMs);
  };

  scheduleNext();
}
