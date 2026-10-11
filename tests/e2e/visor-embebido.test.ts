/**
 * visor-embebido.test.ts — e2e en Chrome real (Stagehand `localBrowser`): un host quema el
 * documento InSoft en la página y el visor lo pinta.
 *
 * QUÉ se prueba (caja negra): la página que un host como el ISS sirve en `GET /api/docs` —kit por
 * CDN, `dist/cdn` del visor, `<docs-viewer>` y el JSON en `<script type="application/json"
 * id="docs-doc">` pasado por la propiedad `.doc`— muestra el título del documento y sus
 * operaciones, sin pedir nada a la red para el documento.
 *
 * Requiere Chrome local y red hacia jsDelivr (el kit). No usa LLM: las comprobaciones son de DOM.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { localBrowser, Stagehand } from '@browserbasehq/stagehand';

const ROOT = join(import.meta.dirname!, '..', '..');
const DOC = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'insoft-config.sample.json'), 'utf8'));
const KIT = readFileSync(join(ROOT, 'index.html'), 'utf8').match(/https:\/\/cdn\.jsdelivr\.net\/gh\/Jeff-Aporta\/is-webcomponents@[0-9a-f]{40}\/dist\/cdn/)![0];

/** La misma plantilla que debe servir un host (contrato `src/cdn/LLM.md`), con el visor local. */
function paginaHost(docs: string, doc: unknown): string {
  const json = JSON.stringify(doc).replace(/</g, '\\u003c').replaceAll(String.fromCharCode(0x2028), '\\u2028').replaceAll(String.fromCharCode(0x2029), '\\u2029');
  return `<!doctype html>
<html lang="es" data-theme="dark" data-palette="contapyme">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ISS PatyIA · Documentación API</title>
<script type="module">
  const { ISWebComponentsLoader: L } = await import('${KIT}/core/loader.min.js');
  const { DOCS_KIT_TAGS } = await import('${docs}/js/kit-tags.js');
  await L.loadCSSBase(); await L.loadCSSPalettesDefault();
  await L.load(...DOCS_KIT_TAGS);
</script>
<script src="${docs}/boot.js"></script>
<script src="${docs}/hojas.js"></script>
<link rel="stylesheet" href="${docs}/styles/app.css">
</head>
<body>
  <docs-viewer></docs-viewer>
  <iswc-toast placement="bottom-end"></iswc-toast>
  <script type="application/json" id="docs-doc">${json}</script>
  <script type="module" src="${docs}/all.min.js"></script>
  <script type="module">
    document.querySelector('docs-viewer').doc = JSON.parse(document.getElementById('docs-doc').textContent);
  </script>
</body></html>`;
}

const TIPOS: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html' };
const pedidosDoc: string[] = [];
// La página vive en /api/docs, como en el ISS; el resto se sirve desde la raíz del repo.
const servidor = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen: () => {} }, (req) => {
  const { pathname } = new URL(req.url);
  if (pathname === '/api/docs') return new Response(paginaHost('/dist/cdn', DOC), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  if (pathname.startsWith('/api/')) pedidosDoc.push(pathname);
  try {
    const cuerpo = readFileSync(join(ROOT, decodeURIComponent(pathname)));
    return new Response(cuerpo, { headers: { 'content-type': TIPOS[extname(pathname)] ?? 'application/octet-stream' } });
  } catch {
    return new Response('no encontrado', { status: 404 });
  }
});
const BASE = `http://127.0.0.1:${servidor.addr.port}`;

/** Texto visible atravesando shadow roots (el visor es todo web components). */
const TEXTO_PROFUNDO = `(() => {
  const partes = [];
  const recorrer = (n) => {
    if (n.nodeType === 3) partes.push(n.textContent);
    if (n.shadowRoot) recorrer(n.shadowRoot);
    for (const h of n.childNodes ?? []) if (h.nodeName !== 'SCRIPT' && h.nodeName !== 'STYLE') recorrer(h);
  };
  recorrer(document.body);
  return partes.join(' ').replace(/\\s+/g, ' ');
})()`;

test('el visor embebido pinta el documento quemado por el host', { timeout: 120_000 }, async () => {
  const browser = await localBrowser.launch({ headless: true });
  // Stagehand adjunta el contexto del navegador; sin `model`: aquí no hace falta LLM.
  const stagehand = await Stagehand.create({ browser });
  try {
    const [page] = await browser.context.pages();
    await page!.goto(`${BASE}/api/docs`);
    let texto = '';
    for (let i = 0; i < 60; i++) {
      texto = String(await page!.evaluate(TEXTO_PROFUNDO));
      if (texto.includes('Ver la configuración del sistema')) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.match(texto, /API PatyIA|ISS PatyIA/, 'falta el título del documento');
    assert.match(texto, /Ver la configuración del sistema/, 'no se pintó la operación GET /sistema/cfg');
    assert.match(texto, /Enviar un turno \(SSE\)/, 'no se pintó la operación POST /conversacion');
    assert.doesNotMatch(texto, /no es documento InSoft|no es válido/, 'el visor rechazó el documento');
    assert.deepEqual(pedidosDoc, [], 'con documento quemado el visor no debe pedirlo a la red');
  } finally {
    await stagehand.close?.().catch(() => {});
    await browser.close();
    await servidor.shutdown();
  }
});
