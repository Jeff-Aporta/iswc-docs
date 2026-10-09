/**
 * <docs-viewer> — monta el driver elegido y deja cambiarlo en caliente.
 *
 * El anfitrión ISS quema el documento en el atributo `doc` (JSON completo).
 * `conn` queda solo para demos / `?conn=`; PatyIA no lo usa.
 */

import { adoptCss, precargarCss, define, html } from './_shared.js';
import type { DocsConn } from '../../js/conn.js';
import { driverMeta, readDriver, writeDriver, type DocsDriver } from '../../js/driver.js';
import './docs-app.js';
import './docs-minidoc.js';

type DriverHost = HTMLElement & { conn?: DocsConn | null; doc?: unknown };

function parseAttrJson(raw: string | null): unknown {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

class DocsViewer extends HTMLElement {
  #root: ShadowRoot;
  #driver: DocsDriver['id'] = readDriver();
  #conn: DocsConn | null = null;
  #doc: unknown = null;
  #montajeNodo: HTMLElement | null = null;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  /** Conn del anfitrión. Se ignora si también hay `doc`. */
  get conn(): DocsConn | null { return this.#conn; }
  set conn(v: DocsConn | null) {
    this.#conn = v && typeof v === 'object' ? v : null;
    const activo = this.#montajeNodo?.firstElementChild as DriverHost | null;
    if (!activo) return;
    if (this.#doc != null) {
      activo.doc = this.#doc;
      activo.conn = null;
    } else {
      activo.conn = this.#conn;
    }
  }

  /** Documento InSoft/OpenAPI quemado (`doc=`). Si llega, `conn` se ignora. */
  get doc(): unknown { return this.#doc; }
  set doc(v: unknown) {
    this.#doc = v && typeof v === 'object' ? v : null;
    const activo = this.#montajeNodo?.firstElementChild as DriverHost | null;
    if (!activo) return;
    if (this.#doc != null) {
      activo.doc = this.#doc;
      activo.conn = null;
    }
  }

  get driver(): DocsDriver['id'] { return this.#driver; }
  set driver(v: DocsDriver['id']) {
    if (v === this.#driver) return;
    this.#driver = driverMeta(v).id;
    writeDriver(this.#driver);
    if (this.isConnected) this.#montarDriver();
  }

  connectedCallback(): void {
    this.addEventListener('docs-driver-change', (e) => {
      const elegido = (e as CustomEvent).detail?.driver as DocsDriver['id'] | undefined;
      if (elegido) this.driver = elegido;
    });
    this.#render();
  }

  #montarDriver(): void {
    const zona = this.#montajeNodo;
    if (!zona) return;
    const nodo = document.createElement(this.#driver) as DriverHost;
    this.#doc ??= parseAttrJson(this.getAttribute('doc'));
    this.#conn ??= parseAttrJson(this.getAttribute('conn')) as DocsConn | null;
    // `doc` gana: si hay documento quemado, no se reenvía `conn` (se ignora por completo).
    if (this.#doc != null) {
      nodo.doc = this.#doc;
    } else if (this.#conn) {
      nodo.conn = this.#conn;
    }
    zona.replaceChildren(nodo);
  }

  #render(): void {
    this.#root.replaceChildren();
    this.#root.append(html`<div class="montaje"></div>`);
    this.#montajeNodo = this.#root.querySelector('.montaje');
    this.#montarDriver();
    adoptCss(this.#root, import.meta.url, 'docs-viewer');
  }
}

precargarCss(import.meta.url, 'docs-viewer');
define('docs-viewer', DocsViewer);
export { DocsViewer };
