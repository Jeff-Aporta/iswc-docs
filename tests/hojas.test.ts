/**
 * hojas.test.ts — el parche que quita el flicker de los shadow roots del kit.
 *
 * Los `is-*` vienen del CDN y enlazan su CSS con `shadow.prepend(<link>)`, sin
 * caché. Al cambiar de sección se recrean decenas y cada uno se pinta un frame
 * sin estilos. `js/hojas.js` intercepta ese `prepend` y, a partir de la segunda
 * aparición de cada href, adopta la hoja ya construida en vez de enlazarla.
 *
 * Lo que se afirma aquí es lo que no se puede afirmar mirando el código: que
 * el primer componente nunca se queda sin estilos, que el segundo ya no
 * enlaza nada, y que los `docs-*` comparten el caché en vez de duplicarlo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });

for (const k of ['window', 'document', 'HTMLElement', 'customElements', 'CustomEvent', 'Node', 'Event', 'ShadowRoot']) {
  globalThis[k] = dom.window[k];
}

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

let peticiones = [];
globalThis.fetch = async (url: string) => {
  peticiones.push(String(url));
  return { ok: true, status: 200, text: async () => '.x{color:red}' };
};

// Orden real: `hojas.js` corre en <head>, los módulos `docs-*` después.
await import('../dist/cdn/hojas.js');
const { adoptCss } = await import('../dist/cdn/components/docs/_shared.js');

const nuevoShadow = () => {
  const host = dom.window.document.createElement('div');
  dom.window.document.body.append(host);
  return host.attachShadow({ mode: 'open' });
};

/** Lo que hace el kit: crear el `<link>` y prepender-lo al shadow. */
const enlazarComoElKit = (shadow, href) => {
  const link = dom.window.document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  shadow.prepend(link);
  return link;
};

const asentar = () => new Promise((r) => setTimeout(r, 0));

const KIT = 'http://localhost/cdn/actions/button.css';

test('hojas.js publica el caché compartido', () => {
  assert.ok(globalThis.__docsHojas, 'falta window.__docsHojas');
  assert.ok(globalThis.__docsHojas.hojas instanceof Map);
  assert.ok(globalThis.__docsHojas.cargas instanceof Map);
});

test('el primer componente conserva su <link>: nunca se queda sin estilos', async () => {
  peticiones = [];
  const shadow = nuevoShadow();
  enlazarComoElKit(shadow, KIT);

  assert.ok(shadow.querySelector<HTMLElement>('link[rel="stylesheet"]'), 'el primer <link> debe pasar tal cual');
  assert.deepEqual(peticiones, [KIT], 'la descarga debe dispararse en paralelo');

  await asentar();
  assert.ok(globalThis.__docsHojas.hojas.has(KIT), 'la hoja no quedó construida en caché');
});

test('los siguientes adoptan la hoja y ya no enlazan nada', () => {
  peticiones = [];
  const shadow = nuevoShadow();
  enlazarComoElKit(shadow, KIT);

  // Síncrono y sin `<link>`: esto es exactamente lo que evita el frame sin
  // estilos al recrear decenas de `is-*` en un cambio de sección.
  assert.equal(shadow.querySelector<HTMLElement>('link[rel="stylesheet"]'), null);
  assert.equal(shadow.adoptedStyleSheets.length, 1);
  assert.deepEqual(peticiones, []);
});

test('el kit prepende dos hojas de golpe y las dos se adoptan', () => {
  const scrollbars = 'http://localhost/cdn/scrollbars.css';
  const primero = nuevoShadow();
  const l1 = dom.window.document.createElement('link');
  l1.rel = 'stylesheet';
  l1.href = scrollbars;
  const l2 = dom.window.document.createElement('link');
  l2.rel = 'stylesheet';
  l2.href = KIT;
  primero.prepend(l1, l2);

  // `scrollbars.css` es nueva: se queda. `KIT` ya está cacheada: se adopta.
  assert.equal(primero.querySelectorAll<HTMLElement>('link[rel="stylesheet"]').length, 1);
  assert.equal(primero.querySelector<HTMLElement>('link').href, scrollbars);
  assert.equal(primero.adoptedStyleSheets.length, 1);
});

test('prepend sigue funcionando para nodos que no son hojas', () => {
  const shadow = nuevoShadow();
  shadow.append(dom.window.document.createElement('p'));
  const span = dom.window.document.createElement('span');
  shadow.prepend(span);
  assert.equal(shadow.firstElementChild, span);
  assert.equal(shadow.children.length, 2);
});

test('los docs-* comparten el caché: una sola descarga por hoja', async () => {
  peticiones = [];
  const modulo = 'http://localhost/dist/cdn/components/docs/docs-falso.js';
  const hoja = 'http://localhost/dist/cdn/components/docs/docs-falso.css';

  // `adoptCss` enlaza como respaldo, y ese `prepend` pasa por el parche: si
  // cada capa tuviera su caché, este href se pediría dos veces.
  adoptCss(nuevoShadow(), modulo);
  await asentar();
  assert.deepEqual(peticiones, [hoja]);

  const segundo = nuevoShadow();
  adoptCss(segundo, modulo);
  assert.equal(segundo.adoptedStyleSheets.length, 1);
  assert.equal(segundo.querySelector<HTMLElement>('link[rel="stylesheet"]'), null);
  assert.deepEqual(peticiones, [hoja], 'la hoja cacheada no debe volver a pedirse');
});
