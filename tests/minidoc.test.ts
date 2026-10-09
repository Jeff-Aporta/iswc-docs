/**
 * minidoc.test.ts — el segundo driver (`docs-minidoc`) sobre el build.
 *
 * Cubre dos cosas que los guardianes de documentación no miran: que las vistas pinten de verdad
 * lo que dicen pintar, y que los dos drivers **no se pisen**. Lo segundo es el riesgo real de
 * tener dos presentaciones del mismo documento: un tag registrado dos veces, o un componente que
 * escribe estado global del otro, no se nota hasta que alguien monta los dos.
 *
 * El generador de cURL se prueba aparte porque es dominio puro: es lo que se copia a un ticket,
 * y una comilla mal escapada ahí produce un comando que falla en la shell de otro.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

for (const k of ['window', 'document', 'HTMLElement', 'customElements', 'CustomEvent', 'Node', 'Event', 'Blob', 'history', 'localStorage']) {
  globalThis[k] = dom.window[k];
}
globalThis.performance = dom.window.performance;
globalThis.location = dom.window.location;

await import('../dist/cdn/components/docs/docs-minidoc-view.js');
await import('../dist/cdn/components/docs/docs-minidoc-code.js');
await import('../dist/cdn/components/docs/docs-home.js');
await import('../dist/cdn/components/docs/docs-app.js');
await import('../dist/cdn/components/docs/docs-minidoc.js');
await import('../dist/cdn/components/docs/docs-driver-switch.js');
await import('../dist/cdn/components/docs/docs-layout.js');
await import('../dist/cdn/components/docs/docs-viewer.js');
const { buildCurl, ejemploDeParam } = await import('../dist/cdn/js/curl.js');
const { readDriver, writeDriver, esDriver, DRIVERS, DRIVER_DEFAULT } = await import('../dist/cdn/js/driver.js');

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
  path: '/v2/tareas/{id}',
  method: 'get',
  operationId: 'listarTareas',
  summary: 'Listar tareas',
  description: 'Devuelve las tareas de los últimos 7 días.',
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Id de la tarea.' },
    { name: 'page_num', in: 'query', required: true, schema: { type: 'integer', default: 1 } },
    { name: 'estado', in: 'query', schema: { type: 'string', enum: ['queued', 'succeeded'] } },
  ],
  responses: {
    200: { description: 'OK', content: { 'application/json': { example: { total: 1 } } } },
    429: { description: 'Demasiadas peticiones' },
  },
  ...over,
});

/* ── Vista central ──────────────────────────────────────────── */

test('docs-minidoc-view pinta la operación entera, sin plegar nada', () => {
  const root = montar('docs-minidoc-view', {
    op: op(), spec: null, grupo: 'Tareas', serverBase: 'https://h/api', authEnabled: false, docMd: '',
  });
  const texto = root.textContent;
  assert.match(texto, /Listar tareas/, 'falta el título');
  assert.match(texto, /Tareas/, 'falta el grupo');
  assert.match(texto, /Parámetros de ruta/, 'no agrupa los de ruta');
  assert.match(texto, /Parámetros de consulta/, 'no agrupa los de consulta');
  assert.match(texto, /page_num/, 'falta un parámetro');
  // Sin acordeón: la razón de existir de este driver es que no haya nada que abrir.
  assert.equal(root.querySelectorAll<HTMLElement>('iswc-details').length, 0, 'la vista no debe plegar contenido');
});

test('docs-minidoc-view marca los obligatorios y enseña los valores de un enum', () => {
  const root = montar('docs-minidoc-view', {
    op: op(), spec: null, grupo: '', serverBase: '', authEnabled: false, docMd: '',
  });
  assert.equal(root.querySelectorAll<HTMLElement>('.param-req').length, 2, 'id y page_num son obligatorios');
  assert.match(root.textContent, /queued/, 'no lista los valores del enum');
});

test('docs-minidoc-view sin operación invita a elegir en vez de quedarse en blanco', () => {
  const root = montar('docs-minidoc-view', {
    op: null, spec: null, grupo: '', serverBase: '', authEnabled: false, docMd: '',
  });
  assert.match(root.textContent, /Elige una operación/);
});

