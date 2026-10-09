/**
 * <docs-minidoc> — segundo driver del visor: una operación por vista, no acordeones.
 *
 * Es una alternativa completa a `docs-app`, no un modo suyo. Los dos leen el mismo documento con
 * el mismo dominio (`js/config`, `js/openapi`, `js/nav`), pero lo presentan distinto:
 *
 *   - `docs-app`     lista por tags y despliega la operación en su sitio. Bueno para barrer una
 *                  API entera y comparar endpoints vecinos.
 *   - `docs-minidoc` índice a la izquierda, la operación elegida ocupando la página, y la
 *                  petición y la respuesta fijas a la derecha. Bueno para integrar un endpoint
 *                  concreto sin perderlo de vista mientras se escribe el código.
 *
 * No entran en conflicto: son dos custom elements distintos, cada uno con su shadow y su hoja,
 * y ninguno registra el tag del otro. Una página monta el que quiera; montar los dos a la vez
 * funciona, solo que se duplicaría la carga del documento.
 *
 * El estado vive aquí, igual que en `docs-app`: la operación abierta se refleja en `?s=.op` para que
 * un enlace lleve a la página exacta que alguien quiere enseñar.
 */

import { adoptCss, precargarCss, define, html, avisar } from './_shared.js';
import { loadViewerDocument, resolveBootConfig } from '../../js/config.js';
import type { DocsConn } from '../../js/conn.js';
import { buildDocIndex, groupOperationsByTag, operationRequiresBearer, sortGroupsBySpecOrder } from '../../js/openapi.js';
import { filterGroupsByQuery } from '../../js/nav.js';
import { inferDefaultServerBase, readServerFromUrl } from '../../js/server-base.js';
import { mergeUrlState, readUrlState, subscribeUrlState } from '../../js/url-state.js';
import { getStoredJwt, resolveAuthConfig } from '../../js/auth.js';
import './docs-method.js';
import './docs-auth.js';
import './docs-layout.js';
import './docs-driver-switch.js';
import './docs-doc-actions.js';
import './docs-minidoc-view.js';
import './docs-minidoc-code.js';
import './docs-home.js';

class DocsMinidoc extends HTMLElement {
  #root: ShadowRoot;

  #config: DocsConfig = {};
  #auth: DocsAuthConfig = {};
  #spec: DocsSpec | null = null;
  #grupos: DocsGrupo[] = [];
  #docIndex: Record<string, string> = {};
  #session: DocsSesion | null = null;
  #serverBase = '';

  #opAbierta = '';
  #query = '';

  #estado: 'cargando' | 'listo' | 'error' = 'cargando';
  #error = '';
  #recargando = false;

  #indiceNodo: HTMLElement | null = null;
  #centroNodo: HTMLElement | null = null;
  #codigoNodo: HTMLElement | null = null;
  #desuscribir: (() => void) | null = null;

  /** Conn entregado por el anfitrión. Mismo contrato que `docs-app`. */
  #conn: DocsConn | null = null;
  #doc: unknown = null;

