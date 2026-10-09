/**
 * render.test.ts — humo de render sobre el build.
 *
 * Monta los componentes en jsdom con los `is-*` **sin registrar** (igual que
 * un navegador antes de que llegue el CDN) y comprueba que el shadow se llena.
 * Caza el fallo más silencioso de este stack: un componente que no hace
 * upgrade o que revienta al pintar deja el tag vacío, sin error en consola.
 *
 * No comprueba estética: para eso está el sitio documental de `docs/`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

for (const k of ['window', 'document', 'HTMLElement', 'customElements', 'CustomEvent', 'Node', 'Event', 'Blob']) {
  globalThis[k] = dom.window[k];
}
globalThis.performance = dom.window.performance;

const {
  DocsMethod: _m,
} = await import('../dist/cdn/components/docs/docs-method.js');
await import('../dist/cdn/components/docs/docs-path.js');
await import('../dist/cdn/components/docs/docs-json.js');
await import('../dist/cdn/components/docs/docs-doc.js');
await import('../dist/cdn/components/docs/docs-params.js');
await import('../dist/cdn/components/docs/docs-responses.js');
await import('../dist/cdn/components/docs/docs-operation.js');
await import('../dist/cdn/components/docs/docs-tag-group.js');
await import('../dist/cdn/components/docs/docs-info.js');

/** Monta un componente con props y devuelve su shadowRoot ya pintado. */
/**
 * Monta un componente en el DOM de jsdom y devuelve su shadow root.
 *
 * El `shadowRoot` no es opcional aqui: todos los `docs-*` lo abren en su
 * constructor, asi que si faltara el componente estaria roto y el test debe
 * fallar en la linea siguiente, no arrastrar un `null` hasta el assert.
 */
function montar(tag: string, props: unknown): ShadowRoot {
  const node = dom.window.document.createElement(tag) as HTMLElement & { props?: unknown };
  dom.window.document.body.append(node);
  node.props = props;
  return node.shadowRoot!;
}

const op = (over = {}) => ({
  path: '/tercero/{id}',
  method: 'get',
  operationId: 'obtener',
  summary: 'Obtener tercero',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
  responses: { 200: { description: 'OK.' }, 404: { description: 'No existe.' } },
  ...over,
});

test('docs-method pinta el verbo en mayúsculas', () => {
  const root = montar('docs-method', { method: 'delete' });
  assert.match(root.textContent, /DELETE/);
});

test('docs-path marca los {parámetros} en un span aparte', () => {
  const root = montar('docs-path', { path: '/tercero/{id}' });
  assert.equal(root.querySelector<HTMLElement>('.param')?.textContent, '{id}');
});

test('docs-json monta is-code sin botón de copiar interno', () => {
  const root = montar('docs-json', { value: '{\n  "a": 1,\n  "b": "x"\n}', lang: 'json' });
  const code = root.querySelector<HTMLElement>('iswc-code')!;
  assert.ok(code, 'falta is-code');
  assert.equal(code.getAttribute('lang'), 'json');
  assert.equal(code.getAttribute('readonly'), '');
  assert.equal(root.querySelector<HTMLElement>('iswc-copy-button'), null);
  assert.equal(code.value ?? code.getAttribute('value'), '{\n  "a": 1,\n  "b": "x"\n}');
});

test('docs-json no ejecuta HTML que venga en el cuerpo', () => {
  const root = montar('docs-json', { value: '<img src=x onerror=alert(1)>', lang: 'plaintext' });
  assert.equal(root.querySelector<HTMLImageElement>('img'), null);
  const code = root.querySelector<HTMLElement>('iswc-code')!;
  assert.equal(code?.value ?? code?.getAttribute('value'), '<img src=x onerror=alert(1)>');
});

test('docs-json acepta lang shell para cURL', () => {
  const curl = 'curl -X PUT \'https://x/api\' \\\n  -H \'Content-Type: application/json\'';
  const root = montar('docs-json', { value: curl, lang: 'shell' });
  assert.equal(root.querySelector<HTMLElement>('iswc-code')?.getAttribute('lang'), 'shell');
});

test('docs-doc monta is-md-render con el markdown', () => {
  const root = montar('docs-doc', { markdown: '# Hola\n\nUn **párrafo**.' });
  const md = root.querySelector<HTMLElement>('iswc-md-render.md')!;
  assert.ok(md);
  assert.ok(md.hasAttribute('readonly'));
  const source = md.querySelector<HTMLElement>('script[type="text/markdown"]')!;
  assert.ok(source);
  assert.equal(source.textContent, '# Hola\n\nUn **párrafo**.');
});

