/**
 * <sw-home> — portada del visor: título, versión y `info.description` completa.
 *
 * La descripción viene en Markdown (con HTML embebido vía `iswc-md-render` en `sw-doc`).
 * Es la misma fuente que OpenAPI `info.description`; el JSON doc del ISS la define.
 */
import './sw-doc.js';
declare const SwHome: CustomElementConstructor;
export { SwHome };
