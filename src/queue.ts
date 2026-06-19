// src/queue.ts
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.js';
import { createLogger } from './logger.js';
import type { Article, ArticleQueue, QueueEntry, ArticleState, SeenArticlesStore } from './types.js';

const log = createLogger('queue');

export type QueueScope = 'default' | '3d';

const QUEUE_FILES: Record<QueueScope, string> = {
  default: join(config.dataDir, 'article-queue.json'),
  '3d': join(config.dataDir, 'article-queue-3d.json'),
};

const LEGACY_SEEN_FILE = join(config.dataDir, 'seen-articles.json');
const CLEANUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_RETRIES = 3;

let activeScope: QueueScope = 'default';
const queues = new Map<QueueScope, ArticleQueue>();

export function setQueueScope(scope: QueueScope): void {
  activeScope = scope;
}

export function getQueueScope(): QueueScope {
  return activeScope;
}

function queueFile(scope: QueueScope): string {
  return QUEUE_FILES[scope];
}

function loadQueueFromDisk(scope: QueueScope): ArticleQueue {
  const file = queueFile(scope);

  if (scope === 'default' && !existsSync(file) && existsSync(LEGACY_SEEN_FILE)) {
    return migrateFromSeen(file);
  }

  try {
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf-8')) as ArticleQueue;
    }
  } catch {
    log.warn(`Queue file could not be read (${scope}), starting fresh`);
  }
  return { entries: {}, lastCleanup: Date.now(), coldStartDone: false };
}

function saveQueueToDisk(queue: ArticleQueue, scope: QueueScope): void {
  try {
    mkdirSync(config.dataDir, { recursive: true });
    const file = queueFile(scope);
    const tmpFile = `${file}.tmp`;
    writeFileSync(tmpFile, JSON.stringify(queue, null, 2), 'utf-8');
    renameSync(tmpFile, file);
  } catch (err) {
    log.error(`Failed to save queue (${scope})`, err);
  }
}

function migrateFromSeen(targetFile: string): ArticleQueue {
  log.info('Migrating from seen-articles.json to article-queue.json...');
  try {
    const old: SeenArticlesStore = JSON.parse(readFileSync(LEGACY_SEEN_FILE, 'utf-8'));
    const entries: Record<string, QueueEntry> = {};
    const now = Date.now();
    for (const [id, timestamp] of Object.entries(old.articles)) {
      entries[id] = {
        id,
        state: 'sent',
        feedName: '',
        feedKind: 'media',
        feedPriority: 'normal',
        title: '',
        link: '',
        snippet: '',
        discoveredAt: timestamp,
        lastUpdatedAt: now,
      };
    }
    const queue: ArticleQueue = {
      entries,
      lastCleanup: now,
      coldStartDone: true,
    };
    mkdirSync(config.dataDir, { recursive: true });
    const tmpFile = `${targetFile}.tmp`;
    writeFileSync(tmpFile, JSON.stringify(queue, null, 2), 'utf-8');
    renameSync(tmpFile, targetFile);
    renameSync(LEGACY_SEEN_FILE, `${LEGACY_SEEN_FILE}.bak`);
    log.info(`Migrated ${Object.keys(entries).length} entries from seen-articles.json`);
    return queue;
  } catch (err) {
    log.error('Migration failed, starting fresh', err);
    return { entries: {}, lastCleanup: Date.now(), coldStartDone: false };
  }
}

function cleanupOldEntries(queue: ArticleQueue): void {
  const cutoff = Date.now() - CLEANUP_INTERVAL_MS;
  if (queue.lastCleanup > cutoff) return;

  let removed = 0;
  for (const [id, entry] of Object.entries(queue.entries)) {
    if (entry.state === 'sent' && entry.lastUpdatedAt < cutoff) {
      delete queue.entries[id];
      removed++;
    }
    if (entry.state === 'failed' && (entry.retryCount ?? 0) >= MAX_RETRIES) {
      delete queue.entries[id];
      removed++;
    }
  }
  queue.lastCleanup = Date.now();
  if (removed > 0) log.info(`Cleaned up ${removed} old queue entries (${activeScope})`);
}

