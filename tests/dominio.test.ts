/**
 * dominio.test.ts — módulos puros de `js/` que la vista da por buenos.
 *
 * Son las funciones cuyo fallo no da error visible: un filtro que devuelve de
 * más, un JSON que se acepta siendo inválido, un mensaje de error que pierde
 * el detalle de la API. Todo lo que aquí se comprueba pasó desapercibido
 * alguna vez en el visor de React.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { filterGroupsByQuery, filterGroupsByNavTab, resolveVisibleNavTabs, resolveActiveNavTab, contarOperaciones } =
  await import('../dist/cdn/js/dominio/nav.js');
const { normalizeApiBase } = await import('../dist/cdn/js/core/config.js');
const { normalizeServerBase, joinApiUrl, inferDefaultServerBase } = await import('../dist/cdn/js/core/server-base.js');
const { formatHttpError, extractApiError } = await import('../dist/cdn/js/dominio/http-error.js');
const { validateBodyJson, opUsesRequestBody, resolveTryItBodyExamples, defaultTryItBodyText, formatBodyExample } =
  await import('../dist/cdn/js/dominio/tryit-body.js');
const { opAllowsAttachments, packTryItBody, attachmentFieldNames } = await import('../dist/cdn/js/dominio/tryit-attach.js');
const { sanitizeParamInputValue, paramTypeLabel, paramInitialValue, paramEnum } =
  await import('../dist/cdn/js/dominio/param-schema.js');
const { renderMarkdown } = await import('../dist/cdn/js/dominio/markdown.js');
const { toPostmanCollection } = await import('../dist/cdn/js/dominio/export.js');
const { parseIsDocument, buildIsDocument, IS_DOCUMENT_KIND } = await import('../dist/cdn/js/dominio/is-document.js');
const { normalizeJwt, formatSessionChipLabel, stripContapymeEmail } = await import('../dist/cdn/js/core/auth.js');
const { parseConnParam, encodeConnParam, resolveConnConfig, joinConnUrl, DEFAULT_CONN_PATHS } =
  await import('../dist/cdn/js/core/conn.js');
const { getQuery, setQuery, readSState, writeSState, clearSState, migrateLegacyNavToS } =
  await import('../dist/cdn/js/core/search-state.js');
const { mergeUrlState, readUrlState } = await import('../dist/cdn/js/core/url-state.js');

/* ── nav ────────────────────────────────────────────────────── */

const grupo = (name, ops) => ({
  name,
  description: '',
  meta: {},
  subgroups: [],
  operations: ops.map((o) => ({ path: o, method: 'get', operationId: o, summary: '' })),
});

test('filterGroupsByQuery descarta los grupos que se quedan sin operaciones', () => {
  const grupos = [grupo('A', ['/tercero', '/empresa']), grupo('B', ['/factura'])];
  const r = filterGroupsByQuery(grupos, 'tercero');
  assert.equal(r.length, 1);
  assert.equal(r[0]!.operations.length, 1);
});

test('filterGroupsByQuery vacío no filtra y devuelve la misma referencia', () => {
  const grupos = [grupo('A', ['/x'])];
  assert.equal(filterGroupsByQuery(grupos, '   '), grupos);
});

test('una pestaña sin `tags` no filtra (sirve como sección «Todo»)', () => {
  const grupos = [grupo('A', ['/x']), grupo('B', ['/y'])];
  const tabs = [{ id: 'todo', label: 'Todo' }, { id: 'solo-a', label: 'A', tags: ['A'] }];
  assert.equal(filterGroupsByNavTab(grupos, tabs, 'todo').length, 2);
  assert.equal(filterGroupsByNavTab(grupos, tabs, 'solo-a').length, 1);
});

