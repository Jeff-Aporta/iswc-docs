/**
 * <docs-tag-group> — un tag de la spec con sus operaciones.
 *
 * Si hay `subgroups`, solo se usan para ordenar (la entidad va en el summary).
 * No se pintan divisores/subcarpetas: la lista queda plana bajo el tag.
 */

import { adoptCss, precargarCss, define, html, emitir } from './_shared.js';
import type { DocsOpTab } from '../../js/url-state.js';
import './docs-operation.js';

type Props = {
  group: DocsGrupo | null;
  spec: DocsSpec | null;
  serverBase: string;
  authEnabled: boolean;
  docIndex: Record<string, string>;
  /** `operationId` de la operación abierta, o vacío. */
  opAbierta: string;
  opTab: DocsOpTab;
};

class DocsTagGroup extends HTMLElement {
  #root: ShadowRoot;
  #props: Props = {
    group: null,
    spec: null,
    serverBase: '',
    authEnabled: false,
    docIndex: {},
    opAbierta: '',
    opTab: 'try',
  };

  /** `operationId` → nodo, para no rehacer la lista al abrir una tarjeta. */
  #nodos = new Map<string, HTMLElement>();

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

    // Solo cambió qué está abierto: se actualizan las tarjetas en su sitio.
    const soloEstado =
      previo.group === this.#props.group &&
      previo.spec === this.#props.spec &&
      previo.docIndex === this.#props.docIndex;

    if (soloEstado) this.#sincronizar();
    else this.#render();
  }

  #sincronizar(): void {
    const { opAbierta, opTab, serverBase, authEnabled } = this.#props;
    for (const [id, nodo] of this.#nodos) {
      (nodo as HTMLElement & { props: unknown }).props = {
        abierto: id === opAbierta,
        tab: opTab,
        serverBase,
        authEnabled,
      };
    }
  }

  #tarjeta(op: DocsOp): HTMLElement {
    const { spec, serverBase, authEnabled, docIndex, opAbierta, opTab } = this.#props;
    const nodo = document.createElement('docs-operation');
    (nodo as HTMLElement & { props: unknown }).props = {
      op,
      spec,
      serverBase,
      authEnabled,
      docMd: docIndex?.[op.operationId] ?? '',
      abierto: op.operationId === opAbierta,
      tab: opTab,
    };
    // Los eventos se reemiten sin tocarlos: quien decide es `docs-app`, que es
    // el dueño de la URL. Un grupo no puede saber qué hay abierto en otro.
    nodo.addEventListener('docs-op-toggle', (e) => emitir(this, 'docs-op-toggle', (e as CustomEvent).detail));
    nodo.addEventListener('docs-op-tab', (e) => emitir(this, 'docs-op-tab', (e as CustomEvent).detail));
    nodo.addEventListener('docs-need-login', (e) => emitir(this, 'docs-need-login', (e as CustomEvent).detail));
    this.#nodos.set(op.operationId, nodo);
    return nodo;
  }

  #render(): void {
    const { group } = this.#props;
    this.#root.replaceChildren();
    this.#nodos.clear();

    if (!group) {
      adoptCss(this.#root, import.meta.url, 'docs-tag-group');
      return;
    }

    // Subgrupos solo definen orden; la entidad va en el summary, no como divisor.
    const ops = group.subgroups.length
      ? group.subgroups.flatMap((sub) => sub.operations)
      : group.operations;
    const cuerpo = html`<div class="operaciones">${ops.map((op) => this.#tarjeta(op))}</div>`;

    this.#root.append(html`
      <section class="grupo">
        <header class="cabecera">
          <h2 class="titulo">
            ${group.name}
            <span class="contador">${group.operations.length}</span>
          </h2>
          ${group.description ? html`<p class="descripcion">${group.description}</p>` : null}
        </header>
        ${cuerpo}
      </section>
    `);

    adoptCss(this.#root, import.meta.url, 'docs-tag-group');
  }
}

precargarCss(import.meta.url, 'docs-tag-group');
define('docs-tag-group', DocsTagGroup);
export { DocsTagGroup };
