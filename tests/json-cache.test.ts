/**
 * json-cache.test.ts — TTL 24 h + fallback a cache caducado si la red falla.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.test/' });
(globalThis as any).window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;

const {
  JSON_CACHE_TTL_MS,
  fetchJsonCached,
  readJsonCache,
  writeJsonCache,
  isJsonCacheFresh,
} = await import('../dist/cdn/js/core/json-cache.js');

const URL = 'https://api.example.test/system/swagger/config.json';
const DAY = JSON_CACHE_TTL_MS;

test('TTL del cache es al menos 24 horas', () => {
  assert.ok(JSON_CACHE_TTL_MS >= 24 * 60 * 60 * 1000);
});

test('entrada fresca se sirve del cache sin llamar a la red', async () => {
  localStorage.clear();
  const now = 1_700_000_000_000;
  writeJsonCache(URL, { ok: true, v: 1 }, now);
  let hits = 0;
  const r = await fetchJsonCached(
    URL,
    async () => {
      hits += 1;
      return { ok: true, v: 99 };
    },
    { now: now + 60_000 },
  );
  assert.equal(hits, 0);
  assert.equal(r.source, 'cache');
  assert.deepEqual(r.data, { ok: true, v: 1 });
  assert.equal(isJsonCacheFresh(readJsonCache(URL), now + 60_000), true);
});

test('tras 24 h pide red y refresca el cache', async () => {
  localStorage.clear();
  const now = 1_700_000_000_000;
  writeJsonCache(URL, { v: 1 }, now);
  let hits = 0;
  const r = await fetchJsonCached(
    URL,
    async () => {
      hits += 1;
      return { v: 2 };
    },
    { now: now + DAY + 1 },
  );
  assert.equal(hits, 1);
  assert.equal(r.source, 'network');
  assert.deepEqual(r.data, { v: 2 });
  assert.deepEqual(readJsonCache(URL)?.data, { v: 2 });
});

test('si la API falla tras caducar, se queda con el cache', async () => {
  localStorage.clear();
  const now = 1_700_000_000_000;
  writeJsonCache(URL, { v: 'stale' }, now);
  const r = await fetchJsonCached(
    URL,
    async () => {
      throw new Error('API caída');
    },
    { now: now + DAY + 1 },
  );
  assert.equal(r.source, 'stale-cache');
  assert.deepEqual(r.data, { v: 'stale' });
});

test('force: true ignora cache fresco y pide red', async () => {
  localStorage.clear();
  const now = 1_700_000_000_000;
  writeJsonCache(URL, { v: 1 }, now);
  let hits = 0;
  const r = await fetchJsonCached(
    URL,
    async () => {
      hits += 1;
      return { v: 2 };
    },
    { now: now + 60_000, force: true },
  );
  assert.equal(hits, 1);
  assert.equal(r.source, 'network');
  assert.deepEqual(r.data, { v: 2 });
});

test('clearJsonCache borra una URL o todo el prefijo', async () => {
  const { clearJsonCache } = await import('../dist/cdn/js/core/json-cache.js');
  localStorage.clear();
  writeJsonCache(URL, { a: 1 }, 1);
  writeJsonCache(`${URL}?b=1`, { b: 1 }, 1);
  clearJsonCache(URL);
  assert.equal(readJsonCache(URL), null);
  assert.ok(readJsonCache(`${URL}?b=1`));
  clearJsonCache();
  assert.equal(readJsonCache(`${URL}?b=1`), null);
});