test('las pestañas con requiresSession solo aparecen con sesión', () => {
  const config = { nav: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', requiresSession: true }] };
  assert.equal(resolveVisibleNavTabs(config, null).length, 1);
  assert.equal(resolveVisibleNavTabs(config, { token: 'x' }).length, 2);
});

test('resolveActiveNavTab cae a la primera cuando la preferida ya no existe', () => {
  const tabs = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
  assert.equal(resolveActiveNavTab(tabs, 'b'), 'b');
  assert.equal(resolveActiveNavTab(tabs, 'fantasma'), 'a');
  assert.equal(resolveActiveNavTab([], 'x'), '__all__');
});

test('contarOperaciones suma todas las operaciones visibles', () => {
  assert.equal(contarOperaciones([grupo('A', ['/x', '/y']), grupo('B', ['/z'])]), 3);
});

/* ── bases de URL ───────────────────────────────────────────── */

test('normalizeApiBase añade el /api que falta y descarta query y hash', () => {
  assert.equal(normalizeApiBase('example.com'), 'https://example.com/api');
  assert.equal(normalizeApiBase('https://example.com/api/'), 'https://example.com/api');
  assert.equal(normalizeApiBase('https://example.com/base?x=1#y'), 'https://example.com/base/api');
  assert.equal(normalizeApiBase(''), '');
  assert.equal(normalizeApiBase('no es una url ::'), '');
});

test('joinApiUrl no duplica ni pierde la barra', () => {
  assert.equal(joinApiUrl('https://h/api/', '/x'), 'https://h/api/x');
  assert.equal(joinApiUrl('https://h/api', 'x'), 'https://h/api/x');
  assert.equal(joinApiUrl('', '/x'), '/x');
});

test('inferDefaultServerBase resuelve un `servers` relativo contra el origen', () => {
  const spec = { servers: [{ url: '/api' }] };
  // Sin `location` (Node), el origen es cadena vacía y queda la ruta.
  assert.equal(inferDefaultServerBase(spec, {}), '/api');
  assert.equal(inferDefaultServerBase(spec, { apiBase: 'https://h/api' }), 'https://h/api');
  assert.equal(normalizeServerBase('https://h/api//'), 'https://h/api');
});

/* ── errores HTTP ───────────────────────────────────────────── */

test('extractApiError cubre las tres formas de las APIs InSoft', () => {
  assert.equal(extractApiError({ error: 'a' }), 'a');
  assert.equal(extractApiError({ message: 'b' }), 'b');
  assert.equal(extractApiError({ encabezado: { mensaje: 'c' } }), 'c');
  assert.equal(extractApiError(null), '');
});

test('formatHttpError conserva detalle, URL y pista en líneas separadas', () => {
  const msg = formatHttpError(404, { endpoint: 'https://h/x', data: { error: 'no existe' }, hint: 'revisa la ruta' });
  const lineas = msg.split('\n');
  assert.equal(lineas[0], 'Ruta no encontrada (404).');
  assert.equal(lineas[1], 'no existe');
  assert.equal(lineas[2], 'URL: https://h/x');
  assert.equal(lineas[3], 'revisa la ruta');
});

/* ── cuerpo y parámetros ────────────────────────────────────── */

test('validateBodyJson acepta el vacío y rechaza el JSON roto', () => {
  assert.equal(validateBodyJson(''), null);
  assert.equal(validateBodyJson('{"a":1}'), null);
  assert.match(validateBodyJson('{"a":'), /JSON inválido/);
});

test('opUsesRequestBody solo para post, put y patch', () => {
  assert.equal(opUsesRequestBody('POST'), true);
  assert.equal(opUsesRequestBody('get'), false);
  assert.equal(opUsesRequestBody(undefined), false);
});

test('resolveTryItBodyExamples toma los `examples` de la spec con su summary', () => {
  const op = {
    requestBody: {
      content: { 'application/json': { examples: { a: { summary: 'Caso A', value: { x: 1 } }, vacio: {} } } },
    },
  };
  const r = resolveTryItBodyExamples(op as any);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.label, 'Caso A');
});

test('defaultTryItBodyText no pinta el literal null (schema $ref sin ejemplo)', () => {
  const op = {
    method: 'query',
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/sqlFiltering' } } } },
  };
  const texto = defaultTryItBodyText(op as any);
  assert.deepEqual(JSON.parse(texto), {});
  assert.notEqual(texto.trim(), 'null');
  assert.deepEqual(JSON.parse(formatBodyExample(null)), {});
});

