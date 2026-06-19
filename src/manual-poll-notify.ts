// src/manual-poll-notify.ts — Telegram feedback for manual /pollnow only

import { sendChatMessage } from './telegram.js';
import { getBotLocale } from './control-state.js';
import {
  formatPollDurationShort,
  getBotMessages,
} from './bot-i18n.js';
import type { PollRunOptions } from './poll-options.js';
import type { PollMetrics } from './types.js';

export type ManualPollOutcome =
  | 'cold_start'
  | 'no_news'
  | 'completed';

function formatMetricsFooter(
  metrics: PollMetrics,
  durationMs: number | undefined,
  locale: ReturnType<typeof getBotLocale>,
): string {
  const msg = getBotMessages(locale);
  const parts: string[] = [];
  if (metrics.discovered > 0) {
    parts.push(`${msg.metricDiscovered} ${metrics.discovered}`);
  }
  if (metrics.sent > 0) {
    parts.push(`${msg.metricSent} ${metrics.sent}`);
  }
  if (metrics.relevance_dropped > 0) {
    parts.push(`${msg.metricFiltered} ${metrics.relevance_dropped}`);
  }
  if (metrics.queue_pending > 0) {
    parts.push(`${msg.metricQueued} ${metrics.queue_pending}`);
  }
  if (durationMs !== undefined && durationMs > 0) {
    parts.push(`${msg.metricDuration} ${formatPollDurationShort(durationMs, locale)}`);
  }
  return parts.length > 0 ? `\n${parts.join(' · ')}` : '';
}

function buildCompletionMessage(
  options: PollRunOptions,
  metrics: PollMetrics,
  outcome: ManualPollOutcome,
  durationMs?: number,
): string {
  const locale = getBotLocale();
  const msg = getBotMessages(locale);
  const mode =
    options.layer === '3d'
      ? msg.pollMode3D
      : options.fastMode
        ? msg.pollModeFast
        : msg.pollModeNormal;
  const footer = formatMetricsFooter(metrics, durationMs, locale);

  switch (outcome) {
    case 'cold_start':
      return msg.pollCompleteColdStart(mode, footer);
    case 'no_news':
      return msg.pollCompleteNoNews(mode, footer);
    case 'completed': {
      if (metrics.sent > 0) {
        return msg.pollCompleteSent(mode, metrics.sent, footer);
      }
      if (metrics.discovered > 0 || metrics.summarized > 0) {
        return msg.pollCompleteFiltered(mode, footer);
      }
      return msg.pollCompleteEmpty(mode, footer);
    }
  }
}

export async function notifyManualPollStarted(options: PollRunOptions): Promise<void> {
  if (!options.manual || !options.chatId) return;
  const msg = getBotMessages(getBotLocale());
  let text: string;
  if (options.layer === '3d') {
    text = msg.pollStarted3D;
  } else if (options.fastMode) {
    text = msg.pollStartedFast;
  } else {
    text = msg.pollStarted;
  }
  await sendChatMessage(options.chatId, text);
}

export async function notifyManualPollFinished(
  options: PollRunOptions,
  metrics: PollMetrics,
  outcome: ManualPollOutcome,
  durationMs?: number,
): Promise<void> {
  if (!options.manual || !options.chatId) return;
  const text = buildCompletionMessage(options, metrics, outcome, durationMs);
  await sendChatMessage(options.chatId, text);
}
