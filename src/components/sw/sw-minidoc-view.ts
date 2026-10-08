/**
 * <sw-minidoc-view> — columna central del driver `sw-minidoc`: una operación, entera.
 *
 * A diferencia de `sw-operation`, aquí no hay acordeón ni pestañas: la operación seleccionada
 * se lee de arriba abajo como una página de manual — título, barra de endpoint, autorización,
 * parámetros agrupados por sitio (path, query, header, cookie) y cuerpo. Nada está plegado,
 * porque el driver ya filtró a una sola operación y esconder la mitad no ahorra nada.
 *
 * «Probar» abre `sw-try` en un panel anclado al botón (iswc-dropdown), no en un modal
 * centrado: queda pegado al trigger y no compite con la lectura del manual.
 */

import { adoptCss, precargarCss, define, html, emitir } from './_shared.js';
import { ejemploDeParam } from '../../js/curl.js';
import { jsonPretty, operationRequiresBearer, resolveParams } from '../../js/openapi.js';
import './sw-method.js';
import './sw-path.js';
import './sw-json.js';
import './sw-try.js';
import './sw-doc.js';

type Props = { op: SwOp | null; spec: SwSpec | null; grupo: string; serverBase: string; authEnabled: boolean; docMd: string; };

/** Orden de lectura de los parámetros: primero lo que va en la ruta, luego lo opcional. */
const SITIOS: Array<{ in: string; titulo: string }> = [
  { in: 'path', titulo: 'Parámetros de ruta' },
  { in: 'query', titulo: 'Parámetros de consulta' },
  { in: 'header', titulo: 'Cabeceras' },
  { in: 'cookie', titulo: 'Cookies' },
];

class SwMinidocView extends HTMLElement {
  #root: ShadowRoot;
  #props: Props = { op: null, spec: null, grupo: '', serverBase: '', authEnabled: false, docMd: '' };

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.#render();
  }

  get props(): Props {
    return this.#props;
  }

  set props(v: Partial<Props> | null | undefined) {
    this.#props = { ...this.#props, ...(v ?? {}) };
    if (this.isConnected) this.#render();
  }

  /** Ficha de un parámetro: nombre + tipo + obligatoriedad, descripción y ejemplo. */
  #ficha(p: SwParam): DocumentFragment {
    const schema = p.schema as { type?: string; format?: string; enum?: unknown[] } | undefined;
    const tipo = [schema?.type, schema?.format].filter(Boolean).join(' · ') || 'string';
    const ejemplo = ejemploDeParam(p);
    const opciones = Array.isArray(schema?.enum) ? schema?.enum ?? [] : [];

    return html`
      <article class="param">
        <div class="param-cab">
          <code class="param-nombre">${p.name}</code>
          <span class="param-tipo">${tipo}</span>
          ${p.required ? html`<span class="param-req">obligatorio</span>` : null}
        </div>
        ${p.description ? html`<p class="param-desc">${p.description}</p>` : null}
        ${opciones.length
          ? html`<p class="param-enum">Valores: ${opciones.map((o) => html`<code>${String(o)}</code>`)}</p>`
          : null}
        ${ejemplo && !ejemplo.startsWith('<')
          ? html`<p class="param-ej">Ejemplo: <code>${ejemplo}</code></p>`
          : null}
      </article>
    `;
  }

  #seccionParams(params: SwParam[]): DocumentFragment[] {
    return SITIOS.flatMap(({ in: sitio, titulo }) => {
      const propios = params.filter((p) => p.in === sitio);
      if (!propios.length) return [];
      return [
        html`
          <section class="bloque">
            <h2 class="bloque-titulo">${titulo}</h2>
            ${propios.map((p) => this.#ficha(p))}
          </section>
        `,
      ];
    });
  }

  #render(): void {
    const { op, spec, grupo, authEnabled, docMd } = this.#props;
    this.#root.replaceChildren();

    if (!op) {
      this.#root.append(html`
        <div class="vacio">
          <p>Elige una operación en el índice para ver su documentación.</p>
        </div>
      `);
      adoptCss(this.#root, import.meta.url, 'sw-minidoc-view');
      return;
    }

    const metodo = document.createElement('sw-method');
    (metodo as HTMLElement & { props: unknown }).props = { method: op.method };
    const ruta = document.createElement('sw-path');
    (ruta as HTMLElement & { props: unknown }).props = { path: op.path };

    const params = resolveParams(op, spec);
    const requiereBearer = authEnabled && operationRequiresBearer(op, spec);
    const schemaCuerpo = op.requestBody?.content?.['application/json']?.schema;

    let cuerpoJson: HTMLElement | null = null;
    if (schemaCuerpo) {
      cuerpoJson = document.createElement('sw-json');
      (cuerpoJson as HTMLElement & { props: unknown }).props = { value: jsonPretty(schemaCuerpo), maxHeight: '24rem' };
    }

    let docEl: HTMLElement | null = null;
    if (docMd) {
      docEl = document.createElement('sw-doc');
      (docEl as HTMLElement & { props: unknown }).props = { markdown: docMd };
    }

    const probar = document.createElement('sw-try');
    (probar as HTMLElement & { props: unknown }).props = {
      op,
      spec,
      serverBase: this.#props.serverBase,
      authEnabled,
    };
    probar.addEventListener('sw-need-login', (e) => emitir(this, 'sw-need-login', (e as CustomEvent).detail));

    this.#root.append(html`
      ${grupo ? html`<p class="eyebrow">${grupo}</p>` : null}
      <h1 class="titulo">${op.summary || op.operationId}</h1>
      ${op.description ? html`<p class="entradilla">${op.description}</p>` : null}

      <div class="endpoint">
        ${metodo}
        ${ruta}
        <iswc-dropdown class="probar-pop" placement="bottom-end" distance="6">
          <iswc-button slot="trigger" class="probar" variant="solid" color="success">
            Probar
            <iswc-icon slot="end" icon="mdi:play"></iswc-icon>
          </iswc-button>
          ${probar}
        </iswc-dropdown>
      </div>

      ${requiereBearer
        ? html`
            <section class="bloque">
              <h2 class="bloque-titulo">Autorización</h2>
              <article class="param">
                <div class="param-cab">
                  <code class="param-nombre">Authorization</code>
                  <span class="param-tipo">string · header</span>
                  <span class="param-req">obligatorio</span>
                </div>
                <p class="param-desc">Esquema <code>Bearer</code>. Inicia sesión en el visor y la cabecera se envía sola al probar.</p>
                <p class="param-ej">Ejemplo: <code>Authorization: Bearer &lt;token&gt;</code></p>
              </article>
            </section>
          `
        : null}

      ${this.#seccionParams(params)}

      ${cuerpoJson
        ? html`
            <section class="bloque">
              <h2 class="bloque-titulo">Cuerpo de la petición</h2>
              ${cuerpoJson}
            </section>
          `
        : null}

      ${docEl
        ? html`
            <section class="bloque">
              <h2 class="bloque-titulo">Notas</h2>
              ${docEl}
            </section>
          `
        : null}
    `);

    adoptCss(this.#root, import.meta.url, 'sw-minidoc-view');
  }
}

precargarCss(import.meta.url, 'sw-minidoc-view');
define('sw-minidoc-view', SwMinidocView);
export { SwMinidocView };