test('opAllowsAttachments es genérico: plantilla, multipart o dataUrl; sin MIME', () => {
  assert.equal(opAllowsAttachments(<any>{ method: 'query', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } } }), false);
  assert.equal(opAllowsAttachments(<any>{ tryitAttachments: 'conversacion' }), true);
  assert.equal(opAllowsAttachments(<any>{ requestBody: { content: { 'multipart/form-data': { schema: { type: 'object' } } } } }), true);
  assert.equal(
    opAllowsAttachments(<any>{
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { dataUrl: { type: 'string' } } } } } },
    }),
    true,
  );
  assert.deepEqual(attachmentFieldNames(<any>{ tryitAttachments: { images: { field: 'imagenes' }, audios: { field: 'audios' } } }, null), [
    'imagenes',
    'audios',
  ]);
});

test('packTryItBody sin archivos deja el JSON; con archivos no filtra tipo', async () => {
  const { body, multipart } = await packTryItBody(<any>{ method: 'query' }, null, '', []);
  assert.equal(multipart, false);
  assert.equal(body, '{}');
  const f = new File([Uint8Array.from([1, 2, 3])], 'nota.bin', { type: 'application/octet-stream' });
  const packed = await packTryItBody(<any>{ tryitAttachments: { files: { field: 'archivos' } } }, null, '{\n  \n}', [f]);
  assert.equal(packed.multipart, false);
  const obj = JSON.parse(packed.body as string);
  assert.equal(obj.archivos.length, 1);
  assert.match(obj.archivos[0], /^data:/);
});

test('sanitizeParamInputValue recorta lo que el tipo no admite', () => {
  assert.equal(sanitizeParamInputValue({ type: 'integer' }, '12a3'), '123');
  assert.equal(sanitizeParamInputValue({ type: 'number' }, '-1.2.3'), '-1.23');
  assert.equal(sanitizeParamInputValue({ type: 'string' }, 'a-1'), 'a-1');
});

test('paramTypeLabel y paramInitialValue leen el schema', () => {
  assert.equal(paramTypeLabel({ type: 'array', items: { type: 'string' } }), 'array<string>');
  assert.equal(paramTypeLabel({ type: 'string', format: 'date-time' }), 'string(date-time)');
  assert.equal(paramInitialValue({ example: 7 }), '7');
  assert.equal(paramInitialValue({ schema: { default: 50 } }), '50');
  assert.equal(paramInitialValue({ schema: { enum: ['a', 'b'] } }), 'a');
  assert.equal(paramInitialValue({}), '');
  assert.deepEqual(paramEnum({ enum: [1, 2] }), ['1', '2']);
});

/* ── markdown ───────────────────────────────────────────────── */

test('renderMarkdown escapa el HTML del origen en vez de ejecutarlo', () => {
  const out = renderMarkdown('texto con <script>alert(1)</script>');
  assert.ok(!out.includes('<script>'));
  assert.ok(out.includes('&lt;script&gt;'));
});

test('renderMarkdown baja el h1 a h3 (el h1 lo pone el visor)', () => {
  assert.match(renderMarkdown('# Título'), /<h3>Título<\/h3>/);
});

test('renderMarkdown arma tablas GFM', () => {
  const out = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
  assert.match(out, /<th>a<\/th>/);
  assert.match(out, /<td>2<\/td>/);
});

test('renderMarkdown no interpreta markdown dentro de código inline', () => {
  assert.match(renderMarkdown('usa `**esto**` literal'), /<code>\*\*esto\*\*<\/code>/);
});

/* ── exportación ────────────────────────────────────────────── */

test('toPostmanCollection traduce {param} a :param y agrupa por tag', async () => {
  const spec = {
    info: { title: 'X' },
    servers: [{ url: 'https://h' }],
    paths: {
      '/t/{id}': { get: { tags: ['T'], parameters: [{ name: 'q', in: 'query' }], responses: {} } },
    },
  };
  const col = await toPostmanCollection(spec as any);
  assert.equal((col.item as unknown[]).length, 1);
  assert.equal(col.item[0]!.name, 'T');
  const req = col.item[0]!.item[0]!.request;
  assert.deepEqual(req.url.path, ['t', ':id']);
  assert.equal(req.url.raw, 'https://h/t/:id');
  // Un parámetro opcional entra deshabilitado: si no, Postman lo manda vacío.
  assert.equal(req.url.query[0]!.disabled, true);
});

