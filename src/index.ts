#!/usr/bin/env node
// src/index.ts
import { config, getEffectivePollLimits, validateConfig } from './config.js';
import { createLogger } from './logger.js';
import { fetchAllArticles, getActiveFeedCount } from './feeds.js';
import { filterByRelevance } from './relevance.js';
import { enrichEntry } from './extractor.js';
import { summarizeEntry } from './summarizer.js';
import {
  loadArticleQueue,
  saveArticleQueue,
  discoverArticles,
  handleColdStart,
  getEntriesByState,
  transitionEntry,
  markFailed,
  removeEntry,
  countByState,
  setQueueScope,
} from './queue.js';
import { sendNotification, sendArticleNotification, escapeHtml, TELEGRAM_SAFE_MESSAGE } from './telegram.js';
import { parseArgs } from './cli.js';
import { getLanguagePack } from './i18n.js';
import { startScheduledPolls, getNextScheduledRunAt, formatScheduledTime } from './scheduler.js';
import { startTelegramBotListener } from './telegram-bot.js';
import { registerPollHandler, registerPoll3DHandler } from './poll-coordinator.js';
import { isPaused, getContentLanguage, applyStartupLanguage } from './control-state.js';
import { SCHEDULE_TIMEZONE, SCHEDULE_HOURS, BOT_COMMANDS } from './telegram-commands.config.js';
import { THREED_BOT_COMMANDS } from './threed.config.js';
import { pollThreeDAndNotify } from './poll-3d.js';
import type { PollMetrics } from './types.js';
import type { PollRunOptions } from './poll-options.js';
import { PollProgressReporter } from './poll-progress.js';
import { notifyManualPollFinished } from './manual-poll-notify.js';
import { beginPollSnapshot, finishPollSnapshot } from './poll-state.js';
import { formatBuildInfoLine } from './build-info.js';
import { mapWithConcurrency } from './concurrency.js';
import {
  beginTokenSession,
  getTokenSessionTotals,
  logTokenSessionSummary,
  markBotSessionStarted,
} from './token-usage.js';
import { checkOpenRouterCredits } from './openrouter-credits.js';

const log = createLogger('main');

let pollCycleCount = 0;
let lastArxivDigestTime = 0;

function emitMetrics(metrics: PollMetrics): void {
  const parts = Object.entries(metrics)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  log.info(`[METRICS] poll_cycle=${pollCycleCount} ${parts}`);
}

function attachTokenUsage(metrics: PollMetrics): void {
  const t = getTokenSessionTotals();
  metrics.tokens_prompt = t.promptTokens;
  metrics.tokens_completion = t.completionTokens;
  metrics.tokens_total = t.totalTokens;
  metrics.tokens_calls = t.callCount;
}

function finalizePollMetrics(
  metrics: PollMetrics,
  phase: string,
  options: PollRunOptions = {},
  error?: string,
): void {
  attachTokenUsage(metrics);
  logTokenSessionSummary(pollCycleCount);
  emitMetrics(metrics);
  finishPollSnapshot({ metrics, phase, ...(error ? { error } : {}) });
  const creditChatId = options.chatId ?? config.telegramChatId;
  if (config.openrouterCreditAlertEnabled && creditChatId) {
    void checkOpenRouterCredits(creditChatId);
  }
}

