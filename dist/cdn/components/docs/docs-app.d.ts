/**
 * <docs-app> — shell del visor. Es el único dueño del estado.
 *
 * Todo lo demás (`docs-nav`, `docs-tag-group`, `docs-operation`, `docs-try`) es
 * controlado: recibe `props` y emite eventos. Concentrar el estado aquí es lo
 * que permite que la URL y la vista no puedan desincronizarse — hay una sola
 * escritura de `?tab/op/opt/server` y una sola lectura al arrancar.
 *
 * Ciclo: leer config → cargar spec → agrupar → pintar. Un fallo en cualquiera
 * de los pasos se enseña en pantalla con la URL que falló, no en la consola.
 */
import type { DocsConn } from '../../js/conn.js';
import './docs-nav.js';
import './docs-info.js';
import './docs-server.js';
import './docs-tag-group.js';
declare class DocsApp extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    get doc(): unknown;
    set doc(v: unknown);
    get conn(): DocsConn | null;
    set conn(v: DocsConn | null);
}
export { DocsApp };
