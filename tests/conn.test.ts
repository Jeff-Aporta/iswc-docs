/**
 * conn.test.ts — documento único: quemado en `conn.spec` o GET `paths.docs`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { encodeConnParam } from '../dist/cdn/js/conn.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sample = JSON.parse(readFileSync(join(root, 'tests/fixtures/insoft-config.sample.json'), 'utf8'));

const buildUrl = (conn) => `http://localhost:4190/index.html?conn=${encodeConnParam(conn)}`;

const mountDom = (url) => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url, pretendToBeVisual: true });
  for (const k of ['window', 'document', 'HTMLElement', 'customElements', 'CustomEvent', 'Node', 'Event', 'URL', 'URLSearchParams']) {
    globalThis[k] = dom.window[k];
  }
  globalThis.location = dom.window.location;
  return dom;
};

test('si llega doc, conn se ignora por completo', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost:8802/api/docs',
    pretendToBeVisual: true,
  });
  for (const k of ['window', 'document', 'URL', 'URLSearchParams']) globalThis[k] = dom.window[k];
  globalThis.location = dom.window.location;

  let fetches = 0;
  globalThis.fetch = async () => { fetches += 1; throw new Error('no fetch'); };

  const { resolveBootConfig, loadViewerDocument } = await import('../dist/cdn/js/config.js?bust=' + Math.random());
  const boot = resolveBootConfig(
    {
      apiBase: 'https://evil.example/api',
      title: 'Del Conn',
      paths: { docs: '/system/swagger/config.json' },
    },
    sample,
  );
  assert.equal(boot.brand?.title, undefined, 'brand del conn no debe colarse');
  assert.notEqual(boot.apiBase, 'https://evil.example/api');
  assert.equal(boot.specUrl, undefined);
  await loadViewerDocument(boot);
  assert.equal(fetches, 0);
});

test('atributo doc= materializa sin fetch ni conn', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost:8802/api/docs',
    pretendToBeVisual: true,
  });
  for (const k of ['window', 'document', 'URL', 'URLSearchParams']) globalThis[k] = dom.window[k];
  globalThis.location = dom.window.location;

  let fetches = 0;
  globalThis.fetch = async () => { fetches += 1; throw new Error('no fetch'); };

  const { resolveBootConfig, loadViewerDocument } = await import('../dist/cdn/js/config.js?bust=' + Math.random());
  const boot = resolveBootConfig(null, sample);
  assert.equal(boot.specUrl, undefined);
  assert.equal(boot.apiBase, 'http://localhost:8802/api');
  assert.equal(boot.serverSelect, false);
  const { spec } = await loadViewerDocument(boot);
  assert.equal(fetches, 0);
  assert.ok(Object.keys(spec.paths ?? {}).length > 0);
});

test('?conn= con spec quemado no hace fetch', async () => {
  mountDom(buildUrl({
    apiBase: 'https://h/api',
    fixedServer: true,
    title: 'ISS PatyIA',
    spec: sample,
  }));
  let fetches = 0;
  globalThis.fetch = async () => { fetches += 1; throw new Error('no fetch'); };

  const { resolveBootConfig, loadViewerDocument } = await import('../dist/cdn/js/config.js?bust=' + Math.random());
  const boot = resolveBootConfig();
  assert.equal(boot.specUrl, undefined);
  const { spec } = await loadViewerDocument(boot);
  assert.equal(fetches, 0);
  assert.ok(Object.keys(spec.paths ?? {}).length > 0);
});

test('sin spec quemado cae a default /docs?v=json', async () => {
  mountDom(buildUrl({ apiBase: 'https://h/api', title: 'Sin spec' }));
  let fetched = '';
  globalThis.fetch = async (req: string) => {
    fetched = String(req);
    return new Response(JSON.stringify(sample), { status: 200 });
  };

  const { resolveBootConfig, loadViewerDocument } = await import('../dist/cdn/js/config.js?bust=' + Math.random());
  const cfg = resolveBootConfig();
  assert.equal(cfg.specUrl, 'https://h/api/docs?v=json');
  await loadViewerDocument(cfg);
  assert.equal(fetched, 'https://h/api/docs?v=json');
});

test('paths.docs personalizado se respeta', async () => {
  mountDom(buildUrl({
    apiBase: 'https://h/api',
    paths: { docs: '/mi/doc.json' },
  }));
  let fetched = '';
  globalThis.fetch = async (req: string) => {
    fetched = String(req);
    return new Response(JSON.stringify({ openapi: '3.0.3', paths: {} }), { status: 200 });
  };

  const cfgMod = await import('../dist/cdn/js/config.js?bust=' + Math.random());
  await cfgMod.loadViewerDocument(cfgMod.resolveBootConfig());
  assert.equal(fetched, 'https://h/api/mi/doc.json');
});

test('paths.docs vacío desactiva el fetch (hace falta spec)', async () => {
  mountDom(buildUrl({
    apiBase: 'https://h/api',
    paths: { docs: '' },
  }));
  const { resolveBootConfig, loadViewerDocument } = await import('../dist/cdn/js/config.js?bust=' + Math.random());
  const cfg = resolveBootConfig();
  assert.equal(cfg.specUrl, undefined);
  await assert.rejects(() => loadViewerDocument(cfg), /conn\.spec|paths\.docs|\/docs\?v=json/);
});

test('spec quemado gana sobre specUrl del script (no pide config.json legacy)', async () => {
  const url = buildUrl({ apiBase: 'https://h/api', title: 'Del Conn', spec: sample });
  const dom = new JSDOM(
    `<!doctype html><html><head>
       <script type="application/json" id="docs-config">${JSON.stringify({
         specUrl: 'https://evil.example/system/swagger/config.json',
         brand: { title: 'Del Script' },
       })}</script>
     </head><body></body></html>`,
    { url, pretendToBeVisual: true },
  );
  for (const k of ['window', 'document', 'HTMLElement', 'URL', 'URLSearchParams']) globalThis[k] = dom.window[k];
  globalThis.location = dom.window.location;

  let fetched = '';
  globalThis.fetch = async (req: string) => { fetched = String(req); return new Response('{}', { status: 404 }); };

  const cfgMod = await import('../dist/cdn/js/config.js?bust=' + Math.random());
  const cfg = cfgMod.resolveBootConfig();
  assert.equal(cfg.brand.title, 'Del Conn');
  assert.equal(cfg.specUrl, undefined);
  await cfgMod.loadViewerDocument(cfg);
  assert.equal(fetched, '');
});