async function pollAndNotify(options: PollRunOptions = {}): Promise<void> {
  pollCycleCount++;
  beginTokenSession(pollCycleCount);
  const limits = getEffectivePollLimits(options);
  const startedAt = Date.now();
  const progress = new PollProgressReporter();

  beginPollSnapshot({
    manual: options.manual ?? false,
    fastMode: limits.fastMode,
    feedProfile: config.feedProfile,
    feedCount: getActiveFeedCount(),
    phase: 'Başlatılıyor',
  });

  progress.startHeartbeat();

  const metrics: PollMetrics = {
    discovered: 0,
    enriched: 0,
    enrichment_scraped: 0,
    enrichment_snippet: 0,
    relevance_passed: 0,
    relevance_dropped: 0,
    relevance_bypassed: 0,
    summarized: 0,
    summary_failed: 0,
    sent: 0,
    send_failed: 0,
    truncated: 0,
    queue_pending: 0,
    queue_failed: 0,
    tokens_prompt: 0,
    tokens_completion: 0,
    tokens_total: 0,
    tokens_calls: 0,
  };

  try {
    log.info(
      `Starting poll cycle (manual=${!!options.manual}, fast=${limits.fastMode}, feeds=${config.feedProfile})`,
    );

    setQueueScope('default');
    loadArticleQueue('default');

    progress.phase('RSS kaynakları taranıyor…');
    const allArticles = await fetchAllArticles();

    if (handleColdStart(allArticles)) {
      const coldMsg =
        'İlk çalıştırma: mevcut haberler kuyruğa alındı, bildirim gönderilmedi. Bir sonraki aramada yeni makaleler işlenecek.';
      log.info('Cold start complete — no notifications this cycle');
      progress.detail(`ℹ️ ${coldMsg}`);
      await notifyManualPollFinished(options, metrics, 'cold_start', Date.now() - startedAt);
      finalizePollMetrics(metrics, 'İlk çalıştırma tamamlandı', options);
      return;
    }

    const newCount = discoverArticles(allArticles);
    metrics.discovered = newCount;
    saveArticleQueue();

    if (newCount === 0 && getEntriesByState('discovered').length === 0) {
      log.info('No new or pending articles');
      progress.phase('Yeni makale yok.');
      await notifyManualPollFinished(options, metrics, 'no_news', Date.now() - startedAt);
      finalizePollMetrics(metrics, 'Tamamlandı', options);
      return;
    }

    const relevancePassedIds = new Set<string>();
    const allDiscovered = getEntriesByState('discovered');
    const discovered = allDiscovered.slice(0, limits.maxRelevanceBatch);

    if (allDiscovered.length > limits.maxRelevanceBatch) {
      log.info(
        `Processing ${discovered.length}/${allDiscovered.length} discovered articles this cycle`,
      );
    }

    if (discovered.length > 0) {
      progress.phase(`AI ilgililik filtresi (${discovered.length} makale)…`);
      const result = await filterByRelevance(discovered, limits.relevanceThreshold);

      metrics.relevance_bypassed = result.bypassed.length;
      metrics.relevance_passed = result.passed.length;
      metrics.relevance_dropped = result.dropped.length;

      for (const { entry } of result.dropped) {
        removeEntry(entry.id);
      }

      for (const entry of result.passed) relevancePassedIds.add(entry.id);
      for (const entry of result.bypassed) relevancePassedIds.add(entry.id);

      if (result.parseError) {
        log.warn('Relevance parse error — allowing all entries through this cycle');
        for (const entry of discovered) {
          relevancePassedIds.add(entry.id);
        }
      }

      saveArticleQueue();
    }

    const isArxiv = (name: string) => name.startsWith(config.arxivFeedPrefix);
    const eligibleForEnrich = getEntriesByState('discovered').filter((e) =>
      relevancePassedIds.has(e.id),
    );
    const regularToEnrich = eligibleForEnrich.filter((e) => !isArxiv(e.feedName));
    const arxivToEnrich = eligibleForEnrich.filter((e) => isArxiv(e.feedName));

    const enrichBatch = [
      ...regularToEnrich.slice(0, limits.maxArticlesPerPoll),
      ...arxivToEnrich.slice(0, limits.arxivMaxPerPoll),
    ];

    if (enrichBatch.length > 0) {
      const scrapeNote = limits.skipScraping ? ' (kazıma kapalı)' : '';
      progress.phase(`İçerik zenginleştirme (${enrichBatch.length})${scrapeNote}…`);
    }

    for (const entry of enrichBatch) {
      try {
        const { enrichedContent, wasScraped } = await enrichEntry(entry, {
          skipScraping: limits.skipScraping,
        });
        transitionEntry(entry.id, 'enriched', { enrichedContent });
        metrics.enriched++;
        if (wasScraped) metrics.enrichment_scraped++;
        else metrics.enrichment_snippet++;
      } catch (err) {
        markFailed(entry.id, `Enrichment error: ${err}`);
      }
    }
    saveArticleQueue();

    const toSummarize = getEntriesByState('enriched');
    if (toSummarize.length > 0) {
      progress.phase(
        `Özetleniyor (${toSummarize.length}, eşzamanlı=${limits.summarizeConcurrency})…`,
      );
    }

    await mapWithConcurrency(toSummarize, limits.summarizeConcurrency, async (entry) => {
      const summary = await summarizeEntry(entry);
      if (summary) {
        transitionEntry(entry.id, 'summarized', { structuredSummary: summary });
        metrics.summarized++;
      } else {
        markFailed(entry.id, 'Summarization failed');
        metrics.summary_failed++;
      }
      if (limits.summarizeDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, limits.summarizeDelayMs));
      }
    });
    saveArticleQueue();

    const toSend = getEntriesByState('summarized');
    const regularToSend = toSend.filter((e) => !isArxiv(e.feedName));
    const arxivToSend = toSend.filter((e) => isArxiv(e.feedName));

    if (regularToSend.length > 0) {
      progress.phase(`Telegram gönderimi (${regularToSend.length})…`);
    }

    for (const entry of regularToSend) {
      if (!entry.structuredSummary) {
        markFailed(entry.id, 'No structured summary available');
        metrics.send_failed++;
        continue;
      }

      const { success, truncated } = await sendArticleNotification(entry, entry.structuredSummary);
      if (success) {
        transitionEntry(entry.id, 'sent');
        metrics.sent++;
        if (truncated) metrics.truncated++;
      } else {
        markFailed(entry.id, 'Telegram send failed');
        metrics.send_failed++;
      }

      if (limits.sendDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, limits.sendDelayMs));
      }
    }

    const now = Date.now();
    const arxivReady = arxivToSend.filter((e) => e.structuredSummary);
    if (
      arxivReady.length > 0 &&
      now - lastArxivDigestTime >= config.arxivDigestIntervalMs
    ) {
      progress.phase(`arXiv özeti hazırlanıyor (${arxivReady.length})…`);
      const { labels } = getLanguagePack(getContentLanguage());

      const digestParts: string[] = [];
      for (const entry of arxivReady) {
        const s = entry.structuredSummary!;
        const title = s.translated_title || (s as { title_tr?: string }).title_tr || entry.title;
        digestParts.push(`<b>${escapeHtml(title)}</b>\n${escapeHtml(s.what_happened)}`);
      }

      let digestMessage = '';
      let includedCount = 0;
      for (const part of digestParts) {
        const candidate = digestMessage ? `${digestMessage}\n\n${part}` : part;
        if (candidate.length > TELEGRAM_SAFE_MESSAGE) break;
        digestMessage = candidate;
        includedCount++;
      }

      const digestTitle = `📄 arXiv Digest (${includedCount} ${includedCount === 1 ? 'paper' : 'papers'})`;
      const success = await sendNotification(
        digestTitle,
        digestMessage,
        'https://arxiv.org',
        labels.readMore,
      );

      if (success) {
        for (const entry of arxivReady) {
          transitionEntry(entry.id, 'sent');
          metrics.sent++;
        }
        lastArxivDigestTime = now;
        log.info(
          `arXiv digest sent: ${includedCount} papers in message, ${arxivReady.length} total marked sent`,
        );
      } else {
        for (const entry of arxivReady) {
          markFailed(entry.id, 'arXiv digest send failed');
          metrics.send_failed++;
        }
      }
    } else if (arxivReady.length > 0) {
      log.info(
        `arXiv: ${arxivReady.length} papers waiting for next digest (${Math.round((config.arxivDigestIntervalMs - (now - lastArxivDigestTime)) / 60000)}min remaining)`,
      );
    }

    saveArticleQueue();

    const counts = countByState();
    metrics.queue_pending = counts.discovered + counts.enriched + counts.summarized;
    metrics.queue_failed = counts.failed;

    log.info(`Poll cycle complete: ${metrics.sent} sent, ${metrics.queue_pending} pending`);

    await notifyManualPollFinished(options, metrics, 'completed', Date.now() - startedAt);
    finalizePollMetrics(metrics, 'Tamamlandı', options);
  } catch (err) {
    log.error('Error in poll cycle', err);
    saveArticleQueue();
    finalizePollMetrics(
      metrics,
      'Hata',
      options,
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  } finally {
    progress.stopHeartbeat();
  }
}

