/**
 * app.test.ts — el ciclo completo del shell, con la spec de demo real.
 *
 * `docs-app` es el único dueño del estado, así que este es el test que dice si
 * el visor «funciona»: leer config → cargar spec → agrupar → pintar. Se usa
 * `demo/openapi.sample.json` tal cual, no un fixture aparte: dos documentos
 * que deberían ejercitar lo mismo se separan sin que nada avise.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const spec = JSON.parse(readFileSync(join(ROOT, 'demo', 'openapi.sample.json'), 'utf8'));

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

for (const k of ['window', 'document', 'HTMLElement', 'customElements', 'CustomEvent', 'Node', 'Event', 'Blob', 'URL', 'URLSearchParams']) {
  globalThis[k] = dom.window[k];
}
globalThis.location = dom.window.location;
globalThis.history = dom.window.history;
globalThis.performance = dom.window.performance;
globalThis.sessionStorage = dom.window.sessionStorage;
globalThis.localStorage = dom.window.localStorage;

// La spec se sirve desde memoria: el test no depende de que haya un servidor.
globalThis.fetch = async (url: string) => {
  if (String(url).includes('openapi.sample.json')) {
    return new Response(JSON.stringify(spec), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('{}', { status: 404 });
};

// `docs-app` lee la config del <script id="docs-config">, igual que en index.html.
const cfg = dom.window.document.createElement('script');
cfg.type = 'application/json';
cfg.id = 'docs-config';
cfg.textContent = JSON.stringify({
  ns: 'ISA',
  specUrl: '/demo/openapi.sample.json',
  brand: { title: 'ISWC Docs', icon: 'mdi:api' },
  auth: { enabled: false },
  nav: [
    { id: 'todo', label: 'Todo' },
    { id: 'terceros', label: 'Terceros', tags: ['Terceros'] },
    { id: 'sistema', label: 'Sistema', tags: ['Sistema'] },
  ],
});
dom.window.document.head.append(cfg);

await import('../dist/cdn/all.min.js');

const app = dom.window.document.createElement('docs-app');
dom.window.document.body.append(app);
// La carga es asíncrona: un tick basta porque el fetch resuelve en memoria.
await new Promise((r) => setTimeout(r, 30));

// `docs-app` abre su shadow en el constructor: si no estuviera, el componente
// no habria arrancado y el test debe romper aqui, no en cada assert.
const root = app.shadowRoot!;
const $ = (sel: string) => root.querySelector<HTMLElement>(sel);

test('el shell termina de cargar y pinta el visor', () => {
  assert.equal($('.cargando'), null, 'se quedó en «cargando»');
  assert.equal($('.fallo-texto')?.textContent ?? null, null, 'falló la carga');
  assert.ok($('docs-nav'), 'no montó la barra superior');
  assert.ok($('docs-info'), 'no montó la cabecera');
  assert.ok($('docs-server'), 'no montó el selector de servidor');
});

test('agrupa las operaciones de la spec de demo', () => {
  const grupos = root.querySelectorAll<HTMLElement>('docs-tag-group');
  assert.equal(grupos.length, 2, 'se esperaban los tags Terceros y Sistema');
  // 5 en Terceros + 2 en Sistema.
  assert.match($('.resumen-total').textContent, /^7 operaciones$/);
});

test('respeta el orden de spec.tags, no el de paths', () => {
  const nombres = [...root.querySelectorAll<HTMLElement>('docs-tag-group')].map((g) =>
    g.shadowRoot!.querySelector<HTMLElement>('.titulo').textContent.trim().split(/\s+/)[0],
  );
  assert.deepEqual(nombres, ['Terceros', 'Sistema']);
});

test('los subgrupos del tag ordenan operaciones sin pintar divisores', () => {
  const terceros = root.querySelector<HTMLElement>('docs-tag-group').shadowRoot;
  assert.equal(terceros.querySelectorAll<HTMLElement>('.subgrupo').length, 0, 'no debe haber divisores de entidad');
  const ids = [...terceros.querySelectorAll<HTMLElement>('docs-operation')].map((o) => o.props.op.operationId);
  assert.deepEqual(ids, [
    'listarTerceros',
    'obtenerTercero',
    'crearTercero',
    'actualizarTercero',
    'eliminarTercero',
  ]);
});

test('la base del servidor sale del primer `servers` de la spec', () => {
  const srv = $('docs-server').shadowRoot;
  assert.equal(srv.querySelector<HTMLElement>('iswc-input').getAttribute('value'), 'https://httpbin.org');
  // Ambos servidores del documento entran en el menú de conocidos.
  assert.ok(srv.querySelector<HTMLElement>('iswc-dropdown'), 'con dos servidores debe haber menú');
});

test('la operación obsoleta se marca y la protegida lleva candado', () => {
  const ops = [...root.querySelectorAll<HTMLElement>('docs-tag-group')]
    .flatMap((g) => [...g.shadowRoot!.querySelectorAll<HTMLElement>('docs-operation')])
    .map((o) => o.shadowRoot);

  assert.ok(ops.some((o) => o.querySelector<HTMLElement>('.obsoleta')), 'ninguna marcada como obsoleta');
  // `auth.enabled` es false en esta config, así que no debe haber candados:
  // el candado promete un login que la app no ofrece.
  assert.equal(ops.filter((o) => o.querySelector<HTMLElement>('.candado')).length, 0);
});

test('la búsqueda filtra y actualiza el contador', () => {
  const nav = $('docs-nav');
  nav.dispatchEvent(new dom.window.CustomEvent('docs-search', { detail: { query: 'ping' }, bubbles: true }));
  assert.match($('.resumen-total').textContent, /^1 operación$/);

  nav.dispatchEvent(new dom.window.CustomEvent('docs-search', { detail: { query: 'zzz-no-existe' }, bubbles: true }));
  assert.equal(root.querySelectorAll<HTMLElement>('docs-tag-group').length, 0);
  assert.ok($('iswc-callout'), 'sin resultados debe salir el estado vacío');

  nav.dispatchEvent(new dom.window.CustomEvent('docs-search', { detail: { query: '' }, bubbles: true }));
  assert.match($('.resumen-total').textContent, /^7 operaciones$/);
});

test('cambiar de sección filtra por los tags de la pestaña', () => {
  const nav = $('docs-nav');
  nav.dispatchEvent(new dom.window.CustomEvent('docs-nav-tab', { detail: { tab: 'sistema' }, bubbles: true }));
  assert.equal(root.querySelectorAll<HTMLElement>('docs-tag-group').length, 1);
  assert.match($('.resumen-total').textContent, /^2 operaciones$/);

  nav.dispatchEvent(new dom.window.CustomEvent('docs-nav-tab', { detail: { tab: 'todo' }, bubbles: true }));
  assert.equal(root.querySelectorAll<HTMLElement>('docs-tag-group').length, 2);
});

test('abrir una operación la escribe en la URL y monta su cuerpo', () => {
  const grupo = root.querySelector<HTMLElement>('docs-tag-group')!;
  const op = grupo.shadowRoot!.querySelector<HTMLElement>('docs-operation');
  const id = op.props.op.operationId;

  op.dispatchEvent(
    new dom.window.CustomEvent('docs-op-toggle', { detail: { operationId: id, abierto: true }, bubbles: true }),
  );

  const sp = new dom.window.URLSearchParams(dom.window.location.search);
  assert.equal(sp.get('op'), null, 'no debe quedar `?op=` plano');
  const raw = sp.get('s');
  assert.ok(raw, 'debe escribir `?s=`');
  const dec = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  assert.equal(dec.op, id);
  const abierta = grupo.shadowRoot!.querySelector<HTMLElement>('docs-operation');
  assert.ok(abierta.shadowRoot!.querySelector<HTMLElement>('.cuerpo'), 'no montó el cuerpo al abrir');
  assert.ok(abierta.shadowRoot!.querySelector<HTMLElement>('docs-try'), 'la pestaña por defecto debe ser Probar');
});

test('index.html referencia solo assets que el build produce', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const generados = new Set(readdirSync(join(ROOT, 'dist', 'cdn')));
  for (const m of html.matchAll(/\.\/dist\/cdn\/([\w.-]+)/g)) {
    assert.ok(generados.has(m[1]), `index.html pide dist/cdn/${m[1]}, que el build no genera`);
  }
});

test('index.html carga el kit vía DOCS_KIT_TAGS (kit-tags.js)', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /DOCS_KIT_TAGS/, 'index.html debe usar DOCS_KIT_TAGS del CDN');
  assert.match(html, /kit-tags\.js/, 'index.html debe importar dist/cdn/js/kit-tags.js');
  const kit = readFileSync(join(ROOT, 'src', 'js', 'kit-tags.ts'), 'utf8');
  for (const tag of ['iswc-code', 'iswc-md-render', 'iswc-flowchart', 'iswc-sequence-diagram', 'iswc-er-diagram', 'iswc-diagram-lightbox']) {
    assert.match(kit, new RegExp(`['"]${tag}['"]`), `falta ${tag} en src/js/kit-tags.ts`);
  }
  assert.ok(
    existsSync(join(ROOT, 'dist', 'cdn', 'js', 'kit-tags.js')),
    'el build debe emitir dist/cdn/js/kit-tags.js',
  );
});