function getQueue(): ArticleQueue {
  const queue = queues.get(activeScope);
  if (!queue) {
    throw new Error(`Queue not loaded for scope "${activeScope}". Call loadArticleQueue() first.`);
  }
  return queue;
}

export function loadArticleQueue(scope?: QueueScope): ArticleQueue {
  if (scope !== undefined) {
    activeScope = scope;
  }
  const queue = loadQueueFromDisk(activeScope);
  cleanupOldEntries(queue);
  queues.set(activeScope, queue);
  log.info(
    `Loaded queue (${activeScope}): ${Object.keys(queue.entries).length} entries`,
  );
  return queue;
}

export function saveArticleQueue(): void {
  const queue = queues.get(activeScope);
  if (queue) {
    saveQueueToDisk(queue, activeScope);
  }
}

export function isKnown(articleId: string): boolean {
  return articleId in getQueue().entries;
}

export function discoverArticles(articles: Article[]): number {
  const queue = getQueue();
  const now = Date.now();
  let count = 0;

  for (const article of articles) {
    if (!article.id || isKnown(article.id)) continue;
    queue.entries[article.id] = {
      id: article.id,
      state: 'discovered',
      feedName: article.source,
      feedKind: article.feedKind,
      feedPriority: article.feedPriority,
      title: article.title,
      link: article.link,
      snippet: article.snippet,
      discoveredAt: now,
      lastUpdatedAt: now,
    };
    count++;
  }

  return count;
}

export function handleColdStart(articles: Article[]): boolean {
  const queue = getQueue();
  if (queue.coldStartDone) return false;

  log.info(
    `Cold start (${activeScope}): marking ${articles.length} existing articles as sent (no notifications)`,
  );
  const now = Date.now();
  for (const article of articles) {
    if (!article.id) continue;
    queue.entries[article.id] = {
      id: article.id,
      state: 'sent',
      feedName: article.source,
      feedKind: article.feedKind,
      feedPriority: article.feedPriority,
      title: article.title,
      link: article.link,
      snippet: article.snippet,
      discoveredAt: now,
      lastUpdatedAt: now,
    };
  }
  queue.coldStartDone = true;
  saveQueueToDisk(queue, activeScope);
  return true;
}

export function getEntriesByState(state: ArticleState, limit?: number): QueueEntry[] {
  const entries = Object.values(getQueue().entries).filter((e) => e.state === state);
  entries.sort((a, b) => a.discoveredAt - b.discoveredAt);
  return limit ? entries.slice(0, limit) : entries;
}

export function transitionEntry(
  id: string,
  newState: ArticleState,
  updates?: Partial<QueueEntry>,
): void {
  const queue = getQueue();
  const entry = queue.entries[id];
  if (!entry) {
    log.warn(`Cannot transition unknown entry: ${id}`);
    return;
  }
  entry.state = newState;
  entry.lastUpdatedAt = Date.now();
  if (updates) {
    Object.assign(entry, updates);
  }
}

export function markFailed(id: string, error: string): void {
  const queue = getQueue();
  const entry = queue.entries[id];
  if (!entry) return;

  entry.retryCount = (entry.retryCount ?? 0) + 1;
  entry.lastError = error;

  if (entry.retryCount >= MAX_RETRIES) {
    entry.state = 'failed';
    log.warn(`Entry ${id} failed permanently after ${MAX_RETRIES} attempts: ${error}`);
  } else {
    if (entry.enrichedContent) {
      entry.state = 'enriched';
    } else {
      entry.state = 'discovered';
    }
    log.info(
      `Entry ${id} will be retried (attempt ${entry.retryCount}/${MAX_RETRIES}): ${error}`,
    );
  }
  entry.lastUpdatedAt = Date.now();
}

export function removeEntry(id: string): void {
  delete getQueue().entries[id];
}

export function countByState(): Record<ArticleState, number> {
  const counts: Record<ArticleState, number> = {
    discovered: 0,
    enriched: 0,
    summarized: 0,
    sent: 0,
    failed: 0,
  };
  for (const entry of Object.values(getQueue().entries)) {
    counts[entry.state]++;
  }
  return counts;
}
