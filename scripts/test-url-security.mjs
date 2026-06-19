#!/usr/bin/env node
/** Smoke tests for SSRF URL validation (no external deps). */
import { isSafeHttpUrl } from '../dist/url-security.js';

const cases = [
  { url: 'https://example.com/article', expect: true },
  { url: 'http://news.ycombinator.com/item', expect: true },
  { url: 'file:///etc/passwd', expect: false },
  { url: 'ftp://example.com', expect: false },
  { url: 'http://127.0.0.1/admin', expect: false },
  { url: 'http://localhost:8080', expect: false },
  { url: 'http://169.254.169.254/latest/meta-data/', expect: false },
  { url: 'http://metadata.google.internal/', expect: false },
  { url: 'http://192.168.1.1/', expect: false },
  { url: 'http://10.0.0.1/', expect: false },
  { url: 'http://user:pass@example.com/', expect: false },
  { url: 'not-a-url', expect: false },
];

let failed = 0;
for (const { url, expect } of cases) {
  const got = isSafeHttpUrl(url);
  if (got !== expect) {
    console.error(`FAIL ${url}: expected ${expect}, got ${got}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}

console.log(`OK: ${cases.length} URL security checks passed`);
