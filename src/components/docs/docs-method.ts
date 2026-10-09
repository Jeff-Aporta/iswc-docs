/**
 * <docs-method> — chip del método HTTP.
 *
 * Ancho fijo ≈ `DELETE` (verbo más largo) para alinear la columna de títulos
 * sin el sobrante de un rem arbitrario grande.
 */

import { crearComponente, define, html } from './_shared.js';
import { METHOD_COLOR } from '../../js/openapi.js';

type Props = { method: string; };

const DocsMethod = crearComponente<Props>(
  import.meta.url,
  (root, { method }) => {
    const m = String(method ?? '').toLowerCase();
    root.append(html`
      <iswc-tag class="metodo" color="${METHOD_COLOR[m] ?? 'neutral'}" variant="filled" data-method="${m}">
        ${m.toUpperCase()}
      </iswc-tag>
    `);
  },
  { method: 'get' },
  'docs-method',
);

define('docs-method', DocsMethod);
export { DocsMethod };