/* ── documento IS ───────────────────────────────────────────── */

test('parseIsDocument reconoce el documento IS y la config anidada', () => {
  const spec = { openapi: '3.0.3', paths: {} };
  const doc = { kind: IS_DOCUMENT_KIND, version: 1, viewer: { ns: 'ISA' }, spec };
  assert.equal(parseIsDocument(doc).spec, spec);
  assert.equal(parseIsDocument({ spec: doc }).spec, spec);
  assert.equal(parseIsDocument({ openapi: '3.0.3', paths: {} }), null);
  assert.equal(parseIsDocument(null), null);
});

test('buildIsDocument no arrastra las URLs de arranque del host', () => {
  const doc: any = buildIsDocument({ ns: 'ISA', specUrl: 'https://h/x.json', cssUrl: 'https://cdn/x.css' }, {});
  assert.equal(doc.viewer.ns, 'ISA');
  assert.equal(doc.viewer.specUrl, undefined);
  assert.equal(doc.viewer.cssUrl, undefined);
});

/* ── sesión ─────────────────────────────────────────────────── */

test('normalizeJwt acepta que peguen el header entero', () => {
  assert.equal(normalizeJwt('Bearer eyJ.a.b'), 'eyJ.a.b');
  assert.equal(normalizeJwt('  eyJ.a.b '), 'eyJ.a.b');
  assert.equal(normalizeJwt(null), '');
});

test('el chip de sesión usa el primer nombre sin mayúsculas sostenidas', () => {
  assert.equal(formatSessionChipLabel('JUAN CARLOS PEREZ'), 'Juan');
  assert.equal(formatSessionChipLabel('ana.rios@contapyme.com'), 'Ana');
  assert.equal(formatSessionChipLabel(''), 'JWT');
  assert.equal(stripContapymeEmail('ana@contapyme.com'), 'ana');
});

/* ── autoconexión `?conn=` ───────────────────────────────────── */

test('parseConnParam decodifica base64url con padding arbitrario', () => {
  const obj = { apiBase: 'https://h/api', title: 'X', icon: 'mdi:api' };
  const raw = encodeConnParam(obj);
  const back = parseConnParam(raw);
  assert.deepEqual(back, obj);
});

test('parseConnParam tolera base64 estándar (con + y /) y devuelve null en basura', () => {
  const obj = { apiBase: 'https://h/api' };
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64std = btoa(bin);
  assert.deepEqual(parseConnParam(b64std), obj);
  assert.equal(parseConnParam(''), null);
  assert.equal(parseConnParam('@@@@'), null);
  assert.equal(parseConnParam(123), null);
});

test('encodeConnParam no deja padding (es base64url, no estándar)', () => {
  const enc = encodeConnParam({ a: 1 });
  assert.ok(!enc.includes('='));
  assert.ok(!enc.includes('+'));
  assert.ok(!enc.includes('/'));
});

test('joinConnUrl une apiBase y segmento sin duplicar barras', () => {
  assert.equal(joinConnUrl('https://h/api/', '/x'), 'https://h/api/x');
  assert.equal(joinConnUrl('https://h/api', 'x'), 'https://h/api/x');
  assert.equal(joinConnUrl('', '/x'), '');
  assert.equal(joinConnUrl('https://h/api', ''), '');
});

test('resolveConnConfig devuelve null si no hay ?conn= o si viene corrupto', () => {
  assert.equal(resolveConnConfig(''), null);
  assert.equal(resolveConnConfig('?otro=1'), null);
  assert.equal(resolveConnConfig('?conn=@@@@'), null);
  // Sin apiBase no es autoconexión válida.
  const sinBase = encodeConnParam({ title: 'X' });
  assert.equal(resolveConnConfig(`?conn=${sinBase}`), null);
});

