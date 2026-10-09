/**
 * <docs-info> — cabecera del documento: título y descripción general (`info.description`).
 *
 * En el driver clásico (`docs-app`) es la portada: la descripción va entera vía `docs-doc`,
 * no colapsada, porque es el home al pulsar el logo.
 */

import { crearComponente, define, html } from './_shared.js';
import './docs-doc.js';

type Props = { spec: DocsSpec | null; };

const DocsInfo = crearComponente<Props>(
  import.meta.url,
  (root, { spec }) => {
    const info = spec?.info;
    if (!info) return;

    const descripcion = String(info.description ?? '').trim();
    let doc: HTMLElement | null = null;
    if (descripcion) {
      doc = document.createElement('docs-doc');
      (doc as HTMLElement & { props: unknown }).props = { markdown: descripcion };
    }

    root.append(html`
      <header class="info">
        <div class="linea">
          <h1 class="titulo">${info.title ?? 'API'}</h1>
          ${info.version ? html`<span class="version">v${info.version}</span>` : null}
        </div>
        ${doc ? html`<div class="descripcion">${doc}</div>` : null}
      </header>
    `);
  },
  { spec: null },
  'docs-info',
);

define('docs-info', DocsInfo);
export { DocsInfo };
