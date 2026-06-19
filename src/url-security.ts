// src/url-security.ts — SSRF protection for outbound HTTP fetches

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata.google',
]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === '::1') return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  return false;
}

/** Returns true when URL is safe to fetch (http/https, no private/local targets). */
export function isSafeHttpUrl(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  if (url.username || url.password) {
    return false;
  }

  const host = url.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');

  if (BLOCKED_HOSTNAMES.has(host)) {
    return false;
  }

  if (host.endsWith('.local') || host.endsWith('.internal')) {
    return false;
  }

  if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
    return false;
  }

  return true;
}

const MAX_REDIRECTS = 5;

/** Fetch with manual redirect handling — blocks redirects to private/local hosts (SSRF). */
export async function safeHttpFetch(
  urlString: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!isSafeHttpUrl(urlString)) {
    throw new Error('Unsafe URL blocked');
  }

  let current = urlString;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current, { ...init, redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return response;
      if (hop >= MAX_REDIRECTS) {
        throw new Error('Too many redirects');
      }
      const next = new URL(location, current).href;
      if (!isSafeHttpUrl(next)) {
        throw new Error('Redirect to unsafe URL blocked');
      }
      current = next;
      continue;
    }

    return response;
  }

  throw new Error('Too many redirects');
}
