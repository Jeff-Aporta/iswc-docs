/**
 * <docs-home> — portada del visor: título, versión y `info.description` completa.
 *
 * La descripción viene en Markdown (con HTML embebido vía `iswc-md-render` en `docs-doc`).
 * Es la misma fuente que OpenAPI `info.description`; el JSON doc del ISS la define.
 */
import './docs-doc.js';
declare const DocsHome: CustomElementConstructor;
export { DocsHome };
