/**
 * <docs-doc> — prosa Markdown vía `<iswc-md-render>` (kit is-webcomponents).
 *
 * El host debe haber cargado el tag `iswc-md-render` (y los `is-*` que el MD
 * embute: `iswc-code`, `iswc-flowchart`, …). El cuerpo va en un
 * `<script type="text/markdown">` hijo — no en el atributo `value` — para
 * que HTML embebido (`<iswc-flowchart>`, `<iswc-code>`) no se rompa por comillas.
 */

import { crearComponente, define, html } from './_shared.js';

type Props = {
  markdown: string;
  /** Texto cuando no hay documentación. */
  vacio: string;
};

const DocsDoc = crearComponente<Props>(
  import.meta.url,
  (root, { markdown, vacio }) => {
    const md = String(markdown ?? '').trim();
    if (!md) {
      root.append(html`
        <iswc-callout color="neutral" variant="plain" icon="mdi:book-off-outline">${vacio}</iswc-callout>
      `);
      return;
    }

    const render = document.createElement('iswc-md-render');
    render.className = 'md';
    render.setAttribute('readonly', '');
    const source = document.createElement('script');
    source.type = 'text/markdown';
    source.setAttribute('data-md-source', '');
    source.textContent = md;
    render.append(source);

    root.append(html`<div class="prosa">${render}</div>`);
  },
  { markdown: '', vacio: 'Esta operación no trae documentación en el documento.' },
  'docs-doc',
);

define('docs-doc', DocsDoc);
export { DocsDoc };
