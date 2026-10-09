/**
 * <docs-json> — bloque de código via `<iswc-code>` (kit is-webcomponents).
 *
 * Sin botón de copiar propio: quien embebe (p. ej. `docs-minidoc-code`) pone el
 * `iswc-copy-button` en la cabecera del panel. Así no quedan dos copys.
 *
 * `lang` tipico: `json` (respuestas / body) o `shell`/`curl` (petición cURL).
 */
declare const DocsJson: CustomElementConstructor;
export { DocsJson };
