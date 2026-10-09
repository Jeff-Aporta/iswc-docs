/**
 * <docs-operation> — tarjeta desplegable de una operación.
 *
 * El contenido se monta **al abrir**, no al pintar la lista: una spec con
 * doscientos endpoints crearía doscientos `docs-try` con sus campos y su CSS
 * antes de que nadie mire ninguno.
 *
 * El estado abierto/pestaña se refleja en la URL (`?s=` → `op` / `opt`) para que un
 * enlace lleve a la operación exacta que alguien quiere enseñar.
 */

import { adoptCss, precargarCss, define, html, emitir } from './_shared.js';
import { operationRequiresBearer, jsonPretty } from '../../js/openapi.js';
import { OP_TAB_DEFAULT, type DocsOpTab } from '../../js/url-state.js';
import './docs-method.js';
import './docs-path.js';
import './docs-try.js';
import './docs-responses.js';
import './docs-doc.js';
import './docs-json.js';

type Props = { op: DocsOp | null; spec: DocsSpec | null; serverBase: string; authEnabled: boolean; docMd: string; abierto: boolean; tab: DocsOpTab; };

const PESTANAS: Array<{ id: DocsOpTab; label: string; icon: string }> = [
  { id: 'try', label: 'Probar', icon: 'mdi:play-circle-outline' },
  { id: 'examples', label: 'Respuestas', icon: 'mdi:reply-outline' },
  { id: 'doc', label: 'Doc', icon: 'mdi:book-open-page-variant' },
];

class DocsOperation extends HTMLElement {
  #root: ShadowRoot;
  #props: Props = {
    op: null,
    spec: null,
    serverBase: '',
    authEnabled: false,
    docMd: '',
    abierto: false,
    tab: OP_TAB_DEFAULT,
  };

  #cuerpoNodo: HTMLElement | null = null;
  /** Ya se montó el contenido de esta apertura (evita rehacerlo al cambiar de pestaña). */
  #montado = false;

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
    const previo = { ...this.#props };
    this.#props = { ...this.#props, ...(v ?? {}) };
    if (!this.isConnected) return;

    const cambioEstructura =
      previo.op !== this.#props.op ||
      previo.spec !== this.#props.spec ||
      previo.abierto !== this.#props.abierto;

    if (cambioEstructura) {
      this.#montado = false;
      this.#render();
      return;
    }
    // Cambiar de pestaña o de servidor no rehace la tarjeta entera.
    if (previo.tab !== this.#props.tab || previo.serverBase !== this.#props.serverBase) this.#pintarCuerpo();
  }

  #contenidoPestana(): Node | null {
    const { op, spec, serverBase, authEnabled, docMd, tab } = this.#props;
    if (!op) return null;

    if (tab === 'doc') {
      const doc = document.createElement('docs-doc');
      (doc as HTMLElement & { props: unknown }).props = {
        markdown: docMd || op.description || '',
        vacio: 'Esta operación no trae documentación en el documento.',
      };
      return doc;
    }

    if (tab === 'examples') {
      const resp = document.createElement('docs-responses');
      (resp as HTMLElement & { props: unknown }).props = { responses: op.responses ?? null };

      // El schema de entrada solo tiene sentido junto a las respuestas: en
      // «Probar» ya está el editor con el ejemplo cargado.
      const schema = op.requestBody?.content?.['application/json']?.schema;
      if (!schema) return resp;

      const json = document.createElement('docs-json');
      (json as HTMLElement & { props: unknown }).props = { value: jsonPretty(schema), maxHeight: '20rem' };

      return html`
        <div class="ejemplos">
          <section>
            <h4 class="subtitulo">Cuerpo esperado (schema)</h4>
            ${json}
          </section>
          <section>
            <h4 class="subtitulo">Respuestas</h4>
            ${resp}
          </section>
        </div>
      `;
    }

    const probar = document.createElement('docs-try');
    (probar as HTMLElement & { props: unknown }).props = { op, spec, serverBase, authEnabled };
    probar.addEventListener('docs-need-login', (e) =>
      emitir(this, 'docs-need-login', (e as CustomEvent).detail),
    );
    return probar;
  }

  #pintarCuerpo(): void {
    const zona = this.#cuerpoNodo;
    if (!zona) return;

    const { tab } = this.#props;
    for (const t of zona.parentElement?.querySelectorAll('.pestana') ?? []) {
      t.toggleAttribute('selected', (t as HTMLElement).dataset.tab === tab);
    }
    zona.replaceChildren();
    const contenido = this.#contenidoPestana();
    if (contenido) zona.append(contenido);
    this.#montado = true;
  }

  #render(): void {
    const { op, spec, abierto, authEnabled, tab } = this.#props;
    this.#root.replaceChildren();
    this.#cuerpoNodo = null;

    if (!op) {
      adoptCss(this.#root, import.meta.url, 'docs-operation');
      return;
    }

    const requiereJwt = authEnabled && operationRequiresBearer(op, spec);

    const metodo = document.createElement('docs-method');
    (metodo as HTMLElement & { props: unknown }).props = { method: op.method };
    const ruta = document.createElement('docs-path');
    (ruta as HTMLElement & { props: unknown }).props = { path: op.path };

    this.#root.append(html`
      <iswc-details
        class="tarjeta"
        variant="outlined"
        data-method="${op.method}"
        ${abierto ? 'open' : ''}
        oniswc-show=${() => emitir(this, 'docs-op-toggle', { operationId: op.operationId, abierto: true })}
        oniswc-hide=${() => emitir(this, 'docs-op-toggle', { operationId: op.operationId, abierto: false })}
      >
        <div slot="summary" class="resumen">
          ${metodo}
          ${requiereJwt
            ? html`
                <span class="candado" title="Requiere Authorization: Bearer &lt;JWT&gt;" aria-label="Requiere sesión">
                  <iswc-icon icon="mdi:lock-outline"></iswc-icon>
                </span>
              `
            : null}
          ${ruta}
          <span class="sumario">${op.summary ?? ''}</span>
          ${op.deprecated ? html`<iswc-tag color="warning" variant="outlined" class="obsoleta">obsoleta</iswc-tag>` : null}
        </div>

        ${abierto
          ? html`
              <div class="cuerpo">
                ${op.description && op.summary && op.description !== op.summary
                  ? html`<p class="descripcion">${op.description}</p>`
                  : null}

                <nav class="pestanas" role="tablist">
                  ${PESTANAS.map(
                    (p) => html`
                      <button
                        type="button"
                        class="pestana"
                        role="tab"
                        data-tab="${p.id}"
                        ${p.id === tab ? 'selected' : ''}
                        aria-selected="${p.id === tab ? 'true' : 'false'}"
                        onclick=${() => emitir(this, 'docs-op-tab', { operationId: op.operationId, tab: p.id })}
                      >
                        <iswc-icon icon="${p.icon}"></iswc-icon>
                        ${p.label}
                      </button>
                    `,
                  )}
                </nav>

                <div class="zona-pestana"></div>
              </div>
            `
          : null}
      </iswc-details>
    `);

    this.#cuerpoNodo = this.#root.querySelector('.zona-pestana');
    if (abierto && !this.#montado) this.#pintarCuerpo();

    adoptCss(this.#root, import.meta.url, 'docs-operation');
  }
}

precargarCss(import.meta.url, 'docs-operation');
define('docs-operation', DocsOperation);
export { DocsOperation };