test('docs-home pinta info.description como portada', () => {
  const root = montar('docs-home', {
    spec: {
      info: {
        title: 'ISS PatyIA',
        version: '1.0.0',
        description: '## Bienvenido\n\nTexto **home**.',
      },
    },
  });
  assert.match(root.textContent, /ISS PatyIA/);
  assert.match(root.textContent, /v1\.0\.0/);
  const doc = root.querySelector<HTMLElement>('docs-doc')!;
  assert.ok(doc, 'debe renderizar la descripción vía docs-doc');
  const fuente = doc?.shadowRoot?.querySelector<HTMLElement>('script[type="text/markdown"]');
  assert.match(fuente?.textContent ?? '', /Bienvenido/);
});

/* ── Columna de código ──────────────────────────────────────── */

test('docs-minidoc-code abre en el primer código de estado y ofrece los demás', () => {
  const root = montar('docs-minidoc-code', {
    op: op(), spec: null, serverBase: 'https://h/api', requiereBearer: false,
  });
  const estados = [...root.querySelectorAll<HTMLElement>('.estado')].map((b) => b.textContent.trim());
  assert.deepEqual(estados, ['200', '429'], 'los estados van ordenados');
  assert.equal(root.querySelector<HTMLElement>('.estado[data-activo]').textContent.trim(), '200');
});

test('docs-minidoc-code cambia de estado sin tocar la URL', () => {
  const antes = dom.window.location.search;
  const root = montar('docs-minidoc-code', {
    op: op(), spec: null, serverBase: 'https://h/api', requiereBearer: false,
  });
  root.querySelectorAll<HTMLElement>('.estado')[1]!.click();
  assert.equal(root.querySelector<HTMLElement>('.estado[data-activo]').textContent.trim(), '429');
  assert.equal(dom.window.location.search, antes, 'cambiar de código no es navegación');
});

/* ── cURL ───────────────────────────────────────────────────── */

test('buildCurl sustituye los {parámetros} y añade solo la query obligatoria', () => {
  const { texto } = buildCurl(op(), null, 'https://h/api', false);
  assert.match(texto, /--request GET/);
  assert.match(texto, /\/v2\/tareas\/0/, 'no sustituyó el parámetro de ruta');
  assert.match(texto, /page_num=1/, 'falta la query obligatoria');
  assert.doesNotMatch(texto, /estado=/, 'no debe inventar los parámetros opcionales');
});

test('buildCurl deja el token como placeholder, nunca uno real', () => {
  const { texto } = buildCurl(op(), null, 'https://h/api', true);
  assert.match(texto, /Authorization: Bearer <token>/);
});

test('buildCurl no deja la barra de continuación en la última línea', () => {
  const { lineas } = buildCurl(op(), null, 'https://h/api', true);
  assert.ok(!lineas.at(-1).endsWith('\\'), 'pegado en una shell dejaría el prompt esperando');
});

test('buildCurl escapa las comillas simples para la shell', () => {
  // `encodeURIComponent` no toca el apóstrofo, así que llega crudo a la URL. Quien tiene que
  // protegerlo es el comillado de shell: sin esto, la comilla cierra el argumento y el comando
  // que alguien pega en su terminal se parte por la mitad.
  const conComilla = op({
    parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string', default: "o'brien" } }],
  });
  const { texto } = buildCurl(conComilla, null, 'https://h/api', false);
  assert.ok(texto.includes("o'\\''brien"), 'la comilla simple debe salir cerrada, escapada y reabierta');
  // Las comillas que abren y cierran deben quedar pares. La escapada (`\'`) no cuenta: en el
  // idiom `'A'\''B'` va fuera del entrecomillado y es un carácter literal, no un delimitador.
  const urlLinea = texto.split('\n').find((l) => l.includes('--url'));
  const delimitadoras = (urlLinea.replace(/\\'/g, '').match(/'/g) ?? []).length;
  assert.equal(delimitadoras % 2, 0, `comillas desparejadas en --url: ${urlLinea}`);
});

test('ejemploDeParam cae al tipo cuando no hay ejemplo ni default', () => {
  assert.equal(ejemploDeParam({ name: 'n', in: 'query', schema: { type: 'integer' } }), '0');
  assert.equal(ejemploDeParam({ name: 'b', in: 'query', schema: { type: 'boolean' } }), 'false');
  assert.equal(ejemploDeParam({ name: 'x', in: 'query', schema: { type: 'string' } }), '<x>');
});