test('resolveConnConfig toma apiBase, paths y marca del payload base64url', () => {
  const raw = encodeConnParam({
    apiBase: 'https://h/api',
    fixedServer: true,
    paths: { info: '/health', docs: '/custom?v=json' },
    title: 'ISS PatyIA',
    icon: 'mdi:robot',
    spec: { kind: 'config', version: 1, paths: {} },
  });
  const r = resolveConnConfig(`?conn=${raw}`);
  assert.equal(r.apiBase, 'https://h/api');
  assert.equal(r.fixedServer, true);
  assert.equal(r.paths.info, '/health');
  assert.equal(r.paths.docs, '/custom?v=json');
  assert.equal(r.brand.title, 'ISS PatyIA');
  assert.equal(r.brand.icon, 'mdi:robot');
  assert.equal((r.spec as any)?.kind, 'config');
});

test('resolveConnConfig rellena defaults info + docs y no inventa meta/config legacy', () => {
  const raw = encodeConnParam({ apiBase: 'https://h/api' });
  const r = resolveConnConfig(`?conn=${raw}`);
  assert.equal(r.paths.info, DEFAULT_CONN_PATHS.info);
  assert.equal(r.paths.docs, DEFAULT_CONN_PATHS.docs);
  assert.equal(r.paths.config, undefined);
  assert.equal(r.paths.meta, undefined);
  assert.equal(r.paths.paths, undefined);
  assert.equal(r.paths.docsConfig, undefined);
});

test('resolveConnConfig acepta URLSearchParams directamente', () => {
  const raw = encodeConnParam({ apiBase: 'https://h/api' });
  const sp = new URLSearchParams(`conn=${raw}`);
  const r = resolveConnConfig(sp);
  assert.equal(r.apiBase, 'https://h/api');
});

/* ── estado de búsqueda en `?s=` ──────────────────────────── */

const mountLocation = (search) => {
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: `http://localhost/${search}`,
    pretendToBeVisual: true,
  });
  for (const k of ['window', 'document', 'URL', 'URLSearchParams', 'History']) globalThis[k] = dom.window[k];
  globalThis.location = dom.window.location;
  globalThis.history = dom.window.history;
  return dom;
};

test('getQuery devuelve el query persistido en `?s=`', () => {
  mountLocation('');
  assert.equal(getQuery(), '');
  mountLocation('?s=' + encodeURIComponent(btoa(JSON.stringify({ q: 'tercero' }))));
  // base64 estándar del test: getQuery decodifica tolerante a `+/=`.
  assert.equal(getQuery(), 'tercero');
});

test('setQuery escribe en `?s=` como JSON base64url con clave q', () => {
  const dom = mountLocation('');
  setQuery('insoft');
  const sp = new URLSearchParams(dom.window.location.search);
  const raw = sp.get('s');
  assert.ok(raw, '?s= queda en la URL');
  assert.ok(!raw.includes('='), 'es base64url sin padding');
  const dec = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  assert.equal(dec.q, 'insoft');
});

test('setQuery("") borra `?s=` cuando la bolsa queda vacía', () => {
  const dom = mountLocation('?s=' + encodeURIComponent(btoa(JSON.stringify({ q: 'x' }))));
  setQuery('');
  assert.equal(new URLSearchParams(dom.window.location.search).get('s'), null);
});

test('writeSState fusiona sin pisar theme/palette que ya estuvieran', () => {
  const dom = mountLocation(
    '?s=' + encodeURIComponent(btoa(JSON.stringify({ theme: 'dark', palette: 'contapyme' }))),
  );
  writeSState({ q: 'tercero' });
  const raw = new URLSearchParams(dom.window.location.search).get('s');
  const dec = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  assert.equal(dec.theme, 'dark', 'theme preservado');
  assert.equal(dec.palette, 'contapyme', 'palette preservado');
  assert.equal(dec.q, 'tercero', 'q añadido');
});

