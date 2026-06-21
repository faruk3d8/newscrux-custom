/**
 * Telegram bot commands and schedule settings.
 * Command slugs stay English; UI strings live in bot-i18n.ts.
 */

import { THREED_BOT_COMMANDS } from './threed.config.js';

export {
  SCHEDULE_TIMEZONE,
  SCHEDULE_HOURS,
  DEFAULT_SCHEDULE_TIMEZONE,
  DEFAULT_SCHEDULE_HOURS,
  applyStartupScheduleOverrides,
} from './schedule.config.js';

export const MANUAL_POLL_COOLDOWN_MINUTES = 15;

export const BOT_COMMANDS = {
  stop: '/pause',
  start: '/resume',
  pollNow: '/pollnow',
  status: '/status',
  commands: '/commands',
} as const;

export type BotCommandAction = 'stop' | 'resume' | 'poll' | 'status' | 'help';

const COMMAND_ACTION_MAP: Record<string, BotCommandAction> = {
  [BOT_COMMANDS.stop]: 'stop',
  [BOT_COMMANDS.start]: 'resume',
  [BOT_COMMANDS.pollNow]: 'poll',
  '/poll': 'poll',
  [BOT_COMMANDS.status]: 'status',
  [BOT_COMMANDS.commands]: 'help',
  '/help': 'help',
};

export function resolveBotCommand(normalizedCmd: string): BotCommandAction | null {
  return COMMAND_ACTION_MAP[normalizedCmd] ?? null;
}

export { THREED_BOT_COMMANDS };