/* ── Los dos drivers conviven ───────────────────────────────── */

test('docs-app y docs-minidoc son tags distintos y ninguno registra el del otro', () => {
  assert.ok(dom.window.customElements.get('docs-app'), 'docs-app sin registrar');
  assert.ok(dom.window.customElements.get('docs-minidoc'), 'docs-minidoc sin registrar');
  assert.notEqual(
    dom.window.customElements.get('docs-app'),
    dom.window.customElements.get('docs-minidoc'),
    'los dos drivers no pueden ser la misma clase',
  );
});

test('los dos drivers pueden montarse en la misma página sin romperse', () => {
  const a = dom.window.document.createElement('docs-app');
  const b = dom.window.document.createElement('docs-minidoc');
  dom.window.document.body.append(a, b);
  // Sin red no cargan documento, pero deben tener shadow propio y no compartirlo.
  assert.ok(a.shadowRoot, 'docs-app sin shadow');
  assert.ok(b.shadowRoot, 'docs-minidoc sin shadow');
  assert.notEqual(a.shadowRoot, b.shadowRoot);
  a.remove();
  b.remove();
});

test('docs-minidoc acepta el conn como objeto y como atributo JSON', () => {
  const node = dom.window.document.createElement('docs-minidoc');
  node.setAttribute('conn', '{"apiBase":"https://h/api"}');
  dom.window.document.body.append(node);
  assert.ok(node.shadowRoot, 'no montó con conn en atributo');

  node.conn = { apiBase: 'https://otro/api' };
  assert.deepEqual(node.conn, { apiBase: 'https://otro/api' }, 'la propiedad debe leerse de vuelta');
  node.remove();
});

test('docs-minidoc no revienta con un conn de JSON roto en el atributo', () => {
  const node = dom.window.document.createElement('docs-minidoc');
  node.setAttribute('conn', '{esto no es json');
  dom.window.document.body.append(node);
  assert.ok(node.shadowRoot, 'un atributo corrupto no debe dejar la página en blanco');
  node.remove();
});

/* ── Selector de driver ─────────────────────────────────────── */

