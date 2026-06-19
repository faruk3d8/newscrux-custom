// src/poll-3d.ts — 3D AI haber katmanı arama döngüsü

import { config, getEffectivePollLimits } from './config.js';
import { createLogger } from './logger.js';
import { fetchThreeDArticles, getThreeDFeedCount } from './feeds-3d.js';
import { filterThreeDByRelevance } from './relevance-3d.js';
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
import { sendArticleNotification } from './telegram.js';
import type { PollMetrics } from './types.js';
import type { PollRunOptions } from './poll-options.js';
import { PollProgressReporter } from './poll-progress.js';
import { beginPollSnapshot, finishPollSnapshot } from './poll-state.js';
import { mapWithConcurrency } from './concurrency.js';
import {
  beginTokenSession,
  getTokenSessionTotals,
  logTokenSessionSummary,
} from './token-usage.js';
import { assertThreeDBudgetAvailable, formatThreeDBudgetLine } from './budget-guard.js';
import { notifyManualPollFinished } from './manual-poll-notify.js';
import {
  THREED_MAX_RELEVANCE_BATCH,
  THREED_MAX_SUMMARIZE,
  THREED_RELEVANCE_THRESHOLD,
} from './threed.config.js';

const log = createLogger('poll-3d');

let poll3DCycleCount = 0;

function emitMetrics(metrics: PollMetrics): void {
  const parts = Object.entries(metrics)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  log.info(`[METRICS] poll_3d_cycle=${poll3DCycleCount} ${parts}`);
}

function attachTokenUsage(metrics: PollMetrics): void {
  const t = getTokenSessionTotals();
  metrics.tokens_prompt = t.promptTokens;
  metrics.tokens_completion = t.completionTokens;
  metrics.tokens_total = t.totalTokens;
  metrics.tokens_calls = t.callCount;
}

function finalizePollMetrics(metrics: PollMetrics, phase: string, error?: string): void {
  attachTokenUsage(metrics);
  logTokenSessionSummary(poll3DCycleCount);
  emitMetrics(metrics);
  finishPollSnapshot({ metrics, phase, ...(error ? { error } : {}) });
}

export async function pollThreeDAndNotify(options: PollRunOptions = {}): Promise<void> {
  const startedAt = Date.now();
  poll3DCycleCount++;
  beginTokenSession(poll3DCycleCount);
  const limits = getEffectivePollLimits({ fastMode: false });
  const progress = new PollProgressReporter();

  setQueueScope('3d');
  beginPollSnapshot({
    manual: !!options.manual,
    fastMode: false,
    feedProfile: '3d',
    feedCount: getThreeDFeedCount(),
    phase: '3D: Başlatılıyor',
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
    if (!assertThreeDBudgetAvailable()) {
      log.info('3D poll skipped — monthly budget limit reached');
      progress.phase('3D: aylık limit aşıldı, atlandı.');
      finalizePollMetrics(metrics, '3D bütçe limiti');
      await notifyManualPollFinished(options, metrics, 'completed', Date.now() - startedAt);
      return;
    }

    log.info(`Starting 3D poll cycle (feeds=${getThreeDFeedCount()})`);
    loadArticleQueue('3d');

    progress.phase('3D kaynakları taranıyor…');
    const allArticles = await fetchThreeDArticles();

    if (!options.manual && handleColdStart(allArticles)) {
      log.info('3D cold start complete — no notifications this cycle');
      progress.phase('3D: ilk çalıştırma, bildirim yok.');
      finalizePollMetrics(metrics, '3D ilk çalıştırma');
      await notifyManualPollFinished(options, metrics, 'cold_start', Date.now() - startedAt);
      return;
    }

    const newCount = discoverArticles(allArticles);
    metrics.discovered = newCount;
    saveArticleQueue();

    if (newCount === 0 && getEntriesByState('discovered').length === 0) {
      log.info('3D: no new or pending articles');
      progress.phase('3D: yeni makale yok.');
      finalizePollMetrics(metrics, '3D tamamlandı');
      await notifyManualPollFinished(options, metrics, 'no_news', Date.now() - startedAt);
      return;
    }

    const relevancePassedIds = new Set<string>();
    const allDiscovered = getEntriesByState('discovered');
    const discovered = allDiscovered.slice(0, THREED_MAX_RELEVANCE_BATCH);

    if (discovered.length > 0 && assertThreeDBudgetAvailable()) {
      progress.phase(`3D AI ilgililik filtresi (${discovered.length})…`);
      const result = await filterThreeDByRelevance(discovered, THREED_RELEVANCE_THRESHOLD);

      metrics.relevance_bypassed = result.bypassed.length;
      metrics.relevance_passed = result.passed.length;
      metrics.relevance_dropped = result.dropped.length;

      for (const { entry } of result.dropped) {
        removeEntry(entry.id);
      }

      for (const entry of result.passed) relevancePassedIds.add(entry.id);
      for (const entry of result.bypassed) relevancePassedIds.add(entry.id);

      if (result.parseError) {
        log.warn('3D relevance parse error — allowing all entries through this cycle');
        for (const entry of discovered) {
          relevancePassedIds.add(entry.id);
        }
      }

      saveArticleQueue();
    } else if (discovered.length > 0) {
      log.warn('3D relevance skipped — budget unavailable');
      for (const entry of discovered) {
        relevancePassedIds.add(entry.id);
      }
    }

    const eligibleForEnrich = getEntriesByState('discovered').filter((e) =>
      relevancePassedIds.has(e.id),
    );
    const enrichBatch = eligibleForEnrich.slice(0, limits.maxArticlesPerPoll);

    if (enrichBatch.length > 0) {
      progress.phase(`3D içerik zenginleştirme (${enrichBatch.length})…`);
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

    const toSummarize = getEntriesByState('enriched').slice(0, THREED_MAX_SUMMARIZE);
    if (toSummarize.length > 0 && assertThreeDBudgetAvailable()) {
      progress.phase(
        `3D özetleniyor (${toSummarize.length}, eşzamanlı=${limits.summarizeConcurrency})…`,
      );

      await mapWithConcurrency(toSummarize, limits.summarizeConcurrency, async (entry) => {
        const summary = await summarizeEntry(entry, { layer: '3d' });
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
    } else if (toSummarize.length > 0) {
      log.warn('3D summarization skipped — budget limit');
    }

    const toSend = getEntriesByState('summarized');
    if (toSend.length > 0) {
      progress.phase(`3D Telegram gönderimi (${toSend.length})…`);
    }

    for (const entry of toSend) {
      if (!entry.structuredSummary) {
        markFailed(entry.id, 'No structured summary available');
        metrics.send_failed++;
        continue;
      }

      const { success, truncated } = await sendArticleNotification(entry, entry.structuredSummary, {
        notificationEmoji: '🧊',
      });
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

    saveArticleQueue();

    const counts = countByState();
    metrics.queue_pending = counts.discovered + counts.enriched + counts.summarized;
    metrics.queue_failed = counts.failed;

    log.info(
      `3D poll complete: ${metrics.sent} sent, ${metrics.queue_pending} pending | ${formatThreeDBudgetLine()}`,
    );

    finalizePollMetrics(metrics, '3D tamamlandı');
    await notifyManualPollFinished(options, metrics, 'completed', Date.now() - startedAt);
  } catch (err) {
    log.error('Error in 3D poll cycle', err);
    saveArticleQueue();
    finalizePollMetrics(
      metrics,
      '3D hata',
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  } finally {
    progress.stopHeartbeat();
    setQueueScope('default');
  }
}
