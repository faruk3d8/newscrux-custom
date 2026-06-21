// src/cli.ts
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_DISPLAY_NAME } from './config.js';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n.js';
import {
  DEFAULT_SCHEDULE_HOURS,
  DEFAULT_SCHEDULE_TIMEZONE,
  parseCliScheduleHours,
  validateCliTimezone,
} from './schedule.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const pkgPath = resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function printHelp(): void {
  const defaultHours = DEFAULT_SCHEDULE_HOURS.join(',');
  console.log(`${APP_DISPLAY_NAME} — AI-powered news aggregator with Telegram notifications

Usage: newscrux [options]

Options:
  -l, --lang <code>           Summary language: ${SUPPORTED_LANGUAGES.join(', ')} (default: "en")
      --tz, --timezone <iana>   Auto poll timezone (default: "${DEFAULT_SCHEDULE_TIMEZONE}")
      --schedule-hours <list>   Auto poll hours, comma-separated 0–23 (default: "${defaultHours}")
      --3d-on                   Enable optional 3D AI news layer (persisted in data/control-state.json)
      --3d-off                  Disable 3D AI news layer (default when not set and no saved state)
  -h, --help                  Show this help message
  -v, --version               Show version number

Environment variables (.env):
  OPENROUTER_API_KEY    OpenRouter API key (required)
  TELEGRAM_BOT_TOKEN    Telegram bot token (required)
  TELEGRAM_CHAT_ID      Telegram chat ID (required)
  OPENROUTER_MODEL      AI model (default: deepseek/deepseek-v3.2-speciale)
  SCHEDULE_TIMEZONE     IANA timezone for automatic polls (default: ${DEFAULT_SCHEDULE_TIMEZONE})
  SCHEDULE_HOURS        Comma-separated hours in that timezone (default: ${defaultHours})
  Bot commands (/pause, /pollnow, …) are configured in src/telegram-commands.config.ts

Precedence: CLI flags override .env; .env overrides compiled defaults.

Examples:
  newscrux --lang=en
  newscrux --tz=Europe/Berlin --schedule-hours=9,18
  newscrux --timezone America/New_York --schedule-hours 8,20
  newscrux --3d-on              Enable 3D AI news scanning at startup
  newscrux --3d-off             Disable 3D AI news scanning at startup
  newscrux                      Start with defaults (en, ${DEFAULT_SCHEDULE_TIMEZONE} ${defaultHours})`);
}

export interface ParsedCliArgs {
  lang: SupportedLanguage;
  langExplicit: boolean;
  scheduleTimezone?: string;
  scheduleTimezoneExplicit: boolean;
  scheduleHours?: number[];
  scheduleHoursExplicit: boolean;
  threeDNewsEnabled?: boolean;
  threeDNewsExplicit: boolean;
}

export function parseArgs(): ParsedCliArgs {
  const args = process.argv.slice(2);
  let lang: SupportedLanguage = 'en';
  let langExplicit = false;
  let scheduleTimezone: string | undefined;
  let scheduleTimezoneExplicit = false;
  let scheduleHours: number[] | undefined;
  let scheduleHoursExplicit = false;
  let threeDNewsEnabled: boolean | undefined;
  let threeDNewsExplicit = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }

    if (arg === '-v' || arg === '--version') {
      console.log(getVersion());
      process.exit(0);
    }

    // --lang=xx format
    if (arg.startsWith('--lang=')) {
      const value = arg.split('=')[1];
      if (!SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)) {
        console.error(`Error: Unsupported language "${value}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
        process.exit(1);
      }
      lang = value as SupportedLanguage;
      langExplicit = true;
      continue;
    }

    // --lang xx or -l xx format
    if (arg === '--lang' || arg === '-l') {
      const value = args[i + 1];
      if (!value || value.startsWith('-')) {
        console.error(`Error: --lang requires a language code. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
        process.exit(1);
      }
      if (!SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)) {
        console.error(`Error: Unsupported language "${value}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
        process.exit(1);
      }
      lang = value as SupportedLanguage;
      langExplicit = true;
      i++; // skip next arg (the value)
      continue;
    }

    if (arg.startsWith('--timezone=') || arg.startsWith('--tz=')) {
      const value = arg.split('=')[1];
      try {
        scheduleTimezone = validateCliTimezone(value);
        scheduleTimezoneExplicit = true;
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
      continue;
    }

    if (arg === '--timezone' || arg === '--tz') {
      const value = args[i + 1];
      if (!value || value.startsWith('-')) {
        console.error('Error: --timezone requires an IANA timezone (e.g. Europe/Istanbul)');
        process.exit(1);
      }
      try {
        scheduleTimezone = validateCliTimezone(value);
        scheduleTimezoneExplicit = true;
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
      i++;
      continue;
    }

    if (arg.startsWith('--schedule-hours=')) {
      const value = arg.split('=')[1];
      try {
        scheduleHours = parseCliScheduleHours(value);
        scheduleHoursExplicit = true;
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
      continue;
    }

    if (arg === '--schedule-hours') {
      const value = args[i + 1];
      if (!value || value.startsWith('-')) {
        console.error('Error: --schedule-hours requires a comma-separated list (e.g. 12,20)');
        process.exit(1);
      }
      try {
        scheduleHours = parseCliScheduleHours(value);
        scheduleHoursExplicit = true;
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
      i++;
      continue;
    }

    if (arg === '--3d-on') {
      if (threeDNewsExplicit && threeDNewsEnabled === false) {
        console.error('Error: --3d-on and --3d-off cannot be used together');
        process.exit(1);
      }
      threeDNewsEnabled = true;
      threeDNewsExplicit = true;
      continue;
    }

    if (arg === '--3d-off') {
      if (threeDNewsExplicit && threeDNewsEnabled === true) {
        console.error('Error: --3d-on and --3d-off cannot be used together');
        process.exit(1);
      }
      threeDNewsEnabled = false;
      threeDNewsExplicit = true;
      continue;
    }
  }

  return {
    lang,
    langExplicit,
    scheduleTimezone,
    scheduleTimezoneExplicit,
    scheduleHours,
    scheduleHoursExplicit,
    threeDNewsEnabled,
    threeDNewsExplicit,
  };
}
