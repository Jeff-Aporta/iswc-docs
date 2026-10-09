/**
 * <docs-path> — ruta de la operación con los `{parámetros}` resaltados.
 *
 * Distinguir el segmento variable del literal es lo que hace escaneable una
 * lista de rutas parecidas (`/tercero/{id}` vs `/tercero/lista`), y evita
 * leer mal un `{id}` como parte fija del path.
 */

import { crearComponente, define, html, raw, esc } from './_shared.js';

type Props = { path: string; };

/** Parte por `{param}` conservando los delimitadores para poder marcarlos. */
const marcar = (path: string): string =>
  esc(path).replace(/\{(\w+)\}/g, '<span class="param">{$1}</span>');

const DocsPath = crearComponente<Props>(
  import.meta.url,
  (root, { path }) => {
    root.append(html`<code class="ruta" title="${path}">${raw(marcar(String(path ?? '')))}</code>`);
  },
  { path: '' },
  'docs-path',
);

define('docs-path', DocsPath);
export { DocsPath };
