/**
 * <docs-json> — bloque de código via `<iswc-code>` (kit is-webcomponents).
 *
 * Sin botón de copiar propio: quien embebe (p. ej. `docs-minidoc-code`) pone el
 * `iswc-copy-button` en la cabecera del panel. Así no quedan dos copys.
 *
 * `lang` tipico: `json` (respuestas / body) o `shell`/`curl` (petición cURL).
 */

import { crearComponente, define, html } from './_shared.js';

type Props = {
  value: string;
  /** Alto máximo antes de hacer scroll interno. */
  maxHeight: string;
  /** Lenguaje de `<iswc-code>` (json | shell | curl | …). */
  lang: string;
};

const DocsJson = crearComponente<Props>(
  import.meta.url,
  (root, { value, maxHeight, lang }, host) => {
    const texto = String(value ?? '');
    const idioma = String(lang || 'json').trim() || 'json';
    host.style.setProperty('--docs-json-max', maxHeight || '28rem');

    const code = document.createElement('iswc-code') as HTMLElement & {
      value?: string;
      lang?: string;
    };
    code.className = 'codigo';
    code.setAttribute('readonly', '');
    code.setAttribute('compact', '');
    code.setAttribute('wrap', '');
    code.setAttribute('line-numbers', 'false');
    code.setAttribute('lang', idioma);
    // Atributo + prop: si el CE aún no hizo upgrade, el attr sobrevive; si ya,
    // el setter deja el valor en #pendingValue antes del bootstrap.
    code.setAttribute('value', texto);
    code.lang = idioma;
    code.value = texto;

    root.append(html`<div class="caja"></div>`);
    root.querySelector('.caja')?.append(code);
  },
  { value: '', maxHeight: '28rem', lang: 'json' },
  'docs-json',
);

define('docs-json', DocsJson);
export { DocsJson };
