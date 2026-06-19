// src/feeds.ts
import Parser from 'rss-parser';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { deduplicateArticles } from './dedup.js';
import type { Article, FeedConfig } from './types.js';

const log = createLogger('feeds');
const parser = new Parser({
  timeout: config.scrapingTimeoutMs,
  headers: { 'User-Agent': config.userAgent },
});

const SNIPPET_MAX_CHARS = 1500;

const ALL_FEEDS: FeedConfig[] = [
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', kind: 'official_blog', priority: 'high' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', kind: 'official_blog', priority: 'high' },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', kind: 'official_blog', priority: 'high' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', kind: 'official_blog', priority: 'normal' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', kind: 'media', priority: 'normal' },
  { name: 'MIT Technology Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', kind: 'media', priority: 'normal' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', kind: 'media', priority: 'normal' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', kind: 'media', priority: 'normal' },
  { name: 'arXiv cs.CL', url: 'https://rss.arxiv.org/rss/cs.CL', kind: 'research', priority: 'normal' },
  { name: 'arXiv cs.LG', url: 'https://rss.arxiv.org/rss/cs.LG', kind: 'research', priority: 'normal' },
  { name: 'arXiv cs.AI', url: 'https://rss.arxiv.org/rss/cs.AI', kind: 'research', priority: 'normal' },
  { name: 'Import AI', url: 'https://importai.substack.com/feed', kind: 'newsletter', priority: 'normal' },
  { name: 'Ahead of AI', url: 'https://magazine.sebastianraschka.com/feed', kind: 'newsletter', priority: 'normal' },
];

const MINIMAL_FEED_NAMES = new Set([
  'OpenAI News',
  'Google DeepMind',
  'TechCrunch AI',
  'arXiv cs.AI',
  'Import AI',
]);

/** @deprecated use getActiveFeeds() */
export const FEEDS = ALL_FEEDS;

export function getActiveFeeds(): FeedConfig[] {
  if (config.feedProfile === 'minimal') {
    return ALL_FEEDS.filter((feed) => MINIMAL_FEED_NAMES.has(feed.name));
  }
  return ALL_FEEDS;
}

export function getActiveFeedCount(): number {
  return getActiveFeeds().length;
}

async function fetchFeed(feed: FeedConfig): Promise<Article[]> {
  try {
    log.debug(`Fetching feed: ${feed.name}`);
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).map((item) => {
      const raw = item.summary || item.contentSnippet || item.content || '';
      const snippet = raw.slice(0, SNIPPET_MAX_CHARS);
      return {
        id: item.guid || item.link || item.title || '',
        title: item.title || 'Untitled',
        link: item.link || '',
        snippet,
        source: feed.name,
        feedKind: feed.kind,
        feedPriority: feed.priority,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      };
    });
  } catch (err) {
    log.error(`Failed to fetch feed: ${feed.name}`, err);
    return [];
  }
}

export async function fetchAllArticles(): Promise<Article[]> {
  const feeds = getActiveFeeds();
  const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed)));

  const allArticles: Article[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  const unique = deduplicateArticles(allArticles);
  unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  log.info(
    `Fetched ${allArticles.length} articles from ${feeds.length} feeds, ${unique.length} after dedup`,
  );
  return unique;
}
