/**
 * <sw-app> — shell del visor. Es el único dueño del estado.
 *
 * Todo lo demás (`sw-nav`, `sw-tag-group`, `sw-operation`, `sw-try`) es
 * controlado: recibe `props` y emite eventos. Concentrar el estado aquí es lo
 * que permite que la URL y la vista no puedan desincronizarse — hay una sola
 * escritura de `?tab/op/opt/server` y una sola lectura al arrancar.
 *
 * Ciclo: leer config → cargar spec → agrupar → pintar. Un fallo en cualquiera
 * de los pasos se enseña en pantalla con la URL que falló, no en la consola.
 */

import { adoptCss, precargarCss, define, html, avisar } from './_shared.js';
import { loadViewerDocument, resolveBootConfig } from '../../js/config.js';
import type { SwConn } from '../../js/conn.js';
import { buildDocIndex, groupOperationsByTag, sortGroupsBySpecOrder } from '../../js/openapi.js';
import { contarOperaciones, filterGroupsByNavTab, filterGroupsByQuery, resolveActiveNavTab, resolveVisibleNavTabs } from '../../js/nav.js';
import { inferDefaultServerBase, readServerFromUrl, serverOptions, writeServerToUrl } from '../../js/server-base.js';
import { mergeUrlState, readUrlState, subscribeUrlState, OP_TAB_DEFAULT, type SwOpTab } from '../../js/url-state.js';
import { getQuery, setQuery, clearSState } from '../../js/search-state.js';
import { getStoredJwt, resolveAuthConfig } from '../../js/auth.js';
import './sw-nav.js';
import './sw-info.js';
import './sw-server.js';
import './sw-tag-group.js';

class SwApp extends HTMLElement {
  #root: ShadowRoot;

  #config: SwConfig = {};
  #auth: SwAuthConfig = {};
  #spec: SwSpec | null = null;
  #grupos: SwGrupo[] = [];
  #docIndex: Record<string, string> = {};
  #session: SwSesion | null = null;
  #serverBase = '';

  #navTab = '';
  #opAbierta = '';
  #opTab: SwOpTab = 'try';
  #query = '';

  #estado: 'cargando' | 'listo' | 'error' = 'cargando';
  #error = '';
  #recargando = false;

  #navNodo: HTMLElement | null = null;
  #listaNodo: HTMLElement | null = null;
  #totalNodo: HTMLElement | null = null;
  #gruposNodos = new Map<string, HTMLElement>();
  #desuscribir: (() => void) | null = null;

