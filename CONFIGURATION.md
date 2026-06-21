# Configuration guide (newscrux-custom)

Where to change bot command names, schedule times, feeds, limits, and languages.

## Quick reference

| What you want to change | File | Notes |
|-------------------------|------|--------|
| Main bot commands (`/pause`, `/pollnow`, …) | `src/telegram-commands.config.ts` | `BOT_COMMANDS` |
| Auto poll hours (e.g. 12:00, 20:00) | `.env` or CLI | `SCHEDULE_HOURS`, `SCHEDULE_TIMEZONE` (hours mode only) |
| Auto poll every 15 / 30 / 60 min | `data/control-state.json` | `scheduleMode: "interval"`, `pollIntervalMinutes` |
| Pause / resume polls | `data/control-state.json` or bot | `paused: true/false`; `/pause`, `/resume` |
| Monthly LLM spend alert (no auto-stop) | `.env` | `THREED_MONTHLY_BUDGET_USD` |
| Auto poll timezone | `.env` or CLI | `SCHEDULE_TIMEZONE`; `--tz` / `--timezone` |
| Manual poll cooldown | `src/telegram-commands.config.ts` | `MANUAL_POLL_COOLDOWN_MINUTES` |
| 3D commands (`/3dainews`, …) | `src/threed.config.ts` or `.env` | `THREED_COMMAND_*` |
| 3D auto-run hour | `src/threed.config.ts` or `.env` | `THREED_SCHEDULE_HOUR` |
| 3D feeds, keywords, budgets | `src/threed.config.ts` or `.env` | `THREED_*` |
| RSS feed list (minimal / full) | `src/feeds.ts` + `.env` | `FEED_PROFILE=minimal\|full` |
| API keys, Telegram, model | `.env` | Copy from `.env.example` |
| Poll limits, delays, rate limit | `.env` | See `.env.example` comments |
| Bot UI text (help, errors) | `src/bot-i18n.ts` | Turkish / English strings |
| UI language commands | `src/bot-i18n.ts` | `/languages`, `/langtr`, `/langen` handlers |
| Article summary language | CLI + runtime | `npm start -- --lang=en` (default `en`) or bot `/languages` |
| systemd install path & default lang | `newscrux.service` | Default clone dir: `~/newscrux-custom` |

After editing TypeScript config files, run `npm run build` and restart the service.

---

## 1. Telegram commands and schedule

**Command names:** `src/telegram-commands.config.ts`

**Automatic poll schedule:** `.env`, CLI flags, or compiled defaults in `src/schedule.config.ts`

```bash
# .env
SCHEDULE_TIMEZONE=Europe/Istanbul
SCHEDULE_HOURS=12,20

# CLI (overrides .env for this run)
npm start -- --tz=Europe/Berlin --schedule-hours=9,18
```

Precedence: **CLI → `.env` → defaults** (`Europe/Istanbul`, hours `12` and `20`).

**Hours mode vs interval mode** (mutually exclusive; chosen in `data/control-state.json`, not via new bot commands):

| Mode | `scheduleMode` | `pollIntervalMinutes` | When polls run |
|------|----------------|----------------------|----------------|
| Fixed hours (default) | `"hours"` | `null` | At each hour in `SCHEDULE_HOURS` (env/CLI), in `SCHEDULE_TIMEZONE` |
| Interval | `"interval"` | `15`, `30`, or `60` | Every N minutes after the previous cycle completes |

Copy `data/control-state.example.json` → `data/control-state.json` and edit. The scheduler reloads this file before each cycle, so changes apply without restart.

**Example — poll every 15 minutes:**

```json
{
  "paused": false,
  "threeDNewsEnabled": false,
  "botLocale": "en",
  "contentLanguage": "en",
  "scheduleMode": "interval",
  "pollIntervalMinutes": 15
}
```

**Example — fixed hours (uses env `SCHEDULE_HOURS=12,16,20`):**

