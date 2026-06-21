# Contributing

Thank you for improving Newscrux-Custom.

## Before you start

1. Fork the repository on GitHub.
2. Clone your fork and create a branch.
3. Copy `.env.example` to `.env` — **never commit real API keys or Telegram tokens**.
4. Run `npm run build` and `npm run test:security` before opening a PR.

## Code style

- TypeScript strict mode; ESM imports with `.js` extensions in `src/`.
- Avoid circular imports between config modules (`threed.config.ts` imports `schedule.config.ts`, not `telegram-commands.config.ts` or `control-state.ts`).
- Use `safeHttpFetch` for any new outbound HTTP to RSS/article URLs.

## Reporting issues

Use [GitHub Issues](https://github.com/faruk3d8/newscrux-custom/issues) on **your fork** or the repo you cloned from. Do not paste tokens, chat IDs, or `.env` contents in issues.

## Pull requests

- One logical change per PR when possible.
- Update `.env.example` and README if you add configuration.
- Mention security impact if you touch fetching, Telegram auth, or file paths under `data/`.
