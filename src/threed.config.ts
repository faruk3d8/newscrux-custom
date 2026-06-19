// src/threed.config.ts — 3D AI haber katmanı: komutlar, saatler, kaynaklar, limitler
// Düzenlemek için bu dosyayı veya .env içindeki THREED_* değişkenlerini kullanın.

import type { FeedConfig } from './types.js';

/** Same as telegram-commands.config SCHEDULE_TIMEZONE (avoid circular import) */
const SCHEDULE_TIMEZONE = 'Europe/Istanbul';

/** Telegram command names (no slash, no spaces) */
export const THREED_BOT_COMMANDS = {
  status: process.env.THREED_COMMAND_STATUS ?? '3dainews',
  enable: process.env.THREED_COMMAND_ENABLE ?? '3dainewsopen',
  disable: process.env.THREED_COMMAND_DISABLE ?? '3dainewsclose',
  poll: process.env.THREED_COMMAND_POLL ?? 'poll3d',
} as const;

/** Otomatik 3D aramasının çalışacağı saat (Europe/Istanbul, telegram-commands.config ile aynı timezone) */
export const THREED_SCHEDULE_HOUR = parseInt(process.env.THREED_SCHEDULE_HOUR ?? '12', 10);

/** Günlük özet tavanı (3D katmanı) */
export const THREED_MAX_SUMMARIZE = parseInt(process.env.THREED_MAX_SUMMARIZE ?? '5', 10);

/** Relevance batch üst sınırı (3D katmanı) */
export const THREED_MAX_RELEVANCE_BATCH = parseInt(process.env.THREED_MAX_RELEVANCE_BATCH ?? '25', 10);

/** Relevance eşiği (1–10) */
export const THREED_RELEVANCE_THRESHOLD = parseInt(process.env.THREED_RELEVANCE_THRESHOLD ?? '7', 10);

/** arXiv cs.CV ön filtresi — başlık/özet eşleşmesi (küçük harf) */
export const THREED_CS_CV_KEYWORDS: readonly string[] = (
  process.env.THREED_CS_CV_KEYWORDS ??
  [
    '3d',
    'mesh',
    'nerf',
    'gaussian splat',
    'splatting',
    'point cloud',
    'voxel',
    'cad',
    'cadquery',
    'shape',
    'geometry',
    'reconstruction',
    'text-to-3d',
    'image-to-3d',
    'triplane',
    'implicit',
    'sdf',
    'radiance field',
    'texture generation',
    'rigging',
    'avatar',
    'human mesh',
    'scene generation',
  ].join(',')
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** GitHub release atom feed'leri (owner/repo) */
export const THREED_GITHUB_RELEASE_REPOS: readonly { owner: string; repo: string; label: string }[] = [
  { owner: 'microsoft', repo: 'TRELLIS', label: 'TRELLIS' },
  { owner: 'tencent', repo: 'Hunyuan3D-2', label: 'Hunyuan3D-2' },
  { owner: 'tencent', repo: 'Hunyuan3D-2.1', label: 'Hunyuan3D-2.1' },
  { owner: 'VAST-AI-Research', repo: 'TripoSR', label: 'TripoSR' },
  { owner: 'VAST-AI-Research', repo: 'TripoSG', label: 'TripoSG' },
  { owner: 'gudo7208', repo: 'CAD-Coder', label: 'CAD-Coder (text)' },
  { owner: 'anniedoris', repo: 'CAD-Coder', label: 'CAD-Coder (image)' },
];

/** RSS / blog kaynakları — URL'leri buradan değiştirebilirsiniz */
export const THREED_RSS_FEEDS: readonly FeedConfig[] = [
  {
    name: 'NVIDIA Blog',
    url: process.env.THREED_FEED_NVIDIA ?? 'https://blogs.nvidia.com/feed/',
    kind: 'official_blog',
    priority: 'normal',
  },
  {
    name: 'Stability AI Blog',
    url: process.env.THREED_FEED_STABILITY ?? 'https://stability.ai/blog/rss.xml',
    kind: 'official_blog',
    priority: 'normal',
  },
  {
    name: 'Blender Nation',
    url: process.env.THREED_FEED_BLENDER ?? 'https://www.blendernation.com/feed/',
    kind: 'media',
    priority: 'normal',
  },
  {
    name: 'Tripo AI Blog',
    url: process.env.THREED_FEED_TRIPO ?? 'https://www.tripo3d.ai/blog/rss.xml',
    kind: 'official_blog',
    priority: 'normal',
  },
  {
    name: 'Meshy Blog',
    url: process.env.THREED_FEED_MESHY ?? 'https://www.meshy.ai/blog/rss.xml',
    kind: 'official_blog',
    priority: 'normal',
  },
];

/** Genel akıştan 3D ile ilgili olabilecek kaynaklar (balanced paket) */
export const THREED_SHARED_FEED_NAMES: readonly string[] = [
  'Hugging Face Blog',
  'TechCrunch AI',
  'The Verge AI',
];

export const THREED_ARXIV_CATEGORIES: readonly string[] = ['cs.GR', 'cs.CV'];

export const THREED_ARXIV_PREFIX = 'arXiv 3D';

/** Aylık tahmini harcama güvenlik tavanı (USD) — LLM maliyeti */
export const THREED_MONTHLY_BUDGET_USD = parseFloat(process.env.THREED_MONTHLY_BUDGET_USD ?? '2');

/** Hedef aralık üst sınırı (uyarı için, USD) */
export const THREED_MONTHLY_TARGET_USD = parseFloat(process.env.THREED_MONTHLY_TARGET_USD ?? '1.5');

/** Token → USD tahmini (OpenRouter / DeepSeek yaklaşık; .env ile ayarlanabilir) */
export const THREED_COST_PER_1M_PROMPT = parseFloat(process.env.THREED_COST_PER_1M_PROMPT ?? '0.14');
export const THREED_COST_PER_1M_COMPLETION = parseFloat(
  process.env.THREED_COST_PER_1M_COMPLETION ?? '0.28',
);