  #onDocReload = (): void => {
    void this.#cargar({ force: true });
  };

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  get doc(): unknown { return this.#doc; }
  set doc(v: unknown) {
    this.#doc = v && typeof v === 'object' ? v : null;
    if (this.isConnected) void this.#cargar();
  }

  #docDesdeAtributo(): unknown {
    const rawAttr = this.getAttribute('doc');
    if (!rawAttr?.trim()) return null;
    try {
      const parsed = JSON.parse(rawAttr) as unknown;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  get conn(): DocsConn | null { return this.#conn; }
  set conn(v: DocsConn | null) {
    this.#conn = v && typeof v === 'object' ? v : null;
    if (this.isConnected) void this.#cargar();
  }

  #connDesdeAtributo(): DocsConn | null {
    const rawAttr = this.getAttribute('conn');
    if (!rawAttr?.trim()) return null;
    try {
      const parsed = JSON.parse(rawAttr) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as DocsConn) : null;
    } catch {
      return null;
    }
  }

  connectedCallback(): void {
    this.#opAbierta = readUrlState().op;

    this.#desuscribir = subscribeUrlState((estado) => {
      // Solo el «atrás» del navegador: si ya coincide, el aviso viene de nuestra escritura.
      // Volver a una entrada sin `op` es volver al home del documento.
      const op = this.#opValida(estado.op);
      if (op === this.#opAbierta) return;
      this.#opAbierta = op;
      this.#sincronizarSeleccion();
    });

    this.addEventListener('docs-doc-reload', this.#onDocReload);
    this.#render();
    void this.#cargar();
  }

  disconnectedCallback(): void {
    this.removeEventListener('docs-doc-reload', this.#onDocReload);
    this.#desuscribir?.();
    this.#desuscribir = null;
  }

  async #cargar(opts: { force?: boolean } = {}): Promise<void> {
    if (opts.force && this.#recargando) return;
    if (opts.force) {
      this.#recargando = true;
      avisar('Actualizando documentación…', 'brand');
    }
    try {
      const doc = this.#doc ?? this.#docDesdeAtributo();
      // Si hay `doc`, `conn` se ignora por completo.
      const boot = resolveBootConfig(
        doc != null ? null : (this.#conn ?? this.#connDesdeAtributo()),
        doc,
      );
      const { config, spec } = await loadViewerDocument(boot, { force: opts.force });

      this.#config = config;
      this.#auth = resolveAuthConfig(config);
      this.#spec = spec;
      this.#grupos = sortGroupsBySpecOrder(groupOperationsByTag(spec), spec);
      this.#docIndex = buildDocIndex(spec);
      this.#session = this.#auth.enabled ? getStoredJwt() : null;
      this.#serverBase = readServerFromUrl() || inferDefaultServerBase(spec, config);
      // Sin operación en la URL se abre el home (`info.description`).
      this.#opAbierta = this.#opValida(this.#opAbierta);
      this.#estado = 'listo';
      if (opts.force) avisar('Documentación actualizada', 'success');
    } catch (e) {
      this.#estado = 'error';
      this.#error = (e as Error)?.message ?? String(e);
      if (opts.force) avisar(this.#error, 'danger');
    } finally {
      this.#recargando = false;
    }
    this.#render();
  }

  get #todas(): DocsOp[] {
    return this.#grupos.flatMap((g) => g.operations);
  }

  /** El id si existe en el documento; si no, home (cadena vacía). */
  #opValida(id: string): string {
    if (id && this.#todas.some((o) => o.operationId === id)) return id;
    return '';
  }

  get #gruposVisibles(): DocsGrupo[] {
    return filterGroupsByQuery(this.#grupos, this.#query);
  }

  get #op(): DocsOp | null {
    return this.#todas.find((o) => o.operationId === this.#opAbierta) ?? null;
  }

  get #grupoDeOp(): string {
    const id = this.#opAbierta;
    return this.#grupos.find((g) => g.operations.some((o) => o.operationId === id))?.name ?? '';
  }

  #seleccionar(operationId: string): void {
    if (operationId === this.#opAbierta) return;
    this.#opAbierta = operationId;
    mergeUrlState({ op: operationId });
    this.#sincronizarSeleccion();
  }

  /** Logo / inicio: vuelve al home y limpia la operación en la URL. */
  #irHome(): void {
    if (!this.#opAbierta) return;
    this.#opAbierta = '';
    mergeUrlState({ op: '' }, { push: false });
    this.#sincronizarSeleccion();
  }

  /** Repinta solo lo que depende de la operación o del home: el shell y el índice se quedan. */
  #sincronizarSeleccion(): void {
    for (const b of this.#root.querySelectorAll('.op')) {
      b.toggleAttribute('data-activo', (b as HTMLElement).dataset.op === this.#opAbierta);
    }

    const centro = this.#centroNodo;
    if (centro) {
      centro.replaceChildren();
      if (!this.#opAbierta) {
        const home = document.createElement('docs-home');
        (home as HTMLElement & { props: unknown }).props = { spec: this.#spec };
        centro.append(home);
      } else {
        const op = this.#op;
        const requiereBearer = this.#auth.enabled && operationRequiresBearer(op ?? undefined, this.#spec);
        const vista = document.createElement('docs-minidoc-view');
        (vista as HTMLElement & { props: unknown }).props = {
          op,
          spec: this.#spec,
          grupo: this.#grupoDeOp,
          serverBase: this.#serverBase,
          authEnabled: this.#auth.enabled,
          docMd: op ? (this.#docIndex[op.operationId] ?? '') : '',
        };
        centro.append(vista);
        vista.scrollIntoView({ block: 'start' });
        if (this.#codigoNodo) {
          (this.#codigoNodo as HTMLElement & { props: unknown }).props = {
            op,
            spec: this.#spec,
            serverBase: this.#serverBase,
            requiereBearer,
          };
        }
        return;
      }
    }

    if (this.#codigoNodo) {
      (this.#codigoNodo as HTMLElement & { props: unknown }).props = {
        op: null,
        spec: this.#spec,
        serverBase: this.#serverBase,
        requiereBearer: false,
      };
    }
  }

  /** `html` devuelve un fragmento, no un elemento; el retorno lo refleja. */
  #filaOp(o: DocsOp): DocumentFragment {
    const metodo = document.createElement('docs-method');
    (metodo as HTMLElement & { props: unknown }).props = { method: o.method };
    const ruta = String(o.path || '');
    const requiereJwt = this.#auth.enabled && operationRequiresBearer(o, this.#spec);
    const candado = requiereJwt
      ? html`<iswc-icon class="op-lock" icon="mdi:lock" title="Requiere JWT" aria-label="Requiere JWT"></iswc-icon>`
      : html`<span class="op-lock op-lock--vacio" aria-hidden="true"></span>`;
    return html`
      <button
        type="button"
        class="op"
        data-op="${o.operationId}"
        title="${ruta}"
        ${o.operationId === this.#opAbierta ? 'data-activo' : ''}
        onclick=${() => this.#seleccionar(o.operationId)}
      >
        ${candado}
        ${metodo}
        <span class="op-texto">
          <span class="op-nombre">${o.summary || o.operationId}</span>
          <span class="op-path">${ruta}</span>
        </span>
      </button>
    `;
  }

  #pintarIndice(): void {
    const zona = this.#indiceNodo;
    if (!zona) return;

    const grupos = this.#gruposVisibles.map((g) => {
      // Subgrupos solo ordenan (entidad en el summary); sin divisores en el índice.
      const ops = g.subgroups.length
        ? g.subgroups.flatMap((sub) => sub.operations)
        : g.operations;

      return html`
        <section class="grupo">
          <h3 class="grupo-titulo">${g.name}</h3>
          ${ops.map((o) => this.#filaOp(o))}
        </section>
      `;
    });

    zona.replaceChildren(...(grupos.length ? grupos : [html`<p class="sin-resultados">Sin coincidencias.</p>`]));
  }

  #render(): void {
    this.#root.replaceChildren();
    this.#indiceNodo = null;
    this.#centroNodo = null;
    this.#codigoNodo = null;

    if (this.#estado === 'cargando') {
      this.#root.append(html`<div class="centrado"><iswc-spinner></iswc-spinner></div>`);
      adoptCss(this.#root, import.meta.url, 'docs-minidoc');
      return;
    }

    if (this.#estado === 'error') {
      this.#root.append(html`
        <div class="centrado">
          <iswc-callout color="danger" variant="outlined">
            <strong>No se pudo cargar la documentación.</strong>
            <p>${this.#error}</p>
          </iswc-callout>
        </div>
      `);
      adoptCss(this.#root, import.meta.url, 'docs-minidoc');
      return;
    }

    const titulo = this.#config.brand?.title || this.#spec?.info?.title || 'API';

    const codigo = document.createElement('docs-minidoc-code');

    const autenticacion = document.createElement('docs-auth');
    (autenticacion as HTMLElement & { props: unknown }).props = { authEnabled: this.#auth.enabled, auth: this.#auth, session: this.#session };
    autenticacion.addEventListener('docs-session-change', (e) => {
      this.#session = ((e as CustomEvent).detail as { session: DocsSesion | null })?.session ?? null;
    });

    const docAcciones = document.createElement('docs-doc-actions');
    (docAcciones as HTMLElement & { props: unknown }).props = { spec: this.#spec, config: this.#config };

    const iconoMarca = this.#config.brand?.icon || 'mdi:api';

    this.#root.append(html`
      <docs-layout>
        <div slot="cabecera" class="cabecera">
          <button type="button" class="marca" aria-label="Ir al inicio" title="Ir al inicio" onclick=${() => this.#irHome()}>
            <iswc-icon class="marca-logo" icon="${iconoMarca}"></iswc-icon>
            <span class="marca-texto">${titulo}</span>
          </button>
          <iswc-input
            class="buscar"
            type="search"
            placeholder="Buscar endpoint…"
            oniswc-input=${(e: Event) => {
              this.#query = String((e.target as HTMLInputElement).value ?? '');
              this.#pintarIndice();
            }}
          ></iswc-input>
          ${autenticacion}
          ${docAcciones}
          <docs-driver-switch></docs-driver-switch>
          <iswc-theme-toggle></iswc-theme-toggle>
        </div>

        <nav slot="inicio" class="indice" aria-label="Índice de endpoints"></nav>
        <div slot="centro" class="centro"></div>
        <div slot="fin">${codigo}</div>
      </docs-layout>
    `);

    this.#indiceNodo = this.#root.querySelector('.indice');
    this.#centroNodo = this.#root.querySelector('.centro');
    this.#codigoNodo = codigo;

    this.#pintarIndice();
    this.#sincronizarSeleccion();
    adoptCss(this.#root, import.meta.url, 'docs-minidoc');
  }
}

precargarCss(import.meta.url, 'docs-minidoc');
define('docs-minidoc', DocsMinidoc);
export { DocsMinidoc };
