/**
 * <sw-json> — bloque de código via `<iswc-code>` (kit is-webcomponents).
 *
 * Sin botón de copiar propio: quien embebe (p. ej. `sw-minidoc-code`) pone el
 * `iswc-copy-button` en la cabecera del panel. Así no quedan dos copys.
 *
 * `lang` tipico: `json` (respuestas / body) o `shell`/`curl` (petición cURL).
 */
declare const SwJson: CustomElementConstructor;
export { SwJson };
