/**
 * <sw-nav> — barra superior: marca, secciones, búsqueda y acciones.
 *
 * La búsqueda emite en cada tecla y no se debounce aquí: filtrar es una
 * operación en memoria sobre un array ya construido, y retrasarla se nota
 * como lentitud sin ahorrar nada.
 *
 * Eventos: sw-nav-tab { tab } · sw-search { query }
 */

import { adoptCss, precargarCss, define, html, emitir, esc } from './_shared.js';
import './sw-auth.js';
import './sw-driver-switch.js';
import './sw-doc-actions.js';

type Props = { brand: SwBrand; tabs: SwNavTab[]; activeTab: string; query: string; spec: SwSpec | null; config: SwConfig; authEnabled: boolean; auth: SwAuthConfig; session: SwSesion | null; };

class SwNav extends HTMLElement {
  #root: ShadowRoot;
  #props: Props = {
    brand: {},
    tabs: [],
    activeTab: '',
    query: '',
    spec: null,
    config: {},
    authEnabled: false,
    auth: {},
    session: null,
  };

  #authNodo: HTMLElement | null = null;

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
    // La búsqueda la escribe el usuario en este mismo shadow: repintar aquí
    // le quitaría el foco al campo en cada tecla.
    if (previo.query !== this.#props.query && Object.keys(v ?? {}).length === 1) return;
    this.#render();
  }

  /** `sw-app` delega aquí cuando una operación reclama sesión. */
  abrirLogin(hint?: string): void {
    (this.#authNodo as (HTMLElement & { abrirLogin(h?: string): void }) | null)?.abrirLogin(hint);
  }

  #render(): void {
    const { brand, tabs, activeTab, query, spec, config, authEnabled, auth, session } = this.#props;
    this.#root.replaceChildren();

    const autenticacion = document.createElement('sw-auth');
    (autenticacion as HTMLElement & { props: unknown }).props = { authEnabled, auth, session };
    autenticacion.addEventListener('sw-session-change', (e) =>
      emitir(this, 'sw-session-change', (e as CustomEvent).detail),
    );
    this.#authNodo = autenticacion;

    const docAcciones = document.createElement('sw-doc-actions');
    (docAcciones as HTMLElement & { props: unknown }).props = { spec, config };

    this.#root.append(html`
      <header class="barra">
        <button
          type="button"
          class="marca"
          aria-label="Ir al inicio"
          title="Ir al inicio"
          onclick=${() => emitir(this, 'sw-reset', null)}
        >
          ${brand?.icon ? html`<iswc-icon class="marca-icono" icon="${brand.icon}"></iswc-icon>` : null}
          <div class="marca-texto">
            <span class="marca-titulo">${brand?.title ?? spec?.info?.title ?? 'API'}</span>
            ${brand?.subtitle ? html`<span class="marca-sub">${brand.subtitle}</span>` : null}
          </div>
        </button>

        <iswc-input
          class="busqueda"
          type="search"
          clearable
          placeholder="Buscar ruta, resumen u operationId…"
          aria-label="Buscar operaciones"
          value="${query}"
          oniswc-input=${(e: Event) => emitir(this, 'sw-search', { query: String((e.target as HTMLInputElement).value ?? '') })}
        >
          <iswc-icon slot="start" icon="mdi:magnify"></iswc-icon>
        </iswc-input>

        <div class="acciones">
          ${docAcciones}
          ${autenticacion}
          <sw-driver-switch></sw-driver-switch>
          <iswc-theme-toggle></iswc-theme-toggle>
        </div>
      </header>

      ${query.trim()
        ? html`
            <div class="busqueda-titulo" role="status" aria-live="polite">
              <iswc-icon icon="mdi:magnify"></iswc-icon>
              <span>Resultados para <code class="busqueda-titulo__q">${esc(query)}</code></span>
              <button
                type="button"
                class="busqueda-limpiar"
                aria-label="Limpiar búsqueda"
                onclick=${() => emitir(this, 'sw-search', { query: '' })}
              >
                <iswc-icon icon="mdi:close"></iswc-icon>
                Limpiar
              </button>
            </div>
          `
        : tabs.length > 1
          ? html`
              <nav class="secciones" role="tablist" aria-label="Secciones">
                ${tabs.map(
                  (t) => html`
                    <button
                      type="button"
                      class="seccion"
                      role="tab"
                      ${t.id === activeTab ? 'selected' : ''}
                      aria-selected="${t.id === activeTab ? 'true' : 'false'}"
                      onclick=${() => emitir(this, 'sw-nav-tab', { tab: t.id })}
                    >
                      ${t.icon ? html`<iswc-icon icon="${t.icon}"></iswc-icon>` : null}
                      ${t.label}
                    </button>
                  `,
                )}
              </nav>
            `
          : null}
    `);

    adoptCss(this.#root, import.meta.url, 'sw-nav');
  }
}

precargarCss(import.meta.url, 'sw-nav');
define('sw-nav', SwNav);
export { SwNav };