test('driver: la URL manda sobre la preferencia guardada', () => {
  // Quien comparte un enlace decide qué vista se abre, aunque el lector tenga otra guardada.
  globalThis.localStorage?.setItem('docs:driver', 'docs-app');
  const s = btoa(JSON.stringify({ driver: 'docs-minidoc' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  dom.window.history.replaceState({}, '', `/?s=${s}`);
  assert.equal(readDriver(), 'docs-minidoc');

  dom.window.history.replaceState({}, '', '/');
  assert.equal(readDriver(), 'docs-app', 'sin driver en `?s=` vuelve a mandar lo guardado');
});

test('driver: un valor inventado no rompe, cae al de por defecto', () => {
  const s = btoa(JSON.stringify({ driver: 'inventado' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  dom.window.history.replaceState({}, '', `/?s=${s}`);
  globalThis.localStorage?.removeItem('docs:driver');
  assert.equal(readDriver(), DRIVER_DEFAULT);
  assert.equal(esDriver('inventado'), false);
  dom.window.history.replaceState({}, '', '/');
});

test('driver: writeDriver no ensucia la URL con el valor por defecto', () => {
  const otro = DRIVERS.find((d) => d.id !== DRIVER_DEFAULT).id;
  writeDriver(otro);
  const raw = new URLSearchParams(dom.window.location.search).get('s');
  assert.ok(raw, 'debe quedar `?s=`');
  const dec = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  assert.equal(dec.driver, otro);
  assert.equal(new URLSearchParams(dom.window.location.search).get('driver'), null);

  writeDriver(DRIVER_DEFAULT);
  assert.equal(new URLSearchParams(dom.window.location.search).get('driver'), null);
  const raw2 = new URLSearchParams(dom.window.location.search).get('s');
  if (raw2) {
    const dec2 = JSON.parse(atob(raw2.replace(/-/g, '+').replace(/_/g, '/')));
    assert.equal(dec2.driver, undefined, 'la URL compartible no lleva driver=default');
  }
});

test('el índice de minidoc expone el path en title y caption', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const ts = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-minidoc.ts'), 'utf8');
  const css = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-minidoc.css'), 'utf8');
  assert.match(ts, /title="\$\{ruta\}"/, 'falta title con el endpoint');
  assert.match(ts, /class="op-texto"/, 'falta columna título+path');
  assert.match(ts, /class="op-path"/, 'falta caption del path');
  assert.match(css, /\.op-texto/, 'falta stack del texto');
  assert.match(css, /flex-direction:\s*column/, 'el path debe ir debajo del título');
  assert.match(css, /\.op-path/, 'falta estilo del caption');
  assert.match(ts, /mdi:lock/, 'falta candado JWT en el índice');
  assert.match(ts, /#irHome/, 'falta ir al home desde el logo');
  assert.match(ts, /type="button" class="marca"/, 'el logo debe ser botón clicable');
  assert.match(ts, /flatMap/, 'los subgrupos deben aplanar sin divisores de entidad');
  assert.doesNotMatch(ts, /entidad-titulo/, 'no debe haber divisor por entidad en el índice');
  assert.match(css, /\.op-lock/, 'falta columna alineada del candado');
  assert.doesNotMatch(css, /\.entidad-titulo/, 'no debe quedar estilo de divisor de entidad');
});

test('docs-viewer monta el driver activo y lo cambia en caliente', () => {
  dom.window.history.replaceState({}, '', '/');
  globalThis.localStorage?.removeItem('docs:driver');

  const visor = dom.window.document.createElement('docs-viewer');
  dom.window.document.body.append(visor);

  const montado = () => visor.shadowRoot!.querySelector<HTMLElement>('.montaje').firstElementChild?.tagName.toLowerCase();
  assert.equal(montado(), DRIVER_DEFAULT, 'no montó el driver por defecto');

  visor.driver = 'docs-minidoc';
  assert.equal(montado(), 'docs-minidoc', 'no cambió el driver montado');
  assert.equal(visor.shadowRoot!.querySelectorAll<HTMLElement>('.montaje > *').length, 1, 'quedaron dos drivers vivos');

  visor.remove();
});

test('docs-driver-switch ofrece una opción por driver registrado', () => {
  const sel = dom.window.document.createElement('docs-driver-switch');
  dom.window.document.body.append(sel);
  const valores = [...sel.shadowRoot!.querySelectorAll<HTMLElement>('iswc-option')].map((o) => o.getAttribute('value'));
  assert.deepEqual(valores, DRIVERS.map((d) => d.id));
  sel.remove();
});

test('docs-driver-switch no monta drivers: solo emite el cambio', () => {
  // Reparto de responsabilidades: el selector escribe la preferencia y avisa; quien sabe
  // dónde está montado el driver —y por tanto quien lo reemplaza— es docs-viewer.
  const sel = dom.window.document.createElement('docs-driver-switch');
  dom.window.document.body.append(sel);
  let recibido = null;
  sel.addEventListener('docs-driver-change', (e) => { recibido = e.detail?.driver; });

  const otro = DRIVERS.find((d) => d.id !== readDriver()).id;
  const select = sel.shadowRoot!.querySelector<HTMLElement>('iswc-select');
  select.value = otro;
  select.dispatchEvent(new dom.window.CustomEvent('iswc-change', { bubbles: true }));

  assert.equal(recibido, otro, 'no emitió docs-driver-change');
  assert.equal(readDriver(), otro, 'no persistió la elección');
  sel.remove();
  dom.window.history.replaceState({}, '', '/');
  globalThis.localStorage?.removeItem('docs:driver');
});

test('docs-viewer cambia de driver al recibir docs-driver-change desde la cabecera', () => {
  dom.window.history.replaceState({}, '', '/');
  globalThis.localStorage?.removeItem('docs:driver');
  const visor = dom.window.document.createElement('docs-viewer');
  dom.window.document.body.append(visor);

  const otro = DRIVERS.find((d) => d.id !== visor.driver).id;
  visor.dispatchEvent(new dom.window.CustomEvent('docs-driver-change', { detail: { driver: otro } }));

  const montado = visor.shadowRoot!.querySelector<HTMLElement>('.montaje').firstElementChild?.tagName.toLowerCase();
  assert.equal(montado, otro, 'el evento de la cabecera no cambió el driver montado');
  visor.remove();
});

test('docs-viewer reenvía el conn al driver que monta', () => {
  const visor = dom.window.document.createElement('docs-viewer');
  visor.conn = { apiBase: 'https://h/api' };
  dom.window.document.body.append(visor);

  const activo = visor.shadowRoot!.querySelector<HTMLElement>('.montaje').firstElementChild;
  assert.deepEqual(activo.conn, { apiBase: 'https://h/api' }, 'el driver montó sin conn');

  // Y al siguiente también: si no, cambiar de vista perdería la conexión del anfitrión.
  visor.driver = visor.driver === 'docs-app' ? 'docs-minidoc' : 'docs-app';
  assert.deepEqual(
    visor.shadowRoot!.querySelector<HTMLElement>('.montaje').firstElementChild.conn,
    { apiBase: 'https://h/api' },
    'el conn se perdió al cambiar de driver',
  );
  visor.remove();
});

/* ── Armazón de tres zonas ──────────────────────────────────── */

test('docs-layout expone las cuatro zonas por slot', () => {
  const l = dom.window.document.createElement('docs-layout');
  dom.window.document.body.append(l);
  const nombres = [...l.shadowRoot!.querySelectorAll<HTMLSlotElement>('slot')].map((s) => s.getAttribute('name')).sort();
  assert.deepEqual(nombres, ['cabecera', 'centro', 'fin', 'inicio']);
  l.remove();
});

test('docs-layout anida dos splits, uno por divisor arrastrable', () => {
  const l = dom.window.document.createElement('docs-layout');
  dom.window.document.body.append(l);
  const splits = l.shadowRoot!.querySelectorAll<HTMLElement>('iswc-split-panel');
  assert.equal(splits.length, 2, 'hacen falta dos: índice|resto y centro|código');
  // storage-key: el ancho que el usuario elige tiene que sobrevivir a recargar.
  for (const sp of splits) assert.ok(sp.getAttribute('storage-key'), 'split sin storage-key');
  l.remove();
});

test('docs-layout trae un cajón y una hamburguesa por lateral', () => {
  const l = dom.window.document.createElement('docs-layout');
  dom.window.document.body.append(l);
  for (const lado of ['inicio', 'fin']) {
    assert.ok(l.shadowRoot!.querySelector<HTMLElement>(`iswc-drawer[data-lado="${lado}"]`), `sin cajón ${lado}`);
    assert.ok(l.shadowRoot!.querySelector<HTMLElement>(`.hamburguesa-${lado}`), `sin hamburguesa ${lado}`);
  }
  l.remove();
});

test('docs-layout esconde las hamburguesas mientras los paneles caben', () => {
  // jsdom no implementa matchMedia con umbrales reales: sin coincidencia, ambos laterales
  // están al lado y ninguna hamburguesa debe verse. Es el caso de escritorio.
  const l = dom.window.document.createElement('docs-layout');
  dom.window.document.body.append(l);
  for (const lado of ['inicio', 'fin']) {
    assert.equal(l.shadowRoot!.querySelector<HTMLElement>(`.hamburguesa-${lado}`).hidden, true, `hamburguesa ${lado} visible de más`);
  }
  l.remove();
});

test('los umbrales del CSS y los del JS son los mismos', async () => {
  // Están duplicados por fuerza: el CSS decide cómo se ve y el JS dónde vive cada nodo, y
  // ninguno puede leer al otro. Si se separan, un lateral se oculta pero su nodo sigue en el
  // split, o al revés — y no se ve hasta que alguien estrecha la ventana.
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const ts = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-layout.ts'), 'utf8');
  const css = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-layout.css'), 'utf8');
  for (const umbral of ['87.5rem', '60rem']) {
    assert.ok(ts.includes(umbral), `docs-layout.ts perdió el umbral ${umbral}`);
    assert.ok(css.includes(umbral), `docs-layout.css perdió el umbral ${umbral}`);
  }
});

/* ── Método QUERY ───────────────────────────────────────────── */

test('QUERY tiene color propio: el API lo usa para filtrar', async () => {
  const { METHOD_COLOR } = await import('../dist/cdn/js/openapi.js');
  assert.ok(METHOD_COLOR.query, 'QUERY sin entrada: saldría gris como un OPTIONS');
  assert.notEqual(METHOD_COLOR.query, METHOD_COLOR.get, 'QUERY no debe compartir color con GET');
  assert.notEqual(METHOD_COLOR.query, 'info');
  assert.notEqual(METHOD_COLOR.query, 'brand', 'brand≈info en ContaPyme; QUERY usa teal en CSS');
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const css = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-method.css'), 'utf8');
  assert.match(css, /data-method=["']query["']/, 'docs-method.css pinta QUERY con teal propio');
});

test('todos los chips de método miden lo mismo', async () => {
  // El ancho fijo iba en el is-tag interior, que impone su propio tamaño a partir del texto:
  // DELETE salía más ancho que GET y la columna de rutas dejaba de leerse como columna.
  // Además el pill (::part tag) debe estirarse: si solo el host mide igual, el badge coloreado
  // sigue viéndose distinto.
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const css = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-method.css'), 'utf8');
  const host = css.slice(css.indexOf(':host'), css.indexOf('.metodo'));
  assert.match(host, /width:\s*calc\(6ch/, 'el ancho debe basarse en DELETE (6ch) + padding');
  assert.match(css, /\.metodo::part\(tag\)/, 'el pill de is-tag debe estirarse al ancho del host');
  assert.match(css, /::part\(tag\)[\s\S]*width:\s*100%/, '::part(tag) width 100%');
});

/* ── Regresiones de montaje ─────────────────────────────────── */

test('docs-viewer entrega el conn ANTES de conectar el driver', () => {
  // El parpadeo: si el driver se inserta primero y recibe el conn después, arranca sin
  // configuración, pinta «falta specUrl o apiBase» y solo entonces se re-monta. El error se
  // veía un instante en cada carga.
  dom.window.history.replaceState({}, '', '/');
  globalThis.localStorage?.removeItem('docs:driver');

  const visor = dom.window.document.createElement('docs-viewer');
  visor.setAttribute('conn', JSON.stringify({ apiBase: 'https://h/api' }));
  dom.window.document.body.append(visor);

  const drv = visor.shadowRoot!.querySelector<HTMLElement>('.montaje').firstElementChild;
  assert.ok(drv, 'no montó driver');
  assert.deepEqual(drv.conn, { apiBase: 'https://h/api' }, 'el driver se conectó sin conn');
  visor.remove();
});

test('docs-layout corrige un reparto degenerado de los splits', async () => {
  // `iswc-split-panel` cachea su posición en píxeles al conectarse; dentro de un shadow recién
  // construido el host mide 0, cachea 0px y —como el píxel es canónico— el índice y el
  // contenido colapsan. Con storage-key ese cero además se persiste y envenena las siguientes
  // cargas. La corrección debe escribir píxeles, no porcentaje.
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const ts = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-layout.ts'), 'utf8');
  assert.match(ts, /positionInPixels\s*=/, 'debe fijar píxeles: el porcentaje lo pisa el píxel canónico');
  assert.match(ts, /requestAnimationFrame/, 'debe esperar a que el layout tenga ancho real');
  assert.match(ts, /MINIMO_PANEL_PX/, 'debe respetar el ancho que el usuario haya arrastrado');
});

/* ── Caducidad del estado persistido ────────────────────────── */

test('la geometría guardada caduca al cambiar de build', async () => {
  const { caducarPrefsSiCambioBuild, CLAVE_VERSION, CLAVE_KIT, DOCS_VERSION } =
    await import('../dist/cdn/js/prefs.js?bust=' + Math.random());

  // Estado escrito por una versión anterior, con el cero que rompía el layout.
  globalThis.localStorage.setItem(CLAVE_KIT, JSON.stringify({
    'iswc-split-panel': {
      'docs:split:inicio': { positionInPixels: 0 },
      'docs:split:fin': { positionInPixels: 0 },
      'otra-app': { positionInPixels: 250 },
    },
    'iswc-otro-componente': { algo: 1 },
  }));
  globalThis.localStorage.setItem(CLAVE_VERSION, 'build-viejo');
  globalThis.localStorage.setItem('docs:driver', 'docs-app');

  assert.equal(caducarPrefsSiCambioBuild(), true, 'debió purgar: el sello no coincide');

  const tras = JSON.parse(globalThis.localStorage.getItem(CLAVE_KIT));
  assert.equal(tras['iswc-split-panel']['docs:split:inicio'], undefined, 'no borró la geometría propia');
  assert.equal(tras['iswc-split-panel']['docs:split:fin'], undefined, 'no borró la geometría propia');
  // Cirugía, no demolición: lo que no es nuestro se queda.
  assert.deepEqual(tras['iswc-split-panel']['otra-app'], { positionInPixels: 250 }, 'tocó geometría ajena');
  assert.deepEqual(tras['iswc-otro-componente'], { algo: 1 }, 'tocó otro componente del kit');
  // El driver es una elección deliberada del lector: cambiar de versión no se la cambia.
  assert.equal(globalThis.localStorage.getItem('docs:driver'), 'docs-app', 'borró una preferencia del usuario');
  assert.equal(globalThis.localStorage.getItem(CLAVE_VERSION), DOCS_VERSION, 'no dejó sellado el build actual');
});

test('con el mismo build no se toca nada', async () => {
  const { caducarPrefsSiCambioBuild, CLAVE_VERSION, CLAVE_KIT, DOCS_VERSION } =
    await import('../dist/cdn/js/prefs.js?bust=' + Math.random());

  globalThis.localStorage.setItem(CLAVE_VERSION, DOCS_VERSION);
  const guardado = JSON.stringify({ 'iswc-split-panel': { 'docs:split:inicio': { positionInPixels: 320 } } });
  globalThis.localStorage.setItem(CLAVE_KIT, guardado);

  assert.equal(caducarPrefsSiCambioBuild(), false, 'purgó sin haber cambiado de build');
  assert.equal(globalThis.localStorage.getItem(CLAVE_KIT), guardado, 'el ancho que arrastró el usuario debe sobrevivir');
});

test('docs-layout caduca las prefs antes de montar los splits', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const ts = readFileSync(join(raiz, 'src', 'components', 'docs', 'docs-layout.ts'), 'utf8');
  const llamada = ts.indexOf('caducarPrefsSiCambioBuild()');
  const clase = ts.indexOf('class DocsLayout');
  assert.ok(llamada > 0, 'docs-layout no caduca las prefs');
  assert.ok(llamada < clase, 'debe caducar al cargar el módulo: si no, los splits ya restauraron');
});

/* ── Método QUERY ───────────────────────────────────────────── */

test('el visor lista las operaciones QUERY en vez de descartarlas', async () => {
  const { listOperations } = await import('../dist/cdn/js/openapi.js');
  const spec = {
    paths: {
      '/file/query': { query: { summary: 'Buscar archivos', responses: {} } },
      '/conversaciones': { get: { summary: 'Listar', responses: {} }, query: { summary: 'Filtrar', responses: {} } },
    },
  };
  const ops = listOperations(spec);
  const query = ops.filter((o) => o.method === 'query');
  assert.equal(query.length, 2, 'las operaciones QUERY no llegan al índice');
  assert.ok(query.some((o) => o.path === '/file/query'), 'falta /file/query');
});

test('QUERY ofrece editor de cuerpo: es su razón de ser frente a GET', async () => {
  const { opUsesRequestBody } = await import('../dist/cdn/js/tryit-body.js');
  assert.equal(opUsesRequestBody('query'), true);
  assert.equal(opUsesRequestBody('get'), false);
});

test('buildCurl QUERY no pone el filtro en la query string', () => {
  const { texto } = buildCurl(
    {
      method: 'query',
      path: '/metricas',
      requestBody: {
        content: { 'application/json': { example: { dias: 30 } } },
      },
      parameters: [{ name: 'dias', in: 'query', required: true, schema: { type: 'integer', default: 30 } }],
    },
    null,
    'https://h',
    false,
  );
  assert.match(texto, /--request QUERY/);
  assert.doesNotMatch(texto, /\?dias=/);
  assert.match(texto, /"dias": 30/);
});
