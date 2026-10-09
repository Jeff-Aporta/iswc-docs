/**
 * css-adopcion.test.ts — el contrato de `adoptCss` contra el flicker.
 *
 * El bug: cambiar de sección destruye y recrea decenas de shadow roots. Con la
 * hoja como `<link>` hijo del shadow, el navegador pinta esos hijos sin
 * estilos y los recoloca al resolverla — la vista entera se desordena durante
 * un frame. Con `adoptedStyleSheets` y la hoja ya construida en caché, la
 * segunda adopción es síncrona y sobrevive a `replaceChildren()`.
 *
 * jsdom no implementa hojas construibles, así que aquí se emulan lo justo para
 * poder afirmar las dos cosas que importan: una sola descarga por href, y
 * adopción sin `<link>` a partir de la segunda vez.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });

for (const k of ['window', 'document', 'HTMLElement', 'customElements', 'CustomEvent', 'Node', 'Event', 'ShadowRoot']) {
  globalThis[k] = dom.window[k];
}

/* Hojas construibles emuladas. */
globalThis.CSSStyleSheet = class {
  constructor() {
    this.cssText = '';
  }
  replaceSync(texto) {
    this.cssText = texto;
  }
};
const ADOPTADAS = new WeakMap();
Object.defineProperty(dom.window.ShadowRoot.prototype, 'adoptedStyleSheets', {
  configurable: true,
  get() {
    return ADOPTADAS.get(this) ?? [];
  },
  set(v) {
    ADOPTADAS.set(this, v);
  },
});

/* Red instrumentada: lo que se mide es cuántas veces se pide cada hoja. */
let peticiones = [];
globalThis.fetch = async (url: string) => {
  peticiones.push(String(url));
  return { ok: true, status: 200, text: async () => '.x{color:red}' };
};

const { adoptCss } = await import('../dist/cdn/components/docs/_shared.js');

const MODULO = 'http://localhost/dist/cdn/components/docs/docs-falso.js';
const HOJA = 'http://localhost/dist/cdn/components/docs/docs-falso.css';

const nuevoShadow = () => {
  const host = dom.window.document.createElement('div');
  dom.window.document.body.append(host);
  return host.attachShadow({ mode: 'open' });
};

/** Deja correr las promesas de `descargarHoja`. */
const asentar = () => new Promise((r) => setTimeout(r, 0));

test('la primera adopción enlaza el .css hermano y lo descarga una vez', async () => {
  peticiones = [];
  const shadow = nuevoShadow();
  shadow.append(dom.window.document.createElement('span'));
  adoptCss(shadow, MODULO);

  // Respaldo síncrono: sin él, el primer componente de la página se pintaría
  // sin estilos mientras baja el texto.
  const link = shadow.querySelector<HTMLElement>('link[rel="stylesheet"]')!;
  assert.ok(link, 'falta el <link> de respaldo en la primera adopción');
  assert.equal(link.getAttribute('href'), HOJA);
  assert.deepEqual(peticiones, [HOJA]);

  await asentar();
  assert.equal(shadow.adoptedStyleSheets.length, 1, 'la hoja construida no se adoptó');
  assert.equal(shadow.querySelector<HTMLElement>('link[rel="stylesheet"]'), null, 'el <link> de respaldo debió retirarse');
});

test('adopciones posteriores son síncronas, sin <link> ni segunda descarga', async () => {
  peticiones = [];
  const shadow = nuevoShadow();
  adoptCss(shadow, MODULO);

  // Nada de esperar: esto es lo que evita el frame sin estilos al recrear
  // decenas de shadow roots en un cambio de sección.
  assert.equal(shadow.adoptedStyleSheets.length, 1, 'la hoja cacheada no se adoptó en el acto');
  assert.equal(shadow.querySelector<HTMLElement>('link[rel="stylesheet"]'), null, 'no debe volver a enlazarse la hoja');
  assert.deepEqual(peticiones, [], 'la hoja cacheada no debe volver a pedirse');
});

test('todas las instancias comparten la misma hoja construida', () => {
  const a = nuevoShadow();
  const b = nuevoShadow();
  adoptCss(a, MODULO);
  adoptCss(b, MODULO);
  assert.equal(a.adoptedStyleSheets[0], b.adoptedStyleSheets[0]);
});

test('repintar el shadow no se lleva la hoja', () => {
  const shadow = nuevoShadow();
  adoptCss(shadow, MODULO);
  const hoja = shadow.adoptedStyleSheets[0];

  shadow.replaceChildren();
  shadow.append(dom.window.document.createElement('p'));
  adoptCss(shadow, MODULO);

  assert.deepEqual(shadow.adoptedStyleSheets, [hoja], 'repintar duplicó o perdió la hoja');
  assert.equal(shadow.querySelector<HTMLElement>('link[rel="stylesheet"]'), null);
});

test('N shadow roots en paralelo comparten una sola descarga', async () => {
  peticiones = [];
  const otro = 'http://localhost/dist/cdn/components/docs/docs-otro.js';
  const shadows = [nuevoShadow(), nuevoShadow(), nuevoShadow()];
  for (const s of shadows) adoptCss(s, otro);

  assert.equal(peticiones.length, 1, `se pidió ${peticiones.length} veces la misma hoja`);
  await asentar();
  for (const s of shadows) assert.equal(s.adoptedStyleSheets.length, 1);
});