```json
{
  "paused": false,
  "threeDNewsEnabled": false,
  "botLocale": "en",
  "contentLanguage": "en",
  "scheduleMode": "hours",
  "pollIntervalMinutes": null
}
```

Use `/status` in Telegram for a read-only view of the active mode, next run, and budget line. To stop polls after a budget alert, set `"paused": true` or send `/pause`.

```typescript
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
| Daily run hour (local wall clock) | `THREED_SCHEDULE_HOUR` | `12` |
| Monthly LLM spend alert (USD) | `THREED_MONTHLY_BUDGET_USD` | Alert only — does **not** block polls or 3D |
| Extra RSS URLs | `THREED_FEED_*` | see `.env.example` |

**Important:** `threed.config.ts` imports timezone from `src/schedule.config.ts` (not `telegram-commands.config.ts`) to avoid circular imports. Set `SCHEDULE_TIMEZONE` in `.env` or CLI to align 3D auto-run with main poll timezone.

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

- `SCHEDULE_TIMEZONE`, `SCHEDULE_HOURS` — automatic poll schedule (see §1)

---

## 4. RSS feeds

**File:** `src/feeds.ts`

Feed URLs and profiles used by the main (non-3D) pipeline. Switch profile via `FEED_PROFILE` in `.env`.

---

## 5. Languages

One language applies everywhere: Telegram menu text, bot replies, and LLM summaries.

| How to change | Where |
|---------------|--------|
| `/languages` inline picker (recommended) | Persists in `data/control-state.json` |
| `/langtr`, `/langen` | Same as picker for Turkish / English; refreshes the command menu |
| `npm start -- --lang=en\|tr\|de\|fr\|es` | Startup override (see note below) |
| UI strings | `src/bot-i18n.ts`, `src/bot-i18n-extra.ts` |
| Summary prompts / labels | `src/i18n.ts` |

Default is English when `data/control-state.json` is missing (`botLocale` and `contentLanguage` are both `en` and always kept in sync). Do not pass `--lang=…` in systemd `ExecStart` on every restart — it overrides the user’s choice from `/languages`.

---

## 6. Runtime control file (`data/control-state.json`)

Persisted JSON edited on the server (no dedicated CLI/bot commands for schedule mode). Fields:

| Field | Type | Description |
|-------|------|-------------|
| `paused` | boolean | When `true`, scheduled and 3D auto polls are skipped (`/pause` / `/resume` update this) |
| `threeDNewsEnabled` | boolean | 3D layer on/off (also `/3dainewsopen` / `/3dainewsclose`) |
| `botLocale` | `tr` \| `en` \| … | Selected language (UI); kept equal to `contentLanguage` |
| `contentLanguage` | `en` \| `tr` \| … | Same as `botLocale` (LLM summaries); updated together |
| `scheduleMode` | `hours` \| `interval` | Fixed clock hours vs repeating interval |
| `pollIntervalMinutes` | `15` \| `30` \| `60` \| `null` | Required when `scheduleMode` is `interval`; must be `null` in hours mode |

**Monthly budget:** `THREED_MONTHLY_BUDGET_USD` in `.env` sets the alert threshold for **all** LLM usage (main RSS polls + 3D). When estimated spend for the calendar month reaches that amount, the bot sends **one** Telegram warning per month. Searches are **not** stopped automatically — pause manually if you want to avoid overage.

Example template: `data/control-state.example.json`.

---

## 7. Deployment paths

| Item | Default path |
|------|----------------|
| Clone directory | `~/newscrux-custom` |
| systemd unit | `newscrux.service` → `%h/newscrux-custom` |

Copy the unit file manually:

```bash
mkdir -p ~/.config/systemd/user
cp newscrux.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now newscrux
loginctl enable-linger "$(whoami)"
```

Change paths consistently in `newscrux.service` if you use a different directory name.

---

## 8. Upstream comparison

Architectural differences vs original [newscrux](https://github.com/alicankiraz1/newscrux):  
[docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt](docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt) (Turkish, summary + technical detail). Short table: [README.md](README.md).
