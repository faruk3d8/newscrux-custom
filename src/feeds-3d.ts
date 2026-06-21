// src/feeds-3d.ts — 3D AI katmanı kaynak keşfi

import Parser from 'rss-parser';
import { createLogger } from './logger.js';
import { config } from './config.js';
import { fetchAllArticles } from './feeds.js';
import type { Article, FeedConfig } from './types.js';
import {
  THREED_ARXIV_CATEGORIES,
  THREED_ARXIV_PREFIX,
  THREED_CS_CV_KEYWORDS,
  THREED_GITHUB_RELEASE_REPOS,
  THREED_RSS_FEEDS,
  THREED_SHARED_FEED_NAMES,
} from './threed.config.js';

const log = createLogger('feeds-3d');

const parser = new Parser({
  timeout: 15_000,
  headers: { 'User-Agent': `${config.userAgent.split(' (')[0]} (3D news aggregator)` },
});

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function matchesCsCvKeywords(title: string, snippet: string): boolean {
  const haystack = `${title} ${snippet}`.toLowerCase();
  return THREED_CS_CV_KEYWORDS.some((kw) => haystack.includes(kw));
}

async function fetchArxivCategory(category: string): Promise<Article[]> {
  const url = `https://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=${config.arxivMaxPerPoll}`;
  const feedName = `${THREED_ARXIV_PREFIX} ${category}`;

  try {
    const feed = await parser.parseURL(url);
    const articles: Article[] = [];

    for (const item of feed.items) {
      if (!item.link || !item.title) continue;

      const snippet = item.contentSnippet || item.summary || '';
      if (category === 'cs.CV' && !matchesCsCvKeywords(item.title, snippet)) {
        continue;
      }

      articles.push({
        id: hashString(item.link),
        title: item.title.trim(),
        link: item.link,
        snippet: snippet.trim(),
        source: feedName,
        feedKind: 'research',
        feedPriority: 'normal',
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      });
    }

    log.info(`3D arXiv ${category}: ${articles.length} articles (after prefilter)`);
    return articles;
  } catch (err) {
    log.error(`3D arXiv fetch failed for ${category}`, err);
    return [];
  }
}

async function fetchRssFeed(feed: FeedConfig): Promise<Article[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    const articles: Article[] = [];

    for (const item of parsed.items) {
      if (!item.link || !item.title) continue;
      articles.push({
        id: hashString(item.link),
        title: item.title.trim(),
        link: item.link,
        snippet: (item.contentSnippet || item.summary || '').trim(),
        source: feed.name,
        feedKind: feed.kind,
        feedPriority: feed.priority,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      });
    }

    log.info(`3D RSS ${feed.name}: ${articles.length} articles`);
    return articles;
  } catch (err) {
    log.error(`3D RSS fetch failed for ${feed.name}`, err);
    return [];
  }
}

async function fetchGitHubReleases(
  owner: string,
  repo: string,
  label: string,
): Promise<Article[]> {
  const url = `https://github.com/${owner}/${repo}/releases.atom`;
  try {
    const parsed = await parser.parseURL(url);
    const articles: Article[] = [];

    for (const item of parsed.items.slice(0, 5)) {
      if (!item.link || !item.title) continue;
      articles.push({
        id: hashString(item.link),
        title: item.title.trim(),
        link: item.link,
        snippet: (item.contentSnippet || item.summary || '').trim().slice(0, 500),
        source: `GitHub ${label}`,
        feedKind: 'official_blog',
        feedPriority: 'high',
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      });
    }

    log.info(`3D GitHub ${label}: ${articles.length} releases`);
    return articles;
  } catch (err) {
    log.warn(
      `3D GitHub releases failed for ${owner}/${repo}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

export function getThreeDFeedCount(): number {
  return (
    THREED_RSS_FEEDS.length +
    THREED_GITHUB_RELEASE_REPOS.length +
    THREED_ARXIV_CATEGORIES.length +
    THREED_SHARED_FEED_NAMES.length
  );
}

/** Dengeli 3D paketi: arXiv cs.GR + filtreli cs.CV, RSS, GitHub release, seçili genel feed'ler. */
export async function fetchThreeDArticles(): Promise<Article[]> {
  const tasks: Promise<Article[]>[] = [];

  for (const cat of THREED_ARXIV_CATEGORIES) {
    tasks.push(fetchArxivCategory(cat));
  }

  for (const feed of THREED_RSS_FEEDS) {
    tasks.push(fetchRssFeed(feed));
  }

  for (const { owner, repo, label } of THREED_GITHUB_RELEASE_REPOS) {
    tasks.push(fetchGitHubReleases(owner, repo, label));
  }

  if (THREED_SHARED_FEED_NAMES.length > 0) {
    tasks.push(
      (async () => {
        const all = await fetchAllArticles();
        const allowed = new Set(THREED_SHARED_FEED_NAMES);
        return all.filter((a) => allowed.has(a.source));
      })(),
    );
  }

  const batches = await Promise.all(tasks);
  const merged = batches.flat();

  const seen = new Set<string>();
  const unique: Article[] = [];
  for (const a of merged) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    unique.push(a);
  }

  log.info(`3D discovery total: ${unique.length} unique articles`);
  return unique;
}
