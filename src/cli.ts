// src/cli.ts
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n.js';

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
  console.log(`Newscrux — AI-powered news aggregator with Telegram notifications

Usage: newscrux [options]

Options:
  -l, --lang <code>   Summary language: ${SUPPORTED_LANGUAGES.join(', ')} (default: "tr")
  -h, --help          Show this help message
  -v, --version       Show version number

Environment variables (.env):
  OPENROUTER_API_KEY    OpenRouter API key (required)
  TELEGRAM_BOT_TOKEN    Telegram bot token (required)
  TELEGRAM_CHAT_ID      Telegram chat ID (required)
  OPENROUTER_MODEL      AI model (default: deepseek/deepseek-v3.2-speciale)
  Schedule & bot commands are configured in src/telegram-commands.config.ts
  (default: Istanbul 12:00 and 20:00, commands /pause /resume /pollnow /status)

Examples:
  newscrux --lang=tr    Start with Turkish summaries
  newscrux -l de        Start with German summaries
  newscrux              Start with Turkish summaries (default)`);
}

export function parseArgs(): { lang: SupportedLanguage; langExplicit: boolean } {
  const args = process.argv.slice(2);
  let lang: SupportedLanguage = 'tr';
  let langExplicit = false;

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
  }

  return { lang, langExplicit };
}
