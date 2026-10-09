/**
 * <docs-doc-reload> — actualiza el documento desde la API (invalida cache 24 h).
 *
 * Solo icono. Emite `docs-doc-reload`; `docs-app` / `docs-minidoc` escuchan y
 * vuelven a `loadViewerDocument({ force: true })`.
 */

import { crearComponente, define, emitir, html } from './_shared.js';

const DocsDocReload = crearComponente<Record<string, never>>(
  import.meta.url,
  (root, _props, host) => {
    root.append(html`
      <iswc-button
        class="btn"
        variant="plain"
        color="neutral"
        aria-label="Actualizar documentación"
        title="Actualizar desde el servidor (ignora cache local de 24 h)"
        oniswc-click=${() => emitir(host, 'docs-doc-reload', null)}
      >
        <iswc-icon icon="mdi:refresh"></iswc-icon>
      </iswc-button>
    `);
  },
  {},
  'docs-doc-reload',
);

define('docs-doc-reload', DocsDocReload);
export { DocsDocReload };