test('navegar apila historial y ajustar la vista no', () => {
  const dom = mountLocation('');
  const inicio = dom.window.history.length;
  mergeUrlState({ op: 'getUno' });
  mergeUrlState({ op: 'getDos' });
  assert.equal(dom.window.history.length, inicio + 2, 'cada operación es una entrada');
  setQuery('insoft');
  assert.equal(dom.window.history.length, inicio + 2, 'teclear en la búsqueda no apila');
  mergeUrlState({ op: 'getTres' }, { push: false });
  assert.equal(dom.window.history.length, inicio + 2, 'push:false reemplaza');
  assert.equal(readUrlState().op, 'getTres');
});

test('reescribir el mismo estado no duplica la entrada del historial', () => {
  const dom = mountLocation('');
  mergeUrlState({ op: 'getUno' });
  const tras = dom.window.history.length;
  mergeUrlState({ op: 'getUno' });
  assert.equal(dom.window.history.length, tras);
});

test('readSState devuelve {} si `?s=` está corrupto', () => {
  mountLocation('?s=@@@@');
  assert.deepEqual(readSState(), {});
});

test('clearSState borra `?s=` entero aunque tenga theme/palette/q', () => {
  const dom = mountLocation(
    '?s=' + encodeURIComponent(btoa(JSON.stringify({ theme: 'dark', palette: 'contapyme', q: 'x' }))),
  );
  clearSState();
  assert.equal(new URLSearchParams(dom.window.location.search).get('s'), null);
});

test('mergeUrlState escribe op/tab/opt dentro de `?s=` sin params planos', () => {
  const dom = mountLocation('');
  mergeUrlState({ op: 'put_system_prompts_operativos', tab: 'sistema', opTab: 'doc' });
  const sp = new URLSearchParams(dom.window.location.search);
  assert.equal(sp.get('op'), null);
  assert.equal(sp.get('tab'), null);
  assert.equal(sp.get('opt'), null);
  const raw = sp.get('s');
  assert.ok(raw);
  const dec = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  assert.equal(dec.op, 'put_system_prompts_operativos');
  assert.equal(dec.tab, 'sistema');
  assert.equal(dec.opt, 'doc');
  assert.equal(readUrlState().op, 'put_system_prompts_operativos');
  assert.equal(readUrlState().opTab, 'doc');
});

test('migrateLegacyNavToS pasa `?op=` plano a la bolsa `?s=`', () => {
  const dom = mountLocation('?op=put_system_prompts_operativos&tab=sistema');
  assert.equal(migrateLegacyNavToS(), true);
  const sp = new URLSearchParams(dom.window.location.search);
  assert.equal(sp.get('op'), null);
  assert.equal(sp.get('tab'), null);
  const dec = JSON.parse(atob(sp.get('s').replace(/-/g, '+').replace(/_/g, '/')));
  assert.equal(dec.op, 'put_system_prompts_operativos');
  assert.equal(dec.tab, 'sistema');
});

test('la búsqueda filtra aunque el tag esté en otra pestaña', () => {
  // `?tab=todo` y un grupo «Terceros» en otra pestaña: con query, debe verse.
  const grupos: any[] = [
    {
      name: 'Terceros',
      description: '',
      meta: {},
      subgroups: [],
      operations: [{ path: '/tercero', method: 'get', operationId: 'listarTercero', summary: 'Listar terceros' }],
    },
    {
      name: 'Sistema',
      description: '',
      meta: {},
      subgroups: [],
      operations: [{ path: '/info', method: 'get', operationId: 'info', summary: 'Info' }],
    },
  ];
  const tabs = [
    { id: 'todo', label: 'Todo' },
    { id: 'sistema', label: 'Sistema', tags: ['Sistema'] },
  ];
  // Sin query y tab=sistema: solo se ve Sistema (Terceros oculto por la nav).
  assert.equal(filterGroupsByNavTab(grupos, tabs, 'sistema').length, 1);
  // Con query='tercero': la navTab se ignora y el match sale de Terceros.
  const conQuery = filterGroupsByQuery(grupos, 'tercero');
  assert.equal(conQuery.length, 1);
  assert.equal(conQuery[0]!.name, 'Terceros');
});
