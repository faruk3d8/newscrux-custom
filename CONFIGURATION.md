# Configuration guide (newscrux-custom)

Where to change bot command names, schedule times, feeds, limits, and languages.

## Quick reference

| What you want to change | File | Notes |
|-------------------------|------|--------|
| Main bot commands (`/pause`, `/pollnow`, …) | `src/telegram-commands.config.ts` | `BOT_COMMANDS` |
| Auto poll hours (e.g. 12:00, 20:00) | `src/telegram-commands.config.ts` | `SCHEDULE_HOURS`, `SCHEDULE_TIMEZONE` |
| Manual poll cooldown | `src/telegram-commands.config.ts` | `MANUAL_POLL_COOLDOWN_MINUTES` |
| 3D commands (`/3dainews`, …) | `src/threed.config.ts` or `.env` | `THREED_COMMAND_*` |
| 3D auto-run hour | `src/threed.config.ts` or `.env` | `THREED_SCHEDULE_HOUR` |
| 3D feeds, keywords, budgets | `src/threed.config.ts` or `.env` | `THREED_*` |
| RSS feed list (minimal / full) | `src/feeds.ts` + `.env` | `FEED_PROFILE=minimal\|full` |
| API keys, Telegram, model | `.env` | Copy from `.env.example` |
| Poll limits, delays, rate limit | `.env` | See `.env.example` comments |
| Bot UI text (help, errors) | `src/bot-i18n.ts` | Turkish / English strings |
| UI language commands | `src/bot-i18n.ts` | `/langtr`, `/langen` handlers |
| Article summary language | CLI + runtime | `npm start -- --lang=tr` or bot state |
| systemd install path & default lang | `newscrux.service`, `scripts/install-systemd.sh` | Default clone dir: `~/newscrux-custom` |

After editing TypeScript config files, run `npm run build` and restart the service.

---

## 1. Telegram commands and schedule

**File:** `src/telegram-commands.config.ts`

```typescript
export const SCHEDULE_TIMEZONE = 'Europe/Istanbul';
export const SCHEDULE_HOURS = [12, 20] as const;
export const MANUAL_POLL_COOLDOWN_MINUTES = 15;

export const BOT_COMMANDS = {
  stop: '/pause',
  start: '/resume',
  pollNow: '/pollnow',
  status: '/status',
  commands: '/commands',
} as const;
```

`/poll` is accepted as an alias for `/pollnow` in `COMMAND_ACTION_MAP`. There is no separate `/pollfast` bot command; internal `FAST_*` env limits apply only if code paths use `fastMode`.
```

- Change slug strings in `BOT_COMMANDS` (keep the leading `/`).
- Add new commands: extend `BOT_COMMANDS`, `COMMAND_ACTION_MAP`, and handle the action in `src/telegram-bot.ts`.
- Menu text shown to users is in `src/bot-i18n.ts`, not in this file.

---

## 2. 3D AI news layer

**File:** `src/threed.config.ts` (defaults) or **`.env`** (overrides without recompiling for env-backed fields)

| Setting | Env variable | Default |
|---------|--------------|---------|
| Status command | `THREED_COMMAND_STATUS` | `3dainews` |
| Enable command | `THREED_COMMAND_ENABLE` | `3dainewsopen` |
| Disable command | `THREED_COMMAND_DISABLE` | `3dainewsclose` |
| Daily run hour (IST) | `THREED_SCHEDULE_HOUR` | `12` |
| Monthly budget USD | `THREED_MONTHLY_BUDGET_USD` | see file |
| Extra RSS URLs | `THREED_FEED_*` | see `.env.example` |

**Important:** `threed.config.ts` must not import `telegram-commands.config.ts` (circular import). Timezone is duplicated intentionally as `SCHEDULE_TIMEZONE` in both files.

---

## 3. Environment variables (`.env`)

Copy `.env.example` → `.env`. Required:

- `OPENROUTER_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Common optional tuning (full list in `.env.example`):

- `FEED_PROFILE` — `minimal` (5 feeds) or `full` (13 feeds)
- `MAX_ARTICLES_PER_POLL`, `ARXIV_MAX_PER_POLL`, relevance thresholds
- `FAST_*` — internal fast-mode limits (no dedicated bot command)
- `COMMAND_RATE_LIMIT_PER_MINUTE`
- `LOG_LEVEL`, scrape timeouts, OpenRouter credit alerts

Schedule hours are **not** in `.env`; use `telegram-commands.config.ts`.

---

## 4. RSS feeds

**File:** `src/feeds.ts`

Feed URLs and profiles used by the main (non-3D) pipeline. Switch profile via `FEED_PROFILE` in `.env`.

---

## 5. Languages

| Layer | Where |
|-------|--------|
| Summary language (LLM output) | `npm start -- --lang=en\|tr\|de\|fr\|es` or runtime via control state |
| Bot message language | `/langtr`, `/langen` — strings in `src/bot-i18n.ts` |
| Validation / errors for summaries | `src/i18n.ts` |

Default language is Turkish (`botLocale: tr` in `data/control-state.json`). Override once with `npm start -- --lang=tr|en|...` or Telegram `/langtr` / `/langen`. Do not put `--lang=en` in systemd unless you intentionally want English on every restart.

---

## 6. Deployment paths

| Item | Default path |
|------|----------------|
| Clone directory | `~/newscrux-custom` |
| systemd unit | `newscrux.service` → `%h/newscrux-custom` |
| Install script | `scripts/install-systemd.sh` (`REPO_DIR`) |
| Remote sync | `./scripts/deploy-to-pi.sh user@host` (no default host) |

Change paths consistently in all four places if you use a different directory name.

---

## 7. Upstream comparison

Architectural differences vs original [newscrux](https://github.com/alicankiraz1/newscrux):  
[docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt](docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt) (Turkish, summary + technical detail). Short table: [README.md](README.md).
