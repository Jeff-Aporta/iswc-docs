/**
 * <docs-minidoc> — segundo driver del visor: una operación por vista, no acordeones.
 *
 * Es una alternativa completa a `docs-app`, no un modo suyo. Los dos leen el mismo documento con
 * el mismo dominio (`js/config`, `js/openapi`, `js/nav`), pero lo presentan distinto:
 *
 *   - `docs-app`     lista por tags y despliega la operación en su sitio. Bueno para barrer una
 *                  API entera y comparar endpoints vecinos.
 *   - `docs-minidoc` índice a la izquierda, la operación elegida ocupando la página, y la
 *                  petición y la respuesta fijas a la derecha. Bueno para integrar un endpoint
 *                  concreto sin perderlo de vista mientras se escribe el código.
 *
 * No entran en conflicto: son dos custom elements distintos, cada uno con su shadow y su hoja,
 * y ninguno registra el tag del otro. Una página monta el que quiera; montar los dos a la vez
 * funciona, solo que se duplicaría la carga del documento.
 *
 * El estado vive aquí, igual que en `docs-app`: la operación abierta se refleja en `?s=.op` para que
 * un enlace lleve a la página exacta que alguien quiere enseñar.
 */
import type { DocsConn } from '../../js/conn.js';
import './docs-method.js';
import './docs-auth.js';
import './docs-layout.js';
import './docs-driver-switch.js';
import './docs-doc-actions.js';
import './docs-minidoc-view.js';
import './docs-minidoc-code.js';
import './docs-home.js';
declare class DocsMinidoc extends HTMLElement {
    #private;
    constructor();
    get doc(): unknown;
    set doc(v: unknown);
    get conn(): DocsConn | null;
    set conn(v: DocsConn | null);
    connectedCallback(): void;
    disconnectedCallback(): void;
}
export { DocsMinidoc };
