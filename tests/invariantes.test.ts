/**
 * invariantes.test.ts — regresiones puntuales de errores ya vistos.
 *
 * Cada test cazó un bug real en algún visor anterior o en este remake. Si
 * vuelve a aparecer, falla antes de que llegue al navegador. Lo que no se
 * rompió nunca no se testea aquí; vive en `estructura.test.ts`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST = join(ROOT, 'dist', 'cdn');

/* ── OpenAPI no debe filtrarse a la UI ──────────────────────── */

const textoUsuario = (archivo) => readFileSync(join(ROOT, archivo), 'utf8');

test('index.html no menciona OpenAPI en el título ni en la descripción', () => {
  const html = textoUsuario('index.html');
  const head = html.split('</head>')[0];
  assert.ok(!/OpenAPI/i.test(head), '`<head>` debe estar libre de OpenAPI');
});

test('el sitio documental no llama «OpenAPI» a la herramienta', () => {
  // Se admite la palabra dentro de specs sintéticas (`openapi: '3.0.3'` en las
  // props de un caso) y al hablar del formato como formato. Lo que NO se admite
  // es usarla como nombre del visor.
  for (const sub of ['previews', 'paginas']) {
    for (const f of readdirSync(join(ROOT, 'docs', sub))) {
      const src = textoUsuario(`docs/${sub}/${f}`);
      assert.ok(
        !/\bVisor OpenAPI\b/i.test(src),
        `docs/${sub}/${f} sigue llamando «Visor OpenAPI» al visor`,
      );
    }
  }
});

test('el shell de docs no se anuncia como visor de OpenAPI', () => {
  const head = textoUsuario('docs/index.html').split('</head>')[0];
  assert.ok(!/OpenAPI/i.test(head), 'el `<head>` de docs debe estar libre de OpenAPI');
});

test('la spec del InSoft no expone `openapi:` en el spec sintetizado', async () => {
  const { parseInsoftConfig } = await import('../dist/cdn/js/insoft-config.js');
  const fixture = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'insoft-config.sample.json'), 'utf8'));
  const { spec } = parseInsoftConfig(fixture, 'https://h/api');
  assert.equal(spec.openapi, undefined, 'el spec interno del visor no lleva campo openapi');
});

/* ── CSS adoptado: clave contra el flicker ──────────────────── */

const manuales = () =>
  readdirSync(join(ROOT, 'src', 'components', 'docs'))
    .filter((f) => f.endsWith('.ts') && f !== '_shared.ts' && f !== 'all.ts')
    .filter((f) => !/crearComponente</.test(textoUsuario(`src/components/docs/${f}`)));

test('adoptCss aplica hojas construidas cacheadas, no un <link> por shadow', () => {
  // El flicker al cambiar de sección venía de que un `<link>` dentro de un
  // ShadowRoot no bloquea el pintado de ese shadow: cada uno de los decenas de
  // shadow roots que se recrean se pintaba sin estilos durante un frame.
  // `adoptedStyleSheets` con una hoja ya construida se aplica síncrono y
  // sobrevive a `replaceChildren()`. Si esto se revierte, el flicker vuelve.
  const src = textoUsuario('src/components/docs/_shared.ts');
  assert.match(src, /adoptedStyleSheets/, '_shared.ts ya no adopta hojas construidas');
  assert.match(src, /Map<string, CSSStyleSheet>/, 'falta el caché de hojas por href');
  assert.match(src, /new CSSStyleSheet\(\)[\s\S]{0,200}replaceSync/, 'la hoja no se construye desde el texto del .css');
});

