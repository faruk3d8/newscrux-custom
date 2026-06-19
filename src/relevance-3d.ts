// src/relevance-3d.ts — 3D mesh / CAD / NeRF / Gaussian splatting ilgililik filtresi

import { OpenRouter } from '@openrouter/sdk';
import { config } from './config.js';
import { createLogger } from './logger.js';
import type { QueueEntry } from './types.js';
import { extractChatUsage, recordTokenUsage } from './token-usage.js';
import { THREED_RELEVANCE_THRESHOLD } from './threed.config.js';
import type { RelevanceResult } from './relevance.js';

const log = createLogger('relevance-3d');

const openrouter = new OpenRouter({
  apiKey: config.openrouterApiKey,
});

const RELEVANCE_3D_PROMPT = `Sen bir 3D AI / mesh / CAD haber filtresisin.
Sana makale başlıkları ve açıklamaları verilecek.
Her makale için 1-10 arası bir "ilgililik puanı" ver.

Yüksek puan (7-10) ver:
- 3D mesh / shape / scene generation (text-to-3D, image-to-3D)
- NeRF, Gaussian splatting, radiance fields, point clouds
- CAD / CadQuery / text-to-CAD / image-to-CAD
- 3D reconstruction, digital twins, volumetric rendering
- NVIDIA Omniverse, RTX, neural rendering, mesh tools
- Açık kaynak 3D modeller (TRELLIS, Hunyuan3D, TripoSR/SG, CAD-Coder vb.)
- Blender / DCC pipeline ile AI entegrasyonu

Düşük puan (1-4) ver:
- Saf 2D görüntü sınıflandırma, genel LLM, finans, politika
- AI ile ilgili ama 3D/mesh/CAD ile doğrudan ilgisiz haberler
- Genel oyun/industry haberi (3D AI yoksa)

Orta puan (5-6): 3D ile zayıf veya dolaylı bağlantı.

Yanıtını SADECE şu JSON formatında ver, başka metin ekleme:
[{"id": 0, "score": 8}, {"id": 1, "score": 3}, ...]

id = makalenin sıra numarası (0'dan başlar), score = 1-10 arası puan.`;

const MAX_RETRIES = 2;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function filterThreeDByRelevance(
  entries: QueueEntry[],
  thresholdOverride?: number,
): Promise<RelevanceResult> {
  const bypassed: QueueEntry[] = [];
  const toScore: QueueEntry[] = [];

  for (const entry of entries) {
    if (entry.feedPriority === 'high') {
      bypassed.push(entry);
    } else {
      toScore.push(entry);
    }
  }

  if (bypassed.length > 0) {
    log.info(`3D relevance bypass: ${bypassed.length} high-priority entries`);
  }

  if (toScore.length === 0) {
    return { passed: [], dropped: [], bypassed, parseError: false };
  }

  const list = toScore
    .map((e, i) => `${i}. [${e.feedName}] ${e.title}\n   ${e.snippet.trim()}`)
    .join('\n');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await openrouter.chat.send({
        model: config.openrouterModel,
        messages: [
          { role: 'system', content: RELEVANCE_3D_PROMPT },
          { role: 'user', content: list },
        ],
      });

      const usage = extractChatUsage(result);
      if (usage) {
        recordTokenUsage('relevance', config.openrouterModel, usage, {
          layer: '3d',
          batchSize: toScore.length,
        });
      }

      const rawContent = result.choices?.[0]?.message?.content;
      let text: string;
      if (typeof rawContent === 'string') {
        text = rawContent;
      } else if (Array.isArray(rawContent)) {
        text = rawContent
          .filter((item): item is { type: 'text'; text: string } => item.type === 'text')
          .map((item) => item.text)
          .join('');
      } else {
        text = '';
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        log.warn('No JSON array in 3D relevance response');
        if (attempt < MAX_RETRIES) {
          await delay(Math.pow(2, attempt + 1) * 1000);
          continue;
        }
        return { passed: [], dropped: [], bypassed, parseError: true };
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{ id: number; score: number }>;
      const scores = new Map<number, number>();
      for (const entry of parsed) {
        if (typeof entry.id === 'number' && typeof entry.score === 'number') {
          scores.set(entry.id, entry.score);
        }
      }

      const threshold = thresholdOverride ?? THREED_RELEVANCE_THRESHOLD;
      const passed: QueueEntry[] = [];
      const dropped: Array<{ entry: QueueEntry; score: number }> = [];

      for (let i = 0; i < toScore.length; i++) {
        const score = scores.get(i);
        if (score === undefined) {
          passed.push(toScore[i]);
        } else if (score >= threshold) {
          passed.push(toScore[i]);
        } else {
          dropped.push({ entry: toScore[i], score });
        }
      }

      if (dropped.length > 0) {
        log.info(
          `3D relevance dropped ${dropped.length}: ${dropped.map((d) => `"${d.entry.title}" (${d.score}/${threshold})`).join(', ')}`,
        );
      }
      log.info(`3D relevance: ${passed.length}/${toScore.length} passed (threshold ${threshold})`);

      return { passed, dropped, bypassed, parseError: false };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt + 1) * 1000;
        log.warn(`3D relevance attempt ${attempt + 1} failed, retrying in ${backoffMs}ms: ${err}`);
        await delay(backoffMs);
      } else {
        log.error('3D relevance failed after retries', err);
        return { passed: [], dropped: [], bypassed, parseError: true };
      }
    }
  }

  return { passed: [], dropped: [], bypassed, parseError: true };
}