function setupShutdown(): void {
  const shutdown = (signal: string) => {
    log.info(`Received ${signal}, shutting down...`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

function logStartupFailure(message: string, err?: unknown): void {
  log.error(message, err);
  const detail = err instanceof Error ? err.stack ?? err.message : err ? String(err) : message;
  console.error(`[newscrux] STARTUP FAILED: ${detail}`);
}

async function main(): Promise<void> {
  const { lang, langExplicit } = parseArgs();
  if (langExplicit) {
    applyStartupLanguage(lang);
  }

  const pack = getLanguagePack(getContentLanguage());
  log.info(`Newscrux ${formatBuildInfoLine()} starting... (language: ${pack.name})`);
  log.info(`cwd=${process.cwd()} node=${process.version}`);

  try {
    validateConfig();
  } catch (err) {
    logStartupFailure('Configuration invalid — fix .env or EnvironmentFile', err);
    process.exit(1);
  }

  markBotSessionStarted();

  setupShutdown();

  if (config.startupNotify) {
    const startupBody = `${pack.labels.startupMessage}\n\n${formatBuildInfoLine()}`;
    const startupSent = await sendNotification('📡 Newscrux', startupBody);
    if (startupSent) {
      log.info('Startup notification sent');
    } else {
      log.error('Failed to send startup notification — check Telegram credentials');
    }
  } else {
    log.info('Startup notification disabled (STARTUP_NOTIFY=false)');
  }

  registerPollHandler(pollAndNotify);
  registerPoll3DHandler(pollThreeDAndNotify);
  startTelegramBotListener();

  const commands = Object.values(BOT_COMMANDS).join(', ');
  const threeD = Object.values(THREED_BOT_COMMANDS)
    .map((c) => `/${c}`)
    .join(', ');
  log.info(`Bot commands: ${commands}; 3D: ${threeD}`);
  log.info(
    `Schedule: ${SCHEDULE_HOURS.join(' & ')} (${SCHEDULE_TIMEZONE})` +
      (isPaused() ? ' — PAUSED' : ''),
  );
  log.info(`Feed profile: ${config.feedProfile} (${getActiveFeedCount()} feeds)`);

  try {
    const next = getNextScheduledRunAt(SCHEDULE_TIMEZONE, SCHEDULE_HOURS);
    log.info(`Next automatic poll: ${formatScheduledTime(next, SCHEDULE_TIMEZONE)}`);
  } catch {
    // ignore scheduling preview errors
  }

  startScheduledPolls();
}

process.on('unhandledRejection', (reason) => {
  logStartupFailure('Unhandled promise rejection', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logStartupFailure('Uncaught exception', err);
  process.exit(1);
});

main().catch((err) => {
  logStartupFailure('Fatal error during startup', err);
  process.exit(1);
});