test('ningún componente fabrica su propio <link rel="stylesheet">', () => {
  // El único `<link>` lo pone `adoptCss` como respaldo. Un componente que se
  // enlace la hoja a mano se salta el caché y vuelve a parpadear al repintar.
  const offenders = readdirSync(join(ROOT, 'src', 'components', 'docs'))
    .filter((f) => f.endsWith('.ts') && f !== '_shared.ts')
    .filter((f) => /rel\s*=\s*['"]stylesheet['"]/.test(textoUsuario(`src/components/docs/${f}`)));
  assert.deepEqual(offenders, [], `componentes que enlazan CSS a mano: ${offenders.join(', ')}`);
});

test('cada render manual adopta y precarga su hoja, y la nombra', () => {
  // Los componentes de `crearComponente` heredan ambas cosas de la fábrica.
  // Los que escriben su propio `#render()` tienen que pedirlas: `adoptCss`
  // para tener estilos, `precargarCss` para que el primer montaje tampoco
  // parpadee esperando la descarga.
  //
  // El tercer argumento (el nombre de la hoja) **no es opcional en la
  // práctica**: sin él, dentro de `sw.all.js` todos los módulos comparten
  // `import.meta.url` y la hoja derivada es `sw.all.css`, que no existe. El
  // componente se pinta sin estilos y nada falla.
  // Comparación literal a propósito: una regex armada con template literal se
  // come los `\s` (en un template, `\s` es `s`) y el guardián pasa siempre.
  const sinAdopcion = manuales().filter((f) => {
    const tag = f.replace(/\.ts$/, '');
    return !textoUsuario(`src/components/docs/${f}`)
      .includes(`adoptCss(this.#root, import.meta.url, '${tag}')`);
  });
  assert.deepEqual(sinAdopcion, [], `renders manuales sin adoptCss nombrado: ${sinAdopcion.join(', ')}`);

  const sinPrecarga = manuales().filter((f) => {
    const tag = f.replace(/\.ts$/, '');
    return !textoUsuario(`src/components/docs/${f}`)
      .includes(`precargarCss(import.meta.url, '${tag}')`);
  });
  assert.deepEqual(sinPrecarga, [], `renders manuales sin precargarCss nombrado: ${sinPrecarga.join(', ')}`);
});

/* ── ?conn= con spec quemado anula el specUrl del <script> ────── */

test('resolveBootConfig con conn.spec no hereda specUrl del script ni inventa config.json', async () => {
  const { JSDOM } = await import('jsdom');
  const { readFileSync } = await import('node:fs');
  const sample = JSON.parse(readFileSync(new URL('./fixtures/insoft-config.sample.json', import.meta.url), 'utf8'));
  const conn = Buffer.from(JSON.stringify({ apiBase: 'https://x/api', spec: sample })).toString('base64url');
  const dom = new JSDOM(
    `<!doctype html><html><head>
       <script type="application/json" id="docs-config">${JSON.stringify({
         specUrl: './demo/old.json',
       })}</script>
     </head><body></body></html>`,
    { url: `http://h/?conn=${conn}` },
  );
  for (const k of ['window', 'document', 'URL', 'URLSearchParams']) globalThis[k] = dom.window[k];
  globalThis.location = dom.window.location;
  const { resolveBootConfig } = await import('../dist/cdn/js/config.js');
  const cfg = resolveBootConfig();
  assert.equal(cfg.specUrl, undefined, 'spec quemado: sin specUrl ni config.json');
  assert.equal(cfg.apiBase, 'https://x/api');
  assert.equal(cfg.spec?.kind, 'config');
});

/* ── La búsqueda debe ser cross-tab ──────────────────────────── */

test('filterGroupsByQuery no exige tab activa cuando hay query', async () => {
  const { filterGroupsByQuery } = await import('../dist/cdn/js/nav.js');
  const grupos = [
    {
      name: 'Terceros',
      description: '',
      meta: {},
      subgroups: [],
      operations: [{ path: '/tercero', method: 'get', operationId: 'listar', summary: 'Listar' }],
    },
  ];
  assert.equal(filterGroupsByQuery(grupos, 'tercero').length, 1);
});

/* ── Insoft: el visor no debe quedarse sin auth por defecto ──── */

test('parseInsoftConfig fija loginUrl por defecto para que auth no quede off', async () => {
  const { parseInsoftConfig } = await import('../dist/cdn/js/insoft-config.js');
  const fixture = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'insoft-config.sample.json'), 'utf8'));
  const { config } = parseInsoftConfig(fixture, 'https://h/api');
  assert.ok(typeof config.auth?.loginUrl === 'string' && config.auth.loginUrl.length > 0);
  assert.equal(config.auth.enabled, true);
});

/* ── default spec apunta a API pública, no a un demo local ───── */

test('index.html no apunta a un demo local como specUrl por defecto', () => {
  const html = textoUsuario('index.html');
  const m = html.match(/"specUrl"\s*:\s*"([^"]+)"/);
  assert.ok(m, 'specUrl debe estar en el <script id="docs-config">');
  const url = m[1];
  assert.ok(
    /^https?:\/\//.test(url),
    `specUrl por defecto debe ser absoluto y público, no local: ${url}`,
  );
});

/* ── Dist artifacts coinciden con el inventario de componentes ─ */

test('dist/cdn contiene exactamente un .js + un .css por cada componente', () => {
  const srcComponents = readdirSync(join(ROOT, 'src', 'components', 'docs'))
    .filter((f) => f.endsWith('.ts') && f !== '_shared.ts' && f !== 'all.ts')
    .map((f) => f.replace(/\.ts$/, ''));
  const dist = new Set(readdirSync(join(DIST, 'components', 'docs')));
  for (const c of srcComponents) {
    assert.ok(dist.has(`${c}.js`), `falta dist/cdn/components/docs/${c}.js`);
    assert.ok(dist.has(`${c}.css`), `falta dist/cdn/components/docs/${c}.css`);
  }
});