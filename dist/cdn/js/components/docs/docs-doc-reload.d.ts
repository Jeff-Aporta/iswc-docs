/**
 * <docs-doc-reload> — actualiza el documento desde la API (invalida cache 24 h).
 *
 * Solo icono. Emite `docs-doc-reload`; `docs-app` / `docs-minidoc` escuchan y
 * vuelven a `loadViewerDocument({ force: true })`.
 */
declare const DocsDocReload: CustomElementConstructor;
export { DocsDocReload };