  #onDocReload = (): void => {
    void this.#cargar({ force: true });
  };

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    const url = readUrlState();
    this.#navTab = url.tab;
    this.#opAbierta = url.op;
    this.#opTab = url.opTab;
    this.#query = getQuery();

    this.#desuscribir = subscribeUrlState((estado) => {
      // Volver a una entrada sin `tab` es volver al arranque, y el arranque activa la primera
      // sección: copiar el `''` tal cual dejaría la barra sin ninguna pestaña marcada.
      const tab = resolveActiveNavTab(this.#tabs, estado.tab);
      // Solo interesa el «atrás» del navegador: si el estado ya coincide, este
      // aviso viene de nuestra propia escritura y repintar sería trabajo doble.
      if (tab === this.#navTab && estado.op === this.#opAbierta && estado.opTab === this.#opTab) return;
      const tabCambio = tab !== this.#navTab;
      this.#navTab = tab;
      this.#opAbierta = estado.op;
      this.#opTab = estado.opTab;
      if (tabCambio) {
        this.#sincronizarNav();
        this.#pintarLista();
      }
      this.#sincronizarGrupos();
    });

    this.addEventListener('sw-doc-reload', this.#onDocReload);
    this.#render();
    void this.#cargar();
  }

  disconnectedCallback(): void {
    this.removeEventListener('sw-doc-reload', this.#onDocReload);
    this.#desuscribir?.();
    this.#desuscribir = null;
  }

  /* ── Carga ────────────────────────────────────────────────── */

  /**
   * Documento InSoft/OpenAPI quemado por el anfitrión (`doc=` o propiedad).
   * Gana sobre `conn` y sobre cualquier fetch a `paths.docs`.
   */
  #doc: unknown = null;

  get doc(): unknown { return this.#doc; }
  set doc(v: unknown) {
    this.#doc = v && typeof v === 'object' ? v : null;
    if (this.isConnected) void this.#cargar();
  }

  #docDesdeAtributo(): unknown {
    const raw = this.getAttribute('doc');
    if (!raw?.trim()) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Conn que le pasa el anfitrión, como objeto o como JSON en el atributo `conn`.
   * En ISS/PatyIA se prefiere `doc=`; `conn` queda para demos y `?conn=`.
   */
  #conn: SwConn | null = null;

  get conn(): SwConn | null { return this.#conn; }
  set conn(v: SwConn | null) {
    this.#conn = v && typeof v === 'object' ? v : null;
    // Solo recargar si ya estábamos montados: en el alta lo hace connectedCallback.
    if (this.isConnected) void this.#cargar();
  }

  /** Lee el atributo `conn` (JSON). Un JSON roto no debe dejar la página en blanco. */
  #connDesdeAtributo(): SwConn | null {
    const raw = this.getAttribute('conn');
    if (!raw?.trim()) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as SwConn) : null;
    } catch {
      return null;
    }
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
      this.#navTab = resolveActiveNavTab(resolveVisibleNavTabs(config, this.#session), this.#navTab);
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

  /* ── Estado derivado ──────────────────────────────────────── */

  get #tabs(): SwNavTab[] {
    return resolveVisibleNavTabs(this.#config, this.#session);
  }

  /**
   * Con query vacía, filtra por la pestaña activa. Con query, busca en todos
   * los tags: el usuario tecleó algo, no quiere que se lo esconda la nav.
   */
  get #gruposVisibles(): SwGrupo[] {
    const base = this.#query.trim()
      ? this.#grupos
      : filterGroupsByNavTab(this.#grupos, this.#tabs, this.#navTab);
    return filterGroupsByQuery(base, this.#query);
  }

  /* ── Acciones ─────────────────────────────────────────────── */

  #cambiarNavTab(tab: string): void {
    if (tab === this.#navTab) return;
    this.#navTab = tab;
    // Cambiar de sección puede ocultar la operación abierta; dejarla en la URL
    // haría que «atrás» la reabriera en una sección donde no existe.
    this.#opAbierta = '';
    mergeUrlState({ tab, op: '' });
    // Solo se actualizan dos cosas: la pestaña activa en la barra y la lista
    // filtrada. El shell (nav, info, server, theme) queda intacto, así no
    // hay flicker al cambiar de sección.
    this.#sincronizarNav();
    this.#pintarLista();
  }

  #buscar(query: string): void {
    this.#query = query;
    setQuery(query);
    this.#pintarLista();
  }

  #alternarOperacion(operationId: string, abierto: boolean): void {
    const siguiente = abierto ? operationId : '';
    if (siguiente === this.#opAbierta) return;
    this.#opAbierta = siguiente;
    mergeUrlState({ op: siguiente });
    this.#sincronizarGrupos();
  }

  #cambiarOpTab(operationId: string, tab: SwOpTab): void {
    this.#opAbierta = operationId;
    this.#opTab = tab;
    mergeUrlState({ op: operationId, opTab: tab });
    this.#sincronizarGrupos();
  }

  #cambiarServidor(serverBase: string): void {
    this.#serverBase = serverBase;
    writeServerToUrl(serverBase);
    this.#sincronizarGrupos();
  }

  #cambiarSesion(session: SwSesion | null): void {
    this.#session = session;
    // Las pestañas privadas aparecen o desaparecen con la sesión.
    this.#navTab = resolveActiveNavTab(this.#tabs, this.#navTab);
    // Sesión cambia la lista de pestañas: hay que repintar la barra y la lista.
    this.#sincronizarNav();
    this.#pintarLista();
  }

  /** Inicio: limpia búsqueda y operación; vuelve al home (`info.description`). */
  #reiniciar(): void {
    this.#query = '';
    this.#opAbierta = '';
    this.#opTab = OP_TAB_DEFAULT;
    this.#navTab = resolveActiveNavTab(this.#tabs, '');
    clearSState();
    // Inicio: estado inicial sin operación ni pestaña; reemplaza la URL actual.
    mergeUrlState({ tab: '', op: '', opTab: OP_TAB_DEFAULT }, { push: false });
    this.#sincronizarNav();
    this.#pintarLista();
  }

  /* ── Pintado ──────────────────────────────────────────────── */

  /** Solo cambia la pestaña activa en la barra: no toca el resto del shell. */
  #sincronizarNav(): void {
    if (this.#navNodo) {
      (this.#navNodo as HTMLElement & { props: unknown }).props = {
        activeTab: this.#navTab,
        tabs: this.#tabs,
        session: this.#session,
        query: this.#query,
      };
    }
  }

  #sincronizarGrupos(): void {
    for (const nodo of this.#gruposNodos.values()) {
      (nodo as HTMLElement & { props: unknown }).props = {
        serverBase: this.#serverBase,
        authEnabled: this.#auth.enabled === true,
        opAbierta: this.#opAbierta,
        opTab: this.#opTab,
      };
    }
  }

  #grupoNodo(group: SwGrupo): HTMLElement {
    const nodo = document.createElement('sw-tag-group');
    (nodo as HTMLElement & { props: unknown }).props = {
      group,
      spec: this.#spec,
      serverBase: this.#serverBase,
      authEnabled: this.#auth.enabled === true,
      docIndex: this.#docIndex,
      opAbierta: this.#opAbierta,
      opTab: this.#opTab,
    };
    nodo.addEventListener('sw-op-toggle', (e) => {
      const d = (e as CustomEvent<{ operationId: string; abierto: boolean }>).detail;
      this.#alternarOperacion(d.operationId, d.abierto);
    });
    nodo.addEventListener('sw-op-tab', (e) => {
      const d = (e as CustomEvent<{ operationId: string; tab: SwOpTab }>).detail;
      this.#cambiarOpTab(d.operationId, d.tab);
    });
    nodo.addEventListener('sw-need-login', (e) => {
      const d = (e as CustomEvent<{ hint?: string }>).detail;
      (this.#navNodo as (HTMLElement & { abrirLogin(h?: string): void }) | null)?.abrirLogin(d?.hint);
    });
    this.#gruposNodos.set(group.name, nodo);
    return nodo;
  }

  #pintarLista(): void {
    const zona = this.#listaNodo;
    if (!zona) return;

    zona.replaceChildren();
    this.#gruposNodos.clear();

    const grupos = this.#gruposVisibles;
    const total = contarOperaciones(grupos);
    if (this.#totalNodo) {
      this.#totalNodo.textContent = `${total} ${total === 1 ? 'operación' : 'operaciones'}`;
    }

    if (!grupos.length) {
      zona.append(html`
        <iswc-callout color="neutral" variant="filled-outlined" icon="mdi:magnify-close">
          ${this.#query
            ? `Ninguna operación coincide con «${this.#query}».`
            : 'Esta sección no tiene operaciones.'}
        </iswc-callout>
      `);
      return;
    }

    for (const g of grupos) zona.append(this.#grupoNodo(g));
  }

  #render(): void {
    this.#root.replaceChildren();
    this.#navNodo = null;
    this.#listaNodo = null;
    this.#totalNodo = null;
    this.#gruposNodos.clear();

    if (this.#estado === 'cargando') {
      this.#root.append(html`
        <div class="cargando" role="status">
          <iswc-spinner></iswc-spinner>
          <p>Cargando documentación…</p>
        </div>
      `);
      adoptCss(this.#root, import.meta.url, 'sw-app');
      return;
    }

    if (this.#estado === 'error') {
      this.#root.append(html`
        <div class="fallo">
          <iswc-callout color="danger" variant="filled-outlined" icon="mdi:alert-octagon-outline">
            <h2 class="fallo-titulo">No se pudo cargar el documento</h2>
            <pre class="fallo-texto">${this.#error}</pre>
            <p class="fallo-pista">
              Quema el JSON en el atributo <code>doc</code> del componente, o deja el fallback
              <code>paths.docs</code> (default <code>/docs?v=json</code>).
            </p>
          </iswc-callout>
        </div>
      `);
      adoptCss(this.#root, import.meta.url, 'sw-app');
      return;
    }

    const nav = document.createElement('sw-nav');
    (nav as HTMLElement & { props: unknown }).props = {
      brand: this.#config.brand ?? {},
      tabs: this.#tabs,
      activeTab: this.#navTab,
      query: this.#query,
      spec: this.#spec,
      config: this.#config,
      authEnabled: this.#auth.enabled === true,
      auth: this.#auth,
      session: this.#session,
    };
    nav.addEventListener('sw-nav-tab', (e) => this.#cambiarNavTab((e as CustomEvent<{ tab: string }>).detail.tab));
    nav.addEventListener('sw-search', (e) => this.#buscar((e as CustomEvent<{ query: string }>).detail.query));
    nav.addEventListener('sw-session-change', (e) =>
      this.#cambiarSesion((e as CustomEvent<{ session: SwSesion | null }>).detail.session),
    );
    nav.addEventListener('sw-reset', () => this.#reiniciar());
    this.#navNodo = nav;

    const info = document.createElement('sw-info');
    (info as HTMLElement & { props: unknown }).props = { spec: this.#spec };

    let servidor: HTMLElement | null = null;
    if (this.#config.serverSelect !== false) {
      servidor = document.createElement('sw-server');
      (servidor as HTMLElement & { props: unknown }).props = {
        value: this.#serverBase,
        options: serverOptions(this.#spec, this.#config),
      };
      servidor.addEventListener('sw-server-change', (e) =>
        this.#cambiarServidor((e as CustomEvent<{ serverBase: string }>).detail.serverBase),
      );
    }

    this.#root.append(html`
      ${nav}
      <main class="lienzo">
        <div class="ancho">
          ${info}
          ${servidor}
          <p class="resumen-total"></p>
          <div class="grupos"></div>
        </div>
      </main>
    `);

    this.#totalNodo = this.#root.querySelector('.resumen-total');
    this.#listaNodo = this.#root.querySelector('.grupos');
    this.#pintarLista();

    adoptCss(this.#root, import.meta.url, 'sw-app');
  }
}

precargarCss(import.meta.url, 'sw-app');
define('sw-app', SwApp);
export { SwApp };