test('docs-params pinta un campo por parámetro y ninguno si la lista está vacía', () => {
  const con = montar('docs-params', {
    params: [
      { name: 'a', in: 'query', schema: { type: 'string' } },
      { name: 'b', in: 'query', schema: { type: 'string', enum: ['x', 'y'] } },
    ],
    values: {},
    titulo: 'Query',
  });
  assert.equal(con.querySelectorAll<HTMLElement>('.fila').length, 2);
  // El enum va a is-select; el resto a is-input.
  assert.ok(con.querySelector<HTMLElement>('iswc-select'));
  assert.ok(con.querySelector<HTMLElement>('iswc-input'));

  const sin = montar('docs-params', { params: [], values: {}, titulo: 'Query' });
  assert.equal(sin.querySelector<HTMLElement>('.bloque'), null);
});

test('docs-params emite docs-param-change al escribir', () => {
  const node = dom.window.document.createElement('docs-params');
  dom.window.document.body.append(node);
  node.props = { params: [{ name: 'a', in: 'query', schema: { type: 'string' } }], values: {}, titulo: '' };

  const visto = [];
  node.addEventListener('docs-param-change', (e) => visto.push(e.detail));

  const input = node.shadowRoot!.querySelector<HTMLElement>('iswc-input');
  input.value = 'hola';
  input.dispatchEvent(new dom.window.Event('iswc-input', { bubbles: true }));

  assert.deepEqual(visto, [{ name: 'a', value: 'hola' }]);
});

test('docs-responses lista un desplegable por código', () => {
  const root = montar('docs-responses', { responses: op().responses });
  assert.equal(root.querySelectorAll<HTMLElement>('.respuesta').length, 2);
  assert.equal(root.querySelector<HTMLElement>('[data-code="404"]')?.getAttribute('data-code'), '404');
});

test('docs-operation cerrada no monta el cuerpo (coste diferido)', () => {
  const root = montar('docs-operation', { op: op(), spec: {}, abierto: false, tab: 'try' });
  assert.ok(root.querySelector<HTMLElement>('docs-method'), 'falta el chip de método');
  assert.equal(root.querySelector<HTMLElement>('.cuerpo'), null, 'el cuerpo no debe existir cerrado');
});

test('docs-operation abierta monta pestañas y contenido', () => {
  const root = montar('docs-operation', { op: op(), spec: {}, abierto: true, tab: 'try' });
  assert.equal(root.querySelectorAll<HTMLElement>('.pestana').length, 3);
  assert.ok(root.querySelector<HTMLElement>('docs-try'), 'la pestaña Probar no montó docs-try');
});

test('docs-operation marca con candado lo que exige JWT', () => {
  const spec = { components: { securitySchemes: { Bearer: { type: 'http', scheme: 'bearer' } } } };
  const conAuth = montar('docs-operation', {
    op: op({ security: [{ Bearer: [] }] }), spec, authEnabled: true, abierto: false, tab: 'try',
  });
  assert.ok(conAuth.querySelector<HTMLElement>('.candado'));

  const sinAuth = montar('docs-operation', { op: op(), spec, authEnabled: true, abierto: false, tab: 'try' });
  assert.equal(sinAuth.querySelector<HTMLElement>('.candado'), null);
});

test('docs-tag-group aplana subgrupos en orden sin divisores', () => {
  const a = op({ operationId: 'a' });
  const b = op({ operationId: 'b', method: 'post' });
  const root = montar('docs-tag-group', {
    spec: {},
    group: {
      name: 'Terceros',
      description: 'Maestro.',
      meta: {},
      operations: [b, a],
      subgroups: [
        { id: 'c', name: 'Consulta', operations: [a] },
        { id: 'm', name: 'Mantenimiento', operations: [b] },
      ],
    },
  });
  assert.equal(root.querySelectorAll<HTMLElement>('.subgrupo').length, 0);
  const ids = [...root.querySelectorAll<HTMLElement>('docs-operation')].map((o) => o.props.op.operationId);
  assert.deepEqual(ids, ['a', 'b'], 'debe respetar el orden de subgrupos, no el de operations');
  assert.match(root.querySelector<HTMLElement>('.titulo').textContent, /Terceros/);
});

test('docs-tag-group sin subgrupos lista plano', () => {
  const root = montar('docs-tag-group', {
    spec: {},
    group: { name: 'Sistema', description: '', meta: {}, operations: [op()], subgroups: [] },
  });
  assert.equal(root.querySelectorAll<HTMLElement>('.subgrupo').length, 0);
  assert.equal(root.querySelectorAll<HTMLElement>('docs-operation').length, 1);
});

test('docs-info sin `info` no pinta cabecera vacía', () => {
  assert.equal(montar('docs-info', { spec: {} }).querySelector<HTMLElement>('.info'), null);
  assert.match(montar('docs-info', { spec: { info: { title: 'X', version: '1' } } }).textContent, /X/);
});

test('todo componente pintado enlaza su .css hermano', () => {
  // El link se pone después de rellenar el shadow; si alguien lo pusiera antes,
  // el vaciado se lo llevaría y el componente saldría sin estilos.
  const root = montar('docs-method', { method: 'get' });
  const link = root.querySelector<HTMLElement>('link[rel="stylesheet"]')!;
  assert.ok(link, 'sin <link> de CSS');
  assert.match(link.getAttribute('href'), /docs-method\.css$/);
});
