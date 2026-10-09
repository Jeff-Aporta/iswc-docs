/**
 * <docs-home> — portada del visor: título, versión y `info.description` completa.
 *
 * La descripción viene en Markdown (con HTML embebido vía `iswc-md-render` en `docs-doc`).
 * Es la misma fuente que OpenAPI `info.description`; el JSON doc del ISS la define.
 */

import { crearComponente, define, html } from './_shared.js';
import './docs-doc.js';

type Props = { spec: DocsSpec | null; };

const DocsHome = crearComponente<Props>(
  import.meta.url,
  (root, { spec }) => {
    const info = spec?.info;
    if (!info) {
      root.append(html`
        <div class="vacio">
          <p>Elige una operación en el índice para ver su documentación.</p>
        </div>
      `);
      return;
    }

    const descripcion = String(info.description ?? '').trim();
    let doc: HTMLElement | null = null;
    if (descripcion) {
      doc = document.createElement('docs-doc');
      (doc as HTMLElement & { props: unknown }).props = { markdown: descripcion };
    }

    root.append(html`
      <article class="home">
        <header class="home-cab">
          <h1 class="home-titulo">${info.title ?? 'API'}</h1>
          ${info.version ? html`<p class="home-version">v${info.version}</p>` : null}
        </header>
        ${doc
          ? html`<div class="home-doc">${doc}</div>`
          : html`
              <iswc-callout color="neutral" variant="plain" icon="mdi:book-open-page-variant-outline">
                Elige una operación en el índice para ver su documentación.
              </iswc-callout>
            `}
      </article>
    `);
  },
  { spec: null },
  'docs-home',
);

define('docs-home', DocsHome);
export { DocsHome };
